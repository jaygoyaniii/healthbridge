import crypto from 'crypto';
import User from '../models/User.js';
import Doctor from '../models/Doctor.js';
import {
  generateAccessToken,
  generateRefreshToken,
  verifyRefreshToken,
  setRefreshCookie,
  clearRefreshCookie,
} from '../utils/generateToken.js';
import { sendWelcomeEmail, sendPasswordResetEmail } from '../utils/sendEmail.js';
import { notifyAdmins } from '../utils/notifyAdmins.js';

/**
 * POST /api/auth/register
 * Register a new patient or doctor
 */
export const register = async (req, res) => {
  try {
    const { name, email, password, role, phone, gender, dateOfBirth } = req.body;

    // Check if user exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        errorCode: 'EMAIL_EXISTS',
        message: 'An account with this email already exists',
      });
    }

    // Validate role
    const allowedRoles = ['patient', 'doctor'];
    const userRole = allowedRoles.includes(role) ? role : 'patient';

    // Clean name for doctor role
    let cleanName = name;
    if (userRole === 'doctor' && name) {
      cleanName = name.replace(/^(dr\.\s*|dr\s+)/i, '');
    }

    // Create user
    const user = await User.create({
      name: cleanName,
      email,
      password,
      role: userRole,
      phone,
      gender,
      dateOfBirth,
    });

    // If registering as doctor, create doctor profile
    let doctorProfile = null;
    if (userRole === 'doctor') {
      const {
        specialization, experience, fees, bio, city,
        clinicName, clinicAddress, languages, consultationType, qualifications,
      } = req.body;

      doctorProfile = await Doctor.create({
        userId: user._id,
        specialization,
        experience: experience || 0,
        fees: fees || 0,
        bio,
        city: city || '',
        clinicName,
        clinicAddress,
        languages: languages || [],
        consultationType: consultationType || ['in-person'],
        qualifications: qualifications || [],
      });

      if (doctorProfile) {
        doctorProfile = await Doctor.findById(doctorProfile._id)
          .populate('specialization', 'name')
          .lean();
      }
    }

    // Generate tokens
    const accessToken = generateAccessToken(user._id);
    const refreshToken = generateRefreshToken(user._id);

    // Save refresh token to DB
    user.refreshToken = refreshToken;
    await user.save({ validateBeforeSave: false });

    // Set refresh token cookie
    setRefreshCookie(res, refreshToken);

    // Send welcome email (non-blocking)
    sendWelcomeEmail(user).catch(() => {});

    // Notify admins
    if (userRole === 'doctor') {
      notifyAdmins({
        title: 'New Doctor Registration',
        message: `Dr. ${cleanName} has registered and is pending approval.`,
        type: 'doctor',
        priority: 'high',
        relatedId: user._id,
        relatedModel: 'User',
      });
    } else {
      notifyAdmins({
        title: 'New Patient Registration',
        message: `${cleanName} has joined the platform.`,
        type: 'patient',
        priority: 'low',
        relatedId: user._id,
        relatedModel: 'User',
      });
    }

    // Response user object (without password)
    const userResponse = user.toObject();
    delete userResponse.password;
    delete userResponse.refreshToken;
    if (userRole === 'doctor' && doctorProfile) {
      userResponse.doctorProfile = doctorProfile;
    }

    res.status(201).json({
      success: true,
      message: userRole === 'doctor'
        ? 'Registration successful! Your account is pending admin approval.'
        : 'Registration successful!',
      accessToken,
      user: userResponse,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Registration failed',
    });
  }
};

/**
 * POST /api/auth/login
 * Login with email and password
 */
export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide email and password',
      });
    }

    // Find user with password field
    const user = await User.findOne({ email }).select('+password');
    if (!user) {
      return res.status(401).json({
        success: false,
        errorCode: 'USER_NOT_FOUND',
        message: 'No account found with this email address.',
      });
    }

    // Check if account is active
    if (!user.isActive) {
      return res.status(403).json({
        success: false,
        errorCode: 'ACCOUNT_DISABLED',
        message: 'Your account has been disabled. Please contact support.',
      });
    }

    // Compare password
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        errorCode: 'INVALID_PASSWORD',
        message: 'Incorrect password. Please try again.',
      });
    }

    // Generate tokens
    const accessToken = generateAccessToken(user._id);
    const refreshToken = generateRefreshToken(user._id);

    // Save refresh token and update lastSeen
    user.refreshToken = refreshToken;
    user.lastSeen = new Date();
    await user.save({ validateBeforeSave: false });

    // Set refresh token cookie
    setRefreshCookie(res, refreshToken);

    // Build user response
    const userResponse = user.toObject();
    delete userResponse.password;
    delete userResponse.refreshToken;

    // If doctor, attach doctor profile info
    if (user.role === 'doctor') {
      const doctorProfile = await Doctor.findOne({ userId: user._id })
        .populate('specialization', 'name')
        .lean();
      if (doctorProfile) {
        userResponse.doctorProfile = doctorProfile;
      }
    }

    res.json({
      success: true,
      message: 'Login successful',
      accessToken,
      user: userResponse,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Login failed',
    });
  }
};

/**
 * POST /api/auth/refresh
 * Refresh access token using refresh token cookie
 */
export const refreshAccessToken = async (req, res) => {
  try {
    const token = req.cookies?.refreshToken;

    if (!token) {
      return res.status(401).json({
        success: false,
        errorCode: 'NO_REFRESH_TOKEN',
        message: 'Your session has expired. Please sign in again.',
      });
    }

    // Verify refresh token
    const decoded = verifyRefreshToken(token);

    // Find user and check stored token matches
    const user = await User.findById(decoded.id).select('+refreshToken');
    if (!user || user.refreshToken !== token) {
      clearRefreshCookie(res);
      return res.status(401).json({
        success: false,
        errorCode: 'INVALID_TOKEN',
        message: 'Your session has expired. Please sign in again.',
      });
    }

    // Generate new tokens
    const newAccessToken = generateAccessToken(user._id);
    const newRefreshToken = generateRefreshToken(user._id);

    // Rotate refresh token
    user.refreshToken = newRefreshToken;
    await user.save({ validateBeforeSave: false });

    setRefreshCookie(res, newRefreshToken);

    res.json({
      success: true,
      accessToken: newAccessToken,
    });
  } catch (error) {
    clearRefreshCookie(res);
    res.status(401).json({
      success: false,
      errorCode: 'SESSION_EXPIRED',
      message: 'Your session has expired. Please sign in again.',
    });
  }
};

/**
 * POST /api/auth/logout
 * Invalidate refresh token
 */
export const logout = async (req, res) => {
  try {
    const token = req.cookies?.refreshToken;

    if (token) {
      // Clear refresh token from database
      try {
        const decoded = verifyRefreshToken(token);
        await User.findByIdAndUpdate(decoded.id, { refreshToken: null });
      } catch {
        // Token already invalid, just clear cookie
      }
    }

    clearRefreshCookie(res);

    res.json({
      success: true,
      message: 'Logged out successfully',
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Logout failed',
    });
  }
};

/**
 * GET /api/auth/me
 * Get current authenticated user
 */
export const getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).lean();

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    // If doctor, attach doctor profile
    if (user.role === 'doctor') {
      const doctorProfile = await Doctor.findOne({ userId: user._id })
        .populate('specialization', 'name')
        .lean();
      if (doctorProfile) {
        user.doctorProfile = doctorProfile;
      }
    }

    res.json({
      success: true,
      user,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch user',
    });
  }
};

/**
 * PUT /api/auth/change-password
 * Change password (authenticated)
 */
export const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        message: 'Current password and new password are required',
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'New password must be at least 6 characters',
      });
    }

    const user = await User.findById(req.user._id).select('+password');

    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) {
      return res.status(400).json({
        success: false,
        message: 'Current password is incorrect',
      });
    }

    user.password = newPassword;
    await user.save();

    res.json({
      success: true,
      message: 'Password changed successfully',
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to change password',
    });
  }
};

/**
 * POST /api/auth/forgot-password
 * Send password reset link via email
 */
export const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Please provide your email address',
      });
    }

    const user = await User.findOne({ email });
    if (!user) {
      // Don't reveal if email exists or not
      return res.json({
        success: true,
        message: 'If an account with that email exists, a reset link has been sent.',
      });
    }

    // Generate reset token
    const resetToken = user.createPasswordResetToken();
    await user.save({ validateBeforeSave: false });

    // Build reset URL
    const resetUrl = `${process.env.CLIENT_URL}/reset-password/${resetToken}`;

    // Send email
    await sendPasswordResetEmail(user, resetUrl);

    res.json({
      success: true,
      message: 'If an account with that email exists, a reset link has been sent.',
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to send reset email. Please try again later.',
    });
  }
};

/**
 * POST /api/auth/reset-password/:token
 * Reset password using the token from email
 */
export const resetPassword = async (req, res) => {
  try {
    const { token } = req.params;
    const { password } = req.body;

    if (!password || password.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 6 characters',
      });
    }

    // Hash the token to compare with stored hash
    const hashedToken = crypto
      .createHash('sha256')
      .update(token)
      .digest('hex');

    const user = await User.findOne({
      passwordResetToken: hashedToken,
      passwordResetExpires: { $gt: Date.now() },
    }).select('+passwordResetToken +passwordResetExpires');

    if (!user) {
      return res.status(400).json({
        success: false,
        message: 'Invalid or expired reset token',
      });
    }

    // Set new password
    user.password = password;
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save();

    res.json({
      success: true,
      message: 'Password reset successful. You can now log in.',
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to reset password',
    });
  }
};

/**
 * POST /api/auth/verify-email/:token
 * Verify email address (placeholder)
 */
export const verifyEmail = async (req, res) => {
  res.json({
    success: true,
    message: 'Email verification — will be implemented with email verification tokens.',
  });
};

/**
 * PUT /api/auth/profile
 * Update user profile (authenticated)
 */
export const updateProfile = async (req, res) => {
  try {
    const { name, phone, gender, dateOfBirth, address, healthProfile, avatar } = req.body;
    
    const updateFields = {};
    if (name !== undefined) {
      updateFields.name = req.user.role === 'doctor' ? name.replace(/^(dr\.\s*|dr\s+)/i, '') : name;
    }
    if (phone !== undefined) updateFields.phone = phone;
    if (gender !== undefined) updateFields.gender = gender;
    if (dateOfBirth !== undefined) updateFields.dateOfBirth = dateOfBirth;
    if (address !== undefined) updateFields.address = address;
    if (healthProfile !== undefined) updateFields.healthProfile = healthProfile;
    if (avatar !== undefined) updateFields.avatar = avatar;

    const user = await User.findByIdAndUpdate(
      req.user._id,
      { $set: updateFields },
      { new: true, runValidators: true }
    ).select('-password -refreshToken');

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const userObj = user.toObject();
    if (user.role === 'doctor') {
      const doctorProfile = await Doctor.findOne({ userId: user._id })
        .populate('specialization', 'name')
        .lean();
      if (doctorProfile) {
        userObj.doctorProfile = doctorProfile;
      }
    }

    res.json({
      success: true,
      message: 'Profile updated successfully',
      user: userObj
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message || 'Failed to update profile' });
  }
};


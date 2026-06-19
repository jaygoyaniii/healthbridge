import nodemailer from 'nodemailer';

const createTransporter = () => {
  return nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: parseInt(process.env.EMAIL_PORT, 10) || 587,
    secure: false,
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });
};

/**
 * Send an email using Nodemailer
 * @param {Object} options - { to, subject, html, text }
 */
const sendEmail = async ({ to, subject, html, text }) => {
  try {
    const transporter = createTransporter();

    const info = await transporter.sendMail({
      from: process.env.EMAIL_FROM || 'HealthBridge <noreply@healthbridge.com>',
      to,
      subject,
      html,
      text: text || subject,
    });

    console.log(`📧 Email sent: ${info.messageId}`);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error(`❌ Email send failed: ${error.message}`);
    return { success: false, error: error.message };
  }
};

/* ─── Email Templates ─── */

export const sendWelcomeEmail = async (user) => {
  const html = `
    <div style="font-family: 'Inter', Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #ffffff;">
      <div style="background: linear-gradient(135deg, #0C1B33, #1A3C8B); padding: 32px; text-align: center;">
        <h1 style="color: #ffffff; font-size: 24px; margin: 0;">Welcome to HealthBridge</h1>
      </div>
      <div style="padding: 32px;">
        <p style="color: #374151; font-size: 15px; line-height: 1.6;">Hi ${user.name},</p>
        <p style="color: #374151; font-size: 15px; line-height: 1.6;">
          Welcome to HealthBridge! Your account has been created successfully as a <strong>${user.role}</strong>.
        </p>
        ${user.role === 'doctor' ? '<p style="color: #D97706; font-size: 14px; padding: 12px; background: #FEF3C7; border-radius: 8px;">Your account is pending admin approval. You will be notified once approved.</p>' : ''}
        <a href="${process.env.CLIENT_URL}/login" style="display: inline-block; background: #1A3C8B; color: #ffffff; padding: 12px 32px; border-radius: 8px; text-decoration: none; font-weight: 600; margin-top: 16px;">Get Started</a>
      </div>
      <div style="padding: 16px 32px; background: #F6F9FF; text-align: center; border-top: 1px solid #E5EAF2;">
        <p style="color: #6B7280; font-size: 12px; margin: 0;">HealthBridge — Connecting Patients with Doctors</p>
      </div>
    </div>
  `;
  return sendEmail({ to: user.email, subject: 'Welcome to HealthBridge!', html });
};

export const sendPasswordResetEmail = async (user, resetUrl) => {
  const html = `
    <div style="font-family: 'Inter', Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #ffffff;">
      <div style="background: linear-gradient(135deg, #0C1B33, #1A3C8B); padding: 32px; text-align: center;">
        <h1 style="color: #ffffff; font-size: 24px; margin: 0;">Reset Your Password</h1>
      </div>
      <div style="padding: 32px;">
        <p style="color: #374151; font-size: 15px; line-height: 1.6;">Hi ${user.name},</p>
        <p style="color: #374151; font-size: 15px; line-height: 1.6;">
          You requested a password reset. Click the button below to set a new password. This link expires in 30 minutes.
        </p>
        <a href="${resetUrl}" style="display: inline-block; background: #1A3C8B; color: #ffffff; padding: 12px 32px; border-radius: 8px; text-decoration: none; font-weight: 600; margin-top: 16px;">Reset Password</a>
        <p style="color: #6B7280; font-size: 13px; margin-top: 24px;">If you didn't request this, please ignore this email.</p>
      </div>
      <div style="padding: 16px 32px; background: #F6F9FF; text-align: center; border-top: 1px solid #E5EAF2;">
        <p style="color: #6B7280; font-size: 12px; margin: 0;">HealthBridge — Connecting Patients with Doctors</p>
      </div>
    </div>
  `;
  return sendEmail({ to: user.email, subject: 'HealthBridge — Reset Your Password', html });
};

export const sendAppointmentConfirmation = async (patient, doctor, appointment) => {
  const html = `
    <div style="font-family: 'Inter', Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #ffffff;">
      <div style="background: linear-gradient(135deg, #0C1B33, #1A3C8B); padding: 32px; text-align: center;">
        <h1 style="color: #ffffff; font-size: 24px; margin: 0;">Appointment Confirmed</h1>
      </div>
      <div style="padding: 32px;">
        <p style="color: #374151; font-size: 15px; line-height: 1.6;">Hi ${patient.name},</p>
        <p style="color: #374151; font-size: 15px; line-height: 1.6;">Your appointment has been confirmed:</p>
        <div style="background: #F6F9FF; padding: 16px; border-radius: 8px; margin: 16px 0;">
          <p style="margin: 4px 0; color: #0C1B33;"><strong>Doctor:</strong> Dr. ${doctor.name}</p>
          <p style="margin: 4px 0; color: #0C1B33;"><strong>Date:</strong> ${new Date(appointment.date).toLocaleDateString()}</p>
          <p style="margin: 4px 0; color: #0C1B33;"><strong>Time:</strong> ${appointment.slotTime}</p>
          <p style="margin: 4px 0; color: #0C1B33;"><strong>Type:</strong> ${appointment.type}</p>
        </div>
      </div>
      <div style="padding: 16px 32px; background: #F6F9FF; text-align: center; border-top: 1px solid #E5EAF2;">
        <p style="color: #6B7280; font-size: 12px; margin: 0;">HealthBridge — Connecting Patients with Doctors</p>
      </div>
    </div>
  `;
  return sendEmail({ to: patient.email, subject: 'HealthBridge — Appointment Confirmed', html });
};

export const sendDoctorApprovalEmail = async (user, approved, reason) => {
  const statusText = approved ? 'Approved' : 'Rejected';
  const statusColor = approved ? '#059669' : '#DC2626';
  const html = `
    <div style="font-family: 'Inter', Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #ffffff;">
      <div style="background: linear-gradient(135deg, #0C1B33, #1A3C8B); padding: 32px; text-align: center;">
        <h1 style="color: #ffffff; font-size: 24px; margin: 0;">Account ${statusText}</h1>
      </div>
      <div style="padding: 32px;">
        <p style="color: #374151; font-size: 15px; line-height: 1.6;">Hi Dr. ${user.name},</p>
        <p style="color: ${statusColor}; font-size: 16px; font-weight: 600;">Your account has been ${statusText.toLowerCase()}.</p>
        ${!approved && reason ? `<p style="color: #374151; font-size: 14px; padding: 12px; background: #FEE2E2; border-radius: 8px;"><strong>Reason:</strong> ${reason}</p>` : ''}
        ${approved ? '<a href="' + process.env.CLIENT_URL + '/login" style="display: inline-block; background: #1A3C8B; color: #ffffff; padding: 12px 32px; border-radius: 8px; text-decoration: none; font-weight: 600; margin-top: 16px;">Start Accepting Patients</a>' : ''}
      </div>
      <div style="padding: 16px 32px; background: #F6F9FF; text-align: center; border-top: 1px solid #E5EAF2;">
        <p style="color: #6B7280; font-size: 12px; margin: 0;">HealthBridge — Connecting Patients with Doctors</p>
      </div>
    </div>
  `;
  return sendEmail({ to: user.email, subject: `HealthBridge — Account ${statusText}`, html });
};

export default sendEmail;

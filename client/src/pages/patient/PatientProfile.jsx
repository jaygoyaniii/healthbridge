import { useState, useContext, useEffect } from 'react';
import { 
  User, Mail, Phone, MapPin, Shield, Key, Activity, 
  Heart, Camera, AlertCircle, CheckCircle, Save
} from 'lucide-react';
import toast from 'react-hot-toast';
import Avatar from '../../components/common/Avatar';
import { AuthContext } from '../../context/AuthContext';
import PageTransition from '../../components/common/PageTransition';
import authService from '../../services/authService';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';

const TABS = [
  { id: 'personal', label: 'Personal Information', icon: User },
  { id: 'medical', label: 'Medical Profile', icon: Activity },
  { id: 'security', label: 'Security & Password', icon: Shield },
];

const PatientProfile = () => {
  const { user, updateUser } = useContext(AuthContext);
  const [activeTab, setActiveTab] = useState('personal');
  const [isSaving, setIsSaving] = useState(false);
  
  // Local state for forms
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    gender: '',
    dateOfBirth: '',
    address: { street: '', city: '', state: '', pincode: '' },
    healthProfile: {
      bloodGroup: '',
      height: '',
      weight: '',
      allergies: '',
      currentMedications: '',
      chronicConditions: '',
      emergencyContact: { name: '', phone: '', relation: '' }
    }
  });

  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  // Populate local state on mount
  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name || '',
        phone: user.phone || '',
        gender: user.gender || '',
        dateOfBirth: user.dateOfBirth ? new Date(user.dateOfBirth).toISOString().split('T')[0] : '',
        address: {
          street: user.address?.street || '',
          city: user.address?.city || '',
          state: user.address?.state || '',
          pincode: user.address?.pincode || ''
        },
        healthProfile: {
          bloodGroup: user.healthProfile?.bloodGroup || '',
          height: user.healthProfile?.height || '',
          weight: user.healthProfile?.weight || '',
          allergies: user.healthProfile?.allergies?.join(', ') || '',
          currentMedications: user.healthProfile?.currentMedications?.join(', ') || '',
          chronicConditions: user.healthProfile?.chronicConditions?.join(', ') || '',
          emergencyContact: {
            name: user.healthProfile?.emergencyContact?.name || '',
            phone: user.healthProfile?.emergencyContact?.phone || '',
            relation: user.healthProfile?.emergencyContact?.relation || ''
          }
        }
      });
    }
  }, [user]);

  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    
    try {
      // Parse comma separated strings back to arrays
      const payload = {
        ...formData,
        healthProfile: {
          ...formData.healthProfile,
          allergies: formData.healthProfile.allergies ? formData.healthProfile.allergies.split(',').map(s => s.trim()).filter(Boolean) : [],
          currentMedications: formData.healthProfile.currentMedications ? formData.healthProfile.currentMedications.split(',').map(s => s.trim()).filter(Boolean) : [],
          chronicConditions: formData.healthProfile.chronicConditions ? formData.healthProfile.chronicConditions.split(',').map(s => s.trim()).filter(Boolean) : [],
        }
      };

      const res = await authService.updateProfile(payload);
      updateUser(res.data.user);
      toast.success('Profile updated successfully');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to update profile');
    } finally {
      setIsSaving(false);
    }
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      return toast.error('New passwords do not match');
    }
    
    setIsSaving(true);
    try {
      await authService.changePassword({
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword
      });
      toast.success('Password changed successfully');
      setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to change password');
    } finally {
      setIsSaving(false);
    }
  };

  // Profile Completion logic
  const calculateCompletion = () => {
    let completed = 0;
    let total = 6; // Name, Phone, Gender, DOB, Address, Emergency Contact
    if (user?.name) completed++;
    if (user?.phone) completed++;
    if (user?.gender) completed++;
    if (user?.dateOfBirth) completed++;
    if (user?.address?.city) completed++;
    if (user?.healthProfile?.emergencyContact?.name) completed++;
    return Math.round((completed / total) * 100);
  };

  const completionRate = calculateCompletion();

  return (
    <PageTransition className="max-w-6xl mx-auto space-y-6">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-8">
        <div>
          <h1 className="text-3xl font-heading font-black text-heading mb-2">Profile Settings</h1>
          <p className="text-muted">Manage your personal information, medical profile, and security preferences.</p>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-8">
        
        {/* Left Sidebar Menu */}
        <div className="w-full lg:w-72 shrink-0 space-y-6">
          {/* Quick Profile Summary */}
          <div className="bg-white rounded-2xl p-6 border border-border shadow-sm text-center relative overflow-hidden">
            <div className="w-24 h-24 mx-auto relative group cursor-pointer shadow-md rounded-full">
              <Avatar
                src={user?.avatar?.url || user?.avatar}
                name={user?.name}
                role="patient"
                size="2xl"
                className="border-4 border-white shadow-sm w-full h-full"
              />
              <div className="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                <Camera className="w-6 h-6 text-white" />
              </div>
            </div>
            <h2 className="text-lg font-bold text-heading">{user?.name}</h2>
            <p className="text-sm text-muted">{user?.email}</p>
            <div className="mt-4 inline-flex items-center text-xs font-semibold px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-100">
              <CheckCircle className="w-3.5 h-3.5 mr-1.5" /> Patient Account
            </div>

            {/* Completion Bar */}
            <div className="mt-6 text-left">
              <div className="flex justify-between text-xs font-semibold text-slate-500 mb-1.5">
                <span>Profile Completion</span>
                <span className={completionRate === 100 ? 'text-emerald-500' : 'text-blue-500'}>{completionRate}%</span>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-2">
                <div 
                  className={`h-2 rounded-full transition-all duration-500 ${completionRate === 100 ? 'bg-emerald-400' : 'bg-blue-400'}`} 
                  style={{ width: `${completionRate}%` }}
                ></div>
              </div>
            </div>
          </div>

          {/* Navigation Links */}
          <div className="bg-white rounded-2xl p-3 border border-border shadow-sm">
            {TABS.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`w-full flex items-center p-3 rounded-xl text-sm font-semibold transition-colors ${
                    activeTab === tab.id 
                    ? 'bg-primary/10 text-primary' 
                    : 'text-slate-600 hover:bg-slate-50 hover:text-heading'
                  }`}
                >
                  <Icon className={`w-5 h-5 mr-3 ${activeTab === tab.id ? 'text-primary' : 'text-slate-400'}`} />
                  {tab.label}
                </button>
              )
            })}
          </div>
        </div>

        {/* Main Content Area */}
        <div className="flex-1 min-w-0">
          
          {/* PERSONAL TAB */}
          {activeTab === 'personal' && (
            <div className="bg-white rounded-2xl border border-border shadow-sm animate-in fade-in slide-in-from-bottom-4">
              <div className="p-6 border-b border-border">
                <h3 className="text-xl font-bold text-heading">Personal Information</h3>
                <p className="text-sm text-muted mt-1">Update your basic details and contact information.</p>
              </div>
              <div className="p-6">
                <form onSubmit={handleProfileSubmit} className="space-y-6">
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    <div>
                      <label className="block text-sm font-semibold text-heading mb-1.5">Full Name</label>
                      <input 
                        type="text" 
                        required
                        className="input-base w-full bg-slate-50 focus:bg-white"
                        value={formData.name}
                        onChange={e => setFormData({ ...formData, name: e.target.value })}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-heading mb-1.5">Email Address</label>
                      <input 
                        type="email" 
                        disabled
                        className="input-base w-full bg-slate-100 text-slate-500 cursor-not-allowed"
                        value={user?.email || ''}
                      />
                      <p className="text-xs text-muted mt-1">Email cannot be changed.</p>
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-heading mb-1.5">Phone Number</label>
                      <input 
                        type="tel" 
                        className="input-base w-full bg-slate-50 focus:bg-white"
                        value={formData.phone}
                        onChange={e => setFormData({ ...formData, phone: e.target.value })}
                        placeholder="+1 234 567 890"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-heading mb-1.5">Date of Birth</label>
                      <input 
                        type="date" 
                        className="input-base w-full bg-slate-50 focus:bg-white"
                        value={formData.dateOfBirth}
                        onChange={e => setFormData({ ...formData, dateOfBirth: e.target.value })}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-heading mb-1.5">Gender</label>
                      <select 
                        className="input-base w-full bg-slate-50 focus:bg-white appearance-none"
                        value={formData.gender}
                        onChange={e => setFormData({ ...formData, gender: e.target.value })}
                      >
                        <option value="">Select Gender</option>
                        <option value="male">Male</option>
                        <option value="female">Female</option>
                        <option value="other">Other</option>
                      </select>
                    </div>
                  </div>

                  <hr className="border-border my-6" />

                  <h4 className="text-base font-bold text-heading mb-4">Address Details</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    <div className="sm:col-span-2">
                      <label className="block text-sm font-semibold text-heading mb-1.5">Street Address</label>
                      <input 
                        type="text" 
                        className="input-base w-full bg-slate-50 focus:bg-white"
                        value={formData.address.street}
                        onChange={e => setFormData({ ...formData, address: { ...formData.address, street: e.target.value } })}
                        placeholder="House no., Street name"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-heading mb-1.5">City</label>
                      <input 
                        type="text" 
                        className="input-base w-full bg-slate-50 focus:bg-white"
                        value={formData.address.city}
                        onChange={e => setFormData({ ...formData, address: { ...formData.address, city: e.target.value } })}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-heading mb-1.5">State</label>
                      <input 
                        type="text" 
                        className="input-base w-full bg-slate-50 focus:bg-white"
                        value={formData.address.state}
                        onChange={e => setFormData({ ...formData, address: { ...formData.address, state: e.target.value } })}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-heading mb-1.5">Postal Code</label>
                      <input 
                        type="text" 
                        className="input-base w-full bg-slate-50 focus:bg-white"
                        value={formData.address.pincode}
                        onChange={e => setFormData({ ...formData, address: { ...formData.address, pincode: e.target.value } })}
                      />
                    </div>
                  </div>

                  <div className="flex justify-end pt-4">
                    <Button type="submit" variant="primary" disabled={isSaving} className="shadow-sm">
                      <Save className="w-4 h-4 mr-2" /> {isSaving ? 'Saving...' : 'Save Changes'}
                    </Button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* MEDICAL TAB */}
          {activeTab === 'medical' && (
            <div className="bg-white rounded-2xl border border-border shadow-sm animate-in fade-in slide-in-from-bottom-4">
              <div className="p-6 border-b border-border">
                <h3 className="text-xl font-bold text-heading">Medical Profile</h3>
                <p className="text-sm text-muted mt-1">This information helps doctors provide better care during consultations.</p>
              </div>
              <div className="p-6">
                <form onSubmit={handleProfileSubmit} className="space-y-6">
                  
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
                    <div>
                      <label className="block text-sm font-semibold text-heading mb-1.5">Blood Group</label>
                      <select 
                        className="input-base w-full bg-slate-50 focus:bg-white appearance-none"
                        value={formData.healthProfile.bloodGroup}
                        onChange={e => setFormData({ ...formData, healthProfile: { ...formData.healthProfile, bloodGroup: e.target.value } })}
                      >
                        <option value="">Select Type</option>
                        <option value="A+">A+</option>
                        <option value="A-">A-</option>
                        <option value="B+">B+</option>
                        <option value="B-">B-</option>
                        <option value="AB+">AB+</option>
                        <option value="AB-">AB-</option>
                        <option value="O+">O+</option>
                        <option value="O-">O-</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-heading mb-1.5">Height</label>
                      <input 
                        type="text" 
                        placeholder="e.g. 175 cm"
                        className="input-base w-full bg-slate-50 focus:bg-white"
                        value={formData.healthProfile.height}
                        onChange={e => setFormData({ ...formData, healthProfile: { ...formData.healthProfile, height: e.target.value } })}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-heading mb-1.5">Weight</label>
                      <input 
                        type="text" 
                        placeholder="e.g. 70 kg"
                        className="input-base w-full bg-slate-50 focus:bg-white"
                        value={formData.healthProfile.weight}
                        onChange={e => setFormData({ ...formData, healthProfile: { ...formData.healthProfile, weight: e.target.value } })}
                      />
                    </div>
                  </div>

                  <div className="space-y-5">
                    <div>
                      <label className="block text-sm font-semibold text-heading mb-1.5">Known Allergies</label>
                      <input 
                        type="text" 
                        placeholder="Peanuts, Penicillin (comma separated)"
                        className="input-base w-full bg-slate-50 focus:bg-white"
                        value={formData.healthProfile.allergies}
                        onChange={e => setFormData({ ...formData, healthProfile: { ...formData.healthProfile, allergies: e.target.value } })}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-heading mb-1.5">Current Medications</label>
                      <input 
                        type="text" 
                        placeholder="Lisinopril, Metformin (comma separated)"
                        className="input-base w-full bg-slate-50 focus:bg-white"
                        value={formData.healthProfile.currentMedications}
                        onChange={e => setFormData({ ...formData, healthProfile: { ...formData.healthProfile, currentMedications: e.target.value } })}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-heading mb-1.5">Chronic Conditions</label>
                      <input 
                        type="text" 
                        placeholder="Asthma, Diabetes (comma separated)"
                        className="input-base w-full bg-slate-50 focus:bg-white"
                        value={formData.healthProfile.chronicConditions}
                        onChange={e => setFormData({ ...formData, healthProfile: { ...formData.healthProfile, chronicConditions: e.target.value } })}
                      />
                    </div>
                  </div>

                  <hr className="border-border my-6" />

                  <h4 className="text-base font-bold text-heading flex items-center mb-4">
                    <Heart className="w-4 h-4 mr-2 text-rose-500" /> Emergency Contact
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
                    <div>
                      <label className="block text-sm font-semibold text-heading mb-1.5">Contact Name</label>
                      <input 
                        type="text" 
                        className="input-base w-full bg-slate-50 focus:bg-white"
                        value={formData.healthProfile.emergencyContact.name}
                        onChange={e => setFormData({ ...formData, healthProfile: { ...formData.healthProfile, emergencyContact: { ...formData.healthProfile.emergencyContact, name: e.target.value } } })}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-heading mb-1.5">Relationship</label>
                      <input 
                        type="text" 
                        placeholder="Spouse, Parent, etc."
                        className="input-base w-full bg-slate-50 focus:bg-white"
                        value={formData.healthProfile.emergencyContact.relation}
                        onChange={e => setFormData({ ...formData, healthProfile: { ...formData.healthProfile, emergencyContact: { ...formData.healthProfile.emergencyContact, relation: e.target.value } } })}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-heading mb-1.5">Phone Number</label>
                      <input 
                        type="tel" 
                        className="input-base w-full bg-slate-50 focus:bg-white"
                        value={formData.healthProfile.emergencyContact.phone}
                        onChange={e => setFormData({ ...formData, healthProfile: { ...formData.healthProfile, emergencyContact: { ...formData.healthProfile.emergencyContact, phone: e.target.value } } })}
                      />
                    </div>
                  </div>

                  <div className="flex justify-end pt-4">
                    <Button type="submit" variant="primary" disabled={isSaving} className="shadow-sm">
                      <Save className="w-4 h-4 mr-2" /> {isSaving ? 'Saving...' : 'Save Health Profile'}
                    </Button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* SECURITY TAB */}
          {activeTab === 'security' && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4">
              
              <div className="bg-white rounded-2xl border border-border shadow-sm">
                <div className="p-6 border-b border-border">
                  <h3 className="text-xl font-bold text-heading">Change Password</h3>
                  <p className="text-sm text-muted mt-1">Ensure your account is using a long, random password to stay secure.</p>
                </div>
                <div className="p-6">
                  <form onSubmit={handlePasswordSubmit} className="space-y-5">
                    <div>
                      <label className="block text-sm font-semibold text-heading mb-1.5">Current Password</label>
                      <input 
                        type="password" 
                        required
                        className="input-base w-full md:w-2/3 lg:w-1/2 bg-slate-50 focus:bg-white"
                        value={passwordData.currentPassword}
                        onChange={e => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-heading mb-1.5">New Password</label>
                      <input 
                        type="password" 
                        required
                        minLength={6}
                        className="input-base w-full md:w-2/3 lg:w-1/2 bg-slate-50 focus:bg-white"
                        value={passwordData.newPassword}
                        onChange={e => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-heading mb-1.5">Confirm New Password</label>
                      <input 
                        type="password" 
                        required
                        minLength={6}
                        className="input-base w-full md:w-2/3 lg:w-1/2 bg-slate-50 focus:bg-white"
                        value={passwordData.confirmPassword}
                        onChange={e => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                      />
                    </div>
                    <div className="pt-2">
                      <Button type="submit" variant="primary" disabled={isSaving} className="shadow-sm">
                        <Key className="w-4 h-4 mr-2" /> {isSaving ? 'Updating...' : 'Update Password'}
                      </Button>
                    </div>
                  </form>
                </div>
              </div>

              {/* Danger Zone Placeholder (for visual completeness) */}
              <div className="bg-red-50 rounded-2xl border border-red-100 p-6">
                <h3 className="text-lg font-bold text-red-700 flex items-center mb-2">
                  <AlertCircle className="w-5 h-5 mr-2" /> Danger Zone
                </h3>
                <p className="text-sm text-red-600 mb-4">
                  Deactivating your account will disable your access and remove your data from public searches.
                </p>
                <Button variant="outline" className="bg-white border-red-200 text-red-600 hover:bg-red-600 hover:text-white">
                  Deactivate Account
                </Button>
              </div>

            </div>
          )}

        </div>
      </div>
    </PageTransition>
  );
};

export default PatientProfile;

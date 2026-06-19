import { useState, useEffect, useContext, useMemo } from 'react';
import {
  User, Mail, Phone, MapPin, Building, Stethoscope,
  Award, GraduationCap, Languages, DollarSign, Clock,
  Camera, ShieldCheck, AlertCircle, CheckCircle2, ChevronRight,
  Save, X, Plus, Trash2, Edit2, Shield, Bell, Lock
} from 'lucide-react';
import toast from 'react-hot-toast';

import PageTransition from '../../components/common/PageTransition';
import { AuthContext } from '../../context/AuthContext';
import doctorService from '../../services/doctorService';
import authService from '../../services/authService';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import Input from '../../components/ui/Input';
import { calculateDoctorProfileCompleteness } from '../../utils/profileUtils';
import Avatar from '../../components/common/Avatar';

const DoctorProfile = () => {
  const { user, updateUser } = useContext(AuthContext);
  const doctorId = user?.doctorProfile?._id || user?.doctorId;

  const [activeTab, setActiveTab] = useState('personal');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Form States
  const [personalData, setPersonalData] = useState({
    name: '',
    email: '',
    phone: '',
  });

  const [doctorData, setDoctorData] = useState({
    experience: '',
    fees: '',
    bio: '',
    clinicName: '',
    clinicAddress: '',
    city: '',
    consultationType: [],
    languages: [],
    qualifications: []
  });

  // Derived variables
  const profileCompleteness = useMemo(() => {
    return calculateDoctorProfileCompleteness(personalData, doctorData);
  }, [personalData, doctorData]);

  useEffect(() => {
    fetchProfileData();
  }, [doctorId, user]);

  const fetchProfileData = async () => {
    if (!doctorId) return;
    setLoading(true);
    try {
      // Sync personal user data
      setPersonalData({
        name: user.name || '',
        email: user.email || '',
        phone: user.phone || '',
      });

      // Sync doctor professional data
      const res = await doctorService.getDoctorById(doctorId);
      const doc = res.data.doctor;

      setDoctorData({
        experience: doc.experience || '',
        fees: doc.fees || '',
        bio: doc.bio || '',
        clinicName: doc.clinicName || '',
        clinicAddress: doc.clinicAddress || '',
        city: doc.city || '',
        consultationType: doc.consultationType || [],
        languages: doc.languages || [],
        qualifications: doc.qualifications || []
      });

    } catch (error) {
      toast.error('Failed to load profile data');
    } finally {
      setLoading(false);
    }
  };

  const handlePersonalSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await authService.updateProfile({ name: personalData.name, phone: personalData.phone });
      // Update local auth context
      updateUser(res.data.user);
      toast.success('Personal information updated');
    } catch (error) {
      toast.error('Failed to update personal info');
    } finally {
      setSaving(false);
    }
  };

  const handleProfessionalSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await doctorService.updateDoctor(doctorId, doctorData);
      updateUser({ doctorProfile: res.data.doctor });
      toast.success('Professional profile updated successfully');
    } catch (error) {
      toast.error('Failed to update professional profile');
    } finally {
      setSaving(false);
    }
  };

  const handleArrayChange = (field, index, key, value) => {
    const updated = [...doctorData[field]];
    updated[index][key] = value;
    setDoctorData({ ...doctorData, [field]: updated });
  };

  const addArrayItem = (field, defaultItem) => {
    setDoctorData({ ...doctorData, [field]: [...doctorData[field], defaultItem] });
  };

  const removeArrayItem = (field, index) => {
    const updated = doctorData[field].filter((_, i) => i !== index);
    setDoctorData({ ...doctorData, [field]: updated });
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-[60vh]">
        <span className="loader border-primary"></span>
      </div>
    );
  }

  return (
    <PageTransition className="max-w-6xl mx-auto space-y-6">

      {/* Header & Completion Banner */}
      <div className="flex flex-col md:flex-row gap-6">
        {/* Profile Snapshot Card */}
        <div className="bg-white rounded-2xl border border-border shadow-sm p-6 w-full md:w-1/3 shrink-0 flex flex-col items-center text-center">
          <div className="relative group cursor-pointer mb-4">
            <div className="w-28 h-28 relative rounded-full shadow-md flex items-center justify-center">
              <Avatar
                src={user?.avatar?.url}
                name={user?.name}
                role="doctor"
                className="w-full h-full border-4 border-white"
              />
              <div className="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                <Camera className="w-8 h-8 text-white" />
              </div>
            </div>
            {user?.doctorProfile?.isApproved && (
              <div className="absolute bottom-1 right-1 w-7 h-7 bg-blue-500 rounded-full border-2 border-white flex items-center justify-center" title="Verified Profile">
                <ShieldCheck className="w-4 h-4 text-white" />
              </div>
            )}
          </div>

          <h2 className="text-xl font-black text-heading">Dr. {personalData.name}</h2>
          <p className="text-sm font-semibold text-primary mt-1">{user?.doctorProfile?.specialization?.name || 'General Physician'}</p>
          <p className="text-xs text-slate-500 mt-0.5 max-w-[200px] truncate">{doctorData.clinicName || 'Independent Practitioner'}</p>

          <div className="w-full mt-6 pt-6 border-t border-border">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm font-bold text-slate-700">Profile Completion</span>
              <span className="text-sm font-black text-primary">{profileCompleteness}%</span>
            </div>
            <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-1000 ${profileCompleteness === 100 ? 'bg-emerald-500' : 'bg-primary'}`}
                style={{ width: `${profileCompleteness}%` }}
              ></div>
            </div>
            {profileCompleteness < 100 && (
              <p className="text-xs text-amber-600 font-medium mt-3 flex items-start gap-1 text-left">
                <AlertCircle className="w-4 h-4 shrink-0" />
                Complete your profile to appear higher in patient search results.
              </p>
            )}
          </div>
        </div>

        {/* Main Settings Area */}
        <div className="flex-1 flex flex-col min-w-0">

          {/* Custom Tab Navigation */}
          <div className="bg-white rounded-2xl border border-border shadow-sm p-2 flex overflow-x-auto custom-scrollbar mb-6">
            {[
              { id: 'personal', label: 'Personal Details', icon: User },
              { id: 'professional', label: 'Professional Info', icon: Stethoscope },
              { id: 'qualifications', label: 'Qualifications', icon: GraduationCap },
              { id: 'clinic', label: 'Clinic & Fees', icon: Building },
              { id: 'security', label: 'Security', icon: Shield },
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 py-2.5 px-5 rounded-xl font-semibold text-sm transition-all whitespace-nowrap ${activeTab === tab.id ? 'bg-primary/10 text-primary shadow-sm' : 'text-slate-500 hover:bg-slate-50'
                  }`}
              >
                <tab.icon className="w-4 h-4" /> {tab.label}
              </button>
            ))}
          </div>

          {/* TAB CONTENT */}
          <div className="bg-white rounded-2xl border border-border shadow-sm p-6 sm:p-8 animate-fade-in flex-1">

            {/* PERSONAL TAB */}
            {activeTab === 'personal' && (
              <form onSubmit={handlePersonalSave} className="space-y-6">
                <div>
                  <h3 className="text-lg font-black text-heading mb-1">Personal Details</h3>
                  <p className="text-sm text-slate-500 mb-6">Manage your basic account information.</p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-1.5">Full Name</label>
                    <Input
                      value={personalData.name}
                      onChange={e => setPersonalData({ ...personalData, name: e.target.value })}
                      icon={User}
                      placeholder="e.g. John Doe"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-1.5">Email Address</label>
                    <Input
                      value={personalData.email}
                      disabled
                      icon={Mail}
                      className="bg-slate-50 text-slate-500 cursor-not-allowed"
                    />
                    <p className="text-[10px] text-slate-400 mt-1">Email cannot be changed.</p>
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-1.5">Phone Number</label>
                    <Input
                      value={personalData.phone}
                      onChange={e => setPersonalData({ ...personalData, phone: e.target.value })}
                      icon={Phone}
                      placeholder="e.g. +1 234 567 8900"
                    />
                  </div>
                </div>

                <div className="pt-6 border-t border-border flex justify-end">
                  <Button type="submit" variant="primary" disabled={saving}>
                    {saving ? 'Saving...' : 'Save Changes'} <Save className="w-4 h-4 ml-2" />
                  </Button>
                </div>
              </form>
            )}

            {/* PROFESSIONAL TAB */}
            {activeTab === 'professional' && (
              <form onSubmit={handleProfessionalSave} className="space-y-6">
                <div>
                  <h3 className="text-lg font-black text-heading mb-1">Professional Profile</h3>
                  <p className="text-sm text-slate-500 mb-6">This information is publicly visible to patients booking appointments.</p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-1.5">Specialization</label>
                    <Input
                      value={user?.doctorProfile?.specialization?.name || 'General Physician'}
                      disabled
                      icon={Award}
                      className="bg-slate-50 text-slate-500 cursor-not-allowed"
                    />
                    <p className="text-[10px] text-slate-400 mt-1">Contact support to change specialization.</p>
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-1.5">Years of Experience</label>
                    <Input
                      type="number"
                      value={doctorData.experience}
                      onChange={e => setDoctorData({ ...doctorData, experience: Number(e.target.value) })}
                      icon={Clock}
                      min="0"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block text-sm font-bold text-slate-700 mb-1.5">Spoken Languages</label>
                    <Input
                      value={doctorData.languages.join(', ')}
                      onChange={e => setDoctorData({ ...doctorData, languages: e.target.value.split(',').map(l => l.trim()).filter(Boolean) })}
                      icon={Languages}
                      placeholder="English, Spanish, French (comma separated)"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block text-sm font-bold text-slate-700 mb-1.5">Professional Bio</label>
                    <textarea
                      value={doctorData.bio}
                      onChange={e => setDoctorData({ ...doctorData, bio: e.target.value })}
                      className="input-base w-full min-h-[120px] resize-y py-3"
                      placeholder="Write a brief professional summary about your expertise and treatment philosophy..."
                      maxLength={500}
                    />
                    <p className="text-xs text-slate-400 text-right mt-1">{doctorData.bio?.length || 0}/500</p>
                  </div>
                </div>

                <div className="pt-6 border-t border-border flex justify-end">
                  <Button type="submit" variant="primary" disabled={saving}>
                    {saving ? 'Saving...' : 'Save Professional Info'} <Save className="w-4 h-4 ml-2" />
                  </Button>
                </div>
              </form>
            )}

            {/* QUALIFICATIONS TAB */}
            {activeTab === 'qualifications' && (
              <div className="space-y-6">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="text-lg font-black text-heading mb-1">Academic Qualifications</h3>
                    <p className="text-sm text-slate-500 mb-6">List your medical degrees, fellowships, and certifications.</p>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => addArrayItem('qualifications', { degree: '', institution: '', year: new Date().getFullYear() })}
                  >
                    <Plus className="w-4 h-4 mr-2" /> Add Degree
                  </Button>
                </div>

                {doctorData.qualifications.length === 0 ? (
                  <div className="text-center py-10 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                    <GraduationCap className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                    <p className="text-slate-500 font-semibold mb-3">No qualifications added yet.</p>
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={() => addArrayItem('qualifications', { degree: '', institution: '', year: new Date().getFullYear() })}
                    >
                      <Plus className="w-4 h-4 mr-2" /> Add Your First Degree
                    </Button>
                  </div>
                ) : (
                  <form onSubmit={handleProfessionalSave} className="space-y-6">
                    <div className="space-y-4">
                      {doctorData.qualifications.map((qual, index) => (
                        <div key={index} className="flex gap-4 items-start bg-slate-50 p-4 rounded-xl border border-slate-200 relative group">
                          <button
                            type="button"
                            onClick={() => removeArrayItem('qualifications', index)}
                            className="absolute top-4 right-4 text-slate-400 hover:text-rose-500 transition-colors opacity-0 group-hover:opacity-100"
                            title="Remove Qualification"
                          >
                            <Trash2 className="w-5 h-5" />
                          </button>

                          <div className="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center shrink-0">
                            <GraduationCap className="w-5 h-5" />
                          </div>

                          <div className="flex-1 grid grid-cols-1 md:grid-cols-12 gap-4">
                            <div className="md:col-span-5">
                              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Degree/Certification</label>
                              <Input
                                value={qual.degree}
                                onChange={e => handleArrayChange('qualifications', index, 'degree', e.target.value)}
                                placeholder="e.g. MBBS, MD Cardiology"
                                required
                              />
                            </div>
                            <div className="md:col-span-5">
                              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Institution/University</label>
                              <Input
                                value={qual.institution}
                                onChange={e => handleArrayChange('qualifications', index, 'institution', e.target.value)}
                                placeholder="e.g. Harvard Medical School"
                                required
                              />
                            </div>
                            <div className="md:col-span-2">
                              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Grad Year</label>
                              <Input
                                type="number"
                                value={qual.year}
                                onChange={e => handleArrayChange('qualifications', index, 'year', Number(e.target.value))}
                                placeholder="YYYY"
                                required
                              />
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>

                    <div className="pt-6 border-t border-border flex justify-end">
                      <Button type="submit" variant="primary" disabled={saving}>
                        {saving ? 'Saving...' : 'Save Qualifications'} <Save className="w-4 h-4 ml-2" />
                      </Button>
                    </div>
                  </form>
                )}
              </div>
            )}

            {/* CLINIC & FEES TAB */}
            {activeTab === 'clinic' && (
              <form onSubmit={handleProfessionalSave} className="space-y-6">
                <div>
                  <h3 className="text-lg font-black text-heading mb-1">Clinic & Consultation Settings</h3>
                  <p className="text-sm text-slate-500 mb-6">Manage your primary practice location and billing.</p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div className="sm:col-span-2">
                    <label className="block text-sm font-bold text-slate-700 mb-1.5">Clinic/Hospital Name</label>
                    <Input
                      value={doctorData.clinicName}
                      onChange={e => setDoctorData({ ...doctorData, clinicName: e.target.value })}
                      icon={Building}
                      placeholder="e.g. City General Hospital"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block text-sm font-bold text-slate-700 mb-1.5">Clinic Address</label>
                    <Input
                      value={doctorData.clinicAddress}
                      onChange={e => setDoctorData({ ...doctorData, clinicAddress: e.target.value })}
                      icon={MapPin}
                      placeholder="Street address, block, etc."
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-1.5">City</label>
                    <Input
                      value={doctorData.city}
                      onChange={e => setDoctorData({ ...doctorData, city: e.target.value })}
                      placeholder="City Name"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-1.5">Standard Consultation Fee (USD)</label>
                    <Input
                      type="number"
                      value={doctorData.fees}
                      onChange={e => setDoctorData({ ...doctorData, fees: Number(e.target.value) })}
                      icon={DollarSign}
                      min="0"
                      required
                    />
                  </div>

                  <div className="sm:col-span-2 mt-4">
                    <label className="block text-sm font-bold text-slate-700 mb-3">Supported Consultation Types</label>
                    <div className="flex gap-4">
                      {['video', 'in-person', 'chat'].map(type => (
                        <label key={type} className={`flex items-center gap-3 p-4 rounded-xl border-2 cursor-pointer transition-all ${doctorData.consultationType.includes(type) ? 'border-primary bg-primary/5' : 'border-slate-200 hover:border-slate-300 bg-white'}`}>
                          <input
                            type="checkbox"
                            className="w-5 h-5 rounded text-primary focus:ring-primary border-slate-300"
                            checked={doctorData.consultationType.includes(type)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setDoctorData({ ...doctorData, consultationType: [...doctorData.consultationType, type] });
                              } else {
                                setDoctorData({ ...doctorData, consultationType: doctorData.consultationType.filter(t => t !== type) });
                              }
                            }}
                          />
                          <span className="font-bold text-sm text-slate-700 capitalize">{type === 'in-person' ? 'In Person' : type}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="pt-6 mt-6 border-t border-border flex justify-end">
                  <Button type="submit" variant="primary" disabled={saving}>
                    {saving ? 'Saving...' : 'Save Clinic Settings'} <Save className="w-4 h-4 ml-2" />
                  </Button>
                </div>
              </form>
            )}

            {/* SECURITY TAB */}
            {activeTab === 'security' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-black text-heading mb-1">Account Security</h3>
                  <p className="text-sm text-slate-500 mb-6">Manage your password and platform security preferences.</p>
                </div>

                <div className="bg-slate-50 rounded-2xl p-6 border border-slate-200">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center border border-slate-200 shadow-sm shrink-0">
                      <Lock className="w-6 h-6 text-slate-600" />
                    </div>
                    <div>
                      <h4 className="font-bold text-heading">Change Password</h4>
                      <p className="text-sm text-slate-500 mt-1 mb-4">Ensure your account is using a long, random password to stay secure.</p>
                      <Button variant="outline" className="bg-white" onClick={() => toast('Password change modal would open here.')}>
                        Update Password
                      </Button>
                    </div>
                  </div>
                </div>

                <div className="bg-slate-50 rounded-2xl p-6 border border-slate-200">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center border border-slate-200 shadow-sm shrink-0">
                      <Bell className="w-6 h-6 text-slate-600" />
                    </div>
                    <div className="w-full">
                      <div className="flex justify-between items-center w-full">
                        <div>
                          <h4 className="font-bold text-heading">Email Notifications</h4>
                          <p className="text-sm text-slate-500 mt-1">Receive booking alerts and settlement reports via email.</p>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input type="checkbox" value="" className="sr-only peer" defaultChecked />
                          <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                        </label>
                      </div>
                    </div>
                  </div>
                </div>

              </div>
            )}

          </div>
        </div>
      </div>
    </PageTransition>
  );
};

export default DoctorProfile;

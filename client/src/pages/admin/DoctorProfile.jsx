import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  User, Mail, Phone, MapPin, AlertCircle, Building, ShieldCheck,
  ChevronLeft, Calendar as CalendarIcon, FileText, Stethoscope, Activity,
  Clock, Plus, Award, GraduationCap, DollarSign, Languages
} from 'lucide-react';
import toast from 'react-hot-toast';
import PageTransition from '../../components/common/PageTransition';
import adminService from '../../services/adminService';
import appointmentService from '../../services/appointmentService';
import { useAuth } from '../../hooks/useAuth';
import Button from '../../components/ui/Button';
import Avatar from '../../components/common/Avatar';
import Badge from '../../components/ui/Badge';
import { format, differenceInYears } from 'date-fns';

const AdminDoctorProfile = () => {
  const { doctorId } = useParams();
  const navigate = useNavigate();

  const [doctor, setDoctor] = useState(null);
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    fetchDoctorData();
  }, [doctorId]);

  const fetchDoctorData = async () => {
    setLoading(true);
    try {
      const { data } = await adminService.getDoctorById(doctorId);
      setDoctor(data.doctor);
    } catch (error) {
      console.error(error);
      toast.error('Failed to load doctor profile');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center">
        <span className="loader w-10 h-10 border-4 border-primary border-b-transparent rounded-full animate-spin"></span>
        <p className="mt-4 text-muted font-medium">Loading doctor profile...</p>
      </div>
    );
  }

  if (!doctor) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center animate-fade-in">
        <AlertCircle className="w-16 h-16 text-slate-300 mb-4" />
        <h2 className="text-2xl font-bold text-heading mb-2">Doctor Profile Not Found</h2>
        <p className="text-slate-500 mb-6 text-center max-w-md">
          The requested doctor profile could not be loaded or does not exist.
        </p>
        <Button onClick={() => navigate('/admin/doctors')} variant="primary" className="shadow-lg shadow-primary/20">
          <ChevronLeft className="w-4 h-4 mr-2" /> Return to Doctors Management
        </Button>
      </div>
    );
  }

  const user = doctor.userId || {};
  const status = doctor.isApproved ? (user.isActive ? 'Active' : 'Suspended') : 'Pending Approval';
  const statusColor = doctor.isApproved ? (user.isActive ? 'success' : 'danger') : 'warning';

  return (
    <PageTransition className="max-w-6xl mx-auto space-y-8 pb-10">
      <button
        onClick={() => navigate('/admin/doctors')}
        className="flex items-center text-sm font-medium text-muted hover:text-primary transition-colors mb-2"
      >
        <ChevronLeft className="w-4 h-4 mr-1" /> Back to Doctors Management
      </button>

      {/* Hero Header Section */}
      <div className="bg-white rounded-3xl p-6 sm:p-10 border border-slate-100 shadow-sm relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-bl-full -z-10 pointer-events-none"></div>

        <div className="flex flex-col md:flex-row gap-8 items-center md:items-start relative z-10">
          <div className="relative shrink-0">
            <div className="w-32 h-32 md:w-40 md:h-40 rounded-full p-1 bg-gradient-to-tr from-slate-200 to-slate-400 flex items-center justify-center">
              <Avatar
                src={user.avatar?.url}
                name={user.name}
                role="doctor"
                className="w-full h-full border-4 border-white"
              />
            </div>
            {doctor.isApproved && (
              <div className="absolute bottom-2 right-2 bg-white rounded-full p-1 shadow-md">
                <ShieldCheck className="w-6 h-6 text-emerald-500" />
              </div>
            )}
          </div>

          <div className="flex-1 text-center md:text-left space-y-4">
            <div>
              <div className="flex flex-col md:flex-row md:items-center gap-3 justify-center md:justify-start">
                <h1 className="text-3xl md:text-4xl font-black text-heading">
                  Dr. {user.name}
                </h1>
                <Badge variant={statusColor} className="w-max mx-auto md:mx-0">
                  {status}
                </Badge>
              </div>
              <p className="text-sm text-primary font-bold mt-1">{doctor.specialization?.name || 'General Physician'}</p>
            </div>

            <div className="flex flex-wrap items-center justify-center md:justify-start gap-x-6 gap-y-3 text-slate-600 font-medium">
              <div className="flex items-center gap-1.5">
                <Clock className="w-5 h-5 text-slate-400" />
                <span>{doctor.experience || 0} years experience</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Building className="w-5 h-5 text-blue-400" />
                <span>{doctor.clinicName || 'Independent Practice'}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <CalendarIcon className="w-5 h-5 text-slate-400" />
                <span>Joined {format(new Date(doctor.createdAt), 'MMM yyyy')}</span>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="flex flex-wrap items-center justify-center md:justify-start gap-3 pt-4 border-t border-slate-100 w-full">
              <Link to={`/admin/chat/dummy_${user._id}`}>
                <Button variant="outline" className="border-slate-200 hover:bg-slate-50">
                  <Mail className="w-4 h-4 mr-2 text-slate-500" /> Message
                </Button>
              </Link>
              <Button variant={user.isActive ? "danger" : "success"} className="shadow-sm">
                <ShieldCheck className="w-4 h-4 mr-2" />
                {user.isActive ? 'Suspend Account' : 'Activate Account'}
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        <div className="lg:col-span-1 space-y-2">
          <div className="bg-white rounded-2xl border border-slate-100 p-3 shadow-sm flex flex-row lg:flex-col gap-2 overflow-x-auto custom-scrollbar">
            {[
              { id: 'overview', label: 'Overview', icon: User },
              { id: 'professional', label: 'Professional', icon: Award },
              { id: 'clinic', label: 'Clinic Info', icon: Building },
            ].map(tab => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all duration-200 min-w-max lg:min-w-0 ${activeTab === tab.id
                      ? 'bg-primary/10 text-primary'
                      : 'text-slate-600 hover:bg-slate-50'
                    }`}
                >
                  <Icon className={`w-5 h-5 ${activeTab === tab.id ? 'text-primary' : 'text-slate-400'}`} />
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>

        <div className="lg:col-span-3">
          {activeTab === 'overview' && (
            <div className="space-y-6 animate-fade-in">
              <div className="bg-white rounded-3xl p-8 border border-slate-100 shadow-sm">
                <h3 className="text-xl font-bold text-heading mb-6 flex items-center gap-2">
                  <User className="w-5 h-5 text-primary" /> Basic Information
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center text-primary shrink-0">
                      <Mail className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-xs text-slate-500 font-bold uppercase tracking-wider mb-1">Email Address</p>
                      <p className="font-medium text-heading">{user.email}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-full bg-emerald-50 flex items-center justify-center text-emerald-600 shrink-0">
                      <Phone className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-xs text-slate-500 font-bold uppercase tracking-wider mb-1">Phone Number</p>
                      <p className="font-medium text-heading">{user.phone || 'Not provided'}</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-3xl p-8 border border-slate-100 shadow-sm">
                <h3 className="text-xl font-bold text-heading mb-4">Bio</h3>
                <p className="text-slate-600 leading-relaxed">{doctor.bio || 'No bio provided.'}</p>
              </div>
            </div>
          )}

          {activeTab === 'professional' && (
            <div className="space-y-6 animate-fade-in">
              <div className="bg-white rounded-3xl p-8 border border-slate-100 shadow-sm">
                <h3 className="text-xl font-bold text-heading mb-6 flex items-center gap-2">
                  <Award className="w-5 h-5 text-primary" /> Professional Credentials
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-full bg-purple-50 flex items-center justify-center text-purple-600 shrink-0">
                      <Stethoscope className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-xs text-slate-500 font-bold uppercase tracking-wider mb-1">Registration No.</p>
                      <p className="font-medium text-heading">{doctor.registrationNumber || 'N/A'}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-full bg-indigo-50 flex items-center justify-center text-indigo-600 shrink-0">
                      <Languages className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-xs text-slate-500 font-bold uppercase tracking-wider mb-1">Spoken Languages</p>
                      <p className="font-medium text-heading">{doctor.languages?.join(', ') || 'N/A'}</p>
                    </div>
                  </div>
                </div>

                <h4 className="text-lg font-bold text-heading mb-4">Qualifications</h4>
                {doctor.qualifications?.length > 0 ? (
                  <div className="space-y-4">
                    {doctor.qualifications.map((qual, i) => (
                      <div key={i} className="flex gap-4 p-4 rounded-xl border border-slate-100 bg-slate-50">
                        <div className="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center shrink-0">
                          <GraduationCap className="w-5 h-5" />
                        </div>
                        <div>
                          <h5 className="font-bold text-heading">{qual.degree}</h5>
                          <p className="text-sm text-slate-500">{qual.institution} • {qual.year}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-slate-500 text-sm italic">No qualifications recorded.</p>
                )}
              </div>
            </div>
          )}

          {activeTab === 'clinic' && (
            <div className="space-y-6 animate-fade-in">
              <div className="bg-white rounded-3xl p-8 border border-slate-100 shadow-sm">
                <h3 className="text-xl font-bold text-heading mb-6 flex items-center gap-2">
                  <Building className="w-5 h-5 text-primary" /> Clinic & Fees
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center text-primary shrink-0">
                      <Building className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-xs text-slate-500 font-bold uppercase tracking-wider mb-1">Clinic Name</p>
                      <p className="font-medium text-heading">{doctor.clinicName || 'Not specified'}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-full bg-emerald-50 flex items-center justify-center text-emerald-600 shrink-0">
                      <DollarSign className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-xs text-slate-500 font-bold uppercase tracking-wider mb-1">Consultation Fee</p>
                      <p className="font-medium text-heading">${doctor.fees || 0}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-4 md:col-span-2 pt-4 border-t border-slate-100">
                    <div className="w-10 h-10 rounded-full bg-purple-50 flex items-center justify-center text-purple-600 shrink-0">
                      <MapPin className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-xs text-slate-500 font-bold uppercase tracking-wider mb-1">Clinic Address</p>
                      <p className="font-medium text-heading">{doctor.clinicAddress || 'Address not provided'}</p>
                      {doctor.city && <p className="text-sm text-slate-500 mt-0.5">{doctor.city}</p>}
                    </div>
                  </div>
                </div>

                <div className="mt-8">
                  <h4 className="text-sm font-bold text-heading uppercase tracking-wider mb-3">Supported Consultation Types</h4>
                  <div className="flex flex-wrap gap-2">
                    {doctor.consultationType?.map((type, i) => (
                      <Badge key={i} variant="primary" className="capitalize">{type === 'in-person' ? 'In Person' : type}</Badge>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </PageTransition>
  );
};

export default AdminDoctorProfile;

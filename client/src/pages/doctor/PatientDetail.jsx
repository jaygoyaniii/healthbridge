import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  User, Mail, Phone, MapPin, AlertCircle, HeartPulse, ShieldCheck,
  ChevronLeft, Calendar as CalendarIcon, FileText, Stethoscope, Activity,
  Clock, Plus
} from 'lucide-react';
import toast from 'react-hot-toast';
import PageTransition from '../../components/common/PageTransition';
import doctorService from '../../services/doctorService';
import appointmentService from '../../services/appointmentService';
import prescriptionService from '../../services/prescriptionService';
import medicalService from '../../services/medicalService';
import { useAuth } from '../../hooks/useAuth';
import Button from '../../components/ui/Button';
import Avatar from '../../components/common/Avatar';
import Badge from '../../components/ui/Badge';
import { format, differenceInYears } from 'date-fns';

const PatientDetail = () => {
  const { patientId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [patient, setPatient] = useState(null);
  const [appointments, setAppointments] = useState([]);
  const [prescriptions, setPrescriptions] = useState([]);
  const [records, setRecords] = useState([]);

  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    fetchPatientData();
  }, [patientId]);

  const fetchPatientData = async () => {
    setLoading(true);
    try {
      const doctorId = user?.doctorProfile?._id;
      if (!doctorId) throw new Error('Doctor profile missing');

      const { data } = await doctorService.getPatientDetail(doctorId, patientId);
      setPatient(data.patient);

      // Fetch related data concurrently (don't fail the whole page if these fail)
      try {
        const [apptRes, presRes, recRes] = await Promise.all([
          appointmentService.getAppointments({ patientId, limit: 20 }),
          prescriptionService.getPrescriptions({ patientId, limit: 20 }),
          medicalService.getRecords({ patientId, limit: 20 })
        ]);

        setAppointments(apptRes.data.appointments || []);
        setPrescriptions(presRes.data.prescriptions || []);
        setRecords(recRes.data.records || []);
      } catch (subError) {
        console.error('Failed to load some patient related data:', subError);
      }

    } catch (error) {
      console.error(error);
      toast.error(error.response?.data?.message || 'Failed to load patient profile or unauthorized access');
      // Do not navigate back, allow the empty state to render
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center">
        <span className="loader w-10 h-10 border-4 border-primary border-b-transparent rounded-full animate-spin"></span>
        <p className="mt-4 text-muted font-medium">Loading patient profile...</p>
      </div>
    );
  }

  if (!patient) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center animate-fade-in">
        <AlertCircle className="w-16 h-16 text-slate-300 mb-4" />
        <h2 className="text-2xl font-bold text-heading mb-2">Patient Profile Not Found</h2>
        <p className="text-slate-500 mb-6 text-center max-w-md">
          The requested patient profile could not be loaded. You may not have authorization to view this patient, or the profile may not exist.
        </p>
        <Button onClick={() => navigate('/doctor/patients')} variant="primary" className="shadow-lg shadow-primary/20">
          <ChevronLeft className="w-4 h-4 mr-2" /> Return to My Patients
        </Button>
      </div>
    );
  }

  const age = patient.dateOfBirth ? differenceInYears(new Date(), new Date(patient.dateOfBirth)) : 'N/A';
  const profile = patient.healthProfile || {};
  const status = patient.isActive ? 'Active' : 'Inactive';

  return (
    <PageTransition className="max-w-6xl mx-auto space-y-8 pb-10">
      {/* Back Button */}
      <button
        onClick={() => navigate(-1)}
        className="flex items-center text-sm font-medium text-muted hover:text-primary transition-colors mb-2"
      >
        <ChevronLeft className="w-4 h-4 mr-1" /> Back to Patients
      </button>

      {/* Hero Header Section */}
      <div className="bg-white rounded-3xl p-6 sm:p-10 border border-slate-100 shadow-sm relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-bl-full -z-10 pointer-events-none"></div>
        <div className="absolute bottom-0 left-0 w-40 h-40 bg-blue-50/50 rounded-tr-full -z-10 pointer-events-none"></div>

        <div className="flex flex-col md:flex-row gap-8 items-center md:items-start relative z-10">

          {/* Avatar Area */}
          <div className="relative shrink-0">
            <div className="w-32 h-32 md:w-40 md:h-40 rounded-full p-1 bg-gradient-to-tr from-slate-200 to-slate-400 flex items-center justify-center">
              <Avatar
                src={patient.avatar?.url}
                name={patient.name}
                role="patient"  
                className="w-full h-full border-4 border-white"
              />
            </div>
            {patient.isActive && (
              <div className="absolute bottom-2 right-2 bg-white rounded-full p-1 shadow-md">
                <ShieldCheck className="w-6 h-6 text-emerald-500" />
              </div>
            )}
          </div>

          {/* Title and Info */}
          <div className="flex-1 text-center md:text-left space-y-4">
            <div>
              <div className="flex flex-col md:flex-row md:items-center gap-3 justify-center md:justify-start">
                <h1 className="text-3xl md:text-4xl font-black text-heading">
                  {patient.name}
                </h1>
                <Badge variant={patient.isActive ? 'success' : 'secondary'} className="w-max mx-auto md:mx-0">
                  {status}
                </Badge>
              </div>
              <p className="text-sm text-slate-500 font-medium mt-1">Patient ID: {patient._id}</p>
            </div>

            <div className="flex flex-wrap items-center justify-center md:justify-start gap-x-6 gap-y-3 text-slate-600 font-medium">
              <div className="flex items-center gap-1.5">
                <User className="w-5 h-5 text-slate-400" />
                <span className="capitalize">{patient.gender || 'Not specified'}, {age} yrs</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Activity className="w-5 h-5 text-red-400" />
                <span>Blood: {profile.bloodGroup || 'Unknown'}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <CalendarIcon className="w-5 h-5 text-slate-400" />
                <span>Registered: {format(new Date(patient.createdAt), 'MMM yyyy')}</span>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="flex flex-wrap items-center justify-center md:justify-start gap-3 pt-4 border-t border-slate-100 w-full">
              <Link to="/doctor/schedule">
                <Button variant="primary" className="shadow-lg shadow-primary/20">
                  <CalendarIcon className="w-4 h-4 mr-2" />
                  Schedule Follow-Up
                </Button>
              </Link>
              <Link to="/doctor/chat">
                <Button variant="outline" className="border-slate-200 hover:bg-slate-50">
                  <Mail className="w-4 h-4 mr-2 text-slate-500" /> Message
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">

        {/* Left Column - Navigation/Tabs */}
        <div className="lg:col-span-1 space-y-2">
          <div className="bg-white rounded-2xl border border-slate-100 p-3 shadow-sm flex flex-row lg:flex-col gap-2 overflow-x-auto custom-scrollbar">
            {[
              { id: 'overview', label: 'Overview', icon: User },
              { id: 'appointments', label: 'Appointments', icon: CalendarIcon },
              { id: 'prescriptions', label: 'Prescriptions', icon: FileText },
              { id: 'records', label: 'Medical Records', icon: Stethoscope },
              { id: 'timeline', label: 'Activity Timeline', icon: Clock }
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

        {/* Right Column - Content */}
        <div className="lg:col-span-3">

          {/* Tab: Overview */}
          {activeTab === 'overview' && (
            <div className="space-y-6 animate-fade-in">
              {/* Contact Information */}
              <div className="bg-white rounded-3xl p-8 border border-slate-100 shadow-sm">
                <h3 className="text-xl font-bold text-heading mb-6 flex items-center gap-2">
                  <MapPin className="w-5 h-5 text-primary" /> Contact Information
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center text-primary shrink-0">
                      <Mail className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-xs text-slate-500 font-bold uppercase tracking-wider mb-1">Email Address</p>
                      <p className="font-medium text-heading">{patient.email}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-full bg-emerald-50 flex items-center justify-center text-emerald-600 shrink-0">
                      <Phone className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-xs text-slate-500 font-bold uppercase tracking-wider mb-1">Phone Number</p>
                      <p className="font-medium text-heading">{patient.phone || 'Not provided'}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-4 md:col-span-2">
                    <div className="w-10 h-10 rounded-full bg-purple-50 flex items-center justify-center text-purple-600 shrink-0">
                      <MapPin className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-xs text-slate-500 font-bold uppercase tracking-wider mb-1">Address</p>
                      <p className="font-medium text-heading">
                        {[patient.address?.street, patient.address?.city, patient.address?.state, patient.address?.pincode]
                          .filter(Boolean)
                          .join(', ') || 'Address not provided'}
                      </p>
                    </div>
                  </div>

                  {profile.emergencyContact && profile.emergencyContact.name && (
                    <div className="flex items-start gap-4 md:col-span-2 pt-4 border-t border-slate-100">
                      <div className="w-10 h-10 rounded-full bg-rose-50 flex items-center justify-center text-rose-500 shrink-0">
                        <HeartPulse className="w-5 h-5" />
                      </div>
                      <div>
                        <p className="text-xs text-slate-500 font-bold uppercase tracking-wider mb-1">Emergency Contact</p>
                        <p className="font-medium text-heading">
                          {profile.emergencyContact.name}
                          {profile.emergencyContact.relation ? ` (${profile.emergencyContact.relation})` : ''}
                          {profile.emergencyContact.phone ? ` • ${profile.emergencyContact.phone}` : ''}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Medical Information */}
              <div className="bg-white rounded-3xl p-8 border border-slate-100 shadow-sm">
                <h3 className="text-xl font-bold text-heading mb-6 flex items-center gap-2">
                  <HeartPulse className="w-5 h-5 text-primary" /> Medical Information
                </h3>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                  <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 text-center">
                    <p className="text-xs text-slate-500 font-bold uppercase tracking-wider mb-1">Height</p>
                    <p className="text-xl font-black text-heading">{profile.height ? `${profile.height} cm` : '--'}</p>
                  </div>
                  <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 text-center">
                    <p className="text-xs text-slate-500 font-bold uppercase tracking-wider mb-1">Weight</p>
                    <p className="text-xl font-black text-heading">{profile.weight ? `${profile.weight} kg` : '--'}</p>
                  </div>
                  <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 text-center">
                    <p className="text-xs text-slate-500 font-bold uppercase tracking-wider mb-1">Blood</p>
                    <p className="text-xl font-black text-heading">{profile.bloodGroup || '--'}</p>
                  </div>
                  <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 text-center">
                    <p className="text-xs text-slate-500 font-bold uppercase tracking-wider mb-1">BMI</p>
                    <p className="text-xl font-black text-heading">
                      {profile.height && profile.weight
                        ? (profile.weight / Math.pow(profile.height / 100, 2)).toFixed(1)
                        : '--'}
                    </p>
                  </div>
                </div>

                <div className="space-y-6">
                  <div>
                    <h4 className="text-sm font-bold text-heading uppercase tracking-wider mb-3">Allergies</h4>
                    {profile.allergies?.length > 0 ? (
                      <div className="flex flex-wrap gap-2">
                        {profile.allergies.map((a, i) => (
                          <Badge key={i} variant="danger" className="bg-red-50 text-red-700 border-red-100">{a}</Badge>
                        ))}
                      </div>
                    ) : <p className="text-sm text-slate-500">No known allergies</p>}
                  </div>

                  <div>
                    <h4 className="text-sm font-bold text-heading uppercase tracking-wider mb-3">Current Medications</h4>
                    {profile.currentMedications?.length > 0 ? (
                      <ul className="list-disc list-inside space-y-1 text-slate-600 text-sm">
                        {profile.currentMedications.map((m, i) => <li key={i}>{m}</li>)}
                      </ul>
                    ) : <p className="text-sm text-slate-500">No current medications recorded</p>}
                  </div>

                  <div>
                    <h4 className="text-sm font-bold text-heading uppercase tracking-wider mb-3">Chronic Conditions</h4>
                    {profile.chronicConditions?.length > 0 ? (
                      <ul className="list-disc list-inside space-y-1 text-slate-600 text-sm">
                        {profile.chronicConditions.map((h, i) => <li key={i}>{h}</li>)}
                      </ul>
                    ) : <p className="text-sm text-slate-500">No chronic conditions recorded</p>}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Tab: Appointments */}
          {activeTab === 'appointments' && (
            <div className="space-y-4 animate-fade-in">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-bold text-heading">Consultation History</h3>
              </div>

              {appointments.length > 0 ? (
                appointments.map(appt => (
                  <div key={appt._id} className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm flex flex-col md:flex-row gap-4 justify-between items-start md:items-center">
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <Badge variant={appt.status === 'completed' ? 'success' : appt.status === 'pending' ? 'warning' : 'secondary'}>
                          {appt.status.toUpperCase()}
                        </Badge>
                        <span className="text-sm text-slate-500 font-medium">{appt.type === 'video' ? 'Video Consult' : 'Clinic Visit'}</span>
                      </div>
                      <h4 className="font-bold text-heading text-lg">{format(new Date(appt.date), 'MMMM dd, yyyy')}</h4>
                      <p className="text-slate-600 text-sm mt-1">Time: {appt.slotTime}</p>
                      {appt.symptoms && <p className="text-slate-500 text-sm mt-2 italic">"{appt.symptoms}"</p>}
                    </div>
                    <div className="flex flex-col gap-2 w-full md:w-auto">
                      <Link to={`/doctor/appointments/${appt._id}`}>
                        <Button variant="outline" className="w-full">View Details</Button>
                      </Link>
                      {appt.status === 'completed' && !appt.prescription && (
                        <Link to={`/doctor/prescriptions/write/${appt._id}`}>
                          <Button variant="primary" className="w-full">Write Rx</Button>
                        </Link>
                      )}
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-12 bg-white rounded-3xl border border-slate-100 shadow-sm">
                  <CalendarIcon className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                  <h4 className="text-heading font-bold mb-2">No Appointments</h4>
                  <p className="text-slate-500 text-sm">You haven't had any consultations with this patient yet.</p>
                </div>
              )}
            </div>
          )}

          {/* Tab: Prescriptions */}
          {activeTab === 'prescriptions' && (
            <div className="space-y-4 animate-fade-in">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-bold text-heading">Prescriptions</h3>
              </div>

              {prescriptions.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {prescriptions.map(rx => (
                    <div key={rx._id} className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm flex flex-col h-full">
                      <div className="flex justify-between items-start mb-4">
                        <div className="w-10 h-10 rounded-full bg-blue-50 text-primary flex items-center justify-center">
                          <FileText className="w-5 h-5" />
                        </div>
                        <span className="text-xs font-bold text-slate-500 uppercase">{format(new Date(rx.createdAt), 'MMM dd, yyyy')}</span>
                      </div>
                      <h4 className="font-bold text-heading mb-1">{rx.diagnosis || 'General Consultation'}</h4>
                      <p className="text-sm text-slate-600 mb-4">{rx.medicines?.length || 0} medications prescribed</p>

                      <div className="mt-auto pt-4 border-t border-slate-100">
                        <Link to={`/doctor/prescriptions/${rx._id}`}>
                          <Button variant="outline" className="w-full text-sm">View Prescription</Button>
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 bg-white rounded-3xl border border-slate-100 shadow-sm">
                  <FileText className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                  <h4 className="text-heading font-bold mb-2">No Prescriptions</h4>
                  <p className="text-slate-500 text-sm">You haven't prescribed any medications to this patient.</p>
                </div>
              )}
            </div>
          )}

          {/* Tab: Medical Records */}
          {activeTab === 'records' && (
            <div className="space-y-4 animate-fade-in">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-bold text-heading">Shared Medical Records</h3>
              </div>

              {records.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {records.map(record => (
                    <div key={record._id} className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm hover:shadow-md transition-shadow">
                      <div className="flex gap-4 items-start">
                        <div className="w-12 h-12 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center shrink-0">
                          <Stethoscope className="w-6 h-6" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="font-bold text-heading text-sm truncate">{record.title}</h4>
                          <p className="text-xs text-slate-500 capitalize">{record.type} • {format(new Date(record.createdAt), 'MMM dd, yyyy')}</p>
                          <a
                            href={record.file?.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-block mt-3 text-sm font-bold text-primary hover:underline"
                          >
                            View Document
                          </a>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 bg-white rounded-3xl border border-slate-100 shadow-sm">
                  <AlertCircle className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                  <h4 className="text-heading font-bold mb-2">No Records Shared</h4>
                  <p className="text-slate-500 text-sm">This patient hasn't shared any medical records with you.</p>
                </div>
              )}
            </div>
          )}

          {/* Tab: Timeline */}
          {activeTab === 'timeline' && (
            <div className="space-y-4 animate-fade-in">
              <div className="bg-white rounded-3xl p-8 border border-slate-100 shadow-sm">
                <h3 className="text-xl font-bold text-heading mb-8">Patient Activity Timeline</h3>

                {appointments.length > 0 || prescriptions.length > 0 ? (
                  <div className="space-y-6 relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-slate-200 before:to-transparent">
                    {/* Combine and sort timeline events */}
                    {[
                      ...appointments.map(a => ({ type: 'appointment', date: new Date(a.date), data: a })),
                      ...prescriptions.map(p => ({ type: 'prescription', date: new Date(p.createdAt), data: p })),
                      ...records.map(r => ({ type: 'record', date: new Date(r.createdAt), data: r }))
                    ]
                      .sort((a, b) => b.date - a.date)
                      .map((event, index) => (
                        <div key={index} className="relative flex items-center group">
                          <div className={`flex items-center justify-center w-10 h-10 rounded-full border-4 border-white text-white shadow-sm z-10 shrink-0
                          ${event.type === 'appointment' ? 'bg-blue-500' : event.type === 'prescription' ? 'bg-emerald-500' : 'bg-purple-500'}
                        `}>
                            {event.type === 'appointment' && <CalendarIcon className="w-4 h-4" />}
                            {event.type === 'prescription' && <FileText className="w-4 h-4" />}
                            {event.type === 'record' && <Stethoscope className="w-4 h-4" />}
                          </div>
                          <div className="ml-4 p-4 rounded-2xl bg-slate-50 border border-slate-100 flex-1">
                            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">{format(event.date, 'MMM dd, yyyy')}</p>
                            <h4 className="font-bold text-heading">
                              {event.type === 'appointment' && `Consultation (${event.data.status})`}
                              {event.type === 'prescription' && `Prescription added`}
                              {event.type === 'record' && `Record shared: ${event.data.title}`}
                            </h4>
                          </div>
                        </div>
                      ))}
                  </div>
                ) : (
                  <p className="text-slate-500 text-center py-8">No activity recorded yet.</p>
                )}
              </div>
            </div>
          )}

        </div>
      </div>
    </PageTransition>
  );
};

export default PatientDetail;

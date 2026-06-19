import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { 
  Calendar, Clock, User, Stethoscope, Video, MapPin,
  FileText, Activity, AlertCircle, CheckCircle, XCircle, 
  CreditCard, MessageSquare, ChevronLeft, Download, Eye,
  RefreshCw, FileSignature
} from 'lucide-react';
import toast from 'react-hot-toast';
import PageTransition from '../../components/common/PageTransition';
import appointmentService from '../../services/appointmentService';
import { formatDate } from '../../utils/format';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import Avatar from '../../components/common/Avatar';

const AppointmentDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [appointment, setAppointment] = useState(null);
  const [loading, setLoading] = useState(true);
  const [cancelling, setCancelling] = useState(false);
  const [cancelReason, setCancelReason] = useState('');
  const [showCancelModal, setShowCancelModal] = useState(false);

  useEffect(() => {
    fetchAppointment();
  }, [id]);

  const fetchAppointment = async () => {
    try {
      const { data } = await appointmentService.getById(id);
      setAppointment(data.appointment);
    } catch (error) {
      toast.error('Failed to load appointment details');
      navigate('/patient/appointments');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = async () => {
    if (!cancelReason.trim()) {
      return toast.error('Please provide a cancellation reason');
    }
    setCancelling(true);
    try {
      await appointmentService.cancel(id, cancelReason);
      toast.success('Appointment cancelled successfully');
      setShowCancelModal(false);
      fetchAppointment();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to cancel appointment');
    } finally {
      setCancelling(false);
    }
  };

  const getStatusConfig = (status) => {
    const configs = {
      pending: { color: 'warning', icon: RefreshCw, label: 'Pending Confirmation' },
      confirmed: { color: 'success', icon: CheckCircle, label: 'Confirmed' },
      completed: { color: 'primary', icon: CheckCircle, label: 'Completed' },
      cancelled: { color: 'danger', icon: XCircle, label: 'Cancelled' },
      'no-show': { color: 'neutral', icon: AlertCircle, label: 'No Show' },
    };
    return configs[status] || configs.pending;
  };

  if (loading) {
    return (
      <PageTransition className="max-w-4xl mx-auto space-y-6">
        <div className="h-8 w-32 skeleton rounded-xl mb-6"></div>
        <div className="card p-6 skeleton h-48 rounded-2xl"></div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-2 space-y-6">
            <div className="card p-6 skeleton h-64 rounded-2xl"></div>
            <div className="card p-6 skeleton h-48 rounded-2xl"></div>
          </div>
          <div className="space-y-6">
            <div className="card p-6 skeleton h-64 rounded-2xl"></div>
          </div>
        </div>
      </PageTransition>
    );
  }

  if (!appointment) return null;

  const statusConfig = getStatusConfig(appointment.status);
  const doctor = appointment.doctorId;

  return (
    <PageTransition className="max-w-4xl mx-auto space-y-6 pb-12">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <button 
            onClick={() => navigate('/patient/appointments')}
            className="flex items-center text-sm font-semibold text-slate-500 hover:text-brand-primary transition-colors mb-2"
          >
            <ChevronLeft className="w-4 h-4 mr-1" /> Back to Appointments
          </button>
          <h1 className="text-2xl sm:text-3xl font-black text-heading flex items-center gap-3">
            Appointment Details
            <Badge variant={statusConfig.color} className="uppercase text-[10px] tracking-wider py-1 px-2.5">
              {statusConfig.label}
            </Badge>
          </h1>
          <p className="text-sm text-slate-500 mt-1">ID: {appointment._id}</p>
        </div>
        
        {/* Header Actions */}
        <div className="flex gap-2">
          {appointment.status === 'pending' && (
            <Button variant="outline" className="text-rose-500 border-rose-200 hover:bg-rose-50" onClick={() => setShowCancelModal(true)}>
              Cancel Appointment
            </Button>
          )}
          {appointment.status === 'confirmed' && (
            <Link to="/patient/chat">
              <Button variant="primary">
                <MessageSquare className="w-4 h-4 mr-2" /> Message Doctor
              </Button>
            </Link>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Main Content Column */}
        <div className="md:col-span-2 space-y-6">
          
          {/* Status Alert */}
          {appointment.status === 'cancelled' && (
            <div className="bg-rose-50 border border-rose-100 rounded-2xl p-4 flex gap-3">
              <XCircle className="w-5 h-5 text-rose-500 shrink-0 mt-0.5" />
              <div>
                <h4 className="font-bold text-rose-900">Appointment Cancelled</h4>
                <p className="text-sm text-rose-700 mt-1">
                  Reason: {appointment.cancelReason || 'No reason provided.'}
                </p>
              </div>
            </div>
          )}

          {/* Doctor Info Card */}
          <div className="bg-white rounded-2xl border border-border shadow-sm p-6 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-brand-primary/5 rounded-full -translate-y-1/2 translate-x-1/4"></div>
            
            <h3 className="text-lg font-bold text-heading mb-4 border-b border-border pb-3">Consulting Doctor</h3>
            <div className="flex flex-col sm:flex-row items-start gap-5">
              <Avatar
                src={doctor?.userId?.avatar?.url || doctor?.userId?.avatar}
                name={doctor?.userId?.name}
                role="doctor"
                className="w-16 h-16 sm:w-20 sm:h-20 shadow-sm shrink-0 relative z-10 border-4 border-white"
              />
              <div className="relative z-10 flex-1 w-full">
                <h4 className="font-black text-heading text-lg">Dr. {doctor?.userId?.name}</h4>
                <p className="text-brand-primary font-medium text-sm">{doctor?.specialization?.name || 'General Practitioner'}</p>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-4">
                  <div className="flex items-center text-sm text-slate-600">
                    <Stethoscope className="w-4 h-4 mr-2 text-slate-400 shrink-0" />
                    {doctor?.experience || 0} Years Experience
                  </div>
                  <div className="flex items-start text-sm text-slate-600">
                    <MapPin className="w-4 h-4 mr-2 text-slate-400 shrink-0 mt-0.5" />
                    <span className="line-clamp-2">{doctor?.clinicName || 'HealthBridge Clinic'}</span>
                  </div>
                </div>

                <div className="mt-5 pt-5 border-t border-slate-100">
                  <Link to={`/patient/find-doctor/${doctor?._id}`}>
                    <Button variant="outline" size="sm" className="h-8 text-xs">
                      View Full Profile
                    </Button>
                  </Link>
                </div>
              </div>
            </div>
          </div>

          {/* Visit Information */}
          <div className="bg-white rounded-2xl border border-border shadow-sm p-6">
            <h3 className="text-lg font-bold text-heading mb-4 border-b border-border pb-3 flex items-center">
              <FileText className="w-5 h-5 mr-2 text-brand-primary" /> Visit Information
            </h3>
            
            <div className="space-y-4">
              <div>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Symptoms / Reason for Visit</p>
                <p className="text-sm text-slate-700 bg-slate-50 p-3 rounded-xl border border-slate-100 min-h-[60px]">
                  {appointment.symptoms || 'No specific symptoms provided.'}
                </p>
              </div>
              
              {appointment.notes && (
                <div>
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Additional Notes</p>
                  <p className="text-sm text-slate-700 bg-amber-50/50 p-3 rounded-xl border border-amber-100">
                    {appointment.notes}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Prescription & Records (If completed) */}
          {(appointment.status === 'completed' || appointment.prescription) && (
            <div className="bg-gradient-to-br from-emerald-50 to-teal-50 rounded-2xl border border-emerald-100 shadow-sm p-6">
              <h3 className="text-lg font-bold text-emerald-900 mb-4 flex items-center">
                <FileSignature className="w-5 h-5 mr-2" /> Consultation Documents
              </h3>
              
              {appointment.prescription ? (
                <div className="bg-white p-4 rounded-xl shadow-sm flex items-center justify-between border border-emerald-100">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center shrink-0">
                      <FileSignature className="w-5 h-5 text-emerald-600" />
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-800">E-Prescription</h4>
                      <p className="text-xs text-slate-500">Issued by Dr. {doctor?.userId?.name}</p>
                    </div>
                  </div>
                  <Link to={`/patient/prescriptions/${appointment.prescription._id || appointment.prescription}`}>
                    <Button variant="outline" size="sm" className="border-emerald-200 text-emerald-700 hover:bg-emerald-50 shrink-0">
                      View <Eye className="w-4 h-4 ml-2 hidden sm:block" />
                    </Button>
                  </Link>
                </div>
              ) : (
                <p className="text-sm text-emerald-700">No prescription was issued for this consultation.</p>
              )}
            </div>
          )}

        </div>

        {/* Sidebar Column */}
        <div className="space-y-6">
          
          {/* Schedule Card */}
          <div className="bg-brand-primary text-white rounded-2xl shadow-md p-6 relative overflow-hidden">
            {/* Abstract Background Element */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-white opacity-5 rounded-full -translate-y-1/4 translate-x-1/4 blur-2xl"></div>
            
            <h3 className="text-lg font-bold mb-4 flex items-center relative z-10">
              <Calendar className="w-5 h-5 mr-2 text-blue-200" /> Schedule
            </h3>
            
            <div className="space-y-4 relative z-10">
              <div className="bg-white/10 p-3 rounded-xl backdrop-blur-sm border border-white/10">
                <p className="text-xs text-blue-200 font-semibold uppercase tracking-wider mb-1">Date</p>
                <p className="font-black text-lg">{formatDate(appointment.date)}</p>
              </div>
              
              <div className="bg-white/10 p-3 rounded-xl backdrop-blur-sm border border-white/10">
                <p className="text-xs text-blue-200 font-semibold uppercase tracking-wider mb-1">Time</p>
                <p className="font-black text-lg flex items-center">
                  <Clock className="w-4 h-4 mr-2" /> {appointment.slotTime}
                </p>
              </div>
              
              <div className="bg-white/10 p-3 rounded-xl backdrop-blur-sm border border-white/10">
                <p className="text-xs text-blue-200 font-semibold uppercase tracking-wider mb-1">Consultation Type</p>
                <p className="font-bold flex items-center capitalize">
                  {appointment.type === 'video' ? <Video className="w-4 h-4 mr-2" /> : <User className="w-4 h-4 mr-2" />}
                  {appointment.type.replace('-', ' ')}
                </p>
              </div>
            </div>
          </div>

          {/* Payment Summary */}
          <div className="bg-white rounded-2xl border border-border shadow-sm p-6">
            <h3 className="font-bold text-heading mb-4 flex items-center">
              <CreditCard className="w-4 h-4 mr-2 text-slate-400" /> Payment Details
            </h3>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between items-center">
                <span className="text-slate-500">Consultation Fee</span>
                <span className="font-bold text-slate-700">${appointment.fees?.toFixed(2) || '0.00'}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-500">Taxes (0%)</span>
                <span className="font-bold text-slate-700">$0.00</span>
              </div>
              <div className="pt-3 border-t border-dashed border-slate-200 flex justify-between items-center">
                <span className="font-bold text-heading">Total Amount</span>
                <span className="font-black text-brand-primary text-lg">${appointment.fees?.toFixed(2) || '0.00'}</span>
              </div>
              <div className="pt-3 mt-3 border-t border-border flex justify-between items-center">
                <span className="text-xs font-semibold text-slate-400 uppercase">Status</span>
                <Badge variant={appointment.paymentStatus === 'paid' ? 'success' : 'warning'} className="capitalize text-[10px]">
                  {appointment.paymentStatus}
                </Badge>
              </div>
            </div>
          </div>

          {/* Timeline */}
          <div className="bg-white rounded-2xl border border-border shadow-sm p-6">
            <h3 className="font-bold text-heading mb-4 flex items-center">
              <Activity className="w-4 h-4 mr-2 text-slate-400" /> Timeline
            </h3>
            
            <div className="relative pl-6 space-y-6">
              <div className="absolute left-[11px] top-2 bottom-2 w-0.5 bg-slate-100"></div>
              
              <div className="relative z-10">
                <div className="absolute -left-[29px] w-4 h-4 rounded-full bg-slate-200 border-2 border-white"></div>
                <h4 className="text-sm font-bold text-slate-700">Booking Created</h4>
                <p className="text-xs text-slate-400 mt-1">{new Date(appointment.createdAt).toLocaleString()}</p>
              </div>
              
              {(appointment.status === 'confirmed' || appointment.status === 'completed') && (
                <div className="relative z-10">
                  <div className="absolute -left-[29px] w-4 h-4 rounded-full bg-brand-primary border-2 border-white"></div>
                  <h4 className="text-sm font-bold text-brand-primary">Appointment Confirmed</h4>
                  <p className="text-xs text-slate-400 mt-1">Confirmed by doctor</p>
                </div>
              )}
              
              {appointment.status === 'completed' && (
                <div className="relative z-10">
                  <div className="absolute -left-[29px] w-4 h-4 rounded-full bg-emerald-500 border-2 border-white"></div>
                  <h4 className="text-sm font-bold text-emerald-600">Consultation Completed</h4>
                  <p className="text-xs text-slate-400 mt-1">{new Date(appointment.updatedAt).toLocaleString()}</p>
                </div>
              )}

              {appointment.status === 'cancelled' && (
                <div className="relative z-10">
                  <div className="absolute -left-[29px] w-4 h-4 rounded-full bg-rose-500 border-2 border-white"></div>
                  <h4 className="text-sm font-bold text-rose-600">Appointment Cancelled</h4>
                  <p className="text-xs text-slate-400 mt-1">{new Date(appointment.updatedAt).toLocaleString()}</p>
                </div>
              )}
            </div>
          </div>

        </div>
      </div>

      {/* Cancel Modal */}
      {showCancelModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-in zoom-in-95">
            <div className="p-6">
              <div className="w-12 h-12 bg-rose-100 text-rose-600 rounded-full flex items-center justify-center mb-4">
                <AlertCircle className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-heading mb-2">Cancel Appointment?</h3>
              <p className="text-sm text-slate-500 mb-4">
                Are you sure you want to cancel this appointment? This action cannot be undone.
              </p>
              
              <label className="block text-sm font-bold text-slate-700 mb-2">Reason for Cancellation</label>
              <textarea 
                className="input-base w-full h-24 resize-none mb-6"
                placeholder="Please tell us why you are cancelling..."
                value={cancelReason}
                onChange={e => setCancelReason(e.target.value)}
              />
              
              <div className="flex justify-end gap-3">
                <Button variant="ghost" onClick={() => setShowCancelModal(false)}>Keep Appointment</Button>
                <Button variant="primary" className="bg-rose-500 hover:bg-rose-600 shadow-rose-500/20" onClick={handleCancel} disabled={cancelling}>
                  {cancelling ? 'Cancelling...' : 'Yes, Cancel it'}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

    </PageTransition>
  );
};

export default AppointmentDetail;

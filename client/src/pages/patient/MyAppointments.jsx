import { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  Calendar as CalendarIcon, Clock, MapPin, Search, ExternalLink,
  Video, CheckCircle, XCircle, AlertCircle, RefreshCw, Filter, SlidersHorizontal
} from 'lucide-react';
import toast from 'react-hot-toast';
import PageTransition from '../../components/common/PageTransition';
import appointmentService from '../../services/appointmentService';
import { formatDate, formatSlotTime } from '../../utils/format';
import Badge from '../../components/ui/Badge';
import Button from '../../components/ui/Button';

const STATUS_TABS = [
  { id: 'all', label: 'All Appointments' },
  { id: 'upcoming', label: 'Upcoming' },
  { id: 'pending', label: 'Pending' },
  { id: 'completed', label: 'Completed' },
  { id: 'cancelled', label: 'Cancelled' },
];

const MyAppointments = () => {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters & State
  const [activeTab, setActiveTab] = useState('upcoming');
  const [searchQuery, setSearchQuery] = useState('');
  const [consultationType, setConsultationType] = useState('all');
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    fetchAppointments();
  }, []);

  const fetchAppointments = async () => {
    setLoading(true);
    try {
      // Fetch a larger limit to allow client-side filtering and robust stats
      const { data } = await appointmentService.getAppointments({ limit: 100 });
      setAppointments(data.appointments || []);
    } catch (error) {
      console.error('Failed to fetch appointments:', error);
      toast.error('Could not load your appointments');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = async (id) => {
    if (!window.confirm('Are you sure you want to cancel this appointment? This action cannot be undone.')) return;
    try {
      await appointmentService.cancel(id, 'Patient cancelled');
      toast.success('Appointment cancelled successfully');
      fetchAppointments();
    } catch (error) {
      console.error('Cancellation failed:', error);
      toast.error('Failed to cancel appointment');
    }
  };

  // Derived Statistics
  const stats = useMemo(() => {
    let upcoming = 0, completed = 0, cancelled = 0;
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    appointments.forEach(appt => {
      if (appt.status === 'completed') completed++;
      else if (appt.status === 'cancelled') cancelled++;
      else if (appt.status === 'confirmed' && new Date(appt.date) >= today) upcoming++;
    });
    return { total: appointments.length, upcoming, completed, cancelled };
  }, [appointments]);

  // Filter Logic
  const filteredAppointments = useMemo(() => {
    return appointments.filter(appt => {
      // 1. Tab Filter
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const isUpcoming = (appt.status === 'confirmed' || appt.status === 'pending') && new Date(appt.date) >= today;

      if (activeTab === 'upcoming' && !isUpcoming) return false;
      if (activeTab === 'completed' && appt.status !== 'completed') return false;
      if (activeTab === 'cancelled' && appt.status !== 'cancelled') return false;
      if (activeTab === 'pending' && appt.status !== 'pending') return false;

      // 2. Search Filter (Doctor Name or Specialization)
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const docName = appt.doctorId?.userId?.name?.toLowerCase() || '';
        const spec = appt.doctorId?.specialization?.name?.toLowerCase() || '';
        if (!docName.includes(query) && !spec.includes(query)) return false;
      }

      // 3. Consultation Type Filter
      if (consultationType !== 'all' && appt.type !== consultationType) return false;

      return true;
    }).sort((a, b) => {
      // Sort upcoming by soonest first, completed/cancelled by most recent first
      if (activeTab === 'upcoming' || activeTab === 'pending') {
        return new Date(a.date) - new Date(b.date);
      }
      return new Date(b.date) - new Date(a.date);
    });
  }, [appointments, activeTab, searchQuery, consultationType]);

  return (
    <PageTransition className="space-y-6 max-w-7xl mx-auto">

      {/* Header & Quick Stats */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 mb-8">
        <div>
          <h1 className="text-3xl font-heading font-black text-heading mb-2">My Appointments</h1>
          <p className="text-muted">Manage your bookings, consultations, and health schedule.</p>
        </div>
        <div className="flex items-center gap-3 w-full md:w-auto">
          <Button variant="outline" onClick={fetchAppointments} className="shrink-0 bg-white shadow-sm" disabled={loading}>
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-primary' : ''}`} />
          </Button>
          <Link to="/patient/find-doctor" className="w-full md:w-auto">
            <Button variant="primary" className="w-full shadow-md shadow-primary/20">
              Book New Appointment
            </Button>
          </Link>
        </div>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="card p-4 flex items-center gap-4 bg-white shadow-sm border border-slate-100">
          <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center text-blue-600">
            <CalendarIcon className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs text-muted font-medium uppercase tracking-wider">Total</p>
            <p className="text-xl font-bold text-heading">{stats.total}</p>
          </div>
        </div>
        <div className="card p-4 flex items-center gap-4 bg-white shadow-sm border border-slate-100">
          <div className="w-10 h-10 rounded-full bg-indigo-50 flex items-center justify-center text-indigo-600">
            <Clock className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs text-muted font-medium uppercase tracking-wider">Upcoming</p>
            <p className="text-xl font-bold text-heading">{stats.upcoming}</p>
          </div>
        </div>
        <div className="card p-4 flex items-center gap-4 bg-white shadow-sm border border-slate-100">
          <div className="w-10 h-10 rounded-full bg-emerald-50 flex items-center justify-center text-emerald-600">
            <CheckCircle className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs text-muted font-medium uppercase tracking-wider">Completed</p>
            <p className="text-xl font-bold text-heading">{stats.completed}</p>
          </div>
        </div>
        <div className="card p-4 flex items-center gap-4 bg-white shadow-sm border border-slate-100">
          <div className="w-10 h-10 rounded-full bg-red-50 flex items-center justify-center text-red-600">
            <XCircle className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs text-muted font-medium uppercase tracking-wider">Cancelled</p>
            <p className="text-xl font-bold text-heading">{stats.cancelled}</p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-border overflow-hidden">
        {/* Navigation & Filters Bar */}
        <div className="border-b border-border bg-slate-50/50">
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center">

            {/* Tabs */}
            <div className="flex overflow-x-auto custom-scrollbar w-full lg:w-auto px-2">
              {STATUS_TABS.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`whitespace-nowrap py-4 px-6 font-semibold text-sm transition-colors border-b-2 ${activeTab === tab.id
                    ? 'border-primary text-primary bg-primary/5 rounded-t-lg'
                    : 'border-transparent text-slate-500 hover:text-heading hover:border-border'
                    }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Actions Toggle */}
            <div className="w-full lg:w-auto p-3 lg:p-0 lg:pr-4 flex justify-end border-t lg:border-t-0 border-border">
              <Button variant="ghost" size="sm" onClick={() => setShowFilters(!showFilters)} className={`text-slate-600 ${showFilters ? 'bg-slate-200' : ''}`}>
                <SlidersHorizontal className="w-4 h-4 mr-2" /> Filters
              </Button>
            </div>
          </div>

          {/* Advanced Filters Drawer */}
          {showFilters && (
            <div className="p-4 bg-white border-t border-border grid grid-cols-1 sm:grid-cols-2 gap-4 animate-in slide-in-from-top-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" />
                <input
                  type="text"
                  placeholder="Search by doctor or specialization..."
                  className="input-base w-full pl-9 bg-slate-50 border-slate-200"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <div className="relative">
                <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" />
                <select
                  className="input-base w-full pl-9 bg-slate-50 border-slate-200 appearance-none"
                  value={consultationType}
                  onChange={(e) => setConsultationType(e.target.value)}
                >
                  <option value="all">All Consultation Types</option>
                  <option value="video">Video Consult</option>
                  <option value="in-person">In-Person Visit</option>
                </select>
              </div>
            </div>
          )}
        </div>

        {/* List */}
        <div className="p-4 sm:p-6 bg-slate-50/30">
          {loading ? (
            <div className="space-y-4">
              {[1, 2, 3].map(i => <div key={i} className="card p-6 h-36 skeleton rounded-2xl" />)}
            </div>
          ) : filteredAppointments.length === 0 ? (
            <div className="py-16 text-center">
              <div className="w-20 h-20 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-5 shadow-sm">
                <CalendarIcon className="w-10 h-10 text-blue-300" />
              </div>
              <h3 className="text-xl font-bold text-heading mb-2">No appointments found</h3>
              <p className="text-muted max-w-md mx-auto mb-6">
                You don't have any {activeTab !== 'all' ? activeTab : ''} appointments matching your criteria.
              </p>
              {activeTab === 'upcoming' && (
                <Link to="/patient/find-doctor">
                  <Button variant="primary">Book an Appointment</Button>
                </Link>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              {filteredAppointments.map((appt) => (
                <div key={appt._id} className="bg-white rounded-2xl p-0 overflow-hidden border border-border shadow-sm hover:shadow-md transition-shadow flex flex-col md:flex-row group">

                  {/* Date Block */}
                  <div className="bg-slate-50/80 p-6 flex flex-col items-center justify-center min-w-[140px] border-b md:border-b-0 md:border-r border-border group-hover:bg-slate-100/50 transition-colors">
                    <span className="text-sm font-bold text-slate-500 uppercase tracking-widest mb-1">
                      {new Date(appt.date).toLocaleString('default', { month: 'short' })}
                    </span>
                    <span className="text-4xl font-black text-heading leading-none mb-1">
                      {new Date(appt.date).getDate()}
                    </span>
                    <span className="text-sm font-semibold text-primary flex items-center mt-2 bg-white px-2 py-1 rounded-md shadow-sm border border-slate-200">
                      <Clock className="w-3.5 h-3.5 mr-1.5" />
                      {formatSlotTime(appt.slotTime)}
                    </span>
                  </div>

                  {/* Details */}
                  <div className="p-6 flex-1 flex flex-col sm:flex-row justify-between gap-6">
                    <div className="flex-1">
                      <div className="flex flex-wrap items-center gap-3 mb-2">
                        <h3 className="text-xl font-bold text-heading">Dr. {appt.doctorId?.userId?.name}</h3>
                        <Badge variant={
                          appt.status === 'confirmed' ? 'success' :
                            appt.status === 'pending' ? 'warning' :
                              appt.status === 'completed' ? 'neutral' :
                                appt.status === 'cancelled' ? 'danger' : 'neutral'
                        } className="capitalize px-3">
                          {appt.status}
                        </Badge>
                      </div>

                      <p className="text-primary font-medium mb-4 flex items-center">
                        {appt.doctorId?.specialization?.name || 'Specialist'}
                      </p>

                      <div className="flex flex-wrap gap-4 text-sm text-slate-600 bg-slate-50 inline-flex p-2 rounded-lg border border-slate-100">
                        <div className="flex items-center font-medium">
                          {appt.type === 'video' ? (
                            <><Video className="w-4 h-4 mr-2 text-blue-500" /> Video Consult</>
                          ) : (
                            <><MapPin className="w-4 h-4 mr-2 text-emerald-500" /> Clinic Visit</>
                          )}
                        </div>
                        <div className="hidden sm:block w-px bg-slate-300"></div>
                        <div className="flex items-center font-medium text-slate-800">
                          Fee: ${appt.fees}
                        </div>
                      </div>

                      {appt.status === 'cancelled' && appt.cancelReason && (
                        <div className="mt-3 p-3 bg-red-50 border border-red-100 rounded-lg flex items-start gap-2">
                          <AlertCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
                          <div>
                            <p className="text-sm font-bold text-red-700">Appointment Cancelled/Rejected</p>
                            <p className="text-xs text-red-600 mt-0.5">Reason: {appt.cancelReason}</p>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="flex flex-col items-center justify-center sm:items-end gap-3 min-w-[140px] pt-4 sm:pt-0 border-t sm:border-t-0 border-border">
                      <Link to={`/patient/appointments/${appt._id}`} className="w-full">
                        <Button variant="outline" className="w-full shadow-sm hover:border-slate-300">
                          View Details <ExternalLink className="w-4 h-4 ml-2" />
                        </Button>
                      </Link>

                      {(appt.status === 'pending' || appt.status === 'confirmed') && (
                        <Button
                          variant="ghost"
                          className="text-red-500 hover:text-red-700 hover:bg-red-50 w-full"
                          onClick={() => handleCancel(appt._id)}
                        >
                          Cancel Booking
                        </Button>
                      )}

                      {appt.status === 'completed' && !appt.isReviewed && (
                        <Button variant="primary" className="w-full shadow-sm shadow-primary/20">
                          Leave Review
                        </Button>
                      )}

                      {(appt.status === 'completed' || appt.status === 'cancelled') && (
                        <Link to={`/patient/find-doctor/${appt.doctorId?._id}`} className="w-full mt-auto">
                          <Button variant="ghost" className="w-full text-slate-600 hover:text-primary hover:bg-primary/5 text-sm">
                            Rebook Doctor
                          </Button>
                        </Link>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </PageTransition>
  );
};

export default MyAppointments;

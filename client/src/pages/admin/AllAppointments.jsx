import { useState, useEffect } from 'react';
import { Search, Calendar, Clock, Video, Navigation, MoreVertical, CheckCircle, ListTodo, XCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import { Link } from 'react-router-dom';
import PageTransition from '../../components/common/PageTransition';
import adminService from '../../services/adminService';
import appointmentService from '../../services/appointmentService';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import { formatDate } from '../../utils/format';
import Avatar from '../../components/common/Avatar';

const AllAppointments = () => {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    fetchAppointments();
  }, []);

  const fetchAppointments = async () => {
    setLoading(true);
    try {
      const { data } = await adminService.getAllAppointments();
      setAppointments(data.appointments || []);
    } catch (error) {
      toast.error('Failed to fetch appointments');
    } finally {
      setLoading(false);
    }
  };

  const handleCancelAppointment = async (id) => {
    if (!window.confirm('Are you sure you want to cancel this appointment?')) return;
    try {
      await appointmentService.cancel(id, 'Cancelled by Admin');
      toast.success('Appointment cancelled successfully');
      fetchAppointments();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to cancel appointment');
    }
  };

  const filteredAppointments = appointments.filter(appt => {
    const term = searchTerm.toLowerCase();
    const patientName = appt.patientId?.name?.toLowerCase() || '';
    const doctorName = appt.doctorId?.userId?.name?.toLowerCase() || '';

    const matchesSearch = patientName.includes(term) || doctorName.includes(term);

    if (!matchesSearch) return false;

    if (filter === 'all') return true;
    return appt.status === filter;
  });

  const getStatusBadge = (status) => {
    switch (status) {
      case 'completed': return <Badge variant="success">Completed</Badge>;
      case 'confirmed': return <Badge variant="primary">Confirmed</Badge>;
      case 'pending': return <Badge variant="warning">Pending</Badge>;
      case 'cancelled': return <Badge variant="danger">Cancelled</Badge>;
      default: return <Badge variant="neutral">{status}</Badge>;
    }
  };

  const totalAppointments = appointments.length;
  const upcomingAppointments = appointments.filter(a => ['confirmed', 'pending'].includes(a.status)).length;
  const completedAppointments = appointments.filter(a => a.status === 'completed').length;
  const cancelledAppointments = appointments.filter(a => a.status === 'cancelled').length;

  return (
    <PageTransition className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-h2 font-heading text-heading">Appointments</h1>
          <p className="text-muted mt-1">Monitor platform-wide consultation schedules.</p>
        </div>
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <div className="relative flex-1 sm:w-64">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
            <input
              type="text"
              placeholder="Search patient or doctor..."
              className="input-base pl-10 w-full"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <select
            className="input-base w-32"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
          >
            <option value="all">All Status</option>
            <option value="pending">Pending</option>
            <option value="confirmed">Confirmed</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>
      </div>

      {/* Stats Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-2xl p-6 border border-border shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
            <ListTodo className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm font-medium text-slate-500">Total Bookings</p>
            <h3 className="text-2xl font-bold text-slate-800">{totalAppointments}</h3>
          </div>
        </div>
        <div className="bg-white rounded-2xl p-6 border border-border shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
            <Clock className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm font-medium text-slate-500">Upcoming</p>
            <h3 className="text-2xl font-bold text-slate-800">{upcomingAppointments}</h3>
          </div>
        </div>
        <div className="bg-white rounded-2xl p-6 border border-border shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <CheckCircle className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm font-medium text-slate-500">Completed</p>
            <h3 className="text-2xl font-bold text-slate-800">{completedAppointments}</h3>
          </div>
        </div>
        <div className="bg-white rounded-2xl p-6 border border-border shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-red-50 text-red-600 flex items-center justify-center">
            <XCircle className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm font-medium text-slate-500">Cancelled</p>
            <h3 className="text-2xl font-bold text-slate-800">{cancelledAppointments}</h3>
          </div>
        </div>

      </div>

      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="bg-surface text-muted border-b border-border">
              <tr>
                <th className="px-6 py-4 font-medium">Patient</th>
                <th className="px-6 py-4 font-medium">Doctor</th>
                <th className="px-6 py-4 font-medium">Date & Time</th>
                <th className="px-6 py-4 font-medium">Type</th>
                <th className="px-6 py-4 font-medium">Status</th>
                <th className="px-6 py-4 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {loading ? (
                <tr>
                  <td colSpan="6" className="px-6 py-12 text-center">
                    <span className="loader"></span>
                  </td>
                </tr>
              ) : filteredAppointments.length === 0 ? (
                <tr>
                  <td colSpan="6" className="px-6 py-12 text-center text-muted">
                    No appointments found matching your criteria.
                  </td>
                </tr>
              ) : (
                filteredAppointments.map((appt) => (
                  <tr key={appt._id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <Avatar
                          src={appt.patientId?.avatar?.url || appt.patientId?.avatar}
                          name={appt.patientId?.name || 'P'}
                          role="patient"
                          size="sm"
                        />
                        <div>
                          <Link to={`/admin/patients/${appt.patientId?._id}`} className="font-semibold text-heading hover:text-primary hover:underline transition-colors">
                            {appt.patientId?.name || 'Unknown Patient'}
                          </Link>
                          <div className="text-xs text-muted">{appt.patientId?.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <Avatar
                          src={appt.doctorId?.userId?.avatar?.url || appt.doctorId?.userId?.avatar}
                          name={appt.doctorId?.userId?.name || 'D'}
                          role="doctor"
                          size="sm"
                        />
                        <div>
                          <Link to={`/admin/doctors/${appt.doctorId?.userId?._id}`} className="font-semibold text-heading hover:text-primary hover:underline transition-colors">
                            Dr. {appt.doctorId?.userId?.name || 'Unknown Doctor'}
                          </Link>
                          <div className="text-xs text-muted">{appt.doctorId?.specialization?.name || 'Specialist'}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1 text-heading">
                        <Calendar className="w-3.5 h-3.5 text-muted" />
                        {formatDate(appt.date)}
                      </div>
                      <div className="flex items-center gap-1 text-xs text-muted mt-1">
                        <Clock className="w-3.5 h-3.5" />
                        {appt.slotTime || 'TBD'} {appt.slotEndTime ? `- ${appt.slotEndTime}` : ''}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {appt.type === 'video-consultation' ? (
                        <span className="flex items-center text-blue-600 bg-blue-50 px-2.5 py-1 rounded-full text-xs font-medium w-max">
                          <Video className="w-3 h-3 mr-1" /> Video
                        </span>
                      ) : (
                        <span className="flex items-center text-purple-600 bg-purple-50 px-2.5 py-1 rounded-full text-xs font-medium w-max">
                          <Navigation className="w-3 h-3 mr-1" /> In-person
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      {getStatusBadge(appt.status)}
                    </td>
                    <td className="px-6 py-4 text-right">
                      {appt.status !== 'cancelled' && appt.status !== 'completed' ? (
                        <Button
                          variant="ghost"
                          className="w-8 h-8 p-0 text-red-500 hover:bg-red-50 hover:text-red-600"
                          onClick={() => handleCancelAppointment(appt._id)}
                          title="Cancel Appointment"
                        >
                          <XCircle className="w-4 h-4" />
                        </Button>
                      ) : (
                        <span className="text-xs text-muted italic">No actions</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        <div className="p-4 border-t border-border bg-surface text-sm text-muted flex justify-between items-center">
          <span>Showing {filteredAppointments.length} appointments</span>
        </div>
      </div>
    </PageTransition>
  );
};

export default AllAppointments;

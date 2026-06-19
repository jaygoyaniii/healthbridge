import { useState, useEffect, useContext, useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  Calendar, Users, Bell, FileText, Settings, Video, CheckCircle,
  Clock, Activity, ChevronRight, Stethoscope, MessageSquare, Plus,
  AlertCircle
} from 'lucide-react';
import toast from 'react-hot-toast';
import { AuthContext } from '../../context/AuthContext';
import PageTransition from '../../components/common/PageTransition';
import appointmentService from '../../services/appointmentService';
import notificationService from '../../services/notificationService';
import { timeAgo, formatDate } from '../../utils/format';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import api from '../../services/api';
import { calculateDoctorProfileCompleteness } from '../../utils/profileUtils';
import Avatar from '../../components/common/Avatar';

const QUICK_ACTIONS = [
  { label: 'View Schedule', icon: Calendar, link: '/doctor/appointments', color: 'bg-blue-50 text-blue-600 border-blue-100 hover:bg-blue-100 hover:border-blue-200' },
  { label: 'My Patients', icon: Users, link: '/doctor/patients', color: 'bg-emerald-50 text-emerald-600 border-emerald-100 hover:bg-emerald-100 hover:border-emerald-200' },
  { label: 'Prescriptions', icon: FileText, link: '/doctor/prescriptions', color: 'bg-purple-50 text-purple-600 border-purple-100 hover:bg-purple-100 hover:border-purple-200' },
  { label: 'Messages', icon: MessageSquare, link: '/doctor/chat', color: 'bg-orange-50 text-orange-600 border-orange-100 hover:bg-orange-100 hover:border-orange-200' },
];

const DoctorHome = () => {
  const { user, updateUser } = useContext(AuthContext);

  const [appointments, setAppointments] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);

  useEffect(() => {
    fetchDashboardData();
  }, [user?._id]);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const [apptsRes, notifRes, meRes] = await Promise.all([
        appointmentService.getAppointments({ limit: 10, sort: 'date', order: 'asc' }), // Fetch recent/upcoming
        notificationService.getNotifications({ limit: 5 }),
        api.get('/auth/me')
      ]);

      setAppointments(apptsRes.data.appointments || []);
      setNotifications(notifRes.data.notifications || []);
      if (meRes.data?.user) {
        updateUser(meRes.data.user);
      }
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
      toast.error('Could not load some dashboard modules.');
    } finally {
      setLoading(false);
    }
  };

  const toggleAvailability = async () => {
    setIsUpdatingStatus(true);
    try {
      // Assuming a generic user update endpoint exists for status
      const { data } = await api.put('/auth/profile', {
        isActive: !user.isActive
      });
      updateUser({ isActive: data.user.isActive });
      toast.success(data.user.isActive ? 'You are now marked as available.' : 'You are now marked as away.');
    } catch (error) {
      toast.error('Failed to update status');
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  // Derived Stats
  const stats = useMemo(() => {
    const todayStr = new Date().toDateString();
    let todayCount = 0;
    let pendingCount = 0;

    appointments.forEach(apt => {
      const isToday = new Date(apt.date).toDateString() === todayStr;
      if (isToday && apt.status === 'confirmed') todayCount++;
      if (apt.status === 'pending') pendingCount++;
    });

    const unreadNotifications = notifications.filter(n => !n.isRead).length;

    return { todayCount, pendingCount, unreadNotifications };
  }, [appointments, notifications]);

  const upcomingAppointments = useMemo(() => {
    return appointments
      .filter(apt => apt.status === 'confirmed' || apt.status === 'pending')
      .filter(apt => new Date(apt.date) >= new Date())
      .slice(0, 4);
  }, [appointments]);

  const recentPatients = useMemo(() => {
    // Extract unique recent patients from appointments
    const patientsMap = new Map();
    appointments
      .filter(apt => apt.status === 'completed' && apt.patientId)
      .sort((a, b) => new Date(b.date) - new Date(a.date))
      .forEach(apt => {
        if (!patientsMap.has(apt.patientId._id)) {
          patientsMap.set(apt.patientId._id, apt);
        }
      });
    return Array.from(patientsMap.values()).slice(0, 3);
  }, [appointments]);

  // Profile Completion logic uses shared source of truth
  const doctor = user?.doctorProfile || {};
  const completionRate = calculateDoctorProfileCompleteness(user, doctor);

  const isMaintenanceMode = localStorage.getItem('maintenanceMode') === 'true';

  return (
    <PageTransition className="max-w-7xl mx-auto space-y-6">
      {isMaintenanceMode && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5 flex items-start gap-4">
          <div className="w-12 h-12 rounded-full bg-amber-100 flex items-center justify-center text-amber-600 shrink-0">
            <AlertCircle className="w-6 h-6" />
          </div>
          <div>
            <h3 className="font-bold text-amber-900 text-lg">Booking Services Suspended (Maintenance Mode)</h3>
            <p className="text-amber-800 mt-1 max-w-4xl">
              New appointment bookings are temporarily unavailable due to system maintenance. You will not receive new bookings until maintenance is complete. Existing records and schedules remain unaffected.
            </p>
          </div>
        </div>
      )}

      {/* Welcome Section */}
      <div className="bg-gradient-to-r from-blue-900 to-indigo-800 rounded-2xl p-8 text-white shadow-lg relative overflow-hidden">
        {/* Abstract Background Element */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-white opacity-5 rounded-full -translate-y-1/2 translate-x-1/4 blur-2xl"></div>

        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="flex items-center gap-5">
            <Avatar
              src={user?.avatar?.url}
              name={user?.name}
              role="doctor"
              className="w-20 h-20 border-4 border-white/20 shrink-0 text-2xl"
            />
            <div>
              <h1 className="text-3xl font-black mb-1">Welcome back, Dr. {user?.name?.split(' ')[0] || 'Doctor'}</h1>
              <div className="flex flex-wrap items-center gap-3 text-blue-100 font-medium text-sm">
                <span className="flex items-center"><Stethoscope className="w-4 h-4 mr-1" /> {doctor.specialization?.name || 'General Practitioner'}</span>
                <span className="hidden sm:inline text-blue-300">•</span>
                <span className="flex items-center"><Calendar className="w-4 h-4 mr-1" /> {formatDate(new Date())}</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-4 bg-white/10 backdrop-blur-sm p-4 rounded-xl border border-white/10">
            <div>
              <p className="text-xs text-blue-200 font-semibold uppercase tracking-wider mb-1">Current Status</p>
              <div className="flex items-center gap-2">
                <div className={`w-3 h-3 rounded-full ${user?.isActive ? 'bg-emerald-400 shadow-[0_0_10px_rgba(52,211,153,0.5)]' : 'bg-slate-400'}`}></div>
                <span className="font-bold">{user?.isActive ? 'Available Online' : 'Away / Offline'}</span>
              </div>
            </div>
            <div className="w-px h-10 bg-white/20 mx-2"></div>
            <Button
              variant="outline"
              onClick={toggleAvailability}
              disabled={isUpdatingStatus}
              className="bg-transparent border-white/30 text-white hover:bg-white/20 hover:border-white/50 h-9 px-4"
            >
              Toggle
            </Button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Left Column (Main Content) */}
        <div className="lg:col-span-2 space-y-6">

          {/* Quick Stats Overview */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="bg-white p-5 rounded-2xl border border-border shadow-sm flex flex-col justify-between">
              <div className="w-10 h-10 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center mb-4">
                <Calendar className="w-5 h-5" />
              </div>
              <div>
                <p className="text-2xl font-black text-heading leading-none">{stats.todayCount}</p>
                <p className="text-xs font-semibold text-slate-500 uppercase mt-1">Today's Visits</p>
              </div>
            </div>
            <div className="bg-white p-5 rounded-2xl border border-border shadow-sm flex flex-col justify-between">
              <div className="w-10 h-10 rounded-full bg-amber-50 text-amber-600 flex items-center justify-center mb-4">
                <Clock className="w-5 h-5" />
              </div>
              <div>
                <p className="text-2xl font-black text-heading leading-none">{stats.pendingCount}</p>
                <p className="text-xs font-semibold text-slate-500 uppercase mt-1">Pending Requests</p>
              </div>
            </div>
            <div className="bg-white p-5 rounded-2xl border border-border shadow-sm flex flex-col justify-between">
              <div className="w-10 h-10 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center mb-4">
                <Bell className="w-5 h-5" />
              </div>
              <div>
                <p className="text-2xl font-black text-heading leading-none">{stats.unreadNotifications}</p>
                <p className="text-xs font-semibold text-slate-500 uppercase mt-1">Unread Alerts</p>
              </div>
            </div>
            <div className="bg-white p-5 rounded-2xl border border-border shadow-sm flex flex-col justify-between">
              <div className="w-10 h-10 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mb-4">
                <Users className="w-5 h-5" />
              </div>
              <div>
                <p className="text-2xl font-black text-heading leading-none">{recentPatients.length}</p>
                <p className="text-xs font-semibold text-slate-500 uppercase mt-1">Recent Patients</p>
              </div>
            </div>
          </div>

          {/* Quick Actions Grid */}
          <div className="bg-white rounded-2xl border border-border shadow-sm p-6">
            <h3 className="text-lg font-bold text-heading mb-4">Quick Actions</h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {QUICK_ACTIONS.map((action, idx) => {
                const Icon = action.icon;
                return (
                  <Link
                    key={idx}
                    to={action.link}
                    className={`flex flex-col items-center justify-center p-4 rounded-xl border transition-all ${action.color} group`}
                  >
                    <Icon className="w-6 h-6 mb-2 group-hover:scale-110 transition-transform" />
                    <span className="text-sm font-semibold">{action.label}</span>
                  </Link>
                )
              })}
            </div>
          </div>

          {/* Upcoming Appointments Preview */}
          <div className="bg-white rounded-2xl border border-border shadow-sm overflow-hidden">
            <div className="p-5 border-b border-border flex items-center justify-between bg-slate-50/50">
              <h3 className="text-lg font-bold text-heading flex items-center">
                <Calendar className="w-5 h-5 mr-2 text-primary" /> Upcoming Appointments
              </h3>
              <Link to="/doctor/appointments" className="text-sm font-semibold text-primary hover:text-primary-dark flex items-center">
                View All <ChevronRight className="w-4 h-4 ml-0.5" />
              </Link>
            </div>
            <div className="divide-y divide-border">
              {loading ? (
                <div className="p-6 space-y-4">
                  {[1, 2].map(i => <div key={i} className="h-16 skeleton rounded-xl" />)}
                </div>
              ) : upcomingAppointments.length === 0 ? (
                <div className="p-8 text-center">
                  <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-3">
                    <Calendar className="w-8 h-8 text-slate-300" />
                  </div>
                  <p className="font-semibold text-heading">No upcoming appointments</p>
                  <p className="text-sm text-muted">Your schedule is clear for now.</p>
                </div>
              ) : (
                upcomingAppointments.map(apt => (
                  <div key={apt._id} className="p-5 hover:bg-slate-50 transition-colors flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center font-bold text-lg shrink-0">
                        {apt.patientId?.name?.charAt(0) || 'P'}
                      </div>
                      <div>
                        <h4 className="font-bold text-heading">{apt.patientId?.name || 'Unknown Patient'}</h4>
                        <div className="flex flex-wrap items-center gap-3 text-xs font-medium text-slate-500 mt-1">
                          <span className="flex items-center"><Clock className="w-3.5 h-3.5 mr-1" /> {formatDate(apt.date)} • {apt.slotTime}</span>
                          <span className="flex items-center capitalize"><Video className="w-3.5 h-3.5 mr-1" /> {apt.type.replace('-', ' ')}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 w-full sm:w-auto">
                      <Badge variant={apt.status === 'confirmed' ? 'success' : 'warning'} className="capitalize">
                        {apt.status}
                      </Badge>
                      <Link to={`/doctor/appointments`} className="w-full sm:w-auto">
                        <Button variant="outline" className="w-full sm:w-auto text-xs h-8">Details</Button>
                      </Link>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

        </div>

        {/* Right Column (Widgets) */}
        <div className="space-y-6">

          {/* Profile Completion Widget */}
          {completionRate < 100 ? (
            <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-2xl border border-amber-100 shadow-sm p-6 relative overflow-hidden">
              <div className="absolute top-0 right-0 p-4 opacity-10"><AlertCircle className="w-24 h-24 text-amber-500" /></div>
              <h3 className="font-bold text-amber-900 mb-2 relative z-10">Complete Your Profile</h3>
              <p className="text-sm text-amber-700 mb-4 relative z-10">A complete profile increases patient trust and bookings.</p>

              <div className="mb-4 relative z-10">
                <div className="flex justify-between text-xs font-bold text-amber-800 mb-1">
                  <span>Progress</span>
                  <span>{completionRate}%</span>
                </div>
                <div className="w-full bg-amber-200/50 rounded-full h-2">
                  <div className="bg-amber-500 h-2 rounded-full transition-all duration-1000" style={{ width: `${completionRate}%` }}></div>
                </div>
              </div>

              <Link to="/doctor/profile" className="relative z-10">
                <Button variant="primary" className="w-full bg-amber-600 hover:bg-amber-700 shadow-amber-600/20 text-sm h-9">
                  Complete Profile
                </Button>
              </Link>
            </div>
          ) : (
            <div className="bg-gradient-to-br from-emerald-50 to-teal-50 rounded-2xl border border-emerald-100 shadow-sm p-6 relative overflow-hidden">
              <div className="absolute top-0 right-0 p-4 opacity-10"><CheckCircle className="w-24 h-24 text-emerald-500" /></div>
              <h3 className="font-bold text-emerald-900 mb-2 relative z-10 flex items-center">
                <CheckCircle className="w-5 h-5 mr-2 text-emerald-600" /> Profile Complete
              </h3>
              <p className="text-sm text-emerald-700 relative z-10">Your profile is fully completed and ready for patients. Great job!</p>
            </div>
          )}

          {/* Recent Patients */}
          <div className="bg-white rounded-2xl border border-border shadow-sm">
            <div className="p-5 border-b border-border flex items-center justify-between">
              <h3 className="font-bold text-heading">Recent Patients</h3>
              <Link to="/doctor/patients" className="text-sm font-semibold text-primary hover:text-primary-dark">View All</Link>
            </div>
            <div className="p-2">
              {loading ? (
                <div className="p-4 space-y-3">
                  {[1, 2].map(i => <div key={i} className="h-12 skeleton rounded-xl" />)}
                </div>
              ) : recentPatients.length === 0 ? (
                <div className="p-6 text-center text-slate-500 text-sm">No recent patients found.</div>
              ) : (
                recentPatients.map(apt => (
                  <Link key={apt._id} to="/doctor/patients" className="flex items-center gap-3 p-3 hover:bg-slate-50 rounded-xl transition-colors">
                    <div className="w-10 h-10 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold text-sm shrink-0">
                      {apt.patientId?.name?.charAt(0) || 'P'}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-bold text-heading text-sm truncate">{apt.patientId?.name}</p>
                      <p className="text-xs text-muted truncate">Last visit: {formatDate(apt.date)}</p>
                    </div>
                    <ChevronRight className="w-4 h-4 text-slate-400" />
                  </Link>
                ))
              )}
            </div>
          </div>

          {/* Notifications Preview */}
          <div className="bg-white rounded-2xl border border-border shadow-sm">
            <div className="p-5 border-b border-border flex items-center justify-between">
              <h3 className="font-bold text-heading">Recent Alerts</h3>
              <Link to="/doctor/notifications" className="text-sm font-semibold text-primary hover:text-primary-dark">View All</Link>
            </div>
            <div className="p-2">
              {loading ? (
                <div className="p-4 space-y-3">
                  {[1, 2].map(i => <div key={i} className="h-16 skeleton rounded-xl" />)}
                </div>
              ) : notifications.length === 0 ? (
                <div className="p-6 text-center text-slate-500 text-sm">You have no new notifications.</div>
              ) : (
                notifications.slice(0, 3).map(notif => (
                  <div key={notif._id} className={`p-3 rounded-xl mb-1 flex items-start gap-3 ${!notif.isRead ? 'bg-blue-50/50 border border-blue-100' : 'hover:bg-slate-50 border border-transparent'}`}>
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${!notif.isRead ? 'bg-blue-100 text-blue-600' : 'bg-slate-100 text-slate-500'}`}>
                      <Bell className="w-4 h-4" />
                    </div>
                    <div>
                      <p className={`text-sm ${!notif.isRead ? 'font-bold text-slate-800' : 'font-medium text-slate-600'}`}>{notif.title}</p>
                      <p className="text-xs text-slate-500 line-clamp-1 mt-0.5">{notif.message}</p>
                      <p className="text-[10px] text-slate-400 font-medium mt-1">{timeAgo(notif.createdAt)}</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

        </div>
      </div>

    </PageTransition>
  );
};

export default DoctorHome;

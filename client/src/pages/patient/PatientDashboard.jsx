import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Calendar, Clock, FileText, ChevronRight, Activity, Search,
  CheckCircle, XCircle, Clock4, Pill, TrendingUp
} from 'lucide-react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar
} from 'recharts';
import toast from 'react-hot-toast';
import PageTransition from '../../components/common/PageTransition';
import appointmentService from '../../services/appointmentService';
import prescriptionService from '../../services/prescriptionService';
import medicalService from '../../services/medicalService';
import { useAuth } from '../../hooks/useAuth';
import { formatDate, formatSlotTime } from '../../utils/format';
import Badge from '../../components/ui/Badge';
import Button from '../../components/ui/Button';
import Avatar from '../../components/common/Avatar';

const PatientDashboard = () => {
  const { user } = useAuth();
  const [appointments, setAppointments] = useState([]);
  const [stats, setStats] = useState({
    total: 0,
    upcoming: 0,
    completed: 0,
    cancelled: 0,
    pending: 0
  });
  const [recordsCount, setRecordsCount] = useState(0);
  const [prescriptionsCount, setPrescriptionsCount] = useState(0);
  const [chartData, setChartData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const results = await Promise.allSettled([
        appointmentService.getAppointments({ limit: 100 }), // Fetch recent history
        prescriptionService.getPrescriptions({ limit: 50 }),
        medicalService.getRecords({ limit: 50 })
      ]);

      const apptsRes = results[0].status === 'fulfilled' ? results[0].value : { data: { appointments: [] } };
      const presRes = results[1].status === 'fulfilled' ? results[1].value : { data: { prescriptions: [] } };
      const recordsRes = results[2].status === 'fulfilled' ? results[2].value : { data: { records: [] } };

      if (results[0].status === 'rejected') console.error('Appointments API failed:', results[0].reason);
      if (results[1].status === 'rejected') console.error('Prescriptions API failed:', results[1].reason);
      if (results[2].status === 'rejected') console.error('Medical Records API failed:', results[2].reason);

      const appts = apptsRes.data.appointments || [];
      setAppointments(appts);
      setPrescriptionsCount(presRes.data.prescriptions?.length || 0);
      setRecordsCount(recordsRes.data.records?.length || 0);

      processStatsAndCharts(appts);

      if (results.some(r => r.status === 'rejected')) {
        toast.error('Some dashboard widgets could not be loaded.');
      }
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
      toast.error('Could not load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const processStatsAndCharts = (appts) => {
    let upcoming = 0, completed = 0, cancelled = 0, pending = 0;
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Create an array for the last 6 months to ensure chronological order in the chart
    const last6Months = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date();
      d.setMonth(d.getMonth() - i);
      last6Months.push({
        month: d.toLocaleString('default', { month: 'short' }),
        year: d.getFullYear(),
        appointments: 0
      });
    }

    appts.forEach(appt => {
      const apptDate = new Date(appt.date);

      // Calculate Stats
      if (appt.status === 'completed') completed++;
      else if (appt.status === 'cancelled') cancelled++;
      else if (appt.status === 'pending') pending++;
      else if (appt.status === 'confirmed') {
        if (apptDate >= today) upcoming++;
      }

      // Populate Chart Data
      const monthName = apptDate.toLocaleString('default', { month: 'short' });
      const year = apptDate.getFullYear();

      const monthData = last6Months.find(m => m.month === monthName && m.year === year);
      if (monthData) {
        monthData.appointments++;
      }
    });

    setStats({ total: appts.length, upcoming, completed, cancelled, pending });
    setChartData(last6Months);
  };

  const recentAppointments = appointments
    .filter(a => a.status === 'completed' || a.status === 'cancelled')
    .slice(0, 5);

  const upcomingAppointments = appointments
    .filter(a => (a.status === 'confirmed' || a.status === 'pending') && new Date(a.date) >= new Date(new Date().setHours(0, 0, 0, 0)))
    .sort((a, b) => new Date(a.date) - new Date(b.date))
    .slice(0, 3);

  return (
    <PageTransition className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-h2 font-heading text-heading">My Dashboard</h1>
          <p className="text-muted mt-1">Overview of your healthcare activities and appointments.</p>
        </div>
        <div className="flex gap-3">
          <Link to="/patient/records">
            <Button variant="outline" className="bg-white">
              <FileText className="w-4 h-4 mr-2" /> Upload Record
            </Button>
          </Link>
          <Link to="/patient/find-doctor">
            <Button variant="primary">
              <Search className="w-4 h-4 mr-2" /> Find Doctor
            </Button>
          </Link>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center p-12"><span className="loader"></span></div>
      ) : (
        <>
          {/* KPI Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="card p-5 hover:-translate-y-1 transition-transform">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center text-blue-600">
                  <Calendar className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-sm text-muted font-medium">Upcoming</p>
                  <p className="text-2xl font-bold text-heading">{stats.upcoming}</p>
                </div>
              </div>
            </div>
            <div className="card p-5 hover:-translate-y-1 transition-transform">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-emerald-100 flex items-center justify-center text-emerald-600">
                  <CheckCircle className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-sm text-muted font-medium">Completed</p>
                  <p className="text-2xl font-bold text-heading">{stats.completed}</p>
                </div>
              </div>
            </div>
            <div className="card p-5 hover:-translate-y-1 transition-transform">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-purple-100 flex items-center justify-center text-purple-600">
                  <FileText className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-sm text-muted font-medium">Medical Records</p>
                  <p className="text-2xl font-bold text-heading">{recordsCount}</p>
                </div>
              </div>
            </div>
            <div className="card p-5 hover:-translate-y-1 transition-transform">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-orange-100 flex items-center justify-center text-orange-600">
                  <Pill className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-sm text-muted font-medium">Prescriptions</p>
                  <p className="text-2xl font-bold text-heading">{prescriptionsCount}</p>
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left Column (2/3 width on large screens) */}
            <div className="lg:col-span-2 space-y-6">

              {/* Chart */}
              <div className="card p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-lg font-bold text-heading flex items-center">
                    <Activity className="w-5 h-5 mr-2 text-primary" /> Appointment Activity (Last 6 Months)
                  </h2>
                </div>
                <div className="h-[300px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                      <defs>
                        <linearGradient id="colorAppts" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                          <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                      <XAxis dataKey="month" stroke="#94a3b8" tickLine={false} axisLine={false} />
                      <YAxis stroke="#94a3b8" tickLine={false} axisLine={false} allowDecimals={false} />
                      <Tooltip
                        contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                        cursor={{ stroke: '#cbd5e1', strokeWidth: 1, strokeDasharray: '3 3' }}
                      />
                      <Area type="monotone" dataKey="appointments" stroke="#3b82f6" strokeWidth={3} fillOpacity={1} fill="url(#colorAppts)" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Recent History Table */}
              <div className="card overflow-hidden">
                <div className="p-5 border-b border-border flex items-center justify-between bg-surface">
                  <h2 className="text-lg font-bold text-heading">Recent Consultations</h2>
                  <Link to="/patient/appointments" className="text-sm text-primary font-medium hover:underline">
                    View All History
                  </Link>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm whitespace-nowrap">
                    <thead className="bg-white text-muted border-b border-border">
                      <tr>
                        <th className="px-6 py-4 font-medium">Doctor</th>
                        <th className="px-6 py-4 font-medium">Date & Time</th>
                        <th className="px-6 py-4 font-medium">Status</th>
                        <th className="px-6 py-4 font-medium text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {recentAppointments.length > 0 ? (
                        recentAppointments.map((appt) => (
                          <tr key={appt._id} className="hover:bg-slate-50 transition-colors">
                            <td className="px-6 py-4">
                              <div className="flex items-center gap-3">
                                <Avatar
                                  src={appt.doctorId?.userId?.avatar}
                                  name={appt.doctorId?.userId?.name}
                                  role="doctor"
                                  size="sm"
                                />
                                <div>
                                  <div className="font-semibold text-heading">Dr. {appt.doctorId?.userId?.name}</div>
                                  <div className="text-xs text-muted">{appt.doctorId?.specialization?.name}</div>
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4 text-muted">
                              {formatDate(appt.date)} at {formatSlotTime(appt.slotTime)}
                            </td>
                            <td className="px-6 py-4">
                              <Badge variant={appt.status === 'completed' ? 'success' : 'danger'}>
                                {appt.status}
                              </Badge>
                            </td>
                            <td className="px-6 py-4 text-right">
                              <Link to={`/patient/appointments/${appt._id}`}>
                                <Button variant="ghost" className="h-8 text-xs py-0">View Details</Button>
                              </Link>
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan="4" className="px-6 py-8 text-center text-muted">
                            No past consultations found.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

            </div>

            {/* Right Column (1/3 width on large screens) */}
            <div className="space-y-6">

              {/* Upcoming Appointments List */}
              <div className="card overflow-hidden">
                <div className="p-5 border-b border-border flex items-center justify-between">
                  <h2 className="text-lg font-bold text-heading flex items-center">
                    <Clock4 className="w-5 h-5 mr-2 text-primary" /> Up Next
                  </h2>
                </div>
                <div className="divide-y divide-border">
                  {upcomingAppointments.length > 0 ? (
                    upcomingAppointments.map((appt) => (
                      <div key={appt._id} className="p-5 hover:bg-slate-50 transition-colors">
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-3">
                            <Avatar
                              src={appt.doctorId?.userId?.avatar}
                              name={appt.doctorId?.userId?.name}
                              role="doctor"
                              size="md"
                            />
                            <div>
                              <h4 className="font-bold text-heading text-sm">Dr. {appt.doctorId?.userId?.name}</h4>
                              <p className="text-xs text-muted">{appt.doctorId?.specialization?.name}</p>
                            </div>
                          </div>
                          <Badge variant={appt.status === 'confirmed' ? 'success' : 'warning'} className="text-[10px] py-0.5 px-2">
                            {appt.status}
                          </Badge>
                        </div>
                        <div className="bg-white rounded-lg border border-border p-3 text-sm">
                          <div className="flex justify-between items-center text-heading font-medium">
                            <span className="flex items-center text-muted"><Calendar className="w-4 h-4 mr-1.5" /> {formatDate(appt.date)}</span>
                            <span className="flex items-center"><Clock className="w-4 h-4 mr-1.5" /> {formatSlotTime(appt.slotTime)}</span>
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="p-8 text-center text-muted text-sm">
                      <Calendar className="w-10 h-10 mx-auto text-slate-300 mb-2" />
                      No upcoming appointments.
                    </div>
                  )}
                  {upcomingAppointments.length > 0 && (
                    <div className="p-3 bg-surface text-center border-t border-border">
                      <Link to="/patient/appointments" className="text-sm font-medium text-primary hover:underline">
                        View Schedule Schedule <ChevronRight className="inline w-4 h-4" />
                      </Link>
                    </div>
                  )}
                </div>
              </div>

              {/* Status Breakdown */}
              <div className="card p-6">
                <h2 className="text-lg font-bold text-heading mb-4">Activity Summary</h2>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-muted flex items-center"><CheckCircle className="w-4 h-4 mr-2 text-emerald-500" /> Completed</span>
                    <span className="font-bold">{stats.completed}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-muted flex items-center"><Clock4 className="w-4 h-4 mr-2 text-amber-500" /> Pending Approval</span>
                    <span className="font-bold">{stats.pending}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-muted flex items-center"><XCircle className="w-4 h-4 mr-2 text-red-500" /> Cancelled</span>
                    <span className="font-bold">{stats.cancelled}</span>
                  </div>
                </div>
              </div>

            </div>
          </div>
        </>
      )}
    </PageTransition>
  );
};

export default PatientDashboard;

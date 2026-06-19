import { useState, useEffect } from 'react';
import { Users, Activity, DollarSign, Calendar, TrendingUp, Download, Filter, UserCheck } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell, Legend } from 'recharts';
import PageTransition from '../../components/common/PageTransition';
import adminService from '../../services/adminService';
import { formatDate } from '../../utils/format';
import Badge from '../../components/ui/Badge';
import Button from '../../components/ui/Button';

// Dynamic data will be fetched via API

const AdminDashboard = () => {
  const [stats, setStats] = useState(null);
  const [recentAppointments, setRecentAppointments] = useState([]);
  const [revenueHistory, setRevenueHistory] = useState([]);
  const [specialtyData, setSpecialtyData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      adminService.getDashboardStats(),
      adminService.getAnalyticsData('year')
    ])
      .then(([statsRes, analyticsRes]) => {
        setStats(statsRes.data.stats);
        setRecentAppointments(statsRes.data.recentAppointments || []);
        
        // Format trends data for the charts
        const formattedTrends = (analyticsRes.data.trends || []).map(t => {
          let monthStr = t.date;
          if (t.date && t.date.includes('-')) {
            const [year, month] = t.date.split('-');
            const dateObj = new Date(year, parseInt(month) - 1);
            monthStr = dateObj.toLocaleString('default', { month: 'short' });
          }
          return { month: monthStr, revenue: t.revenue, consultations: t.appointments };
        });
        setRevenueHistory(formattedTrends);

        // Map specialty data with colors
        const colors = ['#3b82f6', '#8b5cf6', '#f59e0b', '#10b981', '#ec4899', '#ef4444'];
        const mappedSpecialties = (analyticsRes.data.specializationData || []).map((item, index) => ({
          ...item,
          color: colors[index % colors.length]
        }));
        setSpecialtyData(mappedSpecialties);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return <div className="p-12 text-center"><span className="loader"></span></div>;
  }

  return (
    <PageTransition className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-h2 font-heading text-heading">Analytics Dashboard</h1>
          <p className="text-muted mt-1">Comprehensive system metrics and financial reports.</p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" className="bg-white">
            <Filter className="w-4 h-4 mr-2" /> Filter
          </Button>
          <Button variant="primary">
            <Download className="w-4 h-4 mr-2" /> Export Report
          </Button>
        </div>
      </div>

      {/* KPI Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="card p-5 border-t-4 border-t-blue-500 hover:-translate-y-1 transition-transform">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm font-medium text-muted">Total Patients</p>
              <p className="text-3xl font-bold text-heading mt-2">{stats?.totalPatients || 0}</p>
            </div>
            <div className="p-3 bg-blue-50 rounded-xl text-blue-500">
              <Users className="w-6 h-6" />
            </div>
          </div>
          <div className="mt-4 flex items-center text-sm">
            <span className="text-green-500 font-bold flex items-center"><TrendingUp className="w-4 h-4 mr-1" /> 12.5%</span>
            <span className="text-muted ml-2">vs last month</span>
          </div>
        </div>

        <div className="card p-5 border-t-4 border-t-green-500 hover:-translate-y-1 transition-transform">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm font-medium text-muted">Active Doctors</p>
              <p className="text-3xl font-bold text-heading mt-2">{stats?.totalDoctors || 0}</p>
            </div>
            <div className="p-3 bg-green-50 rounded-xl text-green-500">
              <Activity className="w-6 h-6" />
            </div>
          </div>
          <div className="mt-4 flex items-center text-sm">
            <span className="text-green-500 font-bold flex items-center"><TrendingUp className="w-4 h-4 mr-1" /> 8.2%</span>
            <span className="text-muted ml-2">vs last month</span>
          </div>
        </div>

        <div className="card p-5 border-t-4 border-t-amber-500 hover:-translate-y-1 transition-transform">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm font-medium text-muted">Pending Approvals</p>
              <p className="text-3xl font-bold text-heading mt-2">{stats?.pendingDoctors || 0}</p>
            </div>
            <div className="p-3 bg-amber-50 rounded-xl text-amber-500">
              <UserCheck className="w-6 h-6" />
            </div>
          </div>
          <div className="mt-4 flex items-center text-sm">
            <span className="text-amber-500 font-bold">Action Required</span>
          </div>
        </div>

        <div className="card p-5 border-t-4 border-t-purple-500 hover:-translate-y-1 transition-transform">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm font-medium text-muted">Platform Revenue</p>
              <p className="text-3xl font-bold text-heading mt-2">
                ${stats?.platformRevenue?.toLocaleString() || '0'}
              </p>
            </div>
            <div className="p-3 bg-purple-50 rounded-xl text-purple-500">
              <DollarSign className="w-6 h-6" />
            </div>
          </div>
          <div className="mt-4 flex items-center text-sm">
            <span className="text-green-500 font-bold flex items-center"><TrendingUp className="w-4 h-4 mr-1" /> 24.1%</span>
            <span className="text-muted ml-2">vs last month</span>
          </div>
        </div>
      </div>

      {/* Main Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Revenue Growth Chart */}
        <div className="lg:col-span-2 card p-6">
          <h3 className="text-lg font-bold text-heading mb-6">Revenue Growth (2024)</h3>
          <div className="h-[350px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={revenueHistory} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.8} />
                    <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="month" stroke="#94a3b8" tickLine={false} axisLine={false} />
                <YAxis stroke="#94a3b8" tickLine={false} axisLine={false} tickFormatter={(value) => `$${value / 1000}k`} />
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <Tooltip
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                  formatter={(value) => [`$${value}`, 'Revenue']}
                />
                <Area type="monotone" dataKey="revenue" stroke="#8b5cf6" strokeWidth={3} fillOpacity={1} fill="url(#colorRev)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Doctor Specializations Distribution */}
        <div className="card p-6">
          <h3 className="text-lg font-bold text-heading mb-6">Appointments by Specialty</h3>
          <div className="h-[300px] w-full flex justify-center items-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={specialtyData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={5}
                  dataKey="value"
                  stroke="none"
                >
                  {specialtyData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                />
                <Legend verticalAlign="bottom" height={36} iconType="circle" />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Volume Bar Chart & Recent Appointments */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* Monthly Consultation Volume */}
        <div className="card p-6">
          <h3 className="text-lg font-bold text-heading mb-6">Consultation Volume</h3>
          <div className="h-[350px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={revenueHistory} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="month" stroke="#94a3b8" tickLine={false} axisLine={false} />
                <YAxis stroke="#94a3b8" tickLine={false} axisLine={false} />
                <Tooltip
                  cursor={{ fill: '#f8fafc' }}
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                />
                <Bar dataKey="consultations" fill="#3b82f6" radius={[6, 6, 0, 0]} barSize={40} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Live Activity Table */}
        <div className="card overflow-hidden flex flex-col h-full">
          <div className="p-6 border-b border-border flex justify-between items-center bg-surface">
            <h3 className="text-lg font-bold text-heading flex items-center">
              <Calendar className="w-5 h-5 mr-2 text-primary" /> Live Activity Feed
            </h3>
          </div>

          <div className="overflow-y-auto flex-1 p-2">
            <table className="w-full text-left text-sm">
              <thead className="text-muted sticky top-0 bg-white">
                <tr>
                  <th className="px-4 py-3 font-medium">Patient</th>
                  <th className="px-4 py-3 font-medium">Doctor</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {recentAppointments.slice(0, 6).map((appt) => (
                  <tr key={appt._id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-4 py-4">
                      <div className="font-medium text-heading">{appt.patientId?.name || 'Unknown Patient'}</div>
                      <div className="text-xs text-muted mt-1">{formatDate(appt.date)}</div>
                    </td>
                    <td className="px-4 py-4">
                      <div className="font-medium text-heading">Dr. {appt.doctorId?.userId?.name || 'Unknown Doctor'}</div>
                      <div className="text-xs text-muted mt-1">{appt.type?.replace('-', ' ') || 'Consultation'}</div>
                    </td>
                    <td className="px-4 py-4">
                      <Badge variant={
                        appt.status === 'completed' ? 'success' :
                          appt.status === 'confirmed' ? 'primary' :
                            appt.status === 'pending' ? 'warning' : 'neutral'
                      }>
                        {appt.status}
                      </Badge>
                    </td>
                  </tr>
                ))}
                {recentAppointments.length === 0 && (
                  <tr>
                    <td colSpan="3" className="px-4 py-12 text-center text-muted">
                      No recent appointments.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </PageTransition>
  );
};

export default AdminDashboard;

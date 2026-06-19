import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ShieldCheck, Users, Activity, Settings, UserCheck, AlertCircle, ChevronRight, Stethoscope, DollarSign, Calendar } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';
import PageTransition from '../../components/common/PageTransition';
import { useAuth } from '../../hooks/useAuth';
import adminService from '../../services/adminService';
import Button from '../../components/ui/Button';

const AdminHome = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      adminService.getDashboardStats(),
      adminService.getAnalyticsData('week')
    ])
      .then(([statsRes, analyticsRes]) => {
        setStats(statsRes.data.stats);
        setAnalytics(analyticsRes.data);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  return (
    <PageTransition className="space-y-8">
      {/* Welcome Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 p-8 text-white shadow-2xl">
        <div className="absolute top-0 right-0 -mt-16 -mr-16 w-64 h-64 bg-indigo-500/20 rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 right-32 -mb-16 w-48 h-48 bg-blue-500/20 rounded-full blur-2xl"></div>

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-2 mb-2 text-indigo-300">
              <ShieldCheck className="w-5 h-5" />
              <span className="font-semibold tracking-wide uppercase text-sm">System Administrator</span>
            </div>
            <h1 className="text-4xl font-heading font-black mb-2 text-white">
              Welcome back, {user?.name?.split(' ')[0]}
            </h1>
            <p className="text-slate-300 max-w-lg text-lg">
              Manage the HealthBridge network, oversee medical professional verifications, and monitor platform health.
            </p>
          </div>

          <div className="flex flex-col gap-3">
            <div className="flex items-center gap-3 bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/10">
              <div className="w-3 h-3 rounded-full bg-green-400 animate-pulse shadow-[0_0_10px_rgba(74,222,128,0.5)]"></div>
              <div>
                <p className="text-sm font-medium text-slate-300">System Status</p>
                <p className="font-bold text-white">All Services Operational</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Action Required Alert */}
      {!loading && stats?.pendingDoctors > 0 && (
        <div className="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-2xl p-5 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-sm">
          <div className="flex items-center gap-4 text-amber-900">
            <div className="p-3 bg-amber-100 rounded-xl shadow-inner">
              <AlertCircle className="w-6 h-6 text-amber-600" />
            </div>
            <div>
              <h3 className="font-bold text-lg">Action Required: Pending Verifications</h3>
              <p className="text-sm text-amber-700">There are {stats.pendingDoctors} doctor profiles waiting for your manual review and approval.</p>
            </div>
          </div>
          <Link to="/admin/approvals" className="w-full sm:w-auto">
            <Button variant="primary" className="w-full sm:w-auto bg-amber-600 hover:bg-amber-700 text-white border-none shadow-lg shadow-amber-600/20">
              Review Now
            </Button>
          </Link>
        </div>
      )}

      {/* Analytics Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Main Area Chart (Revenue & Volume) */}
        <div className="lg:col-span-2 card p-6 border border-border shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-xl font-bold text-heading">Weekly Revenue & Volume</h2>
              <p className="text-sm text-muted">Platform performance over the last 7 days</p>
            </div>
            <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg">
              <Activity className="w-5 h-5" />
            </div>
          </div>

          <div className="h-[300px] w-full">
            {!loading && analytics?.trends && analytics.trends.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={analytics.trends} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#4f46e5" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="date" stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `$${value}`} />
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <Tooltip
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                    formatter={(value, name) => [name === 'revenue' ? `$${value}` : value, name === 'revenue' ? 'Revenue' : 'Appointments']}
                  />
                  <Area type="monotone" dataKey="revenue" stroke="#4f46e5" strokeWidth={3} fillOpacity={1} fill="url(#colorRevenue)" />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-full text-muted">
                {loading ? 'Loading chart data...' : 'Not enough data to generate trends.'}
              </div>
            )}
          </div>
        </div>

        {/* Secondary Bar Chart */}
        <div className="card p-6 border border-border shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-xl font-bold text-heading">Daily Appointments</h2>
              <p className="text-sm text-muted">Consultation volume</p>
            </div>
            <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
              <Calendar className="w-5 h-5" />
            </div>
          </div>

          <div className="h-[300px] w-full">
            {!loading && analytics?.trends && analytics.trends.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={analytics.trends} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <XAxis dataKey="date" stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
                  <Tooltip
                    cursor={{ fill: '#f8fafc' }}
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                  />
                  <Bar dataKey="appointments" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-full text-muted">
                {loading ? 'Loading...' : 'No appointments to display.'}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Quick Actions Grid */}
      <div>
        <h2 className="text-2xl font-heading font-bold text-heading mb-6 flex items-center gap-2">
          <Settings className="w-6 h-6 text-primary" /> Management Shortcuts
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">

          <Link to="/admin/analytics" className="group">
            <div className="card p-5 border border-border hover:border-indigo-500/40 hover:shadow-lg hover:shadow-indigo-500/10 transition-all duration-300 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                  <Activity className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-bold text-heading">Analytics</h3>
                  <p className="text-xs text-muted">System Stats</p>
                </div>
              </div>
              <ChevronRight className="w-5 h-5 text-slate-300 group-hover:text-indigo-600 transition-colors" />
            </div>
          </Link>

          <Link to="/admin/approvals" className="group">
            <div className="card p-5 border border-border hover:border-amber-500/40 hover:shadow-lg hover:shadow-amber-500/10 transition-all duration-300 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                  <UserCheck className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-bold text-heading">Verifications</h3>
                  <p className="text-xs text-muted">Doctor KYC</p>
                </div>
              </div>
              <ChevronRight className="w-5 h-5 text-slate-300 group-hover:text-amber-600 transition-colors" />
            </div>
          </Link>

          <Link to="/admin/doctors" className="group">
            <div className="card p-5 border border-border hover:border-green-500/40 hover:shadow-lg hover:shadow-green-500/10 transition-all duration-300 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-green-50 text-green-600 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                  <Stethoscope className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-bold text-heading">Doctors</h3>
                  <p className="text-xs text-muted">Manage Directory</p>
                </div>
              </div>
              <ChevronRight className="w-5 h-5 text-slate-300 group-hover:text-green-600 transition-colors" />
            </div>
          </Link>

          <Link to="/admin/patients" className="group">
            <div className="card p-5 border border-border hover:border-pink-500/40 hover:shadow-lg hover:shadow-pink-500/10 transition-all duration-300 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-pink-50 text-pink-600 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                  <Users className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-bold text-heading">Patients</h3>
                  <p className="text-xs text-muted">User Accounts</p>
                </div>
              </div>
              <ChevronRight className="w-5 h-5 text-slate-300 group-hover:text-pink-600 transition-colors" />
            </div>
          </Link>

        </div>
      </div>
    </PageTransition>
  );
};

export default AdminHome;

import { useState, useEffect } from 'react';
import { 
  Users, UserCheck, Stethoscope, Calendar, 
  Activity, TrendingUp, PieChart as PieChartIcon, 
  BarChart3, Clock, DollarSign, Download, Filter 
} from 'lucide-react';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  BarChart, Bar, PieChart, Pie, Cell, Legend, LineChart, Line 
} from 'recharts';
import toast from 'react-hot-toast';
import PageTransition from '../../components/common/PageTransition';
import adminService from '../../services/adminService';
import Button from '../../components/ui/Button';

const COLORS = ['#3b82f6', '#8b5cf6', '#f59e0b', '#10b981', '#ec4899', '#ef4444'];

const Analytics = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState('year'); // 'week', 'month', 'year', 'all'

  useEffect(() => {
    fetchAnalytics();
  }, [timeRange]);

  const fetchAnalytics = async () => {
    setLoading(true);
    try {
      const res = await adminService.getAnalyticsData(timeRange);
      setData(res.data);
    } catch (error) {
      toast.error('Failed to load analytics data');
    } finally {
      setLoading(false);
    }
  };

  const handleExport = () => {
    toast.success('Analytics report exported successfully');
  };

  return (
    <PageTransition className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-h2 font-heading text-heading">Platform Analytics</h1>
          <p className="text-muted mt-1">Real-time enterprise metrics and performance insights.</p>
        </div>
        
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <select 
            className="input-base w-40"
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value)}
          >
            <option value="week">Last 7 Days</option>
            <option value="month">This Month</option>
            <option value="year">This Year</option>
            <option value="all">All Time</option>
          </select>
          <Button variant="primary" onClick={handleExport}>
            <Download className="w-4 h-4 mr-2" /> Export
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="p-12 text-center"><span className="loader"></span></div>
      ) : data ? (
        <>
          {/* Main KPIs */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="card p-5 border-l-4 border-l-blue-500 flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted">Total Users</p>
                <h3 className="text-2xl font-bold text-heading mt-1">
                  {(data.kpis.totalPatients + data.kpis.totalDoctors).toLocaleString()}
                </h3>
              </div>
              <div className="p-3 bg-blue-50 rounded-xl text-blue-600">
                <Users className="w-6 h-6" />
              </div>
            </div>

            <div className="card p-5 border-l-4 border-l-purple-500 flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted">Active Doctors</p>
                <h3 className="text-2xl font-bold text-heading mt-1">
                  {data.kpis.totalDoctors.toLocaleString()}
                </h3>
              </div>
              <div className="p-3 bg-purple-50 rounded-xl text-purple-600">
                <Stethoscope className="w-6 h-6" />
              </div>
            </div>

            <div className="card p-5 border-l-4 border-l-amber-500 flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted">Total Appointments</p>
                <h3 className="text-2xl font-bold text-heading mt-1">
                  {data.kpis.totalAppointments.toLocaleString()}
                </h3>
              </div>
              <div className="p-3 bg-amber-50 rounded-xl text-amber-600">
                <Calendar className="w-6 h-6" />
              </div>
            </div>

            <div className="card p-5 border-l-4 border-l-green-500 flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted">Platform Revenue</p>
                <h3 className="text-2xl font-bold text-heading mt-1">
                  ${data.kpis.platformRevenue.toLocaleString()}
                </h3>
              </div>
              <div className="p-3 bg-green-50 rounded-xl text-green-600">
                <DollarSign className="w-6 h-6" />
              </div>
            </div>
          </div>

          {/* Charts Row 1 */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Growth Trend */}
            <div className="lg:col-span-2 card p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-bold text-heading">Platform Growth Trend</h3>
              </div>
              <div className="h-[350px] w-full">
                {data.trends && data.trends.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={data.trends} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                      <defs>
                        <linearGradient id="colorAppts" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                          <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                        </linearGradient>
                        <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                          <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                      <XAxis dataKey="date" stroke="#94a3b8" tickLine={false} axisLine={false} />
                      <YAxis yAxisId="left" stroke="#94a3b8" tickLine={false} axisLine={false} />
                      <YAxis yAxisId="right" orientation="right" stroke="#94a3b8" tickLine={false} axisLine={false} tickFormatter={val => `$${val}`} />
                      <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }} />
                      <Legend />
                      <Area yAxisId="left" type="monotone" name="Appointments" dataKey="appointments" stroke="#3b82f6" strokeWidth={3} fillOpacity={1} fill="url(#colorAppts)" />
                      <Area yAxisId="right" type="monotone" name="Revenue ($)" dataKey="revenue" stroke="#10b981" strokeWidth={3} fillOpacity={1} fill="url(#colorRev)" />
                    </AreaChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex h-full items-center justify-center text-muted">Not enough data to display trends.</div>
                )}
              </div>
            </div>

            {/* Appointment Status */}
            <div className="card p-6">
              <h3 className="text-lg font-bold text-heading mb-6">Appointment Status</h3>
              <div className="h-[300px] w-full flex items-center justify-center">
                {data.appointmentStatusData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie 
                        data={data.appointmentStatusData} 
                        cx="50%" cy="50%" innerRadius={60} outerRadius={100} 
                        paddingAngle={5} dataKey="value" stroke="none"
                      >
                        {data.appointmentStatusData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={
                            entry.name === 'Completed' ? '#10b981' : 
                            entry.name === 'Cancelled' ? '#ef4444' : 
                            entry.name === 'Pending' ? '#f59e0b' : '#3b82f6'
                          } />
                        ))}
                      </Pie>
                      <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                      <Legend verticalAlign="bottom" height={36} iconType="circle" />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="text-muted text-center">No data available</div>
                )}
              </div>
            </div>
          </div>

          {/* Charts Row 2 */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            
            {/* Specialization Distribution */}
            <div className="card p-6">
              <h3 className="text-lg font-bold text-heading mb-6">Top Specializations</h3>
              <div className="h-[300px] w-full">
                {data.specializationData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={data.specializationData} layout="vertical" margin={{ top: 5, right: 30, left: 40, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                      <XAxis type="number" stroke="#94a3b8" tickLine={false} axisLine={false} />
                      <YAxis type="category" dataKey="name" stroke="#64748b" tickLine={false} axisLine={false} width={100} />
                      <Tooltip cursor={{ fill: '#f8fafc' }} contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                      <Bar dataKey="value" name="Doctors" fill="#8b5cf6" radius={[0, 6, 6, 0]} barSize={24}>
                        {data.specializationData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex h-full items-center justify-center text-muted">No data available</div>
                )}
              </div>
            </div>

            {/* Verification Stats */}
            <div className="card p-6 flex flex-col justify-center">
              <h3 className="text-lg font-bold text-heading mb-6">Doctor Verifications</h3>
              
              <div className="space-y-6">
                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span className="font-medium text-heading">Approved</span>
                    <span className="font-bold text-green-600">{data.kpis.totalDoctors}</span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-2.5">
                    <div className="bg-green-500 h-2.5 rounded-full" style={{ width: `${Math.max(5, (data.kpis.totalDoctors / Math.max(1, data.kpis.totalDoctors + data.kpis.pendingDoctors + data.kpis.rejectedDoctors)) * 100)}%` }}></div>
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span className="font-medium text-heading">Pending Review</span>
                    <span className="font-bold text-amber-500">{data.kpis.pendingDoctors}</span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-2.5">
                    <div className="bg-amber-400 h-2.5 rounded-full" style={{ width: `${Math.max(5, (data.kpis.pendingDoctors / Math.max(1, data.kpis.totalDoctors + data.kpis.pendingDoctors + data.kpis.rejectedDoctors)) * 100)}%` }}></div>
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span className="font-medium text-heading">Rejected</span>
                    <span className="font-bold text-red-500">{data.kpis.rejectedDoctors}</span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-2.5">
                    <div className="bg-red-500 h-2.5 rounded-full" style={{ width: `${Math.max(5, (data.kpis.rejectedDoctors / Math.max(1, data.kpis.totalDoctors + data.kpis.pendingDoctors + data.kpis.rejectedDoctors)) * 100)}%` }}></div>
                  </div>
                </div>
              </div>
            </div>

          </div>
        </>
      ) : null}
    </PageTransition>
  );
};

export default Analytics;

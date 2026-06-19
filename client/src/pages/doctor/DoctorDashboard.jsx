import { useState, useEffect, useMemo, useContext } from 'react';
import { Link } from 'react-router-dom';
import {
  Calendar, Users, DollarSign, Activity, CheckCircle, Clock,
  TrendingUp, Star, Phone, Video, Stethoscope, ChevronRight
} from 'lucide-react';
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell
} from 'recharts';
import toast from 'react-hot-toast';

import { AuthContext } from '../../context/AuthContext';
import PageTransition from '../../components/common/PageTransition';
import doctorService from '../../services/doctorService';
import appointmentService from '../../services/appointmentService';
import { formatDate, timeAgo } from '../../utils/format';
import Badge from '../../components/ui/Badge';
import Button from '../../components/ui/Button';
import Avatar from '../../components/common/Avatar';

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899'];

const DoctorDashboard = () => {
  const { user } = useContext(AuthContext);

  const [appointments, setAppointments] = useState([]);
  const [earnings, setEarnings] = useState(null);
  const [loading, setLoading] = useState(true);

  const doctorId = user?.doctorProfile?._id;

  useEffect(() => {
    if (!doctorId) {
      setLoading(false);
      return;
    }

    const fetchDashboardData = async () => {
      try {
        const [apptsRes, earningsRes] = await Promise.all([
          appointmentService.getAppointments({ limit: 200 }), // Get enough data for analytics
          doctorService.getEarnings(doctorId)
        ]);

        setAppointments(apptsRes.data.appointments || []);
        setEarnings(earningsRes.data.earnings || null);
      } catch (error) {
        console.error('Dashboard fetch error:', error);
        toast.error('Failed to load dashboard analytics');
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [doctorId]);

  // Derived Analytics Data
  const stats = useMemo(() => {
    let todayAppts = 0;
    let upcomingAppts = 0;
    let completedAppts = 0;
    let pendingAppts = 0;
    let cancelledAppts = 0;

    let onlineCount = 0;
    let inPersonCount = 0;

    const patientsMap = new Set();
    const todayStr = new Date().toDateString();

    appointments.forEach(apt => {
      if (apt.patientId) patientsMap.add(apt.patientId._id);

      const isToday = new Date(apt.date).toDateString() === todayStr;
      if (isToday) todayAppts++;

      if (apt.status === 'completed') completedAppts++;
      if (apt.status === 'pending') pendingAppts++;
      if (apt.status === 'cancelled') cancelledAppts++;
      if (['confirmed', 'pending'].includes(apt.status) && new Date(apt.date) >= new Date()) upcomingAppts++;

      if (apt.type === 'video') onlineCount++;
      if (apt.type === 'in-person') inPersonCount++;
    });

    return {
      totalAppointments: appointments.length,
      todayAppts,
      upcomingAppts,
      completedAppts,
      pendingAppts,
      cancelledAppts,
      totalPatients: patientsMap.size,
      onlineCount,
      inPersonCount
    };
  }, [appointments]);

  // Chart Data preparation
  const consultationTypeData = useMemo(() => [
    { name: 'Video Consult', value: stats.onlineCount },
    { name: 'In-Person', value: stats.inPersonCount }
  ].filter(d => d.value > 0), [stats]);

  const appointmentTrendData = useMemo(() => {
    // Group last 7 days of appointments
    const last7Days = Array.from({ length: 7 }).map((_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - (6 - i));
      return { date: d.toISOString().split('T')[0], label: d.toLocaleDateString('en-US', { weekday: 'short' }), Booked: 0, Completed: 0 };
    });

    appointments.forEach(apt => {
      const dateStr = new Date(apt.date).toISOString().split('T')[0];
      const dayData = last7Days.find(d => d.date === dateStr);
      if (dayData) {
        dayData.Booked++;
        if (apt.status === 'completed') dayData.Completed++;
      }
    });

    return last7Days;
  }, [appointments]);

  const revenueData = useMemo(() => {
    if (!earnings?.monthly) return [];
    return earnings.monthly.map(m => {
      const [year, month] = m._id.split('-');
      const date = new Date(year, month - 1);
      return {
        name: date.toLocaleDateString('en-US', { month: 'short' }),
        Revenue: m.total,
        Consultations: m.count
      };
    });
  }, [earnings]);

  // Queues
  const todayQueue = useMemo(() => {
    const todayStr = new Date().toDateString();
    return appointments.filter(apt => new Date(apt.date).toDateString() === todayStr).sort((a,b) => a.slotTime.localeCompare(b.slotTime));
  }, [appointments]);

  const recentPatients = useMemo(() => {
    const pMap = new Map();
    appointments
      .filter(apt => apt.status === 'completed' && apt.patientId)
      .sort((a, b) => new Date(b.date) - new Date(a.date))
      .forEach(apt => {
        if (!pMap.has(apt.patientId._id)) pMap.set(apt.patientId._id, apt);
      });
    return Array.from(pMap.values()).slice(0, 5);
  }, [appointments]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <span className="loader border-primary"></span>
      </div>
    );
  }

  if (!doctorId) {
    return (
      <div className="flex flex-col items-center justify-center bg-white rounded-2xl border border-border p-12 text-center shadow-sm">
        <div className="w-20 h-20 bg-amber-50 rounded-full flex items-center justify-center mb-6">
          <Activity className="w-10 h-10 text-amber-500" />
        </div>
        <h2 className="text-2xl font-bold text-heading mb-3">Profile Incomplete</h2>
        <p className="text-muted max-w-md mb-6">
          Please complete your doctor profile setup to unlock your analytics dashboard, view revenue trends, and track patient metrics.
        </p>
        <Link to="/doctor/profile">
          <Button variant="primary" className="px-8 shadow-sm">Setup Profile</Button>
        </Link>
      </div>
    );
  }

  return (
    <PageTransition className="space-y-6">

      {/* Dashboard Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-6 rounded-2xl border border-border shadow-sm">
        <div className="flex items-center gap-4">
            <Avatar
              src={user?.avatar?.url}
              name={user?.name}
              role="doctor"
              className="w-16 h-16 shrink-0"
            />
          <div>
            <h1 className="text-2xl font-bold text-heading">Dashboard Analytics</h1>
            <p className="text-sm text-slate-500 flex items-center gap-2">
              <span className={`w-2 h-2 rounded-full ${user.isActive ? 'bg-emerald-500' : 'bg-slate-400'}`}></span>
              {user.isActive ? 'Online & Available' : 'Currently Offline'} • Dr. {user.name}
            </p>
          </div>
        </div>
        <div className="flex gap-3 w-full md:w-auto">
          <Link to="/doctor/schedule" className="flex-1 md:flex-none">
            <Button variant="outline" className="w-full">Manage Schedule</Button>
          </Link>
          <Link to="/doctor/appointments" className="flex-1 md:flex-none">
            <Button variant="primary" className="w-full">View Appointments</Button>
          </Link>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-border shadow-sm">
          <div className="flex justify-between items-start mb-4">
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <Calendar className="w-5 h-5" />
            </div>
            <Badge variant="success" className="bg-emerald-50 text-emerald-600 border-none">Today</Badge>
          </div>
          <h3 className="text-3xl font-black text-heading mb-1">{stats.todayAppts}</h3>
          <p className="text-xs font-semibold text-slate-500 uppercase">Today's Visits</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-border shadow-sm">
          <div className="flex justify-between items-start mb-4">
            <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <Users className="w-5 h-5" />
            </div>
            <span className="text-xs font-bold text-indigo-600 bg-indigo-50 px-2 py-1 rounded-md">Total</span>
          </div>
          <h3 className="text-3xl font-black text-heading mb-1">{stats.totalPatients}</h3>
          <p className="text-xs font-semibold text-slate-500 uppercase">Unique Patients</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-border shadow-sm">
          <div className="flex justify-between items-start mb-4">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <DollarSign className="w-5 h-5" />
            </div>
            <span className={`text-xs font-bold px-2 py-1 rounded-md flex items-center ${earnings?.growth >= 0 ? 'text-emerald-600 bg-emerald-50' : 'text-rose-600 bg-rose-50'}`}>
              <TrendingUp className={`w-3 h-3 mr-1 ${earnings?.growth < 0 ? 'rotate-180' : ''}`} />
              {Math.abs(earnings?.growth || 0)}%
            </span>
          </div>
          <h3 className="text-3xl font-black text-heading mb-1">${earnings?.thisMonth?.total?.toLocaleString() || 0}</h3>
          <p className="text-xs font-semibold text-slate-500 uppercase">Revenue This Month</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-border shadow-sm">
          <div className="flex justify-between items-start mb-4">
            <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <Star className="w-5 h-5" />
            </div>
            <span className="text-xs font-bold text-amber-600 bg-amber-50 px-2 py-1 rounded-md">Overall</span>
          </div>
          <h3 className="text-3xl font-black text-heading mb-1">{user?.doctorProfile?.rating?.toFixed(1) || '0.0'}</h3>
          <p className="text-xs font-semibold text-slate-500 uppercase">Average Rating</p>
        </div>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Revenue Analytics Chart */}
        <div className="bg-white p-6 rounded-2xl border border-border shadow-sm lg:col-span-2">
          <div className="flex justify-between items-center mb-6">
            <h3 className="font-bold text-heading">Revenue Trends</h3>
            <select className="input-base py-1 px-3 h-8 text-xs bg-slate-50 border-none w-auto">
              <option>This Year</option>
            </select>
          </div>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={revenueData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} tickFormatter={(val) => `$${val}`} />
                <Tooltip
                  cursor={{ fill: '#f8fafc' }}
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                />
                <Bar dataKey="Revenue" fill="#3b82f6" radius={[4, 4, 0, 0]} maxBarSize={40} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Consultation Distribution */}
        <div className="bg-white p-6 rounded-2xl border border-border shadow-sm">
          <h3 className="font-bold text-heading mb-6">Consultation Types</h3>
          {consultationTypeData.length > 0 ? (
            <div className="h-56 relative flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={consultationTypeData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {consultationTypeData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                </PieChart>
              </ResponsiveContainer>
              {/* Center Label */}
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <span className="text-3xl font-black text-heading">{stats.completedAppts}</span>
                <span className="text-[10px] uppercase font-bold text-slate-400">Total Consults</span>
              </div>
            </div>
          ) : (
            <div className="h-56 flex items-center justify-center text-slate-400 text-sm">No data available</div>
          )}

          <div className="mt-4 space-y-2">
            {consultationTypeData.map((entry, index) => (
              <div key={index} className="flex justify-between items-center text-sm">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }}></div>
                  <span className="font-medium text-slate-600">{entry.name}</span>
                </div>
                <span className="font-bold">{entry.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Bottom Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* Today's Queue */}
        <div className="bg-white rounded-2xl border border-border shadow-sm overflow-hidden flex flex-col">
          <div className="p-5 border-b border-border flex items-center justify-between bg-slate-50/50">
            <h3 className="font-bold text-heading flex items-center">
              <Clock className="w-4 h-4 mr-2 text-primary" /> Today's Queue
            </h3>
            <Badge className="bg-blue-100 text-blue-700 border-none">{todayQueue.length} Total</Badge>
          </div>
          <div className="flex-1 overflow-y-auto max-h-[400px] p-2 custom-scrollbar">
            {todayQueue.length === 0 ? (
              <div className="p-8 text-center text-slate-500">
                <Calendar className="w-10 h-10 text-slate-300 mx-auto mb-3" />
                <p>No appointments booked for today.</p>
              </div>
            ) : (
              todayQueue.map(apt => (
                <div key={apt._id} className="p-3 hover:bg-slate-50 rounded-xl transition-colors border border-transparent hover:border-slate-100 mb-1 flex items-center justify-between group">
                  <div className="flex items-center gap-3">
                    <div className="bg-primary/10 text-primary font-bold px-3 py-1.5 rounded-lg text-xs w-20 text-center shrink-0">
                      {apt.slotTime}
                    </div>
                    <div>
                      <p className="font-bold text-sm text-heading">{apt.patientId?.name}</p>
                      <p className="text-[11px] text-slate-500 font-medium capitalize flex items-center gap-1">
                        {apt.type === 'video' ? <Video className="w-3 h-3" /> : <Stethoscope className="w-3 h-3" />}
                        {apt.type.replace('-', ' ')}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge variant={apt.status === 'confirmed' ? 'success' : 'warning'} className="text-[10px] px-2 py-0.5">
                      {apt.status}
                    </Badge>
                    <Link to={`/doctor/appointments`} className="opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button variant="ghost" className="w-8 h-8 p-0"><ChevronRight className="w-4 h-4 text-slate-400" /></Button>
                    </Link>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Appointment Trend */}
        <div className="bg-white p-6 rounded-2xl border border-border shadow-sm flex flex-col">
          <div className="flex justify-between items-center mb-6">
            <h3 className="font-bold text-heading">Appointment Trends (7 Days)</h3>
          </div>
          <div className="h-64 flex-1">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={appointmentTrendData} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="label" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} allowDecimals={false} />
                <Tooltip
                  cursor={{ stroke: '#cbd5e1', strokeWidth: 1, strokeDasharray: '4 4' }}
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                />
                <Legend iconType="circle" wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
                <Line type="monotone" dataKey="Booked" stroke="#8b5cf6" strokeWidth={3} dot={{ r: 4, fill: '#8b5cf6', strokeWidth: 0 }} activeDot={{ r: 6 }} />
                <Line type="monotone" dataKey="Completed" stroke="#10b981" strokeWidth={3} dot={{ r: 4, fill: '#10b981', strokeWidth: 0 }} activeDot={{ r: 6 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

      </div>
    </PageTransition>
  );
};

export default DoctorDashboard;

import { useState, useEffect } from 'react';
import { 
  Download, Filter, Calendar, Activity, TrendingUp, Users, 
  DollarSign, PieChart as PieChartIcon, BarChart3, ArrowUpRight 
} from 'lucide-react';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  BarChart, Bar, PieChart, Pie, Cell, Legend, LineChart, Line 
} from 'recharts';
import toast from 'react-hot-toast';
import PageTransition from '../../components/common/PageTransition';
import adminService from '../../services/adminService';
import Button from '../../components/ui/Button';

const COLORS = ['#3b82f6', '#8b5cf6', '#f59e0b', '#10b981', '#ec4899'];

const Reports = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [reportType, setReportType] = useState('financial'); // financial, clinical, user
  const [dateRange, setDateRange] = useState('year');

  useEffect(() => {
    fetchData();
  }, [dateRange]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await adminService.getAnalyticsData(dateRange);
      setData(res.data);
    } catch (error) {
      toast.error('Failed to load report data');
    } finally {
      setLoading(false);
    }
  };

  const handleExport = () => {
    if (!data) return toast.error('No data available to export');

    let csvContent = "data:text/csv;charset=utf-8,";
    
    // 1. Add Report Metadata
    csvContent += `HealthBridge Platform Report\n`;
    csvContent += `Report Type: ${reportType.toUpperCase()}\n`;
    csvContent += `Date Range: ${dateRange.toUpperCase()}\n`;
    csvContent += `Generated On: ${new Date().toLocaleString()}\n\n`;

    // 2. Add KPIs
    csvContent += `--- Key Performance Indicators ---\n`;
    csvContent += `Total Revenue,Total Consultations,Total Patients,Total Doctors\n`;
    csvContent += `$${data.kpis?.platformRevenue || 0},${data.kpis?.totalAppointments || 0},${data.kpis?.totalPatients || 0},${data.kpis?.totalDoctors || 0}\n\n`;

    // 3. Add Tab-Specific Data
    if (reportType === 'financial' && data.revenueData) {
      csvContent += `--- Financial Trends ---\n`;
      csvContent += `Period,Revenue ($)\n`;
      data.revenueData.forEach(row => {
        csvContent += `"${row._id}",${row.total}\n`;
      });
    } else if (reportType === 'clinical') {
      if (data.appointmentsBySpecialty) {
        csvContent += `--- Appointments By Specialty ---\n`;
        csvContent += `Specialty,Count\n`;
        data.appointmentsBySpecialty.forEach(row => {
          csvContent += `"${row._id}",${row.count}\n`;
        });
        csvContent += `\n`;
      }
      if (data.appointmentStatus) {
        csvContent += `--- Appointment Status ---\n`;
        csvContent += `Status,Count\n`;
        data.appointmentStatus.forEach(row => {
          csvContent += `"${row._id}",${row.count}\n`;
        });
      }
    } else if (reportType === 'user' && data.userGrowth) {
      csvContent += `--- User Growth Trends ---\n`;
      csvContent += `Period,New Patients,New Doctors\n`;
      data.userGrowth.forEach(row => {
        csvContent += `"${row._id}",${row.patients || 0},${row.doctors || 0}\n`;
      });
    }

    // Trigger Download
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `healthbridge_${reportType}_report_${dateRange}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast.success('Report exported successfully');
  };

  return (
    <PageTransition className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-h2 font-heading text-heading">Reports & Analytics</h1>
          <p className="text-muted mt-1">Deep insights into platform performance and user engagement.</p>
        </div>
        
        <div className="flex flex-wrap items-center gap-3">
          <select 
            className="input-base w-40"
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value)}
          >
            <option value="week">Last 7 Days</option>
            <option value="month">This Month</option>
            <option value="year">This Year</option>
            <option value="all">All Time</option>
          </select>
          <Button variant="outline" className="bg-white hidden sm:flex">
            <Filter className="w-4 h-4 mr-2" /> Advanced Filters
          </Button>
          <Button variant="primary" onClick={handleExport}>
            <Download className="w-4 h-4 mr-2" /> Export Report
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex space-x-1 bg-surface p-1 rounded-xl border border-border w-max overflow-x-auto max-w-full">
        {[
          { id: 'financial', label: 'Financial Performance', icon: DollarSign },
          { id: 'clinical', label: 'Clinical Activity', icon: Activity },
          { id: 'user', label: 'Platform Users', icon: Users }
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setReportType(tab.id)}
            className={`flex items-center px-4 py-2 text-sm font-medium rounded-lg transition-colors whitespace-nowrap ${
              reportType === tab.id 
                ? 'bg-white text-primary shadow-sm' 
                : 'text-muted hover:text-heading hover:bg-slate-50'
            }`}
          >
            <tab.icon className="w-4 h-4 mr-2" />
            {tab.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="p-12 text-center"><span className="loader"></span></div>
      ) : data ? (
        <>
          {/* Highlight KPIs based on tab */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="card p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted">Total Revenue</p>
                  <h3 className="text-3xl font-bold text-heading mt-1">
                    ${data.kpis.platformRevenue.toLocaleString()}
                  </h3>
                </div>
                <div className="p-3 bg-green-50 rounded-xl text-green-600">
                  <TrendingUp className="w-6 h-6" />
                </div>
              </div>
            </div>

            <div className="card p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted">Total Consultations</p>
                  <h3 className="text-3xl font-bold text-heading mt-1">
                    {data.kpis.totalAppointments.toLocaleString()}
                  </h3>
                </div>
                <div className="p-3 bg-blue-50 rounded-xl text-blue-600">
                  <Calendar className="w-6 h-6" />
                </div>
              </div>
            </div>

            <div className="card p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted">Total Patients</p>
                  <h3 className="text-3xl font-bold text-heading mt-1">
                    {data.kpis.totalPatients.toLocaleString()}
                  </h3>
                </div>
                <div className="p-3 bg-purple-50 rounded-xl text-purple-600">
                  <Users className="w-6 h-6" />
                </div>
              </div>
            </div>
          </div>

          {/* Main Chart Area */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Primary Time-Series Chart */}
            <div className="lg:col-span-2 card p-6 flex flex-col">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg font-bold text-heading">
                  {reportType === 'financial' && 'Revenue Trends'}
                  {reportType === 'clinical' && 'Consultation Volume'}
                  {reportType === 'user' && 'User Acquisition Rate'}
                </h3>
              </div>
              
              <div className="flex-1 min-h-[350px]">
                {data.trends && data.trends.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    {reportType === 'financial' ? (
                      <AreaChart data={data.trends} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                        <defs>
                          <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                            <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                        <XAxis dataKey="date" stroke="#94a3b8" tickLine={false} axisLine={false} />
                        <YAxis stroke="#94a3b8" tickLine={false} axisLine={false} tickFormatter={(val) => `$${val}`} />
                        <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }} />
                        <Area type="monotone" dataKey="revenue" stroke="#10b981" strokeWidth={3} fillOpacity={1} fill="url(#colorRev)" />
                      </AreaChart>
                    ) : reportType === 'clinical' ? (
                      <BarChart data={data.trends} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                        <XAxis dataKey="date" stroke="#94a3b8" tickLine={false} axisLine={false} />
                        <YAxis stroke="#94a3b8" tickLine={false} axisLine={false} />
                        <Tooltip cursor={{ fill: '#f8fafc' }} contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                        <Bar dataKey="appointments" fill="#3b82f6" radius={[6, 6, 0, 0]} barSize={40} />
                      </BarChart>
                    ) : (
                      <LineChart data={data.trends} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                        <XAxis dataKey="date" stroke="#94a3b8" tickLine={false} axisLine={false} />
                        <YAxis stroke="#94a3b8" tickLine={false} axisLine={false} />
                        <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }} />
                        <Line type="monotone" dataKey="appointments" stroke="#8b5cf6" strokeWidth={3} dot={{ r: 4, strokeWidth: 2 }} activeDot={{ r: 6 }} />
                      </LineChart>
                    )}
                  </ResponsiveContainer>
                ) : (
                  <div className="flex h-full items-center justify-center text-muted">No trend data available for this period.</div>
                )}
              </div>
            </div>

            {/* Secondary Distribution Chart */}
            <div className="card p-6 flex flex-col">
              <h3 className="text-lg font-bold text-heading mb-6">
                {reportType === 'financial' && 'Appointment Outcomes'}
                {reportType === 'clinical' && 'Top Specializations'}
                {reportType === 'user' && 'Appointment Status'}
              </h3>
              <div className="flex-1 min-h-[300px] flex items-center justify-center">
                {reportType === 'clinical' && data.specializationData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={data.specializationData} layout="vertical" margin={{ top: 5, right: 5, left: 20, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                      <XAxis type="number" stroke="#94a3b8" tickLine={false} axisLine={false} />
                      <YAxis type="category" dataKey="name" stroke="#64748b" tickLine={false} axisLine={false} width={80} />
                      <Tooltip cursor={{ fill: '#f8fafc' }} contentStyle={{ borderRadius: '12px', border: 'none' }} />
                      <Bar dataKey="value" fill="#8b5cf6" radius={[0, 4, 4, 0]}>
                        {data.specializationData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                ) : data.appointmentStatusData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie 
                        data={data.appointmentStatusData} 
                        cx="50%" cy="50%" 
                        innerRadius={reportType === 'financial' ? 60 : 0} 
                        outerRadius={100} 
                        paddingAngle={reportType === 'financial' ? 5 : 0} 
                        dataKey="value" stroke="none" label={reportType !== 'financial'}
                      >
                        {data.appointmentStatusData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={
                            entry.name === 'Completed' ? '#10b981' : 
                            entry.name === 'Cancelled' ? '#ef4444' : 
                            entry.name === 'Pending' ? '#f59e0b' : '#3b82f6'
                          } />
                        ))}
                      </Pie>
                      <Tooltip contentStyle={{ borderRadius: '12px', border: 'none' }} />
                      <Legend verticalAlign="bottom" height={36} iconType="circle" />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="text-muted">No distribution data available.</div>
                )}
              </div>
            </div>

          </div>
          
          {/* Data Summary Table */}
          <div className="card overflow-hidden">
            <div className="p-6 border-b border-border flex justify-between items-center bg-surface">
              <h3 className="text-lg font-bold text-heading flex items-center">
                <BarChart3 className="w-5 h-5 mr-2 text-primary" /> Comprehensive Data Log
              </h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm whitespace-nowrap">
                <thead className="bg-white text-muted border-b border-border">
                  <tr>
                    <th className="px-6 py-4 font-medium">Date</th>
                    <th className="px-6 py-4 font-medium">Total Appointments</th>
                    <th className="px-6 py-4 font-medium">Gross Revenue</th>
                    <th className="px-6 py-4 font-medium">Platform Fee (10%)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {data.trends && data.trends.map((row, idx) => (
                    <tr key={idx} className="hover:bg-slate-50 transition-colors">
                      <td className="px-6 py-4 font-medium text-heading">{row.date}</td>
                      <td className="px-6 py-4">{row.appointments.toLocaleString()}</td>
                      <td className="px-6 py-4">${(row.revenue * 10).toLocaleString()}</td>
                      <td className="px-6 py-4 text-green-600 font-medium">${row.revenue.toLocaleString()}</td>
                    </tr>
                  ))}
                  {(!data.trends || data.trends.length === 0) && (
                    <tr>
                      <td colSpan="4" className="px-6 py-8 text-center text-muted">No data available for the selected period.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      ) : null}
    </PageTransition>
  );
};

export default Reports;

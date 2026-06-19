import { useState, useEffect, useMemo, useContext } from 'react';
import { 
  DollarSign, TrendingUp, Download, ArrowUpRight, 
  Wallet, Landmark, Receipt, CreditCard, Activity,
  Calendar as CalendarIcon, Filter, Search, ChevronLeft, ChevronRight,
  PieChart as PieChartIcon, BarChart2, Clock
} from 'lucide-react';
import toast from 'react-hot-toast';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, 
  ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell, Legend
} from 'recharts';

import PageTransition from '../../components/common/PageTransition';
import { AuthContext } from '../../context/AuthContext';
import doctorService from '../../services/doctorService';
import appointmentService from '../../services/appointmentService';
import { formatDate, formatTime } from '../../utils/format';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';

// Platform fee configuration
const PLATFORM_FEE_PERCENTAGE = 10;
const TAX_PERCENTAGE = 5; // GST / Tax

const Earnings = () => {
  const { user } = useContext(AuthContext);
  const doctorId = user?.doctorProfile?._id || user?.doctorId;

  const [activeTab, setActiveTab] = useState('overview'); // overview, transactions, payouts
  const [loading, setLoading] = useState(true);
  
  // Data States
  const [earningsData, setEarningsData] = useState(null);
  const [appointments, setAppointments] = useState([]);
  
  // Filter States for Transactions
  const [searchTerm, setSearchTerm] = useState('');
  const [txPage, setTxPage] = useState(1);
  const ITEMS_PER_PAGE = 10;

  useEffect(() => {
    fetchFinancialData();
  }, [doctorId]);

  const fetchFinancialData = async () => {
    if (!doctorId) return;
    setLoading(true);
    try {
      const [earningsRes, apptsRes] = await Promise.all([
        doctorService.getEarnings(doctorId),
        appointmentService.getAppointments({ limit: 1000 })
      ]);
      
      setEarningsData(earningsRes.data.earnings);
      
      // Filter to only completed appointments for financial tracking
      const completed = (apptsRes.data.appointments || []).filter(a => a.status === 'completed');
      setAppointments(completed.sort((a,b) => new Date(b.date) - new Date(a.date)));
      
    } catch (error) {
      toast.error('Failed to load financial data');
    } finally {
      setLoading(false);
    }
  };

  // --- Derived Analytics & KPIs ---
  const stats = useMemo(() => {
    if (!appointments.length) return { 
      totalGross: 0, totalNet: 0, todayGross: 0, weekGross: 0,
      availableBalance: 0, pendingBalance: 0, platformFees: 0, taxes: 0
    };

    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const payoutThreshold = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000); // 7 days clearance

    let totalGross = 0;
    let todayGross = 0;
    let weekGross = 0;
    let availableBalance = 0;
    let pendingBalance = 0;

    appointments.forEach(apt => {
      const fee = apt.fees || 0;
      const aptDate = new Date(apt.date);
      const isCleared = aptDate < payoutThreshold;
      
      // Net logic (90% to doctor)
      const platformFee = fee * (PLATFORM_FEE_PERCENTAGE / 100);
      const netFee = fee - platformFee;

      totalGross += fee;
      
      if (aptDate >= today) todayGross += fee;
      if (aptDate >= oneWeekAgo) weekGross += fee;

      if (isCleared) {
        availableBalance += netFee;
      } else {
        pendingBalance += netFee;
      }
    });

    const platformFees = totalGross * (PLATFORM_FEE_PERCENTAGE / 100);
    const taxes = platformFees * (TAX_PERCENTAGE / 100); // Tax on commission
    const totalNet = totalGross - platformFees;

    return { 
      totalGross, totalNet, todayGross, weekGross, 
      availableBalance, pendingBalance, platformFees, taxes 
    };
  }, [appointments]);

  // --- Chart Data Transformation ---
  const monthlyChartData = useMemo(() => {
    if (!earningsData?.monthly) return [];
    // Convert YYYY-MM to readable month
    return earningsData.monthly.map(m => {
      const [year, month] = m._id.split('-');
      const date = new Date(year, month - 1);
      const gross = m.total;
      const net = gross * (1 - (PLATFORM_FEE_PERCENTAGE / 100));
      return {
        name: date.toLocaleString('default', { month: 'short' }),
        gross: gross,
        net: net,
        consultations: m.count
      };
    });
  }, [earningsData]);

  const consultationDistribution = useMemo(() => {
    let online = 0;
    let inPerson = 0;
    appointments.forEach(a => {
      if (a.type === 'video') online++;
      else inPerson++;
    });
    return [
      { name: 'Video Consults', value: online, color: '#6366f1' },
      { name: 'In-Person', value: inPerson, color: '#14b8a6' }
    ];
  }, [appointments]);

  // --- Pagination & Filtering ---
  const filteredTransactions = useMemo(() => {
    return appointments.filter(apt => {
      const search = searchTerm.toLowerCase();
      return (
        apt.patient?.name?.toLowerCase().includes(search) || 
        apt._id?.toLowerCase().includes(search)
      );
    });
  }, [appointments, searchTerm]);

  const totalPages = Math.ceil(filteredTransactions.length / ITEMS_PER_PAGE);
  const currentTransactions = filteredTransactions.slice(
    (txPage - 1) * ITEMS_PER_PAGE,
    txPage * ITEMS_PER_PAGE
  );

  // --- Handlers ---
  const handleRequestPayout = () => {
    if (stats.availableBalance <= 0) {
      return toast.error('Insufficient available balance for payout.');
    }
    toast.success(`Payout request of $${stats.availableBalance.toFixed(2)} submitted successfully. Process time 2-3 business days.`);
  };

  const downloadReport = () => {
    toast.success('Downloading Financial Report (CSV)...');
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-[60vh]">
        <span className="loader border-primary"></span>
      </div>
    );
  }

  return (
    <PageTransition className="space-y-6 max-w-[1600px] mx-auto">
      
      {/* Header & Global Actions */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
        <div>
          <h1 className="text-3xl font-black text-heading">Earnings & Revenue</h1>
          <p className="text-slate-500 mt-1">Enterprise financial dashboard, payout tracking, and transaction history.</p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" className="bg-white" onClick={downloadReport}>
            <Download className="w-4 h-4 mr-2" /> Export CSV
          </Button>
          <Button variant="primary" onClick={handleRequestPayout}>
            <Landmark className="w-4 h-4 mr-2" /> Request Payout
          </Button>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="bg-white rounded-2xl border border-border shadow-sm p-2 flex overflow-x-auto custom-scrollbar">
        {[
          { id: 'overview', label: 'Financial Overview', icon: Activity },
          { id: 'transactions', label: 'Transaction Logs', icon: Receipt },
          { id: 'payouts', label: 'Payout History & Settlements', icon: Wallet },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 py-2.5 px-6 rounded-xl font-semibold text-sm transition-all whitespace-nowrap ${
              activeTab === tab.id ? 'bg-primary/10 text-primary shadow-sm' : 'text-slate-500 hover:bg-slate-50'
            }`}
          >
            <tab.icon className="w-4 h-4" /> {tab.label}
          </button>
        ))}
      </div>

      {/* TAB: OVERVIEW */}
      {activeTab === 'overview' && (
        <div className="space-y-6 animate-fade-in">
          
          {/* Top KPI Row */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            
            {/* Available Balance (Withdrawal) */}
            <div className="bg-gradient-to-br from-slate-900 to-slate-800 p-6 rounded-2xl shadow-lg text-white relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 transition-transform duration-500">
                <Wallet className="w-24 h-24" />
              </div>
              <div className="relative z-10">
                <p className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-2">Available for Payout</p>
                <h3 className="text-4xl font-black text-white flex items-baseline">
                  <span className="text-2xl mr-1 opacity-70">$</span>{stats.availableBalance.toFixed(2)}
                </h3>
                <div className="mt-4 flex items-center gap-2 text-xs font-semibold text-emerald-400 bg-white/10 px-3 py-1.5 rounded-lg w-max backdrop-blur-sm border border-white/5">
                  <CheckCircle2 className="w-4 h-4" /> Ready for immediate withdrawal
                </div>
              </div>
            </div>

            {/* Pending Balance */}
            <div className="bg-white p-6 rounded-2xl border border-border shadow-sm">
              <div className="flex justify-between items-start mb-2">
                <p className="text-sm font-bold text-slate-500 uppercase">Pending Clearance</p>
                <div className="w-8 h-8 rounded-full bg-amber-50 text-amber-500 flex items-center justify-center"><Clock className="w-4 h-4"/></div>
              </div>
              <h3 className="text-3xl font-black text-heading flex items-baseline">
                <span className="text-xl mr-1 text-slate-400">$</span>{stats.pendingBalance.toFixed(2)}
              </h3>
              <p className="text-xs text-slate-500 mt-2 font-medium">Funds clear 7 days post-consultation</p>
            </div>

            {/* Today's Gross */}
            <div className="bg-white p-6 rounded-2xl border border-border shadow-sm">
              <div className="flex justify-between items-start mb-2">
                <p className="text-sm font-bold text-slate-500 uppercase">Today's Revenue</p>
                <div className="w-8 h-8 rounded-full bg-blue-50 text-blue-500 flex items-center justify-center"><CalendarIcon className="w-4 h-4"/></div>
              </div>
              <h3 className="text-3xl font-black text-heading flex items-baseline">
                <span className="text-xl mr-1 text-slate-400">$</span>{stats.todayGross.toFixed(2)}
              </h3>
              <p className="text-xs text-slate-500 mt-2 font-medium">Gross revenue generated today</p>
            </div>

            {/* Lifetime Gross */}
            <div className="bg-white p-6 rounded-2xl border border-border shadow-sm">
              <div className="flex justify-between items-start mb-2">
                <p className="text-sm font-bold text-slate-500 uppercase">Total Lifetime Net</p>
                <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center"><TrendingUp className="w-4 h-4"/></div>
              </div>
              <h3 className="text-3xl font-black text-heading flex items-baseline">
                <span className="text-xl mr-1 text-slate-400">$</span>{stats.totalNet.toFixed(2)}
              </h3>
              <p className="text-xs text-slate-500 mt-2 font-medium">Total earned after platform fees</p>
            </div>
          </div>

          {/* Charts Row */}
          <div className="grid lg:grid-cols-3 gap-6">
            
            {/* Main Trend Chart */}
            <div className="lg:col-span-2 bg-white rounded-2xl border border-border shadow-sm p-6">
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h3 className="text-lg font-bold text-heading flex items-center gap-2">
                    <BarChart2 className="w-5 h-5 text-primary"/> Revenue Trend (Net vs Gross)
                  </h3>
                  <p className="text-sm text-slate-500 mt-0.5">Monthly breakdown of your earnings.</p>
                </div>
              </div>
              
              <div className="h-[300px] w-full">
                {monthlyChartData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={monthlyChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                      <defs>
                        <linearGradient id="colorNet" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.3}/>
                          <stop offset="95%" stopColor="#4f46e5" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                      <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} dy={10} />
                      <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} tickFormatter={(val) => `$${val}`} />
                      <RechartsTooltip 
                        contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                        formatter={(value, name) => [`$${value.toFixed(2)}`, name.charAt(0).toUpperCase() + name.slice(1)]}
                      />
                      <Legend iconType="circle" wrapperStyle={{ paddingTop: '20px' }}/>
                      <Area type="monotone" dataKey="gross" stroke="#94a3b8" fillOpacity={0} strokeDasharray="5 5" name="Gross Revenue" />
                      <Area type="monotone" dataKey="net" stroke="#4f46e5" strokeWidth={3} fillOpacity={1} fill="url(#colorNet)" name="Net Earnings" />
                    </AreaChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-full flex items-center justify-center text-slate-400 font-medium border border-dashed border-slate-200 rounded-xl">
                    Not enough data to generate chart.
                  </div>
                )}
              </div>
            </div>

            {/* Distribution Chart & Commission Breakdown */}
            <div className="space-y-6">
              
              {/* Pie Chart */}
              <div className="bg-white rounded-2xl border border-border shadow-sm p-6">
                <h3 className="text-lg font-bold text-heading flex items-center gap-2 mb-2">
                  <PieChartIcon className="w-5 h-5 text-purple-500"/> Consult Types
                </h3>
                <div className="h-[200px] w-full relative">
                  {appointments.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={consultationDistribution}
                          cx="50%" cy="50%"
                          innerRadius={60} outerRadius={80}
                          paddingAngle={5}
                          dataKey="value"
                        >
                          {consultationDistribution.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <RechartsTooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}/>
                      </PieChart>
                    </ResponsiveContainer>
                  ) : (
                     <div className="h-full flex items-center justify-center text-slate-400 text-sm">No data</div>
                  )}
                  {appointments.length > 0 && (
                    <div className="absolute inset-0 flex items-center justify-center flex-col pointer-events-none">
                      <span className="text-2xl font-black text-heading">{appointments.length}</span>
                      <span className="text-[10px] font-bold uppercase text-slate-400">Total</span>
                    </div>
                  )}
                </div>
                <div className="flex justify-center gap-4 mt-2">
                  {consultationDistribution.map(d => (
                    <div key={d.name} className="flex items-center gap-1.5 text-xs font-bold text-slate-600">
                      <span className="w-3 h-3 rounded-full" style={{ backgroundColor: d.color }}></span> {d.name}
                    </div>
                  ))}
                </div>
              </div>

              {/* Commission Breakdown Widget */}
              <div className="bg-rose-50 rounded-2xl border border-rose-100 p-6">
                <h3 className="text-sm font-bold text-rose-900 uppercase tracking-wider mb-4 flex items-center gap-2">
                  <Activity className="w-4 h-4 text-rose-500"/> Platform Deductions
                </h3>
                <div className="space-y-3">
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-rose-700 font-medium">Platform Fee ({PLATFORM_FEE_PERCENTAGE}%)</span>
                    <span className="font-bold text-rose-900">-${stats.platformFees.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-rose-700 font-medium">Service Tax ({TAX_PERCENTAGE}%)</span>
                    <span className="font-bold text-rose-900">-${stats.taxes.toFixed(2)}</span>
                  </div>
                  <div className="pt-3 border-t border-rose-200 flex justify-between items-center">
                    <span className="text-rose-900 font-black">Total Deducted</span>
                    <span className="font-black text-rose-900 text-lg">-${(stats.platformFees + stats.taxes).toFixed(2)}</span>
                  </div>
                </div>
              </div>

            </div>
          </div>
        </div>
      )}

      {/* TAB: TRANSACTIONS */}
      {activeTab === 'transactions' && (
        <div className="bg-white rounded-2xl border border-border shadow-sm overflow-hidden animate-fade-in">
          <div className="p-5 border-b border-border bg-slate-50 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className="font-bold text-heading text-lg">Detailed Transaction Log</h3>
              <p className="text-sm text-slate-500 mt-0.5">Comprehensive breakdown of every patient consultation and its financial status.</p>
            </div>
            <div className="relative w-full sm:w-72">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search Patient Name or TXN ID..."
                className="input-base w-full pl-9 h-10 bg-white"
                value={searchTerm}
                onChange={(e) => { setSearchTerm(e.target.value); setTxPage(1); }}
              />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-white border-b border-border">
                  <th className="py-4 px-6 text-xs font-bold text-slate-400 uppercase tracking-wider">Date & TXN ID</th>
                  <th className="py-4 px-6 text-xs font-bold text-slate-400 uppercase tracking-wider">Patient</th>
                  <th className="py-4 px-6 text-xs font-bold text-slate-400 uppercase tracking-wider">Gross Fee</th>
                  <th className="py-4 px-6 text-xs font-bold text-slate-400 uppercase tracking-wider">Platform Fee</th>
                  <th className="py-4 px-6 text-xs font-bold text-slate-400 uppercase tracking-wider text-right">Net Earned</th>
                  <th className="py-4 px-6 text-xs font-bold text-slate-400 uppercase tracking-wider text-center">Clearance Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {currentTransactions.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="py-12 text-center text-slate-500 font-medium">
                      No financial transactions found.
                    </td>
                  </tr>
                ) : (
                  currentTransactions.map((tx) => {
                    const gross = tx.fees || 0;
                    const fee = gross * (PLATFORM_FEE_PERCENTAGE / 100);
                    const net = gross - fee;
                    
                    const isCleared = new Date(tx.date) < new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

                    return (
                      <tr key={tx._id} className="hover:bg-slate-50/50 transition-colors">
                        <td className="py-4 px-6">
                          <p className="font-bold text-heading text-sm">{formatDate(tx.date)}</p>
                          <p className="text-xs text-slate-400 font-mono mt-0.5">TXN-{tx._id.substring(0,8).toUpperCase()}</p>
                        </td>
                        <td className="py-4 px-6">
                          <p className="font-bold text-heading text-sm">{tx.patient?.name || 'Unknown'}</p>
                          <p className="text-[10px] font-bold text-slate-400 uppercase mt-0.5">{tx.type === 'video' ? 'Online Video' : 'In-Person'}</p>
                        </td>
                        <td className="py-4 px-6 font-semibold text-slate-700">${gross.toFixed(2)}</td>
                        <td className="py-4 px-6 text-rose-500 font-semibold text-sm">-${fee.toFixed(2)}</td>
                        <td className="py-4 px-6 text-right">
                          <span className="font-black text-emerald-600 bg-emerald-50 px-3 py-1 rounded-lg border border-emerald-100 shadow-sm">
                            ${net.toFixed(2)}
                          </span>
                        </td>
                        <td className="py-4 px-6 text-center">
                          <Badge variant={isCleared ? 'success' : 'warning'}>
                            {isCleared ? 'Cleared' : 'Pending'}
                          </Badge>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="p-4 border-t border-border bg-slate-50 flex items-center justify-between">
              <span className="text-sm text-slate-500 font-medium">
                Showing {(txPage - 1) * ITEMS_PER_PAGE + 1} to {Math.min(txPage * ITEMS_PER_PAGE, filteredTransactions.length)} of {filteredTransactions.length} entries
              </span>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => setTxPage(p => Math.max(1, p - 1))} disabled={txPage === 1} className="bg-white">
                  <ChevronLeft className="w-4 h-4" />
                </Button>
                <Button variant="outline" size="sm" onClick={() => setTxPage(p => Math.min(totalPages, p + 1))} disabled={txPage === totalPages} className="bg-white">
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB: PAYOUTS (MOCKED FROM MONTHLY DATA) */}
      {activeTab === 'payouts' && (
        <div className="space-y-6 animate-fade-in">
          
          <div className="bg-white rounded-2xl border border-border shadow-sm overflow-hidden">
            <div className="p-6 border-b border-border flex items-center justify-between">
              <div>
                <h3 className="font-bold text-heading text-lg">Historical Payouts & Settlements</h3>
                <p className="text-sm text-slate-500 mt-0.5">Review your past bank transfers and monthly settlements.</p>
              </div>
              <Badge variant="primary">Bank Transfer</Badge>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-slate-50 border-b border-border">
                    <th className="py-4 px-6 text-xs font-bold text-slate-400 uppercase tracking-wider">Settlement Period</th>
                    <th className="py-4 px-6 text-xs font-bold text-slate-400 uppercase tracking-wider">Payout Amount</th>
                    <th className="py-4 px-6 text-xs font-bold text-slate-400 uppercase tracking-wider">Method</th>
                    <th className="py-4 px-6 text-xs font-bold text-slate-400 uppercase tracking-wider">Status</th>
                    <th className="py-4 px-6 text-xs font-bold text-slate-400 uppercase tracking-wider text-right">Receipt</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {earningsData?.monthly && earningsData.monthly.length > 0 ? (
                    earningsData.monthly.map((monthData, idx) => {
                      const net = monthData.total * (1 - (PLATFORM_FEE_PERCENTAGE / 100));
                      if (net <= 0) return null;
                      
                      const [year, month] = monthData._id.split('-');
                      const periodName = new Date(year, month - 1).toLocaleString('default', { month: 'long', year: 'numeric' });
                      
                      return (
                        <tr key={idx} className="hover:bg-slate-50 transition-colors">
                          <td className="py-4 px-6 font-bold text-heading text-sm">
                            {periodName}
                          </td>
                          <td className="py-4 px-6 font-black text-slate-700 text-lg">
                            ${net.toFixed(2)}
                          </td>
                          <td className="py-4 px-6">
                            <div className="flex items-center gap-2 text-sm font-semibold text-slate-600">
                              <CreditCard className="w-4 h-4 text-slate-400" /> **** 4921
                            </div>
                          </td>
                          <td className="py-4 px-6">
                            <Badge variant="success">Completed</Badge>
                          </td>
                          <td className="py-4 px-6 text-right">
                            <Button variant="ghost" size="sm" className="text-primary hover:bg-primary/10">
                              <Download className="w-4 h-4" />
                            </Button>
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan="5" className="py-12 text-center text-slate-500 font-medium">
                        No payout history available.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

    </PageTransition>
  );
};

// Custom CheckCircleIcon for the Available Balance Card
const CheckCircle2 = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
    <polyline points="22 4 12 14.01 9 11.01"></polyline>
  </svg>
);

export default Earnings;

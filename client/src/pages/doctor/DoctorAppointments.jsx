import { useState, useEffect, useMemo, useContext } from 'react';
import { 
  Calendar, Clock, Search, CheckCircle, XCircle, FileText, 
  Video, Stethoscope, ChevronRight, Filter, AlignJustify, Grid,
  User, Phone, Mail, MapPin, Activity, ShieldAlert, X
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';

import PageTransition from '../../components/common/PageTransition';
import { AuthContext } from '../../context/AuthContext';
import appointmentService from '../../services/appointmentService';
import { formatDate, formatSlotTime } from '../../utils/format';
import Badge from '../../components/ui/Badge';
import Button from '../../components/ui/Button';

const STATUS_TABS = [
  { id: 'all', label: 'All Appointments' },
  { id: 'pending', label: 'Requests' },
  { id: 'confirmed', label: 'Upcoming' },
  { id: 'completed', label: 'Completed' },
  { id: 'cancelled', label: 'Cancelled' },
];

const DATE_FILTERS = [
  { id: 'all', label: 'All Time' },
  { id: 'today', label: 'Today' },
  { id: 'tomorrow', label: 'Tomorrow' },
  { id: 'this_week', label: 'This Week' },
];

const DoctorAppointments = () => {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();

  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Filters
  const [activeTab, setActiveTab] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [dateFilter, setDateFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  
  // View States
  const [viewMode, setViewMode] = useState(localStorage.getItem('docApptViewMode') || 'table');
  const [selectedAppt, setSelectedAppt] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    fetchAppointments();
    
    // Setup real-time listener if socket exists
    if (window.socket) {
      const handleNewNotif = () => fetchAppointments();
      window.socket.on('notification:new', handleNewNotif);
      return () => window.socket.off('notification:new', handleNewNotif);
    }
  }, []);

  const fetchAppointments = async () => {
    setLoading(true);
    try {
      // Fetch maximum to allow frontend complex filtering
      const res = await appointmentService.getAppointments({ limit: 500 });
      setAppointments(res.data.appointments || []);
    } catch (error) {
      console.error('Failed to fetch appointments:', error);
      toast.error('Could not load appointments');
    } finally {
      setLoading(false);
    }
  };

  const handleViewModeChange = (mode) => {
    setViewMode(mode);
    localStorage.setItem('docApptViewMode', mode);
  };

  const handleAction = async (id, action, reason = '') => {
    setActionLoading(true);
    try {
      if (action === 'confirm') await appointmentService.confirm(id);
      if (action === 'complete') await appointmentService.complete(id);
      if (action === 'cancel') await appointmentService.cancel(id, reason || 'Doctor unavailable');
      if (action === 'no-show') await appointmentService.markNoShow(id);
      
      toast.success(`Appointment ${action}ed successfully`);
      
      // Update local state to avoid refetching everything instantly
      setAppointments(prev => prev.map(apt => {
        if (apt._id === id) {
          const newStatus = action === 'confirm' ? 'confirmed' : 
                            action === 'complete' ? 'completed' : 
                            action === 'cancel' ? 'cancelled' : 
                            action === 'no-show' ? 'no-show' : apt.status;
          return { ...apt, status: newStatus };
        }
        return apt;
      }));
      
      if (selectedAppt && selectedAppt._id === id) {
        setSelectedAppt(null);
      }
    } catch (error) {
      toast.error(error.response?.data?.message || `Failed to ${action} appointment`);
    } finally {
      setActionLoading(false);
    }
  };

  const startConsultation = (appt) => {
    if (appt.type === 'video') {
      navigate(`/doctor/chat/${appt._id}`); // Or dedicated video room
    } else {
      toast.success('Consultation started. Record notes when finished.');
      // You could navigate to an electronic health record page here
    }
  };

  // KPI Calculations
  const stats = useMemo(() => {
    const todayStr = new Date().toDateString();
    let today = 0, pending = 0, upcoming = 0;
    
    appointments.forEach(apt => {
      if (new Date(apt.date).toDateString() === todayStr) today++;
      if (apt.status === 'pending') pending++;
      if (apt.status === 'confirmed') upcoming++;
    });

    return { total: appointments.length, today, pending, upcoming };
  }, [appointments]);

  // Filtering Logic
  const filteredAppointments = useMemo(() => {
    let result = [...appointments];

    // Status Filter
    if (activeTab !== 'all') {
      result = result.filter(a => a.status === activeTab);
    }

    // Type Filter
    if (typeFilter !== 'all') {
      result = result.filter(a => a.type === typeFilter);
    }

    // Date Filter
    if (dateFilter !== 'all') {
      const today = new Date();
      today.setHours(0,0,0,0);
      
      result = result.filter(a => {
        const aptDate = new Date(a.date);
        aptDate.setHours(0,0,0,0);
        
        if (dateFilter === 'today') return aptDate.getTime() === today.getTime();
        if (dateFilter === 'tomorrow') return aptDate.getTime() === today.getTime() + 86400000;
        if (dateFilter === 'this_week') {
          const endOfWeek = new Date(today);
          endOfWeek.setDate(today.getDate() + (7 - today.getDay()));
          return aptDate >= today && aptDate <= endOfWeek;
        }
        return true;
      });
    }

    // Search Query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(a => 
        a.patientId?.name?.toLowerCase().includes(q) || 
        a._id.toLowerCase().includes(q) ||
        a.patientId?.phone?.includes(q)
      );
    }

    // Sort by date/time
    return result.sort((a, b) => new Date(a.date) - new Date(b.date));
  }, [appointments, activeTab, typeFilter, dateFilter, searchQuery]);


  // Helper components
  const StatusBadge = ({ status }) => {
    const variants = {
      pending: 'warning',
      confirmed: 'success',
      completed: 'neutral',
      cancelled: 'danger',
      'no-show': 'danger'
    };
    return <Badge variant={variants[status] || 'neutral'} className="capitalize">{status}</Badge>;
  };

  return (
    <PageTransition className="space-y-6 relative">
      
      {/* Header & KPI Cards */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
        <div>
          <h1 className="text-3xl font-black text-heading">Appointments Center</h1>
          <p className="text-slate-500 mt-1">Manage all patient bookings, consultations, and schedule.</p>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-border shadow-sm flex items-center justify-between">
          <div>
            <p className="text-sm font-semibold text-slate-500 uppercase">Today</p>
            <h3 className="text-2xl font-black text-heading">{stats.today}</h3>
          </div>
          <div className="w-12 h-12 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center"><Calendar className="w-6 h-6" /></div>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-border shadow-sm flex items-center justify-between">
          <div>
            <p className="text-sm font-semibold text-slate-500 uppercase">Pending</p>
            <h3 className="text-2xl font-black text-amber-600">{stats.pending}</h3>
          </div>
          <div className="w-12 h-12 rounded-full bg-amber-50 text-amber-600 flex items-center justify-center"><Clock className="w-6 h-6" /></div>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-border shadow-sm flex items-center justify-between">
          <div>
            <p className="text-sm font-semibold text-slate-500 uppercase">Upcoming</p>
            <h3 className="text-2xl font-black text-emerald-600">{stats.upcoming}</h3>
          </div>
          <div className="w-12 h-12 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center"><CheckCircle className="w-6 h-6" /></div>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-border shadow-sm flex items-center justify-between">
          <div>
            <p className="text-sm font-semibold text-slate-500 uppercase">Total</p>
            <h3 className="text-2xl font-black text-heading">{stats.total}</h3>
          </div>
          <div className="w-12 h-12 rounded-full bg-purple-50 text-purple-600 flex items-center justify-center"><Activity className="w-6 h-6" /></div>
        </div>
      </div>

      {/* Advanced Filters */}
      <div className="bg-white rounded-2xl border border-border shadow-sm p-4">
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
          
          {/* Tabs */}
          <div className="flex overflow-x-auto custom-scrollbar w-full lg:w-auto bg-slate-50 p-1 rounded-xl">
            {STATUS_TABS.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`py-2 px-4 text-sm font-semibold rounded-lg whitespace-nowrap transition-all ${
                  activeTab === tab.id ? 'bg-white text-primary shadow-sm' : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">
            {/* Search */}
            <div className="relative flex-1 lg:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input 
                type="text" 
                placeholder="Search patient or ID..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-slate-50 border-none rounded-xl text-sm focus:ring-2 focus:ring-primary/20"
              />
            </div>

            {/* Date Filter */}
            <select 
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className="py-2 px-3 bg-slate-50 border-none rounded-xl text-sm font-medium focus:ring-2 focus:ring-primary/20 cursor-pointer"
            >
              {DATE_FILTERS.map(f => <option key={f.id} value={f.id}>{f.label}</option>)}
            </select>

            {/* Type Filter */}
            <select 
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="py-2 px-3 bg-slate-50 border-none rounded-xl text-sm font-medium focus:ring-2 focus:ring-primary/20 cursor-pointer"
            >
              <option value="all">All Types</option>
              <option value="video">Video Consult</option>
              <option value="in-person">In-Person</option>
            </select>

            {/* View Toggles */}
            <div className="flex bg-slate-50 p-1 rounded-xl">
              <button onClick={() => handleViewModeChange('table')} className={`p-1.5 rounded-lg ${viewMode === 'table' ? 'bg-white shadow-sm text-primary' : 'text-slate-400'}`}>
                <AlignJustify className="w-4 h-4" />
              </button>
              <button onClick={() => handleViewModeChange('card')} className={`p-1.5 rounded-lg ${viewMode === 'card' ? 'bg-white shadow-sm text-primary' : 'text-slate-400'}`}>
                <Grid className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Content Area */}
      {loading ? (
        <div className="bg-white rounded-2xl border border-border p-8 flex justify-center items-center h-64">
          <span className="loader border-primary"></span>
        </div>
      ) : filteredAppointments.length === 0 ? (
        <div className="bg-white rounded-2xl border border-border p-16 text-center">
          <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4">
            <Search className="w-10 h-10 text-slate-300" />
          </div>
          <h3 className="text-xl font-bold text-heading mb-2">No Appointments Found</h3>
          <p className="text-slate-500 max-w-sm mx-auto">We couldn't find any appointments matching your current filters. Try adjusting your search criteria.</p>
          <Button variant="outline" className="mt-6" onClick={() => { setActiveTab('all'); setDateFilter('all'); setTypeFilter('all'); setSearchQuery(''); }}>
            Clear All Filters
          </Button>
        </div>
      ) : (
        <>
          {viewMode === 'table' ? (
            <div className="bg-white rounded-2xl border border-border shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="bg-slate-50 text-slate-500 border-b border-border">
                    <tr>
                      <th className="px-6 py-4 font-semibold">Patient</th>
                      <th className="px-6 py-4 font-semibold">Date & Time</th>
                      <th className="px-6 py-4 font-semibold">Type</th>
                      <th className="px-6 py-4 font-semibold">Status</th>
                      <th className="px-6 py-4 font-semibold">Reason</th>
                      <th className="px-6 py-4 font-semibold text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {filteredAppointments.map(appt => (
                      <tr key={appt._id} className="hover:bg-slate-50/50 transition-colors cursor-pointer" onClick={() => setSelectedAppt(appt)}>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold shrink-0">
                              {appt.patientId?.name?.charAt(0) || 'P'}
                            </div>
                            <div>
                              <p className="font-bold text-heading">{appt.patientId?.name}</p>
                              <p className="text-xs text-slate-500 truncate w-32">ID: {appt._id.slice(-6)}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <p className="font-semibold text-heading flex items-center gap-1.5"><Calendar className="w-3.5 h-3.5 text-primary" /> {formatDate(appt.date)}</p>
                          <p className="text-xs text-slate-500 mt-0.5 ml-5">{formatSlotTime(appt.slotTime)}</p>
                        </td>
                        <td className="px-6 py-4">
                          <span className="flex items-center gap-1.5 capitalize font-medium text-slate-600">
                            {appt.type === 'video' ? <Video className="w-4 h-4 text-purple-500" /> : <Stethoscope className="w-4 h-4 text-emerald-500" />}
                            {appt.type.replace('-', ' ')}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <StatusBadge status={appt.status} />
                        </td>
                        <td className="px-6 py-4">
                          <p className="truncate w-40 text-slate-600">{appt.symptoms || 'Routine Checkup'}</p>
                        </td>
                        <td className="px-6 py-4 text-right" onClick={e => e.stopPropagation()}>
                          <Button variant="outline" size="sm" onClick={() => setSelectedAppt(appt)}>View Details</Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredAppointments.map(appt => (
                <div key={appt._id} className="bg-white rounded-2xl border border-border shadow-sm p-6 hover:shadow-md transition-shadow cursor-pointer" onClick={() => setSelectedAppt(appt)}>
                  <div className="flex justify-between items-start mb-4">
                    <StatusBadge status={appt.status} />
                    <span className="flex items-center gap-1 text-xs font-bold text-slate-500 capitalize bg-slate-100 px-2 py-1 rounded-md">
                      {appt.type === 'video' ? <Video className="w-3 h-3 text-purple-500" /> : <Stethoscope className="w-3 h-3 text-emerald-500" />}
                      {appt.type.replace('-', ' ')}
                    </span>
                  </div>
                  
                  <div className="flex items-center gap-4 mb-5">
                    <div className="w-12 h-12 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold text-lg shrink-0">
                      {appt.patientId?.name?.charAt(0) || 'P'}
                    </div>
                    <div>
                      <h4 className="font-bold text-heading text-lg">{appt.patientId?.name}</h4>
                      <p className="text-xs text-slate-500">{appt.patientId?.gender} • {appt.patientId?.phone || 'No Phone'}</p>
                    </div>
                  </div>

                  <div className="space-y-2 mb-6">
                    <div className="flex items-center gap-3 text-sm font-medium text-slate-700 bg-slate-50 p-2.5 rounded-xl">
                      <Calendar className="w-4 h-4 text-primary" />
                      {formatDate(appt.date)} at {formatSlotTime(appt.slotTime)}
                    </div>
                    <div className="flex items-start gap-3 text-sm text-slate-600 bg-slate-50 p-2.5 rounded-xl">
                      <Activity className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                      <p className="line-clamp-2">{appt.symptoms || 'Routine Checkup'}</p>
                    </div>
                  </div>

                  <Button variant="outline" className="w-full" onClick={(e) => { e.stopPropagation(); setSelectedAppt(appt); }}>
                    Manage Appointment
                  </Button>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {/* Appointment Detail Drawer */}
      {selectedAppt && (
        <div className="fixed inset-0 z-50 flex justify-end">
          {/* Backdrop */}
          <div className="absolute inset-0 bg-slate-900/20 backdrop-blur-sm transition-opacity" onClick={() => setSelectedAppt(null)}></div>
          
          {/* Drawer */}
          <div className="relative w-full max-w-md bg-white h-full shadow-2xl flex flex-col animate-slide-in-right overflow-hidden">
            
            {/* Drawer Header */}
            <div className="p-6 border-b border-border bg-slate-50 flex justify-between items-center shrink-0">
              <div>
                <h2 className="text-xl font-bold text-heading">Appointment Details</h2>
                <p className="text-sm text-slate-500 mt-1 flex items-center gap-2">
                  ID: <span className="font-mono bg-white px-1.5 py-0.5 rounded border border-border">{selectedAppt._id}</span>
                </p>
              </div>
              <button onClick={() => setSelectedAppt(null)} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-slate-200 text-slate-500 transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Drawer Body */}
            <div className="flex-1 overflow-y-auto p-6 space-y-8 custom-scrollbar">
              
              {/* Status & Actions Card */}
              <div className="bg-white border border-border rounded-2xl p-5 shadow-sm">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="font-bold text-heading">Current Status</h3>
                  <StatusBadge status={selectedAppt.status} />
                </div>
                
                {selectedAppt.status === 'pending' && (
                  <div className="flex gap-3 mt-4">
                    <Button variant="outline" className="flex-1 border-rose-200 text-rose-600 hover:bg-rose-50" onClick={() => handleAction(selectedAppt._id, 'cancel')} disabled={actionLoading}>
                      <XCircle className="w-4 h-4 mr-2" /> Reject
                    </Button>
                    <Button variant="primary" className="flex-1 bg-emerald-600 hover:bg-emerald-700 shadow-emerald-600/20" onClick={() => handleAction(selectedAppt._id, 'confirm')} disabled={actionLoading}>
                      <CheckCircle className="w-4 h-4 mr-2" /> Accept
                    </Button>
                  </div>
                )}

                {selectedAppt.status === 'confirmed' && (
                  <div className="space-y-3 mt-4">
                    <Button variant="primary" className="w-full" onClick={() => startConsultation(selectedAppt)}>
                      {selectedAppt.type === 'video' ? <><Video className="w-4 h-4 mr-2" /> Start Video Consult</> : <><Stethoscope className="w-4 h-4 mr-2" /> Start Consultation</>}
                    </Button>
                    <div className="flex gap-3">
                      <Button variant="outline" className="flex-1 text-xs h-9" onClick={() => handleAction(selectedAppt._id, 'complete')} disabled={actionLoading}>
                        Mark Completed
                      </Button>
                      <Button variant="outline" className="flex-1 text-xs h-9 border-rose-200 text-rose-600 hover:bg-rose-50" onClick={() => handleAction(selectedAppt._id, 'cancel')} disabled={actionLoading}>
                        Cancel
                      </Button>
                    </div>
                  </div>
                )}

                {selectedAppt.status === 'completed' && (
                  <div className="mt-4 p-3 bg-emerald-50 text-emerald-700 rounded-xl text-sm font-medium flex items-center justify-center border border-emerald-100">
                    <CheckCircle className="w-4 h-4 mr-2" /> Consultation Completed
                  </div>
                )}
              </div>

              {/* Patient Info */}
              <div>
                <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4 flex items-center gap-2"><User className="w-4 h-4" /> Patient Profile</h3>
                <div className="bg-slate-50 rounded-2xl p-5 border border-border">
                  <div className="flex items-center gap-4 mb-4 pb-4 border-b border-border">
                    <div className="w-14 h-14 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold text-xl shrink-0">
                      {selectedAppt.patientId?.name?.charAt(0) || 'P'}
                    </div>
                    <div>
                      <h4 className="font-bold text-heading text-lg">{selectedAppt.patientId?.name}</h4>
                      <p className="text-sm text-slate-500">{selectedAppt.patientId?.gender} • {selectedAppt.patientId?.dateOfBirth ? `${new Date().getFullYear() - new Date(selectedAppt.patientId.dateOfBirth).getFullYear()} years old` : 'Age N/A'}</p>
                    </div>
                  </div>
                  <div className="space-y-3 text-sm">
                    <div className="flex items-center gap-3 text-slate-600"><Phone className="w-4 h-4 text-slate-400" /> {selectedAppt.patientId?.phone || 'Not provided'}</div>
                    <div className="flex items-center gap-3 text-slate-600"><Mail className="w-4 h-4 text-slate-400" /> {selectedAppt.patientId?.email}</div>
                  </div>
                </div>
              </div>

              {/* Consultation Details */}
              <div>
                <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4 flex items-center gap-2"><FileText className="w-4 h-4" /> Consultation Details</h3>
                <div className="bg-white rounded-2xl p-0 border border-border divide-y divide-border">
                  <div className="p-4 flex justify-between items-center">
                    <span className="text-slate-500 text-sm">Type</span>
                    <span className="font-semibold text-heading flex items-center gap-1.5 capitalize">
                      {selectedAppt.type === 'video' ? <Video className="w-4 h-4 text-purple-500" /> : <MapPin className="w-4 h-4 text-emerald-500" />}
                      {selectedAppt.type.replace('-', ' ')}
                    </span>
                  </div>
                  <div className="p-4 flex justify-between items-center">
                    <span className="text-slate-500 text-sm">Date & Time</span>
                    <span className="font-semibold text-heading text-right">
                      {formatDate(selectedAppt.date)}<br/>
                      <span className="text-primary">{formatSlotTime(selectedAppt.slotTime)}</span>
                    </span>
                  </div>
                  <div className="p-4">
                    <span className="text-slate-500 text-sm block mb-2">Reason for Visit</span>
                    <p className="text-heading font-medium bg-slate-50 p-3 rounded-xl text-sm border border-slate-100">
                      {selectedAppt.symptoms || 'No specific reason provided by the patient.'}
                    </p>
                  </div>
                  {selectedAppt.patientId?.healthProfile?.allergies && selectedAppt.patientId.healthProfile.allergies.length > 0 && (
                    <div className="p-4">
                      <span className="text-slate-500 text-sm flex items-center gap-1.5 mb-2"><ShieldAlert className="w-4 h-4 text-rose-500" /> Known Allergies</span>
                      <div className="flex flex-wrap gap-2">
                        {selectedAppt.patientId.healthProfile.allergies.map((allergy, i) => (
                          <span key={i} className="bg-rose-50 text-rose-700 text-xs font-bold px-2.5 py-1 rounded-md border border-rose-100">{allergy}</span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Billing Info */}
              <div>
                <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4 flex items-center gap-2"><Activity className="w-4 h-4" /> Billing</h3>
                <div className="bg-slate-50 rounded-2xl p-5 border border-border flex justify-between items-center">
                  <div>
                    <p className="text-sm text-slate-500 mb-1">Consultation Fee</p>
                    <p className="text-xl font-black text-heading">${selectedAppt.fees || 0}</p>
                  </div>
                  <Badge variant={selectedAppt.paymentStatus === 'paid' ? 'success' : 'warning'} className="capitalize px-3 py-1">
                    {selectedAppt.paymentStatus || 'Pending'}
                  </Badge>
                </div>
              </div>

            </div>
          </div>
        </div>
      )}

    </PageTransition>
  );
};

export default DoctorAppointments;

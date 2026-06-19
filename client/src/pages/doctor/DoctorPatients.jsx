import { useState, useEffect, useMemo, useContext } from 'react';
import {
  Search, User, Phone, Mail, Activity, Calendar, FileText,
  ChevronRight, HeartPulse, Clock, X, Filter, Grid, AlignJustify, ShieldAlert,
  Stethoscope, FileSignature
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';

import PageTransition from '../../components/common/PageTransition';
import { AuthContext } from '../../context/AuthContext';
import appointmentService from '../../services/appointmentService';
import { formatDate } from '../../utils/format';
import Badge from '../../components/ui/Badge';
import Button from '../../components/ui/Button';
import Avatar from '../../components/common/Avatar';

const DoctorPatients = () => {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();

  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters & State
  const [searchQuery, setSearchQuery] = useState('');
  const [genderFilter, setGenderFilter] = useState('all');
  const [consultationFilter, setConsultationFilter] = useState('all');
  const [viewMode, setViewMode] = useState(localStorage.getItem('docPatientViewMode') || 'table');

  useEffect(() => {
    const fetchAllData = async () => {
      setLoading(true);
      try {
        // Fetch all appointments to derive patients and consultation histories locally
        const res = await appointmentService.getAppointments({ limit: 1000 });
        setAppointments(res.data.appointments || []);
      } catch (error) {
        console.error('Failed to fetch patient records:', error);
        toast.error('Could not load patient directory');
      } finally {
        setLoading(false);
      }
    };
    fetchAllData();
  }, []);

  const handleViewModeChange = (mode) => {
    setViewMode(mode);
    localStorage.setItem('docPatientViewMode', mode);
  };

  // Derive unique patients and their aggregated stats from appointments
  const patientsData = useMemo(() => {
    const pMap = new Map();

    appointments.forEach(appt => {
      const p = appt.patientId;
      if (!p) return;

      if (!pMap.has(p._id)) {
        pMap.set(p._id, {
          ...p,
          totalConsultations: 0,
          completedConsultations: 0,
          lastVisit: appt.date,
          upcomingFollowUps: 0,
          consultationTypes: new Set(),
          history: []
        });
      }

      const pd = pMap.get(p._id);
      pd.totalConsultations += 1;
      pd.consultationTypes.add(appt.type);
      pd.history.push(appt);

      if (appt.status === 'completed') pd.completedConsultations += 1;
      if (['confirmed', 'pending'].includes(appt.status) && new Date(appt.date) >= new Date()) {
        pd.upcomingFollowUps += 1;
      }

      if (new Date(appt.date) > new Date(pd.lastVisit)) {
        pd.lastVisit = appt.date;
      }
    });

    // Process sets to arrays and sort history
    return Array.from(pMap.values()).map(p => ({
      ...p,
      consultationTypes: Array.from(p.consultationTypes),
      history: p.history.sort((a, b) => new Date(b.date) - new Date(a.date)) // Newest first
    })).sort((a, b) => new Date(b.lastVisit) - new Date(a.lastVisit));
  }, [appointments]);

  // Derived KPI Stats
  const stats = useMemo(() => {
    const total = patientsData.length;
    const active = patientsData.filter(p => p.upcomingFollowUps > 0).length;

    let onlineCount = 0;
    let inPersonCount = 0;
    let newThisMonth = 0;

    const now = new Date();
    const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    patientsData.forEach(p => {
      if (p.consultationTypes.includes('video')) onlineCount++;
      if (p.consultationTypes.includes('in-person')) inPersonCount++;

      // Calculate 'new this month' based on their earliest appointment
      const earliestApt = p.history[p.history.length - 1];
      if (earliestApt && new Date(earliestApt.date) >= firstDayOfMonth) {
        newThisMonth++;
      }
    });

    return { total, active, newThisMonth, onlineCount, inPersonCount };
  }, [patientsData]);

  // Apply filters
  const filteredPatients = useMemo(() => {
    let result = [...patientsData];

    if (genderFilter !== 'all') {
      result = result.filter(p => p.gender === genderFilter);
    }

    if (consultationFilter !== 'all') {
      result = result.filter(p => p.consultationTypes.includes(consultationFilter));
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(p =>
        p.name?.toLowerCase().includes(q) ||
        p.email?.toLowerCase().includes(q) ||
        p.phone?.includes(q) ||
        p._id.toLowerCase().includes(q)
      );
    }

    return result;
  }, [patientsData, genderFilter, consultationFilter, searchQuery]);

  const calculateAge = (dob) => {
    if (!dob) return 'N/A';
    const ageDifMs = Date.now() - new Date(dob).getTime();
    const ageDate = new Date(ageDifMs);
    return Math.abs(ageDate.getUTCFullYear() - 1970);
  };

  return (
    <PageTransition className="space-y-6 relative">

      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
        <div>
          <h1 className="text-3xl font-black text-heading">Patient Directory</h1>
          <p className="text-slate-500 mt-1">Manage profiles, medical records, and treatment histories.</p>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-border shadow-sm flex items-center justify-between">
          <div>
            <p className="text-sm font-semibold text-slate-500 uppercase">Total Patients</p>
            <h3 className="text-2xl font-black text-heading">{stats.total}</h3>
          </div>
          <div className="w-12 h-12 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center"><User className="w-6 h-6" /></div>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-border shadow-sm flex items-center justify-between">
          <div>
            <p className="text-sm font-semibold text-slate-500 uppercase">Active (Follow-ups)</p>
            <h3 className="text-2xl font-black text-emerald-600">{stats.active}</h3>
          </div>
          <div className="w-12 h-12 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center"><HeartPulse className="w-6 h-6" /></div>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-border shadow-sm flex items-center justify-between">
          <div>
            <p className="text-sm font-semibold text-slate-500 uppercase">New This Month</p>
            <h3 className="text-2xl font-black text-purple-600">{stats.newThisMonth}</h3>
          </div>
          <div className="w-12 h-12 rounded-full bg-purple-50 text-purple-600 flex items-center justify-center"><Calendar className="w-6 h-6" /></div>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-border shadow-sm flex items-center justify-between">
          <div>
            <p className="text-sm font-semibold text-slate-500 uppercase">Online Consults</p>
            <h3 className="text-2xl font-black text-heading">{stats.onlineCount}</h3>
          </div>
          <div className="w-12 h-12 rounded-full bg-slate-50 text-slate-600 flex items-center justify-center"><Activity className="w-6 h-6" /></div>
        </div>
      </div>

      {/* Advanced Filters */}
      <div className="bg-white rounded-2xl border border-border shadow-sm p-4">
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">

          <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto flex-1">
            {/* Search */}
            <div className="relative flex-1 min-w-[200px] max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search by name, email, or phone..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-slate-50 border-none rounded-xl text-sm focus:ring-2 focus:ring-primary/20"
              />
            </div>

            {/* Gender Filter */}
            <select
              value={genderFilter}
              onChange={(e) => setGenderFilter(e.target.value)}
              className="py-2 px-3 bg-slate-50 border-none rounded-xl text-sm font-medium focus:ring-2 focus:ring-primary/20 cursor-pointer"
            >
              <option value="all">All Genders</option>
              <option value="male">Male</option>
              <option value="female">Female</option>
              <option value="other">Other</option>
            </select>

            {/* Consultation Filter */}
            <select
              value={consultationFilter}
              onChange={(e) => setConsultationFilter(e.target.value)}
              className="py-2 px-3 bg-slate-50 border-none rounded-xl text-sm font-medium focus:ring-2 focus:ring-primary/20 cursor-pointer"
            >
              <option value="all">All Consultation Types</option>
              <option value="video">Online (Video)</option>
              <option value="in-person">In-Person</option>
            </select>
          </div>

          {/* View Toggles */}
          <div className="flex bg-slate-50 p-1 rounded-xl shrink-0">
            <button onClick={() => handleViewModeChange('table')} className={`p-1.5 rounded-lg ${viewMode === 'table' ? 'bg-white shadow-sm text-primary' : 'text-slate-400'}`}>
              <AlignJustify className="w-4 h-4" />
            </button>
            <button onClick={() => handleViewModeChange('card')} className={`p-1.5 rounded-lg ${viewMode === 'card' ? 'bg-white shadow-sm text-primary' : 'text-slate-400'}`}>
              <Grid className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Main Directory Area */}
      {loading ? (
        <div className="bg-white rounded-2xl border border-border p-8 flex justify-center items-center h-64">
          <span className="loader border-primary"></span>
        </div>
      ) : filteredPatients.length === 0 ? (
        <div className="bg-white rounded-2xl border border-border p-16 text-center">
          <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4">
            <User className="w-10 h-10 text-slate-300" />
          </div>
          <h3 className="text-xl font-bold text-heading mb-2">No Patients Found</h3>
          <p className="text-slate-500 max-w-sm mx-auto">No patients match the current search criteria or you have not treated any patients yet.</p>
          <Button variant="outline" className="mt-6" onClick={() => { setGenderFilter('all'); setConsultationFilter('all'); setSearchQuery(''); }}>
            Clear Filters
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
                      <th className="px-6 py-4 font-semibold">Contact Info</th>
                      <th className="px-6 py-4 font-semibold">Last Visit</th>
                      <th className="px-6 py-4 font-semibold">Consults</th>
                      <th className="px-6 py-4 font-semibold">Status</th>
                      <th className="px-6 py-4 font-semibold text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {filteredPatients.map(patient => (
                      <tr key={patient._id} className="hover:bg-slate-50/50 transition-colors cursor-pointer" onClick={() => navigate(`/doctor/patients/${patient._id}`)}>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <Avatar src={patient.avatar?.url} name={patient.name} role="patient" size="md" className="border border-border shrink-0" />
                            <div>
                              <p className="font-bold text-heading">{patient.name}</p>
                              <p className="text-xs text-slate-500 capitalize">{calculateAge(patient.dateOfBirth)} yrs • {patient.gender}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <p className="text-slate-600 flex items-center gap-1.5 mb-1"><Phone className="w-3.5 h-3.5" /> {patient.phone || 'N/A'}</p>
                          <p className="text-xs text-slate-500 flex items-center gap-1.5"><Mail className="w-3.5 h-3.5" /> {patient.email}</p>
                        </td>
                        <td className="px-6 py-4">
                          <p className="font-semibold text-heading flex items-center gap-1.5"><Calendar className="w-3.5 h-3.5 text-primary" /> {formatDate(patient.lastVisit)}</p>
                        </td>
                        <td className="px-6 py-4">
                          <span className="font-bold text-heading">{patient.totalConsultations}</span>
                          <span className="text-slate-500 text-xs ml-1">total</span>
                        </td>
                        <td className="px-6 py-4">
                          {patient.upcomingFollowUps > 0 ? (
                            <Badge variant="warning" className="bg-amber-50 text-amber-700 border-none px-2 py-1">Needs Follow-up</Badge>
                          ) : (
                            <Badge variant="success" className="bg-emerald-50 text-emerald-700 border-none px-2 py-1">Up to date</Badge>
                          )}
                        </td>
                        <td className="px-6 py-4 text-right" onClick={e => e.stopPropagation()}>
                          <Button variant="outline" size="sm" onClick={() => navigate(`/doctor/patients/${patient._id}`)}>View Profile</Button>
                        </td>
                      </tr> 
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {filteredPatients.map(patient => (
                <div key={patient._id} className="bg-white rounded-2xl border border-border shadow-sm p-6 hover:shadow-md transition-shadow cursor-pointer relative" onClick={() => navigate(`/doctor/patients/${patient._id}`)}>

                  {patient.upcomingFollowUps > 0 && (
                    <div className="absolute top-4 right-4 w-3 h-3 bg-amber-500 rounded-full shadow-sm" title="Upcoming Follow-up"></div>
                  )}

                  <div className="flex flex-col items-center text-center mb-4">
                    <Avatar src={patient.avatar?.url} name={patient.name} role="patient" className="w-20 h-20 border-4 border-slate-50 shadow-sm mb-3 shrink-0" />
                    <h4 className="font-bold text-heading text-lg leading-tight">{patient.name}</h4>
                    <p className="text-xs text-slate-500 capitalize mt-1">{calculateAge(patient.dateOfBirth)} yrs • {patient.gender}</p>
                  </div>

                  <div className="space-y-3 mb-6 bg-slate-50 p-4 rounded-xl border border-slate-100">
                    <div className="flex items-center text-sm text-slate-600">
                      <Phone className="w-4 h-4 mr-2.5 text-slate-400" /> <span className="truncate">{patient.phone || 'N/A'}</span>
                    </div>
                    <div className="flex items-center text-sm text-slate-600">
                      <Mail className="w-4 h-4 mr-2.5 text-slate-400" /> <span className="truncate">{patient.email}</span>
                    </div>
                    <div className="flex items-center text-sm text-slate-600">
                      <Activity className="w-4 h-4 mr-2.5 text-slate-400" /> {patient.totalConsultations} Consultations
                    </div>
                  </div>

                  <Button variant="outline" className="w-full" onClick={(e) => { e.stopPropagation(); navigate(`/doctor/patients/${patient._id}`); }}>
                    Full Profile
                  </Button>
                </div>
              ))}
            </div>
          )}
        </>
      )}

    </PageTransition>
  );
};

export default DoctorPatients;

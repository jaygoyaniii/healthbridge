import { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { 
  Pill, FileText, Download, Eye, Calendar, User, Search, Filter, 
  Clock, Activity, AlertCircle, CheckCircle 
} from 'lucide-react';
import toast from 'react-hot-toast';
import PageTransition from '../../components/common/PageTransition';
import prescriptionService from '../../services/prescriptionService';
import { formatDate } from '../../utils/format';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import Input from '../../components/ui/Input';

const STATUS_TABS = [
  { id: 'all', label: 'All Prescriptions' },
  { id: 'active', label: 'Active (Last 30 Days)' },
  { id: 'older', label: 'Past Prescriptions' },
];

const Prescriptions = () => {
  const [prescriptions, setPrescriptions] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Filtering & State
  const [activeTab, setActiveTab] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchPrescriptions();
  }, []);

  const fetchPrescriptions = async () => {
    setLoading(true);
    try {
      // Fetch a larger limit to allow robust client-side filtering and stats
      const { data } = await prescriptionService.getPrescriptions({ limit: 100 });
      setPrescriptions(data.prescriptions || []);
    } catch (error) {
      console.error('Failed to fetch prescriptions:', error);
      toast.error('Could not load prescriptions');
    } finally {
      setLoading(false);
    }
  };

  // Helper to determine if prescription is "Active" (roughly within last 30 days)
  const isPrescriptionActive = (dateString) => {
    const presDate = new Date(dateString);
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    return presDate >= thirtyDaysAgo;
  };

  // Derived Statistics
  const stats = useMemo(() => {
    let active = 0, past = 0, totalMeds = 0;
    
    prescriptions.forEach(pres => {
      if (isPrescriptionActive(pres.createdAt)) active++;
      else past++;
      
      if (pres.medicines && pres.medicines.length) {
        totalMeds += pres.medicines.length;
      }
    });
    
    return { total: prescriptions.length, active, past, totalMeds };
  }, [prescriptions]);

  // Filter Logic
  const filteredPrescriptions = useMemo(() => {
    return prescriptions.filter(pres => {
      // 1. Tab Filter
      const isActive = isPrescriptionActive(pres.createdAt);
      if (activeTab === 'active' && !isActive) return false;
      if (activeTab === 'older' && isActive) return false;

      // 2. Search Filter (Doctor Name, Diagnosis, or Medication Name)
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const docName = pres.doctorId?.name?.toLowerCase() || '';
        const diagnosis = pres.diagnosis?.toLowerCase() || '';
        const hasMedication = pres.medicines?.some(med => med.name?.toLowerCase().includes(query));
        
        if (!docName.includes(query) && !diagnosis.includes(query) && !hasMedication) {
          return false;
        }
      }

      return true;
    });
  }, [prescriptions, activeTab, searchQuery]);

  return (
    <PageTransition className="max-w-7xl mx-auto space-y-6">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 mb-8">
        <div>
          <h1 className="text-3xl font-heading font-black text-heading mb-2">My Prescriptions</h1>
          <p className="text-muted">Access your medications, dosage instructions, and treatment history securely.</p>
        </div>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="card p-4 flex items-center gap-4 bg-white shadow-sm border border-slate-100">
          <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center text-blue-600">
            <FileText className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs text-muted font-medium uppercase tracking-wider">Total</p>
            <p className="text-xl font-bold text-heading">{stats.total}</p>
          </div>
        </div>
        <div className="card p-4 flex items-center gap-4 bg-white shadow-sm border border-slate-100">
          <div className="w-10 h-10 rounded-full bg-emerald-50 flex items-center justify-center text-emerald-600">
            <Activity className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs text-muted font-medium uppercase tracking-wider">Active</p>
            <p className="text-xl font-bold text-heading">{stats.active}</p>
          </div>
        </div>
        <div className="card p-4 flex items-center gap-4 bg-white shadow-sm border border-slate-100">
          <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-600">
            <Clock className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs text-muted font-medium uppercase tracking-wider">Past History</p>
            <p className="text-xl font-bold text-heading">{stats.past}</p>
          </div>
        </div>
        <div className="card p-4 flex items-center gap-4 bg-white shadow-sm border border-slate-100">
          <div className="w-10 h-10 rounded-full bg-purple-50 flex items-center justify-center text-purple-600">
            <Pill className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs text-muted font-medium uppercase tracking-wider">Medications</p>
            <p className="text-xl font-bold text-heading">{stats.totalMeds}</p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-border overflow-hidden">
        {/* Navigation & Filters Bar */}
        <div className="border-b border-border bg-slate-50/50">
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center">
            
            {/* Tabs */}
            <div className="flex overflow-x-auto custom-scrollbar w-full lg:w-auto px-2">
              {STATUS_TABS.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`whitespace-nowrap py-4 px-6 font-semibold text-sm transition-colors border-b-2 ${
                    activeTab === tab.id
                      ? 'border-primary text-primary bg-primary/5 rounded-t-lg'
                      : 'border-transparent text-slate-500 hover:text-heading hover:border-border'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Quick Search */}
            <div className="w-full lg:w-80 p-3 lg:p-0 lg:pr-4">
               <div className="relative">
                 <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" />
                 <input 
                   type="text"
                   placeholder="Search diagnosis or medication..."
                   className="input-base w-full pl-9 h-9 text-sm bg-white"
                   value={searchQuery}
                   onChange={(e) => setSearchQuery(e.target.value)}
                 />
               </div>
            </div>
          </div>
        </div>

        {/* List */}
        <div className="p-4 sm:p-6 bg-slate-50/30">
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {[1, 2, 3, 4].map(i => <div key={i} className="card p-6 h-48 skeleton rounded-2xl" />)}
            </div>
          ) : filteredPrescriptions.length === 0 ? (
            <div className="py-16 text-center border-2 border-dashed border-slate-200 rounded-2xl bg-white">
              <div className="w-20 h-20 bg-purple-50 rounded-full flex items-center justify-center mx-auto mb-5 shadow-sm">
                <FileText className="w-10 h-10 text-purple-300" />
              </div>
              <h3 className="text-xl font-bold text-heading mb-2">No prescriptions found</h3>
              <p className="text-muted max-w-md mx-auto mb-6">
                {searchQuery || activeTab !== 'all' 
                  ? "We couldn't find any prescriptions matching your search criteria." 
                  : "You don't have any prescriptions on record yet."}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {filteredPrescriptions.map((pres) => {
                const isActive = isPrescriptionActive(pres.createdAt);
                
                return (
                  <div key={pres._id} className="bg-white rounded-2xl p-6 border border-border shadow-sm hover:shadow-md transition-shadow group relative overflow-hidden flex flex-col">
                    
                    {/* Status Strip */}
                    <div className={`absolute top-0 left-0 right-0 h-1.5 ${isActive ? 'bg-emerald-400' : 'bg-slate-300'}`}></div>

                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="text-xl font-bold text-heading line-clamp-1" title={pres.diagnosis || 'General Consultation'}>
                            {pres.diagnosis || 'General Consultation'}
                          </h3>
                        </div>
                        <p className="text-primary font-medium text-sm flex items-center">
                          <User className="w-3.5 h-3.5 mr-1" /> Dr. {pres.doctorId?.name}
                        </p>
                      </div>
                      <Badge variant={isActive ? 'success' : 'neutral'} className="shrink-0 capitalize">
                        {isActive ? 'Active' : 'Past'}
                      </Badge>
                    </div>

                    <div className="flex items-center gap-4 text-xs text-slate-600 mb-5 bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                      <span className="flex items-center">
                        <Calendar className="w-4 h-4 mr-1.5 text-slate-400" />
                        Issued: {formatDate(pres.createdAt)}
                      </span>
                      {pres.followUpDate && (
                        <span className="flex items-center text-orange-600 font-medium">
                          <AlertCircle className="w-4 h-4 mr-1.5" />
                          Follow-up: {formatDate(pres.followUpDate)}
                        </span>
                      )}
                    </div>

                    {/* Medicines Preview */}
                    <div className="flex-1 mb-6">
                      <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">Prescribed Medications</h4>
                      <div className="space-y-3">
                        {pres.medicines?.slice(0, 3).map((med, idx) => (
                          <div key={idx} className="flex items-start">
                            <Pill className="w-4 h-4 text-purple-400 mr-2 shrink-0 mt-0.5" />
                            <div>
                              <p className="font-semibold text-slate-800 text-sm leading-tight">{med.name}</p>
                              <p className="text-xs text-slate-500 mt-0.5">
                                {med.dosage} • {med.frequency} {med.duration ? `for ${med.duration}` : ''}
                              </p>
                            </div>
                          </div>
                        ))}
                        {pres.medicines?.length > 3 && (
                          <p className="text-xs text-primary font-medium pl-6 pt-1">
                            + {pres.medicines.length - 3} more medications...
                          </p>
                        )}
                        {(!pres.medicines || pres.medicines.length === 0) && (
                          <p className="text-sm text-slate-500 italic pl-6">No specific medications listed.</p>
                        )}
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-3 pt-4 border-t border-slate-100 mt-auto">
                      <Link to={`/patient/prescriptions/${pres._id}`} className="flex-1">
                        <Button variant="primary" className="w-full text-sm h-10 shadow-sm">
                          <Eye className="w-4 h-4 mr-2" /> View Full Prescription
                        </Button>
                      </Link>
                      <Button variant="outline" className="shrink-0 w-10 h-10 p-0" title="Download PDF">
                        <Download className="w-4 h-4 text-slate-600" />
                      </Button>
                    </div>

                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </PageTransition>
  );
};

export default Prescriptions;

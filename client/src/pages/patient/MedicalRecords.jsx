import { useState, useEffect, useMemo, useRef } from 'react';
import { Link } from 'react-router-dom';
import { 
  FileText, Activity, Pill, UploadCloud, Search, Filter, 
  Download, Eye, Calendar, User, FileImage, File, Clock 
} from 'lucide-react';
import toast from 'react-hot-toast';
import PageTransition from '../../components/common/PageTransition';
import medicalService from '../../services/medicalService';
import prescriptionService from '../../services/prescriptionService';
import { formatDate } from '../../utils/format';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import Input from '../../components/ui/Input';

const RECORD_TYPES = [
  { id: 'all', label: 'All Records' },
  { id: 'prescription', label: 'Prescriptions', icon: Pill },
  { id: 'lab_report', label: 'Lab Reports', icon: Activity },
  { id: 'scan', label: 'Scans & Imaging', icon: FileImage },
  { id: 'other', label: 'Other Documents', icon: File },
];

const MedicalRecords = () => {
  const [unifiedRecords, setUnifiedRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeType, setActiveType] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef(null);

  // Upload Form State
  const [uploadData, setUploadData] = useState({
    title: '',
    type: 'lab_report',
    description: '',
    file: null
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const results = await Promise.allSettled([
        medicalService.getRecords({ limit: 100 }),
        prescriptionService.getPrescriptions({ limit: 100 })
      ]);

      const recordsRes = results[0].status === 'fulfilled' ? results[0].value : { data: { records: [] } };
      const presRes = results[1].status === 'fulfilled' ? results[1].value : { data: { prescriptions: [] } };

      if (results[0].status === 'rejected') console.error('Medical Records API failed:', results[0].reason);
      if (results[1].status === 'rejected') console.error('Prescriptions API failed:', results[1].reason);

      if (results.some(r => r.status === 'rejected')) {
        toast.error('Some records could not be loaded.');
      }

      const formattedRecords = (recordsRes.data.records || []).map(r => ({
        id: r._id,
        category: r.type || 'other',
        title: r.title || 'Untitled Document',
        date: r.createdAt || r.date,
        description: r.description,
        fileUrl: r.file?.url,
        fileName: r.file?.name,
        doctor: null, // Medical records might be self-uploaded
        source: 'upload',
        raw: r
      }));

      const formattedPrescriptions = (presRes.data.prescriptions || []).map(p => ({
        id: p._id,
        category: 'prescription',
        title: `Prescription from Dr. ${p.doctorId?.name}`,
        date: p.createdAt,
        description: p.diagnosis || 'General Consultation',
        fileUrl: null, // Assuming no direct file, viewed via app UI
        fileName: null,
        doctor: p.doctorId?.name,
        source: 'system',
        raw: p
      }));

      const combined = [...formattedRecords, ...formattedPrescriptions].sort(
        (a, b) => new Date(b.date) - new Date(a.date)
      );

      setUnifiedRecords(combined);
    } catch (error) {
      console.error('Failed to fetch records:', error);
      toast.error('Could not load medical records');
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setUploadData(prev => ({ ...prev, file: e.target.files[0], title: prev.title || e.target.files[0].name }));
    }
  };

  const handleUploadSubmit = async (e) => {
    e.preventDefault();
    if (!uploadData.file) return toast.error('Please select a file');

    const toastId = toast.loading('Uploading record...');
    try {
      await medicalService.uploadRecord(uploadData);
      toast.success('Record uploaded successfully', { id: toastId });
      setIsUploading(false);
      setUploadData({ title: '', type: 'lab_report', description: '', file: null });
      fetchData();
    } catch (error) {
      console.error(error);
      toast.error('Failed to upload record', { id: toastId });
    }
  };

  const handleDelete = async (id, source) => {
    if (source !== 'upload') return toast.error('Cannot delete system-generated records');
    if (!window.confirm('Are you sure you want to delete this record?')) return;
    
    try {
      await medicalService.deleteRecord(id);
      toast.success('Record deleted');
      fetchData();
    } catch (error) {
      console.error(error);
      toast.error('Failed to delete record');
    }
  };

  const filteredRecords = useMemo(() => {
    return unifiedRecords.filter(record => {
      if (activeType !== 'all' && record.category !== activeType) return false;
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        return (
          record.title.toLowerCase().includes(query) || 
          (record.description && record.description.toLowerCase().includes(query)) ||
          (record.doctor && record.doctor.toLowerCase().includes(query))
        );
      }
      return true;
    });
  }, [unifiedRecords, activeType, searchQuery]);

  const getIconForType = (type) => {
    switch(type) {
      case 'prescription': return <Pill className="w-5 h-5 text-purple-500" />;
      case 'lab_report': return <Activity className="w-5 h-5 text-blue-500" />;
      case 'scan': return <FileImage className="w-5 h-5 text-emerald-500" />;
      default: return <FileText className="w-5 h-5 text-orange-500" />;
    }
  };

  return (
    <PageTransition className="max-w-6xl mx-auto space-y-6">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 mb-8">
        <div>
          <h1 className="text-3xl font-heading font-black text-heading mb-2">Medical Records</h1>
          <p className="text-muted">Manage your health history, lab reports, and prescriptions securely.</p>
        </div>
        <Button 
          variant="primary" 
          onClick={() => setIsUploading(!isUploading)}
          className="w-full md:w-auto shadow-md shadow-primary/20"
        >
          <UploadCloud className="w-5 h-5 mr-2" /> Upload New Record
        </Button>
      </div>

      {/* Upload Section (Collapsible) */}
      {isUploading && (
        <div className="bg-blue-50 border border-blue-100 rounded-2xl p-6 mb-8 animate-in slide-in-from-top-4">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-bold text-blue-900 text-lg">Upload Medical Document</h3>
            <Button variant="ghost" size="sm" onClick={() => setIsUploading(false)} className="text-blue-600">Cancel</Button>
          </div>
          <form onSubmit={handleUploadSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-blue-900 mb-1">Document Title</label>
                <input 
                  type="text" 
                  required
                  placeholder="e.g. Blood Test Results"
                  className="input-base w-full bg-white border-blue-200"
                  value={uploadData.title}
                  onChange={e => setUploadData(prev => ({ ...prev, title: e.target.value }))}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-blue-900 mb-1">Document Type</label>
                <select 
                  className="input-base w-full bg-white border-blue-200"
                  value={uploadData.type}
                  onChange={e => setUploadData(prev => ({ ...prev, type: e.target.value }))}
                >
                  <option value="lab_report">Lab Report</option>
                  <option value="scan">Scan & Imaging</option>
                  <option value="prescription">External Prescription</option>
                  <option value="other">Other Document</option>
                </select>
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-blue-900 mb-1">Notes (Optional)</label>
                <input 
                  type="text" 
                  placeholder="Add any relevant context..."
                  className="input-base w-full bg-white border-blue-200"
                  value={uploadData.description}
                  onChange={e => setUploadData(prev => ({ ...prev, description: e.target.value }))}
                />
              </div>
              <div className="md:col-span-2">
                <div 
                  className="border-2 border-dashed border-blue-300 rounded-xl p-8 text-center bg-white cursor-pointer hover:bg-blue-50/50 transition-colors"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <input 
                    type="file" 
                    ref={fileInputRef} 
                    className="hidden" 
                    onChange={handleFileChange}
                    accept=".pdf,.png,.jpg,.jpeg"
                  />
                  <UploadCloud className="w-10 h-10 text-blue-400 mx-auto mb-2" />
                  {uploadData.file ? (
                    <p className="text-blue-700 font-medium">{uploadData.file.name}</p>
                  ) : (
                    <>
                      <p className="text-blue-700 font-medium">Click to select a file</p>
                      <p className="text-blue-500 text-sm mt-1">Supports PDF, JPG, PNG up to 10MB</p>
                    </>
                  )}
                </div>
              </div>
            </div>
            <div className="flex justify-end">
              <Button type="submit" variant="primary">Save Record</Button>
            </div>
          </form>
        </div>
      )}

      {/* Filters and Search */}
      <div className="bg-white rounded-2xl shadow-sm border border-border p-2 flex flex-col lg:flex-row justify-between items-center gap-4">
        <div className="flex overflow-x-auto custom-scrollbar w-full lg:w-auto">
          {RECORD_TYPES.map((type) => {
            const Icon = type.icon;
            return (
              <button
                key={type.id}
                onClick={() => setActiveType(type.id)}
                className={`whitespace-nowrap py-3 px-5 font-semibold text-sm transition-colors rounded-xl flex items-center ${
                  activeType === type.id
                    ? 'bg-primary/10 text-primary'
                    : 'text-slate-600 hover:bg-slate-50'
                }`}
              >
                {Icon && <Icon className="w-4 h-4 mr-2 opacity-70" />}
                {type.label}
              </button>
            )
          })}
        </div>
        <div className="w-full lg:w-72 px-2 pb-2 lg:px-0 lg:pb-0 lg:pr-2">
          <Input 
            placeholder="Search records..."
            leftIcon={<Search className="w-4 h-4" />}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="h-10"
          />
        </div>
      </div>

      {/* Timeline View */}
      {loading ? (
        <div className="space-y-4 pt-4">
          {[1, 2, 3].map(i => <div key={i} className="card p-6 h-32 skeleton rounded-2xl" />)}
        </div>
      ) : filteredRecords.length === 0 ? (
        <div className="card p-16 text-center border-dashed border-2 mt-8">
          <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4">
            <FileText className="w-10 h-10 text-slate-300" />
          </div>
          <h3 className="text-xl font-bold text-heading mb-2">No Records Found</h3>
          <p className="text-muted max-w-sm mx-auto">
            {searchQuery || activeType !== 'all' 
              ? "We couldn't find any documents matching your filters." 
              : "You haven't uploaded any medical records yet. Keep your health history organized by uploading them here."}
          </p>
        </div>
      ) : (
        <div className="relative pt-6">
          {/* Vertical Timeline Line */}
          <div className="absolute left-6 md:left-24 top-10 bottom-0 w-0.5 bg-slate-200"></div>

          <div className="space-y-8">
            {filteredRecords.map((record) => (
              <div key={`${record.category}-${record.id}`} className="relative flex items-start gap-4 md:gap-8 group">
                
                {/* Date Left Margin (Desktop) */}
                <div className="hidden md:block w-16 pt-3 text-right">
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-widest block">{new Date(record.date).toLocaleString('default', { month: 'short' })}</span>
                  <span className="text-xl font-black text-heading leading-none">{new Date(record.date).getDate()}</span>
                  <span className="text-xs text-slate-400 block mt-0.5">{new Date(record.date).getFullYear()}</span>
                </div>

                {/* Timeline Icon */}
                <div className="relative z-10 w-12 h-12 rounded-full bg-white border-4 border-slate-50 shadow-sm flex items-center justify-center shrink-0 group-hover:border-primary/20 group-hover:scale-110 transition-all">
                  {getIconForType(record.category)}
                </div>

                {/* Card Content */}
                <div className="flex-1 bg-white rounded-2xl p-5 md:p-6 border border-border shadow-sm group-hover:shadow-md transition-shadow relative overflow-hidden">
                  
                  {/* Color strip indicating category */}
                  <div className={`absolute left-0 top-0 bottom-0 w-1 ${
                    record.category === 'prescription' ? 'bg-purple-400' :
                    record.category === 'lab_report' ? 'bg-blue-400' :
                    record.category === 'scan' ? 'bg-emerald-400' : 'bg-orange-400'
                  }`}></div>

                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                    <div className="flex-1">
                      {/* Mobile Date */}
                      <div className="md:hidden text-xs font-medium text-primary mb-2 flex items-center">
                        <Calendar className="w-3.5 h-3.5 mr-1" />
                        {formatDate(record.date)}
                      </div>
                      
                      <h3 className="text-lg font-bold text-heading mb-1">{record.title}</h3>
                      
                      {record.description && (
                        <p className="text-sm text-slate-600 mb-3">{record.description}</p>
                      )}

                      <div className="flex flex-wrap gap-3 text-xs text-muted font-medium">
                        <Badge variant="neutral" className="capitalize bg-slate-50">{record.category.replace('_', ' ')}</Badge>
                        {record.doctor && (
                          <span className="flex items-center"><User className="w-3.5 h-3.5 mr-1" /> {record.doctor}</span>
                        )}
                        <span className="flex items-center"><Clock className="w-3.5 h-3.5 mr-1" /> Added {new Date(record.date).toLocaleDateString()}</span>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex sm:flex-col items-center justify-end gap-2 shrink-0 border-t sm:border-t-0 pt-3 sm:pt-0 border-border">
                      {record.fileUrl ? (
                        <>
                          <a href={record.fileUrl} target="_blank" rel="noopener noreferrer" className="w-full">
                            <Button variant="outline" className="w-full text-xs h-9">
                              <Eye className="w-3.5 h-3.5 mr-1.5" /> View
                            </Button>
                          </a>
                          <a href={record.fileUrl} download={record.fileName} target="_blank" rel="noopener noreferrer" className="w-full">
                            <Button variant="ghost" className="w-full text-xs h-9 bg-slate-50 hover:bg-slate-100">
                              <Download className="w-3.5 h-3.5 mr-1.5" /> Save
                            </Button>
                          </a>
                        </>
                      ) : record.category === 'prescription' ? (
                        <Link to={`/patient/prescriptions/${record.id}`} className="w-full">
                          <Button variant="outline" className="w-full text-xs h-9">
                            <Eye className="w-3.5 h-3.5 mr-1.5" /> Details
                          </Button>
                        </Link>
                      ) : null}

                      {record.source === 'upload' && (
                         <Button 
                           variant="ghost" 
                           className="w-full text-xs h-9 text-red-500 hover:text-red-700 hover:bg-red-50 mt-1"
                           onClick={() => handleDelete(record.id, record.source)}
                         >
                           Delete
                         </Button>
                      )}
                    </div>
                  </div>
                </div>

              </div>
            ))}
          </div>
        </div>
      )}

    </PageTransition>
  );
};

export default MedicalRecords;

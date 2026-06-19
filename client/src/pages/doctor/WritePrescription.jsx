import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  Plus, Trash2, Save, FileText, CheckCircle, 
  ArrowLeft, User, Calendar as CalendarIcon, Activity, AlertCircle 
} from 'lucide-react';
import toast from 'react-hot-toast';
import PageTransition from '../../components/common/PageTransition';
import appointmentService from '../../services/appointmentService';
import prescriptionService from '../../services/prescriptionService';
import Input from '../../components/ui/Input';
import Button from '../../components/ui/Button';
import Avatar from '../../components/common/Avatar';

const WritePrescription = () => {
  const { appointmentId } = useParams();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  // Data
  const [appointment, setAppointment] = useState(null);
  
  // Form State
  const [diagnosis, setDiagnosis] = useState('');
  const [advice, setAdvice] = useState('');
  const [followUpDate, setFollowUpDate] = useState('');
  const [medicines, setMedicines] = useState([]);
  const [isDraft, setIsDraft] = useState(false); // Current saved state status

  useEffect(() => {
    fetchData();
  }, [appointmentId]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const { data } = await appointmentService.getById(appointmentId);
      setAppointment(data.appointment);
      
      // If a prescription already exists (e.g. draft), populate form
      if (data.appointment.prescription) {
        const pres = data.appointment.prescription;
        setDiagnosis(pres.diagnosis || '');
        setAdvice(pres.advice || '');
        if (pres.followUpDate) {
          // Format to YYYY-MM-DD for input type="date"
          setFollowUpDate(new Date(pres.followUpDate).toISOString().split('T')[0]);
        }
        setMedicines(pres.medicines || []);
        setIsDraft(pres.isDraft);
        
        if (!pres.isDraft) {
          toast.success('Viewing finalized prescription. It cannot be edited.');
        }
      } else {
        // Start with one empty medicine row
        addMedicine();
      }
    } catch (error) {
      console.error(error);
      toast.error('Failed to load appointment details');
      navigate(-1);
    } finally {
      setLoading(false);
    }
  };

  const addMedicine = () => {
    setMedicines([...medicines, { name: '', dosage: '', frequency: '', duration: '', instructions: '' }]);
  };

  const removeMedicine = (index) => {
    setMedicines(medicines.filter((_, i) => i !== index));
  };

  const handleMedicineChange = (index, field, value) => {
    const updated = [...medicines];
    updated[index][field] = value;
    setMedicines(updated);
  };

  const handleSave = async (saveAsDraft = false) => {
    // Basic validation if not saving as draft
    if (!saveAsDraft) {
      if (!diagnosis.trim()) {
        toast.error('Diagnosis is required to finalize prescription');
        return;
      }
      if (medicines.length === 0) {
        toast.error('At least one medicine is required to finalize');
        return;
      }
      // Check for empty medicine names
      if (medicines.some(m => !m.name.trim() || !m.dosage.trim() || !m.frequency.trim())) {
        toast.error('Please complete all medicine fields (Name, Dosage, Frequency)');
        return;
      }
    }

    setSaving(true);
    try {
      const payload = {
        appointmentId,
        diagnosis,
        advice,
        followUpDate: followUpDate || null,
        medicines: medicines.filter(m => m.name.trim() !== ''), // Filter out completely empty rows
        isDraft: saveAsDraft
      };

      await prescriptionService.create(payload);
      
      toast.success(saveAsDraft ? 'Draft saved successfully' : 'Prescription finalized and issued');
      
      if (!saveAsDraft) {
        navigate('/doctor/appointments');
      } else {
        setIsDraft(true);
      }
    } catch (error) {
      console.error(error);
      toast.error(error.response?.data?.message || 'Failed to save prescription');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center">
        <span className="loader w-10 h-10 border-4 border-primary border-b-transparent rounded-full animate-spin"></span>
        <p className="mt-4 text-muted">Loading prescription pad...</p>
      </div>
    );
  }

  if (!appointment) return null;

  const isReadOnly = appointment.prescription && !isDraft;

  return (
    <PageTransition className="max-w-5xl mx-auto space-y-8 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <button 
            onClick={() => navigate(-1)}
            className="flex items-center text-sm font-medium text-muted hover:text-primary transition-colors mb-2"
          >
            <ArrowLeft className="w-4 h-4 mr-1" /> Back to Appointment
          </button>
          <h1 className="text-3xl font-heading font-black text-heading">Prescription Pad</h1>
          <p className="text-muted">Issue medications and advice for your patient</p>
        </div>
        
        {isReadOnly ? (
          <div className="flex items-center gap-2 bg-green-50 text-green-700 px-4 py-2 rounded-lg border border-green-200">
            <CheckCircle className="w-5 h-5" />
            <span className="font-bold">Finalized</span>
          </div>
        ) : (
          <div className="flex items-center gap-3 w-full sm:w-auto">
            <Button 
              variant="outline" 
              onClick={() => handleSave(true)}
              disabled={saving}
              className="flex-1 sm:flex-none shadow-sm"
            >
              <Save className="w-4 h-4 mr-2" /> Save Draft
            </Button>
            <Button 
              variant="primary" 
              onClick={() => handleSave(false)}
              isLoading={saving}
              className="flex-1 sm:flex-none shadow-sm shadow-primary/20"
            >
              <CheckCircle className="w-4 h-4 mr-2" /> Finalize & Issue
            </Button>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Column: Patient & Appt Info */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white rounded-2xl p-6 border border-border shadow-sm">
            <h3 className="text-sm font-bold text-slate-500 uppercase tracking-widest mb-4">Patient Info</h3>
            
            <div className="flex items-center gap-4 mb-6">
              <Avatar
                src={appointment.patientId?.avatar?.url}
                name={appointment.patientId?.name}
                role="patient"
                size="lg"
                className="shrink-0"
              />
              <div>
                <p className="font-bold text-heading">{appointment.patientId?.name}</p>
                <p className="text-xs text-slate-500 capitalize">{appointment.patientId?.gender || 'N/A'} • {appointment.patientId?.dateOfBirth ? `${new Date().getFullYear() - new Date(appointment.patientId.dateOfBirth).getFullYear()} yrs` : ''}</p>
              </div>
            </div>

            <div className="space-y-4 pt-4 border-t border-slate-100 text-sm">
              <div className="flex justify-between items-center">
                <span className="text-slate-500 flex items-center"><CalendarIcon className="w-4 h-4 mr-2" /> Appt Date</span>
                <span className="font-medium text-heading">{new Date(appointment.date).toLocaleDateString()}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-500 flex items-center"><Activity className="w-4 h-4 mr-2" /> Blood Group</span>
                <span className="font-medium text-red-500">{appointment.patientId?.healthProfile?.bloodGroup || 'Unknown'}</span>
              </div>
            </div>
            
            {appointment.symptoms && (
              <div className="mt-6 p-4 bg-orange-50 rounded-xl border border-orange-100">
                <h4 className="text-xs font-bold text-orange-800 uppercase mb-2 flex items-center">
                  <AlertCircle className="w-3.5 h-3.5 mr-1" /> Reported Symptoms
                </h4>
                <p className="text-sm text-orange-900">{appointment.symptoms}</p>
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Prescription Form */}
        <div className="lg:col-span-2 space-y-6">
          
          <div className="bg-white rounded-2xl p-6 md:p-8 border border-border shadow-sm">
            <h3 className="flex items-center text-lg font-bold text-heading mb-6 pb-4 border-b border-slate-100">
              <FileText className="w-5 h-5 mr-2 text-primary" /> Clinical Assessment
            </h3>
            
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-bold text-heading mb-2">Diagnosis <span className="text-red-500">*</span></label>
                <Input
                  placeholder="E.g., Acute Viral Pharyngitis"
                  value={diagnosis}
                  onChange={(e) => setDiagnosis(e.target.value)}
                  disabled={isReadOnly}
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-heading mb-2">Clinical Notes & Advice</label>
                <textarea
                  className="input-base w-full min-h-[100px] resize-y"
                  placeholder="Additional instructions, lifestyle advice, or diet restrictions..."
                  value={advice}
                  onChange={(e) => setAdvice(e.target.value)}
                  disabled={isReadOnly}
                />
              </div>
              
              <div>
                <label className="block text-sm font-bold text-heading mb-2">Follow-up Date</label>
                <Input
                  type="date"
                  value={followUpDate}
                  onChange={(e) => setFollowUpDate(e.target.value)}
                  disabled={isReadOnly}
                  min={new Date().toISOString().split('T')[0]}
                />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-6 md:p-8 border border-border shadow-sm">
            <div className="flex justify-between items-center mb-6 pb-4 border-b border-slate-100">
              <h3 className="flex items-center text-lg font-bold text-heading">
                Rx Medications
              </h3>
              {!isReadOnly && (
                <Button variant="outline" size="sm" onClick={addMedicine}>
                  <Plus className="w-4 h-4 mr-1" /> Add Medicine
                </Button>
              )}
            </div>

            <div className="space-y-4">
              {medicines.map((med, index) => (
                <div key={index} className="relative bg-slate-50 p-5 rounded-xl border border-slate-200 group">
                  {!isReadOnly && medicines.length > 1 && (
                    <button 
                      onClick={() => removeMedicine(index)}
                      className="absolute -top-3 -right-3 w-8 h-8 bg-white border border-slate-200 rounded-full flex items-center justify-center text-slate-400 hover:text-red-500 hover:border-red-200 hover:bg-red-50 transition-colors shadow-sm z-10"
                      title="Remove Medicine"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                  
                  <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
                    <div className="md:col-span-5">
                      <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Medicine Name <span className="text-red-500">*</span></label>
                      <Input
                        placeholder="E.g., Amoxicillin 500mg"
                        value={med.name}
                        onChange={(e) => handleMedicineChange(index, 'name', e.target.value)}
                        disabled={isReadOnly}
                      />
                    </div>
                    
                    <div className="md:col-span-3">
                      <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Dosage <span className="text-red-500">*</span></label>
                      <Input
                        placeholder="E.g., 1 Tablet"
                        value={med.dosage}
                        onChange={(e) => handleMedicineChange(index, 'dosage', e.target.value)}
                        disabled={isReadOnly}
                      />
                    </div>
                    
                    <div className="md:col-span-4">
                      <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Frequency <span className="text-red-500">*</span></label>
                      <select
                        className="input-base w-full bg-white"
                        value={med.frequency}
                        onChange={(e) => handleMedicineChange(index, 'frequency', e.target.value)}
                        disabled={isReadOnly}
                      >
                        <option value="">Select...</option>
                        <option value="Once a day">Once a day</option>
                        <option value="Twice a day">Twice a day</option>
                        <option value="Three times a day">Three times a day</option>
                        <option value="Four times a day">Four times a day</option>
                        <option value="Every 4 hours">Every 4 hours</option>
                        <option value="Every 6 hours">Every 6 hours</option>
                        <option value="Every 8 hours">Every 8 hours</option>
                        <option value="As needed">As needed (PRN)</option>
                      </select>
                    </div>
                    
                    <div className="md:col-span-5">
                      <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Duration</label>
                      <Input
                        placeholder="E.g., 5 Days"
                        value={med.duration}
                        onChange={(e) => handleMedicineChange(index, 'duration', e.target.value)}
                        disabled={isReadOnly}
                      />
                    </div>
                    
                    <div className="md:col-span-7">
                      <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Instructions</label>
                      <Input
                        placeholder="E.g., After meals"
                        value={med.instructions}
                        onChange={(e) => handleMedicineChange(index, 'instructions', e.target.value)}
                        disabled={isReadOnly}
                      />
                    </div>
                  </div>
                </div>
              ))}
              
              {medicines.length === 0 && !isReadOnly && (
                <div className="text-center py-8 bg-slate-50 rounded-xl border-2 border-dashed border-slate-200">
                  <p className="text-muted">No medicines added.</p>
                  <Button variant="outline" size="sm" onClick={addMedicine} className="mt-4">
                    <Plus className="w-4 h-4 mr-1" /> Add First Medicine
                  </Button>
                </div>
              )}
            </div>
          </div>

        </div>
      </div>
    </PageTransition>
  );
};

export default WritePrescription;

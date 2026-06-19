import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  FileText, Printer, Download, ArrowLeft, Activity,
  User, Calendar as CalendarIcon, Clock, Phone, MapPin
} from 'lucide-react';
import toast from 'react-hot-toast';
import PageTransition from '../../components/common/PageTransition';
import prescriptionService from '../../services/prescriptionService';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import { formatDate } from '../../utils/format';
import { useAuth } from '../../hooks/useAuth';

const PrescriptionDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [prescription, setPrescription] = useState(null);
  const [loading, setLoading] = useState(true);
  const printRef = useRef(null);

  useEffect(() => {
    fetchPrescription();
  }, [id]);

  const fetchPrescription = async () => {
    setLoading(true);
    try {
      const { data } = await prescriptionService.getById(id);
      setPrescription(data.prescription);
    } catch (error) {
      console.error('Error fetching prescription:', error);
      toast.error('Could not load prescription details.');
      navigate(-1);
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  if (loading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center">
        <span className="loader w-10 h-10 border-4 border-primary border-b-transparent rounded-full animate-spin"></span>
        <p className="mt-4 text-muted font-medium">Loading prescription details...</p>
      </div>
    );
  }

  if (!prescription) return null;

  const { doctorId: doctor, patientId: patient, appointmentId: appointment } = prescription;

  return (
    <PageTransition className="max-w-4xl mx-auto space-y-6 pb-12 print:max-w-full print:m-0 print:p-0 print:space-y-0">

      {/* Header Actions - Hidden in print */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6 print:hidden">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center text-sm font-medium text-muted hover:text-primary transition-colors"
        >
          <ArrowLeft className="w-4 h-4 mr-1" /> Back
        </button>

        <div className="flex items-center gap-3">
          <Badge variant={prescription.isDraft ? 'warning' : 'success'} className="uppercase">
            {prescription.isDraft ? 'Draft' : 'Finalized'}
          </Badge>
          {!prescription.isDraft && (
            <>
              <Button variant="outline" onClick={handlePrint} className="h-9 shadow-sm">
                <Printer className="w-4 h-4 mr-2 text-slate-500" /> Print
              </Button>
              <Button variant="primary" className="h-9 shadow-sm shadow-primary/20">
                <Download className="w-4 h-4 mr-2" /> Download PDF
              </Button>
            </>
          )}
        </div>
      </div>

      {/* The Prescription Document */}
      <div
        ref={printRef}
        className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden print:border-none print:shadow-none print:rounded-none"
      >
        {/* Document Header */}
        <div className="bg-slate-50 border-b border-slate-200 p-8 print:bg-white print:p-0 print:pb-6 print:border-b-2 print:border-slate-800">
          <div className="flex justify-between items-start">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-primary text-white flex items-center justify-center shadow-md print:hidden">
                <Activity className="w-7 h-7" />
              </div>
              <div>
                <h1 className="text-2xl font-black text-heading font-heading">HealthBridge Clinic</h1>
                <p className="text-sm text-slate-500">69-80 Healthcare Super Mutispeciality Hospital,Mota Varachha, Surat-394101</p>
                <p className="text-sm text-slate-500">Phone: +91 82389 38615 • info@healthbridge.com</p>
              </div>
            </div>
            <div className="text-right">
              <h2 className="text-lg font-bold text-heading">Dr. {doctor?.name}</h2>
              <p className="text-sm text-primary font-medium">{doctor?.specialization?.name || 'General Physician'}</p>
              <p className="text-sm text-slate-500">Reg No: HB-{doctor?._id?.substring(0, 6).toUpperCase()}</p>
            </div>
          </div>
        </div>

        <div className="p-8 print:p-0 print:pt-6">
          {/* Metadata Row */}
          <div className="flex justify-between items-center pb-6 border-b border-slate-100 mb-6 text-sm text-slate-600">
            <div>
              <span className="font-bold uppercase tracking-wider text-xs text-slate-400 block mb-1">Prescription ID</span>
              <span className="font-medium">RX-{prescription._id.substring(0, 8).toUpperCase()}</span>
            </div>
            <div className="text-center">
              <span className="font-bold uppercase tracking-wider text-xs text-slate-400 block mb-1">Date Issued</span>
              <span className="font-medium flex items-center justify-center"><CalendarIcon className="w-4 h-4 mr-1.5" /> {formatDate(prescription.createdAt)}</span>
            </div>
            <div className="text-right">
              <span className="font-bold uppercase tracking-wider text-xs text-slate-400 block mb-1">Valid Until</span>
              <span className="font-medium flex items-center justify-end"><Clock className="w-4 h-4 mr-1.5" /> {prescription.followUpDate ? formatDate(prescription.followUpDate) : 'Not Specified'}</span>
            </div>
          </div>

          {/* Patient Info Card */}
          <div className="bg-slate-50 rounded-xl p-5 mb-8 border border-slate-100 print:bg-white print:border-2 print:border-slate-200">
            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-4">Patient Information</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <p className="text-xs text-slate-500 mb-1">Patient Name</p>
                <p className="font-bold text-heading flex items-center"><User className="w-3.5 h-3.5 mr-1 text-slate-400" /> {patient?.name}</p>
              </div>
              <div>
                <p className="text-xs text-slate-500 mb-1">Age / Gender</p>
                <p className="font-medium text-slate-700 capitalize">
                  {patient?.dateOfBirth ? `${new Date().getFullYear() - new Date(patient.dateOfBirth).getFullYear()} yrs` : 'N/A'} / {patient?.gender || 'N/A'}
                </p>
              </div>
              <div>
                <p className="text-xs text-slate-500 mb-1">Contact</p>
                <p className="font-medium text-slate-700 flex items-center"><Phone className="w-3.5 h-3.5 mr-1 text-slate-400" /> {patient?.phone || 'Not provided'}</p>
              </div>
              <div>
                <p className="text-xs text-slate-500 mb-1">Consultation Mode</p>
                <p className="font-medium text-slate-700 capitalize">{appointment?.type || 'In-Person'}</p>
              </div>
            </div>
          </div>

          {/* Diagnosis */}
          <div className="mb-10">
            <h3 className="flex items-center text-lg font-bold text-heading mb-3 pb-2 border-b border-slate-100">
              <FileText className="w-5 h-5 mr-2 text-primary" /> Clinical Diagnosis
            </h3>
            <p className="text-slate-700 leading-relaxed bg-white p-4 rounded-xl border border-slate-100 print:border-none print:p-0 print:bg-transparent">
              {prescription.diagnosis}
            </p>
          </div>

          {/* Rx Icon */}
          <div className="mb-6 font-serif text-5xl font-black text-primary print:text-black">
            Rx
          </div>

          {/* Medicines List */}
          <div className="mb-10">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b-2 border-slate-200">
                    <th className="py-3 px-4 font-bold text-sm text-slate-500 uppercase tracking-wider">Medicine Name</th>
                    <th className="py-3 px-4 font-bold text-sm text-slate-500 uppercase tracking-wider">Dosage</th>
                    <th className="py-3 px-4 font-bold text-sm text-slate-500 uppercase tracking-wider">Frequency</th>
                    <th className="py-3 px-4 font-bold text-sm text-slate-500 uppercase tracking-wider">Duration</th>
                    <th className="py-3 px-4 font-bold text-sm text-slate-500 uppercase tracking-wider">Instructions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {prescription.medicines?.map((med, idx) => (
                    <tr key={idx} className="group hover:bg-slate-50/50 transition-colors print:hover:bg-transparent">
                      <td className="py-4 px-4">
                        <p className="font-bold text-heading">{med.name}</p>
                      </td>
                      <td className="py-4 px-4 text-slate-700">{med.dosage}</td>
                      <td className="py-4 px-4 text-slate-700 capitalize">{med.frequency}</td>
                      <td className="py-4 px-4 text-slate-700">{med.duration}</td>
                      <td className="py-4 px-4 text-slate-600 text-sm italic">{med.instructions || '--'}</td>
                    </tr>
                  ))}
                  {(!prescription.medicines || prescription.medicines.length === 0) && (
                    <tr>
                      <td colSpan="5" className="py-8 text-center text-slate-500 italic">No medicines prescribed.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* General Advice */}
          {prescription.advice && (
            <div className="mb-10 bg-blue-50/50 p-6 rounded-2xl border border-blue-100 print:bg-white print:border-slate-200 print:rounded-none">
              <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider mb-2">Doctor's Advice & Instructions</h3>
              <p className="text-slate-700 whitespace-pre-wrap">{prescription.advice}</p>
            </div>
          )}

          {/* Signatures & Footer */}
          <div className="mt-16 pt-8 border-t border-slate-200 flex justify-between items-end">
            <div className="text-xs text-slate-400">
              <p>Generated electronically by HealthBridge.</p>
              <p>Prescription ID: {prescription._id}</p>
            </div>
            <div className="text-center w-48">
              <div className="border-b-2 border-slate-300 mb-2 h-12"></div>
              <p className="font-bold text-heading text-sm">Dr. {doctor?.name}</p>
              <p className="text-xs text-slate-500">Authorized Signature</p>
            </div>
          </div>
        </div>
      </div>

    </PageTransition>
  );
};

export default PrescriptionDetail;

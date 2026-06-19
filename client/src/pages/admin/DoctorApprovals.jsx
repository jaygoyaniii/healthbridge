import { useState, useEffect } from 'react';
import { CheckCircle, XCircle, FileText, AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import { Link } from 'react-router-dom';
import PageTransition from '../../components/common/PageTransition';
import adminService from '../../services/adminService';
import Button from '../../components/ui/Button';
import useUIStore from '../../store/useUIStore';
import Modal from '../../components/ui/Modal';

const DoctorApprovals = () => {
  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(true);
  const { openModal, closeModal } = useUIStore();
  const [selectedDoc, setSelectedDoc] = useState(null);
  const [rejectReason, setRejectReason] = useState('');

  useEffect(() => {
    fetchApprovals();
  }, []);

  const fetchApprovals = async () => {
    setLoading(true);
    try {
      const { data } = await adminService.getDoctorApprovals();
      setDoctors(data.doctors || []);
    } catch (error) {
      toast.error('Failed to fetch pending approvals');
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (id) => {
    if (!window.confirm('Approve this doctor to practice on HealthBridge?')) return;
    try {
      await adminService.approveDoctor(id);
      toast.success('Doctor approved successfully');
      fetchApprovals();
    } catch (error) {
      toast.error('Failed to approve doctor');
    }
  };

  const openRejectModal = (doc) => {
    setSelectedDoc(doc);
    setRejectReason('');
    openModal('REJECT_DOCTOR');
  };

  const handleReject = async () => {
    if (!rejectReason.trim()) return toast.error('Please provide a reason');
    
    try {
      await adminService.rejectDoctor(selectedDoc._id, rejectReason);
      toast.success('Doctor application rejected');
      closeModal();
      fetchApprovals();
    } catch (error) {
      toast.error('Failed to reject doctor');
    }
  };

  return (
    <PageTransition className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-h2 font-heading text-heading">Doctor Verifications</h1>
          <p className="text-muted mt-1">Review and approve new practitioner accounts.</p>
        </div>
      </div>

      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map(i => <div key={i} className="card p-6 h-32 skeleton" />)}
        </div>
      ) : doctors.length === 0 ? (
        <div className="card p-12 text-center border-dashed">
          <CheckCircle className="w-12 h-12 text-green-500/50 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-heading mb-1">All Caught Up!</h3>
          <p className="text-muted">There are no pending doctor verifications at the moment.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {doctors.map((doc) => (
            <div key={doc._id} className="card p-6 flex flex-col lg:flex-row gap-6 justify-between items-start lg:items-center">
              
              <div className="flex-1 space-y-4 w-full">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="text-xl font-bold text-heading">
                      <Link to={`/admin/doctors/${doc.userId?._id}`} className="hover:text-primary hover:underline transition-colors">
                        Dr. {doc.userId?.name}
                      </Link>
                    </h3>
                    <p className="text-primary font-medium">{doc.specialization?.name}</p>
                  </div>
                  <div className="text-right text-sm text-muted">
                    Applied: {new Date(doc.createdAt).toLocaleDateString()}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-muted">Email:</span> <span className="font-medium text-heading">{doc.userId?.email}</span>
                  </div>
                  <div>
                    <span className="text-muted">Phone:</span> <span className="font-medium text-heading">{doc.userId?.phone}</span>
                  </div>
                  <div>
                    <span className="text-muted">Clinic:</span> <span className="font-medium text-heading">{doc.clinicName}</span>
                  </div>
                  <div>
                    <span className="text-muted">Experience:</span> <span className="font-medium text-heading">{doc.experience} Years</span>
                  </div>
                </div>

                <div className="p-4 bg-surface rounded-xl border border-border">
                  <div className="flex items-center mb-2">
                    <FileText className="w-4 h-4 text-muted mr-2" />
                    <span className="font-semibold text-heading text-sm">Verification Documents</span>
                  </div>
                  <div className="flex gap-4 text-sm">
                    {doc.documents?.license ? (
                      <a href={doc.documents.license} target="_blank" rel="noreferrer" className="text-primary hover:underline">
                        Medical License
                      </a>
                    ) : <span className="text-red-500 flex items-center"><AlertCircle className="w-3 h-3 mr-1"/> Missing License</span>}
                    
                    {doc.documents?.certificate ? (
                      <a href={doc.documents.certificate} target="_blank" rel="noreferrer" className="text-primary hover:underline">
                        Board Certificate
                      </a>
                    ) : <span className="text-red-500 flex items-center"><AlertCircle className="w-3 h-3 mr-1"/> Missing Certificate</span>}
                  </div>
                </div>
              </div>

              <div className="flex flex-row lg:flex-col gap-3 w-full lg:w-48">
                <Button 
                  variant="primary" 
                  className="flex-1 lg:w-full bg-green-600 hover:bg-green-700 focus:ring-green-500"
                  onClick={() => handleApprove(doc._id)}
                >
                  <CheckCircle className="w-4 h-4 mr-2" /> Approve
                </Button>
                <Button 
                  variant="outline" 
                  className="flex-1 lg:w-full text-red-500 border-red-200 hover:bg-red-50"
                  onClick={() => openRejectModal(doc)}
                >
                  <XCircle className="w-4 h-4 mr-2" /> Reject
                </Button>
              </div>

            </div>
          ))}
        </div>
      )}

      {/* Reject Modal */}
      <Modal id="REJECT_DOCTOR" title="Reject Application">
        <div className="space-y-4">
          <p className="text-sm text-body">
            Please provide a reason for rejecting <span className="font-semibold">Dr. {selectedDoc?.userId?.name}</span>'s application. This will be emailed to them.
          </p>
          <textarea
            className="input-base w-full min-h-[120px] resize-none"
            placeholder="e.g., Medical license document is blurry, please re-upload."
            value={rejectReason}
            onChange={(e) => setRejectReason(e.target.value)}
          />
          <div className="flex gap-3 justify-end pt-4">
            <Button variant="ghost" onClick={closeModal}>Cancel</Button>
            <Button variant="danger" onClick={handleReject}>Send Rejection</Button>
          </div>
        </div>
      </Modal>
    </PageTransition>
  );
};

export default DoctorApprovals;

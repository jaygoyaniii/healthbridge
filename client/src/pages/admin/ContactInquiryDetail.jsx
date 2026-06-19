import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, Mail, Phone, User, Calendar, Clock, CheckCircle, Trash2, ShieldAlert } from 'lucide-react';
import toast from 'react-hot-toast';
import { format } from 'date-fns';

import api from '../../services/api';
import PageTransition from '../../components/common/PageTransition';
import Button from '../../components/ui/Button';

const statusConfig = {
  'New': 'bg-blue-100 text-blue-700',
  'Read': 'bg-slate-100 text-slate-700',
  'In Progress': 'bg-amber-100 text-amber-700',
  'Resolved': 'bg-emerald-100 text-emerald-700',
  'Closed': 'bg-red-100 text-red-700',
};

const ContactInquiryDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [inquiry, setInquiry] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchInquiry();
  }, [id]);

  const fetchInquiry = async () => {
    try {
      const { data } = await api.get(`/admin/contact-inquiries/${id}`);
      setInquiry(data.inquiry);
      
      // Auto-mark as Read if it was New
      if (data.inquiry.status === 'New') {
        updateStatus('Read', false);
      }
    } catch (error) {
      toast.error('Failed to load inquiry details');
      navigate('/admin/contact-inquiries');
    } finally {
      setLoading(false);
    }
  };

  const updateStatus = async (newStatus, showToast = true) => {
    try {
      await api.patch(`/admin/contact-inquiries/${id}`, { status: newStatus });
      if (showToast) toast.success(`Status updated to ${newStatus}`);
      setInquiry(prev => ({ ...prev, status: newStatus }));
    } catch (error) {
      if (showToast) toast.error('Failed to update status');
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('Are you sure you want to delete this inquiry permanently?')) return;
    try {
      await api.delete(`/admin/contact-inquiries/${id}`);
      toast.success('Inquiry deleted successfully');
      navigate('/admin/contact-inquiries');
    } catch (error) {
      toast.error('Failed to delete inquiry');
    }
  };

  if (loading) return <div className="p-8 text-center text-muted">Loading details...</div>;
  if (!inquiry) return null;

  return (
    <PageTransition className="max-w-4xl mx-auto space-y-6">
      
      <div className="flex items-center gap-4 mb-8">
        <Link to="/admin/contact-inquiries" className="p-2 bg-white rounded-lg border border-border shadow-sm hover:bg-surface-secondary transition-colors">
          <ArrowLeft className="w-5 h-5 text-muted" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-heading">Inquiry Details</h1>
          <p className="text-sm text-muted">#{inquiry._id}</p>
        </div>
        <div className="ml-auto flex gap-2">
          <select 
            value={inquiry.status}
            onChange={(e) => updateStatus(e.target.value)}
            className={`px-4 py-2 font-bold text-sm rounded-lg border-0 ring-1 ring-inset ring-black/5 outline-none cursor-pointer ${statusConfig[inquiry.status]}`}
          >
            <option value="New">New</option>
            <option value="Read">Read</option>
            <option value="In Progress">In Progress</option>
            <option value="Resolved">Resolved</option>
            <option value="Closed">Closed</option>
          </select>
          
          <Button variant="danger" className="gap-2" onClick={handleDelete}>
            <Trash2 className="w-4 h-4" /> Delete
          </Button>
        </div>
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        
        {/* Left Column: Sender Details */}
        <div className="space-y-6">
          <div className="bg-white rounded-[1.5rem] p-6 shadow-sm border border-border relative overflow-hidden">
            <div className="absolute top-0 right-0 w-24 h-24 bg-brand-primary/5 rounded-bl-[100px] -z-10" />
            <h2 className="text-lg font-bold text-heading mb-4 flex items-center gap-2">
              <User className="w-5 h-5 text-brand-primary" /> Sender Info
            </h2>
            <div className="space-y-4 text-sm">
              <div>
                <p className="text-muted font-medium mb-1 flex items-center gap-1.5"><User className="w-4 h-4"/> Full Name</p>
                <p className="font-bold text-heading">{inquiry.fullName}</p>
              </div>
              <div>
                <p className="text-muted font-medium mb-1 flex items-center gap-1.5"><Mail className="w-4 h-4"/> Email Address</p>
                <a href={`mailto:${inquiry.email}`} className="font-bold text-brand-primary hover:underline">{inquiry.email}</a>
              </div>
              <div>
                <p className="text-muted font-medium mb-1 flex items-center gap-1.5"><Phone className="w-4 h-4"/> Phone Number</p>
                <a href={`tel:${inquiry.phone}`} className="font-bold text-heading hover:text-brand-primary">{inquiry.phone}</a>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-[1.5rem] p-6 shadow-sm border border-border">
            <h2 className="text-lg font-bold text-heading mb-4 flex items-center gap-2">
              <Clock className="w-5 h-5 text-brand-primary" /> Timeline
            </h2>
            <div className="space-y-4 text-sm">
              <div>
                <p className="text-muted font-medium mb-1">Submitted</p>
                <p className="font-semibold text-heading">{format(new Date(inquiry.createdAt), 'PPpp')}</p>
              </div>
              {inquiry.readAt && (
                <div>
                  <p className="text-muted font-medium mb-1">First Read</p>
                  <p className="font-semibold text-heading">{format(new Date(inquiry.readAt), 'PPpp')}</p>
                </div>
              )}
              <div>
                <p className="text-muted font-medium mb-1">Last Updated</p>
                <p className="font-semibold text-heading">{format(new Date(inquiry.updatedAt), 'PPpp')}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Message */}
        <div className="md:col-span-2">
          <div className="bg-white rounded-[1.5rem] p-6 sm:p-8 shadow-sm border border-border h-full flex flex-col">
            <div className="mb-6 pb-6 border-b border-border">
              <h2 className="text-sm font-bold text-muted uppercase tracking-wider mb-2">Subject</h2>
              <h3 className="text-2xl font-bold text-heading leading-tight">{inquiry.subject}</h3>
            </div>
            
            <div className="flex-1">
              <h2 className="text-sm font-bold text-muted uppercase tracking-wider mb-4">Message</h2>
              <div className="bg-surface-secondary rounded-xl p-6 border border-border">
                <p className="text-body whitespace-pre-wrap leading-relaxed">
                  {inquiry.message}
                </p>
              </div>
            </div>

            <div className="mt-8 pt-6 border-t border-border flex gap-3">
              <a href={`mailto:${inquiry.email}?subject=Re: ${inquiry.subject}`} className="flex-1">
                <Button className="w-full gap-2 text-base h-12 shadow-lg shadow-brand-primary/20">
                  <Mail className="w-5 h-5" /> Reply via Email
                </Button>
              </a>
              {inquiry.status !== 'Resolved' && (
                <Button variant="outline" className="flex-1 gap-2 text-emerald-600 border-emerald-200 hover:bg-emerald-50 h-12" onClick={() => updateStatus('Resolved')}>
                  <CheckCircle className="w-5 h-5" /> Mark as Resolved
                </Button>
              )}
            </div>
          </div>
        </div>

      </div>
    </PageTransition>
  );
};

export default ContactInquiryDetail;

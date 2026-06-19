import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Mail, Search, Filter, MoreVertical, Trash2, CheckCircle, Clock, Eye, AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import { format } from 'date-fns';

import api from '../../services/api';
import PageTransition from '../../components/common/PageTransition';
import Input from '../../components/ui/Input';
import Button from '../../components/ui/Button';

const statusConfig = {
  'New': { color: 'bg-blue-100 text-blue-700', icon: Mail },
  'Read': { color: 'bg-slate-100 text-slate-700', icon: Eye },
  'In Progress': { color: 'bg-amber-100 text-amber-700', icon: Clock },
  'Resolved': { color: 'bg-emerald-100 text-emerald-700', icon: CheckCircle },
  'Closed': { color: 'bg-red-100 text-red-700', icon: Trash2 },
};

const ContactInquiries = () => {
  const [inquiries, setInquiries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');

  const fetchInquiries = async () => {
    try {
      const { data } = await api.get('/admin/contact-inquiries', {
        params: { search, status: statusFilter }
      });
      setInquiries(data.inquiries);
    } catch (error) {
      toast.error('Failed to load inquiries');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      fetchInquiries();
    }, 500);
    return () => clearTimeout(delayDebounceFn);
  }, [search, statusFilter]);

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this inquiry?')) return;
    try {
      await api.delete(`/admin/contact-inquiries/${id}`);
      toast.success('Inquiry deleted successfully');
      setInquiries(prev => prev.filter(i => i._id !== id));
    } catch (error) {
      toast.error('Failed to delete inquiry');
    }
  };

  const updateStatus = async (id, newStatus) => {
    try {
      await api.patch(`/admin/contact-inquiries/${id}`, { status: newStatus });
      toast.success(`Status updated to ${newStatus}`);
      setInquiries(prev => prev.map(i => i._id === id ? { ...i, status: newStatus } : i));
    } catch (error) {
      toast.error('Failed to update status');
    }
  };

  return (
    <PageTransition className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-heading">Contact Inquiries</h1>
          <p className="text-body text-sm mt-1">Manage and respond to user messages.</p>
        </div>
      </div>

      {/* Filters & Search */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-border flex flex-col md:flex-row gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted w-5 h-5" />
          <input
            type="text"
            placeholder="Search by name, email, phone or subject..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-surface-secondary border border-border rounded-lg focus:outline-none focus:border-brand-primary focus:ring-1 focus:ring-brand-primary"
          />
        </div>
        <div className="flex items-center gap-2">
          <Filter className="text-muted w-5 h-5" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-surface-secondary border border-border rounded-lg px-4 py-2 focus:outline-none focus:border-brand-primary"
          >
            <option value="All">All Statuses</option>
            <option value="New">New</option>
            <option value="Read">Read</option>
            <option value="In Progress">In Progress</option>
            <option value="Resolved">Resolved</option>
            <option value="Closed">Closed</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl shadow-sm border border-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-surface-secondary border-b border-border text-sm text-heading">
                <th className="p-4 font-semibold whitespace-nowrap">Sender</th>
                <th className="p-4 font-semibold">Subject</th>
                <th className="p-4 font-semibold whitespace-nowrap">Status</th>
                <th className="p-4 font-semibold whitespace-nowrap">Date</th>
                <th className="p-4 font-semibold text-right whitespace-nowrap">Actions</th>
              </tr>
            </thead>
            <tbody className="text-sm divide-y divide-border">
              {loading ? (
                <tr>
                  <td colSpan="5" className="p-8 text-center text-muted">Loading inquiries...</td>
                </tr>
              ) : inquiries.length === 0 ? (
                <tr>
                  <td colSpan="5" className="p-12 text-center text-muted flex flex-col items-center">
                    <Mail className="w-12 h-12 mb-3 text-slate-300" />
                    <p className="text-lg font-medium text-heading">No inquiries found</p>
                    <p className="text-sm">Try adjusting your filters or search query.</p>
                  </td>
                </tr>
              ) : (
                <AnimatePresence>
                  {inquiries.map((inquiry) => {
                    const StatusIcon = statusConfig[inquiry.status]?.icon || Mail;
                    return (
                      <motion.tr 
                        key={inquiry._id}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="hover:bg-surface-secondary/50 transition-colors group"
                      >
                        <td className="p-4">
                          <div className="font-semibold text-heading">{inquiry.fullName}</div>
                          <div className="text-xs text-muted mt-0.5">{inquiry.email}</div>
                          <div className="text-xs text-muted">{inquiry.phone}</div>
                        </td>
                        <td className="p-4">
                          <div className="text-heading font-medium truncate max-w-xs">{inquiry.subject}</div>
                          <div className="text-muted truncate max-w-xs mt-0.5 text-xs">{inquiry.message}</div>
                        </td>
                        <td className="p-4">
                          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${statusConfig[inquiry.status]?.color}`}>
                            <StatusIcon className="w-3.5 h-3.5" />
                            {inquiry.status}
                          </span>
                        </td>
                        <td className="p-4 text-muted whitespace-nowrap">
                          {format(new Date(inquiry.createdAt), 'MMM d, yyyy')}
                          <div className="text-xs">{format(new Date(inquiry.createdAt), 'h:mm a')}</div>
                        </td>
                        <td className="p-4 text-right">
                          <div className="flex justify-end gap-2">
                            {inquiry.status === 'New' && (
                              <button 
                                onClick={() => updateStatus(inquiry._id, 'Read')}
                                className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                title="Mark as Read"
                              >
                                <Eye className="w-4 h-4" />
                              </button>
                            )}
                            {inquiry.status !== 'Resolved' && (
                              <button 
                                onClick={() => updateStatus(inquiry._id, 'Resolved')}
                                className="p-1.5 text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
                                title="Mark as Resolved"
                              >
                                <CheckCircle className="w-4 h-4" />
                              </button>
                            )}
                            <Link to={`/admin/contact-inquiries/${inquiry._id}`}>
                              <button className="p-1.5 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors">
                                <MoreVertical className="w-4 h-4" />
                              </button>
                            </Link>
                            <button 
                              onClick={() => handleDelete(inquiry._id)}
                              className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </motion.tr>
                    );
                  })}
                </AnimatePresence>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </PageTransition>
  );
};

export default ContactInquiries;

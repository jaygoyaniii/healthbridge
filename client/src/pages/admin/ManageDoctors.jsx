import { useState, useEffect } from 'react';
import { Search, Filter, CheckCircle, XCircle, Clock, MoreVertical, Shield, Trash2, Users, MessageSquare, User as UserIcon } from 'lucide-react';
import toast from 'react-hot-toast';
import { useNavigate, Link } from 'react-router-dom';
import PageTransition from '../../components/common/PageTransition';
import adminService from '../../services/adminService';
import chatService from '../../services/chatService';
import Button from '../../components/ui/Button';
import Avatar from '../../components/common/Avatar';
import Badge from '../../components/ui/Badge';
import { formatDate } from '../../utils/format';

const ManageDoctors = () => {
  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filter, setFilter] = useState('all');
  const navigate = useNavigate(); // 'all', 'approved', 'pending', 'rejected'

  useEffect(() => {
    fetchDoctors();
  }, []);

  const fetchDoctors = async () => {
    setLoading(true);
    try {
      const { data } = await adminService.getAllDoctors();
      setDoctors(data.doctors || []);
    } catch (error) {
      toast.error('Failed to fetch doctors');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this doctor? This action cannot be undone.')) {
      try {
        await adminService.deleteDoctor(id);
        toast.success('Doctor deleted successfully');
        setDoctors(doctors.filter(d => d._id !== id));
      } catch (error) {
        toast.error(error.response?.data?.message || 'Failed to delete doctor');
      }
    }
  };

  const handleMessage = async (userId) => {
    try {
      const res = await chatService.createConversation(userId);
      navigate(`/admin/chat/${res.data.conversation._id}`);
    } catch (error) {
      toast.error('Failed to start conversation');
    }
  };


  const filteredDoctors = doctors.filter(doc => {
    const matchesSearch = doc.userId?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      doc.specialization?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      doc.userId?.email?.toLowerCase().includes(searchTerm.toLowerCase());

    if (!matchesSearch) return false;

    if (filter === 'approved') return doc.isApproved;
    if (filter === 'pending') return !doc.isApproved && !doc.rejectionReason;
    if (filter === 'rejected') return !doc.isApproved && !!doc.rejectionReason;
    return true;
  });

  const totalDoctors = doctors.length;
  const approvedDoctors = doctors.filter(d => d.isApproved).length;
  const pendingDoctors = doctors.filter(d => !d.isApproved && !d.rejectionReason).length;

  return (
    <PageTransition className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-h2 font-heading text-heading">Manage Doctors</h1>
          <p className="text-muted mt-1">View and manage all practitioner accounts across the platform.</p>
        </div>
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <div className="relative flex-1 sm:w-64">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
            <input
              type="text"
              placeholder="Search doctors..."
              className="input-base pl-10 w-full"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <select
            className="input-base w-32"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
          >
            <option value="all">All Status</option>
            <option value="approved">Approved</option>
            <option value="pending">Pending</option>
            <option value="rejected">Rejected</option>
          </select>
        </div>
      </div>

      {/* Stats Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-2xl p-6 border border-border shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm font-medium text-slate-500">Total Doctors</p>
            <h3 className="text-2xl font-bold text-slate-800">{totalDoctors}</h3>
          </div>
        </div>
        <div className="bg-white rounded-2xl p-6 border border-border shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <CheckCircle className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm font-medium text-slate-500">Approved</p>
            <h3 className="text-2xl font-bold text-slate-800">{approvedDoctors}</h3>
          </div>
        </div>
        <div className="bg-white rounded-2xl p-6 border border-border shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
            <Clock className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm font-medium text-slate-500">Pending Review</p>
            <h3 className="text-2xl font-bold text-slate-800">{pendingDoctors}</h3>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="bg-surface text-muted border-b border-border">
              <tr>
                <th className="px-6 py-4 font-medium">Doctor</th>
                <th className="px-6 py-4 font-medium">Specialization</th>
                <th className="px-6 py-4 font-medium">Experience</th>
                <th className="px-6 py-4 font-medium">Joined</th>
                <th className="px-6 py-4 font-medium">Contact</th>
                <th className="px-6 py-4 font-medium">Status</th>
                <th className="px-6 py-4 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {loading ? (
                <tr>
                  <td colSpan="7" className="px-6 py-12 text-center">
                    <span className="loader"></span>
                  </td>
                </tr>
              ) : filteredDoctors.length === 0 ? (
                <tr>
                  <td colSpan="7" className="px-6 py-12 text-center text-muted">
                    No doctors found matching your criteria.
                  </td>
                </tr>
              ) : (
                filteredDoctors.map((doc) => (
                  <tr key={doc._id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <Avatar
                          src={doc.userId?.avatar?.url || doc.userId?.avatar}
                          name={doc.userId?.name || 'D'}
                          role="doctor"
                          size="md"
                        />
                        <div>
                          <div className="font-semibold text-heading flex items-center gap-1">
                            <Link to={`/admin/doctors/${doc.userId?._id}`} className="hover:text-primary hover:underline transition-colors">
                              Dr. {doc.userId?.name}
                            </Link>
                            {doc.isApproved && <Shield className="w-3.5 h-3.5 text-blue-500" />}
                          </div>
                          <div className="text-xs text-muted">{doc.userId?.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-purple-50 text-purple-700">
                        {doc.specialization?.name || 'General'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-muted">
                      {doc.experience} Years
                    </td>
                    <td className="px-6 py-4 text-muted">
                      {formatDate(doc.createdAt)}
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-purple-50 text-purple-700">
                        {doc.userId?.phone || 'N/A'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      {doc.isApproved ? (
                        <Badge variant="success" className="flex w-max items-center gap-1">
                          <CheckCircle className="w-3 h-3" /> Approved
                        </Badge>
                      ) : doc.rejectionReason ? (
                        <Badge variant="danger" className="flex w-max items-center gap-1">
                          <XCircle className="w-3 h-3" /> Rejected
                        </Badge>
                      ) : (
                        <Badge variant="warning" className="flex w-max items-center gap-1">
                          <Clock className="w-3 h-3" /> Pending
                        </Badge>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Link to={`/admin/doctors/${doc.userId?._id}`}>
                          <Button
                            variant="ghost"
                            className="w-8 h-8 p-0 text-slate-500 hover:bg-slate-100 hover:text-slate-700 transition-colors"
                            title="View Profile"
                          >
                            <UserIcon className="w-4 h-4" />
                          </Button>
                        </Link>
                        <Button
                          variant="ghost"
                          className="w-8 h-8 p-0 text-blue-500 hover:bg-blue-50 hover:text-blue-700 transition-colors"
                          onClick={() => handleMessage(doc.userId._id)}
                          title="Message Doctor"
                        >
                          <MessageSquare className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          className="w-8 h-8 p-0 text-red-500 hover:bg-red-50 hover:text-red-700 transition-colors"
                          onClick={() => handleDelete(doc._id)}
                          title="Delete Doctor"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        <div className="p-4 border-t border-border bg-surface text-sm text-muted flex justify-between items-center">
          <span>Showing {filteredDoctors.length} doctors</span>
        </div>
      </div>
    </PageTransition>
  );
};

export default ManageDoctors;

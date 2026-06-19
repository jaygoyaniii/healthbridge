import { useState, useEffect } from 'react';
import { Search, UserCheck, Trash2, Calendar, Users, ShieldAlert, MessageSquare, User as UserIcon } from 'lucide-react';
import toast from 'react-hot-toast';
import { useNavigate, Link } from 'react-router-dom';
import PageTransition from '../../components/common/PageTransition';
import adminService from '../../services/adminService';
import chatService from '../../services/chatService';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import { formatDate } from '../../utils/format';
import Avatar from '../../components/common/Avatar';

const ManagePatients = () => {
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    fetchPatients();
  }, []);

  const fetchPatients = async () => {
    setLoading(true);
    try {
      const { data } = await adminService.getAllPatients();
      setPatients(data.patients || []);
    } catch (error) {
      toast.error('Failed to fetch patients');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this patient? This action cannot be undone.')) {
      try {
        await adminService.deletePatient(id);
        toast.success('Patient deleted successfully');
        setPatients(patients.filter(p => p._id !== id));
      } catch (error) {
        toast.error(error.response?.data?.message || 'Failed to delete patient');
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

  const filteredPatients = patients.filter(patient => {
    const term = searchTerm.toLowerCase();
    return (
      patient.name?.toLowerCase().includes(term) ||
      patient.email?.toLowerCase().includes(term) ||
      patient.phone?.includes(term)
    );
  });

  const totalPatients = patients.length;
  const activePatients = patients.filter(p => !p.isBlocked).length;
  const blockedPatients = patients.filter(p => p.isBlocked).length;

  return (
    <PageTransition className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-h2 font-heading text-heading">Manage Patients</h1>
          <p className="text-muted mt-1">View and manage all registered patient accounts.</p>
        </div>
        <div className="w-full sm:w-auto">
          <div className="relative w-full sm:w-72">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
            <input
              type="text"
              placeholder="Search by name, email or phone..."
              className="input-base pl-10 w-full"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* Stats Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-2xl p-6 border border-border shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm font-medium text-slate-500">Total Patients</p>
            <h3 className="text-2xl font-bold text-slate-800">{totalPatients}</h3>
          </div>
        </div>
        <div className="bg-white rounded-2xl p-6 border border-border shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <UserCheck className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm font-medium text-slate-500">Active Patients</p>
            <h3 className="text-2xl font-bold text-slate-800">{activePatients}</h3>
          </div>
        </div>
        <div className="bg-white rounded-2xl p-6 border border-border shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-red-50 text-red-600 flex items-center justify-center">
            <ShieldAlert className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm font-medium text-slate-500">Blocked Accounts</p>
            <h3 className="text-2xl font-bold text-slate-800">{blockedPatients}</h3>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="bg-surface text-muted border-b border-border">
              <tr>
                <th className="px-6 py-4 font-medium">Patient</th>
                <th className="px-6 py-4 font-medium">Email</th>
                <th className="px-6 py-4 font-medium">Contact</th>
                <th className="px-6 py-4 font-medium">Gender/Age</th>
                <th className="px-6 py-4 font-medium">Joined Date</th>
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
              ) : filteredPatients.length === 0 ? (
                <tr>
                  <td colSpan="7" className="px-6 py-12 text-center text-muted">
                    No patients found matching your criteria.
                  </td>
                </tr>
              ) : (
                filteredPatients.map((patient) => (
                  <tr key={patient._id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <Avatar
                          src={patient.avatar?.url || patient.avatar}
                          name={patient.name || 'P'}
                          role="patient"
                          size="md"
                        />
                        <div>
                          <Link to={`/admin/patients/${patient._id}`} className="font-semibold text-heading hover:text-primary hover:underline transition-colors">
                            {patient.name}
                          </Link>
                          <div className="text-xs text-muted">ID: {patient._id.substring(patient._id.length - 6)}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-heading">{patient.email}</div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-purple-50 text-purple-700">
                        {patient.phone || 'N/A'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-muted">
                      {patient.gender ? (patient.gender.charAt(0).toUpperCase() + patient.gender.slice(1)) : 'Not specified'}
                      {patient.dateOfBirth && (
                        <div className="text-xs mt-1">
                          {Math.floor((new Date() - new Date(patient.dateOfBirth)) / 31557600000)} Years
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 text-muted">
                      <div className="flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5" />
                        {formatDate(patient.createdAt)}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {patient.isBlocked ? (
                        <Badge variant="danger">Blocked</Badge>
                      ) : (
                        <Badge variant="success" className="flex w-max items-center gap-1">
                          <UserCheck className="w-3 h-3" /> Active
                        </Badge>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Link to={`/admin/patients/${patient._id}`}>
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
                          onClick={() => handleMessage(patient._id)}
                          title="Message Patient"
                        >
                          <MessageSquare className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          className="w-8 h-8 p-0 text-red-500 hover:bg-red-50 hover:text-red-700 transition-colors"
                          onClick={() => handleDelete(patient._id)}
                          title="Delete Patient"
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
          <span>Showing {filteredPatients.length} patients</span>
        </div>
      </div>
    </PageTransition>
  );
};

export default ManagePatients;

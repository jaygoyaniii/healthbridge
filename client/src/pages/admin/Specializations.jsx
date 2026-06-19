import { useState, useEffect } from 'react';
import { Plus, Tag, Activity, Trash2, Edit2, X } from 'lucide-react';
import toast from 'react-hot-toast';
import PageTransition from '../../components/common/PageTransition';
import adminService from '../../services/adminService';
import Input from '../../components/ui/Input';
import Button from '../../components/ui/Button';
import { formatDate } from '../../utils/format';

const Specializations = () => {
  const [specializations, setSpecializations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [editingId, setEditingId] = useState(null);
  
  // Form State
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [icon, setIcon] = useState('');

  useEffect(() => {
    fetchSpecializations();
  }, []);

  const fetchSpecializations = async () => {
    try {
      const { data } = await adminService.getSpecializations();
      setSpecializations(data.specializations || []);
    } catch (error) {
      toast.error('Failed to load specializations');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!name.trim()) return toast.error('Name is required');

    setAdding(true);
    try {
      if (editingId) {
        await adminService.updateSpecialization(editingId, { name, description, icon });
        toast.success('Specialization updated successfully');
      } else {
        await adminService.createSpecialization({ name, description, icon });
        toast.success('Specialization added successfully');
      }
      resetForm();
      fetchSpecializations();
    } catch (error) {
      toast.error(error.response?.data?.message || `Failed to ${editingId ? 'update' : 'add'} specialization`);
    } finally {
      setAdding(false);
    }
  };

  const handleEdit = (spec) => {
    setEditingId(spec._id);
    setName(spec.name);
    setDescription(spec.description || '');
    setIcon(spec.icon || '');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const resetForm = () => {
    setEditingId(null);
    setName('');
    setDescription('');
    setIcon('');
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this specialization?')) {
      try {
        await adminService.deleteSpecialization(id);
        toast.success('Specialization deleted successfully');
        setSpecializations(specializations.filter(s => s._id !== id));
      } catch (error) {
        toast.error(error.response?.data?.message || 'Failed to delete specialization');
      }
    }
  };

  const totalSpecs = specializations.length;
  const recentSpecs = specializations.filter(s => {
    if (!s.createdAt) return false;
    const diff = new Date() - new Date(s.createdAt);
    return diff < 30 * 24 * 60 * 60 * 1000;
  }).length;

  return (
    <PageTransition className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-h2 font-heading text-heading">Specializations</h1>
          <p className="text-muted mt-1">Manage the medical taxonomy for the platform.</p>
        </div>
      </div>

      {/* Stats Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl p-6 border border-border shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
            <Tag className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm font-medium text-slate-500">Total Specializations</p>
            <h3 className="text-2xl font-bold text-slate-800">{totalSpecs}</h3>
          </div>
        </div>
        <div className="bg-white rounded-2xl p-6 border border-border shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <Activity className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm font-medium text-slate-500">Recently Added (30 Days)</p>
            <h3 className="text-2xl font-bold text-slate-800">{recentSpecs}</h3>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Column - Add Form */}
        <div className="lg:col-span-1">
          <div className="card p-6 sticky top-24">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold text-heading flex items-center">
                {editingId ? (
                  <><Edit2 className="w-5 h-5 mr-2 text-primary" /> Edit Category</>
                ) : (
                  <><Plus className="w-5 h-5 mr-2 text-primary" /> Add New</>
                )}
              </h3>
              {editingId && (
                <button 
                  type="button"
                  onClick={resetForm}
                  className="p-1.5 text-muted hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                  title="Cancel Edit"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
            
            <form onSubmit={handleSave} className="space-y-4">
              <Input 
                label="Specialization Name"
                placeholder="e.g., Cardiology"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
              <Input 
                label="Icon Reference (Optional)"
                placeholder="e.g., heart-pulse"
                value={icon}
                onChange={(e) => setIcon(e.target.value)}
              />
              <div>
                <label className="block text-sm font-medium mb-1.5 text-heading">Description</label>
                <textarea
                  className="input-base w-full min-h-[100px] resize-none"
                  placeholder="Brief description of this field..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />
              </div>
              <Button type="submit" className="w-full" isLoading={adding}>
                {editingId ? 'Update Specialization' : 'Save Specialization'}
              </Button>
            </form>
          </div>
        </div>

        {/* Right Column - List */}
        <div className="lg:col-span-2">
          <div className="card overflow-hidden">
            <div className="p-5 border-b border-border bg-surface/30">
              <h3 className="font-semibold text-heading">Existing Categories ({specializations.length})</h3>
            </div>
            
            {loading ? (
              <div className="p-12 text-center"><span className="loader"></span></div>
            ) : specializations.length === 0 ? (
              <div className="p-12 text-center text-muted">No specializations defined yet.</div>
            ) : (
              <div className="divide-y divide-border">
                {specializations.map((spec) => (
                  <div key={spec._id} className="p-5 hover:bg-surface/50 transition-colors flex items-start justify-between gap-4">
                    <div className="flex items-start gap-4">
                      <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary shrink-0 mt-1">
                        <Tag className="w-5 h-5" />
                      </div>
                      <div>
                        <h4 className="text-heading font-bold text-lg">{spec.name}</h4>
                        {spec.description && (
                          <p className="text-muted text-sm mt-1">{spec.description}</p>
                        )}
                        <div className="mt-2 text-xs text-muted">
                          Created: {spec.createdAt ? formatDate(spec.createdAt) : 'N/A'}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button 
                        variant="ghost" 
                        className="w-8 h-8 p-0 text-blue-500 hover:bg-blue-50 hover:text-blue-700 transition-colors shrink-0"
                        onClick={() => handleEdit(spec)}
                        title="Edit"
                      >
                        <Edit2 className="w-4 h-4" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        className="w-8 h-8 p-0 text-red-500 hover:bg-red-50 hover:text-red-700 transition-colors shrink-0"
                        onClick={() => handleDelete(spec._id)}
                        title="Delete"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

      </div>
    </PageTransition>
  );
};

export default Specializations;

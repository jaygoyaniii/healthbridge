import { useState } from 'react';
import { Shield, Key, Save, Bell, Globe, Database, Moon, AlertTriangle, Download, HardDrive } from 'lucide-react';
import toast from 'react-hot-toast';
import PageTransition from '../../components/common/PageTransition';
import Button from '../../components/ui/Button';
import authService from '../../services/authService';

const AdminSettings = () => {
  const [activeTab, setActiveTab] = useState('security');
  
  const [passwords, setPasswords] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  
  const [loading, setLoading] = useState(false);
  
  const [theme, setTheme] = useState(localStorage.getItem('theme') || 'light');
  const [maintenanceMode, setMaintenanceMode] = useState(localStorage.getItem('maintenanceMode') === 'true');
  const [notifications, setNotifications] = useState({
    doctorReg: true,
    dailyReports: false
  });

  const handleThemeChange = (e) => {
    const newTheme = e.target.value;
    setTheme(newTheme);
    if (newTheme === 'dark') {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
      toast.success('Dark mode enabled');
    } else if (newTheme === 'light') {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
      toast.success('Light mode enabled');
    } else {
      localStorage.removeItem('theme');
      if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
      toast.success('System theme applied');
    }
  };

  const toggleMaintenance = () => {
    const newState = !maintenanceMode;
    setMaintenanceMode(newState);
    if (newState) {
      localStorage.setItem('maintenanceMode', 'true');
      toast.error('Maintenance mode enabled: Platform bookings restricted', { icon: '⚠️' });
    } else {
      localStorage.setItem('maintenanceMode', 'false');
      toast.success('Maintenance mode disabled: Platform operating normally');
    }
  };

  const toggleNotification = (key) => {
    setNotifications(prev => {
      const next = { ...prev, [key]: !prev[key] };
      toast.success('Notification preferences updated');
      return next;
    });
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    if (passwords.newPassword !== passwords.confirmPassword) {
      return toast.error('New passwords do not match');
    }
    
    setLoading(true);
    try {
      await authService.changePassword({
        currentPassword: passwords.currentPassword,
        newPassword: passwords.newPassword
      });
      toast.success('Password updated successfully');
      setPasswords({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to update password');
    } finally {
      setLoading(false);
    }
  };

  const handleSystemSave = (e) => {
    e.preventDefault();
    toast.success('System preferences updated successfully');
  };

  return (
    <PageTransition className="space-y-6 max-w-5xl">
      <div>
        <h1 className="text-h2 font-heading text-heading">System Settings</h1>
        <p className="text-muted mt-1">Manage your administrator account and global platform preferences.</p>
      </div>

      <div className="flex flex-col md:flex-row gap-8 mt-8">
        {/* Sidebar Tabs */}
        <div className="w-full md:w-64 flex flex-col space-y-1">
          <button
            onClick={() => setActiveTab('security')}
            className={`flex items-center px-4 py-3 rounded-xl transition-colors text-left ${activeTab === 'security' ? 'bg-white text-primary font-semibold shadow-sm border border-slate-200' : 'text-muted hover:bg-slate-100 hover:text-heading'}`}
          >
            <Key className="w-5 h-5 mr-3" /> Security
          </button>
          <button
            onClick={() => setActiveTab('system')}
            className={`flex items-center px-4 py-3 rounded-xl transition-colors text-left ${activeTab === 'system' ? 'bg-white text-primary font-semibold shadow-sm border border-slate-200' : 'text-muted hover:bg-slate-100 hover:text-heading'}`}
          >
            <Globe className="w-5 h-5 mr-3" /> Platform Defaults
          </button>
          <button
            onClick={() => setActiveTab('notifications')}
            className={`flex items-center px-4 py-3 rounded-xl transition-colors text-left ${activeTab === 'notifications' ? 'bg-white text-primary font-semibold shadow-sm border border-slate-200' : 'text-muted hover:bg-slate-100 hover:text-heading'}`}
          >
            <Bell className="w-5 h-5 mr-3" /> Notifications
          </button>
          <button
            onClick={() => setActiveTab('backup')}
            className={`flex items-center px-4 py-3 rounded-xl transition-colors text-left ${activeTab === 'backup' ? 'bg-white text-primary font-semibold shadow-sm border border-slate-200' : 'text-muted hover:bg-slate-100 hover:text-heading'}`}
          >
            <HardDrive className="w-5 h-5 mr-3" /> Backups & Data
          </button>
        </div>

        {/* Content Area */}
        <div className="flex-1">
          {activeTab === 'security' && (
            <div className="card p-6">
              <h2 className="text-xl font-bold text-heading flex items-center mb-6">
                <Shield className="w-5 h-5 mr-2 text-primary" /> Change Password
              </h2>
              <form onSubmit={handlePasswordChange} className="space-y-4 max-w-md">
                <div>
                  <label className="block text-sm font-medium text-heading mb-1">Current Password</label>
                  <input 
                    type="password" 
                    className="input-base w-full"
                    required
                    value={passwords.currentPassword}
                    onChange={(e) => setPasswords({...passwords, currentPassword: e.target.value})}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-heading mb-1">New Password</label>
                  <input 
                    type="password" 
                    className="input-base w-full"
                    required
                    minLength={6}
                    value={passwords.newPassword}
                    onChange={(e) => setPasswords({...passwords, newPassword: e.target.value})}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-heading mb-1">Confirm New Password</label>
                  <input 
                    type="password" 
                    className="input-base w-full"
                    required
                    minLength={6}
                    value={passwords.confirmPassword}
                    onChange={(e) => setPasswords({...passwords, confirmPassword: e.target.value})}
                  />
                </div>
                <div className="pt-4">
                  <Button type="submit" variant="primary" disabled={loading}>
                    {loading ? 'Updating...' : 'Update Password'}
                  </Button>
                </div>
              </form>
            </div>
          )}

          {activeTab === 'system' && (
            <div className="card p-6">
              <h2 className="text-xl font-bold text-heading flex items-center mb-6">
                <Database className="w-5 h-5 mr-2 text-primary" /> Platform Defaults
              </h2>
              <form onSubmit={handleSystemSave} className="space-y-6 max-w-md">
                <div>
                  <label className="block text-sm font-medium text-heading mb-1">Platform Currency</label>
                  <select className="input-base w-full">
                    <option>USD ($)</option>
                    <option>EUR (€)</option>
                    <option>GBP (£)</option>
                    <option>INR (₹)</option>
                  </select>
                </div>
                
                <div className="flex flex-col sm:flex-row gap-4">
                  <div className="flex-1">
                    <label className="block text-sm font-medium text-heading mb-1">Platform Fee Margin (%)</label>
                    <input type="number" className="input-base w-full" defaultValue={10} min={0} max={100} />
                    <p className="text-xs text-muted mt-1">Percentage cut from completed consultations.</p>
                  </div>
                  <div className="flex-1">
                    <label className="block text-sm font-medium text-heading mb-1">Application Theme</label>
                    <select className="input-base w-full" value={theme} onChange={handleThemeChange}>
                      <option value="light">Light Mode</option>
                      <option value="dark">Dark Mode</option>
                      <option value="system">System Default</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-heading mb-1">Default Timezone</label>
                  <select className="input-base w-full">
                    <option>UTC (Coordinated Universal Time)</option>
                    <option>EST (Eastern Standard Time)</option>
                    <option>PST (Pacific Standard Time)</option>
                    <option>IST (Indian Standard Time)</option>
                  </select>
                </div>

                <div className="pt-4 border-t border-border flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="flex items-center justify-center w-10 h-10 rounded-full bg-red-50 text-red-500 shrink-0">
                      <AlertTriangle className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-heading">Maintenance Mode</p>
                      <p className="text-xs text-muted">Temporarily disable patient bookings.</p>
                    </div>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer self-start sm:self-auto ml-12 sm:ml-0">
                    <input type="checkbox" className="sr-only peer" checked={maintenanceMode} onChange={toggleMaintenance} />
                    <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-red-500"></div>
                  </label>
                </div>

                <div className="pt-6 border-t border-border flex justify-end">
                  <Button type="submit" variant="primary">
                    <Save className="w-4 h-4 mr-2" /> Save Preferences
                  </Button>
                </div>
              </form>
            </div>
          )}

          {activeTab === 'backup' && (
            <div className="card p-6">
              <h2 className="text-xl font-bold text-heading flex items-center mb-6">
                <HardDrive className="w-5 h-5 mr-2 text-primary" /> Database & Backups
              </h2>
              <div className="space-y-6">
                <div className="p-5 border border-border rounded-xl bg-slate-50 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <h3 className="font-bold text-heading">Manual System Backup</h3>
                    <p className="text-sm text-muted mt-1">Download a full JSON dump of the production database.</p>
                  </div>
                  <Button variant="outline" className="bg-white shrink-0" onClick={() => toast.success('Backup initiated. This may take a few minutes.')}>
                    <Download className="w-4 h-4 mr-2" /> Generate Backup
                  </Button>
                </div>
                
                <div>
                  <h3 className="font-bold text-heading mb-4">Recent Backups</h3>
                  <div className="divide-y divide-border border border-border rounded-xl overflow-hidden">
                    <div className="p-4 flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 bg-white hover:bg-slate-50 transition-colors">
                      <div className="flex items-start sm:items-center gap-3">
                        <Database className="w-5 h-5 text-muted shrink-0 mt-0.5 sm:mt-0" />
                        <div>
                          <p className="text-sm font-medium text-heading break-all sm:break-normal">auto_backup_2026_06_16.tar.gz</p>
                          <p className="text-xs text-muted">24.5 MB • Completed at 02:00 AM</p>
                        </div>
                      </div>
                      <Button variant="ghost" className="text-primary h-8 px-3 self-end sm:self-auto">Restore</Button>
                    </div>
                    <div className="p-4 flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 bg-white hover:bg-slate-50 transition-colors">
                      <div className="flex items-start sm:items-center gap-3">
                        <Database className="w-5 h-5 text-muted shrink-0 mt-0.5 sm:mt-0" />
                        <div>
                          <p className="text-sm font-medium text-heading break-all sm:break-normal">auto_backup_2026_06_15.tar.gz</p>
                          <p className="text-xs text-muted">24.1 MB • Completed at 02:00 AM</p>
                        </div>
                      </div>
                      <Button variant="ghost" className="text-primary h-8 px-3 self-end sm:self-auto">Restore</Button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'notifications' && (
            <div className="card p-6">
              <h2 className="text-xl font-bold text-heading flex items-center mb-6">
                <Bell className="w-5 h-5 mr-2 text-primary" /> Admin Alerts
              </h2>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-border">
                  <div>
                    <h4 className="font-medium text-heading">New Doctor Registrations</h4>
                    <p className="text-sm text-muted">Receive email when a doctor applies for verification.</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" className="sr-only peer" checked={notifications.doctorReg} onChange={() => toggleNotification('doctorReg')} />
                    <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                  </label>
                </div>

                <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-border">
                  <div>
                    <h4 className="font-medium text-heading">Daily System Reports</h4>
                    <p className="text-sm text-muted">Receive automated daily analytics reports.</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" className="sr-only peer" checked={notifications.dailyReports} onChange={() => toggleNotification('dailyReports')} />
                    <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                  </label>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </PageTransition>
  );
};

export default AdminSettings;

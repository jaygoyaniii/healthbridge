import { useState, useEffect, useContext } from 'react';
import { Bell, CheckCircle, Trash2, Calendar, AlertCircle, RefreshCw, X, Circle } from 'lucide-react';
import toast from 'react-hot-toast';
import PageTransition from '../../components/common/PageTransition';
import notificationService from '../../services/notificationService';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import { timeAgo, formatDate } from '../../utils/format';
import { NotificationContext } from '../../context/NotificationContext';
import { useAuth } from '../../hooks/useAuth';

const Notifications = () => {
  const { setUnreadCount, unreadCount } = useContext(NotificationContext);
  const { user } = useAuth();
  const role = user?.role;
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all'); // all, unread, read, appointment, system
  const [searchQuery, setSearchQuery] = useState('');
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0, pages: 1 });
  const [isDeletingAll, setIsDeletingAll] = useState(false);

  useEffect(() => {
    fetchNotifications(1);
  }, [filter]);

  const fetchNotifications = async (page = 1) => {
    setLoading(true);
    try {
      const params = { page, limit: 20 };
      if (filter === 'unread') params.unreadOnly = true;
      
      const { data } = await notificationService.getNotifications(params);
      setNotifications(data.notifications || []);
      setPagination(data.pagination || { page: 1, limit: 20, total: 0, pages: 1 });
      if (data.unreadCount !== undefined) {
        setUnreadCount(data.unreadCount);
      }
    } catch (error) {
      console.error(error);
      toast.error('Failed to fetch notifications');
    } finally {
      setLoading(false);
    }
  };

  const handleMarkAsRead = async (id) => {
    try {
      await notificationService.markAsRead(id);
      setNotifications(prev => prev.map(n => n._id === id ? { ...n, isRead: true } : n));
      setUnreadCount(Math.max(0, unreadCount - 1));
    } catch (error) {
      toast.error('Failed to mark as read');
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await notificationService.markAllAsRead();
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
      setUnreadCount(0);
      toast.success('All notifications marked as read');
    } catch (error) {
      toast.error('Failed to mark all as read');
    }
  };

  const handleDelete = async (id) => {
    try {
      const notifToDelete = notifications.find(n => n._id === id);
      await notificationService.delete(id);
      setNotifications(prev => prev.filter(n => n._id !== id));
      if (notifToDelete && !notifToDelete.isRead) {
        setUnreadCount(Math.max(0, unreadCount - 1));
      }
      toast.success('Notification deleted');
    } catch (error) {
      toast.error('Failed to delete notification');
    }
  };

  const handleDeleteAll = async () => {
    if (!window.confirm('Are you sure you want to delete ALL notifications? This cannot be undone.')) return;
    setIsDeletingAll(true);
    try {
      await notificationService.deleteAll();
      setNotifications([]);
      setUnreadCount(0);
      toast.success('All notifications deleted');
    } catch (error) {
      toast.error('Failed to delete all notifications');
    } finally {
      setIsDeletingAll(false);
    }
  };

  const getIcon = (type) => {
    switch (type) {
      case 'appointment': return <Calendar className="w-5 h-5 text-blue-500" />;
      case 'system': return <AlertCircle className="w-5 h-5 text-amber-500" />;
      case 'approval': return <CheckCircle className="w-5 h-5 text-emerald-500" />;
      default: return <Bell className="w-5 h-5 text-brand-primary" />;
    }
  };

  // Client-side filtering for types (since backend only supports unread filter)
  const filteredNotifications = notifications.filter(n => {
    // Role-based type filtering
    let typeMatch = true;
    if (filter === 'appointment') typeMatch = n.type === 'appointment';
    else if (filter === 'system') typeMatch = n.type === 'system' || n.type === 'approval';
    else if (filter === 'patient') typeMatch = n.type === 'patient';
    else if (filter === 'doctor') typeMatch = n.type === 'doctor';
    else if (filter === 'security') typeMatch = n.type === 'security';
    else if (filter === 'high priority') typeMatch = n.priority === 'high';
    else if (filter === 'read') typeMatch = n.isRead === true;
    
    // Search matching
    let searchMatch = true;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      searchMatch = 
        (n.title && n.title.toLowerCase().includes(q)) || 
        (n.message && n.message.toLowerCase().includes(q));
    }

    return typeMatch && searchMatch;
  });

  const availableFilters = role === 'admin' 
    ? ['all', 'unread', 'read', 'patient', 'doctor', 'appointment', 'system', 'security', 'high priority']
    : ['all', 'unread', 'read', 'appointment', 'system'];

  return (
    <PageTransition className="max-w-4xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-heading">Notifications</h1>
          <p className="text-muted text-sm mt-1">Manage your alerts and system messages.</p>
        </div>
        <div className="flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto">
          <input
            type="text"
            placeholder="Search notifications..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full sm:w-64 px-3 py-2 bg-white border border-border rounded-lg text-sm focus:outline-none focus:border-brand-primary"
          />
          <Button variant="outline" onClick={handleMarkAllAsRead} className="bg-white whitespace-nowrap">
            <CheckCircle className="w-4 h-4 mr-2" /> Mark All Read
          </Button>
          <Button variant="outline" onClick={handleDeleteAll} disabled={isDeletingAll} className="bg-white text-red-600 hover:bg-red-50 hover:border-red-200 whitespace-nowrap">
            <Trash2 className="w-4 h-4 mr-2" /> Delete All
          </Button>
        </div>
      </div>

      <div className="card overflow-hidden flex flex-col">
        <div className="p-4 border-b border-border bg-slate-50/50 flex gap-2 overflow-x-auto hide-scrollbar">
          {availableFilters.map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-4 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${filter === f ? 'bg-brand-primary text-white shadow-sm' : 'bg-white border border-border text-muted hover:bg-slate-50 hover:text-heading'}`}
            >
              {f.split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}
            </button>
          ))}
        </div>

        <div className="divide-y divide-border flex-1">
          {loading ? (
            <div className="p-12 text-center">
              <span className="loader"></span>
            </div>
          ) : filteredNotifications.length === 0 ? (
            <div className="p-12 text-center flex flex-col items-center">
              <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center text-slate-400 mb-4">
                <Bell className="w-8 h-8" />
              </div>
              <h3 className="text-lg font-bold text-heading">No notifications found</h3>
              <p className="text-muted text-sm mt-1 max-w-sm">
                You're all caught up! There are no notifications matching your current filters.
              </p>
            </div>
          ) : (
            filteredNotifications.map((notif) => (
              <div key={notif._id} className={`p-4 hover:bg-slate-50 transition-colors flex gap-4 ${!notif.isRead ? 'bg-blue-50/30' : 'bg-white'}`}>
                <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${!notif.isRead ? 'bg-white shadow-sm' : 'bg-slate-100'}`}>
                  {getIcon(notif.type)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <h4 className={`text-sm ${!notif.isRead ? 'font-bold text-heading' : 'font-medium text-slate-700'}`}>
                        {notif.title}
                      </h4>
                      <p className={`text-sm mt-1 ${!notif.isRead ? 'text-slate-700' : 'text-muted'}`}>
                        {notif.message}
                      </p>
                    </div>
                    <span className="text-xs text-muted whitespace-nowrap shrink-0">{timeAgo(notif.createdAt)}</span>
                  </div>
                  
                  <div className="mt-3 flex items-center gap-4">
                    {!notif.isRead && (
                      <button 
                        onClick={() => handleMarkAsRead(notif._id)}
                        className="text-xs font-medium text-brand-primary hover:underline flex items-center"
                      >
                        <Circle className="w-3 h-3 mr-1 fill-current" /> Mark as read
                      </button>
                    )}
                    <button 
                      onClick={() => handleDelete(notif._id)}
                      className="text-xs font-medium text-muted hover:text-red-600 flex items-center"
                    >
                      <Trash2 className="w-3 h-3 mr-1" /> Delete
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
        
        {pagination.pages > 1 && (
          <div className="p-4 border-t border-border flex items-center justify-between bg-slate-50/50">
            <span className="text-sm text-muted">
              Page {pagination.page} of {pagination.pages}
            </span>
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                size="sm" 
                disabled={pagination.page === 1}
                onClick={() => fetchNotifications(pagination.page - 1)}
              >
                Previous
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                disabled={pagination.page === pagination.pages}
                onClick={() => fetchNotifications(pagination.page + 1)}
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </div>
    </PageTransition>
  );
};

export default Notifications;

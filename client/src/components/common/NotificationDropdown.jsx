import { useState, useContext, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Bell, CheckCircle, Calendar, AlertCircle } from 'lucide-react';
import { NotificationContext } from '../../context/NotificationContext';
import { timeAgo } from '../../utils/format';
import { motion, AnimatePresence } from 'framer-motion';

const NotificationDropdown = ({ role }) => {
  const { notifications, unreadCount, markRead } = useContext(NotificationContext);
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const getIcon = (type) => {
    switch (type) {
      case 'appointment': return <Calendar className="w-4 h-4 text-blue-500" />;
      case 'system': return <AlertCircle className="w-4 h-4 text-amber-500" />;
      case 'approval': return <CheckCircle className="w-4 h-4 text-emerald-500" />;
      default: return <Bell className="w-4 h-4 text-brand-primary" />;
    }
  };

  const displayNotifications = notifications.slice(0, 5);

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 rounded-md hover:bg-surface-secondary transition-colors focus:outline-none focus:ring-2 focus:ring-brand-primary/20"
        aria-label="Notifications"
      >
        <Bell size={20} className="text-muted" />
        {unreadCount > 0 && (
          <span className="absolute top-1.5 right-1.5 flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-500 border-2 border-white"></span>
          </span>
        )}
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 8, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className="absolute right-0 top-full mt-2 w-80 bg-white rounded-xl border border-border shadow-xl z-50 overflow-hidden flex flex-col"
          >
            <div className="p-3 border-b border-border flex items-center justify-between bg-slate-50">
              <h3 className="font-semibold text-heading text-sm">Notifications</h3>
              {unreadCount > 0 && (
                <span className="text-xs font-medium text-brand-primary">{unreadCount} unread</span>
              )}
            </div>

            <div className="max-h-[320px] overflow-y-auto hide-scrollbar">
              {displayNotifications.length === 0 ? (
                <div className="p-6 text-center text-muted text-sm">
                  <Bell className="w-8 h-8 mx-auto mb-2 opacity-20" />
                  No new notifications
                </div>
              ) : (
                <div className="divide-y divide-border">
                  {displayNotifications.map((notif) => (
                    <div 
                      key={notif._id} 
                      className={`p-3 hover:bg-slate-50 transition-colors flex gap-3 ${!notif.isRead ? 'bg-blue-50/20' : ''}`}
                    >
                      <div className="shrink-0 mt-0.5">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center ${!notif.isRead ? 'bg-white shadow-sm' : 'bg-slate-100'}`}>
                          {getIcon(notif.type)}
                        </div>
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className={`text-sm truncate ${!notif.isRead ? 'font-semibold text-heading' : 'text-slate-700'}`}>
                          {notif.title}
                        </p>
                        <p className="text-xs text-muted mt-0.5 line-clamp-2">
                          {notif.message}
                        </p>
                        <p className="text-[10px] text-muted mt-1.5 font-medium">
                          {timeAgo(notif.createdAt)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="p-2 border-t border-border bg-slate-50">
              <Link
                to={`/${role}/notifications`}
                onClick={() => setIsOpen(false)}
                className="block w-full py-1.5 text-center text-sm font-medium text-brand-primary hover:bg-brand-primary/10 rounded-md transition-colors"
              >
                View all notifications
              </Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default NotificationDropdown;

import { useState, useEffect } from 'react';
import { Outlet, useLocation, Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Home, LayoutDashboard, Search, Calendar, MessageSquare,
  FolderOpen, Pill, User, Users, Clock, DollarSign,
  CheckCircle, Stethoscope, BarChart3, Tag, FileText,
  Settings, Bell, Menu, X, LogOut, ChevronRight, Mail
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import Avatar from './Avatar';
import NotificationDropdown from './NotificationDropdown';
import useSocketStore from '../../store/useSocketStore';

const sidebarLinks = {
  patient: [
    { to: '/patient/home', icon: Home, label: 'Home' },
    { to: '/patient/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { to: '/patient/find-doctor', icon: Search, label: 'Find Doctor' },
    { to: '/patient/appointments', icon: Calendar, label: 'Appointments' },
    { to: '/patient/chat', icon: MessageSquare, label: 'Chat' },
    { to: '/patient/records', icon: FolderOpen, label: 'Medical Records' },
    { to: '/patient/prescriptions', icon: Pill, label: 'Prescriptions' },
    { to: '/patient/profile', icon: User, label: 'Profile' },
  ],
  doctor: [
    { to: '/doctor/home', icon: Home, label: 'Home' },
    { to: '/doctor/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { to: '/doctor/appointments', icon: Calendar, label: 'Appointments' },
    { to: '/doctor/patients', icon: Users, label: 'My Patients' },
    { to: '/doctor/schedule', icon: Clock, label: 'Schedule' },
    { to: '/doctor/chat', icon: MessageSquare, label: 'Chat' },
    { to: '/doctor/notifications', icon: Bell, label: 'Notifications' },
    { to: '/doctor/earnings', icon: DollarSign, label: 'Earnings' },
    { to: '/doctor/profile', icon: User, label: 'Profile' },
  ],
  admin: [
    { to: '/admin/home', icon: Home, label: 'Home' },
    { to: '/admin/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { to: '/admin/approvals', icon: CheckCircle, label: 'Approvals' },
    { to: '/admin/doctors', icon: Stethoscope, label: 'Doctors' },
    { to: '/admin/patients', icon: Users, label: 'Patients' },
    { to: '/admin/appointments', icon: Calendar, label: 'Appointments' },
    { to: '/admin/chat', icon: MessageSquare, label: 'Chat' },
    { to: '/admin/contact-inquiries', icon: Mail, label: 'Contact Inquiries' },
    { to: '/admin/analytics', icon: BarChart3, label: 'Analytics' },
    { to: '/admin/specializations', icon: Tag, label: 'Specializations' },
    { to: '/admin/reports', icon: FileText, label: 'Reports' },
    { to: '/admin/notifications', icon: Bell, label: 'Notifications' },
    { to: '/admin/settings', icon: Settings, label: 'Settings' },
  ],
};

const DashboardLayout = ({ role }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { socket, unreadChatCount, fetchUnreadChatCount } = useSocketStore();

  useEffect(() => {
    fetchUnreadChatCount();
  }, [fetchUnreadChatCount]);

  useEffect(() => {
    if (!socket) return;
    
    // Refetch unread counts when a conversation updates (e.g. new message) or is read
    socket.on('conversation:update', fetchUnreadChatCount);
    socket.on('message:read', fetchUnreadChatCount);
    socket.on('conversation:read', fetchUnreadChatCount);
    
    return () => {
      socket.off('conversation:update', fetchUnreadChatCount);
      socket.off('message:read', fetchUnreadChatCount);
      socket.off('conversation:read', fetchUnreadChatCount);
    };
  }, [socket, fetchUnreadChatCount]);

  const links = sidebarLinks[role] || [];
  const currentPage = links.find((l) => location.pathname.startsWith(l.to))?.label || 'Dashboard';

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-surface-secondary">
      {/* ─── Top Nav ─── */}
      <header className="fixed top-0 left-0 right-0 z-40 h-16 bg-white border-b border-border flex items-center px-4 lg:px-6">
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="lg:hidden p-2 rounded-md hover:bg-surface-secondary mr-2"
          aria-label="Toggle sidebar"
        >
          <Menu size={20} className="text-heading" />
        </button>

        <Link to={`/${role}/home`} className="flex items-center gap-2 mr-6">
          <div className="w-8 h-8 rounded-md bg-brand-primary flex items-center justify-center">
            <span className="text-white font-bold text-sm">H</span>
          </div>
          <span className="hidden sm:block font-heading font-bold text-heading text-lg">
            Health<span className="text-brand-primary">Bridge</span>
          </span>
        </Link>

        <div className="hidden lg:block">
          <h1 className="font-heading font-semibold text-heading">{currentPage}</h1>
        </div>

        <div className="ml-auto flex items-center gap-3">
          <NotificationDropdown role={role} />

          <Link
            to={`/${role}/chat`}
            className="relative p-2 rounded-md hover:bg-surface-secondary transition-colors"
            aria-label="Messages"
          >
            <MessageSquare size={20} className="text-muted" />
            {unreadChatCount > 0 && (
              <span className="absolute top-0.5 right-0.5 min-w-[16px] h-[16px] px-1 rounded-full bg-red-500 border-2 border-white text-[9px] font-bold text-white flex items-center justify-center shadow-sm">
                {unreadChatCount > 99 ? '99+' : unreadChatCount}
              </span>
            )}
          </Link>

          <div className="relative">
            <button
              onClick={() => setDropdownOpen(!dropdownOpen)}
              className="flex items-center gap-2 p-1.5 rounded-md hover:bg-surface-secondary transition-colors"
              aria-label="User menu"
            >
              <Avatar src={user?.avatar?.url || user?.avatar} name={user?.name} role={role} size="sm" />
              <span className="hidden md:block text-body-sm font-medium text-heading">
                {user?.name?.split(' ')[0]}
              </span>
              <ChevronRight
                size={14}
                className={`text-muted transition-transform ${dropdownOpen ? 'rotate-90' : ''}`}
              />
            </button>

            <AnimatePresence>
              {dropdownOpen && (
                <motion.div
                  initial={{ opacity: 0, y: 8, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 8, scale: 0.95 }}
                  transition={{ duration: 0.15 }}
                  className="absolute right-0 top-full mt-2 w-48 bg-white rounded-lg border border-border shadow-hover py-1 z-50"
                >
                  <Link
                    to={`/${role}/profile`}
                    onClick={() => setDropdownOpen(false)}
                    className="flex items-center gap-2 px-4 py-2.5 text-body-sm text-body hover:bg-surface-secondary transition-colors"
                  >
                    <User size={16} />
                    Profile
                  </Link>
                  {role === 'admin' && (
                    <Link
                      to={`/${role}/settings`}
                      onClick={() => setDropdownOpen(false)}
                      className="flex items-center gap-2 px-4 py-2.5 text-body-sm text-body hover:bg-surface-secondary transition-colors"
                    >
                      <Settings size={16} />
                      Settings
                    </Link>
                  )}
                  <hr className="border-border my-1" />
                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center gap-2 px-4 py-2.5 text-body-sm text-status-error hover:bg-red-50 transition-colors"
                  >
                    <LogOut size={16} />
                    Logout
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </header>

      {/* ─── Sidebar Overlay (mobile) ─── */}
      <AnimatePresence>
        {sidebarOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-overlay-dark z-40 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* ─── Sidebar ─── */}
      <aside
        className={`fixed top-16 left-0 bottom-0 z-40 w-60 bg-white border-r border-border
          transform transition-transform duration-300 ease-in-out
          lg:translate-x-0 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}
      >
        <div className="flex flex-col h-full">
          <nav className="flex-1 py-4 px-3 space-y-1 overflow-y-auto">
            {links.map((link) => {
              const isActive = location.pathname === link.to ||
                (link.to !== `/${role}/home` && location.pathname.startsWith(link.to));
              const Icon = link.icon;

              return (
                <Link
                  key={link.to}
                  to={link.to}
                  onClick={() => setSidebarOpen(false)}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-md text-body-sm font-medium transition-all duration-200
                    ${isActive
                      ? 'bg-surface-secondary text-brand-primary font-semibold border-l-[3px] border-brand-primary'
                      : 'text-body hover:bg-surface-secondary hover:text-heading'
                    }`}
                >
                  <div className="flex items-center gap-3 flex-1">
                    <Icon size={18} />
                    {link.label}
                  </div>
                  {link.label === 'Chat' && unreadChatCount > 0 && (
                    <span className="bg-red-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow-sm ml-auto">
                      {unreadChatCount > 99 ? '99+' : unreadChatCount}
                    </span>
                  )}
                </Link>
              );
            })}
          </nav>

          <div
            onClick={() => {
              setSidebarOpen(false);
              navigate(`/${role}/${role === 'admin' ? 'settings' : 'profile'}`);
            }}
            className="p-4 border-t border-border cursor-pointer hover:bg-slate-50 transition-colors"
          >
            <div className="flex items-center gap-3">
              <Avatar src={user?.avatar?.url || user?.avatar} name={user?.name} role={role} size="sm" />
              <div className="min-w-0">
                <p className="text-body-sm font-semibold text-heading truncate">{user?.name}</p>
                <p className="text-caption text-muted capitalize">{role}</p>
              </div>
            </div>
          </div>
        </div>
      </aside>

      {/* ─── Main Content ─── */}
      <main className="lg:pl-60 pt-16 min-h-screen">
        <div className="p-4 lg:p-6 xl:p-8">
          <Outlet />
        </div>
      </main>
    </div>
  );
};

export default DashboardLayout;

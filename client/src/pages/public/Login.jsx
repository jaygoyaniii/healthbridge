import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, Lock, Activity, AlertCircle, CheckCircle2, ArrowRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import PageTransition from '../../components/common/PageTransition';
import { useAuth } from '../../hooks/useAuth';
import adminService from '../../services/adminService';
import Input from '../../components/ui/Input';
import Button from '../../components/ui/Button';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({ email: false, password: false });
  const [stats, setStats] = useState({ totalPatients: 0, totalDoctors: 0, totalAppointments: 0 });
  
  const { login } = useAuth();
  const navigate = useNavigate();

  // Fetch real platform metrics
  useEffect(() => {
    adminService.getPublicStats()
      .then(res => {
        if (res.data?.stats) {
          setStats({
            totalPatients: res.data.stats.totalPatients || 0,
            totalDoctors: res.data.stats.totalDoctors || 0,
            totalAppointments: res.data.stats.totalAppointments || 0
          });
        }
      })
      .catch(() => console.log('Stats fetch skipped'));
  }, []);

  const validateEmail = (val) => {
    if (!val) return 'Email address is required.';
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!regex.test(val)) return 'Please enter a valid email address.';
    return null;
  };

  const validatePassword = (val) => {
    if (!val) return 'Password is required.';
    return null;
  };

  // Real-time validation
  useEffect(() => {
    if (touched.email) {
      setErrors((prev) => ({ ...prev, email: validateEmail(email) }));
    }
  }, [email, touched.email]);

  useEffect(() => {
    if (touched.password) {
      setErrors((prev) => ({ ...prev, password: validatePassword(password) }));
    }
  }, [password, touched.password]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    setTouched({ email: true, password: true });
    const emailError = validateEmail(email);
    const passwordError = validatePassword(password);
    
    if (emailError || passwordError) {
      setErrors({ email: emailError, password: passwordError });
      return;
    }

    setIsLoading(true);
    setErrors({});
    
    try {
      const data = await login(email, password);
      toast.success('Welcome back!');
      
      // Route based on role
      if (data.user.role === 'patient') navigate('/patient/dashboard');
      else if (data.user.role === 'doctor') navigate('/doctor/dashboard');
      else if (data.user.role === 'admin') navigate('/admin/dashboard');
      
    } catch (error) {
      // Backend Error Mapping
      const code = error?.errorCode;
      const message = error?.message || 'Login failed. Please try again.';
      
      if (code === 'USER_NOT_FOUND') {
        setErrors((prev) => ({ ...prev, email: message }));
      } else if (code === 'INVALID_PASSWORD') {
        setErrors((prev) => ({ ...prev, password: message }));
      } else if (code === 'ACCOUNT_DISABLED') {
        toast.error(message, { duration: 5000 });
      } else if (code === 'SESSION_EXPIRED' || code === 'INVALID_TOKEN' || code === 'NO_REFRESH_TOKEN') {
        toast.error('Your session has expired. Please sign in again.');
      } else {
        toast.error(message);
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <PageTransition className="min-h-screen bg-surface-primary flex flex-col lg:flex-row selection:bg-brand-primary/20">
      
      {/* ─── LEFT SIDE: BRANDING & HIGHLIGHTS (Hidden on Mobile) ─── */}
      <div className="hidden lg:flex lg:w-[45%] bg-heading relative flex-col justify-between p-12 overflow-hidden lg:sticky lg:top-0 lg:h-screen">
        <div className="absolute inset-0 z-0">
          <div className="absolute inset-0 bg-gradient-to-br from-brand-primary/40 via-brand-secondary/20 to-heading opacity-80" />
          <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-brand-primary/30 rounded-full blur-[120px] -translate-y-1/2 translate-x-1/2" />
          <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-brand-secondary/20 rounded-full blur-[150px] translate-y-1/3 -translate-x-1/3" />
        </div>

        <motion.div 
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }}
          className="relative z-10"
        >
          <Link to="/" className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-white text-brand-primary flex items-center justify-center shadow-2xl">
              <Activity className="w-7 h-7" />
            </div>
            <span className="font-display font-bold text-3xl text-white tracking-tight">HealthBridge</span>
          </Link>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, delay: 0.2 }}
          className="relative z-10 max-w-md"
        >
          <h1 className="text-4xl lg:text-5xl font-display font-bold text-white leading-tight mb-6">
            Connecting Patients, Doctors, and Healthcare Seamlessly.
          </h1>
          <p className="text-lg text-white/70 leading-relaxed">
            Experience an enterprise-grade medical ecosystem designed to secure, streamline, and simplify your entire healthcare journey.
          </p>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, delay: 0.4 }}
          className="relative z-10 border-t border-white/10 pt-8"
        >
          <div className="grid grid-cols-3 gap-6">
            <div>
              <p className="text-3xl font-display font-bold text-white mb-1">{stats.totalDoctors}+</p>
              <p className="text-sm font-semibold text-white/50 uppercase tracking-wider">Doctors</p>
            </div>
            <div>
              <p className="text-3xl font-display font-bold text-white mb-1">{stats.totalPatients}+</p>
              <p className="text-sm font-semibold text-white/50 uppercase tracking-wider">Patients</p>
            </div>
            <div>
              <p className="text-3xl font-display font-bold text-white mb-1">{stats.totalAppointments}+</p>
              <p className="text-sm font-semibold text-white/50 uppercase tracking-wider">Appointments</p>
            </div>
          </div>
        </motion.div>
      </div>

      {/* ─── RIGHT SIDE: AUTHENTICATION FORM ─── */}
      <div className="flex-1 flex flex-col justify-center items-center p-6 lg:p-12 relative">
        <div className="w-full max-w-md relative z-10">
          
          {/* Mobile Branding */}
          <div className="lg:hidden flex justify-center mb-8">
            <Link to="/" className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-brand-primary text-white flex items-center justify-center shadow-lg shadow-brand-primary/20">
                <Activity className="w-7 h-7" />
              </div>
              <span className="font-display font-bold text-3xl text-heading tracking-tight">HealthBridge</span>
            </Link>
          </div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
            <h2 className="text-3xl font-display font-bold text-heading mb-2">Welcome back</h2>
            <p className="text-body text-lg mb-8">
              Don't have an account?{' '}
              <Link to="/register" className="font-semibold text-brand-primary hover:text-brand-primary-hover transition-colors">
                Create one now
              </Link>
            </p>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.1 }}
            className="bg-white/80 backdrop-blur-xl rounded-[2rem] p-8 shadow-2xl shadow-brand-primary/5 border border-border"
          >
            <form className="space-y-6" onSubmit={handleSubmit} noValidate>
              
              <div className="space-y-1">
                <label className="text-sm font-bold text-heading ml-1">Email Address</label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-muted group-focus-within:text-brand-primary transition-colors">
                    <Mail className="w-5 h-5" />
                  </div>
                  <input
                    type="email"
                    required
                    className={`w-full h-14 pl-12 pr-12 rounded-xl bg-surface-secondary border transition-all duration-300 outline-none
                      ${errors.email 
                        ? 'border-red-500 focus:border-red-500 focus:ring-1 focus:ring-red-500' 
                        : touched.email && !errors.email 
                          ? 'border-green-500 focus:border-green-500 focus:ring-1 focus:ring-green-500' 
                          : 'border-border focus:border-brand-primary focus:ring-1 focus:ring-brand-primary hover:border-brand-primary/50'
                      }`}
                    placeholder="name@example.com"
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      if (!touched.email) setTouched(prev => ({ ...prev, email: true }));
                    }}
                    onBlur={() => setTouched(prev => ({ ...prev, email: true }))}
                    disabled={isLoading}
                  />
                  <div className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none">
                    <AnimatePresence>
                      {touched.email && !errors.email && (
                        <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }}>
                          <CheckCircle2 className="w-5 h-5 text-green-500" />
                        </motion.div>
                      )}
                      {touched.email && errors.email && (
                        <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }}>
                          <AlertCircle className="w-5 h-5 text-red-500" />
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </div>
                <AnimatePresence>
                  {errors.email && (
                    <motion.p initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="text-red-500 text-sm ml-1 mt-1">
                      {errors.email}
                    </motion.p>
                  )}
                </AnimatePresence>
              </div>

              <div className="space-y-1">
                <label className="text-sm font-bold text-heading ml-1">Password</label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-muted group-focus-within:text-brand-primary transition-colors">
                    <Lock className="w-5 h-5" />
                  </div>
                  <input
                    type="password"
                    required
                    className={`w-full h-14 pl-12 pr-12 rounded-xl bg-surface-secondary border transition-all duration-300 outline-none
                      ${errors.password 
                        ? 'border-red-500 focus:border-red-500 focus:ring-1 focus:ring-red-500' 
                        : touched.password && !errors.password 
                          ? 'border-green-500 focus:border-green-500 focus:ring-1 focus:ring-green-500' 
                          : 'border-border focus:border-brand-primary focus:ring-1 focus:ring-brand-primary hover:border-brand-primary/50'
                      }`}
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      if (!touched.password) setTouched(prev => ({ ...prev, password: true }));
                    }}
                    onBlur={() => setTouched(prev => ({ ...prev, password: true }))}
                    disabled={isLoading}
                  />
                  <div className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none">
                    <AnimatePresence>
                      {touched.password && !errors.password && (
                        <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }}>
                          <CheckCircle2 className="w-5 h-5 text-green-500" />
                        </motion.div>
                      )}
                      {touched.password && errors.password && (
                        <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }}>
                          <AlertCircle className="w-5 h-5 text-red-500" />
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </div>
                <AnimatePresence>
                  {errors.password && (
                    <motion.p initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="text-red-500 text-sm ml-1 mt-1">
                      {errors.password}
                    </motion.p>
                  )}
                </AnimatePresence>
              </div>

              <div className="flex items-center justify-between pt-2">
                <div className="flex items-center">
                  <input
                    id="remember-me"
                    type="checkbox"
                    className="h-4 w-4 text-brand-primary focus:ring-brand-primary border-border rounded cursor-pointer transition-colors"
                    disabled={isLoading}
                  />
                  <label htmlFor="remember-me" className="ml-2 block text-sm font-medium text-body cursor-pointer select-none">
                    Remember me
                  </label>
                </div>
                <Link to="/forgot-password" className="text-sm font-bold text-brand-primary hover:text-brand-primary-hover transition-colors">
                  Forgot password?
                </Link>
              </div>

              <Button
                type="submit"
                className="w-full text-lg h-14 rounded-xl shadow-xl shadow-brand-primary/20 mt-6"
                disabled={isLoading}
              >
                {isLoading ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="animate-spin h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Authenticating...
                  </span>
                ) : (
                  <span className="flex items-center justify-center gap-2">
                    Sign in to Account <ArrowRight className="w-5 h-5" />
                  </span>
                )}
              </Button>
            </form>
          </motion.div>
        </div>
      </div>

    </PageTransition>
  );
};

export default Login;

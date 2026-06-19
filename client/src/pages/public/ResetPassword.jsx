import { useState, useMemo } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Lock, Activity, CheckCircle2, XCircle, ArrowRight, ShieldCheck } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';

import PageTransition from '../../components/common/PageTransition';
import authService from '../../services/authService';
import Button from '../../components/ui/Button';

const ResetPassword = () => {
  const { token } = useParams();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const validations = useMemo(() => {
    return {
      length: password.length >= 8,
      uppercase: /[A-Z]/.test(password),
      lowercase: /[a-z]/.test(password),
      number: /[0-9]/.test(password),
      special: /[^A-Za-z0-9]/.test(password),
    };
  }, [password]);

  const isValid = Object.values(validations).every(Boolean) && password === confirmPassword && password.length > 0;

  const strengthScore = useMemo(() => {
    if (!password) return 0;
    return Object.values(validations).filter(Boolean).length;
  }, [validations, password]);

  const getStrengthMeta = () => {
    if (strengthScore === 0) return { label: '', color: 'bg-surface-secondary' };
    if (strengthScore <= 2) return { label: 'Weak', color: 'bg-red-500', text: 'text-red-500' };
    if (strengthScore <= 4) return { label: 'Fair', color: 'bg-amber-500', text: 'text-amber-500' };
    return { label: 'Strong', color: 'bg-green-500', text: 'text-green-500' };
  };

  const strengthMeta = getStrengthMeta();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!isValid) return;

    setLoading(true);
    try {
      await authService.resetPassword(token, password);
      setSuccess(true);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Invalid or expired token. Please try requesting a new link.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <PageTransition className="min-h-screen bg-surface-primary flex flex-col justify-center items-center p-6 lg:p-12 relative overflow-hidden selection:bg-brand-primary/20">
      
      {/* Background Decorators */}
      <div className="absolute inset-0 z-0 pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-brand-primary/10 rounded-full blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[600px] h-[600px] bg-brand-secondary/10 rounded-full blur-[150px]" />
      </div>

      <div className="w-full max-w-[500px] relative z-10 flex flex-col items-center">
        
        {/* Branding */}
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }} className="mb-10">
          <Link to="/" className="flex items-center gap-3 group">
            <div className="w-14 h-14 rounded-2xl bg-brand-primary text-white flex items-center justify-center shadow-xl shadow-brand-primary/20 group-hover:scale-105 transition-transform duration-300">
              <Activity className="w-8 h-8" />
            </div>
            <span className="text-4xl font-display font-bold tracking-tight text-heading">
              HealthBridge
            </span>
          </Link>
        </motion.div>

        {/* Card */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.1 }}
          className="w-full bg-white/80 backdrop-blur-xl rounded-[2rem] border border-border shadow-2xl shadow-brand-primary/5 p-8 sm:p-12"
        >
          <AnimatePresence mode="wait">
            {success ? (
              <motion.div key="success" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} transition={{ duration: 0.4 }} className="text-center">
                <div className="w-24 h-24 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-8 border-[8px] border-green-100/50">
                  <ShieldCheck className="w-12 h-12 text-green-500" />
                </div>
                <h2 className="text-3xl font-display font-bold text-heading mb-4">Password Secured</h2>
                <p className="text-body text-lg mb-10 leading-relaxed">
                  Your password has been changed successfully. Your account is now secure and ready to be accessed.
                </p>

                <Link to="/login">
                  <Button className="w-full text-lg h-14 rounded-xl shadow-xl shadow-brand-primary/20">
                    Sign In to Account <ArrowRight className="w-5 h-5 ml-2" />
                  </Button>
                </Link>
              </motion.div>
            ) : (
              <motion.div key="form" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} transition={{ duration: 0.4 }}>
                <h2 className="text-3xl font-display font-bold text-heading mb-3 text-center">Create new password</h2>
                <p className="text-body text-center mb-10 text-lg">
                  Please choose a strong, unique password to secure your HealthBridge account.
                </p>

                <form onSubmit={handleSubmit} className="space-y-6">
                  
                  <div className="space-y-1">
                    <label className="text-sm font-bold text-heading ml-1">New Password</label>
                    <div className="relative group">
                      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-muted group-focus-within:text-brand-primary transition-colors">
                        <Lock className="w-5 h-5" />
                      </div>
                      <input
                        type="password"
                        required
                        className="w-full h-14 pl-12 pr-4 rounded-xl bg-surface-secondary border border-border focus:border-brand-primary focus:ring-1 focus:ring-brand-primary hover:border-brand-primary/50 transition-all duration-300 outline-none text-body"
                        placeholder="••••••••"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        disabled={loading}
                      />
                    </div>

                    {/* Premium Strength Meter */}
                    <AnimatePresence>
                      {password.length > 0 && (
                        <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="pt-3 px-1 overflow-hidden">
                          <div className="flex justify-between items-center mb-2">
                            <span className="text-xs font-bold text-muted uppercase tracking-wider">Security Level</span>
                            <span className={`text-xs font-black uppercase tracking-wider ${strengthMeta.text}`}>
                              {strengthMeta.label}
                            </span>
                          </div>
                          <div className="flex gap-1.5 h-2 w-full">
                            {[1, 2, 3, 4, 5].map((level) => (
                              <div 
                                key={level} 
                                className={`flex-1 rounded-full transition-colors duration-500 ${strengthScore >= level ? strengthMeta.color : 'bg-surface-secondary border border-border'}`}
                              />
                            ))}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>

                  <div className="space-y-1">
                    <label className="text-sm font-bold text-heading ml-1">Confirm Password</label>
                    <div className="relative group">
                      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-muted group-focus-within:text-brand-primary transition-colors">
                        <Lock className="w-5 h-5" />
                      </div>
                      <input
                        type="password"
                        required
                        className={`w-full h-14 pl-12 pr-4 rounded-xl bg-surface-secondary border transition-all duration-300 outline-none text-body
                          ${confirmPassword.length > 0 && password !== confirmPassword 
                            ? 'border-red-500 focus:border-red-500 focus:ring-1 focus:ring-red-500' 
                            : 'border-border focus:border-brand-primary focus:ring-1 focus:ring-brand-primary hover:border-brand-primary/50'
                          }`}
                        placeholder="••••••••"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        disabled={loading}
                      />
                    </div>
                    <AnimatePresence>
                      {confirmPassword.length > 0 && password !== confirmPassword && (
                        <motion.p initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="text-red-500 text-sm font-medium mt-1 ml-1 flex items-center gap-1.5">
                          <XCircle className="w-4 h-4" /> Passwords do not match
                        </motion.p>
                      )}
                    </AnimatePresence>
                  </div>

                  {/* Validation Checklist */}
                  <div className="bg-surface-secondary/50 rounded-2xl p-5 border border-border shadow-inner">
                    <p className="text-[13px] font-bold text-heading mb-3 uppercase tracking-wider">Password Requirements</p>
                    <ul className="grid grid-cols-2 gap-3 text-sm">
                      <li className="flex items-center gap-2">
                        <div className={`w-5 h-5 rounded-full flex items-center justify-center transition-colors ${validations.length ? 'bg-green-100 text-green-500' : 'bg-white border border-border text-transparent'}`}><CheckCircle2 className="w-3.5 h-3.5" /></div>
                        <span className={validations.length ? "text-heading font-medium" : "text-muted"}>8+ Characters</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <div className={`w-5 h-5 rounded-full flex items-center justify-center transition-colors ${validations.uppercase ? 'bg-green-100 text-green-500' : 'bg-white border border-border text-transparent'}`}><CheckCircle2 className="w-3.5 h-3.5" /></div>
                        <span className={validations.uppercase ? "text-heading font-medium" : "text-muted"}>Uppercase</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <div className={`w-5 h-5 rounded-full flex items-center justify-center transition-colors ${validations.lowercase ? 'bg-green-100 text-green-500' : 'bg-white border border-border text-transparent'}`}><CheckCircle2 className="w-3.5 h-3.5" /></div>
                        <span className={validations.lowercase ? "text-heading font-medium" : "text-muted"}>Lowercase</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <div className={`w-5 h-5 rounded-full flex items-center justify-center transition-colors ${validations.number ? 'bg-green-100 text-green-500' : 'bg-white border border-border text-transparent'}`}><CheckCircle2 className="w-3.5 h-3.5" /></div>
                        <span className={validations.number ? "text-heading font-medium" : "text-muted"}>Number</span>
                      </li>
                      <li className="flex items-center gap-2 col-span-2">
                        <div className={`w-5 h-5 rounded-full flex items-center justify-center transition-colors ${validations.special ? 'bg-green-100 text-green-500' : 'bg-white border border-border text-transparent'}`}><CheckCircle2 className="w-3.5 h-3.5" /></div>
                        <span className={validations.special ? "text-heading font-medium" : "text-muted"}>Special Character (@, #, $, etc)</span>
                      </li>
                    </ul>
                  </div>

                  <Button 
                    type="submit" 
                    className="w-full text-lg h-14 rounded-xl shadow-xl shadow-brand-primary/20"
                    disabled={loading || !isValid}
                  >
                    {loading ? (
                      <span className="flex items-center justify-center gap-2">
                        <svg className="animate-spin h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Securing Account...
                      </span>
                    ) : 'Reset Password'}
                  </Button>
                </form>

              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        {/* Footer */}
        <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.6, delay: 0.3 }} className="text-center text-[13px] text-muted font-medium mt-10 flex flex-col sm:flex-row items-center justify-center gap-2">
          <span>Enterprise-Grade Security.</span>
          <span className="hidden sm:block">•</span>
          <span>Never share your password.</span>
        </motion.p>
      </div>
    </PageTransition>
  );
};

export default ResetPassword;

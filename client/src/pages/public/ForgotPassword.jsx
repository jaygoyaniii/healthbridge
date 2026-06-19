import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Mail, ArrowLeft, Activity, CheckCircle2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';

import PageTransition from '../../components/common/PageTransition';
import authService from '../../services/authService';
import Button from '../../components/ui/Button';

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email.trim()) {
      return toast.error('Please enter your email address');
    }

    setLoading(true);
    try {
      await authService.forgotPassword(email);
      setSubmitted(true);
    } catch (error) {
      if (error.response?.status === 404) {
        setSubmitted(true); // Prevent enumeration
      } else if (error.response?.status === 429) {
        toast.error('Too many requests. Please try again later.');
      } else {
        toast.error(error.response?.data?.message || 'Something went wrong. Please try again.');
      }
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

      <div className="w-full max-w-md relative z-10 flex flex-col items-center">
        
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
            {submitted ? (
              <motion.div key="success" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} transition={{ duration: 0.4 }} className="text-center">
                <div className="w-24 h-24 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-8 border-[8px] border-green-100/50">
                  <CheckCircle2 className="w-12 h-12 text-green-500" />
                </div>
                <h2 className="text-3xl font-display font-bold text-heading mb-4">Check your inbox</h2>
                <p className="text-body text-lg mb-8 leading-relaxed">
                  If an account exists with <span className="font-bold text-heading">{email}</span>, we've sent password reset instructions.
                </p>
                
                <Link to="/login">
                  <Button className="w-full text-lg h-14 rounded-xl shadow-xl shadow-brand-primary/20">
                    Return to Login
                  </Button>
                </Link>
              </motion.div>
            ) : (
              <motion.div key="form" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} transition={{ duration: 0.4 }}>
                <h2 className="text-3xl font-display font-bold text-heading mb-3 text-center">Forgot Password?</h2>
                <p className="text-body text-center mb-10 text-lg">
                  Enter your email and we'll send you a link to securely reset your password.
                </p>

                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="space-y-1">
                    <label className="text-sm font-bold text-heading ml-1">Email Address</label>
                    <div className="relative group">
                      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-muted group-focus-within:text-brand-primary transition-colors">
                        <Mail className="w-5 h-5" />
                      </div>
                      <input
                        type="email"
                        required
                        className="w-full h-14 pl-12 pr-4 rounded-xl bg-surface-secondary border border-border focus:border-brand-primary focus:ring-1 focus:ring-brand-primary hover:border-brand-primary/50 transition-all duration-300 outline-none text-body"
                        placeholder="name@example.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        disabled={loading}
                      />
                    </div>
                  </div>

                  <Button 
                    type="submit" 
                    className="w-full text-lg h-14 rounded-xl shadow-xl shadow-brand-primary/20 mt-4"
                    disabled={loading || !email}
                  >
                    {loading ? (
                      <span className="flex items-center justify-center gap-2">
                        <svg className="animate-spin h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Sending Link...
                      </span>
                    ) : 'Send Reset Link'}
                  </Button>
                </form>

                <div className="mt-10 text-center">
                  <Link to="/login" className="inline-flex items-center text-[15px] font-bold text-muted hover:text-brand-primary transition-colors">
                    <ArrowLeft className="w-4 h-4 mr-2" /> Back to Login
                  </Link>
                </div>
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

export default ForgotPassword;

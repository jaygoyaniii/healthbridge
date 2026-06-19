import { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { User, Mail, Lock, Phone, Activity, ChevronRight, ChevronLeft, MapPin, Building, Briefcase, DollarSign, Calendar, AlertCircle, CheckCircle2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import PageTransition from '../../components/common/PageTransition';
import { useAuth } from '../../hooks/useAuth';
import api from '../../services/api';
import adminService from '../../services/adminService';
import Button from '../../components/ui/Button';

const Register = () => {
  const [searchParams] = useSearchParams();
  const initialRole = searchParams.get('role') === 'doctor' ? 'doctor' : 'patient';

  const [step, setStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [specializations, setSpecializations] = useState([]);
  const [stats, setStats] = useState({ totalPatients: 0, totalDoctors: 0, totalAppointments: 0 });
  
  const [formData, setFormData] = useState({
    role: initialRole,
    name: '', email: '', password: '', phone: '', gender: 'male', dateOfBirth: '',
    specialization: '', experience: '', fees: '', city: '', clinicName: '', bio: ''
  });

  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});

  const { register } = useAuth();
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

  useEffect(() => {
    if (formData.role === 'doctor') {
      api.get('/admin/specializations')
        .then(res => setSpecializations(res.data.specializations || []))
        .catch(console.error);
    }
  }, [formData.role]);

  const validateField = (name, value) => {
    switch (name) {
      case 'name': return !value ? 'Full Name is required.' : null;
      case 'email':
        if (!value) return 'Email is required.';
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) return 'Invalid email address.';
        return null;
      case 'password':
        if (!value) return 'Password is required.';
        if (value.length < 6) return 'Must be at least 6 characters.';
        return null;
      case 'phone': return !value ? 'Phone Number is required.' : null;
      case 'dateOfBirth': return !value ? 'Date of Birth is required.' : null;
      case 'experience': return value === '' || value < 0 ? 'Valid experience required.' : null;
      case 'fees': return value === '' || value < 0 ? 'Valid fee required.' : null;
      case 'city': return !value ? 'City is required.' : null;
      case 'clinicName': return !value ? 'Clinic Name is required.' : null;
      case 'specialization': return formData.role === 'doctor' && !value ? 'Specialization is required.' : null;
      case 'bio': return formData.role === 'doctor' && !value ? 'Professional Bio is required.' : null;
      default: return null;
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (!touched[name]) setTouched(prev => ({ ...prev, [name]: true }));
  };

  useEffect(() => {
    const newErrors = {};
    Object.keys(touched).forEach(key => {
      if (touched[key]) {
        const error = validateField(key, formData[key]);
        if (error) newErrors[key] = error;
      }
    });
    setErrors(newErrors);
  }, [formData, touched]);

  const validateStep = (fields) => {
    const newErrors = {};
    const newTouched = { ...touched };
    let isValid = true;
    
    fields.forEach(field => {
      newTouched[field] = true;
      const err = validateField(field, formData[field]);
      if (err) { newErrors[field] = err; isValid = false; }
    });

    setTouched(newTouched);
    setErrors(prev => ({ ...prev, ...newErrors }));
    return isValid;
  };

  const nextStep = (e) => {
    e.preventDefault();
    const fields = ['name', 'email', 'password', 'phone', 'dateOfBirth'];
    if (!validateStep(fields)) return;

    if (step === 1 && formData.role === 'doctor') setStep(2);
    else handleSubmit(e);
  };

  const prevStep = () => setStep(1);

  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    if (formData.role === 'doctor' && !validateStep(['specialization', 'experience', 'fees', 'city', 'clinicName', 'bio'])) return;

    setIsLoading(true);
    try {
      const data = await register(formData);
      toast.success(data.message || 'Registration successful!');
      if (data.user.role === 'patient') navigate('/patient/dashboard');
      else if (data.user.role === 'doctor') navigate('/doctor/dashboard');
    } catch (error) {
      const code = error?.errorCode;
      const message = error?.message || 'Registration failed. Please try again.';
      if (code === 'EMAIL_EXISTS') {
        setStep(1);
        setErrors(prev => ({ ...prev, email: message }));
      } else {
        toast.error(message);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const renderInput = (name, label, type = "text", icon, placeholder, extraProps = {}) => (
    <div className="space-y-1">
      <label className="text-sm font-bold text-heading ml-1">{label}</label>
      <div className="relative group">
        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-muted group-focus-within:text-brand-primary transition-colors">
          {icon}
        </div>
        <input
          type={type}
          name={name}
          required
          className={`w-full h-12 pl-12 pr-12 rounded-xl bg-surface-secondary border transition-all duration-300 outline-none text-sm
            ${errors[name] 
              ? 'border-red-500 focus:border-red-500 focus:ring-1 focus:ring-red-500' 
              : touched[name] && !errors[name] 
                ? 'border-green-500 focus:border-green-500 focus:ring-1 focus:ring-green-500' 
                : 'border-border focus:border-brand-primary focus:ring-1 focus:ring-brand-primary hover:border-brand-primary/50'
            }`}
          placeholder={placeholder}
          value={formData[name]}
          onChange={handleChange}
          onBlur={() => setTouched(prev => ({ ...prev, [name]: true }))}
          disabled={isLoading}
          {...extraProps}
        />
        <div className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none">
          <AnimatePresence>
            {touched[name] && !errors[name] && (
              <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }}>
                <CheckCircle2 className="w-4 h-4 text-green-500" />
              </motion.div>
            )}
            {touched[name] && errors[name] && (
              <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }}>
                <AlertCircle className="w-4 h-4 text-red-500" />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
      <AnimatePresence>
        {errors[name] && (
          <motion.p initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="text-red-500 text-xs ml-1 mt-1">
            {errors[name]}
          </motion.p>
        )}
      </AnimatePresence>
    </div>
  );

  return (
    <PageTransition className="min-h-screen bg-surface-primary flex flex-col lg:flex-row selection:bg-brand-primary/20">
      
      {/* ─── LEFT SIDE: BRANDING (Hidden on Mobile) ─── */}
      <div className="hidden lg:flex lg:w-[45%] bg-heading relative flex-col justify-between p-12 overflow-hidden lg:sticky lg:top-0 lg:h-screen">
        <div className="absolute inset-0 z-0">
          <div className="absolute inset-0 bg-gradient-to-br from-brand-primary/40 via-brand-secondary/20 to-heading opacity-80" />
          <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-brand-primary/30 rounded-full blur-[120px] -translate-y-1/2 translate-x-1/2" />
          <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-brand-secondary/20 rounded-full blur-[150px] translate-y-1/3 -translate-x-1/3" />
        </div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }} className="relative z-10">
          <Link to="/" className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-white text-brand-primary flex items-center justify-center shadow-2xl">
              <Activity className="w-7 h-7" />
            </div>
            <span className="font-display font-bold text-3xl text-white tracking-tight">HealthBridge</span>
          </Link>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, delay: 0.2 }} className="relative z-10 max-w-md">
          <h1 className="text-4xl lg:text-5xl font-display font-bold text-white leading-tight mb-6">
            Join the Next Generation of Healthcare.
          </h1>
          <p className="text-lg text-white/70 leading-relaxed">
            Create your secure account in seconds. Access premium medical services or connect with verified patients globally.
          </p>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, delay: 0.4 }} className="relative z-10 border-t border-white/10 pt-8">
          <div className="grid grid-cols-3 gap-6">
            <div><p className="text-3xl font-display font-bold text-white mb-1">{stats.totalDoctors}+</p><p className="text-sm font-semibold text-white/50 uppercase tracking-wider">Doctors</p></div>
            <div><p className="text-3xl font-display font-bold text-white mb-1">{stats.totalPatients}+</p><p className="text-sm font-semibold text-white/50 uppercase tracking-wider">Patients</p></div>
            <div><p className="text-3xl font-display font-bold text-white mb-1">{stats.totalAppointments}+</p><p className="text-sm font-semibold text-white/50 uppercase tracking-wider">Appts</p></div>
          </div>
        </motion.div>
      </div>

      {/* ─── RIGHT SIDE: REGISTRATION FORM ─── */}
      <div className="flex-1 flex flex-col justify-center items-center p-6 lg:p-12 relative min-h-screen">
        <div className="w-full max-w-[500px] relative z-10 my-auto">
          
          <div className="lg:hidden flex justify-center mb-8">
            <Link to="/" className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-brand-primary text-white flex items-center justify-center shadow-lg"><Activity className="w-7 h-7" /></div>
              <span className="font-display font-bold text-3xl text-heading tracking-tight">HealthBridge</span>
            </Link>
          </div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
            <h2 className="text-3xl font-display font-bold text-heading mb-2">Create an account</h2>
            <p className="text-body text-lg mb-6">
              Already have an account? <Link to="/login" className="font-semibold text-brand-primary hover:text-brand-primary-hover">Sign in here</Link>
            </p>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.1 }} className="bg-white/80 backdrop-blur-xl rounded-[2rem] p-6 sm:p-8 shadow-2xl shadow-brand-primary/5 border border-border">
            
            {formData.role === 'doctor' && (
              <div className="flex items-center justify-center mb-8">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-all duration-500 ${step >= 1 ? 'bg-brand-primary text-white shadow-md' : 'bg-surface-secondary border border-border text-muted'}`}>1</div>
                <div className="w-12 h-1 overflow-hidden bg-border"><div className={`h-full bg-brand-primary transition-all duration-500 ${step >= 2 ? 'w-full' : 'w-0'}`}></div></div>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-all duration-500 ${step >= 2 ? 'bg-brand-primary text-white shadow-md' : 'bg-surface-secondary border border-border text-muted'}`}>2</div>
              </div>
            )}

            {step === 1 && (
              <div className="flex p-1 bg-surface-secondary rounded-xl mb-6 border border-border shadow-inner">
                <button type="button" className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all ${formData.role === 'patient' ? 'bg-white text-brand-primary shadow-sm ring-1 ring-border' : 'text-muted hover:text-heading'}`} onClick={() => setFormData({ ...formData, role: 'patient' })}>Patient</button>
                <button type="button" className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all ${formData.role === 'doctor' ? 'bg-white text-brand-primary shadow-sm ring-1 ring-border' : 'text-muted hover:text-heading'}`} onClick={() => setFormData({ ...formData, role: 'doctor' })}>Doctor</button>
              </div>
            )}

            <form className="space-y-4" onSubmit={nextStep} noValidate>
              <AnimatePresence mode="wait">
                {step === 1 && (
                  <motion.div key="step1" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.3 }} className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {renderInput('name', 'Full Name', 'text', <User className="w-5 h-5"/>, 'John Doe')}
                      {renderInput('phone', 'Phone', 'tel', <Phone className="w-5 h-5"/>, '+1 234 567 8900')}
                    </div>
                    {renderInput('email', 'Email Address', 'email', <Mail className="w-5 h-5"/>, 'name@example.com')}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {renderInput('dateOfBirth', 'Date of Birth', 'date', <Calendar className="w-5 h-5"/>, '')}
                      <div className="space-y-1">
                        <label className="text-sm font-bold text-heading ml-1">Gender</label>
                        <select name="gender" className="w-full h-12 px-4 rounded-xl bg-surface-secondary border border-border focus:border-brand-primary focus:ring-1 focus:ring-brand-primary outline-none transition-colors text-sm" value={formData.gender} onChange={handleChange} disabled={isLoading}>
                          <option value="male">Male</option>
                          <option value="female">Female</option>
                          <option value="other">Other</option>
                        </select>
                      </div>
                    </div>
                    {renderInput('password', 'Password', 'password', <Lock className="w-5 h-5"/>, '••••••••')}
                    
                    <Button type="submit" className="w-full text-base h-12 rounded-xl mt-6 shadow-xl shadow-brand-primary/20" isLoading={isLoading && formData.role === 'patient'} disabled={isLoading}>
                      {formData.role === 'doctor' ? <span className="flex items-center gap-2">Continue <ChevronRight className="w-5 h-5"/></span> : 'Create Patient Account'}
                    </Button>
                  </motion.div>
                )}

                {step === 2 && formData.role === 'doctor' && (
                  <motion.div key="step2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} transition={{ duration: 0.3 }} className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <label className="text-sm font-bold text-heading ml-1">Specialization</label>
                        <select name="specialization" required className={`w-full h-12 px-4 rounded-xl bg-surface-secondary border transition-all text-sm outline-none ${errors.specialization ? 'border-red-500 focus:ring-red-500' : 'border-border focus:border-brand-primary focus:ring-1 focus:ring-brand-primary'}`} value={formData.specialization} onChange={handleChange} onBlur={() => setTouched(prev => ({ ...prev, specialization: true }))} disabled={isLoading}>
                          <option value="">Select...</option>
                          {specializations.map(spec => <option key={spec._id} value={spec._id}>{spec.name}</option>)}
                        </select>
                        {errors.specialization && <p className="text-red-500 text-xs ml-1 mt-1">{errors.specialization}</p>}
                      </div>
                      {renderInput('experience', 'Experience (Yrs)', 'number', <Briefcase className="w-5 h-5"/>, 'e.g. 5', { min: "0" })}
                    </div>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {renderInput('fees', 'Fee ($)', 'number', <DollarSign className="w-5 h-5"/>, '150', { min: "0" })}
                      {renderInput('city', 'City', 'text', <MapPin className="w-5 h-5"/>, 'New York')}
                    </div>
                    
                    {renderInput('clinicName', 'Clinic/Hospital', 'text', <Building className="w-5 h-5"/>, 'HealthBridge General')}

                    <div className="space-y-1">
                      <label className="text-sm font-bold text-heading ml-1">Professional Bio</label>
                      <textarea name="bio" required rows={3} className={`w-full rounded-xl bg-surface-secondary border transition-all p-3 text-sm resize-none outline-none ${errors.bio ? 'border-red-500 focus:ring-red-500' : 'border-border focus:border-brand-primary focus:ring-brand-primary'}`} value={formData.bio} onChange={handleChange} onBlur={() => setTouched(prev => ({ ...prev, bio: true }))} placeholder="Briefly describe your expertise..." disabled={isLoading} />
                      {errors.bio && <p className="text-red-500 text-xs ml-1 mt-1">{errors.bio}</p>}
                    </div>

                    <div className="flex gap-3 pt-4">
                      <Button type="button" variant="outline" className="w-14 h-12 rounded-xl flex-shrink-0 flex items-center justify-center p-0" onClick={prevStep} disabled={isLoading}>
                        <ChevronLeft className="w-6 h-6" />
                      </Button>
                      <Button type="button" className="flex-1 text-base h-12 rounded-xl shadow-xl shadow-brand-primary/20" isLoading={isLoading} onClick={handleSubmit} disabled={isLoading}>
                        Submit Application
                      </Button>
                    </div>
                    <p className="text-[11px] text-center text-muted mt-2 font-medium">By submitting, you agree to undergo our admin verification process.</p>
                  </motion.div>
                )}
              </AnimatePresence>
            </form>
          </motion.div>
        </div>
      </div>
    </PageTransition>
  );
};

export default Register;

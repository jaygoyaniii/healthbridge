import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion, useScroll, useTransform, AnimatePresence } from 'framer-motion';
import {
  Activity, Shield, Clock, ArrowRight, Star, Calendar,
  Video, ChevronDown, CheckCircle2, HeartPulse, Stethoscope,
  Search, ShieldCheck, MapPin, Languages, CheckCircle
} from 'lucide-react';
import PageTransition from '../../components/common/PageTransition';
import Button from '../../components/ui/Button';
import adminService from '../../services/adminService';
import doctorService from '../../services/doctorService';

/* ─── ANIMATION VARIANTS ─── */
const fadeUp = {
  hidden: { opacity: 0, y: 40 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.8, ease: [0.16, 1, 0.3, 1] } }
};

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.15 } }
};

const scaleIn = {
  hidden: { opacity: 0, scale: 0.95 },
  visible: { opacity: 1, scale: 1, transition: { duration: 0.8, ease: [0.16, 1, 0.3, 1] } }
};

/* ─── ANIMATED COUNTER ─── */
const AnimatedCounter = ({ value, duration = 2.5 }) => {
  const [count, setCount] = useState(0);

  useEffect(() => {
    let startTime;
    let animationFrame;

    const updateCount = (timestamp) => {
      if (!startTime) startTime = timestamp;
      const progress = timestamp - startTime;
      const percentage = Math.min(progress / (duration * 1000), 1);
      const easeOutQuart = 1 - Math.pow(1 - percentage, 4);
      setCount(Math.floor(easeOutQuart * value));
      if (percentage < 1) {
        animationFrame = requestAnimationFrame(updateCount);
      }
    };

    animationFrame = requestAnimationFrame(updateCount);
    return () => cancelAnimationFrame(animationFrame);
  }, [value, duration]);

  return <span>{count.toLocaleString()}</span>;
};

/* ─── MAIN COMPONENT ─── */
const Home = () => {
  const { scrollYProgress } = useScroll();
  const opacity = useTransform(scrollYProgress, [0, 0.2], [1, 0]);
  const scale = useTransform(scrollYProgress, [0, 0.2], [1, 0.95]);

  const [stats, setStats] = useState({
    totalPatients: 0,
    totalDoctors: 0,
    totalAppointments: 0,
    totalConsultations: 0,
    activeDoctors: 0
  });
  const [specializations, setSpecializations] = useState([]);
  const [featuredDoctors, setFeaturedDoctors] = useState([]);
  const [testimonials, setTestimonials] = useState([]); // Backend-ready
  const [loading, setLoading] = useState(true);
  const [openFaq, setOpenFaq] = useState(0);

  useEffect(() => {
    const fetchHomeData = async () => {
      try {
        const [statsRes, specRes, docsRes] = await Promise.all([
          adminService.getPublicStats().catch(() => ({ data: { stats: null } })),
          adminService.getSpecializations().catch(() => ({ data: { specializations: [] } })),
          doctorService.getDoctors({ limit: 4, sort: 'rating' }).catch(() => ({ data: { doctors: [] } }))
        ]);

        // STRICTLY USE RAW BACKEND DATA - NO MOCK/PADDING
        if (statsRes.data?.stats) {
          setStats({
            totalPatients: statsRes.data.stats.totalPatients || 0,
            totalDoctors: statsRes.data.stats.totalDoctors || 0,
            totalAppointments: statsRes.data.stats.totalAppointments || 0,
            totalConsultations: statsRes.data.stats.totalConsultations || 0,
            activeDoctors: statsRes.data.stats.totalDoctors || 0, // Using total approved as active
          });
        }

        setSpecializations(specRes.data?.specializations?.slice(0, 8) || []);
        setFeaturedDoctors(docsRes.data?.doctors || []);

        // Architecture ready for testimonials API integration
        setTestimonials([]);
      } catch (error) {
        console.error("Failed to load home data", error);
      } finally {
        setLoading(false);
      }
    };

    fetchHomeData();
  }, []);

  const features = [
    {
      icon: <Search className="w-6 h-6" />,
      title: "Intelligent Discovery",
      description: "Find verified specialists tailored to your specific needs using our advanced matching algorithm."
    },
    {
      icon: <Calendar className="w-6 h-6" />,
      title: "Real-Time Scheduling",
      description: "Book appointments instantly with live availability syncing and automated conflict resolution."
    },
    {
      icon: <ShieldCheck className="w-6 h-6" />,
      title: "Bank-Grade Security",
      description: "Your medical records are secured with end-to-end encryption and strict role-based access."
    },
    {
      icon: <Video className="w-6 h-6" />,
      title: "Virtual Care",
      description: "Access world-class healthcare from anywhere with secure HD video consultations and chat."
    }
  ];

  const steps = [
    {
      number: "01",
      title: "Create Your Profile",
      description: "Sign up securely in minutes and complete your initial health assessment."
    },
    {
      number: "02",
      title: "Select a Specialist",
      description: "Review detailed profiles, credentials, verified reviews, and real-time availability."
    },
    {
      number: "03",
      title: "Schedule Instantly",
      description: "Choose an open slot that fits your schedule and confirm with a single click."
    },
    {
      number: "04",
      title: "Receive Premium Care",
      description: "Consult with your doctor, receive digital prescriptions, and track your progress."
    }
  ];

  const faqs = [
    {
      q: "How does the verification process for doctors work?",
      a: "Every practitioner on HealthBridge undergoes a rigorous multi-stage credential verification process managed by our administrative team, ensuring only licensed professionals provide care."
    },
    {
      q: "Is my personal health information safe?",
      a: "Yes. HealthBridge employs enterprise-grade encryption for data at rest and in transit. Your records are strictly confidential and shared only with practitioners you explicitly authorize."
    },
    {
      q: "Can I use HealthBridge for emergency situations?",
      a: "HealthBridge is designed for planned consultations and non-emergency medical advice. In the event of a medical emergency, please contact your local emergency services immediately."
    },
    {
      q: "How are digital prescriptions handled?",
      a: "Following a consultation, your doctor generates a digitally signed, PDF-formatted prescription which is permanently stored in your vault and can be presented to any verified pharmacy."
    }
  ];

  return (
    <PageTransition className="min-h-screen bg-surface-primary selection:bg-brand-primary/20">

      {/* ─── NAVIGATION ─── */}
      <nav className="fixed top-0 w-full bg-white/70 backdrop-blur-2xl border-b border-white/20 z-50 transition-all duration-500 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-24 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-brand-primary to-brand-primary-hover text-white flex items-center justify-center shadow-lg shadow-brand-primary/20">
              <Activity className="w-6 h-6" />
            </div>
            <span className="font-display font-bold text-2xl text-heading tracking-tight">HealthBridge</span>
          </div>
          <div className="hidden lg:flex items-center gap-10">
            <a href="#features" className="text-[15px] font-medium text-body hover:text-brand-primary transition-colors">Platform</a>
            <a href="#doctors" className="text-[15px] font-medium text-body hover:text-brand-primary transition-colors">Specialists</a>
            <a href="#how-it-works" className="text-[15px] font-medium text-body hover:text-brand-primary transition-colors">Workflow</a>
            <Link to="/contact" className="text-[15px] font-medium text-body hover:text-brand-primary transition-colors">Contact</Link>
          </div>
          <div className="flex items-center gap-4">
            <Link to="/login" className="hidden sm:block">
              <Button variant="ghost" className="text-[15px] font-semibold hover:bg-surface-secondary">Sign In</Button>
            </Link>
            <Link to="/register">
              <Button className="shadow-xl shadow-brand-primary/20 px-8 h-12 rounded-full font-semibold text-[15px]">
                Get Started
              </Button>
            </Link>
          </div>
        </div>
      </nav>

      <main className="pt-24">

        {/* ─── HERO SECTION (ULTRA PREMIUM) ─── */}
        <section className="relative min-h-[90vh] flex items-center justify-center overflow-hidden bg-surface-primary">
          {/* Luxury Background Gradients */}
          <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0">
            <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-brand-primary/5 blur-[120px]" />
            <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-brand-secondary/5 blur-[120px]" />
            <div className="absolute top-[20%] right-[10%] w-[30%] h-[30%] rounded-full bg-blue-100/40 blur-[100px]" />
          </div>

          <motion.div
            style={{ opacity, scale }}
            className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 w-full"
          >
            <div className="text-center max-w-4xl mx-auto">
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.8 }}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-white border border-border shadow-sm mb-8"
              >
                <div className="flex items-center justify-center w-5 h-5 rounded-full bg-green-100">
                  <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
                </div>
                <span className="text-sm font-semibold text-heading">
                  {stats.activeDoctors > 0 ? `${stats.activeDoctors} Specialists Online Now` : 'Premium Healthcare Ecosystem'}
                </span>
              </motion.div>

              <motion.h1
                initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, delay: 0.1 }}
                className="text-6xl lg:text-[80px] font-display font-bold text-heading leading-[1.05] tracking-tight mb-8"
              >
                Experience the Future of <br className="hidden md:block" />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-primary via-blue-600 to-brand-secondary">
                  Digital Healthcare.
                </span>
              </motion.h1>

              <motion.p
                initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, delay: 0.2 }}
                className="text-xl text-body mb-10 leading-relaxed max-w-2xl mx-auto"
              >
                HealthBridge provides enterprise-grade infrastructure connecting discerning patients with world-class medical professionals. Secure, instantaneous, and elegant.
              </motion.p>

              <motion.div
                initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, delay: 0.3 }}
                className="flex flex-col sm:flex-row items-center justify-center gap-5"
              >
                <Link to="/register" className="w-full sm:w-auto">
                  <Button size="lg" className="w-full sm:w-auto text-[16px] px-10 h-16 rounded-full shadow-2xl shadow-brand-primary/25 group">
                    Find a Specialist <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
                  </Button>
                </Link>
                <Link to="/register?role=doctor" className="w-full sm:w-auto">
                  <Button variant="outline" size="lg" className="w-full sm:w-auto text-[16px] px-10 h-16 rounded-full bg-white/50 backdrop-blur-sm border-border hover:bg-white hover:border-brand-primary transition-all">
                    Partner as a Doctor
                  </Button>
                </Link>
              </motion.div>
            </div>
          </motion.div>
        </section>

        {/* ─── DYNAMIC STATISTICS (LIVE DATA) ─── */}
        <section className="relative z-20 -mt-10 mb-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, delay: 0.5 }}
            className="bg-white/80 backdrop-blur-xl rounded-[2rem] p-10 shadow-2xl shadow-brand-primary/5 border border-white"
          >
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8 divide-x divide-border/50">
              <div className="text-center px-4">
                <p className="text-4xl lg:text-5xl font-display font-bold text-heading mb-2">
                  <AnimatedCounter value={stats.totalPatients} />
                </p>
                <p className="text-sm font-semibold text-muted uppercase tracking-wider">Registered Patients</p>
              </div>
              <div className="text-center px-4">
                <p className="text-4xl lg:text-5xl font-display font-bold text-heading mb-2">
                  <AnimatedCounter value={stats.totalDoctors} />
                </p>
                <p className="text-sm font-semibold text-muted uppercase tracking-wider">Verified Doctors</p>
              </div>
              <div className="text-center px-4">
                <p className="text-4xl lg:text-5xl font-display font-bold text-heading mb-2">
                  <AnimatedCounter value={stats.totalAppointments} />
                </p>
                <p className="text-sm font-semibold text-muted uppercase tracking-wider">Appointments Scheduled</p>
              </div>
              <div className="text-center px-4">
                <p className="text-4xl lg:text-5xl font-display font-bold text-heading mb-2">
                  <AnimatedCounter value={stats.totalConsultations} />
                </p>
                <p className="text-sm font-semibold text-muted uppercase tracking-wider">Consultations Completed</p>
              </div>
            </div>
          </motion.div>
        </section>

        {/* ─── TRUSTED PLATFORM FEATURES ─── */}
        <section id="features" className="py-24 bg-surface-primary">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <motion.div
              initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-100px" }} variants={fadeUp}
              className="text-center max-w-3xl mx-auto mb-20"
            >
              <h2 className="text-sm font-bold tracking-widest text-brand-primary uppercase mb-4">Enterprise Infrastructure</h2>
              <h3 className="text-4xl md:text-5xl font-display font-bold text-heading leading-tight mb-6">Uncompromising Quality & Security</h3>
              <p className="text-lg text-body">Engineered for reliability, our platform ensures seamless communication and data integrity at every touchpoint.</p>
            </motion.div>

            <motion.div
              initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-100px" }} variants={staggerContainer}
              className="grid md:grid-cols-2 lg:grid-cols-4 gap-8"
            >
              {features.map((feature, idx) => (
                <motion.div key={idx} variants={scaleIn} className="bg-white p-8 rounded-[2rem] shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-border/50 hover:shadow-[0_20px_40px_rgb(26,60,139,0.08)] hover:-translate-y-2 transition-all duration-500 group">
                  <div className="w-14 h-14 rounded-2xl bg-surface-secondary text-brand-primary flex items-center justify-center mb-8 group-hover:bg-brand-primary group-hover:text-white transition-colors duration-500">
                    {feature.icon}
                  </div>
                  <h4 className="text-xl font-bold text-heading mb-4">{feature.title}</h4>
                  <p className="text-body leading-relaxed">{feature.description}</p>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </section>

        {/* ─── DYNAMIC FEATURED DOCTORS ─── */}
        <section id="doctors" className="py-32 bg-surface-secondary relative border-y border-border/50">
          <div className="absolute top-0 right-0 w-1/3 h-full bg-brand-primary/5 blur-3xl rounded-full -z-10" />

          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
            <motion.div
              initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp}
              className="flex flex-col md:flex-row md:items-end justify-between mb-16 gap-6"
            >
              <div className="max-w-2xl">
                <h2 className="text-sm font-bold tracking-widest text-brand-primary uppercase mb-4">Elite Practitioners</h2>
                <h3 className="text-4xl md:text-5xl font-display font-bold text-heading mb-4">Featured Specialists</h3>
                <p className="text-lg text-body">Discover top-rated medical professionals who have consistently delivered exceptional care on our platform.</p>
              </div>
              <Link to="/register">
                <Button variant="outline" className="rounded-full bg-white shadow-sm h-12 px-8">Browse Directory</Button>
              </Link>
            </motion.div>

            {loading ? (
              <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
                {[1,2,3,4].map(i => (
                  <div key={i} className="bg-white rounded-[2rem] h-[480px] animate-skeleton-pulse shadow-sm"></div>
                ))}
              </div>
            ) : (
              <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
                {featuredDoctors.map((doc) => (
                  <motion.div
                    key={doc._id}
                    initial="hidden" whileInView="visible" viewport={{ once: true }} variants={scaleIn}
                    className="bg-white rounded-[2rem] p-6 border border-border/50 shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-2xl hover:shadow-brand-primary/10 transition-all duration-500 group flex flex-col"
                  >
                    <div className="relative mb-6 flex-shrink-0">
                      <div className="w-32 h-32 rounded-full mx-auto overflow-hidden border-[6px] border-surface-secondary shadow-md group-hover:scale-105 transition-transform duration-500">
                        <img
                          src={doc.userId?.avatar?.url || `https://ui-avatars.com/api/?name=${doc.userId?.name}&background=F6F9FF&color=1A3C8B`}
                          alt={doc.userId?.name}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 bg-white px-3 py-1.5 rounded-full shadow-md border border-border flex items-center gap-1.5">
                        <Star className="w-3.5 h-3.5 fill-brand-gold text-brand-gold" />
                        <span className="text-xs font-bold text-heading">{doc.rating?.toFixed(1) || 'New'}</span>
                      </div>
                    </div>

                    <div className="text-center mb-6 flex-grow">
                      <div className="flex items-center justify-center gap-1 mb-1">
                        <h3 className="text-xl font-bold text-heading truncate">{doc.userId?.name}</h3>
                        <CheckCircle className="w-4 h-4 text-blue-500" />
                      </div>
                      <p className="text-sm font-semibold text-brand-primary mb-3">{doc.specialization?.name}</p>

                      <div className="flex items-center justify-center gap-3 text-xs text-muted">
                        <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" /> {doc.experience} Yrs</span>
                        <span>•</span>
                        <span className="flex items-center gap-1"><MapPin className="w-3.5 h-3.5" /> {doc.city}</span>
                      </div>
                    </div>

                    <div className="pt-4 border-t border-border mt-auto">
                      <div className="flex justify-between items-center mb-4 px-2">
                        <span className="text-sm text-muted">Consultation Fee</span>
                        <span className="font-bold text-heading">₹{doc.fees}</span>
                      </div>
                      <Link to={`/register`}>
                        <Button className="w-full rounded-xl h-12 shadow-md hover:shadow-lg transition-shadow">Book Appointment</Button>
                      </Link>
                    </div>
                  </motion.div>
                ))}

                {featuredDoctors.length === 0 && !loading && (
                  <div className="col-span-full flex flex-col items-center justify-center py-20 bg-white rounded-[2rem] border border-dashed border-border">
                    <Stethoscope className="w-16 h-16 text-muted mb-4 opacity-50" />
                    <h3 className="text-xl font-bold text-heading mb-2">Platform Launching Soon</h3>
                    <p className="text-muted">Specialists are currently being verified and will appear here shortly.</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </section>

        {/* ─── HOW IT WORKS WORKFLOW ─── */}
        <section id="how-it-works" className="py-32 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid lg:grid-cols-2 gap-20 items-center">
              <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp}>
                <h2 className="text-sm font-bold tracking-widest text-brand-primary uppercase mb-4">Patient Journey</h2>
                <h3 className="text-4xl md:text-5xl font-display font-bold text-heading mb-6 leading-tight">A Seamless Path to Better Health</h3>
                <p className="text-lg text-body mb-12">Our carefully designed workflow eliminates administrative friction, allowing you to focus entirely on your health and recovery.</p>

                <div className="space-y-10 relative">
                  <div className="absolute left-6 top-8 bottom-8 w-px bg-gradient-to-b from-brand-primary/50 via-brand-primary/20 to-transparent -z-10 hidden md:block"></div>
                  {steps.map((step, idx) => (
                    <motion.div key={idx} variants={scaleIn} className="flex gap-6 relative group">
                      <div className="w-12 h-12 shrink-0 rounded-full bg-white shadow-md border border-border flex items-center justify-center font-display font-bold text-brand-primary group-hover:bg-brand-primary group-hover:text-white transition-all duration-300 z-10">
                        {step.number}
                      </div>
                      <div className="pt-2">
                        <h4 className="text-xl font-bold text-heading mb-2">{step.title}</h4>
                        <p className="text-body leading-relaxed">{step.description}</p>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, x: 40 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ duration: 0.8 }}
                className="relative hidden lg:block"
              >
                <div className="absolute inset-0 bg-brand-primary/5 rounded-[3rem] transform rotate-3"></div>
                <div className="relative rounded-[3rem] overflow-hidden shadow-[0_20px_50px_rgb(26,60,139,0.15)] border-[8px] border-white bg-white">
                  <img
                    src="https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?auto=format&fit=crop&q=80&w=1000"
                    alt="Premium Healthcare Workflow"
                    className="w-full h-[700px] object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-heading/80 via-transparent to-transparent"></div>
                  <div className="absolute bottom-10 left-10 right-10 text-white">
                    <div className="flex items-center gap-2 mb-3">
                      <Shield className="w-5 h-5 text-brand-secondary" />
                      <span className="font-semibold tracking-wide text-sm">HIPAA COMPLIANT</span>
                    </div>
                    <p className="text-2xl font-display font-bold">Secure, Private, and Professional.</p>
                  </div>
                </div>
              </motion.div>
            </div>
          </div>
        </section>

        {/* ─── DYNAMIC SPECIALIZATIONS ─── */}
        <section className="py-24 bg-surface-primary border-t border-border/50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} className="text-center mb-16">
              <h2 className="text-sm font-bold tracking-widest text-brand-primary uppercase mb-4">Comprehensive Care</h2>
              <h3 className="text-4xl md:text-5xl font-display font-bold text-heading">Browse by Specialty</h3>
            </motion.div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              {specializations.map((spec) => (
                <Link to="/register" key={spec._id}>
                  <motion.div
                    whileHover={{ y: -5 }}
                    className="bg-white p-8 rounded-[2rem] text-center shadow-sm border border-border hover:shadow-xl hover:border-brand-primary/30 transition-all group"
                  >
                    <div className="w-16 h-16 mx-auto bg-surface-secondary rounded-2xl flex items-center justify-center mb-6 group-hover:bg-brand-primary transition-colors">
                      <HeartPulse className="w-8 h-8 text-brand-primary group-hover:text-white transition-colors" />
                    </div>
                    <h4 className="font-bold text-lg text-heading mb-2">{spec.name}</h4>
                    <p className="text-sm text-brand-secondary font-medium">{spec.doctorCount || 0} Specialists</p>
                  </motion.div>
                </Link>
              ))}

              {specializations.length === 0 && !loading && (
                <div className="col-span-full text-center text-muted py-10">No specializations available yet.</div>
              )}
            </div>
          </div>
        </section>

        {/* ─── DYNAMIC TESTIMONIALS (BACKEND-READY) ─── */}
        <section className="py-24 bg-surface-secondary border-t border-border/50">
           <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
             <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} className="text-center mb-16">
               <h2 className="text-sm font-bold tracking-widest text-brand-primary uppercase mb-4">Patient Outcomes</h2>
               <h3 className="text-4xl md:text-5xl font-display font-bold text-heading">Real Reviews</h3>
             </motion.div>

             <div className="flex justify-center items-center py-10">
               {testimonials.length > 0 ? (
                 <div className="grid md:grid-cols-3 gap-8">
                   {/* Map real testimonials here when backend endpoint is ready */}
                 </div>
               ) : (
                 <div className="bg-white rounded-[2rem] p-10 shadow-sm border border-border text-center max-w-2xl w-full">
                   <Star className="w-12 h-12 text-muted/30 mx-auto mb-4" />
                   <h4 className="text-xl font-bold text-heading mb-2">Reviews Aggregation in Progress</h4>
                   <p className="text-muted">Check back soon to see verified experiences from our patient community.</p>
                 </div>
               )}
             </div>
           </div>
        </section>

        {/* ─── FAQ SECTION ─── */}
        <section className="py-32 bg-white">
          <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
            <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-display font-bold text-heading mb-4">Frequently Asked Questions</h2>
            </motion.div>

            <div className="space-y-6">
              {faqs.map((faq, idx) => (
                <motion.div
                  initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp}
                  key={idx}
                  className={`bg-white rounded-[1.5rem] border ${openFaq === idx ? 'border-brand-primary shadow-md' : 'border-border shadow-sm'} overflow-hidden transition-all duration-300`}
                >
                  <button
                    className="w-full px-8 py-6 text-left flex justify-between items-center focus:outline-none"
                    onClick={() => setOpenFaq(openFaq === idx ? -1 : idx)}
                  >
                    <span className="font-bold text-lg text-heading pr-8">{faq.q}</span>
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors ${openFaq === idx ? 'bg-brand-primary text-white' : 'bg-surface-secondary text-muted'}`}>
                      <ChevronDown className={`w-5 h-5 transition-transform duration-300 ${openFaq === idx ? 'rotate-180' : ''}`} />
                    </div>
                  </button>
                  <AnimatePresence>
                    {openFaq === idx && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.3 }}
                      >
                        <div className="px-8 pb-8 text-body text-lg leading-relaxed pt-2">
                          {faq.a}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* ─── LUXURY CTA SECTION ─── */}
        <section className="py-24 bg-white px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
          <div className="bg-heading rounded-[3rem] p-12 md:p-20 text-center relative overflow-hidden shadow-2xl">
            <div className="absolute inset-0 bg-gradient-to-br from-brand-primary/40 to-transparent z-0"></div>
            <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full blur-3xl z-0"></div>
            <div className="absolute bottom-0 left-0 w-64 h-64 bg-brand-secondary/20 rounded-full blur-3xl z-0"></div>

            <div className="relative z-10 max-w-3xl mx-auto">
              <h2 className="text-4xl md:text-6xl font-display font-bold text-white mb-8 leading-tight">Begin Your Healthcare Journey Today.</h2>
              <p className="text-xl text-white/80 mb-12 font-medium">Join the premium network of patients and practitioners redefining medical accessibility.</p>
              <div className="flex flex-col sm:flex-row justify-center gap-6">
                <Link to="/register">
                  <Button size="lg" className="w-full sm:w-auto px-10 h-16 rounded-full text-lg shadow-2xl bg-brand-primary hover:bg-brand-primary-hover border-none font-bold">
                    Start Now
                  </Button>
                </Link>
                <Link to="/contact">
                  <Button variant="outline" size="lg" className="w-full sm:w-auto px-10 h-16 rounded-full text-lg text-white border-white/30 hover:bg-white/10 backdrop-blur-md">
                    Contact Us
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* ─── FOOTER ─── */}
      <footer className="bg-white border-t border-border pt-24 pb-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-16 mb-20">
            <div className="lg:col-span-1">
              <div className="flex items-center gap-3 mb-8">
                <div className="w-10 h-10 rounded-xl bg-brand-primary text-white flex items-center justify-center">
                  <Activity className="w-6 h-6" />
                </div>
                <span className="font-display font-bold text-2xl text-heading">HealthBridge</span>
              </div>
              <p className="text-body text-[15px] leading-relaxed mb-8">
                An enterprise-grade healthcare management system connecting patients with top-tier medical professionals through advanced, secure digital infrastructure.
              </p>
            </div>

            <div>
              <h4 className="font-bold text-lg text-heading mb-6">Platform</h4>
              <ul className="space-y-4">
                <li><Link to="/" className="text-body text-[15px] hover:text-brand-primary font-medium transition-colors">Home</Link></li>
                <li><Link to="/about" className="text-body text-[15px] hover:text-brand-primary font-medium transition-colors">About the Company</Link></li>
                <li><Link to="/contact" className="text-body text-[15px] hover:text-brand-primary font-medium transition-colors">Contact Us</Link></li>
                <li><Link to="/register?role=doctor" className="text-body text-[15px] hover:text-brand-primary font-medium transition-colors">Join Practitioner Network</Link></li>
              </ul>
            </div>

            <div>
              <h4 className="font-bold text-lg text-heading mb-6">Capabilities</h4>
              <ul className="space-y-4">
                <li><Link to="/register" className="text-body text-[15px] hover:text-brand-primary font-medium transition-colors">Specialist Directory</Link></li>
                <li><Link to="/register" className="text-body text-[15px] hover:text-brand-primary font-medium transition-colors">Real-Time Scheduling</Link></li>
                <li><Link to="/register" className="text-body text-[15px] hover:text-brand-primary font-medium transition-colors">Secure Patient Vault</Link></li>
                <li><Link to="/register" className="text-body text-[15px] hover:text-brand-primary font-medium transition-colors">Telehealth Services</Link></li>
              </ul>
            </div>

            <div>
              <h4 className="font-bold text-lg text-heading mb-6">Support & Legal</h4>
              <ul className="space-y-4">
                <li><Link to="/contact" className="text-body text-[15px] hover:text-brand-primary font-medium transition-colors">Help Center</Link></li>
                <li><span className="text-body text-[15px] font-medium cursor-not-allowed">Privacy Policy</span></li>
                <li><span className="text-body text-[15px] font-medium cursor-not-allowed">Terms of Service</span></li>
                <li><span className="text-body text-[15px] font-medium cursor-not-allowed">HIPAA Compliance</span></li>
              </ul>
            </div>
          </div>

          <div className="border-t border-border pt-8 flex flex-col md:flex-row items-center justify-between gap-6">
            <p className="text-[15px] font-medium text-muted">
              &copy; {new Date().getFullYear()} HealthBridge. Developed by <a href="https://www.linkedin.com/in/jay-goyani-10166a251/" target="_blank" rel="noreferrer" className="text-brand-primary hover:underline">Jay Goyani</a>.
            </p>
            <div className="flex items-center gap-3">
              <span className="flex items-center gap-2 text-sm font-bold text-green-600 bg-green-50 px-4 py-2 rounded-full border border-green-100">
                <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
                System Operational
              </span>
            </div>
          </div>
        </div>
      </footer>
    </PageTransition>
  );
};

export default Home;

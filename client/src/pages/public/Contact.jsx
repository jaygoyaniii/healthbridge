import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { motion } from 'framer-motion';
import { toast } from 'react-hot-toast';
import {
  Mail, Phone, User, Send, Building2, Code,
  Database, Layout, Server, Shield, Smartphone,
  Github, Linkedin, ExternalLink, MapPin, Activity, ArrowLeft
} from 'lucide-react';
import PageTransition from '../../components/common/PageTransition';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import api from '../../services/api';

const contactSchema = z.object({
  fullName: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  phone: z.string().min(10, 'Valid phone number required'),
  subject: z.string().min(5, 'Subject is required'),
  message: z.string().min(10, 'Message must be at least 10 characters'),
});

const fadeIn = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6 } }
};

const Contact = () => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors }
  } = useForm({
    resolver: zodResolver(contactSchema)
  });

  const onSubmit = async (data) => {
    setIsSubmitting(true);
    try {
      await api.post('/public/contact', data);
      setIsSuccess(true);
      toast.success('Message sent successfully!');
      reset();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to send message. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const techStack = [
    { name: 'React 18', icon: <Layout className="w-5 h-5" /> },
    { name: 'Node.js', icon: <Server className="w-5 h-5" /> },
    { name: 'Express', icon: <Server className="w-5 h-5" /> },
    { name: 'MongoDB', icon: <Database className="w-5 h-5" /> },
    { name: 'Redis', icon: <Database className="w-5 h-5" /> },
    { name: 'Socket.IO', icon: <Smartphone className="w-5 h-5" /> },
    { name: 'Tailwind CSS', icon: <Layout className="w-5 h-5" /> },
    { name: 'Zustand', icon: <Code className="w-5 h-5" /> },
  ];

  return (
    <PageTransition className="min-h-screen bg-surface-secondary pt-24 pb-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
        
        {/* Back Button */}
        <div className="absolute top-0 left-4 sm:left-6 lg:left-8">
          <Link to="/" className="inline-flex items-center gap-2 px-4 py-2 bg-white rounded-full border border-border shadow-sm text-body hover:text-brand-primary hover:border-brand-primary/30 transition-all font-medium">
            <ArrowLeft className="w-4 h-4" />
            <span className="hidden sm:inline">Back to Home</span>
          </Link>
        </div>

        {/* Hero Section */}
        <motion.div
          initial="hidden" animate="visible" variants={fadeIn}
          className="text-center max-w-3xl mx-auto mb-20"
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-brand-primary/10 text-brand-primary font-semibold text-sm mb-6">
            <Shield className="w-4 h-4" /> Get in Touch
          </div>
          <h1 className="text-4xl md:text-5xl font-display font-bold text-heading mb-6 leading-tight">
            Let's Build Something <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-primary to-brand-secondary">Extraordinary</span>
          </h1>
          <p className="text-lg text-body">
            Have a question about HealthBridge or interested in collaborating? Reach out directly.
          </p>
        </motion.div>

        <div className="grid lg:grid-cols-5 gap-12 items-start mb-24">

          {/* Contact Info & Developer Profile (Left Col - 2/5) */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="lg:col-span-2 space-y-8"
          >
            {/* Developer Card */}
            <div className="bg-white rounded-[2rem] p-8 shadow-xl shadow-brand-primary/5 border border-border relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-32 h-32 bg-brand-primary/5 rounded-bl-full -z-10 group-hover:scale-110 transition-transform duration-500"></div>

              <div className="flex items-center gap-6 mb-8">
                <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-brand-primary to-brand-secondary p-1">
                  <div className="w-full h-full bg-white rounded-xl overflow-hidden">
                    <img
                      src={`https://ui-avatars.com/api/?name=Jay+Goyani&background=F6F9FF&color=1A3C8B&size=150`}
                      alt="Jay Goyani"
                      className="w-full h-full object-cover"
                    />
                  </div>
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-heading">Jay Goyani</h3>
                  <p className="text-brand-primary font-medium">Full Stack Developer</p>
                </div>
              </div>

              <div className="space-y-6">
                <a href="mailto:jaygoyani939@gmail.com" className="flex items-center gap-4 text-body hover:text-brand-primary transition-colors group/link">
                  <div className="w-10 h-10 rounded-full bg-surface-secondary flex items-center justify-center group-hover/link:bg-brand-primary/10 transition-colors">
                    <Mail className="w-5 h-5" />
                  </div>
                  <span className="font-medium">jaygoyani939@gmail.com</span>
                </a>

                <a href="tel:+918238938615" className="flex items-center gap-4 text-body hover:text-brand-primary transition-colors group/link">
                  <div className="w-10 h-10 rounded-full bg-surface-secondary flex items-center justify-center group-hover/link:bg-brand-primary/10 transition-colors">
                    <Phone className="w-5 h-5" />
                  </div>
                  <span className="font-medium">+91 82389 38615</span>
                </a>

                <div className="flex items-center gap-4 text-body">
                  <div className="w-10 h-10 rounded-full bg-surface-secondary flex items-center justify-center">
                    <Building2 className="w-5 h-5" />
                  </div>
                  <span className="font-medium">Creator of HealthBridge</span>
                </div>
              </div>

              <div className="mt-10 pt-8 border-t border-border flex gap-4">
                <a href="https://github.com/jaygoyaniii" target="_blank" rel="noopener noreferrer" className="flex-1">
                  <Button variant="outline" className="w-full gap-2">
                    <Github className="w-4 h-4" /> GitHub
                  </Button>
                </a>
                <a href="https://www.linkedin.com/in/jay-goyani-10166a251/" target="_blank" rel="noopener noreferrer" className="flex-1">
                  <Button variant="outline" className="w-full gap-2 text-[#0A66C2] border-[#0A66C2] hover:bg-[#0A66C2] hover:text-white">
                    <Linkedin className="w-4 h-4" /> LinkedIn
                  </Button>
                </a>
              </div>
            </div>

            {/* Project Info Card */}
            <div className="bg-brand-primary text-white rounded-[2rem] p-8 shadow-xl relative overflow-hidden">
              <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full blur-3xl -z-10"></div>
              <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
                <Activity className="w-6 h-6 text-brand-secondary" /> About The Project
              </h3>
              <p className="text-white/80 leading-relaxed mb-6">
                HealthBridge is an enterprise-grade healthcare management system built to demonstrate advanced full-stack architectural patterns, real-time communications, and secure role-based access controls.
              </p>
              <div className="flex flex-wrap gap-2">
                {techStack.map((tech, i) => (
                  <div key={i} className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/10 text-sm font-medium border border-white/10">
                    {tech.icon} {tech.name}
                  </div>
                ))}
              </div>
            </div>
          </motion.div>

          {/* Contact Form (Right Col - 3/5) */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="lg:col-span-3 bg-white rounded-[2rem] p-8 md:p-12 shadow-xl shadow-brand-primary/5 border border-border relative"
          >
            {isSuccess && (
              <div className="absolute inset-0 z-20 bg-white/90 backdrop-blur-sm rounded-[2rem] flex flex-col items-center justify-center text-center p-8">
                <div className="w-20 h-20 rounded-full bg-green-100 text-green-600 flex items-center justify-center mb-6">
                  <Send className="w-10 h-10" />
                </div>
                <h3 className="text-3xl font-bold text-heading mb-4">Message Sent!</h3>
                <p className="text-body text-lg max-w-md">
                  Thank you for reaching out. I've received your message and will get back to you as soon as possible.
                </p>
                <Button
                  className="mt-8"
                  onClick={() => setIsSuccess(false)}
                >
                  Send Another Message
                </Button>
              </div>
            )}

            <h2 className="text-2xl font-bold text-heading mb-8">Send a Message</h2>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-bold text-heading mb-2">Full Name</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-muted">
                      <User className="h-5 w-5" />
                    </div>
                    <Input
                      {...register('fullName')}
                      className="pl-11 bg-surface-secondary"
                      placeholder="John Doe"
                    />
                  </div>
                  {errors.fullName && <p className="text-red-500 text-sm mt-1">{errors.fullName.message}</p>}
                </div>

                <div>
                  <label className="block text-sm font-bold text-heading mb-2">Email Address</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-muted">
                      <Mail className="h-5 w-5" />
                    </div>
                    <Input
                      type="email"
                      {...register('email')}
                      className="pl-11 bg-surface-secondary"
                      placeholder="john@example.com"
                    />
                  </div>
                  {errors.email && <p className="text-red-500 text-sm mt-1">{errors.email.message}</p>}
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-bold text-heading mb-2">Phone Number</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-muted">
                      <Phone className="h-5 w-5" />
                    </div>
                    <Input
                      type="tel"
                      {...register('phone')}
                      className="pl-11 bg-surface-secondary"
                      placeholder="+91 00000 00000"
                    />
                  </div>
                  {errors.phone && <p className="text-red-500 text-sm mt-1">{errors.phone.message}</p>}
                </div>

                <div>
                  <label className="block text-sm font-bold text-heading mb-2">Subject</label>
                  <Input
                    {...register('subject')}
                    className="bg-surface-secondary"
                    placeholder="How can I help you?"
                  />
                  {errors.subject && <p className="text-red-500 text-sm mt-1">{errors.subject.message}</p>}
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold text-heading mb-2">Message</label>
                <textarea
                  {...register('message')}
                  rows="6"
                  className="w-full rounded-xl border-border bg-surface-secondary px-4 py-3 text-body focus:border-brand-primary focus:ring-1 focus:ring-brand-primary transition-colors resize-none"
                  placeholder="Write your message here..."
                ></textarea>
                {errors.message && <p className="text-red-500 text-sm mt-1">{errors.message.message}</p>}
              </div>

              <Button
                type="submit"
                size="lg"
                className="w-full text-lg h-14 rounded-xl shadow-xl shadow-brand-primary/20"
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <span className="flex items-center gap-2">
                    <svg className="animate-spin -ml-1 mr-2 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Sending Message...
                  </span>
                ) : (
                  <span className="flex items-center gap-2">
                    Send Message <Send className="w-5 h-5 ml-1" />
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

export default Contact;

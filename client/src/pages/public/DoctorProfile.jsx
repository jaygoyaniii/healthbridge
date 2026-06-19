import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { 
  Star, MapPin, Video, Award, Clock, GraduationCap, 
  MessageSquare, Languages, Briefcase, Calendar as CalendarIcon, 
  ChevronLeft, ShieldCheck, HeartPulse, Share2, CheckCircle
} from 'lucide-react';
import toast from 'react-hot-toast';
import PageTransition from '../../components/common/PageTransition';
import doctorService from '../../services/doctorService';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import Avatar from '../../components/common/Avatar';
import { format } from 'date-fns';

const DoctorProfile = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [doctor, setDoctor] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [reviews, setReviews] = useState([]);

  useEffect(() => {
    fetchDoctorData();
  }, [id]);

  const fetchDoctorData = async () => {
    setLoading(true);
    try {
      const { data } = await doctorService.getDoctorById(id);
      setDoctor(data.doctor);
      
      // Fetch reviews independently
      doctorService.getReviews(id, { limit: 5 }).then(res => {
        setReviews(res.data.reviews || []);
      }).catch(err => console.error('Failed to fetch reviews', err));
      
    } catch (error) {
      toast.error('Doctor profile not found');
      navigate(-1);
    } finally {
      setLoading(false);
    }
  };

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    toast.success('Profile link copied to clipboard');
  };

  if (loading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center">
        <span className="loader w-10 h-10 border-4 border-primary border-b-transparent rounded-full animate-spin"></span>
        <p className="mt-4 text-muted font-medium">Loading profile...</p>
      </div>
    );
  }

  if (!doctor) return null;

  return (
    <PageTransition className="max-w-6xl mx-auto space-y-8 pb-10">
      {/* Back Button */}
      <button 
        onClick={() => navigate(-1)}
        className="flex items-center text-sm font-medium text-muted hover:text-primary transition-colors mb-2"
      >
        <ChevronLeft className="w-4 h-4 mr-1" /> Back
      </button>

      {/* Hero Header Section */}
      <div className="bg-white rounded-3xl p-6 sm:p-10 border border-slate-100 shadow-sm relative overflow-hidden">
        {/* Decorative Background Elements */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-bl-full -z-10 pointer-events-none"></div>
        <div className="absolute bottom-0 left-0 w-40 h-40 bg-blue-50/50 rounded-tr-full -z-10 pointer-events-none"></div>

        <div className="flex flex-col md:flex-row gap-8 items-center md:items-start relative z-10">
          
          {/* Avatar Area */}
          <div className="relative shrink-0">
            <div className="w-32 h-32 md:w-40 md:h-40 rounded-full p-1 bg-gradient-to-tr from-primary to-blue-300 flex items-center justify-center">
              <Avatar 
                src={doctor.userId?.avatar?.url || doctor.userId?.avatar}
                name={doctor.userId?.name}
                role="doctor"
                className="w-full h-full border-4 border-white"
              />
            </div>
            {doctor.isApproved && (
              <div className="absolute bottom-2 right-2 bg-white rounded-full p-1 shadow-md">
                <ShieldCheck className="w-6 h-6 text-emerald-500" />
              </div>
            )}
          </div>

          {/* Title and Info */}
          <div className="flex-1 text-center md:text-left space-y-4">
            <div>
              <div className="flex flex-col md:flex-row md:items-center gap-3 justify-center md:justify-start">
                <h1 className="text-3xl md:text-4xl font-black text-heading">
                  Dr. {doctor.userId?.name}
                </h1>
                {doctor.isAvailable ? (
                  <Badge variant="success" className="w-max mx-auto md:mx-0 bg-emerald-50 text-emerald-700 border-emerald-100">Available Today</Badge>
                ) : (
                  <Badge variant="secondary" className="w-max mx-auto md:mx-0">Currently Unavailable</Badge>
                )}
              </div>
              <p className="text-lg text-primary font-medium mt-2">{doctor.specialization?.name}</p>
            </div>

            <div className="flex flex-wrap items-center justify-center md:justify-start gap-x-6 gap-y-3 text-slate-600 font-medium">
              <div className="flex items-center gap-1.5">
                <Briefcase className="w-5 h-5 text-slate-400" />
                <span>{doctor.experience} Years Experience</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Star className="w-5 h-5 text-yellow-400 fill-yellow-400" />
                <span>{doctor.rating ? doctor.rating.toFixed(1) : 'New'} ({doctor.totalReviews || 0} reviews)</span>
              </div>
              <div className="flex items-center gap-1.5">
                <MapPin className="w-5 h-5 text-slate-400" />
                <span>{doctor.city}</span>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="flex flex-wrap items-center justify-center md:justify-start gap-3 pt-4 border-t border-slate-100 w-full">
              <Link to={`/patient/book-appointment?doctorId=${doctor._id}`}>
                <Button variant="primary" className="shadow-lg shadow-primary/20 group">
                  <CalendarIcon className="w-4 h-4 mr-2 group-hover:animate-bounce-subtle" /> 
                  Book Appointment
                </Button>
              </Link>
              <Button variant="outline" className="border-slate-200 hover:bg-slate-50" onClick={handleShare}>
                <Share2 className="w-4 h-4 mr-2 text-slate-500" /> Share Profile
              </Button>
            </div>
          </div>

          {/* Pricing Box */}
          <div className="shrink-0 w-full md:w-auto bg-slate-50 rounded-2xl p-6 border border-slate-100 text-center md:text-right flex flex-col justify-center shadow-sm">
            <p className="text-sm text-slate-500 font-medium uppercase tracking-wider mb-2">Consultation Fee</p>
            <div className="flex items-end justify-center md:justify-end gap-1 mb-2">
              <span className="text-4xl font-black text-heading">${doctor.fees}</span>
            </div>
            <p className="text-xs text-emerald-600 font-medium flex items-center justify-center md:justify-end mt-1">
              <CheckCircle className="w-3.5 h-3.5 mr-1" /> No hidden charges
            </p>
          </div>
        </div>
      </div>

      {/* Main Content Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Column - Main Details */}
        <div className="lg:col-span-2 space-y-6">
          {/* Tabs */}
          <div className="flex items-center gap-1 p-1 bg-slate-100/50 rounded-xl overflow-x-auto custom-scrollbar border border-slate-100">
            {['overview', 'qualifications', 'reviews'].map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`flex-1 min-w-[120px] px-4 py-2.5 rounded-lg text-sm font-semibold capitalize transition-all duration-200 ${
                  activeTab === tab 
                    ? 'bg-white text-primary shadow-sm' 
                    : 'text-slate-500 hover:text-heading hover:bg-slate-50'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>

          {/* Tab Content: Overview */}
          {activeTab === 'overview' && (
            <div className="space-y-6 animate-fade-in">
              <div className="bg-white rounded-3xl p-8 border border-slate-100 shadow-sm">
                <h3 className="text-xl font-bold text-heading mb-4 flex items-center gap-2">
                  <HeartPulse className="w-5 h-5 text-primary" /> About Doctor
                </h3>
                <p className="text-slate-600 leading-relaxed whitespace-pre-line text-base">
                  {doctor.bio || 'This doctor has not provided a professional summary yet.'}
                </p>
              </div>

              {doctor.clinicName && (
                <div className="bg-white rounded-3xl p-8 border border-slate-100 shadow-sm">
                  <h3 className="text-xl font-bold text-heading mb-6 flex items-center gap-2">
                    <MapPin className="w-5 h-5 text-primary" /> Clinic Information
                  </h3>
                  <div className="bg-slate-50 p-5 rounded-2xl border border-slate-100">
                    <h4 className="font-bold text-heading text-lg">{doctor.clinicName}</h4>
                    <p className="text-slate-600 mt-2 flex items-start gap-2">
                      <MapPin className="w-4 h-4 mt-0.5 shrink-0" /> 
                      {doctor.clinicAddress ? `${doctor.clinicAddress}, ${doctor.city}` : doctor.city}
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Tab Content: Qualifications */}
          {activeTab === 'qualifications' && (
            <div className="space-y-6 animate-fade-in">
              <div className="bg-white rounded-3xl p-8 border border-slate-100 shadow-sm">
                <h3 className="text-xl font-bold text-heading mb-6 flex items-center gap-2">
                  <GraduationCap className="w-5 h-5 text-primary" /> Education & Qualifications
                </h3>
                
                {doctor.qualifications && doctor.qualifications.length > 0 ? (
                  <div className="space-y-6 relative before:absolute before:inset-0 before:ml-2 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-slate-200 before:to-transparent">
                    {doctor.qualifications.map((qual, index) => (
                      <div key={index} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
                        {/* Timeline dot */}
                        <div className="flex items-center justify-center w-6 h-6 rounded-full border-2 border-white bg-primary text-white shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 shadow-primary/30 ml-[3px] md:ml-0 z-10"></div>
                        {/* Card */}
                        <div className="w-[calc(100%-2rem)] md:w-[calc(50%-1.5rem)] p-5 rounded-2xl bg-slate-50 border border-slate-100 ml-4 md:ml-0 group-hover:border-primary/20 transition-colors">
                          <div className="flex flex-col gap-1">
                            <span className="text-primary font-bold text-sm tracking-wider uppercase">{qual.year}</span>
                            <h4 className="text-lg font-bold text-heading">{qual.degree}</h4>
                            <p className="text-slate-600 text-sm font-medium">{qual.institution}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-slate-500 italic">No qualifications listed.</p>
                )}
              </div>
            </div>
          )}

          {/* Tab Content: Reviews */}
          {activeTab === 'reviews' && (
            <div className="space-y-6 animate-fade-in">
              <div className="bg-white rounded-3xl p-8 border border-slate-100 shadow-sm">
                <div className="flex items-center justify-between mb-8">
                  <h3 className="text-xl font-bold text-heading flex items-center gap-2">
                    <MessageSquare className="w-5 h-5 text-primary" /> Patient Reviews
                  </h3>
                  <div className="flex items-center gap-2 bg-yellow-50 text-yellow-700 px-3 py-1.5 rounded-full font-bold text-sm">
                    <Star className="w-4 h-4 fill-yellow-500 text-yellow-500" />
                    {doctor.rating ? doctor.rating.toFixed(1) : 'New'}
                  </div>
                </div>

                {reviews.length > 0 ? (
                  <div className="space-y-5">
                    {reviews.map(review => (
                      <div key={review._id} className="p-5 rounded-2xl border border-slate-100 bg-slate-50/50">
                        <div className="flex justify-between items-start mb-3">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold">
                              {review.patientId?.name?.charAt(0) || 'P'}
                            </div>
                            <div>
                              <p className="font-bold text-heading text-sm">{review.patientId?.name || 'Anonymous Patient'}</p>
                              <p className="text-xs text-muted">{format(new Date(review.createdAt), 'MMM dd, yyyy')}</p>
                            </div>
                          </div>
                          <div className="flex gap-0.5">
                            {[1, 2, 3, 4, 5].map(star => (
                              <Star key={star} className={`w-3.5 h-3.5 ${star <= review.rating ? 'fill-yellow-400 text-yellow-400' : 'fill-slate-200 text-slate-200'}`} />
                            ))}
                          </div>
                        </div>
                        <p className="text-slate-600 text-sm leading-relaxed">{review.comment}</p>
                      </div>
                    ))}
                    {doctor.totalReviews > 5 && (
                      <Button variant="outline" className="w-full text-sm">View All {doctor.totalReviews} Reviews</Button>
                    )}
                  </div>
                ) : (
                  <div className="text-center py-10 bg-slate-50 rounded-2xl border border-slate-100 border-dashed">
                    <MessageSquare className="w-10 h-10 text-slate-300 mx-auto mb-3" />
                    <h4 className="text-heading font-bold mb-1">No Reviews Yet</h4>
                    <p className="text-sm text-slate-500">Be the first to review this doctor after your appointment.</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Right Column - Sidebar Widgets */}
        <div className="lg:col-span-1 space-y-6">
          
          {/* Consultation Types */}
          <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm">
            <h4 className="font-bold text-heading mb-4 text-sm uppercase tracking-wider text-slate-500">Available For</h4>
            <div className="space-y-3">
              {doctor.consultationType?.includes('in-person') && (
                <div className="flex items-center p-3 rounded-xl bg-slate-50 border border-slate-100 gap-3">
                  <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center shrink-0">
                    <MapPin className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="font-bold text-heading text-sm">Clinic Visit</p>
                    <p className="text-xs text-slate-500">In-person consultation</p>
                  </div>
                </div>
              )}
              {doctor.consultationType?.includes('video') && (
                <div className="flex items-center p-3 rounded-xl bg-slate-50 border border-slate-100 gap-3">
                  <div className="w-10 h-10 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center shrink-0">
                    <Video className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="font-bold text-heading text-sm">Video Consult</p>
                    <p className="text-xs text-slate-500">Online consultation</p>
                  </div>
                </div>
              )}
              {doctor.consultationType?.includes('chat') && (
                <div className="flex items-center p-3 rounded-xl bg-slate-50 border border-slate-100 gap-3">
                  <div className="w-10 h-10 rounded-full bg-purple-100 text-purple-600 flex items-center justify-center shrink-0">
                    <MessageSquare className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="font-bold text-heading text-sm">Chat Consult</p>
                    <p className="text-xs text-slate-500">Text-based consultation</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Languages */}
          {doctor.languages && doctor.languages.length > 0 && (
            <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm">
              <h4 className="font-bold text-heading mb-4 text-sm uppercase tracking-wider text-slate-500 flex items-center gap-2">
                <Languages className="w-4 h-4" /> Languages Spoken
              </h4>
              <div className="flex flex-wrap gap-2">
                {doctor.languages.map(lang => (
                  <Badge key={lang} variant="secondary" className="bg-slate-100 text-slate-700 hover:bg-slate-200">{lang}</Badge>
                ))}
              </div>
            </div>
          )}

          {/* Statistics */}
          <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm">
            <h4 className="font-bold text-heading mb-4 text-sm uppercase tracking-wider text-slate-500 flex items-center gap-2">
              <Award className="w-4 h-4" /> Professional Stats
            </h4>
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center p-4 rounded-2xl bg-slate-50 border border-slate-100">
                <p className="text-2xl font-black text-primary mb-1">{doctor.totalPatients || 0}+</p>
                <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Patients</p>
              </div>
              <div className="text-center p-4 rounded-2xl bg-slate-50 border border-slate-100">
                <p className="text-2xl font-black text-primary mb-1">{doctor.experience}+</p>
                <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Years Exp.</p>
              </div>
            </div>
          </div>

        </div>
      </div>
    </PageTransition>
  );
};

export default DoctorProfile;

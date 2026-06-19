import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Calendar as CalendarIcon, Clock, ArrowRight, Video, MapPin, Stethoscope, FileText, Star, Search, Activity } from 'lucide-react';
import toast from 'react-hot-toast';
import PageTransition from '../../components/common/PageTransition';
import { useAuth } from '../../hooks/useAuth';
import appointmentService from '../../services/appointmentService';
import doctorService from '../../services/doctorService';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import { formatDate } from '../../utils/format';
import Avatar from '../../components/common/Avatar';

const PatientHome = () => {
  const { user } = useAuth();
  const [upcomingAppts, setUpcomingAppts] = useState([]);
  const [featuredDoctors, setFeaturedDoctors] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const results = await Promise.allSettled([
          appointmentService.getUpcoming(),
          doctorService.getDoctors({ limit: 8 }) // Fetching a bit more to ensure we can sort & slice
        ]);

        const apptsRes = results[0].status === 'fulfilled' ? results[0].value : { data: { appointments: [] } };
        const docsRes = results[1].status === 'fulfilled' ? results[1].value : { data: { doctors: [] } };

        if (results[0].status === 'rejected') console.error('Appointments API failed:', results[0].reason);
        if (results[1].status === 'rejected') console.error('Doctors API failed:', results[1].reason);

        setUpcomingAppts(apptsRes.data.appointments || []);

        // Sort by rating descending and grab top 4
        const topDocs = (docsRes.data.doctors || [])
          .sort((a, b) => (b.rating || 0) - (a.rating || 0))
          .slice(0, 4);

        setFeaturedDoctors(topDocs);

        if (results.some(r => r.status === 'rejected')) {
          toast.error('Some home page widgets could not be loaded.');
        }
      } catch (error) {
        toast.error('Failed to load home page data');
        console.error(error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const nextAppt = upcomingAppts.length > 0 ? upcomingAppts[0] : null;

  if (loading) {
    return (
      <PageTransition className="flex items-center justify-center min-h-[60vh]">
        <span className="loader"></span>
      </PageTransition>
    );
  }

  return (
    <PageTransition className="space-y-8 max-w-6xl mx-auto">
      {/* Welcome Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-800 p-8 sm:p-10 text-white shadow-xl">
        <div className="absolute top-0 right-0 -mt-20 -mr-20 w-80 h-80 bg-white/10 rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 left-0 -mb-20 -ml-20 w-64 h-64 bg-blue-400/20 rounded-full blur-2xl"></div>

        <div className="relative z-10 flex flex-col md:flex-row gap-8 justify-between items-center">
          <div className="w-full md:w-2/3">
            <h1 className="text-3xl sm:text-4xl font-heading font-black mb-2">
              Hello, {user?.name?.split(' ')[0] || 'Patient'}! 👋
            </h1>
            <p className="text-blue-100 text-lg mb-8 max-w-lg leading-relaxed">
              Welcome to HealthBridge. Book an appointment, check your health records, or find a specialist in minutes.
            </p>

            <div className="flex flex-wrap gap-4">
              <Link to="/patient/find-doctor">
                <Button className="bg-white text-indigo-600 hover:bg-slate-50 border-none shadow-lg font-bold w-full sm:w-auto">
                  <Stethoscope className="w-5 h-5 mr-2" /> Book Appointment
                </Button>
              </Link>
              <Link to="/patient/records">
                <Button variant="outline" className="text-white border-white/30 hover:bg-white/10 font-medium w-full sm:w-auto">
                  <FileText className="w-5 h-5 mr-2" /> View Medical Records
                </Button>
              </Link>
            </div>
          </div>

          <div className="hidden md:flex w-1/3 justify-end">
            <div className="bg-white/10 backdrop-blur-md border border-white/20 p-5 rounded-2xl text-center">
              <div className="text-4xl font-bold mb-1">{upcomingAppts.length}</div>
              <div className="text-sm font-medium text-blue-100 uppercase tracking-wider">Upcoming Visits</div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column - Upcoming & Actions */}
        <div className="lg:col-span-2 space-y-8">

          {/* Next Appointment Card */}
          <section>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-heading flex items-center">
                <CalendarIcon className="w-5 h-5 mr-2 text-primary" /> Upcoming Appointment
              </h2>
              {upcomingAppts.length > 1 && (
                <Link to="/patient/appointments" className="text-sm font-medium text-primary hover:underline">
                  View All
                </Link>
              )}
            </div>

            {nextAppt ? (
              <div className="card p-6 border-l-4 border-l-primary hover:shadow-md transition-shadow">
                <div className="flex flex-col sm:flex-row gap-6 items-start sm:items-center justify-between">
                  <div className="flex items-center gap-4">
                    <Avatar
                      src={nextAppt.doctorId?.userId?.avatar}
                      name={nextAppt.doctorId?.userId?.name}
                      role="doctor"
                      className="w-16 h-16 shadow-sm border border-border shrink-0"
                    />
                    <div>
                      <h3 className="font-bold text-lg text-heading">Dr. {nextAppt.doctorId?.userId?.name}</h3>
                      <p className="text-primary font-medium">{nextAppt.doctorId?.specialization?.name || 'General Practitioner'}</p>
                      <div className="flex items-center gap-3 mt-2 text-sm text-muted">
                        <span className="flex items-center"><CalendarIcon className="w-4 h-4 mr-1" /> {formatDate(nextAppt.date)}</span>
                        <span className="flex items-center"><Clock className="w-4 h-4 mr-1" /> {nextAppt.slotTime}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-col gap-2 w-full sm:w-auto">
                    <Badge variant={nextAppt.type === 'video' ? 'secondary' : 'default'} className="justify-center py-1">
                      {nextAppt.type === 'video' ? <Video className="w-3 h-3 mr-1" /> : <MapPin className="w-3 h-3 mr-1" />}
                      {nextAppt.type === 'video' ? 'Video Consult' : 'In-Person'}
                    </Badge>
                    <Link to={`/patient/appointments/${nextAppt._id}`}>
                      <Button variant="outline" className="w-full text-sm py-1.5 h-auto">View Details</Button>
                    </Link>
                  </div>
                </div>
              </div>
            ) : (
              <div className="card p-8 text-center bg-slate-50 border border-dashed border-slate-300">
                <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mx-auto mb-4 shadow-sm text-slate-400">
                  <CalendarIcon className="w-8 h-8" />
                </div>
                <h3 className="text-lg font-bold text-heading">No Upcoming Appointments</h3>
                <p className="text-muted mt-1 mb-6 max-w-md mx-auto">You don't have any scheduled consultations at the moment. Would you like to book one?</p>
                <Link to="/patient/find-doctor">
                  <Button variant="primary">Find a Doctor</Button>
                </Link>
              </div>
            )}
          </section>

          {/* Quick Actions / Navigation Grid */}
          <section>
            <h2 className="text-xl font-bold text-heading mb-4">Quick Links</h2>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {[
                { title: 'Find Doctors', icon: Search, color: 'bg-blue-50 text-blue-600 border-blue-100 hover:border-blue-300 hover:shadow-blue-500/10', link: '/patient/find-doctor' },
                { title: 'Appointments', icon: CalendarIcon, color: 'bg-purple-50 text-purple-600 border-purple-100 hover:border-purple-300 hover:shadow-purple-500/10', link: '/patient/appointments' },
                { title: 'Prescriptions', icon: FileText, color: 'bg-green-50 text-green-600 border-green-100 hover:border-green-300 hover:shadow-green-500/10', link: '/patient/prescriptions' },
                { title: 'Health Records', icon: Activity, color: 'bg-orange-50 text-orange-600 border-orange-100 hover:border-orange-300 hover:shadow-orange-500/10', link: '/patient/records' },
              ].map((item, idx) => (
                <Link key={idx} to={item.link} className={`card p-5 flex flex-col items-center justify-center text-center transition-all duration-300 hover:-translate-y-1 hover:shadow-lg border ${item.color}`}>
                  <item.icon className="w-8 h-8 mb-3" />
                  <span className="font-semibold text-sm">{item.title}</span>
                </Link>
              ))}
            </div>
          </section>
        </div>

        {/* Right Column - Top Rated Doctors */}
        <div className="space-y-8">
          <section className="card p-6 border-border shadow-sm">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-bold text-heading flex items-center">
                <Star className="w-5 h-5 mr-2 text-yellow-500 fill-yellow-500" /> Featured Specialists
              </h2>
            </div>

            <div className="space-y-4">
              {featuredDoctors.length > 0 ? (
                featuredDoctors.map(doctor => (
                  <Link
                    key={doctor._id}
                    to={`/patient/find-doctor/${doctor._id}`}
                    className="flex items-center gap-3 p-3 rounded-xl hover:bg-slate-50 transition-colors border border-transparent hover:border-border group"
                  >
                    <Avatar
                      src={doctor.userId?.avatar}
                      name={doctor.userId?.name}
                      role="doctor"
                      size="lg"
                      className="shrink-0"
                    />
                    <div className="flex-1 min-w-0">
                      <h4 className="font-bold text-heading text-sm group-hover:text-primary transition-colors truncate">Dr. {doctor.userId?.name}</h4>
                      <p className="text-xs text-muted truncate">{doctor.specialization?.name || 'Specialist'}</p>
                      <div className="flex items-center gap-1 mt-1">
                        <Star className="w-3 h-3 text-yellow-500 fill-yellow-500" />
                        <span className="text-xs font-medium">{doctor.rating ? doctor.rating.toFixed(1) : '4.5'}</span>
                        <span className="text-xs text-muted ml-1 truncate">({doctor.totalReviews || 0} reviews)</span>
                      </div>
                    </div>
                    <ArrowRight className="w-4 h-4 text-slate-300 group-hover:text-primary transition-colors shrink-0" />
                  </Link>
                ))
              ) : (
                <div className="text-center py-6 text-muted text-sm">
                  No specialists available.
                </div>
              )}
            </div>
            <div className="mt-6 pt-4 border-t border-border">
              <Link to="/patient/find-doctor">
                <Button variant="ghost" className="w-full text-primary hover:bg-primary/5">
                  Browse All Doctors <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </Link>
            </div>
          </section>

          {/* Health Tip Card */}
          <section className="bg-gradient-to-br from-emerald-50 to-teal-100 rounded-2xl p-6 border border-emerald-200 shadow-sm relative overflow-hidden">
            <div className="absolute -right-4 -bottom-4 opacity-10">
              <Activity className="w-32 h-32 text-emerald-900" />
            </div>
            <div className="relative z-10">
              <div className="w-10 h-10 bg-emerald-500 rounded-full flex items-center justify-center text-white mb-4 shadow-sm">
                <Activity className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-emerald-900 mb-2">Daily Health Tip</h3>
              <p className="text-sm text-emerald-800 leading-relaxed">
                Consistent hydration supports your immune system and joint health. Keep a water bottle nearby and aim for at least 8 glasses daily to maintain optimal energy levels!
              </p>
            </div>
          </section>
        </div>
      </div>
    </PageTransition>
  );
};

export default PatientHome;

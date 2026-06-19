import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Calendar as CalendarIcon, Clock, CreditCard, ChevronLeft, AlertTriangle } from 'lucide-react';
import toast from 'react-hot-toast';
import PageTransition from '../../components/common/PageTransition';
import doctorService from '../../services/doctorService';
import appointmentService from '../../services/appointmentService';
import { format, addDays } from 'date-fns';
import { formatSlotTime } from '../../utils/format';
import Button from '../../components/ui/Button';
import Avatar from '../../components/common/Avatar';

// React Datepicker
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';

import { useAuth } from '../../hooks/useAuth';

const BookAppointment = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const doctorId = searchParams.get('doctorId');
  const { user: currentUser } = useAuth();

  const [doctor, setDoctor] = useState(null);
  const [loading, setLoading] = useState(true);

  // Booking State
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [slots, setSlots] = useState([]);
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [slotsError, setSlotsError] = useState(null);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [type, setType] = useState('in-person');
  const [symptoms, setSymptoms] = useState('');
  const [booking, setBooking] = useState(false);

  useEffect(() => {
    if (!doctorId) {
      navigate('/patient/find-doctor');
      return;
    }

    doctorService.getDoctorById(doctorId)
      .then(res => {
        setDoctor(res.data.doctor);
        setType(res.data.doctor.consultationType[0] || 'in-person');
      })
      .catch(err => {
        toast.error('Doctor not found');
        navigate('/patient/find-doctor');
      })
      .finally(() => setLoading(false));
  }, [doctorId, navigate]);

  useEffect(() => {
    if (doctorId && selectedDate) {
      fetchSlots();
    }
  }, [doctorId, selectedDate]);

  const fetchSlots = async () => {
    setSlotsLoading(true);
    setSelectedSlot(null);
    setSlotsError(null);
    try {
      const dateStr = format(selectedDate, 'yyyy-MM-dd');
      const { data } = await doctorService.getSlots(doctorId, dateStr);
      setSlots(data.slots || []);
      if (!data.slots || data.slots.length === 0) {
        setSlotsError(data.message || 'No slots available on this date.');
      }
    } catch (error) {
      console.error(error);
      toast.error('Failed to fetch availability');
    } finally {
      setSlotsLoading(false);
    }
  };

  const handleBook = async () => {
    if (!selectedSlot) return toast.error('Please select a time slot');

    setBooking(true);
    try {
      await appointmentService.bookAppointment({
        doctorId,
        date: format(selectedDate, 'yyyy-MM-dd'),
        slotTime: selectedSlot,
        type,
        symptoms
      });

      toast.success('Appointment booked successfully!');
      navigate('/patient/appointments');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to book appointment');
      // If someone else booked it, refresh slots
      if (error.response?.status === 409) {
        fetchSlots();
      }
    } finally {
      setBooking(false);
    }
  };

  if (loading) {
    return <div className="p-8 text-center"><span className="loader"></span></div>;
  }

  const isMaintenanceMode = localStorage.getItem('maintenanceMode') === 'true';

  if (isMaintenanceMode) {
    return (
      <PageTransition className="max-w-3xl mx-auto py-8">
        <div className="card p-12 text-center bg-amber-50 border-amber-200">
          <div className="w-20 h-20 bg-amber-100 text-amber-600 rounded-full flex items-center justify-center mx-auto mb-6">
            <AlertTriangle className="w-10 h-10" />
          </div>
          <h2 className="text-2xl font-bold text-slate-800 mb-4">System Under Maintenance</h2>
          <p className="text-slate-600 mb-8 max-w-lg mx-auto">
            Bookings are currently unavailable because the platform is under maintenance. Please try again later or contact support for more information.
          </p>
          <Button variant="outline" onClick={() => navigate('/patient/dashboard')} className="bg-white">
            Return to Dashboard
          </Button>
        </div>
      </PageTransition>
    );
  }

  return (
    <PageTransition className="max-w-4xl mx-auto space-y-6">
      <button
        onClick={() => navigate(-1)}
        className="flex items-center text-sm font-medium text-muted hover:text-primary transition-colors"
      >
        <ChevronLeft className="w-4 h-4 mr-1" /> Back
      </button>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Doctor Info & Selection */}
        <div className="lg:col-span-2 space-y-6">
          <div className="card p-6 flex flex-col sm:flex-row gap-6 items-start">
            <Avatar
              src={doctor?.userId?.avatar?.url || doctor?.userId?.avatar}
              name={doctor?.userId?.name}
              role="doctor"
              size="2xl"
              className="border border-border shadow-sm shrink-0"
            />
            <div>
              <h1 className="text-h3 font-heading text-heading">Dr. {doctor?.userId?.name}</h1>
              <p className="text-primary font-medium">{doctor?.specialization?.name}</p>
              <div className="mt-2 text-sm text-muted">
                {doctor?.experience} Years Experience • {doctor?.city}
              </div>
              <p className="mt-3 text-sm text-body line-clamp-2">{doctor?.bio}</p>
            </div>
          </div>


          {/* Patient Information */}
          <div className="card p-6">
            <h3 className="text-lg font-bold text-heading mb-4 flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-primary/10 text-primary flex items-center justify-center text-sm">1</span>
              Patient Information
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1.5 text-heading">Full Name</label>
                <input type="text" className="input-base w-full bg-slate-50 cursor-not-allowed text-slate-500" value={currentUser?.name || ''} disabled />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1.5 text-heading">Email Address</label>
                <input type="email" className="input-base w-full bg-slate-50 cursor-not-allowed text-slate-500" value={currentUser?.email || ''} disabled />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1.5 text-heading">Contact Number</label>
                <input type="text" className="input-base w-full bg-slate-50 cursor-not-allowed text-slate-500" value={currentUser?.phone || 'Not provided'} disabled />
              </div>
            </div>
            <p className="text-xs text-muted mt-3">Patient information is synced securely from your profile. Update it in your account settings if needed.</p>
          </div>

          <div className="card p-6">
            <h3 className="text-lg font-bold text-heading mb-4 flex items-center">
              <span className="w-6 h-6 rounded-full bg-primary/10 text-primary flex items-center justify-center text-sm mr-2">2</span>
              Select Date & Time
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Calendar */}
              <div>
                <label className="block text-sm font-medium mb-2 text-heading">Appointment Date</label>
                <div className="border border-border rounded-xl p-2 bg-surface">
                  <DatePicker
                    selected={selectedDate}
                    onChange={(date) => setSelectedDate(date)}
                    minDate={new Date()}
                    maxDate={addDays(new Date(), 30)}
                    inline
                    calendarClassName="w-full border-none shadow-none"
                  />
                </div>
              </div>

              {/* Slots */}
              <div>
                <label className="block text-sm font-medium mb-2 text-heading flex items-center justify-between">
                  Available Slots
                  {slotsLoading && <span className="text-xs text-primary animate-pulse">Loading...</span>}
                </label>

                {!slotsLoading && slots.length === 0 ? (
                  <div className="bg-surface border border-border rounded-xl p-8 text-center">
                    <p className="text-muted text-sm">{slotsError || 'No slots available on this date. Please select another date.'}</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-2 h-[280px] overflow-y-auto pr-2 custom-scrollbar">
                    {slots.map((slot, idx) => (
                      <button
                        key={idx}
                        disabled={slot.status !== 'available'}
                        onClick={() => setSelectedSlot(slot.time)}
                        className={`
                          p-2 rounded-lg text-sm font-medium transition-all text-center
                          ${slot.status === 'available'
                            ? selectedSlot === slot.time
                              ? 'bg-primary text-white shadow-md'
                              : 'bg-surface border border-border text-heading hover:border-primary hover:text-primary'
                            : 'bg-gray-100 text-gray-400 border border-gray-100 cursor-not-allowed'}
                        `}
                      >
                        {formatSlotTime(slot.time)}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="card p-6">
            <h3 className="text-lg font-bold text-heading mb-4 flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-primary/10 text-primary flex items-center justify-center text-sm">3</span>
              Additional Details
            </h3>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1.5 text-heading">Consultation Type</label>
                <div className="flex gap-3">
                  {doctor?.consultationType?.map(t => (
                    <button
                      key={t}
                      onClick={() => setType(t)}
                      className={`px-4 py-2 rounded-lg text-sm font-medium capitalize transition-all border ${type === t
                          ? 'border-primary bg-primary/5 text-primary'
                          : 'border-border bg-surface text-muted hover:bg-background'
                        }`}
                    >
                      {t.replace('-', ' ')}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1.5 text-heading">Reason for Visit / Symptoms</label>
                <textarea
                  rows={3}
                  className="input-base w-full resize-none"
                  placeholder="Briefly describe your symptoms..."
                  value={symptoms}
                  onChange={(e) => setSymptoms(e.target.value)}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Right Column - Summary */}
        <div className="lg:col-span-1">
          <div className="card p-6 sticky top-24">
            <h3 className="text-lg font-bold text-heading mb-4">Booking Summary</h3>

            <div className="space-y-4 mb-6">
              <div className="flex justify-between text-sm">
                <span className="text-muted">Date</span>
                <span className="font-medium text-heading">{format(selectedDate, 'MMM dd, yyyy')}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted">Time</span>
                <span className="font-medium text-heading">
                  {selectedSlot ? formatSlotTime(selectedSlot) : 'Not selected'}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted">Type</span>
                <span className="font-medium text-heading capitalize">{type.replace('-', ' ')}</span>
              </div>

              <div className="pt-4 border-t border-border space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted">Consultation Fee</span>
                  <span className="font-medium text-heading">${doctor?.fees || 0}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted">Platform Fee</span>
                  <span className="font-medium text-heading">$5</span>
                </div>
                <div className="flex justify-between items-center pt-3 border-t border-dashed border-border mt-3">
                  <span className="font-bold text-heading">Total Amount</span>
                  <span className="text-2xl font-black text-primary">${(doctor?.fees || 0) + 5}</span>
                </div>
              </div>
            </div>

            <Button
              className="w-full"
              size="lg"
              onClick={handleBook}
              isLoading={booking}
              disabled={!selectedSlot}
            >
              <CreditCard className="w-5 h-5 mr-2" />
              Confirm Booking
            </Button>

            <p className="text-center text-xs text-muted mt-4">
              By confirming, you agree to our Terms of Service and Cancellation Policy.
            </p>
          </div>
        </div>
      </div>
    </PageTransition>
  );
};

export default BookAppointment;

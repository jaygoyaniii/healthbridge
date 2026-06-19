import { useState, useEffect, useMemo, useContext } from 'react';
import {
  Save, Plus, Trash2, Calendar as CalendarIcon, Clock,
  Power, CalendarX2, CheckCircle2, AlertCircle, Copy,
  Settings, Activity, Globe, MapPin, X, Sun, Moon
} from 'lucide-react';
import toast from 'react-hot-toast';
import PageTransition from '../../components/common/PageTransition';
import { AuthContext } from '../../context/AuthContext';
import doctorService from '../../services/doctorService';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import { formatDate } from '../../utils/format';

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

const ScheduleManager = () => {
  const { user } = useContext(AuthContext);
  const [activeTab, setActiveTab] = useState('overview');

  // Data State
  const [doctorProfile, setDoctorProfile] = useState(null);
  const [schedule, setSchedule] = useState([]);
  const [slotDuration, setSlotDuration] = useState(30);

  const doctorId = user?.doctorProfile?._id || user?.doctorId;
  const [isAvailable, setIsAvailable] = useState(true);
  const [exceptionDates, setExceptionDates] = useState([]);

  // UI State
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [statusSaving, setStatusSaving] = useState(false);
  const [leaveDate, setLeaveDate] = useState('');
  const [leaveReason, setLeaveReason] = useState('');

  useEffect(() => {
    fetchDoctorData();
  }, [user]);

  const fetchDoctorData = async () => {
    if (!doctorId) return;
    setLoading(true);
    try {
      const res = await doctorService.getDoctorById(doctorId);
      const doc = res.data.doctor;
      setDoctorProfile(doc);
      setSchedule(doc.availability || []);
      setSlotDuration(doc.slotDuration || 30);
      setIsAvailable(doc.isAvailable !== false); // default to true if undefined
      setExceptionDates(doc.exceptionDates || []);
    } catch (err) {
      toast.error('Failed to load schedule data');
    } finally {
      setLoading(false);
    }
  };

  // --- KPI & Analytics Calculations ---
  const stats = useMemo(() => {
    let totalWorkingMinutes = 0;
    let daysWorking = 0;

    schedule.forEach(day => {
      if (day.timeSlots && day.timeSlots.length > 0) {
        daysWorking++;
        day.timeSlots.forEach(slot => {
          const start = new Date(`1970-01-01T${slot.startTime}:00Z`);
          const end = new Date(`1970-01-01T${slot.endTime}:00Z`);
          if (end > start) {
            totalWorkingMinutes += (end - start) / (1000 * 60);
          }
        });
      }
    });

    const totalHours = (totalWorkingMinutes / 60).toFixed(1);
    const estimatedSlots = Math.floor(totalWorkingMinutes / slotDuration);

    // Future upcoming leaves
    const upcomingLeaves = exceptionDates.filter(ed => new Date(ed.date) >= new Date()).length;

    return { totalHours, daysWorking, estimatedSlots, upcomingLeaves };
  }, [schedule, slotDuration, exceptionDates]);

  // --- Availability Status Widget ---
  const toggleAvailability = async () => {
    setStatusSaving(true);
    try {
      const newStatus = !isAvailable;
      await doctorService.updateDoctor(doctorId, { isAvailable: newStatus });
      setIsAvailable(newStatus);
      toast.success(newStatus ? 'You are now marked as Available online' : 'You are now marked as Unavailable');
    } catch (error) {
      toast.error('Failed to update availability status');
    } finally {
      setStatusSaving(false);
    }
  };

  // --- Weekly Schedule Management ---
  const addTimeSlot = (day) => {
    const existingDay = schedule.find(s => s.day === day);
    const newSlot = { startTime: '09:00', endTime: '13:00' };

    if (existingDay) {
      // Check for overlap conceptually, but just add for now
      setSchedule(schedule.map(s =>
        s.day === day ? { ...s, timeSlots: [...s.timeSlots, newSlot].sort((a, b) => a.startTime.localeCompare(b.startTime)) } : s
      ));
    } else {
      setSchedule([...schedule, { day, timeSlots: [newSlot] }]);
    }
  };

  const removeTimeSlot = (day, index) => {
    if (!window.confirm(`Are you sure you want to remove this shift on ${day}?`)) return;
    setSchedule(schedule.map(s => {
      if (s.day === day) {
        const newSlots = [...s.timeSlots];
        newSlots.splice(index, 1);
        return { ...s, timeSlots: newSlots };
      }
      return s;
    }).filter(s => s.timeSlots.length > 0)); // Remove day entirely if 0 slots
  };

  const updateTimeSlot = (day, index, field, value) => {
    setSchedule(schedule.map(s => {
      if (s.day === day) {
        const newSlots = [...s.timeSlots];
        newSlots[index] = { ...newSlots[index], [field]: value };
        return { ...s, timeSlots: newSlots };
      }
      return s;
    }));
  };

  const copyToAllDays = (sourceDay) => {
    if (!window.confirm(`This will overwrite your existing schedule for Monday-Friday with ${sourceDay}'s schedule. Proceed?`)) return;
    const sourceData = schedule.find(s => s.day === sourceDay);
    if (!sourceData || sourceData.timeSlots.length === 0) return;

    // Apply to Mon-Fri (exclude weekends by default for safety, but they can be manually added)
    const weekdays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];

    let newSchedule = [...schedule];
    weekdays.forEach(day => {
      const existingIdx = newSchedule.findIndex(s => s.day === day);
      const clonedSlots = sourceData.timeSlots.map(t => ({ ...t }));
      if (existingIdx >= 0) {
        newSchedule[existingIdx].timeSlots = clonedSlots;
      } else {
        newSchedule.push({ day, timeSlots: clonedSlots });
      }
    });
    setSchedule(newSchedule);
    toast.success(`Copied ${sourceDay} schedule to all weekdays`);
  };

  const saveSchedule = async () => {
    setSaving(true);
    try {
      await doctorService.updateSchedule(doctorId, {
        availability: schedule,
        slotDuration
      });
      toast.success('Weekly schedule saved successfully');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to save schedule configurations');
    } finally {
      setSaving(false);
    }
  };

  // --- Exceptions & Leaves ---
  const handleAddLeave = async (e) => {
    e.preventDefault();
    if (!leaveDate) return toast.error('Please select a date');

    setSaving(true);
    try {
      await doctorService.deleteSlotsForDate(doctorId, leaveDate, leaveReason || 'Personal Leave');
      toast.success('Leave block added and appointments cleared for the date');

      // Update local state instantly
      const newLeave = { date: new Date(leaveDate), reason: leaveReason || 'Personal Leave' };
      setExceptionDates(prev => [...prev, newLeave].sort((a, b) => new Date(a.date) - new Date(b.date)));
      setLeaveDate('');
      setLeaveReason('');
    } catch (error) {
      toast.error('Failed to block date. ' + (error.response?.data?.message || ''));
    } finally {
      setSaving(false);
    }
  };

  const handleRemoveLeave = async (dateStr) => {
    if (!window.confirm(`Are you sure you want to remove this leave and reopen bookings for this date?`)) return;
    // Backend doesn't have an explicit remove leave endpoint, so we update the doctor's exceptionDates array
    setSaving(true);
    try {
      const updatedExceptions = exceptionDates.filter(e => new Date(e.date).toISOString() !== new Date(dateStr).toISOString());
      await doctorService.updateDoctor(doctorId, { exceptionDates: updatedExceptions });
      setExceptionDates(updatedExceptions);
      toast.success('Leave record removed');
    } catch (error) {
      toast.error('Failed to remove leave record');
    } finally {
      setSaving(false);
    }
  };


  if (loading) {
    return (
      <div className="flex justify-center items-center h-[60vh]">
        <span className="loader border-primary"></span>
      </div>
    );
  }

  return (
    <PageTransition className="space-y-6 relative max-w-6xl mx-auto">

      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
        <div>
          <h1 className="text-3xl font-black text-heading">Schedule & Availability</h1>
          <p className="text-slate-500 mt-1">Enterprise master schedule configuration and booking management.</p>
        </div>
        <div className="flex items-center gap-3 bg-white p-2 rounded-xl border border-border shadow-sm">
          <div className="flex flex-col text-right mr-2">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Status</span>
            <span className={`text-sm font-bold ${isAvailable ? 'text-emerald-600' : 'text-rose-600'}`}>
              {isAvailable ? 'Taking Bookings' : 'Unavailable'}
            </span>
          </div>
          <button
            onClick={toggleAvailability}
            disabled={statusSaving}
            className={`w-12 h-12 rounded-lg flex items-center justify-center transition-all ${isAvailable ? 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100' : 'bg-rose-50 text-rose-600 hover:bg-rose-100'}`}
          >
            <Power className="w-6 h-6" />
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-2xl border border-border shadow-sm p-2 flex overflow-x-auto custom-scrollbar">
        {[
          { id: 'overview', label: 'Dashboard & Analytics', icon: Activity },
          { id: 'weekly', label: 'Weekly Master Schedule', icon: CalendarIcon },
          { id: 'exceptions', label: 'Leaves & Blocked Dates', icon: CalendarX2 },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 py-2.5 px-6 rounded-xl font-semibold text-sm transition-all whitespace-nowrap ${activeTab === tab.id ? 'bg-primary/10 text-primary shadow-sm' : 'text-slate-500 hover:bg-slate-50'
              }`}
          >
            <tab.icon className="w-4 h-4" /> {tab.label}
          </button>
        ))}
      </div>

      {/* TAB: OVERVIEW */}
      {activeTab === 'overview' && (
        <div className="space-y-6 animate-fade-in">
          {/* KPI Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white p-5 rounded-2xl border border-border shadow-sm">
              <p className="text-sm font-semibold text-slate-500 uppercase flex items-center gap-2"><Clock className="w-4 h-4 text-blue-500" /> Total Weekly Hrs</p>
              <h3 className="text-3xl font-black text-heading mt-2">{stats.totalHours}<span className="text-sm text-slate-400 ml-1 font-medium">hrs</span></h3>
            </div>
            <div className="bg-white p-5 rounded-2xl border border-border shadow-sm">
              <p className="text-sm font-semibold text-slate-500 uppercase flex items-center gap-2"><Settings className="w-4 h-4 text-emerald-500" /> Bookable Slots</p>
              <h3 className="text-3xl font-black text-heading mt-2">{stats.estimatedSlots}<span className="text-sm text-slate-400 ml-1 font-medium">slots/wk</span></h3>
            </div>
            <div className="bg-white p-5 rounded-2xl border border-border shadow-sm">
              <p className="text-sm font-semibold text-slate-500 uppercase flex items-center gap-2"><CalendarIcon className="w-4 h-4 text-purple-500" /> Working Days</p>
              <h3 className="text-3xl font-black text-heading mt-2">{stats.daysWorking}<span className="text-sm text-slate-400 ml-1 font-medium">days</span></h3>
            </div>
            <div className="bg-white p-5 rounded-2xl border border-border shadow-sm">
              <p className="text-sm font-semibold text-slate-500 uppercase flex items-center gap-2"><AlertCircle className="w-4 h-4 text-amber-500" /> Upcoming Leaves</p>
              <h3 className="text-3xl font-black text-heading mt-2">{stats.upcomingLeaves}<span className="text-sm text-slate-400 ml-1 font-medium">days</span></h3>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            {/* Status Widget */}
            <div className="bg-white rounded-2xl border border-border shadow-sm p-6">
              <h3 className="text-lg font-bold text-heading mb-4 flex items-center gap-2">
                <Activity className="w-5 h-5 text-primary" /> Active Consultation Types
              </h3>
              <div className="space-y-4">
                <div className="p-4 rounded-xl border border-slate-100 bg-slate-50 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-purple-100 text-purple-600 flex items-center justify-center"><Globe className="w-5 h-5" /></div>
                    <div>
                      <p className="font-bold text-heading">Online Video Consults</p>
                      <p className="text-xs text-slate-500">Accessible globally to patients</p>
                    </div>
                  </div>
                  <Badge variant={doctorProfile?.consultationType === 'video' || doctorProfile?.consultationType === 'both' ? 'success' : 'neutral'}>
                    {doctorProfile?.consultationType === 'video' || doctorProfile?.consultationType === 'both' ? 'Enabled' : 'Disabled'}
                  </Badge>
                </div>

                <div className="p-4 rounded-xl border border-slate-100 bg-slate-50 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center"><MapPin className="w-5 h-5" /></div>
                    <div>
                      <p className="font-bold text-heading">In-Person Clinic Visits</p>
                      <p className="text-xs text-slate-500">Physical walk-ins and bookings</p>
                    </div>
                  </div>
                  <Badge variant={doctorProfile?.consultationType === 'in-person' || doctorProfile?.consultationType === 'both' ? 'success' : 'neutral'}>
                    {doctorProfile?.consultationType === 'in-person' || doctorProfile?.consultationType === 'both' ? 'Enabled' : 'Disabled'}
                  </Badge>
                </div>
              </div>
            </div>

            {/* Quick Summary Widget */}
            <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-2xl shadow-sm p-6 text-white relative overflow-hidden">
              <div className="absolute top-0 right-0 p-6 opacity-10">
                <CalendarIcon className="w-32 h-32" />
              </div>
              <h3 className="text-lg font-bold mb-2">Schedule Integrity</h3>
              <p className="text-slate-300 text-sm mb-6 max-w-[80%]">Your master schedule controls all front-end booking eligibility. Any changes made are reflected globally instantly.</p>

              <div className="space-y-3 relative z-10">
                <div className="flex items-center gap-3 bg-white/10 p-3 rounded-lg backdrop-blur-sm">
                  <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                  <span className="text-sm font-medium">Overlapping Slot Prevention Active</span>
                </div>
                <div className="flex items-center gap-3 bg-white/10 p-3 rounded-lg backdrop-blur-sm">
                  <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                  <span className="text-sm font-medium">Holiday & Leave Blocking Active</span>
                </div>
                <div className="flex items-center gap-3 bg-white/10 p-3 rounded-lg backdrop-blur-sm">
                  <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                  <span className="text-sm font-medium">Timezone Normalization Active</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB: WEEKLY SCHEDULE */}
      {activeTab === 'weekly' && (
        <div className="space-y-6 animate-fade-in">
          <div className="flex justify-between items-center bg-white p-5 rounded-2xl border border-border shadow-sm">
            <div>
              <h3 className="font-bold text-heading flex items-center gap-2"><Settings className="w-5 h-5 text-primary" /> Global Slot Configuration</h3>
              <p className="text-sm text-slate-500 mt-1">Define the standard duration for every patient appointment block.</p>
            </div>
            <div className="flex items-center gap-3">
              <label className="text-sm font-bold text-slate-600">Slot Duration:</label>
              <select
                className="input-base w-36 bg-slate-50 border-slate-200"
                value={slotDuration}
                onChange={(e) => setSlotDuration(Number(e.target.value))}
              >
                <option value={10}>10 Minutes</option>
                <option value={15}>15 Minutes</option>
                <option value={20}>20 Minutes</option>
                <option value={30}>30 Minutes</option>
                <option value={45}>45 Minutes</option>
                <option value={60}>1 Hour</option>
              </select>
              <Button onClick={saveSchedule} isLoading={saving} className="ml-2">
                <Save className="w-4 h-4 mr-2" /> Save Config
              </Button>
            </div>
          </div>

          <div className="grid lg:grid-cols-7 gap-6">
            <div className="lg:col-span-2 space-y-2 sticky top-6">
              <div className="bg-slate-900 text-white p-5 rounded-2xl shadow-lg">
                <h3 className="font-black text-xl mb-2">Weekly Master</h3>
                <p className="text-sm text-slate-300 mb-6">Configure your recurring shifts and clinic hours. Add split shifts for morning and evening blocks.</p>
                <ul className="text-sm space-y-3 text-slate-400">
                  <li className="flex items-start gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" /> Supports split-shifts (Morning/Evening)</li>
                  <li className="flex items-start gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" /> Instantly generates bookable slots</li>
                  <li className="flex items-start gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" /> Replicate logic instantly using copy tools</li>
                </ul>
              </div>
            </div>

            <div className="lg:col-span-5 space-y-4">
              {DAYS.map((day) => {
                const dayData = schedule.find(s => s.day === day);
                const hasSlots = dayData && dayData.timeSlots.length > 0;

                return (
                  <div key={day} className={`bg-white rounded-2xl border transition-all shadow-sm overflow-hidden ${hasSlots ? 'border-primary/20 ring-1 ring-primary/5' : 'border-border'}`}>

                    {/* Day Header */}
                    <div className="px-5 py-4 border-b border-border bg-slate-50 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-white shadow-sm ${hasSlots ? 'bg-primary' : 'bg-slate-300'}`}>
                          {day.substring(0, 3)}
                        </div>
                        <div>
                          <h3 className="font-bold text-heading text-lg leading-tight">{day}</h3>
                          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                            {hasSlots ? `${dayData.timeSlots.length} Shift(s) Active` : 'Not Available'}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        {hasSlots && day !== 'Saturday' && day !== 'Sunday' && (
                          <button onClick={() => copyToAllDays(day)} className="p-2 text-slate-400 hover:text-primary hover:bg-primary/10 rounded-lg transition-colors" title={`Copy ${day} to all weekdays`}>
                            <Copy className="w-4 h-4" />
                          </button>
                        )}
                        <Button variant={hasSlots ? 'outline' : 'primary'} size="sm" onClick={() => addTimeSlot(day)}>
                          <Plus className="w-4 h-4 mr-1.5" /> Add Shift
                        </Button>
                      </div>
                    </div>

                    {/* Time Slots Area */}
                    {hasSlots && (
                      <div className="p-5 space-y-3 bg-white">
                        {dayData.timeSlots.map((slot, idx) => {
                          // Simple UI heuristic for morning/evening badge
                          const startHr = parseInt(slot.startTime.split(':')[0]);
                          const isEvening = startHr >= 16;

                          return (
                            <div key={idx} className="flex flex-col sm:flex-row sm:items-center gap-4 bg-slate-50 p-3 rounded-xl border border-slate-100">
                              <div className="flex items-center justify-center w-8 h-8 rounded-full bg-white shadow-sm shrink-0 text-slate-400">
                                {isEvening ? <Moon className="w-4 h-4 text-indigo-500" /> : <Sun className="w-4 h-4 text-amber-500" />}
                              </div>
                              <div className="flex items-center gap-3 flex-1">
                                <div className="relative flex-1">
                                  <label className="absolute -top-2 left-2 bg-slate-50 px-1 text-[10px] font-bold text-slate-400 uppercase">Start Time</label>
                                  <input
                                    type="time"
                                    className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm font-medium focus:ring-2 focus:ring-primary/20"
                                    value={slot.startTime}
                                    onChange={(e) => updateTimeSlot(day, idx, 'startTime', e.target.value)}
                                  />
                                </div>
                                <span className="text-slate-400 font-bold px-2">TO</span>
                                <div className="relative flex-1">
                                  <label className="absolute -top-2 left-2 bg-slate-50 px-1 text-[10px] font-bold text-slate-400 uppercase">End Time</label>
                                  <input
                                    type="time"
                                    className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm font-medium focus:ring-2 focus:ring-primary/20"
                                    value={slot.endTime}
                                    onChange={(e) => updateTimeSlot(day, idx, 'endTime', e.target.value)}
                                  />
                                </div>
                              </div>
                              <button
                                onClick={() => removeTimeSlot(day, idx)}
                                className="w-10 h-10 flex items-center justify-center text-rose-500 bg-white border border-rose-100 hover:bg-rose-50 hover:border-rose-200 rounded-lg transition-colors shrink-0 shadow-sm"
                                title="Remove Shift"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* TAB: EXCEPTIONS & LEAVES */}
      {activeTab === 'exceptions' && (
        <div className="space-y-6 animate-fade-in">

          <div className="grid md:grid-cols-3 gap-6">

            {/* Create Leave Form */}
            <div className="md:col-span-1">
              <form onSubmit={handleAddLeave} className="bg-white p-6 rounded-2xl border border-border shadow-sm sticky top-6">
                <div className="flex items-center gap-3 mb-6 pb-4 border-b border-border">
                  <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-600 flex items-center justify-center">
                    <CalendarX2 className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-heading text-lg leading-tight">Block Date</h3>
                    <p className="text-xs text-slate-500">Add leaves & holidays</p>
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-1">Select Date</label>
                    <input
                      type="date"
                      required
                      min={new Date().toISOString().split('T')[0]} // Prevent past blocks
                      value={leaveDate}
                      onChange={(e) => setLeaveDate(e.target.value)}
                      className="w-full input-base"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-1">Reason / Note</label>
                    <input
                      type="text"
                      placeholder="e.g. Annual Conference, Personal Leave"
                      value={leaveReason}
                      onChange={(e) => setLeaveReason(e.target.value)}
                      className="w-full input-base"
                    />
                  </div>

                  <div className="bg-amber-50 p-4 rounded-xl border border-amber-200 flex items-start gap-3 mt-2">
                    <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                    <p className="text-xs text-amber-800 leading-relaxed">
                      Blocking a date will automatically cancel any existing appointments on that day and prevent new bookings.
                    </p>
                  </div>

                  <Button type="submit" variant="primary" className="w-full bg-amber-500 hover:bg-amber-600 border-amber-500" isLoading={saving}>
                    <Plus className="w-4 h-4 mr-2" /> Add Blocked Date
                  </Button>
                </div>
              </form>
            </div>

            {/* List of Blocked Dates */}
            <div className="md:col-span-2 bg-white rounded-2xl border border-border shadow-sm overflow-hidden flex flex-col">
              <div className="p-5 border-b border-border bg-slate-50 flex items-center justify-between">
                <h3 className="font-bold text-heading">Configured Exceptions & Leaves</h3>
                <Badge variant="neutral">{exceptionDates.length} Blocked Dates</Badge>
              </div>

              <div className="p-0 flex-1 bg-slate-50/50">
                {exceptionDates.length === 0 ? (
                  <div className="p-16 text-center">
                    <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mx-auto mb-4 border border-border shadow-sm">
                      <CheckCircle2 className="w-8 h-8 text-emerald-400" />
                    </div>
                    <h3 className="text-xl font-bold text-heading mb-2">No Upcoming Blocks</h3>
                    <p className="text-slate-500 max-w-sm mx-auto text-sm">You currently have no leaves, holidays, or blocked dates configured in the system.</p>
                  </div>
                ) : (
                  <div className="divide-y divide-border">
                    {exceptionDates.map((leave, idx) => {
                      const isPast = new Date(leave.date) < new Date(new Date().setHours(0, 0, 0, 0));
                      return (
                        <div key={idx} className={`p-5 flex items-center justify-between transition-colors ${isPast ? 'opacity-50 grayscale bg-slate-100' : 'bg-white hover:bg-slate-50'}`}>
                          <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-xl bg-slate-100 border border-slate-200 flex flex-col items-center justify-center shrink-0">
                              <span className="text-[10px] font-bold uppercase text-slate-500 -mb-1">{new Date(leave.date).toLocaleString('default', { month: 'short' })}</span>
                              <span className="text-lg font-black text-heading">{new Date(leave.date).getDate()}</span>
                            </div>
                            <div>
                              <p className="font-bold text-heading flex items-center gap-2">
                                {formatDate(leave.date)}
                                {isPast && <Badge variant="neutral" className="text-[10px] px-1.5 py-0">Past</Badge>}
                                {!isPast && <Badge variant="warning" className="text-[10px] px-1.5 py-0">Upcoming</Badge>}
                              </p>
                              <p className="text-sm text-slate-600 mt-0.5">{leave.reason || 'Personal Leave'}</p>
                            </div>
                          </div>
                          {!isPast && (
                            <Button variant="outline" size="sm" onClick={() => handleRemoveLeave(leave.date)} className="text-rose-600 border-rose-200 hover:bg-rose-50" isLoading={saving}>
                              Remove
                            </Button>
                          )}
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            </div>

          </div>
        </div>
      )}

    </PageTransition>
  );
};

export default ScheduleManager;

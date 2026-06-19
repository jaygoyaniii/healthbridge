import { getRedis } from '../config/redis.js';

/**
 * Generate time slots from availability schedule
 * @param {string} startTime - "09:00"
 * @param {string} endTime - "17:00"
 * @param {number} duration - slot duration in minutes (15|30|45|60)
 * @returns {string[]} - ["09:00 AM", "09:30 AM", ...]
 */
export const generateTimeSlots = (startTime, endTime, duration = 30) => {
  const slots = [];
  const [startH, startM] = startTime.split(':').map(Number);
  const [endH, endM] = endTime.split(':').map(Number);

  let currentMinutes = startH * 60 + startM;
  const endMinutes = endH * 60 + endM;

  while (currentMinutes + duration <= endMinutes) {
    const hours = Math.floor(currentMinutes / 60);
    const mins = currentMinutes % 60;
    const period = hours >= 12 ? 'PM' : 'AM';
    const displayHours = hours > 12 ? hours - 12 : hours === 0 ? 12 : hours;
    const timeStr = `${String(displayHours).padStart(2, '0')}:${String(mins).padStart(2, '0')} ${period}`;
    slots.push(timeStr);
    currentMinutes += duration;
  }

  return slots;
};

/**
 * Get day abbreviation from Date
 */
export const getDayFromDate = (date) => {
  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  return days[new Date(date).getDay()];
};

/**
 * Lock a slot in Redis (10-minute TTL)
 */
export const lockSlot = async (doctorId, date, time, patientId) => {
  const redis = getRedis();
  if (!redis) return { locked: true, fallback: true };

  const key = `slot:${doctorId}:${date}:${time}`;
  const existing = await redis.get(key);

  if (existing && existing !== patientId.toString()) {
    return { locked: false, lockedBy: existing };
  }

  await redis.set(key, patientId.toString(), 'EX', 600); // 10 min
  return { locked: true };
};

/**
 * Unlock a slot in Redis
 */
export const unlockSlot = async (doctorId, date, time) => {
  const redis = getRedis();
  if (!redis) return;

  const key = `slot:${doctorId}:${date}:${time}`;
  await redis.del(key);
};

/**
 * Check if a slot is locked
 */
export const isSlotLocked = async (doctorId, date, time) => {
  const redis = getRedis();
  if (!redis) return false;

  const key = `slot:${doctorId}:${date}:${time}`;
  const val = await redis.get(key);
  return !!val;
};

/**
 * Get all locked slots for a doctor on a date
 */
export const getLockedSlots = async (doctorId, date) => {
  const redis = getRedis();
  if (!redis) return [];

  const pattern = `slot:${doctorId}:${date}:*`;
  const keys = await redis.keys(pattern);
  return keys.map((k) => k.split(':').pop());
};

/**
 * Normalize a date to YYYY-MM-DD string
 */
export const normalizeDate = (date) => {
  const d = new Date(date);
  return d.toISOString().split('T')[0];
};

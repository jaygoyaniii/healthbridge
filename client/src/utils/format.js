import { format, isToday, isTomorrow, isYesterday, formatDistanceToNow } from 'date-fns';

/**
 * Format a date object/string to "MMMM dd, yyyy"
 */
export const formatDate = (date) => {
  if (!date) return '';
  return format(new Date(date), 'MMMM dd, yyyy');
};

/**
 * Format a date object/string to time "hh:mm a"
 */
export const formatTime = (date) => {
  if (!date) return '';
  return format(new Date(date), 'hh:mm a');
};

/**
 * Format date relatively (e.g. "Today", "Tomorrow", "Oct 15, 2024")
 */
export const formatRelativeDate = (date) => {
  if (!date) return '';
  const d = new Date(date);
  if (isToday(d)) return 'Today';
  if (isTomorrow(d)) return 'Tomorrow';
  if (isYesterday(d)) return 'Yesterday';
  return format(d, 'MMM dd, yyyy');
};

/**
 * Format a time distance (e.g. "5 minutes ago")
 */
export const timeAgo = (date) => {
  if (!date) return '';
  return formatDistanceToNow(new Date(date), { addSuffix: true });
};

/**
 * Format 24h slot string ("14:30") to 12h format ("02:30 PM")
 */
export const formatSlotTime = (timeStr) => {
  if (!timeStr || !timeStr.includes(':')) return timeStr;
  
  // If already contains AM/PM, return as is
  if (timeStr.toLowerCase().includes('m')) return timeStr;

  const [hours, minutes] = timeStr.split(':');
  let h = parseInt(hours, 10);
  const ampm = h >= 12 ? 'PM' : 'AM';
  
  h = h % 12;
  h = h ? h : 12; // the hour '0' should be '12'
  
  return `${String(h).padStart(2, '0')}:${minutes} ${ampm}`;
};

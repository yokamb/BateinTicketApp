import { 
  addDays, 
  addMonths, 
  addWeeks, 
  setHours, 
  setMinutes, 
  setSeconds, 
  setMilliseconds,
  startOfDay, 
  getDay, 
  getDate,
  setDate,
  nextDay
} from "date-fns";
import { toZonedTime, fromZonedTime } from "date-fns-tz";

/**
 * Computes the next run time for a recurring template based on user's timezone.
 * Returns the date in UTC for storage.
 */
export function computeNextRunAt(
  frequency: string,
  timeHour: number,
  timeMinute: number,
  dayOfWeek?: number | null,
  dayOfMonth?: number | null,
  timezone: string = "UTC"
): Date {
  // Current time in UTC
  const nowUtc = new Date();
  
  // 1. Convert "now" to User's Timezone
  const zonedNow = toZonedTime(nowUtc, timezone);
  
  // 2. Start building "next run" in User's Timezone
  let next = startOfDay(zonedNow);
  next = setHours(next, timeHour);
  next = setMinutes(next, timeMinute);
  next = setSeconds(next, 0);
  next = setMilliseconds(next, 0);

  if (frequency === "DAILY") {
    // If we've already passed "today's" time in their timezone, go to tomorrow
    if (next <= zonedNow) {
      next = addDays(next, 1);
    }
  } 
  else if (frequency === "WEEKLY" || frequency === "BIWEEKLY") {
    const targetDay = dayOfWeek ?? 1; // 0=Sun, 1=Mon...
    const currentDay = getDay(zonedNow);
    
    let daysUntil = (targetDay - currentDay + 7) % 7;
    
    // If it's today but the time has passed, or it's today and we want first occurrence?
    if (daysUntil === 0 && next <= zonedNow) {
      daysUntil = (frequency === "BIWEEKLY") ? 14 : 7;
    }
    
    next = addDays(next, daysUntil);
  } 
  else if (frequency === "MONTHLY") {
    const targetDay = dayOfMonth ?? 1;
    // Set to the specific day of the month in user's timezone
    next = setDate(next, targetDay);
    
    // If the date has passed this month, move to next month
    if (next <= zonedNow) {
      next = addMonths(next, 1);
    }
  }

  // 3. Convert back to UTC for the database
  return fromZonedTime(next, timezone);
}

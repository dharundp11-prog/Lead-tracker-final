/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Utility to resolve relative dates like "today", "tomorrow", "Friday", "next Monday"
 * into accurate human-readable Day, Date, and Time format.
 *
 * Example:
 *  "tomorrow at 3 PM" -> { dayDate: "Saturday, Oct 17, 2026", time: "3:00 PM", formatted: "Saturday, Oct 17, 2026 @ 3:00 PM" }
 *  "today" -> { dayDate: "Friday, Oct 16, 2026", time: "", formatted: "Friday, Oct 16, 2026" }
 */

const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

export function formatDayDate(d: Date): string {
  const dayName = DAYS[d.getDay()];
  const monthName = MONTHS[d.getMonth()];
  const dateNum = d.getDate();
  const year = d.getFullYear();
  return `${dayName}, ${monthName} ${dateNum}, ${year}`;
}

export function formatStandardTime(timeRaw: string): string {
  if (!timeRaw) return '';
  const clean = timeRaw.trim().toUpperCase();

  // If already like "3:00 PM"
  const fullMatch = clean.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/);
  if (fullMatch) {
    const hours = parseInt(fullMatch[1], 10);
    const mins = fullMatch[2];
    const ampm = fullMatch[3];
    return `${hours}:${mins} ${ampm}`;
  }

  // If like "3 PM" or "3PM" -> "3:00 PM"
  const shortMatch = clean.match(/^(\d{1,2})\s*(AM|PM)$/);
  if (shortMatch) {
    const hours = parseInt(shortMatch[1], 10);
    const ampm = shortMatch[2];
    return `${hours}:00 ${ampm}`;
  }

  return clean;
}

export interface ResolvedDateResult {
  dayDate: string;
  time: string;
  formatted: string;
}

export function resolveDateAndTimeString(
  text: string,
  baseDate: Date = new Date()
): ResolvedDateResult {
  if (!text || !text.trim()) {
    return { dayDate: '', time: '', formatted: '' };
  }

  const lower = text.toLowerCase().trim();

  // 1. Extract Time if present (e.g. "3:00 PM", "3 PM", "11:30 AM", "at 4pm")
  let extractedTime = '';
  const timeRegex = /(?:\bat\s+)?(\b\d{1,2}(?::\d{2})?\s*(?:am|pm)\b)/i;
  const timeMatch = text.match(timeRegex);
  if (timeMatch) {
    extractedTime = formatStandardTime(timeMatch[1]);
  }

  // 2. Compute Target Date
  let targetDate = new Date(baseDate.getTime());

  if (lower.includes('day after tomorrow')) {
    targetDate.setDate(targetDate.getDate() + 2);
  } else if (lower.includes('tomorrow')) {
    targetDate.setDate(targetDate.getDate() + 1);
  } else if (lower.includes('today')) {
    // Keep today
  } else if (lower.includes('yesterday')) {
    targetDate.setDate(targetDate.getDate() - 1);
  } else {
    // Check for day of the week mentions
    let matchedDayIndex = -1;
    for (let i = 0; i < DAYS.length; i++) {
      if (lower.includes(DAYS[i].toLowerCase())) {
        matchedDayIndex = i;
        break;
      }
    }

    if (matchedDayIndex !== -1) {
      const currentDayIndex = baseDate.getDay();
      let daysAhead = matchedDayIndex - currentDayIndex;

      if (lower.includes('next')) {
        // Next [Day] e.g. "next Friday"
        if (daysAhead <= 0) daysAhead += 7;
        daysAhead += 7;
      } else {
        if (daysAhead <= 0) {
          daysAhead += 7; // Next upcoming occurrence
        }
      }
      targetDate.setDate(targetDate.getDate() + daysAhead);
    } else {
      // If it already is a formatted date like "Oct 17, 2026", try parsing
      const parsed = Date.parse(text);
      if (!isNaN(parsed)) {
        targetDate = new Date(parsed);
      } else if (text.includes(',') && text.length > 6) {
        // Already structured text, preserve
        return {
          dayDate: text.split('@')[0].trim(),
          time: extractedTime,
          formatted: text.trim(),
        };
      }
    }
  }

  const dayDate = formatDayDate(targetDate);
  const formatted = extractedTime ? `${dayDate} @ ${extractedTime}` : dayDate;

  return {
    dayDate,
    time: extractedTime,
    formatted,
  };
}

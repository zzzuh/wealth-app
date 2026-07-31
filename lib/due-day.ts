// Statements bill on the same day every month, so the user only ever enters a
// day-of-month (1–31) and we resolve it to a real date. Short months clamp
// (day 31 in September becomes the 30th), matching how issuers actually bill.

export function daysInMonth(year: number, monthIndex: number) {
  return new Date(Date.UTC(year, monthIndex + 1, 0)).getUTCDate();
}

function isoDate(year: number, monthIndex: number, day: number) {
  return new Date(Date.UTC(year, monthIndex, day)).toISOString().slice(0, 10);
}

/**
 * The next occurrence of `day` on or after `from` (default: today), as a
 * "YYYY-MM-DD" string — the same plain-string shape every DATE column uses.
 */
export function dueDateFromDay(day: number, from: Date = new Date()): string {
  const year = from.getFullYear();
  const month = from.getMonth();

  const thisMonth = Math.min(day, daysInMonth(year, month));
  if (thisMonth >= from.getDate()) return isoDate(year, month, thisMonth);

  const nextYear = month === 11 ? year + 1 : year;
  const nextMonth = (month + 1) % 12;
  return isoDate(nextYear, nextMonth, Math.min(day, daysInMonth(nextYear, nextMonth)));
}

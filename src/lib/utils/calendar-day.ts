const ISO_DATE = /^(\d{4})-(\d{2})-(\d{2})$/;

const WEEK_START: Record<string, 0 | 1> = {
  "en-US": 0,
  "es-ES": 1,
  "pt-BR": 0,
  "pt-PT": 1,
  "ro-RO": 1,
};

export const PERIOD_PRESETS = [
  "last_7_days",
  "last_14_days",
  "last_30_days",
  "last_3_months",
  "last_6_months",
] as const;

export type PeriodPreset = (typeof PERIOD_PRESETS)[number];

export type CalendarCell = {
  iso: string;
  inMonth: boolean;
};

export function browserTimeZone(): string {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";
  } catch {
    return "UTC";
  }
}

export function isIsoDate(value: string): boolean {
  const match = ISO_DATE.exec(value);
  if (!match) return false;

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const date = new Date(Date.UTC(year, month - 1, day));

  return (
    date.getUTCFullYear() === year &&
    date.getUTCMonth() === month - 1 &&
    date.getUTCDate() === day
  );
}

/** Calendar date of a local Date, as yyyy-MM-dd. */
export function toIsoDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

/** Local noon, so formatting keeps the calendar day across time zones. */
export function dateFromIso(isoDate: string): Date {
  const [year, month, day] = isoDate.split("-").map(Number);
  return new Date(year, month - 1, day, 12, 0, 0, 0);
}

export function addIsoDays(isoDate: string, days: number): string {
  const [year, month, day] = isoDate.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

/** Moves a calendar date by whole months and clamps the day, as date-fns does. */
export function addIsoMonths(isoDate: string, months: number): string {
  const [year, month, day] = isoDate.split("-").map(Number);
  const target = new Date(Date.UTC(year, month - 1 + months, 1));
  const lastDay = new Date(
    Date.UTC(target.getUTCFullYear(), target.getUTCMonth() + 1, 0),
  ).getUTCDate();
  target.setUTCDate(Math.min(day, lastDay));
  return target.toISOString().slice(0, 10);
}

export function shiftMonth(month: string, delta: number): string {
  return addIsoMonths(`${month}-01`, delta).slice(0, 7);
}

export function weekStartsOn(intlLocale: string): 0 | 1 {
  return WEEK_START[intlLocale] ?? 1;
}

export function weekdayIsoDates(weekStartsOnDay: number): string[] {
  const sunday = new Date(Date.UTC(2024, 0, 7));

  return Array.from({ length: 7 }, (_, index) => {
    const date = new Date(sunday);
    date.setUTCDate(sunday.getUTCDate() + weekStartsOnDay + index);
    return date.toISOString().slice(0, 10);
  });
}

export function calendarCells(
  month: string,
  weekStartsOnDay: number,
): CalendarCell[] {
  const [year, monthNumber] = month.split("-").map(Number);
  const first = new Date(Date.UTC(year, monthNumber - 1, 1));
  const leading = (first.getUTCDay() - weekStartsOnDay + 7) % 7;
  const start = new Date(first);
  start.setUTCDate(1 - leading);

  const cells: CalendarCell[] = [];

  for (let index = 0; index < 42; index += 1) {
    const current = new Date(start);
    current.setUTCDate(start.getUTCDate() + index);
    cells.push({
      iso: current.toISOString().slice(0, 10),
      inMonth: current.getUTCMonth() === monthNumber - 1,
    });
  }

  if (cells.slice(35).every((cell) => !cell.inMonth)) {
    return cells.slice(0, 35);
  }

  return cells;
}

export function presetRange(
  preset: PeriodPreset,
  today: string,
): { startDate: string; endDate: string } {
  const startDate =
    preset === "last_7_days"
      ? addIsoDays(today, -6)
      : preset === "last_14_days"
        ? addIsoDays(today, -13)
        : preset === "last_30_days"
          ? addIsoDays(today, -29)
          : preset === "last_3_months"
            ? addIsoMonths(today, -3)
            : addIsoMonths(today, -6);

  return { startDate, endDate: today };
}

export function matchPreset(
  startDate: string,
  endDate: string,
  today: string,
): PeriodPreset | "custom" | null {
  if (!startDate && !endDate) return null;
  if (!startDate || !endDate) return "custom";

  for (const preset of PERIOD_PRESETS) {
    const range = presetRange(preset, today);
    if (range.startDate === startDate && range.endDate === endDate) {
      return preset;
    }
  }

  return "custom";
}

/**
 * Two months that contain the range. A longer range opens on its last two months.
 */
export function visibleMonths(
  startDate: string,
  endDate: string,
  today: string,
): { left: string; right: string } {
  const todayMonth = today.slice(0, 7);
  if (!startDate) {
    return { left: todayMonth, right: shiftMonth(todayMonth, 1) };
  }

  const startMonth = startDate.slice(0, 7);
  const endMonth = (endDate || startDate).slice(0, 7);

  if (endMonth <= startMonth) {
    return { left: startMonth, right: shiftMonth(startMonth, 1) };
  }

  if (endMonth <= shiftMonth(startMonth, 1)) {
    return { left: startMonth, right: endMonth };
  }

  return { left: shiftMonth(endMonth, -1), right: endMonth };
}

/**
 * UTC instant of midnight at the start of this calendar day in an IANA time zone.
 * Returns NaN when the date is not yyyy-MM-dd.
 */
export function zonedDayStart(isoDate: string, timeZone: string): number {
  if (!isIsoDate(isoDate)) return Number.NaN;

  const zone = resolveTimeZone(timeZone);
  const [year, month, day] = isoDate.split("-").map(Number);
  const utcMidnight = Date.UTC(year, month - 1, day);
  const firstOffset = timeZoneOffset(utcMidnight, zone);
  let instant = utcMidnight - firstOffset;
  const correctedOffset = timeZoneOffset(instant, zone);

  if (correctedOffset !== firstOffset) {
    instant = utcMidnight - correctedOffset;
  }

  return instant;
}

function resolveTimeZone(timeZone: string): string {
  try {
    Intl.DateTimeFormat("en-US", { timeZone });
    return timeZone;
  } catch {
    return "UTC";
  }
}

function timeZoneOffset(utcMs: number, timeZone: string): number {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    hourCycle: "h23",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  }).formatToParts(new Date(utcMs));

  const map: Record<string, string> = {};
  for (const part of parts) {
    if (part.type !== "literal") map[part.type] = part.value;
  }

  let year = Number(map.year);
  let month = Number(map.month);
  let day = Number(map.day);
  let hour = Number(map.hour);

  if (hour === 24) {
    hour = 0;
    const rolled = new Date(Date.UTC(year, month - 1, day));
    rolled.setUTCDate(rolled.getUTCDate() + 1);
    year = rolled.getUTCFullYear();
    month = rolled.getUTCMonth() + 1;
    day = rolled.getUTCDate();
  }

  const asUtc = Date.UTC(
    year,
    month - 1,
    day,
    hour,
    Number(map.minute),
    Number(map.second),
  );

  return asUtc - utcMs;
}

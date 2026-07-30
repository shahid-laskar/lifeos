import type { PrayerName, PrayerTimes } from "./api/types";
import { PRAYER_NAMES } from "./api/types";

/** Today's date (YYYY-MM-DD) in the browser's timezone. */
export function todayISO(): string {
  const now = new Date();
  const offset = now.getTimezoneOffset() * 60000;
  return new Date(now.getTime() - offset).toISOString().slice(0, 10);
}

export function browserTimezone(): string {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";
  } catch {
    return "UTC";
  }
}

/** UTC offset in hours for the browser (e.g. +2). */
export function utcOffsetHours(): number {
  return -new Date().getTimezoneOffset() / 60;
}

/** Accepts "HH:MM", "HH:MM:SS" or an ISO datetime, returns a Date today. */
export function toDateToday(value: string, base = new Date()): Date | null {
  if (!value) return null;
  const timeMatch = /^(\d{1,2}):(\d{2})/.exec(value.trim());
  if (timeMatch && !value.includes("T")) {
    const date = new Date(base);
    date.setHours(Number(timeMatch[1]), Number(timeMatch[2]), 0, 0);
    return date;
  }
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

export function formatPrayerTime(value: string): string {
  const date = toDateToday(value);
  if (!date) return "—";
  return date.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
}

export type NextPrayer = {
  name: PrayerName;
  at: Date;
  msRemaining: number;
  tomorrow: boolean;
};

export function nextPrayer(times: PrayerTimes, now = new Date()): NextPrayer | null {
  const entries = PRAYER_NAMES.map((name) => ({
    name,
    at: toDateToday(times[name], now),
  })).filter((entry): entry is { name: PrayerName; at: Date } => entry.at !== null);

  if (entries.length === 0) return null;

  const upcoming = entries.find((entry) => entry.at.getTime() > now.getTime());
  if (upcoming) {
    return {
      name: upcoming.name,
      at: upcoming.at,
      msRemaining: upcoming.at.getTime() - now.getTime(),
      tomorrow: false,
    };
  }

  const first = entries[0];
  const at = new Date(first.at);
  at.setDate(at.getDate() + 1);
  return {
    name: first.name,
    at,
    msRemaining: at.getTime() - now.getTime(),
    tomorrow: true,
  };
}

export function formatCountdown(ms: number): string {
  const total = Math.max(0, Math.floor(ms / 1000));
  const hours = Math.floor(total / 3600);
  const minutes = Math.floor((total % 3600) / 60);
  const seconds = total % 60;
  const pad = (n: number) => String(n).padStart(2, "0");
  return hours > 0
    ? `${hours}:${pad(minutes)}:${pad(seconds)}`
    : `${pad(minutes)}:${pad(seconds)}`;
}

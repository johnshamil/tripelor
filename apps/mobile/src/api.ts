import type { PublicReview } from "./types";

const API_BASE_URL = "https://www.tripelor.com";
const REQUEST_TIMEOUT_MS = 25000;

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const response = await fetch(`${API_BASE_URL}${path}`, {
      ...options,
      signal: controller.signal,
      headers: {
        Accept: "application/json",
        ...(options?.body ? { "Content-Type": "application/json" } : {}),
        ...options?.headers,
      },
    });
    const body = (await response.json().catch(() => ({}))) as T & { error?: string };
    if (!response.ok) throw new Error(body.error || "Tripelor could not complete the request.");
    return body;
  } catch (error) {
    if (error instanceof Error && error.name === "AbortError") {
      throw new Error("The request took too long. Please check your internet connection and try again.");
    }
    throw error;
  } finally {
    clearTimeout(timer);
  }
}

export function postJSON<T>(path: string, payload: Record<string, unknown>) {
  return request<T>(path, { method: "POST", body: JSON.stringify(payload) });
}

export function checkAvailability(payload: {
  propertyName: string;
  roomType: string;
  checkIn: string;
  checkOut: string;
  rooms: number;
}) {
  return postJSON<{ available: boolean; rooms_left: number; total_rooms: number }>(
    "/api/availability",
    payload,
  );
}

export function submitBooking(payload: Record<string, unknown>) {
  return postJSON<{ success: boolean; reservationId?: string }>("/api/booking", payload);
}

export function submitContact(payload: Record<string, unknown>) {
  return postJSON<{ success: boolean }>("/api/contact", payload);
}

export function submitSpeedboat(payload: Record<string, unknown>) {
  return postJSON<{ success: boolean; total: number }>("/api/speedboat", payload);
}

export function submitReview(payload: Record<string, unknown>) {
  return postJSON<{ success: boolean }>("/api/reviews", payload);
}

export async function getReviews() {
  const result = await request<{ reviews: PublicReview[] }>("/api/reviews/public");
  return result.reviews;
}

export function dateToLong(value: string) {
  const parsed = parseISODate(value);
  if (!parsed) return value;
  return new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  }).format(parsed);
}

export function parseISODate(value: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
  const [year, month, day] = value.split("-").map(Number);
  if (!year || !month || !day) return null;
  const date = new Date(Date.UTC(year, month - 1, day));
  if (
    date.getUTCFullYear() !== year ||
    date.getUTCMonth() !== month - 1 ||
    date.getUTCDate() !== day
  ) return null;
  return date;
}

export function addDays(value: string, days: number) {
  const date = parseISODate(value);
  if (!date) return "";
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

export function nightsBetween(checkIn: string, checkOut: string) {
  const start = parseISODate(checkIn);
  const end = parseISODate(checkOut);
  if (!start || !end) return 0;
  return Math.max(0, Math.round((end.getTime() - start.getTime()) / 86400000));
}

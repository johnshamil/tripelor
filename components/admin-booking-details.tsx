"use client";

import { useEffect, useId, useRef } from "react";
import { FileText, X } from "lucide-react";
import { bookingMoney, stayNights } from "@/lib/manual-booking";

export type BookingDetailsRecord = Record<string, unknown>;

function recordedNumber(value: unknown) {
  if ((typeof value !== "number" && typeof value !== "string") || String(value).trim() === "") return null;
  const result = Number(value);
  return Number.isFinite(result) ? result : null;
}

function guestCount(value: unknown) {
  const result = recordedNumber(value);
  return result !== null && Number.isSafeInteger(result) && result >= 0 ? result : null;
}

export function bookingGuestCounts(booking: { adults?: unknown; children?: unknown }) {
  const adults = guestCount(booking.adults), children = guestCount(booking.children);
  const total = adults !== null && children !== null ? adults + children : null;
  return {
    adults, children, total,
    label: total === null ? "Not recorded" : `${total} guest${total === 1 ? "" : "s"}`,
    breakdown: `${adults === null ? "Adults not recorded" : `${adults} adult${adults === 1 ? "" : "s"}`} · ${children === null ? "Children not recorded" : `${children} ${children === 1 ? "child" : "children"}`}`,
  };
}

function text(value: unknown) {
  return (typeof value === "string" && value.trim()) || (typeof value === "number" && Number.isFinite(value) ? String(value) : "Not recorded");
}

function date(value: unknown) {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return "Not recorded";
  const parsed = new Date(`${value}T00:00:00Z`);
  if (!Number.isFinite(parsed.getTime()) || parsed.toISOString().slice(0, 10) !== value) return "Not recorded";
  return new Intl.DateTimeFormat("en-GB", { timeZone: "UTC", day: "numeric", month: "short", year: "numeric" }).format(parsed);
}

function createdAt(value: unknown) {
  if (typeof value !== "string" || !Number.isFinite(Date.parse(value))) return "Not recorded";
  return new Intl.DateTimeFormat("en-GB", {
    timeZone: "Indian/Maldives", day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit",
  }).format(new Date(value));
}

function amount(value: unknown, currency: unknown) {
  const number = recordedNumber(value);
  return number === null ? "Not recorded" : bookingMoney(number, currency);
}

export function BookingDetailsButton({ booking, onViewDetails }: {
  booking: BookingDetailsRecord; onViewDetails: (booking: BookingDetailsRecord) => void;
}) {
  return <button type="button" onClick={() => onViewDetails(booking)} aria-haspopup="dialog"
    aria-label={`View booking details for ${text(booking.guest_name)}`}
    className="inline-flex min-h-[44px] items-center justify-center gap-2 rounded-full border border-gold/40 px-4 text-xs font-semibold text-gold transition hover:bg-gold/5">
    <FileText className="h-4 w-4" aria-hidden="true"/>View details
  </button>;
}

export default function AdminBookingDetails({ booking: selected, onClose }: {
  booking: BookingDetailsRecord | null; onClose: () => void;
}) {
  const booking = selected || {};
  const open = Boolean(selected);
  const dialog = useRef<HTMLDialogElement>(null);
  const id = useId();
  const counts = bookingGuestCounts(booking);

  useEffect(() => {
    if (!open) return;
    const element = dialog.current;
    if (!element) return;
    const trigger = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const previousOverflow = document.body.style.overflow;
    element.showModal();
    document.body.style.overflow = "hidden";
    return () => {
      element.close();
      document.body.style.overflow = previousOverflow;
      trigger?.focus({ preventScroll: true });
    };
  }, [open]);

  const nights = typeof booking.check_in === "string" && typeof booking.check_out === "string"
    && date(booking.check_in) !== "Not recorded" && date(booking.check_out) !== "Not recorded"
    ? stayNights(booking.check_in, booking.check_out) : 0;
  const stayAmount = recordedNumber(booking.estimated_total);
  const transferAmount = recordedNumber(booking.speedboat_total);
  const total = stayAmount === null ? null : Math.round((stayAmount + (transferAmount ?? 0)) * 100) / 100;

  return <dialog ref={dialog} id={id} aria-labelledby={`${id}-title`}
      onCancel={event => { event.preventDefault(); onClose(); }} onClose={onClose}
      onClick={event => { if (event.target === event.currentTarget) onClose(); }}
      className="m-auto max-h-[calc(100dvh-2rem)] w-[calc(100%-2rem)] max-w-3xl overflow-y-auto overscroll-contain rounded-2xl border border-[#dedfd5] bg-white p-0 text-ink shadow-2xl backdrop:bg-gray-950/60">
      {open && <>
        <header className="sticky top-0 z-10 flex items-start justify-between gap-4 border-b border-[#dedfd5] bg-white p-5 sm:p-6">
          <div className="min-w-0"><h2 id={`${id}-title`} className="text-xl font-semibold">Booking details</h2><p className="mt-1 break-words text-sm text-gray-500">{text(booking.guest_name)}</p></div>
          <button type="button" autoFocus onClick={onClose} aria-label="Close booking details" className="inline-flex min-h-[44px] shrink-0 items-center gap-2 rounded-full border border-[#dedfd5] px-3 text-sm">
            <X className="h-4 w-4" aria-hidden="true"/>Close
          </button>
        </header>
        <div className="space-y-6 p-5 sm:p-6">
          <DetailSection title="Guests & contact">
            <Detail label="Lead guest" value={text(booking.guest_name)}/>
            <Detail label="Total guests" value={counts.label}/>
            <Detail label="Adults" value={counts.adults === null ? "Not recorded" : String(counts.adults)}/>
            <Detail label="Children" value={counts.children === null ? "Not recorded" : String(counts.children)}/>
            <Detail label="Email" value={text(booking.guest_email)}/>
            <Detail label="Phone / WhatsApp" value={text(booking.guest_phone)}/>
          </DetailSection>
          {Boolean(booking.manual_booking_id) && <p className="rounded-xl border border-gold/20 bg-gold/5 p-3 text-xs leading-6 text-gray-500">Guest counts cover the booking party. Separate room types in the same booking may appear on separate cards.</p>}
          <DetailSection title="Stay details">
            <Detail label="Property" value={text(booking.property_name)}/>
            <Detail label="Room type" value={text(booking.room_type)}/>
            <Detail label="Number of rooms" value={text(booking.rooms)}/>
            <Detail label="Meal plan" value={text(booking.meal_plan)}/>
            <Detail label="Check-in" value={date(booking.check_in)}/>
            <Detail label="Check-out" value={date(booking.check_out)}/>
            <Detail label="Nights" value={nights ? String(nights) : "Not recorded"}/>
            <Detail label="Booking status" value={text(booking.status)}/>
            <Detail label="Package" value={text(booking.package_name)}/>
            <Detail label="Activities" value={text(booking.activities)}/>
          </DetailSection>
          <DetailSection title="Payment & transfers">
            <Detail label="Payment status" value={text(booking.payment_status)}/>
            <Detail label="Currency" value={text(booking.currency)}/>
            <Detail label="Rate per room / night" value={amount(booking.nightly_rate, booking.currency)}/>
            <Detail label="Stay / package amount" value={amount(booking.estimated_total, booking.currency)}/>
            <Detail label="Transfer seats" value={text(booking.speedboat_seats)}/>
            <Detail label="Transfer amount" value={amount(booking.speedboat_total, booking.currency)}/>
            <Detail label={booking.manual_booking_id ? "Total for these rooms" : "Booking total"} value={amount(total, booking.currency)}/>
            {recordedNumber(booking.referral_discount) !== null && Number(booking.referral_discount) > 0 && <Detail label="Referral discount included" value={amount(booking.referral_discount, booking.currency)}/>}
          </DetailSection>
          <DetailSection title="Booking references">
            <Detail label="Tripelor reference" value={text(booking.booking_reference)}/>
            <Detail label="External reference" value={text(booking.external_reference)}/>
            <Detail label="Booking source" value={text(booking.booking_source)}/>
            <Detail label="Created · Maldives time" value={createdAt(booking.created_at)}/>
            {Boolean(booking.referral_code) && <Detail label="Referral code" value={text(booking.referral_code)}/>}
          </DetailSection>
          <section aria-label="Notes & special requests"><h3 className="mb-3 text-sm font-semibold">Notes & special requests</h3><p className="whitespace-pre-wrap break-words rounded-xl border border-[#dedfd5] bg-[#faf9ef] p-4 text-sm leading-7">{text(booking.notes)}</p></section>
        </div>
      </>}
    </dialog>;
}

function DetailSection({ title, children }: { title: string; children: React.ReactNode }) {
  return <section aria-label={title}><h3 className="mb-3 text-sm font-semibold">{title}</h3><dl className="grid grid-cols-1 gap-4 rounded-xl border border-[#dedfd5] bg-[#faf9ef] p-4 sm:grid-cols-2">{children}</dl></section>;
}

function Detail({ label, value }: { label: string; value: string }) {
  return <div className="min-w-0"><dt className="text-[10px] uppercase tracking-[.1em] text-gray-500">{label}</dt><dd className="mt-1 whitespace-pre-wrap break-words text-sm font-medium">{value}</dd></div>;
}

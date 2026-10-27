"use client";

import { useEffect, useMemo, useState, useRef } from "react";
import { CalendarDays, ChevronLeft, ChevronRight, X } from "lucide-react";
import { useSiteLanguage } from "@/components/use-site-language";

const iso = (date: Date) =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
const pretty = (value: string, locale: string, empty: string) =>
  value
    ? new Date(`${value}T00:00:00`).toLocaleDateString(locale, { day: "2-digit", month: "short", year: "numeric" })
    : empty;

export default function AvailabilityDatePicker({
  label,
  value,
  onChange,
  propertyName,
  roomType,
  minDate,
  disabled = false,
  allowUnavailable = false,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  propertyName: string;
  roomType: string;
  minDate?: string;
  disabled?: boolean;
  allowUnavailable?: boolean;
}) {
  const siteLocale = useSiteLanguage();
  const locale = siteLocale === "it" ? "it-IT" : siteLocale === "ru" ? "ru-RU" : "en-GB";
  const copy = siteLocale === "it"
    ? { select: "Seleziona una data", close: "Chiudi calendario", prev: "Mese precedente", next: "Mese successivo", available: "Disponibile", booked: "Occupato", past: "Passato", alert: "Puoi selezionare date occupate per richiedere un avviso di disponibilità." }
    : siteLocale === "ru"
      ? { select: "Выберите дату", close: "Закрыть календарь", prev: "Предыдущий месяц", next: "Следующий месяц", available: "Свободно", booked: "Занято", past: "Прошедшая дата", alert: "Можно выбрать занятые даты и запросить уведомление о появлении мест." }
      : { select: "Select date", close: "Close calendar", prev: "Previous month", next: "Next month", available: "Available", booked: "Booked", past: "Past", alert: "You can select booked dates to request an availability alert." };
  const weekdayLabels = siteLocale === "it"
    ? ["D", "L", "M", "M", "G", "V", "S"]
    : siteLocale === "ru"
      ? ["Вс", "Пн", "Вт", "Ср", "Чт", "Пт", "Сб"]
      : ["S", "M", "T", "W", "T", "F", "S"];
  const [open, setOpen] = useState(false);
  const initial = value ? new Date(`${value}T00:00:00`) : new Date();
  const [month, setMonth] = useState(() => new Date(initial.getFullYear(), initial.getMonth(), 1));
  const [days, setDays] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(false);
  const [calendarError, setCalendarError] = useState(false);
  const modal = useRef<HTMLDivElement>(null);
  const start = new Date(month.getFullYear(), month.getMonth(), 1);
  const end = new Date(month.getFullYear(), month.getMonth() + 1, 0);
  const today = iso(new Date());

  useEffect(() => {
    if (!open) return;
    const controller = new AbortController();
    setLoading(true);
    setDays({}); setCalendarError(false);
    fetch(
      `/api/availability/calendar?propertyName=${encodeURIComponent(propertyName)}&roomType=${encodeURIComponent(roomType)}&from=${iso(start)}&to=${iso(end)}`,
      { cache: "no-store", signal: controller.signal },
    )
      .then((response) => { if (!response.ok) throw new Error("Calendar unavailable"); return response.json(); })
      .then((result) => {
        if (controller.signal.aborted) return;
        const nextDays: Record<string, boolean> = {};
        for (const day of result.days || []) nextDays[day.day] = Boolean(day.available);
        setDays(nextDays);
      })
      .catch(() => { if (!controller.signal.aborted) { setDays({}); setCalendarError(true); } })
      .finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, [open, propertyName, roomType, month.getFullYear(), month.getMonth()]);

  useEffect(() => {
    if (!open) return;
    const previous = document.activeElement as HTMLElement | null;
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    modal.current?.querySelector<HTMLButtonElement>("button")?.focus();
    const keydown = (event: KeyboardEvent) => {
      if (event.key === "Escape") { event.preventDefault(); setOpen(false); }
      if (event.key !== "Tab") return;
      const buttons = modal.current?.querySelectorAll<HTMLButtonElement>("button:not([disabled])");
      if (!buttons?.length) return;
      const first = buttons[0], last = buttons[buttons.length - 1];
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
    };
    document.addEventListener("keydown", keydown);
    return () => { document.removeEventListener("keydown", keydown); document.body.style.overflow = overflow; previous?.focus(); };
  }, [open]);

  useEffect(() => {
    if (value) {
      const selected = new Date(`${value}T00:00:00`);
      setMonth(new Date(selected.getFullYear(), selected.getMonth(), 1));
    }
  }, [value]);

  const cells = useMemo(() => {
    const result: (Date | null)[] = Array(start.getDay()).fill(null);
    for (let day = 1; day <= end.getDate(); day += 1) result.push(new Date(month.getFullYear(), month.getMonth(), day));
    return result;
  }, [month.getFullYear(), month.getMonth()]);

  function choose(key: string, available: boolean, past: boolean) {
    if ((!available && !allowUnavailable) || past || disabled) return;
    onChange(key);
    setOpen(false);
  }

  return (
    <div className="premium-label">
      <span><CalendarDays className="h-4 w-4 text-[#9c7d3d]" /> {label}</span>
      <button
        type="button"
        disabled={disabled}
        onClick={() => setOpen(true)}
        className="premium-control flex items-center justify-between text-left disabled:opacity-60"
      >
        <span className={value ? "text-[#071922]" : "text-[#879094]"}>{pretty(value, locale, copy.select)}</span>
        <CalendarDays className="h-4 w-4 text-[#9c7d3d]" />
      </button>

      {open && (
        <div ref={modal} role="dialog" aria-modal="true" aria-label={label} className="booking-calendar fixed inset-0 z-[100] flex items-center justify-center bg-[#021015]/80 p-4 backdrop-blur-md" onClick={() => setOpen(false)}>
          <div className="w-full max-w-md overflow-hidden border border-[#c9a86a]/30 bg-[#071922] text-white shadow-2xl" onClick={(event) => event.stopPropagation()}>
            <div className="flex items-start justify-between border-b border-white/10 bg-[#0b2731] p-6">
              <div>
                <p className="eyebrow">{month.getFullYear()}</p>
                <p className="font-display mt-2 text-3xl">
                  {value
                    ? new Date(`${value}T00:00:00`).toLocaleDateString(locale, { weekday: "short", day: "numeric", month: "short" })
                    : label}
                </p>
                <p className="mt-2 text-xs uppercase tracking-[.14em] text-white/40">{roomType}</p>
              </div>
              <button type="button" onClick={() => setOpen(false)} className="border border-white/10 p-2 text-white/70 transition hover:border-[#c9a86a]/40 hover:text-white" aria-label={copy.close}>
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="p-5 md:p-6">
              <div className="flex items-center justify-between">
                <button type="button" onClick={() => setMonth(new Date(month.getFullYear(), month.getMonth() - 1, 1))} className="border border-white/10 p-2 transition hover:border-[#c9a86a]/40" aria-label={copy.prev}>
                  <ChevronLeft />
                </button>
                <strong className="font-display text-xl font-normal">
                  {month.toLocaleDateString(locale, { month: "long", year: "numeric" })}
                </strong>
                <button type="button" onClick={() => setMonth(new Date(month.getFullYear(), month.getMonth() + 1, 1))} className="border border-white/10 p-2 transition hover:border-[#c9a86a]/40" aria-label={copy.next}>
                  <ChevronRight />
                </button>
              </div>

              <div className="mt-6 grid grid-cols-7 gap-1 text-center text-[10px] font-semibold uppercase tracking-[.14em] text-white/35">
                {weekdayLabels.map((day, index) => <span key={`${day}${index}`}>{day}</span>)}
              </div>
              <div className="mt-3 grid grid-cols-7 gap-1">
                {cells.map((date, index) => {
                  if (!date) return <span key={`empty-${index}`} className="aspect-square" />;
                  const key = iso(date);
                  const past = key < today || (minDate ? key < minDate : false);
                  const unknown = typeof days[key] !== "boolean";
                  const available = days[key] === true;
                  const selected = value === key;
                  return (
                    <button
                      key={key}
                      type="button"
                      disabled={past || (!available && !allowUnavailable) || loading}
                      onClick={() => choose(key, available, past)}
                      aria-label={`${date.toLocaleDateString(locale, { day: "numeric", month: "long", year: "numeric" })} · ${unknown ? "Availability unverified" : available ? copy.available : copy.booked}`}
                      className={`aspect-square text-sm font-semibold transition ${
                        past
                          ? "text-white/15"
                          : unknown
                            ? "bg-white/5 text-white/70"
                          : !available
                            ? `bg-red-400/15 text-red-300/70 ${allowUnavailable ? 'hover:bg-red-400/25' : 'cursor-not-allowed'} ${selected ? 'ring-2 ring-red-300/70' : ''}`
                            : selected
                              ? "bg-[#c9a86a] text-[#071922] ring-2 ring-[#e3ca91] ring-offset-2 ring-offset-[#071922]"
                              : "bg-white/[.045] text-white/75 hover:bg-[#c9a86a] hover:text-[#071922]"
                      }`}
                    >
                      {date.getDate()}
                    </button>
                  );
                })}
              </div>

              <div className="mt-6 flex flex-wrap justify-center gap-5 border-t border-white/10 pt-5 text-[10px] uppercase tracking-[.12em] text-white/40">
                <span className="flex items-center gap-2"><i className="h-2.5 w-2.5 bg-[#c9a86a]" /> {copy.available}</span>
                <span className="flex items-center gap-2"><i className="h-2.5 w-2.5 bg-red-400/60" /> {copy.booked}</span>
                <span className="flex items-center gap-2"><i className="h-2.5 w-2.5 bg-white/15" /> {copy.past}</span>
              </div>
              {allowUnavailable && <p className="mt-4 text-center text-xs leading-5 text-white/60">{copy.alert}</p>}
              {calendarError && <p role="alert" className="mt-3 text-sm text-amber-200">Calendar unavailable. Dates can still be selected; check full-stay availability before requesting.</p>}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

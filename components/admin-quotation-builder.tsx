"use client";

import Link from "next/link";
import {
  ArrowLeft,
  CheckCircle2,
  Copy,
  FileText,
  Hotel,
  Mail,
  MessageCircle,
  Plus,
  Printer,
  RefreshCw,
  Send,
  Ship,
  Trash2,
  Users,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { propertyRateForDate, type PublicProperty } from "@/lib/property-model";
import { DEFAULT_SPEEDBOAT_SEAT_PRICE_USD } from "@/lib/transfer-pricing";
import { MVR_PER_USD, quoteAmount, type QuoteCurrency } from "@/lib/quote-currency";
import { QUOTATION_BANK_ACCOUNTS } from "@/lib/quotation-bank-details";

type ExtraItem = {
  id: string;
  category: "excursion" | "other";
  label: string;
  details: string;
  quantity: number;
  unitPrice: number;
};

type SavedQuotation = {
  id: string;
  reference: string;
  share_url: string;
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  property_name: string;
  room_name: string;
  meal_plan: string;
  check_in: string | null;
  check_out: string | null;
  adults: number;
  children: number;
  rooms: number;
  currency: QuoteCurrency;
  subtotal: number;
  discount_amount: number;
  fees_amount: number;
  total: number;
  status: "draft" | "sent" | "accepted" | "cancelled";
  valid_until: string;
  created_at: string;
};

const field =
  "mt-2 min-h-12 w-full rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-white outline-none transition focus:border-gold/60";

function money(value: number, currency: QuoteCurrency) {
  return `${currency} ${Number(value || 0).toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

function roundMoney(value: number) {
  return Math.round(value * 100) / 100;
}

function nightsBetween(checkIn: string, checkOut: string) {
  if (!checkIn || !checkOut || checkOut <= checkIn) return 0;
  return Math.round(
    (Date.parse(`${checkOut}T00:00:00Z`) - Date.parse(`${checkIn}T00:00:00Z`)) / 86_400_000,
  );
}

function stayDates(checkIn: string, checkOut: string) {
  const dates: string[] = [];
  if (!checkIn || !checkOut || checkOut <= checkIn) return dates;
  let current = checkIn;
  while (current < checkOut) {
    dates.push(current);
    const date = new Date(`${current}T00:00:00Z`);
    date.setUTCDate(date.getUTCDate() + 1);
    current = date.toISOString().slice(0, 10);
  }
  return dates;
}

export default function AdminQuotationBuilder() {
  const [properties, setProperties] = useState<PublicProperty[]>([]);
  const [quotations, setQuotations] = useState<SavedQuotation[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [busyId, setBusyId] = useState("");
  const [status, setStatus] = useState("");

  const [customerName, setCustomerName] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [checkIn, setCheckIn] = useState("");
  const [checkOut, setCheckOut] = useState("");
  const [adults, setAdults] = useState(2);
  const [children, setChildren] = useState(0);
  const [rooms, setRooms] = useState(1);
  const [currency, setCurrency] = useState<QuoteCurrency>("USD");
  const [propertyName, setPropertyName] = useState("");
  const [roomName, setRoomName] = useState("");
  const [mealPlan, setMealPlan] = useState("");
  const [accommodationPerRoom, setAccommodationPerRoom] = useState(0);
  const [transferSeats, setTransferSeats] = useState(0);
  const [transferUnitPrice, setTransferUnitPrice] = useState(DEFAULT_SPEEDBOAT_SEAT_PRICE_USD);
  const [extras, setExtras] = useState<ExtraItem[]>([]);
  const [discountAmount, setDiscountAmount] = useState(0);
  const [feesAmount, setFeesAmount] = useState(0);
  const [validHours, setValidHours] = useState(48);
  const [notes, setNotes] = useState("");
  const [terms, setTerms] = useState(
    "This quotation is subject to availability at the time of confirmation. No room, transfer or excursion is held until Tripelor confirms the booking and payment conditions. Any changes to dates, occupancy or inclusions may require a revised quotation.",
  );
  const [created, setCreated] = useState<SavedQuotation | null>(null);
  const [copied, setCopied] = useState(false);

  async function load() {
    const me = await fetch("/api/auth/me", { cache: "no-store" });
    const member = await me.json();
    if (!member.user) {
      window.location.href = "/login?next=%2Fadmin%2Fquotations";
      return;
    }
    if (!member.user.isAdmin) throw new Error("Admin access required.");

    const [propertiesResponse, quotationsResponse] = await Promise.all([
      fetch("/api/properties", { cache: "no-store" }),
      fetch("/api/admin/quotations", { cache: "no-store" }),
    ]);
    const propertiesData = await propertiesResponse.json();
    const quotationsData = await quotationsResponse.json();
    if (!propertiesResponse.ok) throw new Error(propertiesData.error || "Unable to load properties.");
    if (!quotationsResponse.ok) throw new Error(quotationsData.error || "Unable to load quotations.");
    setProperties(propertiesData.properties || []);
    setQuotations(quotationsData.quotations || []);
  }

  useEffect(() => {
    load()
      .catch(error => setStatus(error instanceof Error ? error.message : "Unable to load quotation builder."))
      .finally(() => setLoading(false));
  }, []);

  const property = properties.find(item => item.name === propertyName) || null;
  const roomOptions = useMemo(() => {
    if (!property) return [];
    const seen = new Set<string>();
    return property.rooms.filter(room => {
      const key = room.name.toLowerCase();
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }, [property]);

  const mealOptions = useMemo(() => {
    if (!property || !roomName) return [];
    return Array.from(
      new Set(
        property.rooms
          .filter(room => room.name === roomName)
          .map(room => room.mealPlan)
          .filter(Boolean),
      ),
    );
  }, [property, roomName]);

  const nights = nightsBetween(checkIn, checkOut);

  const suggestedStayPerRoom = useMemo(() => {
    if (!property || !roomName || !mealPlan || nights <= 0) return 0;
    return roundMoney(quoteAmount(
      stayDates(checkIn, checkOut).reduce(
        (sum, date) => sum + propertyRateForDate(property, roomName, mealPlan, date),
        0,
      ), currency));
  }, [property, roomName, mealPlan, checkIn, checkOut, nights, currency]);

  useEffect(() => {
    if (!property) {
      setRoomName("");
      setMealPlan("");
      return;
    }
    if (!roomOptions.some(room => room.name === roomName)) {
      const first = roomOptions[0]?.name || "";
      setRoomName(first);
      const firstMeal = property.rooms.find(room => room.name === first)?.mealPlan || "";
      setMealPlan(firstMeal);
    }
  }, [property, roomOptions, roomName]);

  useEffect(() => {
    if (!mealOptions.includes(mealPlan)) setMealPlan(mealOptions[0] || "");
  }, [mealOptions, mealPlan]);

  const accommodationTotal = roundMoney(accommodationPerRoom * rooms);
  const transferTotal = roundMoney(transferSeats * transferUnitPrice);
  const extraTotal = extras.reduce(
    (sum, item) => sum + Math.max(0, Number(item.quantity) || 0) * Math.max(0, Number(item.unitPrice) || 0),
    0,
  );
  const subtotal = Math.round((accommodationTotal + transferTotal + extraTotal) * 100) / 100;
  const finalTotal = Math.max(0, Math.round((subtotal - discountAmount + feesAmount) * 100) / 100);

  function changeCurrency(next: QuoteCurrency) {
    if (next === currency) return;
    const factor = next === "MVR" ? MVR_PER_USD : 1 / MVR_PER_USD;
    setAccommodationPerRoom(value => roundMoney(value * factor));
    setTransferUnitPrice(value => roundMoney(value * factor));
    setExtras(current => current.map(item => ({ ...item, unitPrice: roundMoney(item.unitPrice * factor) })));
    setDiscountAmount(value => roundMoney(value * factor));
    setFeesAmount(value => roundMoney(value * factor));
    setCurrency(next);
  }

  function changeRooms(next: number) {
    setAdults(current => current === rooms * 2 ? Math.min(20, next * 2) : current);
    setTransferSeats(current => current === rooms * 2 ? Math.min(30, next * 2) : current);
    setRooms(next);
  }

  function selectProperty(value: string) {
    setPropertyName(value);
    const selected = properties.find(item => item.name === value);
    const firstRoom = selected?.rooms[0];
    setRoomName(firstRoom?.name || "");
    setMealPlan(firstRoom?.mealPlan || "");
    setAccommodationPerRoom(0);
  }

  function addExtra(category: ExtraItem["category"]) {
    setExtras(current => [
      ...current,
      {
        id: crypto.randomUUID(),
        category,
        label: "",
        details: "",
        quantity: 1,
        unitPrice: 0,
      },
    ]);
  }

  function updateExtra(id: string, patch: Partial<ExtraItem>) {
    setExtras(current => current.map(item => (item.id === id ? { ...item, ...patch } : item)));
  }

  function removeExtra(id: string) {
    setExtras(current => current.filter(item => item.id !== id));
  }

  function quotationItems() {
    const items: Array<{
      id: string;
      category: string;
      label: string;
      details: string;
      quantity: number;
      unitPrice: number;
    }> = [];

    if (accommodationTotal > 0) {
      const stayDetails = [
        nights ? `${nights} night${nights === 1 ? "" : "s"}` : "",
        roomName,
        mealPlan,
        "per room",
      ].filter(Boolean).join(" · ");
      items.push({
        id: "stay",
        category: "stay",
        label: propertyName || "Accommodation",
        details: stayDetails,
        quantity: rooms,
        unitPrice: accommodationPerRoom,
      });
    }

    if (transferSeats > 0) {
      items.push({
        id: "transfer",
        category: "transfer",
        label: "Speedboat Transfer",
        details: `${transferSeats} seat${transferSeats === 1 ? "" : "s"} · ${money(transferUnitPrice, currency)} per seat`,
        quantity: transferSeats,
        unitPrice: transferUnitPrice,
      });
    }

    for (const item of extras) {
      if (!item.label.trim() || item.quantity < 1) continue;
      items.push({
        id: item.id,
        category: item.category,
        label: item.label.trim(),
        details: item.details.trim(),
        quantity: Math.max(1, Math.round(item.quantity)),
        unitPrice: Math.max(0, Number(item.unitPrice) || 0),
      });
    }
    return items;
  }

  async function generate() {
    if (saving) return;
    setStatus("");
    const items = quotationItems();
    if (!customerName.trim()) {
      setStatus("Enter the customer name.");
      return;
    }
    if (!items.length) {
      setStatus("Add accommodation, transfer, excursion or another quotation item.");
      return;
    }
    if ((checkIn && !checkOut) || (!checkIn && checkOut) || (checkIn && checkOut && checkOut <= checkIn)) {
      setStatus("Choose valid check-in and check-out dates.");
      return;
    }
    if (discountAmount > subtotal) {
      setStatus("Discount cannot be more than the subtotal.");
      return;
    }

    setSaving(true);
    try {
      const response = await fetch("/api/admin/quotations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customerName,
          customerEmail,
          customerPhone,
          propertyName,
          roomName,
          mealPlan,
          checkIn,
          checkOut,
          adults,
          children,
          rooms,
          currency,
          items,
          discountAmount,
          feesAmount,
          validHours,
          notes,
          terms,
        }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Unable to create quotation.");
      setCreated(data.quotation);
      setQuotations(current => [data.quotation, ...current]);
      setStatus(`Quotation ${data.quotation.reference} created.`);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Unable to create quotation.");
    } finally {
      setSaving(false);
    }
  }

  async function changeStatus(id: string, nextStatus: SavedQuotation["status"]) {
    setBusyId(id);
    setStatus("");
    try {
      const response = await fetch("/api/admin/quotations", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, status: nextStatus }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Unable to update quotation.");
      setQuotations(current =>
        current.map(item => (item.id === id ? { ...item, status: nextStatus } : item)),
      );
      if (created?.id === id) setCreated(current => current ? { ...current, status: nextStatus } : current);
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Unable to update quotation.");
    } finally {
      setBusyId("");
    }
  }

  function resetForm() {
    setCustomerName("");
    setCustomerEmail("");
    setCustomerPhone("");
    setCheckIn("");
    setCheckOut("");
    setAdults(2);
    setChildren(0);
    setRooms(1);
    setCurrency("USD");
    setPropertyName("");
    setRoomName("");
    setMealPlan("");
    setAccommodationPerRoom(0);
    setTransferSeats(0);
    setTransferUnitPrice(DEFAULT_SPEEDBOAT_SEAT_PRICE_USD);
    setExtras([]);
    setDiscountAmount(0);
    setFeesAmount(0);
    setValidHours(48);
    setNotes("");
    setCreated(null);
    setStatus("");
  }

  function absoluteShareUrl(quote: SavedQuotation) {
    if (typeof window === "undefined") return quote.share_url;
    return `${window.location.origin}${quote.share_url}`;
  }

  async function copyCreated() {
    if (!created) return;
    await navigator.clipboard.writeText(absoluteShareUrl(created));
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1600);
  }

  if (loading) {
    return <main className="container py-20 text-gray-400">Loading quotation builder...</main>;
  }

  return (
    <main className="container py-8 pb-28 md:py-14">
      <Link href="/admin" className="inline-flex min-h-11 items-center gap-2 text-sm text-gray-400 hover:text-white">
        <ArrowLeft className="h-4 w-4" /> Back to Admin
      </Link>

      <div className="mt-5 flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[.22em] text-gold">
            <FileText className="h-4 w-4" /> Tripelor Admin
          </p>
          <h1 className="mt-2 text-3xl font-semibold md:text-5xl">Quotation Builder</h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-gray-400">
            Build a professional customer quotation with stay, transfer, excursions, discounts and final selling price.
          </p>
        </div>
        <button type="button" onClick={resetForm} className="btn-outline min-h-[46px] gap-2 px-4 text-xs">
          <RefreshCw className="h-4 w-4" /> New Quote
        </button>
      </div>

      {status && (
        <div className="mt-5 rounded-xl border border-gold/25 bg-gold/[.06] p-4 text-sm text-white/80">
          {status}
        </div>
      )}

      {created && (
        <section className="mt-6 rounded-2xl border border-emerald-500/30 bg-emerald-500/[.07] p-5 md:p-6">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="flex items-center gap-2 text-sm font-semibold text-emerald-300">
                <CheckCircle2 className="h-5 w-5" /> Quotation ready
              </p>
              <p className="font-display mt-2 text-3xl text-white">{created.reference}</p>
              <p className="mt-2 text-sm text-gray-400">
                {created.customer_name} · {money(created.total, created.currency || "USD")}
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Link href={created.share_url} target="_blank" className="btn-gold min-h-[44px] px-4 text-xs">
                Open Quote
              </Link>
              <button type="button" onClick={copyCreated} className="btn-outline min-h-[44px] gap-2 px-4 text-xs">
                <Copy className="h-4 w-4" /> {copied ? "Copied" : "Copy Link"}
              </button>
              {created.customer_phone && (
                <a
                  target="_blank"
                  rel="noreferrer"
                  href={`https://wa.me/${created.customer_phone.replace(/\D/g, "")}?text=${encodeURIComponent(`Hello ${created.customer_name}, here is your Tripelor quotation ${created.reference}: ${absoluteShareUrl(created)}`)}`}
                  className="btn-outline min-h-[44px] gap-2 px-4 text-xs"
                >
                  <MessageCircle className="h-4 w-4" /> WhatsApp
                </a>
              )}
              {created.customer_email && (
                <a
                  href={`mailto:${encodeURIComponent(created.customer_email)}?subject=${encodeURIComponent(`Tripelor Quotation ${created.reference}`)}&body=${encodeURIComponent(`Hello ${created.customer_name},\n\nPlease find your Tripelor quotation here:\n${absoluteShareUrl(created)}\n\nTripelor`)}`}
                  className="btn-outline min-h-[44px] gap-2 px-4 text-xs"
                >
                  <Mail className="h-4 w-4" /> Email
                </a>
              )}
            </div>
          </div>
        </section>
      )}

      <section className="mt-7 grid gap-7 xl:grid-cols-[1fr_360px] xl:items-start">
        <div className="space-y-6">
          <Panel title="Customer & travel">
            <div className="mb-5 rounded-xl border border-gold/25 bg-gold/[.06] p-4">
              <label className="block max-w-xs text-sm font-medium text-gray-200">Quotation currency
                <select value={currency} onChange={event => changeCurrency(event.target.value as QuoteCurrency)} className={field}>
                  <option value="USD">USD · US dollars</option>
                  <option value="MVR">MVR · Maldivian rufiyaa</option>
                </select>
              </label>
              <p className="mt-2 text-xs leading-5 text-gray-400">Existing amounts convert when you switch currency at 1 USD = MVR {MVR_PER_USD.toFixed(2)}. You can edit every selling price afterward.</p>
            </div>
            <div className="grid gap-4 md:grid-cols-3">
              <Label title="Customer name">
                <input value={customerName} onChange={event => setCustomerName(event.target.value)} className={field} placeholder="Customer full name" />
              </Label>
              <Label title="Email">
                <input type="email" value={customerEmail} onChange={event => setCustomerEmail(event.target.value)} className={field} placeholder="customer@email.com" />
              </Label>
              <Label title="WhatsApp / phone">
                <input value={customerPhone} onChange={event => setCustomerPhone(event.target.value)} className={field} placeholder="+960..." />
              </Label>
              <Label title="Check-in">
                <input type="date" value={checkIn} onChange={event => setCheckIn(event.target.value)} className={field} />
              </Label>
              <Label title="Check-out">
                <input type="date" min={checkIn || undefined} value={checkOut} onChange={event => setCheckOut(event.target.value)} className={field} />
              </Label>
              <div className="grid grid-cols-3 gap-2">
                <NumberField label="Adults" value={adults} min={1} max={20} onChange={setAdults} />
                <NumberField label="Children" value={children} min={0} max={20} onChange={setChildren} />
                <NumberField label="Rooms" value={rooms} min={1} max={20} onChange={changeRooms} />
              </div>
            </div>
          </Panel>

          <Panel title="Accommodation">
            <div className="grid gap-4 md:grid-cols-3">
              <Label title="Property">
                <select value={propertyName} onChange={event => selectProperty(event.target.value)} className={field}>
                  <option value="">Manual / no property</option>
                  {properties.map(item => <option key={item.slug} value={item.name}>{item.name}</option>)}
                </select>
              </Label>
              <Label title="Room">
                <select value={roomName} onChange={event => setRoomName(event.target.value)} className={field} disabled={!property}>
                  <option value="">Select room</option>
                  {roomOptions.map(room => <option key={room.name} value={room.name}>{room.name}</option>)}
                </select>
              </Label>
              <Label title="Meal plan">
                <select value={mealPlan} onChange={event => setMealPlan(event.target.value)} className={field} disabled={!roomName}>
                  <option value="">Select meal plan</option>
                  {mealOptions.map(meal => <option key={meal} value={meal}>{meal}</option>)}
                </select>
              </Label>
            </div>

            <div className="mt-5 grid gap-4 md:grid-cols-[1fr_auto] md:items-end">
              <Label title={`Selling price per room for the stay · ${currency}`}>
                <input type="number" min={0} step="0.01" value={accommodationPerRoom} onChange={event => setAccommodationPerRoom(Math.max(0, Number(event.target.value) || 0))} className={field} />
              </Label>
              <button
                type="button"
                onClick={() => setAccommodationPerRoom(suggestedStayPerRoom)}
                disabled={!suggestedStayPerRoom}
                className="btn-outline min-h-12 px-4 text-xs disabled:opacity-40"
              >
                Use Published Rate · {money(suggestedStayPerRoom, currency)} / room
              </button>
            </div>
            <p className="mt-3 text-xs text-gray-500">
              {nights > 0 ? `${nights} night${nights === 1 ? "" : "s"} · ${rooms} room${rooms === 1 ? "" : "s"} × ${money(accommodationPerRoom, currency)} = ${money(accommodationTotal, currency)}` : "Choose dates to calculate the published price per room."}
            </p>
          </Panel>

          <Panel title="Transfer">
            <div className="grid gap-4 sm:grid-cols-3">
              <NumberField label="Speedboat seats" value={transferSeats} min={0} max={30} onChange={setTransferSeats} />
              <Label title={`Price per seat · ${currency}`}>
                <input type="number" min={0} step="0.01" value={transferUnitPrice} onChange={event => setTransferUnitPrice(Math.max(0, Number(event.target.value) || 0))} className={field} />
              </Label>
              <div className="rounded-xl border border-white/10 bg-white/[.03] p-4">
                <p className="text-[9px] uppercase tracking-[.14em] text-gray-500">Transfer total</p>
                <p className="mt-2 text-xl font-semibold text-gold">{money(transferTotal, currency)}</p>
              </div>
            </div>
          </Panel>

          <Panel title="Excursions & other items">
            <div className="flex flex-wrap gap-2">
              <button type="button" onClick={() => addExtra("excursion")} className="btn-outline min-h-[42px] gap-2 px-4 text-xs">
                <Plus className="h-4 w-4" /> Add Excursion
              </button>
              <button type="button" onClick={() => addExtra("other")} className="btn-outline min-h-[42px] gap-2 px-4 text-xs">
                <Plus className="h-4 w-4" /> Add Other
              </button>
            </div>

            <div className="mt-5 space-y-4">
              {extras.length === 0 ? (
                <p className="rounded-xl border border-dashed border-white/10 p-5 text-sm text-gray-500">
                  No additional items yet.
                </p>
              ) : extras.map(item => (
                <div key={item.id} className="rounded-xl border border-white/10 bg-black/20 p-4">
                  <div className="grid gap-3 lg:grid-cols-[120px_1fr_1fr_90px_130px_auto] lg:items-end">
                    <Label title="Type">
                      <select value={item.category} onChange={event => updateExtra(item.id, { category: event.target.value as ExtraItem["category"] })} className={field}>
                        <option value="excursion">Excursion</option>
                        <option value="other">Other</option>
                      </select>
                    </Label>
                    <Label title="Description">
                      <input value={item.label} onChange={event => updateExtra(item.id, { label: event.target.value })} className={field} placeholder="e.g. Turtle & Shark Snorkeling" />
                    </Label>
                    <Label title="Details">
                      <input value={item.details} onChange={event => updateExtra(item.id, { details: event.target.value })} className={field} placeholder="Optional inclusions / duration" />
                    </Label>
                    <Label title="Qty">
                      <input type="number" min={1} max={100} value={item.quantity} onChange={event => updateExtra(item.id, { quantity: Math.max(1, Number(event.target.value) || 1) })} className={field} />
                    </Label>
                    <Label title={`Unit price · ${currency}`}>
                      <input type="number" min={0} step="0.01" value={item.unitPrice} onChange={event => updateExtra(item.id, { unitPrice: Math.max(0, Number(event.target.value) || 0) })} className={field} />
                    </Label>
                    <button type="button" onClick={() => removeExtra(item.id)} className="flex h-12 w-12 items-center justify-center rounded-xl border border-red-500/20 text-red-300 hover:bg-red-500/10" aria-label="Remove item">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </Panel>

          <Panel title="Adjustments & conditions">
            <div className="grid gap-4 md:grid-cols-3">
              <Label title={`Discount · ${currency}`}>
                <input type="number" min={0} step="0.01" value={discountAmount} onChange={event => setDiscountAmount(Math.max(0, Number(event.target.value) || 0))} className={field} />
              </Label>
              <Label title={`Taxes / additional fees · ${currency}`}>
                <input type="number" min={0} step="0.01" value={feesAmount} onChange={event => setFeesAmount(Math.max(0, Number(event.target.value) || 0))} className={field} />
              </Label>
              <Label title="Validity">
                <select value={validHours} onChange={event => setValidHours(Number(event.target.value))} className={field}>
                  <option value={24}>24 hours</option>
                  <option value={48}>48 hours</option>
                  <option value={72}>72 hours</option>
                  <option value={168}>7 days</option>
                </select>
              </Label>
            </div>
            <div className="mt-4 grid gap-4 md:grid-cols-2">
              <Label title="Customer notes">
                <textarea rows={5} value={notes} onChange={event => setNotes(event.target.value)} className={field} placeholder="Honeymoon setup, arrival notes, special inclusions..." />
              </Label>
              <Label title="Quotation conditions">
                <textarea rows={5} value={terms} onChange={event => setTerms(event.target.value)} className={field} />
              </Label>
            </div>
          </Panel>
        </div>

        <aside className="rounded-2xl border border-gold/30 bg-[radial-gradient(circle_at_top_right,rgba(217,189,123,.12),transparent_30%),rgba(255,255,255,.025)] p-5 xl:sticky xl:top-24 md:p-6">
          <p className="text-[10px] font-semibold uppercase tracking-[.2em] text-gold">Quotation summary</p>
          <h2 className="font-display mt-3 text-3xl">{customerName || "Customer quotation"}</h2>

          <div className="mt-5 space-y-3 text-sm text-gray-400">
            {propertyName && <Summary label="Property" value={propertyName} />}
            {roomName && <Summary label="Room" value={roomName} />}
            {mealPlan && <Summary label="Meal" value={mealPlan} />}
            {nights > 0 && <Summary label="Stay" value={`${nights} nights · ${rooms} room${rooms === 1 ? "" : "s"}`} />}
            <Summary label="Guests" value={`${adults} adult${adults === 1 ? "" : "s"} · ${children} child${children === 1 ? "" : "ren"}`} />
          </div>

          <div className="mt-6 space-y-3 border-y border-white/10 py-5 text-sm">
            {accommodationTotal > 0 && <Summary label={`${rooms} room${rooms === 1 ? "" : "s"}`} value={money(accommodationTotal, currency)} />}
            {transferTotal > 0 && <Summary label="Transfer" value={money(transferTotal, currency)} />}
            {extraTotal > 0 && <Summary label="Excursions / other" value={money(extraTotal, currency)} />}
            <Summary label="Subtotal" value={money(subtotal, currency)} />
            {discountAmount > 0 && <Summary label="Discount" value={`− ${money(discountAmount, currency)}`} accent />}
            {feesAmount > 0 && <Summary label="Taxes / fees" value={money(feesAmount, currency)} />}
          </div>

          <p className="mt-6 text-[10px] uppercase tracking-[.18em] text-gray-500">Final selling price</p>
          <p className="font-display mt-2 text-5xl text-gold">{money(finalTotal, currency)}</p>
          {currency === "MVR" && (
            <div className="mt-3 space-y-1 text-xs leading-5 text-gray-400">
              <p>Bank details for confirmed bookings:</p>
              {QUOTATION_BANK_ACCOUNTS.map(account => (
                <p key={account.bank}>{account.bank}: <span className="break-all text-gray-200">{account.accountNumber}</span></p>
              ))}
            </div>
          )}

          <button type="button" onClick={generate} disabled={saving} className="btn-gold mt-6 w-full justify-center gap-2 disabled:opacity-50">
            <FileText className="h-4 w-4" /> {saving ? "Generating..." : "Generate Quotation"}
          </button>

          <p className="mt-4 text-xs leading-6 text-gray-500">
            The quotation creates a private share link. It is not a confirmed booking and does not hold inventory.
          </p>
        </aside>
      </section>

      <section className="mt-12">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[.2em] text-gold">Quotation history</p>
            <h2 className="mt-2 text-2xl font-semibold">Recent Quotations</h2>
          </div>
          <p className="text-sm text-gray-500">{quotations.length} saved</p>
        </div>

        <div className="mt-5 grid gap-4">
          {quotations.length === 0 ? (
            <div className="rounded-2xl border border-white/10 bg-white/[.02] p-8 text-center text-gray-500">
              No manual quotations yet.
            </div>
          ) : quotations.map(quote => (
            <article key={quote.id} className="rounded-2xl border border-white/10 bg-white/[.025] p-5">
              <div className="grid gap-5 lg:grid-cols-[1fr_auto]">
                <div>
                  <div className="flex flex-wrap items-center gap-3">
                    <span className="text-[10px] font-semibold uppercase tracking-[.16em] text-gold">{quote.reference}</span>
                    <span className="rounded-full border border-white/10 px-3 py-1 text-[10px] capitalize text-gray-300">{quote.status}</span>
                    {new Date(quote.valid_until).getTime() < Date.now() && (
                      <span className="rounded-full border border-amber-500/20 bg-amber-500/5 px-3 py-1 text-[10px] text-amber-300">Expired</span>
                    )}
                  </div>
                  <h3 className="mt-3 text-xl font-semibold">{quote.customer_name}</h3>
                  <p className="mt-1 text-sm text-gray-500">
                    {[quote.property_name, quote.room_name, quote.meal_plan].filter(Boolean).join(" · ") || "Custom quotation"}
                  </p>
                  <div className="mt-4 flex flex-wrap gap-x-6 gap-y-2 text-sm text-gray-400">
                    <span>{money(quote.total, quote.currency || "USD")}</span>
                    {quote.check_in && quote.check_out && <span>{quote.check_in} → {quote.check_out}</span>}
                    <span>Valid until {new Date(quote.valid_until).toLocaleString()}</span>
                  </div>
                  <div className="mt-4 flex flex-wrap gap-2">
                    <Link href={quote.share_url} target="_blank" className="btn-outline min-h-[40px] px-4 text-xs">Open</Link>
                    <button type="button" onClick={() => navigator.clipboard.writeText(absoluteShareUrl(quote))} className="btn-outline min-h-[40px] gap-2 px-4 text-xs"><Copy className="h-3.5 w-3.5" /> Copy Link</button>
                    {quote.customer_phone && <a href={`https://wa.me/${quote.customer_phone.replace(/\D/g, "")}?text=${encodeURIComponent(`Hello ${quote.customer_name}, here is your Tripelor quotation ${quote.reference}: ${absoluteShareUrl(quote)}`)}`} target="_blank" rel="noreferrer" className="btn-outline min-h-[40px] gap-2 px-4 text-xs"><MessageCircle className="h-3.5 w-3.5" /> WhatsApp</a>}
                  </div>
                </div>
                <div className="grid min-w-[160px] grid-cols-2 gap-2 lg:grid-cols-1">
                  {(["draft","sent","accepted","cancelled"] as SavedQuotation["status"][]).map(next => (
                    <button
                      key={next}
                      type="button"
                      disabled={busyId === quote.id || quote.status === next}
                      onClick={() => changeStatus(quote.id, next)}
                      className={`min-h-9 rounded-full border px-3 text-[11px] font-semibold capitalize disabled:opacity-35 ${quote.status === next ? "border-gold bg-gold text-black" : "border-white/10 text-gray-400 hover:border-gold/30 hover:text-white"}`}
                    >
                      {next}
                    </button>
                  ))}
                </div>
              </div>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}

function Panel({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-2xl border border-white/10 bg-white/[.025] p-5 md:p-6">
      <h2 className="text-lg font-semibold">{title}</h2>
      <div className="mt-5">{children}</div>
    </section>
  );
}

function Label({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <label className="block text-sm font-medium text-gray-300">
      {title}
      {children}
    </label>
  );
}

function NumberField({
  label,
  value,
  min,
  max,
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  onChange: (value: number) => void;
}) {
  return (
    <Label title={label}>
      <input
        type="number"
        min={min}
        max={max}
        value={value}
        onChange={event => onChange(Math.min(max, Math.max(min, Number(event.target.value) || min)))}
        className={field}
      />
    </Label>
  );
}

function Summary({ label, value, accent = false }: { label: string; value: string; accent?: boolean }) {
  return (
    <p className="flex justify-between gap-4">
      <span>{label}</span>
      <strong className={accent ? "text-emerald-300" : "text-white"}>{value}</strong>
    </p>
  );
}

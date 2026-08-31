"use client";

import Link from "next/link";
import {useEffect, useMemo, useState} from "react";
import {
  BedDouble,
  CalendarCheck,
  CalendarX,
  Clock3,
  CreditCard,
  DollarSign,
  RefreshCw,
  Ship,
  Sparkles,
  Waves,
} from "lucide-react";

const todayMaldives = () =>
  new Intl.DateTimeFormat("en-CA", {
    timeZone: "Indian/Maldives",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());

const active = (booking: any) =>
  !["cancelled", "completed"].includes(String(booking.status || "").toLowerCase());

const money = (amount: number) =>
  "$" + amount.toLocaleString(undefined, {minimumFractionDigits: 0, maximumFractionDigits: 2});

export default function AdminCommandCenter() {
  const [data, setData] = useState<any>({bookings: [], sales: [], services: [], preArrivals: []});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function load() {
    setLoading(true);
    try {
      const response = await fetch("/api/admin/command-center", {cache: "no-store"});
      const value = await response.json();
      if (!response.ok) throw new Error(value.error || "Unable to load command center");
      setData(value);
      setError("");
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Unable to load");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  const metrics = useMemo(() => {
    const today = todayMaldives();
    const bookings = data.bookings || [];
    const sales = data.sales || [];
    const services = data.services || [];
    const concierge = data.preArrivals || [];
    const bookingById = new Map(bookings.map((booking: any) => [booking.id, booking]));
    const arrivals = bookings.filter((booking: any) => active(booking) && booking.check_in === today);
    const departures = bookings.filter((booking: any) => active(booking) && booking.check_out === today);
    const inhouse = bookings.filter(
      (booking: any) => active(booking) && booking.check_in <= today && booking.check_out > today,
    );
    const pending = bookings.filter(
      (booking: any) => String(booking.status || "").toLowerCase() === "pending",
    );
    const due = bookings.filter(
      (booking: any) =>
        active(booking) && String(booking.payment_status || "unpaid").toLowerCase() !== "paid",
    );
    const openServices = services.filter(
      (request: any) =>
        !["completed", "cancelled", "resolved"].includes(String(request.status || "").toLowerCase()),
    );
    const openConcierge = concierge
      .filter((request: any) => String(request.status || "").toLowerCase() !== "confirmed")
      .map((request: any) => ({...request, booking: bookingById.get(request.reservation_id)}));
    const paid = sales.filter(
      (sale: any) => String(sale.payment_status || "").toLowerCase() === "paid",
    );
    const revenue = paid.reduce((total: number, sale: any) => total + Number(sale.amount_usd || 0), 0);
    const todaySales = sales
      .filter((sale: any) => sale.sale_date === today)
      .reduce((total: number, sale: any) => total + Number(sale.amount_usd || 0), 0);
    const boats = bookings
      .filter(
        (booking: any) =>
          active(booking) && Number(booking.speedboat_seats || 0) > 0 && booking.check_in >= today,
      )
      .slice(0, 8);

    return {
      arrivals,
      boats,
      departures,
      due,
      inhouse,
      openConcierge,
      openServices,
      pending,
      revenue,
      today,
      todaySales,
    };
  }, [data]);

  const totalRooms = 8;
  const occupied = Math.min(
    totalRooms,
    metrics.inhouse.reduce((total: number, booking: any) => total + Number(booking.rooms || 1), 0),
  );
  const occupancy = Math.round((occupied / totalRooms) * 100);

  if (loading) return <section className="card mt-8 p-8 text-gray-400">Loading Command Center...</section>;

  const stats = [
    [CalendarCheck, "Arrivals", metrics.arrivals.length],
    [CalendarX, "Departures", metrics.departures.length],
    [BedDouble, "Occupancy", occupancy + "%"],
    [Clock3, "Pending", metrics.pending.length],
    [CreditCard, "Payments due", metrics.due.length],
    [Waves, "Guest requests", metrics.openServices.length],
    [Sparkles, "Pre-arrival", metrics.openConcierge.length],
    [DollarSign, "Today sales", money(metrics.todaySales)],
    [DollarSign, "Paid revenue", money(metrics.revenue)],
  ];

  return (
    <section className="mt-8">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-[.3em] text-gold">Live Operations</p>
          <h2 className="mt-1 text-3xl font-bold">Command Center</h2>
          <p className="mt-1 text-sm text-gray-400">Maldives date · {metrics.today}</p>
        </div>
        <button onClick={load} className="btn-outline gap-2">
          <RefreshCw className="h-4 w-4" /> Refresh
        </button>
      </div>

      {error && <p className="mt-4 rounded-xl border border-red-500/20 p-4 text-red-300">{error}</p>}

      <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-9">
        {stats.map(([Icon, label, value]: any) => (
          <div key={label} className="card p-4">
            <Icon className="h-5 w-5 text-gold" />
            <p className="mt-3 text-xs text-gray-500">{label}</p>
            <p className="mt-1 text-2xl font-bold">{value}</p>
          </div>
        ))}
      </div>

      <div className="mt-6 grid gap-5 xl:grid-cols-3">
        <Panel title="Today’s Arrivals" icon={CalendarCheck} rows={metrics.arrivals} />
        <Panel title="Today’s Departures" icon={CalendarX} rows={metrics.departures} />
        <div className="card p-5">
          <div className="flex items-center gap-2">
            <Ship className="h-5 w-5 text-gold" />
            <h3 className="font-bold">Upcoming Speedboats</h3>
          </div>
          <div className="mt-4 space-y-3">
            {metrics.boats.length ? (
              metrics.boats.map((booking: any) => (
                <div key={booking.id} className="rounded-xl border border-white/10 p-3">
                  <b>{booking.guest_name || "Guest"}</b>
                  <p className="text-xs text-gray-400">
                    {booking.check_in} · {booking.speedboat_seats} seat(s) · {booking.property_name}
                  </p>
                </div>
              ))
            ) : (
              <Empty />
            )}
          </div>
        </div>
      </div>

      <div className="card mt-5 p-5">
        <div className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-gold" />
          <div>
            <h3 className="font-bold">Pre-Arrival Concierge</h3>
            <p className="mt-1 text-xs text-gray-500">New guest preferences awaiting Tripelor review</p>
          </div>
        </div>
        <div className="mt-4 grid gap-3 lg:grid-cols-2">
          {metrics.openConcierge.length ? (
            metrics.openConcierge.slice(0, 8).map((request: any) => (
              <ConciergeRequest key={request.id} request={request} />
            ))
          ) : (
            <Empty />
          )}
        </div>
      </div>

      <div className="mt-5 grid gap-5 lg:grid-cols-2">
        <div className="card p-5">
          <div className="flex items-center justify-between">
            <h3 className="font-bold">Needs Attention</h3>
            <Link href="#bookings" className="text-xs text-gold">Bookings →</Link>
          </div>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <Stat label="Pending confirmations" value={metrics.pending.length} />
            <Stat label="Unpaid / payment due" value={metrics.due.length} />
            <Stat label="Open guest requests" value={metrics.openServices.length} />
            <Stat label="Pre-arrival requests" value={metrics.openConcierge.length} />
            <Stat label="Rooms occupied tonight" value={occupied + "/" + totalRooms} />
          </div>
        </div>
        <div className="card p-5">
          <h3 className="font-bold">Quick Actions</h3>
          <div className="mt-4 flex flex-wrap gap-2">
            <Link href="/admin/room-calendar" className="btn-outline">Room Calendar</Link>
            <Link href="/admin/sales" className="btn-outline">Sales & Revenue</Link>
            <Link href="#bookings" className="btn-outline">Manage Bookings</Link>
          </div>
        </div>
      </div>
    </section>
  );
}

function ConciergeRequest({request}: {request: any}) {
  const booking = request.booking || {};
  const details = [
    request.flight_number && "Flight " + request.flight_number,
    request.transfer_required && "Transfer requested",
    request.dietary_requirements && "Dietary notes",
    request.allergies && "Allergy notes",
    request.celebration_type && request.celebration_type !== "none" && request.celebration_type,
    request.early_check_in && "Early check-in",
    request.late_check_out && "Late checkout",
  ].filter(Boolean);

  return (
    <article className="rounded-xl border border-gold/15 bg-gold/[.04] p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <b>{booking.guest_name || request.guest_email || "Guest"}</b>
          <p className="mt-1 text-xs text-gray-400">
            {booking.property_name || "Tripelor stay"} · {booking.check_in || "Upcoming"}
          </p>
        </div>
        <span className="rounded-full border border-amber-300/20 bg-amber-300/10 px-2 py-1 text-[9px] uppercase tracking-[.12em] text-amber-200">
          {request.status || "submitted"}
        </span>
      </div>
      {details.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-2">
          {details.map(detail => (
            <span key={String(detail)} className="rounded-full border border-white/10 px-2 py-1 text-[10px] text-gray-300">
              {detail}
            </span>
          ))}
        </div>
      )}
      {request.notes && <p className="mt-3 line-clamp-2 text-xs leading-5 text-gray-400">{request.notes}</p>}
    </article>
  );
}

function Panel({title, icon: Icon, rows}: {title: string; icon: any; rows: any[]}) {
  return (
    <div className="card p-5">
      <div className="flex items-center gap-2">
        <Icon className="h-5 w-5 text-gold" />
        <h3 className="font-bold">{title}</h3>
      </div>
      <div className="mt-4 space-y-3">
        {rows.length ? (
          rows.map(booking => (
            <div key={booking.id} className="rounded-xl border border-white/10 p-3">
              <b>{booking.guest_name || "Guest"}</b>
              <p className="text-xs text-gray-400">{booking.property_name} · {booking.room_type}</p>
            </div>
          ))
        ) : (
          <Empty />
        )}
      </div>
    </div>
  );
}

function Stat({label, value}: {label: string; value: any}) {
  return (
    <div className="rounded-xl bg-white/[.04] p-4">
      <p className="text-xs text-gray-500">{label}</p>
      <b className="mt-1 block text-xl">{value}</b>
    </div>
  );
}

function Empty() {
  return <p className="py-5 text-sm text-gray-500">Nothing scheduled.</p>;
}

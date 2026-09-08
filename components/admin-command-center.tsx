"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  ArrowRight,
  BedDouble,
  CalendarCheck,
  CalendarX,
  CircleDollarSign,
  Clock3,
  CreditCard,
  RefreshCw,
  TrendingUp,
  Users,
  Waves,
} from "lucide-react";

const TODAY = () =>
  new Intl.DateTimeFormat("en-CA", {
    timeZone: "Indian/Maldives",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());

const activeBooking = (booking: any) =>
  !["cancelled", "completed"].includes(String(booking.status || "").toLowerCase());

const money = (value: number) =>
  `USD ${Number(value || 0).toLocaleString(undefined, {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  })}`;

export default function AdminCommandCenter() {
  const [data, setData] = useState<any>({ bookings: [], sales: [], services: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function load() {
    setLoading(true);
    try {
      const response = await fetch("/api/admin/command-center", { cache: "no-store" });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Unable to load admin overview.");
      setData(result);
      setError("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to load admin overview.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  const metrics = useMemo(() => {
    const today = TODAY();
    const month = today.slice(0, 7);
    const bookings = data.bookings || [];
    const sales = data.sales || [];
    const services = data.services || [];

    const arrivals = bookings.filter((b: any) => activeBooking(b) && b.check_in === today);
    const departures = bookings.filter((b: any) => activeBooking(b) && b.check_out === today);
    const inHouse = bookings.filter(
      (b: any) => activeBooking(b) && b.check_in <= today && b.check_out > today,
    );
    const pendingBookings = bookings.filter(
      (b: any) => String(b.status || "").toLowerCase() === "pending",
    );
    const paymentDue = bookings.filter(
      (b: any) =>
        activeBooking(b) && String(b.payment_status || "unpaid").toLowerCase() !== "paid",
    );
    const openRequests = services.filter(
      (service: any) =>
        !["completed", "cancelled", "resolved"].includes(
          String(service.status || "").toLowerCase(),
        ),
    );

    const paidSales = sales.filter(
      (sale: any) => String(sale.payment_status || "").toLowerCase() === "paid",
    );
    const paidRevenue = paidSales.reduce(
      (total: number, sale: any) => total + Number(sale.amount_usd || 0),
      0,
    );
    const monthRevenue = sales
      .filter(
        (sale: any) =>
          String(sale.sale_date || "").startsWith(month) &&
          String(sale.payment_status || "").toLowerCase() !== "refunded",
      )
      .reduce((total: number, sale: any) => total + Number(sale.amount_usd || 0), 0);
    const todaySales = sales
      .filter((sale: any) => sale.sale_date === today)
      .reduce((total: number, sale: any) => total + Number(sale.amount_usd || 0), 0);
    const pendingSales = sales
      .filter((sale: any) => ["pending", "partial"].includes(String(sale.payment_status || "").toLowerCase()))
      .reduce((total: number, sale: any) => total + Number(sale.amount_usd || 0), 0);

    const totalRooms = 8;
    const occupied = Math.min(
      totalRooms,
      inHouse.reduce((total: number, booking: any) => total + Number(booking.rooms || 1), 0),
    );
    const occupancy = Math.round((occupied / totalRooms) * 100);

    return {
      today,
      arrivals,
      departures,
      inHouse,
      pendingBookings,
      paymentDue,
      openRequests,
      paidRevenue,
      monthRevenue,
      todaySales,
      pendingSales,
      occupied,
      totalRooms,
      occupancy,
      salesCount: sales.length,
    };
  }, [data]);

  if (loading) {
    return (
      <section className="mt-7 rounded-2xl border border-white/10 bg-white/[.025] p-7 text-gray-400">
        Loading business overview...
      </section>
    );
  }

  return (
    <section className="mt-7">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[.24em] text-gold">Business overview</p>
          <h2 className="mt-2 text-2xl font-semibold md:text-3xl">What needs your attention</h2>
          <p className="mt-1 text-sm text-gray-400">Maldives date · {metrics.today}</p>
        </div>
        <button onClick={load} className="btn-outline min-h-[44px] w-fit gap-2 px-4 py-2 text-xs">
          <RefreshCw className="h-4 w-4" /> Refresh
        </button>
      </div>

      {error && (
        <p className="mt-4 rounded-xl border border-red-500/20 bg-red-500/[.05] p-4 text-sm text-red-300">
          {error}
        </p>
      )}

      <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard
          icon={CircleDollarSign}
          label="Paid revenue"
          value={money(metrics.paidRevenue)}
          note={`${metrics.salesCount} sales entries recorded`}
          href="/admin/sales"
        />
        <KpiCard
          icon={TrendingUp}
          label="This month"
          value={money(metrics.monthRevenue)}
          note={`Today ${money(metrics.todaySales)}`}
          href="/admin/sales"
        />
        <KpiCard
          icon={Clock3}
          label="Bookings to action"
          value={metrics.pendingBookings.length}
          note="Waiting for confirmation"
          href="#bookings"
        />
        <KpiCard
          icon={CreditCard}
          label="Payments due"
          value={metrics.paymentDue.length}
          note={`${money(metrics.pendingSales)} pending / partial sales`}
          href="#bookings"
        />
      </div>

      <div className="mt-4 grid gap-4 xl:grid-cols-[1.15fr_.85fr]">
        <div className="rounded-2xl border border-white/10 bg-white/[.025] p-5 md:p-6">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[.16em] text-gray-500">Today</p>
              <h3 className="mt-1 text-lg font-semibold">Guest movement</h3>
            </div>
            <Link href="/admin/room-calendar" className="text-xs font-semibold text-gold">
              Calendar →
            </Link>
          </div>

          <div className="mt-5 grid gap-3 sm:grid-cols-3">
            <MiniStat icon={CalendarCheck} label="Arrivals" value={metrics.arrivals.length} />
            <MiniStat icon={CalendarX} label="Departures" value={metrics.departures.length} />
            <MiniStat icon={BedDouble} label="Occupancy" value={`${metrics.occupancy}%`} />
          </div>

          <div className="mt-5 grid gap-3 md:grid-cols-2">
            <GuestList title="Arriving today" rows={metrics.arrivals} />
            <GuestList title="Leaving today" rows={metrics.departures} />
          </div>
        </div>

        <div className="rounded-2xl border border-white/10 bg-white/[.025] p-5 md:p-6">
          <p className="text-xs font-semibold uppercase tracking-[.16em] text-gray-500">Priority queue</p>
          <h3 className="mt-1 text-lg font-semibold">Needs attention</h3>

          <div className="mt-5 space-y-3">
            <AttentionRow
              icon={Clock3}
              label="Pending confirmations"
              value={metrics.pendingBookings.length}
              href="#bookings"
            />
            <AttentionRow
              icon={CreditCard}
              label="Bookings with payment due"
              value={metrics.paymentDue.length}
              href="#bookings"
            />
            <AttentionRow
              icon={Waves}
              label="Open guest requests"
              value={metrics.openRequests.length}
              href="#pre-arrival-concierge"
            />
            <AttentionRow
              icon={Users}
              label="Rooms occupied tonight"
              value={`${metrics.occupied}/${metrics.totalRooms}`}
              href="/admin/room-calendar"
            />
          </div>

          <div className="mt-5 grid grid-cols-2 gap-2 border-t border-white/10 pt-5">
            <Link href="/admin/sales" className="btn-gold min-h-[46px] px-3 text-xs">
              Sales
            </Link>
            <Link href="#bookings" className="btn-outline min-h-[46px] px-3 text-xs">
              Bookings
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}

function KpiCard({
  icon: Icon,
  label,
  value,
  note,
  href,
}: {
  icon: any;
  label: string;
  value: any;
  note: string;
  href: string;
}) {
  return (
    <Link
      href={href}
      className="group rounded-2xl border border-white/10 bg-white/[.025] p-5 transition hover:border-gold/30 hover:bg-white/[.04]"
    >
      <div className="flex items-start justify-between gap-3">
        <Icon className="h-5 w-5 text-gold" />
        <ArrowRight className="h-4 w-4 text-white/25 transition group-hover:translate-x-1 group-hover:text-gold" />
      </div>
      <p className="mt-5 text-xs font-medium text-gray-400">{label}</p>
      <p className="mt-1 text-2xl font-semibold md:text-3xl">{value}</p>
      <p className="mt-2 text-xs leading-5 text-gray-500">{note}</p>
    </Link>
  );
}

function MiniStat({ icon: Icon, label, value }: { icon: any; label: string; value: any }) {
  return (
    <div className="rounded-xl bg-white/[.04] p-4">
      <Icon className="h-4 w-4 text-gold" />
      <p className="mt-3 text-xs text-gray-500">{label}</p>
      <p className="mt-1 text-xl font-semibold">{value}</p>
    </div>
  );
}

function GuestList({ title, rows }: { title: string; rows: any[] }) {
  return (
    <div className="rounded-xl border border-white/10 p-4">
      <p className="text-xs font-semibold text-gray-400">{title}</p>
      <div className="mt-3 space-y-3">
        {rows.length ? (
          rows.slice(0, 4).map((booking) => (
            <div key={booking.id} className="border-t border-white/10 pt-3 first:border-0 first:pt-0">
              <p className="text-sm font-semibold">{booking.guest_name || "Guest"}</p>
              <p className="mt-1 text-xs text-gray-500">
                {booking.property_name} · {booking.room_type}
              </p>
            </div>
          ))
        ) : (
          <p className="py-3 text-sm text-gray-500">Nothing scheduled.</p>
        )}
      </div>
    </div>
  );
}

function AttentionRow({
  icon: Icon,
  label,
  value,
  href,
}: {
  icon: any;
  label: string;
  value: any;
  href: string;
}) {
  return (
    <Link href={href} className="flex min-h-[54px] items-center gap-3 rounded-xl bg-white/[.04] px-4 py-3">
      <Icon className="h-4 w-4 shrink-0 text-gold" />
      <span className="min-w-0 flex-1 text-sm text-gray-300">{label}</span>
      <strong className="text-base text-white">{value}</strong>
    </Link>
  );
}

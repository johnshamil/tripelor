"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  CalendarDays,
  Building2,
  CheckCircle2,
  CircleDollarSign,
  Clock3,
  CreditCard,
  Search,
  ShieldCheck,
  Users,
  XCircle,
} from "lucide-react";
import AdminCommandCenter from "@/components/admin-command-center";
import AdminPreArrival from "@/components/admin-pre-arrival";

type BookingFilter = "all" | "pending" | "confirmed" | "completed" | "cancelled";
type PaymentFilter = "all" | "paid" | "due";

const bookingStatusOrder: Record<string, number> = {
  pending: 0,
  confirmed: 1,
  completed: 2,
  cancelled: 3,
};

export default function AdminPage() {
  const [bookings, setBookings] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState("");
  const [busyId, setBusyId] = useState("");
  const [query, setQuery] = useState("");
  const [bookingFilter, setBookingFilter] = useState<BookingFilter>("all");
  const [paymentFilter, setPaymentFilter] = useState<PaymentFilter>("all");

  async function load() {
    const [bookingResponse, userResponse] = await Promise.all([
      fetch("/api/admin/bookings", { cache: "no-store" }),
      fetch("/api/admin/users", { cache: "no-store" }),
    ]);
    const bookingResult = await bookingResponse.json();
    const userResult = await userResponse.json();
    if (!bookingResponse.ok) throw new Error(bookingResult.error || "Unable to load bookings.");
    if (!userResponse.ok) throw new Error(userResult.error || "Unable to load users.");
    setBookings(bookingResult.bookings || []);
    setUsers(userResult.users || []);
  }

  useEffect(() => {
    (async () => {
      try {
        const me = await fetch("/api/auth/me", { cache: "no-store" });
        const meResult = await me.json();
        if (!meResult.user) {
          window.location.href = "/login";
          return;
        }
        if (!meResult.user.isAdmin) {
          setStatus("You do not have admin access.");
          return;
        }
        await load();
      } catch (error) {
        setStatus(error instanceof Error ? error.message : "Unable to load admin dashboard.");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  async function changeStatus(id: string, nextStatus: string) {
    if (!id) return;
    setBusyId(id);
    try {
      const response = await fetch("/api/admin/bookings/status", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reservationId: id, status: nextStatus }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Unable to update booking.");
      setStatus(
        nextStatus === "completed"
          ? `Stay completed. ${Number(result?.loyalty?.points_awarded || 0)} loyalty points awarded.`
          : `Booking ${nextStatus}.`,
      );
      await load();
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Unable to update booking.");
    } finally {
      setBusyId("");
    }
  }

  const bookingCounts = useMemo(() => {
    const counts = { all: bookings.length, pending: 0, confirmed: 0, completed: 0, cancelled: 0 };
    bookings.forEach((booking) => {
      const key = String(booking.status || "pending").toLowerCase();
      if (key in counts && key !== "all") counts[key as keyof typeof counts] += 1;
    });
    return counts;
  }, [bookings]);

  const bookingValue = useMemo(
    () =>
      bookings
        .filter((booking) => String(booking.status || "").toLowerCase() !== "cancelled")
        .reduce(
          (total, booking) =>
            total + Number(booking.estimated_total || 0) + Number(booking.speedboat_total || 0),
          0,
        ),
    [bookings],
  );

  const paymentDueCount = useMemo(
    () =>
      bookings.filter(
        (booking) =>
          !["cancelled", "completed"].includes(String(booking.status || "").toLowerCase()) &&
          String(booking.payment_status || "unpaid").toLowerCase() !== "paid",
      ).length,
    [bookings],
  );

  const visibleBookings = useMemo(() => {
    const search = query.trim().toLowerCase();
    return [...bookings]
      .filter((booking) => {
        const bookingStatus = String(booking.status || "pending").toLowerCase();
        const paymentStatus = String(booking.payment_status || "unpaid").toLowerCase();
        const text = [
          booking.guest_name,
          booking.guest_email,
          booking.property_name,
          booking.room_type,
          booking.booking_source,
          booking.booking_reference,
          booking.package_name,
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();

        const matchesSearch = !search || text.includes(search);
        const matchesBooking = bookingFilter === "all" || bookingStatus === bookingFilter;
        const matchesPayment =
          paymentFilter === "all" ||
          (paymentFilter === "paid" && paymentStatus === "paid") ||
          (paymentFilter === "due" && paymentStatus !== "paid");

        return matchesSearch && matchesBooking && matchesPayment;
      })
      .sort((a, b) => {
        const aStatus = String(a.status || "pending").toLowerCase();
        const bStatus = String(b.status || "pending").toLowerCase();
        const statusDiff =
          (bookingStatusOrder[aStatus] ?? 9) - (bookingStatusOrder[bStatus] ?? 9);
        if (statusDiff !== 0) return statusDiff;
        return String(a.check_in || "9999-99-99").localeCompare(String(b.check_in || "9999-99-99"));
      });
  }, [bookings, query, bookingFilter, paymentFilter]);

  if (loading) {
    return <main className="container py-20 text-gray-400">Loading admin dashboard...</main>;
  }

  return (
    <main className="container py-8 pb-28 md:py-14">
      <div className="rounded-2xl border border-white/10 bg-white/[.02] p-5 md:p-7">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[.24em] text-gold">
              <ShieldCheck className="h-4 w-4" /> Tripelor Admin
            </p>
            <h1 className="mt-2 text-3xl font-semibold md:text-5xl">Business Dashboard</h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-gray-400 md:text-base">
              See bookings, sales, payments and guest movement without digging through multiple screens.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap">
            <Link href="/admin/sales" className="btn-gold min-h-[46px] gap-2 px-4 text-xs">
              <CircleDollarSign className="h-4 w-4" /> Sales
            </Link>
            <Link href="/admin/room-calendar" className="btn-outline min-h-[46px] gap-2 px-4 text-xs">
              <CalendarDays className="h-4 w-4" /> Calendar
            </Link>
            <Link href="/admin/properties" className="btn-outline min-h-[46px] gap-2 px-4 text-xs">
              <Building2 className="h-4 w-4" /> Properties
            </Link>
            <Link href="#bookings" className="btn-outline min-h-[46px] px-4 text-xs">
              Bookings
            </Link>
            <Link href="#pre-arrival-concierge" className="btn-outline min-h-[46px] px-4 text-xs">
              Concierge
            </Link>
          </div>
        </div>
      </div>

      {status && (
        <div className="mt-4 rounded-xl border border-gold/20 bg-gold/[.05] p-4 text-sm text-white/80">
          {status}
        </div>
      )}

      <AdminCommandCenter />

      <section id="bookings" className="mt-9 scroll-mt-24">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[.22em] text-gold">Booking workspace</p>
            <h2 className="mt-2 text-2xl font-semibold md:text-3xl">Bookings & payments</h2>
            <p className="mt-1 text-sm text-gray-400">Search a guest, check payment, and update booking status from one place.</p>
          </div>

          <div className="grid grid-cols-3 gap-2 text-center sm:flex sm:text-left">
            <SummaryPill label="Bookings" value={bookings.length} icon={CalendarDays} />
            <SummaryPill label="Payment due" value={paymentDueCount} icon={CreditCard} />
            <SummaryPill label="Booking value" value={`$${bookingValue.toFixed(0)}`} icon={CircleDollarSign} />
          </div>
        </div>

        <div className="mt-5 rounded-2xl border border-white/10 bg-white/[.02] p-4 md:p-5">
          <div className="grid gap-3 lg:grid-cols-[1fr_auto]">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search guest, property, room, reference or source"
                className="min-h-[50px] w-full rounded-xl border border-white/10 bg-black/25 pl-11 pr-4 text-sm outline-none transition focus:border-gold/50"
              />
            </div>
            <select
              value={paymentFilter}
              onChange={(event) => setPaymentFilter(event.target.value as PaymentFilter)}
              className="min-h-[50px] rounded-xl border border-white/10 bg-black px-4 text-sm"
            >
              <option value="all">All payments</option>
              <option value="due">Payment due</option>
              <option value="paid">Paid</option>
            </select>
          </div>

          <div className="mt-3 flex gap-2 overflow-x-auto pb-1">
            {(["all", "pending", "confirmed", "completed", "cancelled"] as BookingFilter[]).map(
              (filter) => (
                <button
                  key={filter}
                  type="button"
                  onClick={() => setBookingFilter(filter)}
                  className={`min-h-[42px] whitespace-nowrap rounded-full border px-4 text-xs font-semibold capitalize transition ${
                    bookingFilter === filter
                      ? "border-gold bg-gold text-black"
                      : "border-white/10 bg-white/[.03] text-gray-400 hover:border-gold/30 hover:text-white"
                  }`}
                >
                  {filter} · {bookingCounts[filter]}
                </button>
              ),
            )}
          </div>
        </div>

        <div className="mt-4 grid gap-3 md:hidden">
          {visibleBookings.length === 0 ? (
            <EmptyBookings />
          ) : (
            visibleBookings.map((booking, index) => (
              <BookingMobileCard
                key={booking.id || index}
                booking={booking}
                busyId={busyId}
                changeStatus={changeStatus}
              />
            ))
          )}
        </div>

        <div className="mt-4 hidden overflow-x-auto rounded-2xl border border-white/10 md:block">
          <table className="min-w-[1050px] w-full text-left text-sm">
            <thead className="bg-white/[.04] text-xs uppercase tracking-[.08em] text-gray-400">
              <tr>
                <th className="p-4">Guest</th>
                <th className="p-4">Stay</th>
                <th className="p-4">Dates</th>
                <th className="p-4">Payment</th>
                <th className="p-4">Source</th>
                <th className="p-4">Booking status</th>
                <th className="p-4">Action</th>
              </tr>
            </thead>
            <tbody>
              {visibleBookings.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-10 text-center text-gray-500">No bookings match these filters.</td>
                </tr>
              ) : (
                visibleBookings.map((booking, index) => (
                  <BookingTableRow
                    key={booking.id || index}
                    booking={booking}
                    busyId={busyId}
                    changeStatus={changeStatus}
                  />
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>

      <AdminPreArrival />

      <section className="mt-9 rounded-2xl border border-white/10 bg-white/[.02] p-5 md:p-6">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <Users className="h-5 w-5 text-gold" />
            <div>
              <h2 className="text-lg font-semibold">Customers</h2>
              <p className="text-xs text-gray-500">{users.length} registered accounts</p>
            </div>
          </div>
          <Link href="/account" className="text-xs font-semibold text-gold">My account →</Link>
        </div>

        <div className="mt-4 grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
          {users.slice(0, 8).map((user: any) => (
            <div key={user.id} className="rounded-xl bg-white/[.035] p-4">
              <p className="truncate text-sm font-semibold">{user.fullName || "Tripelor Customer"}</p>
              <p className="mt-1 truncate text-xs text-gray-500">{user.email}</p>
              <p className="mt-2 text-[10px] uppercase tracking-[.1em] text-gold">
                {user.isAdmin ? "Admin" : user.confirmedAt ? "Confirmed" : "Unconfirmed"}
              </p>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}

function SummaryPill({ label, value, icon: Icon }: { label: string; value: any; icon: any }) {
  return (
    <div className="rounded-xl border border-white/10 bg-white/[.025] px-3 py-3 sm:min-w-[130px] sm:px-4">
      <div className="flex items-center justify-center gap-1.5 sm:justify-start">
        <Icon className="h-3.5 w-3.5 text-gold" />
        <span className="hidden text-[10px] uppercase tracking-[.1em] text-gray-500 sm:inline">{label}</span>
      </div>
      <p className="mt-1 text-lg font-semibold sm:text-xl">{value}</p>
      <p className="text-[9px] text-gray-500 sm:hidden">{label}</p>
    </div>
  );
}

function statusTone(status: string) {
  if (status === "confirmed") return "border-emerald-500/30 bg-emerald-500/10 text-emerald-300";
  if (status === "completed") return "border-sky-500/30 bg-sky-500/10 text-sky-300";
  if (status === "cancelled") return "border-red-500/30 bg-red-500/10 text-red-300";
  return "border-amber-500/30 bg-amber-500/10 text-amber-300";
}

function BookingMobileCard({
  booking,
  busyId,
  changeStatus,
}: {
  booking: any;
  busyId: string;
  changeStatus: (id: string, status: string) => void;
}) {
  const bookingStatus = String(booking.status || "pending").toLowerCase();
  const paymentStatus = String(booking.payment_status || "unpaid").toLowerCase();
  const id = String(booking.id || "");
  const value = Number(booking.estimated_total || 0) + Number(booking.speedboat_total || 0);

  return (
    <article className="rounded-2xl border border-white/10 bg-white/[.025] p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate font-semibold">{booking.guest_name || "Guest"}</p>
          <p className="mt-1 truncate text-xs text-gray-500">{booking.guest_email || "No email"}</p>
        </div>
        <span className={`rounded-full border px-3 py-1.5 text-[10px] font-semibold capitalize ${statusTone(bookingStatus)}`}>
          {bookingStatus}
        </span>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-3 text-xs">
        <InfoCell label="Stay" value={booking.property_name || "—"} sub={booking.room_type || ""} />
        <InfoCell label="Dates" value={booking.check_in || "—"} sub={booking.check_out ? `to ${booking.check_out}` : ""} />
        <InfoCell
          label="Payment"
          value={paymentStatus}
          sub={value ? `USD ${value.toFixed(2)}` : ""}
          accent={paymentStatus === "paid" ? "text-emerald-300" : "text-amber-300"}
        />
        <InfoCell label="Source" value={booking.booking_source || "website"} sub={booking.booking_reference || ""} />
      </div>

      <BookingActions
        bookingStatus={bookingStatus}
        id={id}
        busyId={busyId}
        changeStatus={changeStatus}
      />
    </article>
  );
}

function BookingTableRow({
  booking,
  busyId,
  changeStatus,
}: {
  booking: any;
  busyId: string;
  changeStatus: (id: string, status: string) => void;
}) {
  const bookingStatus = String(booking.status || "pending").toLowerCase();
  const paymentStatus = String(booking.payment_status || "unpaid").toLowerCase();
  const id = String(booking.id || "");
  const value = Number(booking.estimated_total || 0) + Number(booking.speedboat_total || 0);

  return (
    <tr className="border-t border-white/10 align-top hover:bg-white/[.02]">
      <td className="p-4">
        <strong>{booking.guest_name || "Guest"}</strong>
        <div className="mt-1 text-xs text-gray-500">{booking.guest_email || ""}</div>
        {booking.booking_reference && (
          <div className="mt-1 text-[10px] uppercase tracking-[.08em] text-gold">{booking.booking_reference}</div>
        )}
      </td>
      <td className="p-4">
        {booking.property_name}
        <div className="mt-1 text-xs text-gray-500">{booking.room_type}</div>
      </td>
      <td className="p-4">
        {booking.check_in}
        <div className="mt-1 text-xs text-gray-500">to {booking.check_out}</div>
      </td>
      <td className="p-4">
        <span className={paymentStatus === "paid" ? "text-emerald-300" : "text-amber-300"}>{paymentStatus}</span>
        {value > 0 && <div className="mt-1 text-xs text-gray-500">USD {value.toFixed(2)}</div>}
      </td>
      <td className="p-4">
        {booking.booking_source || "website"}
        {booking.package_name && <div className="mt-1 text-xs text-gray-500">{booking.package_name}</div>}
      </td>
      <td className="p-4">
        <span className={`inline-flex rounded-full border px-3 py-1.5 text-xs font-semibold capitalize ${statusTone(bookingStatus)}`}>
          {bookingStatus}
        </span>
      </td>
      <td className="p-4">
        <BookingActions
          bookingStatus={bookingStatus}
          id={id}
          busyId={busyId}
          changeStatus={changeStatus}
          compact
        />
      </td>
    </tr>
  );
}

function BookingActions({
  bookingStatus,
  id,
  busyId,
  changeStatus,
  compact = false,
}: {
  bookingStatus: string;
  id: string;
  busyId: string;
  changeStatus: (id: string, status: string) => void;
  compact?: boolean;
}) {
  const busy = busyId === id;
  if (["completed", "cancelled"].includes(bookingStatus)) return null;

  return (
    <div className={`${compact ? "mt-0 min-w-[185px]" : "mt-4"} flex flex-wrap gap-2`}>
      {bookingStatus === "pending" && (
        <button
          disabled={busy}
          onClick={() => changeStatus(id, "confirmed")}
          className="min-h-[40px] rounded-full border border-emerald-500/30 px-3 text-xs font-semibold text-emerald-300 disabled:opacity-40"
        >
          <CheckCircle2 className="mr-1 inline h-3.5 w-3.5" /> Confirm
        </button>
      )}
      {bookingStatus === "confirmed" && (
        <button
          disabled={busy}
          onClick={() => changeStatus(id, "completed")}
          className="min-h-[40px] rounded-full bg-gold px-3 text-xs font-semibold text-black disabled:opacity-40"
        >
          <CheckCircle2 className="mr-1 inline h-3.5 w-3.5" /> Complete
        </button>
      )}
      <button
        disabled={busy}
        onClick={() => changeStatus(id, "cancelled")}
        className="min-h-[40px] rounded-full border border-red-500/30 px-3 text-xs text-red-300 disabled:opacity-40"
      >
        <XCircle className="mr-1 inline h-3.5 w-3.5" /> Cancel
      </button>
    </div>
  );
}

function InfoCell({
  label,
  value,
  sub,
  accent = "text-white",
}: {
  label: string;
  value: string;
  sub?: string;
  accent?: string;
}) {
  return (
    <div className="rounded-xl bg-white/[.035] p-3">
      <p className="text-[9px] uppercase tracking-[.1em] text-gray-500">{label}</p>
      <p className={`mt-1 truncate font-semibold capitalize ${accent}`}>{value}</p>
      {sub && <p className="mt-1 truncate text-[10px] text-gray-500">{sub}</p>}
    </div>
  );
}

function EmptyBookings() {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[.02] p-8 text-center">
      <Clock3 className="mx-auto h-5 w-5 text-gold" />
      <p className="mt-3 text-sm text-gray-400">No bookings match these filters.</p>
    </div>
  );
}

"use client";

import Link from "next/link";
import { FormEvent, useEffect, useMemo, useState } from "react";
import {
  ArrowLeft,
  CalendarDays,
  CreditCard,
  DollarSign,
  Download,
  FileSpreadsheet,
  FileText,
  PlusCircle,
  Search,
  TrendingUp,
  WalletCards,
} from "lucide-react";
import {
  exportMonthlySalesExcel,
  exportMonthlySalesPdf,
} from "@/lib/monthly-sales-export";

type Sale = {
  id: string;
  sale_date: string;
  customer_name: string | null;
  customer_email: string | null;
  category: string;
  description: string;
  amount_usd: number;
  payment_status: string;
  payment_method: string | null;
  booking_source: string | null;
  reservation_id: string | null;
  notes: string | null;
  created_at: string;
};

type Booking = {
  id: string;
  guest_name: string;
  guest_email: string;
  property_name: string;
  room_type: string;
  check_in: string;
  check_out: string;
  booking_source: string;
  status: string;
  booking_reference: string | null;
  payment_status: string;
  package_name: string | null;
  estimated_total: number | null;
  speedboat_total: number | null;
  activities: string | null;
  created_at: string;
};

const money = (n: number) => `USD ${Number(n || 0).toFixed(2)}`;
const today = () => new Date().toISOString().slice(0, 10);

export default function AdminSalesPage() {
  const [sales, setSales] = useState<Sale[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState("");
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState("all");
  const [reportMonth, setReportMonth] = useState(today().slice(0, 7));
  const [form, setForm] = useState({
    saleDate: today(),
    customerName: "",
    customerEmail: "",
    category: "stay",
    description: "",
    amountUsd: "",
    paymentStatus: "pending",
    paymentMethod: "",
    bookingSource: "Tripelor",
    reservationId: "",
    notes: "",
  });

  async function load() {
    const response = await fetch("/api/admin/sales", { cache: "no-store" });
    const result = await response.json();
    if (!response.ok) throw new Error(result.error || "Unable to load sales.");
    setSales(result.sales || []);
    setBookings(result.bookings || []);
  }

  useEffect(() => {
    (async () => {
      try {
        const me = await fetch("/api/auth/me", { cache: "no-store" });
        const result = await me.json();
        if (!result.user) {
          location.href = "/login";
          return;
        }
        if (!result.user.isAdmin) {
          setNotice("Admin access required.");
          return;
        }
        await load();
      } catch (error) {
        setNotice(error instanceof Error ? error.message : "Unable to load sales.");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const totals = useMemo(() => {
    const paid = sales
      .filter((sale) => sale.payment_status === "paid")
      .reduce((total, sale) => total + Number(sale.amount_usd || 0), 0);
    const pending = sales
      .filter((sale) => sale.payment_status === "pending" || sale.payment_status === "partial")
      .reduce((total, sale) => total + Number(sale.amount_usd || 0), 0);
    const month = today().slice(0, 7);
    const thisMonth = sales
      .filter((sale) => String(sale.sale_date).startsWith(month) && sale.payment_status !== "refunded")
      .reduce((total, sale) => total + Number(sale.amount_usd || 0), 0);
    return { paid, pending, thisMonth, count: sales.length };
  }, [sales]);

  const visible = useMemo(
    () =>
      sales.filter((sale) => {
        const text = `${sale.customer_name || ""} ${sale.customer_email || ""} ${sale.description} ${sale.category} ${sale.booking_source || ""}`.toLowerCase();
        return (!query || text.includes(query.toLowerCase())) && (filter === "all" || sale.payment_status === filter);
      }),
    [sales, query, filter],
  );

  const monthlyReport = useMemo(() => {
    const rows = sales.filter((sale) => String(sale.sale_date).startsWith(reportMonth));
    const paid = rows
      .filter((sale) => sale.payment_status === "paid")
      .reduce((total, sale) => total + Number(sale.amount_usd || 0), 0);
    const due = rows
      .filter((sale) => sale.payment_status === "pending" || sale.payment_status === "partial")
      .reduce((total, sale) => total + Number(sale.amount_usd || 0), 0);
    const gross = rows
      .filter((sale) => sale.payment_status !== "refunded")
      .reduce((total, sale) => total + Number(sale.amount_usd || 0), 0);
    return { rows, paid, due, gross };
  }, [sales, reportMonth]);

  function chooseBooking(id: string) {
    const booking = bookings.find((item) => item.id === id);
    if (!booking) {
      setForm((value) => ({ ...value, reservationId: "" }));
      return;
    }
    const amount = Number(booking.estimated_total || 0) + Number(booking.speedboat_total || 0);
    setForm((value) => ({
      ...value,
      reservationId: booking.id,
      customerName: booking.guest_name || "",
      customerEmail: booking.guest_email || "",
      category: booking.package_name ? "package" : "stay",
      description: booking.package_name || `${booking.property_name} · ${booking.room_type}`,
      amountUsd: amount ? String(amount) : value.amountUsd,
      paymentStatus: booking.payment_status || "pending",
      bookingSource: booking.booking_source || "Tripelor",
      notes: booking.booking_reference ? `Booking ref: ${booking.booking_reference}` : value.notes,
    }));
  }

  async function addSale(event: FormEvent) {
    event.preventDefault();
    setSaving(true);
    setNotice("");
    try {
      const response = await fetch("/api/admin/sales", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Unable to add sale.");
      setNotice("Sale added successfully.");
      setForm({
        saleDate: today(),
        customerName: "",
        customerEmail: "",
        category: "stay",
        description: "",
        amountUsd: "",
        paymentStatus: "pending",
        paymentMethod: "",
        bookingSource: "Tripelor",
        reservationId: "",
        notes: "",
      });
      await load();
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Unable to add sale.");
    } finally {
      setSaving(false);
    }
  }

  async function updateStatus(id: string, paymentStatus: string) {
    const response = await fetch("/api/admin/sales", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, paymentStatus }),
    });
    const result = await response.json();
    if (!response.ok) {
      alert(result.error || "Unable to update sale.");
      return;
    }
    await load();
  }

  if (loading) return <main className="container py-20 text-gray-400">Loading sales dashboard...</main>;

  return (
    <main className="container py-10 pb-24 md:py-16">
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-sm uppercase tracking-[.3em] text-gold">Tripelor Admin</p>
          <h1 className="mt-2 text-4xl font-bold md:text-5xl">Sales</h1>
          <p className="mt-3 max-w-2xl text-gray-400">
            Keep room, package, speedboat, experience and manual sales in one simple place.
          </p>
        </div>
        <div className="flex gap-3">
          <Link href="/admin" className="btn-outline gap-2">
            <ArrowLeft className="h-4 w-4" /> Admin
          </Link>
          <Link href="/admin/room-calendar" className="btn-outline gap-2">
            <CalendarDays className="h-4 w-4" /> Calendar
          </Link>
        </div>
      </div>

      {notice && <div className="card mt-6 border-gold/20 p-4 text-sm">{notice}</div>}

      <section className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <div className="card p-5">
          <WalletCards className="h-5 w-5 text-gold" />
          <p className="mt-3 text-sm text-gray-400">Paid sales</p>
          <p className="mt-1 text-3xl font-bold text-emerald-300">{money(totals.paid)}</p>
        </div>
        <div className="card p-5">
          <CreditCard className="h-5 w-5 text-gold" />
          <p className="mt-3 text-sm text-gray-400">Pending / partial</p>
          <p className="mt-1 text-3xl font-bold text-amber-300">{money(totals.pending)}</p>
        </div>
        <div className="card p-5">
          <TrendingUp className="h-5 w-5 text-gold" />
          <p className="mt-3 text-sm text-gray-400">This month</p>
          <p className="mt-1 text-3xl font-bold text-gold">{money(totals.thisMonth)}</p>
        </div>
        <div className="card p-5">
          <DollarSign className="h-5 w-5 text-gold" />
          <p className="mt-3 text-sm text-gray-400">Sales entries</p>
          <p className="mt-1 text-3xl font-bold">{totals.count}</p>
        </div>
      </section>

      <section className="mt-8 rounded-3xl border border-gold/20 bg-gradient-to-br from-[#0b2731] to-[#06161d] p-5 md:p-7">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[.24em] text-gold">
              <Download className="h-4 w-4" /> Month-end reporting
            </p>
            <h2 className="mt-2 text-2xl font-bold md:text-3xl">Monthly sales report</h2>
            <p className="mt-2 max-w-xl text-sm leading-6 text-gray-400">
              Choose a month and download the complete Tripelor sales report for accounts, filing or management review.
            </p>
          </div>

          <label className="grid gap-2 text-xs font-semibold uppercase tracking-[.12em] text-gray-400">
            Report month
            <input
              type="month"
              value={reportMonth}
              onChange={(event) => setReportMonth(event.target.value)}
              className="min-h-[48px] rounded-xl border border-white/10 bg-black/30 px-4 text-base font-normal tracking-normal text-white"
            />
          </label>
        </div>

        <div className="mt-6 grid gap-3 sm:grid-cols-3">
          <div className="rounded-2xl border border-white/10 bg-white/[.035] p-4">
            <p className="text-xs text-gray-500">Report sales</p>
            <p className="mt-1 text-2xl font-bold">{monthlyReport.rows.length}</p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/[.035] p-4">
            <p className="text-xs text-gray-500">Gross value</p>
            <p className="mt-1 text-2xl font-bold text-gold">{money(monthlyReport.gross)}</p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/[.035] p-4">
            <p className="text-xs text-gray-500">Paid / due</p>
            <p className="mt-1 text-lg font-bold text-emerald-300">{money(monthlyReport.paid)}</p>
            <p className="text-xs text-amber-300">Due {money(monthlyReport.due)}</p>
          </div>
        </div>

        <div className="mt-5 grid gap-3 sm:grid-cols-2">
          <button
            type="button"
            onClick={() => exportMonthlySalesExcel(sales, reportMonth)}
            className="btn-gold min-h-[52px] w-full gap-2"
          >
            <FileSpreadsheet className="h-5 w-5" /> Export Excel
          </button>
          <button
            type="button"
            onClick={() => exportMonthlySalesPdf(sales, reportMonth)}
            className="btn-outline min-h-[52px] w-full gap-2"
          >
            <FileText className="h-5 w-5" /> Export PDF
          </button>
        </div>
        <p className="mt-3 text-xs text-gray-500">
          Excel includes the detailed transaction table. PDF includes the monthly summary, category totals and sales details.
        </p>
      </section>

      <section className="mt-8 grid gap-6 xl:grid-cols-[.85fr_1.15fr]">
        <form onSubmit={addSale} className="card h-fit p-6 md:p-7">
          <div className="flex items-center gap-2">
            <PlusCircle className="h-5 w-5 text-gold" />
            <h2 className="text-2xl font-bold">Add Sale</h2>
          </div>
          <p className="mt-2 text-sm text-gray-400">
            Use an existing booking or enter a WhatsApp, walk-in, speedboat or activity sale manually.
          </p>
          <div className="mt-6 grid gap-4">
            <label className="grid gap-2 text-sm">
              Link booking (optional)
              <select
                value={form.reservationId}
                onChange={(event) => chooseBooking(event.target.value)}
                className="rounded-xl border border-white/10 bg-black px-4 py-3"
              >
                <option value="">Manual sale / no booking</option>
                {bookings.map((booking) => (
                  <option key={booking.id} value={booking.id}>
                    {booking.booking_reference || booking.id.slice(0, 8)} · {booking.guest_name} · {booking.property_name}
                  </option>
                ))}
              </select>
            </label>

            <div className="grid gap-4 sm:grid-cols-2">
              <label className="grid gap-2 text-sm">
                Sale date
                <input
                  type="date"
                  value={form.saleDate}
                  onChange={(event) => setForm((value) => ({ ...value, saleDate: event.target.value }))}
                  className="rounded-xl border border-white/10 bg-black px-4 py-3"
                />
              </label>
              <label className="grid gap-2 text-sm">
                Category
                <select
                  value={form.category}
                  onChange={(event) => setForm((value) => ({ ...value, category: event.target.value }))}
                  className="rounded-xl border border-white/10 bg-black px-4 py-3"
                >
                  <option value="stay">Stay</option>
                  <option value="package">Package</option>
                  <option value="speedboat">Speedboat</option>
                  <option value="experience">Experience</option>
                  <option value="other">Other</option>
                </select>
              </label>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <input
                value={form.customerName}
                onChange={(event) => setForm((value) => ({ ...value, customerName: event.target.value }))}
                placeholder="Customer name"
                className="rounded-xl border border-white/10 bg-black px-4 py-3"
              />
              <input
                type="email"
                value={form.customerEmail}
                onChange={(event) => setForm((value) => ({ ...value, customerEmail: event.target.value }))}
                placeholder="Customer email"
                className="rounded-xl border border-white/10 bg-black px-4 py-3"
              />
            </div>

            <input
              required
              value={form.description}
              onChange={(event) => setForm((value) => ({ ...value, description: event.target.value }))}
              placeholder="Sale description"
              className="rounded-xl border border-white/10 bg-black px-4 py-3"
            />

            <div className="grid gap-4 sm:grid-cols-2">
              <input
                required
                min="0"
                step="0.01"
                type="number"
                value={form.amountUsd}
                onChange={(event) => setForm((value) => ({ ...value, amountUsd: event.target.value }))}
                placeholder="Amount USD"
                className="rounded-xl border border-white/10 bg-black px-4 py-3"
              />
              <select
                value={form.paymentStatus}
                onChange={(event) => setForm((value) => ({ ...value, paymentStatus: event.target.value }))}
                className="rounded-xl border border-white/10 bg-black px-4 py-3"
              >
                <option value="pending">Pending</option>
                <option value="partial">Partial</option>
                <option value="paid">Paid</option>
                <option value="refunded">Refunded</option>
              </select>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <input
                value={form.paymentMethod}
                onChange={(event) => setForm((value) => ({ ...value, paymentMethod: event.target.value }))}
                placeholder="Payment method"
                className="rounded-xl border border-white/10 bg-black px-4 py-3"
              />
              <input
                value={form.bookingSource}
                onChange={(event) => setForm((value) => ({ ...value, bookingSource: event.target.value }))}
                placeholder="Source: Tripelor / Booking.com / Agoda"
                className="rounded-xl border border-white/10 bg-black px-4 py-3"
              />
            </div>

            <textarea
              value={form.notes}
              onChange={(event) => setForm((value) => ({ ...value, notes: event.target.value }))}
              placeholder="Notes"
              rows={3}
              className="rounded-xl border border-white/10 bg-black px-4 py-3"
            />
            <button disabled={saving} className="btn-gold w-full">
              {saving ? "Saving..." : "Save Sale"}
            </button>
          </div>
        </form>

        <div>
          <div className="flex flex-col gap-3 sm:flex-row">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-3.5 h-4 w-4 text-gray-500" />
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search customer, sale or source"
                className="w-full rounded-xl border border-white/10 bg-black py-3 pl-10 pr-4"
              />
            </div>
            <select
              value={filter}
              onChange={(event) => setFilter(event.target.value)}
              className="rounded-xl border border-white/10 bg-black px-4 py-3"
            >
              <option value="all">All payments</option>
              <option value="paid">Paid</option>
              <option value="pending">Pending</option>
              <option value="partial">Partial</option>
              <option value="refunded">Refunded</option>
            </select>
          </div>

          <div className="mt-4 overflow-x-auto rounded-3xl border border-white/10">
            <table className="w-full min-w-[900px] text-left text-sm">
              <thead className="bg-white/[.04] text-gray-300">
                <tr>
                  <th className="p-4">Date</th>
                  <th className="p-4">Customer</th>
                  <th className="p-4">Sale</th>
                  <th className="p-4">Amount</th>
                  <th className="p-4">Source</th>
                  <th className="p-4">Payment</th>
                </tr>
              </thead>
              <tbody>
                {visible.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="p-8 text-center text-gray-500">No sales found.</td>
                  </tr>
                ) : (
                  visible.map((sale) => (
                    <tr key={sale.id} className="border-t border-white/10">
                      <td className="p-4">{sale.sale_date}</td>
                      <td className="p-4">
                        <strong>{sale.customer_name || "Guest"}</strong>
                        <div className="text-xs text-gray-500">{sale.customer_email || ""}</div>
                      </td>
                      <td className="p-4">
                        <span className="text-xs uppercase tracking-wider text-gold">{sale.category}</span>
                        <div className="mt-1 font-medium">{sale.description}</div>
                        {sale.notes && <div className="mt-1 max-w-xs text-xs text-gray-500">{sale.notes}</div>}
                      </td>
                      <td className="p-4 font-bold text-gold">{money(sale.amount_usd)}</td>
                      <td className="p-4">
                        {sale.booking_source || "—"}
                        <div className="text-xs text-gray-500">{sale.payment_method || ""}</div>
                      </td>
                      <td className="p-4">
                        <select
                          value={sale.payment_status}
                          onChange={(event) => updateStatus(sale.id, event.target.value)}
                          className={`rounded-full border px-3 py-2 text-xs ${
                            sale.payment_status === "paid"
                              ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-300"
                              : sale.payment_status === "refunded"
                                ? "border-red-500/30 bg-red-500/10 text-red-300"
                                : "border-amber-500/30 bg-amber-500/10 text-amber-300"
                          }`}
                        >
                          <option value="pending">Pending</option>
                          <option value="partial">Partial</option>
                          <option value="paid">Paid</option>
                          <option value="refunded">Refunded</option>
                        </select>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </section>
    </main>
  );
}

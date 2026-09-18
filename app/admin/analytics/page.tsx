"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  ArrowLeft,
  BarChart3,
  CalendarRange,
  Eye,
  Globe2,
  Hotel,
  MessageCircle,
  MonitorSmartphone,
  MousePointerClick,
  RefreshCw,
  TrendingUp,
  Users,
} from "lucide-react";

type DailyPoint = { day: string; page_views: number; visitors: number };
type NamedCount = Record<string, string | number>;

type AnalyticsData = {
  days: number;
  generatedAt?: string | null;
  trackingSince?: string | null;
  metrics?: {
    pageViews?: number;
    uniqueVisitors?: number;
    sessions?: number;
    propertyViews?: number;
    bookingsStarted?: number;
    bookingsCompleted?: number;
    whatsappClicks?: number;
    conversionRate?: number;
    pagesPerSession?: number;
  };
  daily?: DailyPoint[];
  topPages?: NamedCount[];
  sources?: NamedCount[];
  countries?: NamedCount[];
  devices?: NamedCount[];
};

const EMPTY: AnalyticsData = { days: 30, metrics: {}, daily: [], topPages: [], sources: [], countries: [], devices: [] };

const number = (value: unknown) => Number(value || 0).toLocaleString();

function pageLabel(path: string) {
  if (path === "/") return "Home page";
  return path
    .replace(/^\//, "")
    .split("/")
    .filter(Boolean)
    .map((part) => part.replace(/-/g, " "))
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" · ");
}

export default function AdminAnalyticsPage() {
  const [days, setDays] = useState(30);
  const [data, setData] = useState<AnalyticsData>(EMPTY);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function load(selectedDays = days) {
    setLoading(true);
    try {
      const response = await fetch(`/api/admin/analytics?days=${selectedDays}`, { cache: "no-store" });
      const result = await response.json();
      if (response.status === 401) {
        window.location.href = "/login?next=/admin/analytics";
        return;
      }
      if (!response.ok) throw new Error(result.error || "Unable to load website analytics.");
      setData({ ...EMPTY, ...result });
      setError("");
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Unable to load website analytics.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load(days);
  }, [days]);

  const metrics = data.metrics || {};
  const hasData = Number(metrics.pageViews || 0) > 0;
  const trackingDate = data.trackingSince
    ? new Intl.DateTimeFormat("en", { dateStyle: "medium", timeZone: "Indian/Maldives" }).format(
        new Date(data.trackingSince),
      )
    : "today";

  return (
    <main className="container py-8 pb-28 md:py-14">
      <div className="rounded-2xl border border-white/10 bg-white/[.02] p-5 md:p-7">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <Link href="/admin" className="inline-flex items-center gap-2 text-xs font-semibold text-gold">
              <ArrowLeft className="h-4 w-4" /> Admin dashboard
            </Link>
            <p className="mt-5 flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[.24em] text-gold">
              <BarChart3 className="h-4 w-4" /> Website Analytics
            </p>
            <h1 className="mt-2 text-3xl font-semibold md:text-5xl">Customer visits & clicks</h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-gray-400 md:text-base">
              See how customers find Tripelor, which pages they view, and whether visits lead to booking actions.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <CalendarRange className="h-4 w-4 text-gray-500" />
            {[7, 30, 90].map((option) => (
              <button
                key={option}
                type="button"
                onClick={() => setDays(option)}
                className={`min-h-[42px] rounded-full border px-4 text-xs font-semibold transition ${
                  days === option
                    ? "border-gold bg-gold text-black"
                    : "border-white/10 bg-white/[.03] text-gray-400 hover:border-gold/30 hover:text-white"
                }`}
              >
                {option} days
              </button>
            ))}
            <button
              type="button"
              onClick={() => load(days)}
              disabled={loading}
              className="btn-outline min-h-[42px] gap-2 px-4 text-xs disabled:opacity-50"
            >
              <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} /> Refresh
            </button>
          </div>
        </div>
      </div>

      {error && (
        <p className="mt-5 rounded-xl border border-red-500/20 bg-red-500/[.05] p-4 text-sm text-red-300">
          {error}
        </p>
      )}

      <section className="mt-6 grid grid-cols-2 gap-3 lg:grid-cols-4 xl:grid-cols-6">
        <MetricCard icon={Users} label="Visitors" value={number(metrics.uniqueVisitors)} note="Unique customers" />
        <MetricCard icon={Eye} label="Page views" value={number(metrics.pageViews)} note={`${number(metrics.pagesPerSession)} per session`} />
        <MetricCard icon={Hotel} label="Property clicks" value={number(metrics.propertyViews)} note="Stay pages opened" />
        <MetricCard icon={MousePointerClick} label="Booking starts" value={number(metrics.bookingsStarted)} note="Booking buttons clicked" />
        <MetricCard icon={TrendingUp} label="Completed" value={number(metrics.bookingsCompleted)} note={`${Number(metrics.conversionRate || 0).toFixed(1)}% conversion`} />
        <MetricCard icon={MessageCircle} label="WhatsApp clicks" value={number(metrics.whatsappClicks)} note="Contact intent" />
      </section>

      {!loading && !hasData ? (
        <section className="mt-5 rounded-2xl border border-gold/20 bg-gold/[.04] p-7 text-center">
          <BarChart3 className="mx-auto h-8 w-8 text-gold" />
          <h2 className="mt-3 text-xl font-semibold">Tracking has started</h2>
          <p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-gray-400">
            New customer visits will appear here automatically. Earlier website visits cannot be recovered.
          </p>
        </section>
      ) : (
        <>
          <TrendChart rows={data.daily || []} />

          <section className="mt-5 grid gap-5 xl:grid-cols-[1.2fr_.8fr]">
            <BreakdownCard
              icon={Eye}
              title="Most viewed pages"
              rows={data.topPages || []}
              labelKey="path"
              valueKey="views"
              formatLabel={pageLabel}
            />
            <BreakdownCard
              icon={Globe2}
              title="Traffic sources"
              rows={data.sources || []}
              labelKey="source"
              valueKey="visits"
            />
          </section>

          <section className="mt-5 grid gap-5 md:grid-cols-2">
            <BreakdownCard
              icon={Globe2}
              title="Visitor countries"
              rows={data.countries || []}
              labelKey="country"
              valueKey="visits"
            />
            <BreakdownCard
              icon={MonitorSmartphone}
              title="Devices"
              rows={data.devices || []}
              labelKey="device"
              valueKey="visits"
              capitalize
            />
          </section>
        </>
      )}

      <p className="mt-6 text-xs leading-5 text-gray-500">
        Tracking since {trackingDate}. Figures exclude the admin area and common automated bots. No customer names,
        email addresses or IP addresses are stored in website analytics.
      </p>
    </main>
  );
}

function MetricCard({ icon: Icon, label, value, note }: { icon: any; label: string; value: string; note: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[.025] p-4 md:p-5">
      <Icon className="h-5 w-5 text-gold" />
      <p className="mt-4 text-xs text-gray-500">{label}</p>
      <p className="mt-1 text-2xl font-semibold md:text-3xl">{value}</p>
      <p className="mt-2 text-[11px] leading-4 text-gray-500">{note}</p>
    </div>
  );
}

function TrendChart({ rows }: { rows: DailyPoint[] }) {
  const max = useMemo(
    () => Math.max(1, ...rows.flatMap((row) => [Number(row.page_views || 0), Number(row.visitors || 0)])),
    [rows],
  );
  const labelEvery = rows.length > 45 ? 14 : rows.length > 14 ? 7 : 1;

  return (
    <section className="mt-5 rounded-2xl border border-white/10 bg-white/[.025] p-5 md:p-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[.16em] text-gray-500">Visit trend</p>
          <h2 className="mt-1 text-xl font-semibold">Visitors and page views</h2>
        </div>
        <div className="flex gap-4 text-xs text-gray-400">
          <span className="flex items-center gap-2"><i className="h-2.5 w-2.5 rounded-sm bg-gold" /> Page views</span>
          <span className="flex items-center gap-2"><i className="h-2.5 w-2.5 rounded-sm bg-sky-400" /> Visitors</span>
        </div>
      </div>

      <div className="mt-6 overflow-x-auto pb-2">
        <div className="flex h-[210px] items-end gap-1.5" style={{ minWidth: Math.max(680, rows.length * 23) }}>
          {rows.map((row, index) => (
            <div key={row.day} className="group relative flex h-full min-w-4 flex-1 flex-col justify-end">
              <div className="absolute bottom-8 left-1/2 z-10 hidden -translate-x-1/2 rounded-lg border border-white/10 bg-black px-3 py-2 text-xs shadow-xl group-hover:block">
                <strong className="whitespace-nowrap">{row.day}</strong>
                <p className="mt-1 whitespace-nowrap text-gold">{number(row.page_views)} page views</p>
                <p className="whitespace-nowrap text-sky-300">{number(row.visitors)} visitors</p>
              </div>
              <div className="flex h-[168px] items-end justify-center gap-0.5 border-b border-white/10">
                <span className="w-[42%] rounded-t-sm bg-gold/90" style={{ height: `${Math.max(row.page_views ? 4 : 0, (row.page_views / max) * 100)}%` }} />
                <span className="w-[42%] rounded-t-sm bg-sky-400/80" style={{ height: `${Math.max(row.visitors ? 4 : 0, (row.visitors / max) * 100)}%` }} />
              </div>
              <span className="mt-2 h-4 text-center text-[9px] text-gray-600">
                {index % labelEvery === 0 ? row.day.slice(5) : ""}
              </span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function BreakdownCard({
  icon: Icon,
  title,
  rows,
  labelKey,
  valueKey,
  formatLabel,
  capitalize = false,
}: {
  icon: any;
  title: string;
  rows: NamedCount[];
  labelKey: string;
  valueKey: string;
  formatLabel?: (value: string) => string;
  capitalize?: boolean;
}) {
  const maximum = Math.max(1, ...rows.map((row) => Number(row[valueKey] || 0)));

  return (
    <div className="rounded-2xl border border-white/10 bg-white/[.025] p-5 md:p-6">
      <div className="flex items-center gap-3">
        <Icon className="h-5 w-5 text-gold" />
        <h2 className="text-lg font-semibold">{title}</h2>
      </div>
      <div className="mt-5 space-y-4">
        {rows.length ? rows.map((row, index) => {
          const rawLabel = String(row[labelKey] || "Unknown");
          const label = formatLabel ? formatLabel(rawLabel) : rawLabel;
          const value = Number(row[valueKey] || 0);
          return (
            <div key={`${rawLabel}-${index}`}>
              <div className="flex items-center justify-between gap-4 text-sm">
                <span className={`min-w-0 truncate text-gray-300 ${capitalize ? "capitalize" : ""}`} title={rawLabel}>{label}</span>
                <strong>{number(value)}</strong>
              </div>
              <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-white/[.06]">
                <div className="h-full rounded-full bg-gold" style={{ width: `${Math.max(3, (value / maximum) * 100)}%` }} />
              </div>
            </div>
          );
        }) : <p className="py-5 text-sm text-gray-500">No visits recorded in this period.</p>}
      </div>
    </div>
  );
}

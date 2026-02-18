// src/pages/protected/superAdmin/SuperAdminDashboard.tsx
import React from "react";
import { useNavigate } from "react-router-dom";
import Card from "../../../components/Card";
import { useTheme } from "../../../context/ThemeContext";
import Navbar from "../../../components/Navbar";
import SideNavbar from "../../../components/SideNavbar";
import TwoColumnLayout from "../../../components/TwoColumnLayout";
import { useAuth } from "../../../hooks/useAuth";
import { isSuperAdmin } from "../../../utils/checkRole";
import { BACKEND_URL } from "../../../config";

import Chart from "react-apexcharts";
import type { ApexOptions } from "apexcharts";

type DashboardSummary = {
  core: {
    companies: number;
    users: number;
    clients: number;
    sites: number;
    guardGroups: number;
  };
  roster: {
    rosters: number;
    shifts: number;
    shiftsToday: number;
  };
  compliance: {
    checkpointsScheduledToday: number;
    checkpointsCompletedToday: number;
    checkpointsMissedToday: number;

    checkCallsScheduledToday: number;
    checkCallsCompletedToday: number;
    checkCallsMissedToday: number;
  };
  recruitment: {
    jobs: number;
    applications: number;
  };
  finance: {
    invoices: number;
    invoicesIssuedThisMonth: number;
    overdueInvoices: number;
    paymentsThisMonth: number;
    revenueThisMonth: number;
    creditNotesThisMonth: number;
  };
};

// Optional trends endpoint (if you add later)
// GET /api/super-admin/dashboard/trends?days=14
type TrendPoint = { date: string; completed: number; missed: number };
type DashboardTrends = {
  checkpoints?: TrendPoint[];
  checkCalls?: TrendPoint[];
  finance?: { date: string; revenue: number; payments: number }[];
};

function n(v: any): number {
  const x = Number(v);
  return Number.isFinite(x) ? x : 0;
}

function pct(part: number, total: number): number {
  if (!total) return 0;
  return Math.round((part / total) * 100);
}

function formatMoney(v: number): string {
  // simple format; keeps it readable
  const num = Number.isFinite(v) ? v : 0;
  return num.toLocaleString(undefined, { maximumFractionDigits: 2 });
}

function baseApexOptions(mode: "dark" | "light"): ApexOptions {
  const isDark = mode === "dark";
  const text = isDark ? "rgba(255,255,255,0.88)" : "rgba(17,24,39,0.88)";
  const muted = isDark ? "rgba(255,255,255,0.55)" : "rgba(17,24,39,0.55)";
  const grid = isDark ? "rgba(255,255,255,0.10)" : "rgba(17,24,39,0.10)";

  return {
    chart: {
      toolbar: { show: false },
      foreColor: text,
      fontFamily: "inherit",
      animations: { enabled: true },
      zoom: { enabled: false },
    },
    tooltip: { theme: isDark ? "dark" : "light" },
    grid: { borderColor: grid, strokeDashArray: 4 },
    legend: {
      position: "bottom",
      labels: { colors: text },
      fontSize: "12px",
    },
    dataLabels: { enabled: false },
    stroke: { width: 2, curve: "smooth" },
    theme: { mode: isDark ? "dark" : "light" },
    xaxis: {
      labels: { style: { colors: muted } as any },
      axisBorder: { color: grid },
      axisTicks: { color: grid },
    },
    yaxis: {
      labels: { style: { colors: muted } as any },
    },
  };
}

function Panel({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
      <div className="mb-3">
        <div className="text-sm font-semibold">{title}</div>
        {subtitle ? <div className="text-xs opacity-70">{subtitle}</div> : null}
      </div>
      {children}
    </div>
  );
}

function Kpi({
  title,
  value,
  hint,
}: {
  title: string;
  value: React.ReactNode;
  hint?: string;
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
      <div className="text-xs opacity-70">{title}</div>
      <div className="mt-1 text-2xl font-bold">{value}</div>
      {hint ? <div className="mt-1 text-xs opacity-60">{hint}</div> : null}
    </div>
  );
}

function Donut({
  mode,
  labels,
  series,
  totalLabel,
  totalValue,
}: {
  mode: "dark" | "light";
  labels: string[];
  series: number[];
  totalLabel: string;
  totalValue: number;
}) {
  const options: ApexOptions = {
    ...baseApexOptions(mode),
    chart: { ...(baseApexOptions(mode).chart || {}), type: "donut" },
    labels,
    plotOptions: {
      pie: {
        donut: {
          size: "70%",
          labels: {
            show: true,
            name: { show: true },
            value: { show: true },
            total: {
              show: true,
              label: totalLabel,
              formatter: () => String(totalValue),
            },
          },
        },
      },
    },
  };

  return <Chart options={options} series={series} type="donut" height={280} />;
}

function Bar({
  mode,
  title1,
  title2,
  v1,
  v2,
  category = "This Month",
}: {
  mode: "dark" | "light";
  title1: string;
  title2: string;
  v1: number;
  v2: number;
  category?: string;
}) {
  const options: ApexOptions = {
    ...baseApexOptions(mode),
    chart: { ...(baseApexOptions(mode).chart || {}), type: "bar" },
    plotOptions: { bar: { borderRadius: 10, columnWidth: "45%" } },
    dataLabels: { enabled: true },
    xaxis: { categories: [category] },
  };

  const series = [
    { name: title1, data: [v1] },
    { name: title2, data: [v2] },
  ];

  return <Chart options={options} series={series} type="bar" height={280} />;
}

function HorizontalBar({
  mode,
  title,
  categories,
  values,
}: {
  mode: "dark" | "light";
  title: string;
  categories: string[];
  values: number[];
}) {
  const options: ApexOptions = {
    ...baseApexOptions(mode),
    chart: { ...(baseApexOptions(mode).chart || {}), type: "bar" },
    plotOptions: {
      bar: { horizontal: true, borderRadius: 10, barHeight: "55%" },
    },
    dataLabels: { enabled: true },
    xaxis: { categories },
    legend: { show: false },
    title: { text: "", style: { fontSize: "0px" } },
  };

  const series = [{ name: title, data: values }];

  return <Chart options={options} series={series} type="bar" height={280} />;
}

function LineTrend({
  mode,
  titleA,
  titleB,
  points,
}: {
  mode: "dark" | "light";
  titleA: string;
  titleB: string;
  points: TrendPoint[];
}) {
  const categories = points.map((p) => p.date);
  const s1 = points.map((p) => n(p.completed));
  const s2 = points.map((p) => n(p.missed));

  const options: ApexOptions = {
    ...baseApexOptions(mode),
    chart: { ...(baseApexOptions(mode).chart || {}), type: "line" },
    xaxis: { categories },
    dataLabels: { enabled: false },
    stroke: { width: 3, curve: "smooth" },
  };

  const series = [
    { name: titleA, data: s1 },
    { name: titleB, data: s2 },
  ];

  return <Chart options={options} series={series} type="line" height={280} />;
}

const SuperAdminDashboard: React.FC = () => {
  const { userId } = useAuth();
  const { theme } = useTheme();
  const navigate = useNavigate();

  const mode: "dark" | "light" = theme === "dark" ? "dark" : "light";

  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [data, setData] = React.useState<DashboardSummary | null>(null);

  // Optional trends (only shows if endpoint exists)
  const [trends, setTrends] = React.useState<DashboardTrends | null>(null);

  React.useEffect(() => {
    if (!isSuperAdmin()) navigate("/");
  }, [navigate]);

  const fetchSummary = React.useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const res = await fetch(`${BACKEND_URL}/api/super-admin/dashboard/summary`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          ...(userId ? { "x-user-id": String(userId) } : {}),
        },
      });

      const json = await res.json().catch(() => null);

      if (!res.ok) {
        const msg = json?.error || json?.message || `Request failed (${res.status})`;
        throw new Error(msg);
      }

      const summary = json?.data as DashboardSummary | undefined;
      if (!summary) throw new Error("Invalid dashboard response");

      setData(summary);
    } catch (e: any) {
      setError(e?.message || "Failed to load dashboard");
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  // Optional trends: if endpoint is not present, we silently skip
  const fetchTrends = React.useCallback(async () => {
    try {
      const res = await fetch(`${BACKEND_URL}/api/super-admin/dashboard/trends?days=14`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          ...(userId ? { "x-user-id": String(userId) } : {}),
        },
      });
      if (!res.ok) return; // silently ignore (backend not added yet)
      const json = await res.json().catch(() => null);
      const t = json?.data as DashboardTrends | undefined;
      if (t) setTrends(t);
    } catch {
      // ignore
    }
  }, [userId]);

  React.useEffect(() => {
    fetchSummary();
    fetchTrends();
  }, [fetchSummary, fetchTrends]);

  const main = (
    <Card className="max-w-full w-full p-6 space-y-5">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold">Super Admin Dashboard</h1>
          <div className="text-sm opacity-75">Charts-first overview (premium)</div>
        </div>

        <button
          onClick={() => {
            fetchSummary();
            fetchTrends();
          }}
          className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm hover:bg-white/10"
        >
          Refresh
        </button>
      </div>

      {/* States */}
      {loading ? (
        <div className="rounded-2xl border border-white/10 bg-white/5 p-6">Loading...</div>
      ) : error ? (
        <div className="rounded-2xl border border-red-500/30 bg-red-500/10 p-6">
          <div className="font-semibold">Failed to load</div>
          <div className="mt-1 text-sm opacity-80">{error}</div>
          <button
            onClick={fetchSummary}
            className="mt-4 rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm hover:bg-white/10"
          >
            Try again
          </button>
        </div>
      ) : !data ? (
        <div className="rounded-2xl border border-white/10 bg-white/5 p-6">No data.</div>
      ) : (
        <>
          {/* KPI strip (only 4 small tiles) */}
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            <Kpi title="Companies" value={data.core.companies} />
            <Kpi title="Sites" value={data.core.sites} />
            <Kpi
              title="Compliance Today"
              value={`${pct(
                n(data.compliance.checkpointsCompletedToday) + n(data.compliance.checkCallsCompletedToday),
                n(data.compliance.checkpointsScheduledToday) + n(data.compliance.checkCallsScheduledToday)
              )}%`}
              hint="Checkpoints + Calls"
            />
            <Kpi
              title="Revenue (This Month)"
              value={formatMoney(n(data.finance.revenueThisMonth))}
            />
          </div>

          {/* Main charts grid */}
          <div className="grid grid-cols-1 gap-3 lg:grid-cols-12">
            {/* Compliance donuts */}
            <div className="lg:col-span-4">
              <Panel
                title="Checkpoint Compliance (Today)"
                subtitle="Completed / Missed / Remaining"
              >
                <Donut
                  mode={mode}
                  labels={["Completed", "Missed", "Remaining"]}
                  series={[
                    n(data.compliance.checkpointsCompletedToday),
                    n(data.compliance.checkpointsMissedToday),
                    Math.max(
                      0,
                      n(data.compliance.checkpointsScheduledToday) -
                        (n(data.compliance.checkpointsCompletedToday) +
                          n(data.compliance.checkpointsMissedToday))
                    ),
                  ]}
                  totalLabel="Scheduled"
                  totalValue={n(data.compliance.checkpointsScheduledToday)}
                />
              </Panel>
            </div>

            <div className="lg:col-span-4">
              <Panel
                title="Check Call Compliance (Today)"
                subtitle="Completed / Missed / Remaining"
              >
                <Donut
                  mode={mode}
                  labels={["Completed", "Missed", "Remaining"]}
                  series={[
                    n(data.compliance.checkCallsCompletedToday),
                    n(data.compliance.checkCallsMissedToday),
                    Math.max(
                      0,
                      n(data.compliance.checkCallsScheduledToday) -
                        (n(data.compliance.checkCallsCompletedToday) +
                          n(data.compliance.checkCallsMissedToday))
                    ),
                  ]}
                  totalLabel="Scheduled"
                  totalValue={n(data.compliance.checkCallsScheduledToday)}
                />
              </Panel>
            </div>

            {/* Finance bar */}
            <div className="lg:col-span-4">
              <Panel title="Finance (This Month)" subtitle="Revenue vs Payments">
                <Bar
                  mode={mode}
                  title1="Revenue"
                  title2="Payments"
                  v1={n(data.finance.revenueThisMonth)}
                  v2={n(data.finance.paymentsThisMonth)}
                  category="This Month"
                />
                <div className="mt-3 grid grid-cols-3 gap-2 text-xs">
                  <div className="rounded-xl border border-white/10 bg-white/5 p-3">
                    <div className="opacity-70">Invoices</div>
                    <div className="mt-1 text-sm font-semibold">{data.finance.invoices}</div>
                  </div>
                  <div className="rounded-xl border border-white/10 bg-white/5 p-3">
                    <div className="opacity-70">Issued</div>
                    <div className="mt-1 text-sm font-semibold">
                      {data.finance.invoicesIssuedThisMonth}
                    </div>
                  </div>
                  <div className="rounded-xl border border-white/10 bg-white/5 p-3">
                    <div className="opacity-70">Overdue</div>
                    <div className="mt-1 text-sm font-semibold">{data.finance.overdueInvoices}</div>
                  </div>
                </div>
              </Panel>
            </div>

            {/* Core distribution */}
            <div className="lg:col-span-6">
              <Panel title="System Footprint" subtitle="Core distribution">
                <HorizontalBar
                  mode={mode}
                  title="Count"
                  categories={["Companies", "Users", "Clients", "Sites", "Guard Groups"]}
                  values={[
                    n(data.core.companies),
                    n(data.core.users),
                    n(data.core.clients),
                    n(data.core.sites),
                    n(data.core.guardGroups),
                  ]}
                />
              </Panel>
            </div>

            {/* Operations distribution */}
            <div className="lg:col-span-6">
              <Panel title="Operations Snapshot" subtitle="Rosters, shifts, recruitment">
                <HorizontalBar
                  mode={mode}
                  title="Count"
                  categories={["Rosters", "Shifts", "Shifts Today", "Jobs", "Applications"]}
                  values={[
                    n(data.roster.rosters),
                    n(data.roster.shifts),
                    n(data.roster.shiftsToday),
                    n(data.recruitment.jobs),
                    n(data.recruitment.applications),
                  ]}
                />
              </Panel>
            </div>

            {/* Trend lines (only if endpoint exists) */}
            {trends?.checkpoints?.length ? (
              <div className="lg:col-span-6">
                <Panel title="Checkpoint Trend" subtitle="Last 14 days (Completed vs Missed)">
                  <LineTrend
                    mode={mode}
                    titleA="Completed"
                    titleB="Missed"
                    points={trends.checkpoints}
                  />
                </Panel>
              </div>
            ) : null}

            {trends?.checkCalls?.length ? (
              <div className="lg:col-span-6">
                <Panel title="Check Call Trend" subtitle="Last 14 days (Completed vs Missed)">
                  <LineTrend
                    mode={mode}
                    titleA="Completed"
                    titleB="Missed"
                    points={trends.checkCalls}
                  />
                </Panel>
              </div>
            ) : null}
          </div>

          {/* Tiny footer */}
          <div className="text-xs opacity-60">
            Tip: This is super admin dashboard.
            {/* <span className="ml-1 font-mono opacity-80">
              /api/super-admin/dashboard/trends?days=14
            </span> */}
          </div>
        </>
      )}
    </Card>
  );

  return (
    <div
      className={`${
        theme === "dark"
          ? "bg-dark-background text-white"
          : "bg-light-background text-gray-900"
      } min-h-screen`}
    >
      <Navbar />
      <TwoColumnLayout sidebarContent={<SideNavbar />} mainContent={main} />
    </div>
  );
};

export default SuperAdminDashboard;

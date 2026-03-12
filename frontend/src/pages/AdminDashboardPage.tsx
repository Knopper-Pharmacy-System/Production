import { useState, useEffect } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  Cell,
  PieChart,
  Pie,
  LabelList,
} from "recharts";
import { AlertCircle, Clock, TrendingUp, Package } from "lucide-react";
import AdminSidebar from "../components/AdminSidebar";
import AdminHeader from "../components/AdminHeader";

// ─── Types ─────────────────────────────────────────────────────────────────────

type TrendTab = "Week" | "Month" | "Year";

interface SalesDataPoint {
  day: string;
  sales: number;
}

interface StockSegment {
  name: string;
  value: number;
  color: string;
}

interface StockItem {
  name: string;
  value: number;
}

// ─── Data ─────────────────────────────────────────────────────────────────────

const salesTrendWeek: SalesDataPoint[] = [
  { day: "Mon", sales: 520 },
  { day: "Tue", sales: 560 },
  { day: "Wed", sales: 390 },
  { day: "Thu", sales: 620 },
  { day: "Fri", sales: 640 },
  { day: "Sat", sales: 660 },
  { day: "Sun", sales: 870 },
];

const salesTrendMonth: SalesDataPoint[] = [
  { day: "W1", sales: 18000 },
  { day: "W2", sales: 22000 },
  { day: "W3", sales: 19500 },
  { day: "W4", sales: 24000 },
];

const salesTrendYear: SalesDataPoint[] = [
  { day: "Jan", sales: 150000 },
  { day: "Feb", sales: 162000 },
  { day: "Mar", sales: 175000 },
  { day: "Apr", sales: 158000 },
  { day: "May", sales: 190000 },
  { day: "Jun", sales: 210000 },
  { day: "Jul", sales: 225000 },
  { day: "Aug", sales: 198000 },
  { day: "Sep", sales: 230000 },
  { day: "Oct", sales: 245000 },
  { day: "Nov", sales: 260000 },
  { day: "Dec", sales: 285000 },
];

const stockContribution: StockSegment[] = [
  { name: "Healthy", value: 520, color: "#14e644" },
  { name: "Low", value: 47, color: "#ff3b35" },
  { name: "Near Expiry", value: 30, color: "#f3bf2c" },
];

const criticalStockItems: StockItem[] = [
  { name: "PARACETAMOL (ALVEDON)", value: 86.01 },
  { name: "PARACETAMOL (BIOGESIC) 500S", value: 98.79 },
  { name: "AICE 2N1 SUNDAE 800ML", value: 53.79 },
  { name: "AICE DREAM 90ML", value: 33.35 },
];

const TREND_TABS: TrendTab[] = ["Week", "Month", "Year"];

// ─── Main Dashboard ────────────────────────────────────────────────────────────

export default function AdminDashboardPage() {
  const [currentTime, setCurrentTime] = useState<Date>(new Date());
  const [trendTab, setTrendTab] = useState<TrendTab>("Week");
  const [selectedBranch, setSelectedBranch] = useState<string>("BMC MAIN");
  const [sidebarOpen, setSidebarOpen] = useState<boolean>(false);
  const [isOnline, setIsOnline] = useState<boolean>(navigator.onLine);

  useEffect(() => {
    const handleStatus = () => setIsOnline(navigator.onLine);
    window.addEventListener("online", handleStatus);
    window.addEventListener("offline", handleStatus);
    return () => {
      window.removeEventListener("online", handleStatus);
      window.removeEventListener("offline", handleStatus);
    };
  }, []);

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const trendData: SalesDataPoint[] =
    trendTab === "Week"
      ? salesTrendWeek
      : trendTab === "Month"
        ? salesTrendMonth
        : salesTrendYear;

  return (
    <div
      className="min-h-screen w-full overflow-y-auto overflow-x-hidden"
      style={{
        background: "linear-gradient(180deg, #062d8c 40%, #3266e6 100%)",
      }}
    >
      <AdminSidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 py-6 flex flex-col gap-5">
        {/* ── Header Card ──────────────────────────────────────────────────── */}
        <AdminHeader
          onMenuClick={() => setSidebarOpen(true)}
          currentTime={currentTime}
          selectedBranch={selectedBranch}
          onBranchChange={setSelectedBranch}
          isOnline={isOnline}
        />

        {/* ── KPI Cards ────────────────────────────────────────────────────── */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {/* LOW STOCK */}
          <div
            className="rounded-xl p-5 relative overflow-hidden"
            style={{
              background: "#f0f0f0",
              border: "1px solid rgba(0,0,0,0.65)",
              boxShadow: "0 0 40px 5px rgba(0,0,0,0.25)",
            }}
          >
            <div
              className="absolute top-3 right-3 p-1.5 rounded-lg"
              style={{ background: "rgba(230,4,4,0.1)" }}
            >
              <AlertCircle size={18} style={{ color: "rgba(230,4,4,0.67)" }} />
            </div>
            <p
              className="text-base font-extrabold tracking-wide uppercase"
              style={{ color: "#062d8c" }}
            >
              LOW STOCK
            </p>
            <p
              className="text-xs font-semibold mt-0.5"
              style={{ color: "#636363" }}
            >
              Below reorder level
            </p>
            <p
              className="font-extrabold mt-2 leading-none"
              style={{ color: "#e60404", fontSize: "3rem" }}
            >
              29
            </p>
            <div className="flex items-center gap-1 mt-3">
              <span
                className="font-bold"
                style={{ color: "#e60404", fontSize: "10px" }}
              >
                Urgent
              </span>
              <span
                className="ml-1"
                style={{ color: "#636363", fontSize: "10px" }}
              >
                · Reorder now
              </span>
            </div>
          </div>

          {/* NEAR EXPIRY */}
          <div
            className="rounded-xl p-5 relative overflow-hidden"
            style={{
              background: "#f0f0f0",
              border: "1px solid rgba(0,0,0,0.65)",
              boxShadow: "0 4px 4px rgba(0,0,0,0.25)",
            }}
          >
            <div
              className="absolute top-3 right-3 p-1.5 rounded-lg"
              style={{ background: "rgba(179,147,49,0.1)" }}
            >
              <Clock size={18} style={{ color: "#b39331" }} />
            </div>
            <p
              className="text-base font-extrabold tracking-wide uppercase"
              style={{ color: "#062d8c" }}
            >
              NEAR EXPIRY
            </p>
            <p
              className="text-xs font-semibold mt-0.5"
              style={{ color: "#636363" }}
            >
              Items expiring soon
            </p>
            <p
              className="font-extrabold mt-2 leading-none"
              style={{ color: "#b39331", fontSize: "3rem" }}
            >
              10
            </p>
            <div className="flex items-center gap-1 mt-3">
              <span
                className="font-bold"
                style={{ color: "#b39331", fontSize: "10px" }}
              >
                Within 30 days
              </span>
              <span
                className="ml-1"
                style={{ color: "#636363", fontSize: "10px" }}
              >
                · Check soon
              </span>
            </div>
          </div>

          {/* TODAY'S SALE */}
          <div
            className="rounded-xl p-5 relative overflow-hidden"
            style={{
              background: "#f0f0f0",
              border: "1px solid rgba(0,0,0,0.65)",
              boxShadow: "0 4px 4px rgba(0,0,0,0.25)",
            }}
          >
            <div
              className="absolute top-3 right-3 p-1.5 rounded-lg"
              style={{ background: "rgba(0,191,44,0.1)" }}
            >
              <TrendingUp size={18} style={{ color: "#00bf2c" }} />
            </div>
            <p
              className="text-base font-extrabold tracking-wide uppercase"
              style={{ color: "#062d8c" }}
            >
              TODAY'S SALE
            </p>
            <p
              className="text-xs font-semibold mt-0.5"
              style={{ color: "#636363" }}
            >
              Real-time POS Sync
            </p>
            <p
              className="font-bold mt-2 leading-none"
              style={{ color: "#00bf2c", fontSize: "2.5rem" }}
            >
              ₱20,000
            </p>
            <div className="flex items-center gap-1 mt-3">
              <span
                className="font-bold tracking-wider uppercase"
                style={{ color: "#00bf2c", fontSize: "10px" }}
              >
                ₱20,000
              </span>
              <span
                className="ml-1"
                style={{ color: "#636363", fontSize: "10px" }}
              >
                projected
              </span>
            </div>
          </div>

          {/* TOTAL ITEMS */}
          <div
            className="rounded-xl p-5 relative overflow-hidden"
            style={{
              background: "#f0f0f0",
              border: "1px solid rgba(0,0,0,0.65)",
              boxShadow: "0 4px 4px rgba(0,0,0,0.25)",
            }}
          >
            <div
              className="absolute top-3 right-3 p-1.5 rounded-lg"
              style={{ background: "rgba(0,59,205,0.1)" }}
            >
              <Package size={18} style={{ color: "#003bcd" }} />
            </div>
            <p
              className="text-base font-extrabold tracking-wide uppercase"
              style={{ color: "#062d8c" }}
            >
              TOTAL ITEMS
            </p>
            <p
              className="text-xs font-semibold mt-0.5"
              style={{ color: "#636363" }}
            >
              Across all branches
            </p>
            <p
              className="font-bold mt-2 leading-none"
              style={{ color: "#003bcd", fontSize: "3rem" }}
            >
              2,000
            </p>
            <div className="flex items-center gap-1 mt-3">
              <div className="flex" style={{ marginRight: "4px" }}>
                <div
                  className="w-4 h-4 rounded-full"
                  style={{ background: "#003bcd", border: "1px solid #f0f0f0" }}
                />
                <div
                  className="w-4 h-4 rounded-full -ml-1"
                  style={{ background: "#00bf2c", border: "1px solid #f0f0f0" }}
                />
                <div
                  className="w-4 h-4 rounded-full -ml-1"
                  style={{ background: "#b39331", border: "1px solid #f0f0f0" }}
                />
              </div>
              <span style={{ color: "#636363", fontSize: "10px" }}>
                4 branches active
              </span>
            </div>
          </div>
        </div>

        {/* ── Charts Row ────────────────────────────────────────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Sales Trend */}
          <div
            className="rounded-2xl p-6"
            style={{
              background: "#f0f0f0",
              border: "1px solid rgba(47,47,47,0.68)",
              boxShadow: "0 4px 4px rgba(0,0,0,0.25)",
            }}
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-bold" style={{ color: "#062d8c" }}>
                Sales Trend
              </h2>
              <div className="flex gap-1">
                {TREND_TABS.map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setTrendTab(tab)}
                    className="px-3 py-1.5 rounded-lg text-sm font-bold transition-colors"
                    style={{
                      background: trendTab === tab ? "#1133f2" : "transparent",
                      color: trendTab === tab ? "#f5f5f5" : "#001d63",
                      border: "1px solid #dad8d8",
                      cursor: "pointer",
                    }}
                  >
                    {tab}
                  </button>
                ))}
              </div>
            </div>
            <ResponsiveContainer width="100%" height={260}>
              <LineChart
                data={trendData}
                margin={{ top: 10, right: 20, left: 0, bottom: 5 }}
              >
                <defs>
                  <linearGradient id="trendGrad" x1="0" y1="0" x2="1" y2="0">
                    <stop stopColor="#926FFF" />
                    <stop offset="1" stopColor="#F02FC2" />
                  </linearGradient>
                </defs>
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="rgba(0,0,26,0.12)"
                />
                <XAxis
                  dataKey="day"
                  tick={{ fill: "#54555a", fontSize: 12 }}
                  axisLine={{ stroke: "#54555a" }}
                  tickLine={{ stroke: "#54555a" }}
                />
                <YAxis
                  tick={{ fill: "rgba(0,0,0,0.7)", fontSize: 12 }}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip
                  contentStyle={{
                    background: "#fff",
                    border: "1px solid #ddd",
                    borderRadius: 8,
                    fontSize: 12,
                  }}
                  formatter={(val) => [
                    `₱${Number(val).toLocaleString()}`,
                    "Sales",
                  ]}
                />
                <Line
                  type="monotone"
                  dataKey="sales"
                  stroke="url(#trendGrad)"
                  strokeWidth={3}
                  dot={{
                    fill: "#926fff",
                    stroke: "#f02fc2",
                    strokeWidth: 2,
                    r: 5,
                  }}
                  activeDot={{ r: 7 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Stock Contribution */}
          <div
            className="rounded-2xl p-6"
            style={{
              background: "#f0f0f0",
              border: "1px solid rgba(47,47,47,0.68)",
              boxShadow: "0 4px 4px rgba(0,0,0,0.25)",
            }}
          >
            <h2 className="font-bold mb-4" style={{ color: "#062d8c" }}>
              Stock Contribution
            </h2>
            <div className="flex items-center justify-center gap-6">
              <ResponsiveContainer width="60%" height={240}>
                <PieChart>
                  <Pie
                    data={stockContribution}
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={95}
                    startAngle={90}
                    endAngle={-270}
                    dataKey="value"
                    stroke="transparent"
                  >
                    {stockContribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      background: "#fff",
                      border: "1px solid #ddd",
                      borderRadius: 8,
                      fontSize: 12,
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
              <div className="flex flex-col gap-3">
                {stockContribution.map((entry) => (
                  <div key={entry.name} className="flex items-start gap-2">
                    <div
                      className="w-3 h-3 rounded-full mt-0.5 shrink-0"
                      style={{ background: entry.color }}
                    />
                    <div>
                      <p className="text-xs" style={{ color: "#636363" }}>
                        {entry.name}
                      </p>
                      <p
                        className="text-sm font-bold"
                        style={{ color: entry.color }}
                      >
                        {entry.value}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* ── Critical Low Stock Items ──────────────────────────────────────── */}
        <div
          className="rounded-2xl p-6"
          style={{
            background: "#f0f0f0",
            border: "1px solid rgba(47,47,47,0.68)",
            boxShadow: "0 4px 4px rgba(0,0,0,0.5)",
          }}
        >
          <h2 className="font-bold mb-6" style={{ color: "#062d8c" }}>
            Critical Low Stock Items
          </h2>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart
              data={criticalStockItems}
              margin={{ top: 30, right: 30, left: 10, bottom: 20 }}
              barSize={70}
            >
              <CartesianGrid
                strokeDasharray="2 2"
                stroke="rgba(0,0,26,0.15)"
                vertical={false}
              />
              <XAxis
                dataKey="name"
                tick={{ fill: "rgba(0,0,0,0.7)", fontSize: 11 }}
                interval={0}
                axisLine={{ stroke: "rgba(0,0,26,0.3)" }}
                tickLine={false}
              />
              <YAxis
                domain={[0, 100]}
                ticks={[0, 20, 40, 60, 80, 100]}
                tick={{ fill: "rgba(0,0,0,0.7)", fontSize: 12 }}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip
                contentStyle={{
                  background: "#fff",
                  border: "1px solid #ddd",
                  borderRadius: 8,
                  fontSize: 12,
                }}
                formatter={(val) => [Number(val).toFixed(2), "Stock Level"]}
              />
              <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                <LabelList
                  dataKey="value"
                  position="top"
                  style={{ fill: "rgba(0,0,0,0.65)", fontSize: "11px" }}
                  formatter={(val: unknown) => Number(val).toFixed(2)}
                />
                {criticalStockItems.map((_, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill="#8979ff"
                    fillOpacity={0.85}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Footer */}
        <div
          className="text-center pb-4"
          style={{ color: "rgba(255,255,255,0.3)", fontSize: "12px" }}
        >
          Knopper POS Admin Dashboard · {new Date().getFullYear()}
        </div>
      </div>
    </div>
  );
}

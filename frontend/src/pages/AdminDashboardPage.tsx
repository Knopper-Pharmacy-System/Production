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
import {
  Menu,
  Bell,
  AlertCircle,
  Clock,
  TrendingUp,
  Package,
  ChevronDown,
  Circle,
  LogOut,
} from "lucide-react";
import logoSolid from "../assets/logo_solid.png";
import bannerLogo from "../assets/banner_logo.png";
import { logout } from "../hooks/useAuth";

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

const BRANCHES = [
  {
    value: "BMC MAIN",
    address: "#6A J. Miranda Ave., Concepcion Pequeña, Naga City",
  },
  {
    value: "DIVERSION BRANCH",
    address: "Roxas Avenue, Diversion Road, Triangulo, Naga City",
  },
  {
    value: "PANGANIBAN BRANCH",
    address: "Door 11 & 12, Pavilion 7, Panganiban Drive, Naga City",
  },
];

const TREND_TABS: TrendTab[] = ["Week", "Month", "Year"];

// ─── Main Dashboard ────────────────────────────────────────────────────────────

export default function AdminDashboardPage() {
  const [currentTime, setCurrentTime] = useState<Date>(new Date());
  const [trendTab, setTrendTab] = useState<TrendTab>("Week");
  const [selectedBranch, setSelectedBranch] = useState<string>("BMC MAIN");
  const [sidebarOpen, setSidebarOpen] = useState<boolean>(false);

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const formatDate = (date: Date): string =>
    date.toLocaleDateString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
      year: "numeric",
    });

  const formatTime = (date: Date): string =>
    date.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });

  const trendData: SalesDataPoint[] =
    trendTab === "Week"
      ? salesTrendWeek
      : trendTab === "Month"
        ? salesTrendMonth
        : salesTrendYear;

  const branchAddress =
    BRANCHES.find((b) => b.value === selectedBranch)?.address ?? "";

  return (
    <div
      className="min-h-screen w-full overflow-y-auto overflow-x-hidden"
      style={{
        background: "linear-gradient(180deg, #062d8c 40%, #3266e6 100%)",
      }}
    >
      {/* Sidebar Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40"
          style={{ background: "rgba(0,0,0,0.5)" }}
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div
        className="fixed top-0 left-0 h-full w-64 z-50 shadow-2xl transition-transform duration-300 flex flex-col"
        style={{
          background: "#031a6b",
          transform: sidebarOpen ? "translateX(0)" : "translateX(-100%)",
        }}
      >
        <div
          className="p-5"
          style={{ borderBottom: "1px solid rgba(255,255,255,0.1)" }}
        >
          <img
            src={logoSolid}
            alt="Knopper Logo"
            className="h-12 object-contain"
            style={{ opacity: 0.9 }}
          />
        </div>
        <nav
          className="p-4 flex flex-col gap-1 text-sm flex-1"
          style={{ color: "rgba(255,255,255,0.8)" }}
        >
          {[
            "Dashboard",
            "Inventory",
            "Sales Reports",
            "Branches",
            "Users",
            "Settings",
          ].map((item) => (
            <button
              key={item}
              className="text-left px-4 py-3 rounded-lg transition-colors"
              style={{
                background: "transparent",
                color: "rgba(255,255,255,0.8)",
                border: "none",
                cursor: "pointer",
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLButtonElement).style.background =
                  "rgba(255,255,255,0.1)";
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLButtonElement).style.background =
                  "transparent";
              }}
            >
              {item}
            </button>
          ))}
        </nav>
        <div
          className="p-4"
          style={{ borderTop: "1px solid rgba(255,255,255,0.1)" }}
        >
          <button
            onClick={logout}
            className="flex items-center gap-3 w-full text-left px-4 py-3 rounded-lg transition-colors"
            style={{
              background: "transparent",
              color: "rgba(255,100,100,0.9)",
              border: "none",
              fontSize: "0.875rem",
              cursor: "pointer",
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLButtonElement).style.background =
                "rgba(255,80,80,0.12)";
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLButtonElement).style.background =
                "transparent";
            }}
          >
            <LogOut size={16} />
            <span>Logout</span>
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 py-6 flex flex-col gap-5">
        {/* ── Header Card ──────────────────────────────────────────────────── */}
        <div
          className="rounded-2xl px-5 py-4"
          style={{
            background: "#0335af",
            border: "1px solid rgba(255,255,255,0.2)",
            boxShadow: "0 0 20px rgba(0,0,0,0.25)",
          }}
        >
          <div className="flex flex-wrap items-center gap-4">
            {/* Left: Menu + Logo */}
            <div className="flex items-center gap-3">
              <button
                onClick={() => setSidebarOpen(true)}
                className="p-1"
                style={{
                  color: "rgba(255,255,255,0.8)",
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                }}
              >
                <Menu size={24} />
              </button>
              <div className="flex flex-col">
                <img
                  src={bannerLogo}
                  alt="Knopper Logo"
                  className="h-15 object-contain object-left"
                  style={{ opacity: 0.85 }}
                />
                <div className="flex items-center gap-2 mt-1">
                  <span
                    className="text-xs font-semibold tracking-wide"
                    style={{ color: "rgba(228,226,226,0.86)" }}
                  >
                    TERMINAL ID: 000
                  </span>
                  <span
                    className="text-xs"
                    style={{ color: "rgba(255,255,255,0.4)" }}
                  >
                    |
                  </span>
                  <span
                    className="text-xs font-semibold"
                    style={{ color: "rgba(228,226,226,0.86)" }}
                  >
                    ROLE: ADMIN
                  </span>
                </div>
              </div>
            </div>

            {/* Date/Time Card */}
            <div
              className="flex items-center gap-4 px-5 py-3 rounded-2xl shrink-0"
              style={{
                background: "rgba(0,20,69,0.7)",
                border: "1px solid rgba(255,255,255,0.2)",
                boxShadow: "0 4px 16px rgba(0,0,0,0.2)",
              }}
            >
              <div className="flex flex-col">
                <span
                  className="font-semibold tracking-widest uppercase"
                  style={{ fontSize: "9px", color: "rgba(190,140,0,0.85)" }}
                >
                  Current Date
                </span>
                <span
                  className="text-sm font-semibold mt-0.5 whitespace-nowrap"
                  style={{ color: "#c9d9ff" }}
                >
                  {formatDate(currentTime)}
                </span>
              </div>
              <div
                className="w-px h-10"
                style={{ background: "rgba(255,255,255,0.2)" }}
              />
              <div className="flex flex-col">
                <span
                  className="font-semibold tracking-widest uppercase"
                  style={{ fontSize: "9px", color: "rgba(190,140,0,0.85)" }}
                >
                  Last Sync
                </span>
                <span
                  className="text-sm font-semibold mt-0.5 whitespace-nowrap"
                  style={{ color: "#c9d9ff" }}
                >
                  {formatTime(currentTime)}
                </span>
              </div>
            </div>

            {/* Branch + Title */}
            <div
              className="flex flex-col gap-1 flex-1"
              style={{ minWidth: "200px" }}
            >
              <div className="relative inline-block">
                <select
                  value={selectedBranch}
                  onChange={(e) => setSelectedBranch(e.target.value)}
                  className="appearance-none text-sm font-semibold px-3 py-1.5 pr-7 rounded-lg border cursor-pointer focus:outline-none"
                  style={{
                    background: "#f0f0f0",
                    color: "#103182",
                    borderColor: "#b3b1b1",
                    boxShadow: "0 0 54px rgba(3,31,99,0.75)",
                  }}
                >
                  {BRANCHES.map((b) => (
                    <option key={b.value} value={b.value}>
                      {b.value}
                    </option>
                  ))}
                </select>
                <ChevronDown
                  size={14}
                  className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none"
                  style={{ color: "#062d8c" }}
                />
              </div>
              <h1
                className="font-bold text-2xl tracking-wide leading-none"
                style={{ color: "rgba(193,227,255,0.9)" }}
              >
                {selectedBranch}
              </h1>
              <p className="text-xs" style={{ color: "#b9e0ff" }}>
                {branchAddress}
              </p>
            </div>

            {/* Right: Status + Bell */}
            <div className="flex items-center gap-3 ml-auto">
              <span
                className="text-sm font-semibold"
                style={{ color: "rgba(255,255,255,0.6)" }}
              >
                STATUS:
              </span>
              <div
                className="flex items-center gap-2 px-4 py-2 rounded-2xl"
                style={{
                  background: "#0c8628",
                  border: "1px solid #062d8c",
                  boxShadow: "0 0 40px rgba(3,31,99,0.1)",
                }}
              >
                <Circle size={10} fill="#acf9be" style={{ color: "#acf9be" }} />
                <span
                  className="text-sm font-semibold tracking-wider"
                  style={{ color: "#acf9be" }}
                >
                  ONLINE
                </span>
              </div>
              <button
                className="p-2 rounded-lg"
                style={{
                  background: "rgba(217,217,217,0.21)",
                  border: "none",
                  cursor: "pointer",
                }}
              >
                <Bell size={20} style={{ color: "#fff" }} />
              </button>
            </div>
          </div>
        </div>

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

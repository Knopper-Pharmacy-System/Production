import { useState, useRef, useCallback, useMemo } from "react";
import * as XLSX from "xlsx";
import {
  UploadCloud,
  FileSpreadsheet,
  X,
  TrendingUp,
  TrendingDown,
  DollarSign,
  ShoppingCart,
  Users,
  Package,
  BarChart2,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  Search,
  AlertCircle,
  CheckCircle2,
} from "lucide-react";
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import AdminHeader from "../../components/admin/AdminHeader";
import AdminSidebar from "../../components/admin/AdminSidebar";
// import { useIsMobile } from "../components/ui/use-mobile";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface SaleRow {
  date: string;
  time: string;
  cashier: string;
  trxNo: string;
  invoiceNo: string;
  itemCode: string;
  description: string;
  sellingPrice: number;
  priceLevel: string;
  qtySold: number;
  priceSold: number;
  grossSales: number;
  grossCost: number;
  discountS: number;
  discountAmt: number;
  netProfit: number;
  discountTag: number;
}

// ---------------------------------------------------------------------------
// Column name normalizer (handles Excel header variations)
// ---------------------------------------------------------------------------

function normalizeKey(k: string): string {
  return k.toLowerCase().replace(/[^a-z0-9]/g, "");
}

function pickNum(row: Record<string, unknown>, ...keys: string[]): number {
  const norm = Object.fromEntries(
    Object.entries(row).map(([k, v]) => [normalizeKey(k), v]),
  );
  for (const k of keys) {
    const val = norm[normalizeKey(k)];
    if (val !== undefined && val !== null && val !== "") {
      const n = Number(val);
      if (!isNaN(n)) return n;
    }
  }
  return 0;
}

function pickStr(row: Record<string, unknown>, ...keys: string[]): string {
  const norm = Object.fromEntries(
    Object.entries(row).map(([k, v]) => [normalizeKey(k), v]),
  );
  for (const k of keys) {
    const val = norm[normalizeKey(k)];
    if (val !== undefined && val !== null && String(val).trim() !== "") {
      return String(val).trim();
    }
  }
  return "";
}

function parseRows(raw: Record<string, unknown>[]): SaleRow[] {
  return raw
    .filter((r) => {
      const d = pickStr(r, "Date", "date");
      return (
        d && d !== "Date" && d !== "TOTAL" && !String(d).startsWith("ITEM")
      );
    })
    .map((r) => ({
      date: pickStr(r, "Date", "date"),
      time: pickStr(r, "TIME", "Time", "time"),
      cashier: pickStr(r, "Cashier", "cashier", "CASHIER"),
      trxNo: pickStr(r, "TRX NO.", "TRXNO", "trxno"),
      invoiceNo: pickStr(r, "INVOICE/Q.R.#", "invoiceqr", "INVOICE"),
      itemCode: pickStr(r, "ITEM CODE", "itemcode", "ITEMCODE"),
      description: pickStr(r, "DESCRIPTION", "description", "Description"),
      sellingPrice: pickNum(r, "SELLING PRICE", "sellingprice"),
      priceLevel: pickStr(r, "PRICE LEVEL", "pricelevel"),
      qtySold: pickNum(r, "QTY SOLD", "qtysold"),
      priceSold: pickNum(r, "PRICE SOLD", "pricesold"),
      grossSales: pickNum(r, "GROSS SALES", "grosssales"),
      grossCost: pickNum(r, "GROSS COS", "GROSS COST", "grosscost", "grosscos"),
      discountS: pickNum(r, "DISCOUNT $", "discounts"),
      discountAmt: pickNum(r, "DISCOUNT AMT", "discountamt"),
      netProfit: pickNum(r, "NET PROFIT", "netprofit"),
      discountTag: pickNum(r, "DISCOUNT TAG%", "discounttag"),
    }));
}

// ---------------------------------------------------------------------------
// Chart color palette
// ---------------------------------------------------------------------------

const PALETTE = [
  "#3266e6",
  "#CB3CFF",
  "#10b981",
  "#f59e0b",
  "#ef4444",
  "#06b6d4",
  "#8b5cf6",
  "#f97316",
];

// ---------------------------------------------------------------------------
// Formatting helpers
// ---------------------------------------------------------------------------

function fmtPeso(v: number) {
  return (
    "P " +
    v.toLocaleString("en-PH", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })
  );
}
function fmtNum(v: number) {
  return v.toLocaleString("en-PH");
}
function shortPeso(v: number) {
  if (v >= 1_000_000) return "P " + (v / 1_000_000).toFixed(2) + "M";
  if (v >= 1_000) return "P " + (v / 1_000).toFixed(1) + "K";
  return fmtPeso(v);
}

// ---------------------------------------------------------------------------
// KPI Card
// ---------------------------------------------------------------------------

function KpiCard({
  label,
  value,
  sub,
  icon,
  color,
  trend,
}: {
  label: string;
  value: string;
  sub?: string;
  icon: React.ReactNode;
  color: string;
  trend?: "up" | "down" | "neutral";
}) {
  return (
    <div
      className="rounded-2xl p-5 flex flex-col gap-3 relative overflow-hidden"
      style={{
        background: "rgba(3,33,160,0.38)",
        border: "1px solid rgba(255,255,255,0.10)",
      }}
    >
      <div
        className="absolute inset-0 pointer-events-none rounded-2xl"
        style={{
          background:
            "linear-gradient(135deg,rgba(255,255,255,0.06) 0%,transparent 60%)",
        }}
      />
      <div className="flex items-start justify-between relative z-10">
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
          style={{ background: color + "22", border: `1px solid ${color}44` }}
        >
          <span style={{ color }}>{icon}</span>
        </div>
        {trend && trend !== "neutral" && (
          <div
            className="flex items-center gap-1 px-2 py-1 rounded-full text-xs font-semibold"
            style={{
              background:
                trend === "up"
                  ? "rgba(16,185,129,0.15)"
                  : "rgba(239,68,68,0.15)",
              color: trend === "up" ? "#10b981" : "#ef4444",
            }}
          >
            {trend === "up" ? (
              <TrendingUp size={11} />
            ) : (
              <TrendingDown size={11} />
            )}
          </div>
        )}
      </div>
      <div className="relative z-10">
        <p
          className="font-semibold text-xl text-white"
          style={{ fontFamily: "'Inter', sans-serif" }}
        >
          {value}
        </p>
        <p
          className="text-sm mt-0.5"
          style={{
            color: "rgba(185,224,255,0.7)",
            fontFamily: "'Inter', sans-serif",
          }}
        >
          {label}
        </p>
        {sub && (
          <p
            className="text-xs mt-1"
            style={{
              color: "rgba(185,224,255,0.45)",
              fontFamily: "'Inter', sans-serif",
            }}
          >
            {sub}
          </p>
        )}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Chart card wrapper
// ---------------------------------------------------------------------------

function ChartCard({
  title,
  children,
  action,
}: {
  title: string;
  children: React.ReactNode;
  action?: React.ReactNode;
}) {
  return (
    <div
      className="rounded-2xl p-5 flex flex-col gap-4"
      style={{
        background: "rgba(3,33,160,0.38)",
        border: "1px solid rgba(255,255,255,0.10)",
      }}
    >
      <div className="flex items-center justify-between">
        <p
          className="font-semibold text-base text-white"
          style={{ fontFamily: "'Inter', sans-serif" }}
        >
          {title}
        </p>
        {action}
      </div>
      {children}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Custom recharts tooltip
// ---------------------------------------------------------------------------

function CustomTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: { name: string; value: number; color: string }[];
  label?: string;
}) {
  if (!active || !payload?.length) return null;
  return (
    <div
      className="rounded-xl px-4 py-3 shadow-2xl border border-white/10 text-sm"
      style={{
        background: "rgba(4,24,72,0.97)",
        fontFamily: "'Inter', sans-serif",
      }}
    >
      {label && <p className="text-white/60 mb-2">{label}</p>}
      {payload.map((p, i) => (
        <div key={i} className="flex items-center gap-2">
          <span
            className="w-2 h-2 rounded-full"
            style={{ background: p.color }}
          />
          <span className="text-white/80">{p.name}:</span>
          <span className="text-white font-semibold">
            {(typeof p.value === "number" &&
              p.name?.toLowerCase().includes("profit")) ||
            p.name?.toLowerCase().includes("sales") ||
            p.name?.toLowerCase().includes("revenue")
              ? fmtPeso(p.value)
              : fmtNum(p.value)}
          </span>
        </div>
      ))}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Upload zone
// ---------------------------------------------------------------------------

function UploadZone({
  onFile,
  isDragging,
  onDragOver,
  onDragLeave,
  onDrop,
}: {
  onFile: (f: File) => void;
  isDragging: boolean;
  onDragOver: (e: React.DragEvent) => void;
  onDragLeave: () => void;
  onDrop: (e: React.DragEvent) => void;
}) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  return (
    <div className="flex flex-col items-center justify-center py-16 mt-4 w-full">
      <div
        onClick={() => inputRef.current?.click()}
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        onDrop={onDrop}
        className="w-full max-w-2xl rounded-3xl flex flex-col items-center justify-center gap-6 py-16 px-8 cursor-pointer transition-all duration-200 select-none"
        style={{
          border: isDragging
            ? "2px dashed #3266e6"
            : "2px dashed rgba(185,224,255,0.25)",
          background: isDragging
            ? "rgba(50,102,230,0.10)"
            : "rgba(3,33,160,0.22)",
        }}
      >
        <div
          className="w-24 h-24 rounded-3xl flex items-center justify-center"
          style={{
            background: "rgba(50,102,230,0.18)",
            border: "1px solid rgba(50,102,230,0.35)",
          }}
        >
          <UploadCloud size={48} color="#3266e6" />
        </div>

        <div className="flex flex-col items-center gap-2 text-center">
          <p
            className="font-semibold text-2xl text-white"
            style={{ fontFamily: "'Inter', sans-serif" }}
          >
            Upload Sales Report
          </p>
          <p
            className="text-base"
            style={{
              color: "rgba(185,224,255,0.65)",
              fontFamily: "'Inter', sans-serif",
            }}
          >
            Drag & drop your Excel file here, or{" "}
            <span className="text-[#3266e6] underline underline-offset-2">
              click to browse
            </span>
          </p>
          <p
            className="text-sm"
            style={{
              color: "rgba(185,224,255,0.40)",
              fontFamily: "'Inter', sans-serif",
            }}
          >
            Supports .xlsx, .xls files — DOMINO PHARMA item sales by cashier
            transaction report
          </p>
        </div>

        {/* Format hints */}
        <div className="flex flex-wrap items-center justify-center gap-3">
          {[
            "Date",
            "Cashier",
            "Description",
            "Gross Sales",
            "Net Profit",
            "QTY Sold",
          ].map((col) => (
            <span
              key={col}
              className="px-3 py-1 rounded-full text-xs font-medium"
              style={{
                background: "rgba(50,102,230,0.18)",
                border: "1px solid rgba(50,102,230,0.3)",
                color: "rgba(185,224,255,0.8)",
                fontFamily: "'Inter', sans-serif",
              }}
            >
              {col}
            </span>
          ))}
        </div>

        <input
          ref={inputRef}
          type="file"
          accept=".xlsx,.xls"
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) onFile(f);
            e.target.value = "";
          }}
        />
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main page
// ---------------------------------------------------------------------------

const PAGE_SIZE = 15;

export default function AdminSalesAnalytics() {
  //   const isMobile = useIsMobile();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [currentTime] = useState(new Date());
  const [isOnline] = useState(navigator.onLine);

  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [rows, setRows] = useState<SaleRow[]>([]);

  // Table state
  const [searchQ, setSearchQ] = useState("");
  const [page, setPage] = useState(1);

  // ---------------------------------------------------------------------------
  // File processing
  // ---------------------------------------------------------------------------

  const processFile = useCallback(async (file: File) => {
    setErrorMsg(null);
    setIsProcessing(true);
    setFileName(file.name);
    try {
      const buf = await file.arrayBuffer();
      const wb = XLSX.read(buf, { type: "array" });
      const ws = wb.Sheets[wb.SheetNames[0]];

      // Find header row — scan first 20 rows for one containing "Date"
      let headerRow = 0;
      const range = XLSX.utils.decode_range(ws["!ref"] || "A1:A1");
      outer: for (
        let r = range.s.r;
        r < Math.min(range.s.r + 25, range.e.r);
        r++
      ) {
        for (let c = range.s.c; c <= range.e.c; c++) {
          const cell = ws[XLSX.utils.encode_cell({ r, c })];
          if (cell && String(cell.v).trim().toLowerCase() === "date") {
            headerRow = r;
            break outer;
          }
        }
      }

      const raw = XLSX.utils.sheet_to_json<Record<string, unknown>>(ws, {
        range: headerRow,
        defval: "",
      });

      const parsed = parseRows(raw);
      if (parsed.length === 0) {
        setErrorMsg(
          "No valid sales rows found. Make sure the file is a DOMINO PHARMA item sales transaction report.",
        );
        setFileName(null);
      } else {
        setRows(parsed);
        setPage(1);
        setSearchQ("");
      }
    } catch (e) {
      setErrorMsg(
        "Failed to read the file. Please make sure it is a valid Excel (.xlsx / .xls) file.",
      );
      setFileName(null);
    } finally {
      setIsProcessing(false);
    }
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);
  const handleDragLeave = useCallback(() => setIsDragging(false), []);
  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      const f = e.dataTransfer.files[0];
      if (f) processFile(f);
    },
    [processFile],
  );

  // ---------------------------------------------------------------------------
  // Analytics derivations
  // ---------------------------------------------------------------------------

  const analytics = useMemo(() => {
    if (!rows.length) return null;

    const totalGross = rows.reduce((s, r) => s + r.grossSales, 0);
    const totalProfit = rows.reduce((s, r) => s + r.netProfit, 0);
    const totalCost = rows.reduce((s, r) => s + r.grossCost, 0);
    const totalQty = rows.reduce((s, r) => s + r.qtySold, 0);
    const totalDisc = rows.reduce((s, r) => s + r.discountAmt, 0);
    const uniqueDates = [...new Set(rows.map((r) => r.date))].sort();
    const uniqueCash = [...new Set(rows.map((r) => r.cashier).filter(Boolean))];
    const uniqueItems = [
      ...new Set(rows.map((r) => r.description).filter(Boolean)),
    ];
    const avgMargin = totalGross > 0 ? (totalProfit / totalGross) * 100 : 0;

    // By date
    const byDate = uniqueDates.map((d) => {
      const dayRows = rows.filter((r) => r.date === d);
      return {
        date: d,
        gross: dayRows.reduce((s, r) => s + r.grossSales, 0),
        profit: dayRows.reduce((s, r) => s + r.netProfit, 0),
        qty: dayRows.reduce((s, r) => s + r.qtySold, 0),
      };
    });

    // By cashier
    const cashierMap: Record<
      string,
      { gross: number; profit: number; txns: number }
    > = {};
    rows.forEach((r) => {
      if (!r.cashier) return;
      if (!cashierMap[r.cashier])
        cashierMap[r.cashier] = { gross: 0, profit: 0, txns: 0 };
      cashierMap[r.cashier].gross += r.grossSales;
      cashierMap[r.cashier].profit += r.netProfit;
      cashierMap[r.cashier].txns++;
    });
    const byCashier = Object.entries(cashierMap)
      .map(([name, d]) => ({
        name: name.replace(/\./g, " ").split(" ").slice(0, 2).join(" "),
        ...d,
      }))
      .sort((a, b) => b.gross - a.gross)
      .slice(0, 10);

    // Top items by gross sales
    const itemMap: Record<
      string,
      { gross: number; qty: number; profit: number }
    > = {};
    rows.forEach((r) => {
      const k = r.description || r.itemCode || "Unknown";
      if (!itemMap[k]) itemMap[k] = { gross: 0, qty: 0, profit: 0 };
      itemMap[k].gross += r.grossSales;
      itemMap[k].qty += r.qtySold;
      itemMap[k].profit += r.netProfit;
    });
    const topItems = Object.entries(itemMap)
      .map(([name, d]) => ({
        name: name.length > 28 ? name.slice(0, 26) + "..." : name,
        ...d,
      }))
      .sort((a, b) => b.gross - a.gross)
      .slice(0, 10);

    // Price level distribution
    const levelMap: Record<string, number> = {};
    rows.forEach((r) => {
      const k = r.priceLevel || "N/A";
      levelMap[k] = (levelMap[k] || 0) + r.grossSales;
    });
    const byLevel = Object.entries(levelMap)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);

    return {
      totalGross,
      totalProfit,
      totalCost,
      totalQty,
      totalDisc,
      uniqueDates,
      uniqueCash,
      uniqueItems,
      avgMargin,
      byDate,
      byCashier,
      topItems,
      byLevel,
    };
  }, [rows]);

  // ---------------------------------------------------------------------------
  // Table (filtered + paginated)
  // ---------------------------------------------------------------------------

  const filteredRows = useMemo(() => {
    if (!searchQ.trim()) return rows;
    const q = searchQ.toLowerCase();
    return rows.filter(
      (r) =>
        r.description.toLowerCase().includes(q) ||
        r.cashier.toLowerCase().includes(q) ||
        r.date.includes(q) ||
        r.itemCode.toLowerCase().includes(q),
    );
  }, [rows, searchQ]);

  const totalPages = Math.max(1, Math.ceil(filteredRows.length / PAGE_SIZE));
  const pagedRows = filteredRows.slice(
    (page - 1) * PAGE_SIZE,
    page * PAGE_SIZE,
  );

  const safePage = (p: number) => setPage(Math.max(1, Math.min(p, totalPages)));

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------

  const hasData = rows.length > 0;

  return (
    <div
      className="min-h-screen w-full overflow-y-auto overflow-x-hidden relative"
      style={{ background: "linear-gradient(180deg,#062d8c 0%,#061a5c 100%)" }}
    >
      <AdminSidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        activeItem="Sales Reports"
      />

      {/* Main Content */}
      <div className="relative z-10 w-full max-w-450 mx-auto px-4 sm:px-6 lg:px-8 xl:px-10 2xl:px-12 py-6 flex flex-col gap-5">
        <AdminHeader
          onMenuClick={() => setSidebarOpen(true)}
          currentTime={currentTime}
          isOnline={isOnline}
        />

        {/* ── Page header bar ── */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div className="flex items-center gap-3">
            <div
              className="w-9 h-9 rounded-xl flex items-center justify-center"
              style={{
                background: "rgba(50,102,230,0.25)",
                border: "1px solid rgba(50,102,230,0.4)",
              }}
            >
              <BarChart2 size={18} color="#3266e6" />
            </div>
            <div>
              <p
                className="font-semibold text-white text-base"
                style={{ fontFamily: "'Inter',sans-serif" }}
              >
                Sales Analytics
              </p>
              <p
                className="text-xs"
                style={{
                  color: "rgba(185,224,255,0.55)",
                  fontFamily: "'Inter',sans-serif",
                }}
              >
                Upload an Excel report to begin
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {hasData && (
              <>
                <div
                  className="flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-semibold"
                  style={{
                    background: "rgba(16,185,129,0.15)",
                    border: "1px solid rgba(16,185,129,0.3)",
                    color: "#10b981",
                  }}
                >
                  <CheckCircle2 size={13} />
                  {rows.length.toLocaleString()} rows loaded
                </div>
                <button
                  onClick={() => {
                    setRows([]);
                    setFileName(null);
                    setSearchQ("");
                    setPage(1);
                  }}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-semibold transition-opacity hover:opacity-80"
                  style={{
                    background: "rgba(239,68,68,0.15)",
                    border: "1px solid rgba(239,68,68,0.3)",
                    color: "#ef4444",
                  }}
                >
                  <RefreshCw size={13} />
                  Clear
                </button>
              </>
            )}
            {fileName && (
              <div
                className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs"
                style={{
                  background: "rgba(255,255,255,0.06)",
                  border: "1px solid rgba(255,255,255,0.12)",
                  color: "rgba(185,224,255,0.7)",
                }}
              >
                <FileSpreadsheet size={13} />
                <span className="max-w-45 truncate">{fileName}</span>
              </div>
            )}
          </div>
        </div>

        {/* ── Error ── */}
        {errorMsg && (
          <div
            className="flex items-start gap-3 rounded-2xl px-5 py-4"
            style={{
              background: "rgba(239,68,68,0.12)",
              border: "1px solid rgba(239,68,68,0.35)",
            }}
          >
            <AlertCircle size={18} className="text-red-400 shrink-0 mt-0.5" />
            <p
              className="text-sm text-red-300 flex-1"
              style={{ fontFamily: "'Inter',sans-serif" }}
            >
              {errorMsg}
            </p>
            <button
              onClick={() => setErrorMsg(null)}
              className="text-red-400/60 hover:text-red-300"
            >
              <X size={16} />
            </button>
          </div>
        )}

        {/* ── Processing spinner ── */}
        {isProcessing && (
          <div className="flex flex-col items-center justify-center gap-4 py-20 mt-8 w-full">
            <div
              className="w-16 h-16 rounded-2xl flex items-center justify-center animate-pulse"
              style={{
                background: "rgba(50,102,230,0.2)",
                border: "1px solid rgba(50,102,230,0.4)",
              }}
            >
              <FileSpreadsheet size={32} color="#3266e6" />
            </div>
            <p
              className="text-white font-semibold text-lg"
              style={{ fontFamily: "'Inter',sans-serif" }}
            >
              Processing file...
            </p>
            <p
              style={{
                color: "rgba(185,224,255,0.55)",
                fontFamily: "'Inter',sans-serif",
              }}
              className="text-sm"
            >
              Parsing rows and computing analytics
            </p>
          </div>
        )}

        {/* ── Upload zone (no data) ── */}
        {!isProcessing && !hasData && (
          <UploadZone
            onFile={processFile}
            isDragging={isDragging}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
          />
        )}

        {/* ── Dashboard (has data) ── */}
        {!isProcessing && hasData && analytics && (
          <div className="flex flex-col gap-5">
            {/* ── KPI cards ── */}
            <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4">
              <KpiCard
                label="Total Gross Sales"
                value={shortPeso(analytics.totalGross)}
                sub={fmtPeso(analytics.totalGross)}
                icon={<DollarSign size={18} />}
                color="#3266e6"
                trend="up"
              />
              <KpiCard
                label="Total Net Profit"
                value={shortPeso(analytics.totalProfit)}
                sub={fmtPeso(analytics.totalProfit)}
                icon={<TrendingUp size={18} />}
                color="#10b981"
                trend="up"
              />
              <KpiCard
                label="Total Gross Cost"
                value={shortPeso(analytics.totalCost)}
                sub={fmtPeso(analytics.totalCost)}
                icon={<ShoppingCart size={18} />}
                color="#f59e0b"
                trend="neutral"
              />
              <KpiCard
                label="Qty Sold"
                value={fmtNum(analytics.totalQty)}
                sub="units"
                icon={<Package size={18} />}
                color="#CB3CFF"
                trend="up"
              />
              <KpiCard
                label="Profit Margin"
                value={analytics.avgMargin.toFixed(1) + "%"}
                sub="gross / net ratio"
                icon={<BarChart2 size={18} />}
                color="#06b6d4"
                trend={analytics.avgMargin > 20 ? "up" : "down"}
              />
              <KpiCard
                label="Total Discounts"
                value={shortPeso(analytics.totalDisc)}
                sub={`${analytics.uniqueCash.length} cashiers`}
                icon={<Users size={18} />}
                color="#ef4444"
                trend="neutral"
              />
            </div>

            {/* ── Sales trend + Price level pie ── */}
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
              <div className="xl:col-span-2">
                <ChartCard title="Daily Sales Trend">
                  <ResponsiveContainer width="100%" height={220}>
                    <AreaChart
                      data={analytics.byDate}
                      margin={{ top: 4, right: 8, left: 0, bottom: 0 }}
                    >
                      <defs>
                        <linearGradient id="gGross" x1="0" y1="0" x2="0" y2="1">
                          <stop
                            offset="5%"
                            stopColor="#3266e6"
                            stopOpacity={0.35}
                          />
                          <stop
                            offset="95%"
                            stopColor="#3266e6"
                            stopOpacity={0.02}
                          />
                        </linearGradient>
                        <linearGradient
                          id="gProfit"
                          x1="0"
                          y1="0"
                          x2="0"
                          y2="1"
                        >
                          <stop
                            offset="5%"
                            stopColor="#10b981"
                            stopOpacity={0.35}
                          />
                          <stop
                            offset="95%"
                            stopColor="#10b981"
                            stopOpacity={0.02}
                          />
                        </linearGradient>
                      </defs>
                      <CartesianGrid
                        strokeDasharray="3 3"
                        stroke="rgba(255,255,255,0.06)"
                      />
                      <XAxis
                        dataKey="date"
                        tick={{ fill: "rgba(185,224,255,0.5)", fontSize: 11 }}
                        tickLine={false}
                        axisLine={false}
                        tickFormatter={(v: string) => {
                          const parts = v.split("/");
                          return parts.length >= 2
                            ? `${parts[0]}/${parts[1]}`
                            : v;
                        }}
                      />
                      <YAxis
                        tick={{ fill: "rgba(185,224,255,0.5)", fontSize: 10 }}
                        tickLine={false}
                        axisLine={false}
                        tickFormatter={(v: number) =>
                          shortPeso(v).replace("P ", "")
                        }
                        width={52}
                      />
                      <Tooltip
                        content={(p) => (
                          <CustomTooltip
                            {...p}
                            active={p.active}
                            payload={
                              p.payload as
                                | {
                                    name: string;
                                    value: number;
                                    color: string;
                                  }[]
                                | undefined
                            }
                            label={p.label}
                          />
                        )}
                      />
                      <Legend
                        wrapperStyle={{
                          color: "rgba(185,224,255,0.6)",
                          fontSize: 12,
                          paddingTop: 8,
                        }}
                      />
                      <Area
                        type="monotone"
                        dataKey="gross"
                        name="Gross Sales"
                        stroke="#3266e6"
                        fill="url(#gGross)"
                        strokeWidth={2}
                        dot={false}
                      />
                      <Area
                        type="monotone"
                        dataKey="profit"
                        name="Net Profit"
                        stroke="#10b981"
                        fill="url(#gProfit)"
                        strokeWidth={2}
                        dot={false}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </ChartCard>
              </div>

              <ChartCard title="Price Level Split">
                <ResponsiveContainer width="100%" height={220}>
                  <PieChart>
                    <Pie
                      data={analytics.byLevel}
                      cx="50%"
                      cy="48%"
                      innerRadius={55}
                      outerRadius={85}
                      paddingAngle={3}
                      dataKey="value"
                      label={({
                        name,
                        percent,
                      }: {
                        name: string;
                        percent: number;
                      }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      labelLine={false}
                    >
                      {analytics.byLevel.map((_e, i) => (
                        <Cell key={i} fill={PALETTE[i % PALETTE.length]} />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(v: number) => [fmtPeso(v), "Sales"]}
                      contentStyle={{
                        background: "rgba(4,24,72,0.97)",
                        border: "1px solid rgba(255,255,255,0.1)",
                        borderRadius: 12,
                      }}
                      labelStyle={{ color: "rgba(185,224,255,0.6)" }}
                      itemStyle={{ color: "#ffffff" }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </ChartCard>
            </div>

            {/* ── Top items + Cashier performance ── */}
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
              <ChartCard title="Top 10 Items by Gross Sales">
                <ResponsiveContainer width="100%" height={260}>
                  <BarChart
                    data={analytics.topItems}
                    layout="vertical"
                    margin={{ top: 0, right: 16, left: 0, bottom: 0 }}
                  >
                    <CartesianGrid
                      strokeDasharray="3 3"
                      stroke="rgba(255,255,255,0.06)"
                      horizontal={false}
                    />
                    <XAxis
                      type="number"
                      tick={{ fill: "rgba(185,224,255,0.5)", fontSize: 10 }}
                      tickLine={false}
                      axisLine={false}
                      tickFormatter={(v: number) =>
                        shortPeso(v).replace("P ", "")
                      }
                    />
                    <YAxis
                      type="category"
                      dataKey="name"
                      tick={{ fill: "rgba(185,224,255,0.7)", fontSize: 10 }}
                      tickLine={false}
                      axisLine={false}
                      width={120}
                    />
                    <Tooltip
                      content={(p) => (
                        <CustomTooltip
                          {...p}
                          active={p.active}
                          payload={
                            p.payload as
                              | { name: string; value: number; color: string }[]
                              | undefined
                          }
                          label={p.label}
                        />
                      )}
                    />
                    <Bar
                      dataKey="gross"
                      name="Gross Sales"
                      fill="#3266e6"
                      radius={[0, 5, 5, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </ChartCard>

              <ChartCard title="Cashier Performance">
                <ResponsiveContainer width="100%" height={260}>
                  <BarChart
                    data={analytics.byCashier}
                    margin={{ top: 0, right: 8, left: 0, bottom: 30 }}
                  >
                    <CartesianGrid
                      strokeDasharray="3 3"
                      stroke="rgba(255,255,255,0.06)"
                      vertical={false}
                    />
                    <XAxis
                      dataKey="name"
                      tick={{ fill: "rgba(185,224,255,0.6)", fontSize: 10 }}
                      tickLine={false}
                      axisLine={false}
                      angle={-30}
                      textAnchor="end"
                      interval={0}
                    />
                    <YAxis
                      tick={{ fill: "rgba(185,224,255,0.5)", fontSize: 10 }}
                      tickLine={false}
                      axisLine={false}
                      tickFormatter={(v: number) =>
                        shortPeso(v).replace("P ", "")
                      }
                      width={50}
                    />
                    <Tooltip
                      content={(p) => (
                        <CustomTooltip
                          {...p}
                          active={p.active}
                          payload={
                            p.payload as
                              | { name: string; value: number; color: string }[]
                              | undefined
                          }
                          label={p.label}
                        />
                      )}
                    />
                    <Legend
                      wrapperStyle={{
                        color: "rgba(185,224,255,0.6)",
                        fontSize: 11,
                      }}
                    />
                    <Bar
                      dataKey="gross"
                      name="Gross Sales"
                      fill="#3266e6"
                      radius={[4, 4, 0, 0]}
                    />
                    <Bar
                      dataKey="profit"
                      name="Net Profit"
                      fill="#10b981"
                      radius={[4, 4, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </ChartCard>
            </div>

            {/* ── Daily qty sold bar ── */}
            <ChartCard title="Daily Units Sold">
              <ResponsiveContainer width="100%" height={160}>
                <BarChart
                  data={analytics.byDate}
                  margin={{ top: 0, right: 8, left: 0, bottom: 0 }}
                >
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="rgba(255,255,255,0.06)"
                    vertical={false}
                  />
                  <XAxis
                    dataKey="date"
                    tick={{ fill: "rgba(185,224,255,0.5)", fontSize: 10 }}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(v: string) => {
                      const parts = v.split("/");
                      return parts.length >= 2 ? `${parts[0]}/${parts[1]}` : v;
                    }}
                  />
                  <YAxis
                    tick={{ fill: "rgba(185,224,255,0.5)", fontSize: 10 }}
                    tickLine={false}
                    axisLine={false}
                    width={36}
                  />
                  <Tooltip
                    formatter={(v: number) => [fmtNum(v), "Units Sold"]}
                    contentStyle={{
                      background: "rgba(4,24,72,0.97)",
                      border: "1px solid rgba(255,255,255,0.1)",
                      borderRadius: 12,
                    }}
                    labelStyle={{ color: "rgba(185,224,255,0.6)" }}
                    itemStyle={{ color: "#ffffff" }}
                  />
                  <Bar
                    dataKey="qty"
                    name="Units"
                    fill="#CB3CFF"
                    radius={[4, 4, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </ChartCard>

            {/* ── Raw data table ── */}
            <div
              className="rounded-2xl overflow-hidden"
              style={{ border: "1px solid rgba(255,255,255,0.10)" }}
            >
              {/* Table header bar */}
              <div
                className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 px-5 py-4"
                style={{
                  background: "rgba(3,33,160,0.55)",
                  borderBottom: "1px solid rgba(255,255,255,0.08)",
                }}
              >
                <p
                  className="font-semibold text-white text-sm"
                  style={{ fontFamily: "'Inter',sans-serif" }}
                >
                  Transaction Records
                  <span
                    className="ml-2 text-xs font-normal"
                    style={{ color: "rgba(185,224,255,0.5)" }}
                  >
                    ({filteredRows.length.toLocaleString()} rows)
                  </span>
                </p>
                <div className="flex items-center gap-3 w-full sm:w-auto">
                  {/* Search */}
                  <div
                    className="flex items-center gap-2 px-3 py-2 rounded-xl flex-1 sm:flex-none sm:w-64"
                    style={{
                      background: "rgba(255,255,255,0.07)",
                      border: "1px solid rgba(255,255,255,0.12)",
                    }}
                  >
                    <Search size={14} color="rgba(185,224,255,0.5)" />
                    <input
                      value={searchQ}
                      onChange={(e) => {
                        setSearchQ(e.target.value);
                        setPage(1);
                      }}
                      placeholder="Search item, cashier, date..."
                      className="bg-transparent border-none outline-none text-white text-sm flex-1 placeholder:text-white/30"
                      style={{ fontFamily: "'Inter',sans-serif" }}
                    />
                    {searchQ && (
                      <button
                        onClick={() => {
                          setSearchQ("");
                          setPage(1);
                        }}
                      >
                        <X size={13} color="rgba(185,224,255,0.5)" />
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* Table */}
              <div
                className="overflow-x-auto"
                style={{ background: "rgba(3,22,100,0.35)" }}
              >
                <table
                  className="w-full text-xs"
                  style={{
                    fontFamily: "'Inter',sans-serif",
                    minWidth: "900px",
                  }}
                >
                  <thead>
                    <tr
                      style={{
                        borderBottom: "1px solid rgba(255,255,255,0.08)",
                      }}
                    >
                      {[
                        "Date",
                        "Time",
                        "Cashier",
                        "Trx No.",
                        "Description",
                        "Selling Price",
                        "Qty",
                        "Gross Sales",
                        "Gross Cost",
                        "Disc. Amt",
                        "Net Profit",
                      ].map((h) => (
                        <th
                          key={h}
                          className="px-3 py-3 text-left whitespace-nowrap"
                          style={{
                            color: "rgba(185,224,255,0.55)",
                            fontWeight: 600,
                          }}
                        >
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {pagedRows.map((r, i) => (
                      <tr
                        key={i}
                        style={{
                          borderBottom: "1px solid rgba(255,255,255,0.04)",
                          background:
                            i % 2 === 0
                              ? "rgba(255,255,255,0.015)"
                              : "transparent",
                        }}
                      >
                        <td className="px-3 py-2.5 whitespace-nowrap text-white/80">
                          {r.date}
                        </td>
                        <td className="px-3 py-2.5 whitespace-nowrap text-white/60">
                          {r.time}
                        </td>
                        <td className="px-3 py-2.5 whitespace-nowrap text-white/80">
                          {r.cashier}
                        </td>
                        <td className="px-3 py-2.5 whitespace-nowrap text-white/50">
                          {r.trxNo}
                        </td>
                        <td
                          className="px-3 py-2.5 text-white/90 max-w-50 truncate"
                          title={r.description}
                        >
                          {r.description}
                        </td>
                        <td className="px-3 py-2.5 whitespace-nowrap text-right text-white/70">
                          {fmtPeso(r.sellingPrice)}
                        </td>
                        <td className="px-3 py-2.5 whitespace-nowrap text-center text-white/70">
                          {r.qtySold}
                        </td>
                        <td className="px-3 py-2.5 whitespace-nowrap text-right text-[#3266e6] font-medium">
                          {fmtPeso(r.grossSales)}
                        </td>
                        <td className="px-3 py-2.5 whitespace-nowrap text-right text-white/60">
                          {fmtPeso(r.grossCost)}
                        </td>
                        <td className="px-3 py-2.5 whitespace-nowrap text-right text-[#f59e0b]">
                          {fmtPeso(r.discountAmt)}
                        </td>
                        <td
                          className={`px-3 py-2.5 whitespace-nowrap text-right font-semibold ${r.netProfit >= 0 ? "text-[#10b981]" : "text-[#ef4444]"}`}
                        >
                          {fmtPeso(r.netProfit)}
                        </td>
                      </tr>
                    ))}
                    {pagedRows.length === 0 && (
                      <tr>
                        <td
                          colSpan={11}
                          className="py-12 text-center"
                          style={{ color: "rgba(185,224,255,0.35)" }}
                        >
                          No records match your search.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              <div
                className="flex items-center justify-between px-5 py-3"
                style={{
                  background: "rgba(3,33,160,0.40)",
                  borderTop: "1px solid rgba(255,255,255,0.07)",
                }}
              >
                <p
                  className="text-xs"
                  style={{
                    color: "rgba(185,224,255,0.45)",
                    fontFamily: "'Inter',sans-serif",
                  }}
                >
                  Page {page} of {totalPages} &nbsp;·&nbsp;{" "}
                  {filteredRows.length.toLocaleString()} total rows
                </p>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => safePage(page - 1)}
                    disabled={page === 1}
                    className="w-7 h-7 rounded-lg flex items-center justify-center transition-opacity hover:opacity-80 disabled:opacity-30"
                    style={{
                      background: "rgba(50,102,230,0.25)",
                      border: "1px solid rgba(50,102,230,0.4)",
                    }}
                  >
                    <ChevronLeft size={14} color="#b9e0ff" />
                  </button>
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    const pg =
                      Math.max(1, Math.min(page - 2, totalPages - 4)) + i;
                    return (
                      <button
                        key={pg}
                        onClick={() => safePage(pg)}
                        className="w-7 h-7 rounded-lg flex items-center justify-center text-xs font-medium transition-all"
                        style={{
                          background:
                            pg === page ? "#3266e6" : "rgba(50,102,230,0.15)",
                          border:
                            pg === page
                              ? "1px solid #3266e6"
                              : "1px solid rgba(50,102,230,0.3)",
                          color:
                            pg === page ? "#ffffff" : "rgba(185,224,255,0.6)",
                          fontFamily: "'Inter',sans-serif",
                        }}
                      >
                        {pg}
                      </button>
                    );
                  })}
                  <button
                    onClick={() => safePage(page + 1)}
                    disabled={page === totalPages}
                    className="w-7 h-7 rounded-lg flex items-center justify-center transition-opacity hover:opacity-80 disabled:opacity-30"
                    style={{
                      background: "rgba(50,102,230,0.25)",
                      border: "1px solid rgba(50,102,230,0.4)",
                    }}
                  >
                    <ChevronRight size={14} color="#b9e0ff" />
                  </button>
                </div>
              </div>
            </div>

            <div className="h-4" />
          </div>
        )}
      </div>
    </div>
  );
}

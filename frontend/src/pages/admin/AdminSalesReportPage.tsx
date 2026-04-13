import { useEffect, useMemo, useState } from "react";
import { AlertTriangle, Calendar, Download, Printer, RefreshCw } from "lucide-react";
import AdminSidebar from "../../components/admin/AdminSidebar";
import AdminHeader from "../../components/admin/AdminHeader";
import AdminFooter from "../../components/admin/AdminFooter";
import { getToken } from "../../hooks/useAuth";
import { API_BASE_URL } from "../../api/baseUrl";

type SalesReportLineItem = {
  sale_date: string;
  sale_time: string;
  cashier: string;
  trx_no: string | null;
  invoice_no: string | null;
  item_code: string | null;
  description: string;
  selling_price: number;
  price_level: string | null;
  quantity_sold: number;
  gross_sales: number;
  gross_cost: number;
  discount_pct: number;
  discount_amt: number;
  net_profit: number;
  discount_tag: string | null;
  customer_type: string | null;
  payment_method: string | null;
};

type SalesReportResponse = {
  status: string;
  filters: {
    branch_id: number;
    month: string;
    date_from: string;
    date_to: string;
    cashier_id: string | null;
  };
  totals: {
    total_line_items: number;
    total_gross_sales: number;
    total_gross_cost: number;
    total_discount_amt: number;
    total_net_profit: number;
  };
  line_items: SalesReportLineItem[];
};

type CashierOption = {
  user_id: number;
  full_name: string;
};

type UsersApiRow = {
  user_id: number;
  full_name?: string;
  role?: string;
};

const PANEL_CARD_STYLE = {
  background:
    "linear-gradient(180deg, rgba(250,252,255,0.98) 0%, rgba(233,240,253,0.95) 100%)",
  border: "1px solid rgba(77,108,196,0.22)",
  boxShadow:
    "0 18px 48px rgba(1,24,84,0.16), inset 0 1px 0 rgba(255,255,255,0.88)",
};

const METRIC_CARD_STYLE = {
  background:
    "linear-gradient(180deg, rgba(255,255,255,0.98) 0%, rgba(233,241,255,0.96) 100%)",
  border: "1px solid rgba(77,108,196,0.24)",
  boxShadow:
    "0 18px 42px rgba(1,24,84,0.18), inset 0 1px 0 rgba(255,255,255,0.88)",
};

const TABLE_CARD_STYLE = {
  border: "1px solid rgba(115,139,205,0.24)",
  background: "linear-gradient(180deg, #ffffff 0%, #f4f7ff 100%)",
  boxShadow:
    "inset 0 1px 0 rgba(255,255,255,0.9), 0 10px 28px rgba(11,37,97,0.09)",
};

const toIsoMonth = (date: Date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  return `${year}-${month}`;
};

const peso = (amount: number) =>
  `PHP ${amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const safeNumber = (value: unknown) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
};

function escapeCsv(value: unknown): string {
  const text = String(value ?? "");
  if (/[",\n]/.test(text)) {
    return `"${text.replace(/"/g, '""')}"`;
  }
  return text;
}

export default function AdminSalesReportPage() {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [lastSync, setLastSync] = useState(new Date());
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const [selectedMonth, setSelectedMonth] = useState(toIsoMonth(new Date()));
  const [selectedCashierId, setSelectedCashierId] = useState("all");
  const [refreshVersion, setRefreshVersion] = useState(0);

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [cashiers, setCashiers] = useState<CashierOption[]>([]);
  const [report, setReport] = useState<SalesReportResponse | null>(null);

  useEffect(() => {
    const timer = window.setInterval(() => setCurrentTime(new Date()), 1000);
    return () => window.clearInterval(timer);
  }, []);

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
    const loadCashiers = async () => {
      try {
        const token = getToken();
        if (!token) return;

        const response = await fetch(`${API_BASE_URL}/users`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        const payload = (await response.json().catch(() => [])) as UsersApiRow[];
        if (!response.ok || !Array.isArray(payload)) {
          setCashiers([]);
          return;
        }

        const mapped = payload
          .filter((user) => (user.role || "").toLowerCase() === "cashier")
          .map((user) => ({
            user_id: user.user_id,
            full_name: user.full_name || `Cashier #${user.user_id}`,
          }))
          .sort((a, b) => a.full_name.localeCompare(b.full_name));

        setCashiers(mapped);
      } catch {
        setCashiers([]);
      }
    };

    void loadCashiers();
  }, [refreshVersion]);

  useEffect(() => {
    const loadReport = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const token = getToken();
        if (!token) {
          setError("No auth token found. Please log in again.");
          setReport(null);
          return;
        }

        const query = new URLSearchParams({ month: selectedMonth });
        if (selectedCashierId !== "all") {
          query.set("cashier_id", selectedCashierId);
        }

        const response = await fetch(`${API_BASE_URL}/pos/sales-report?${query.toString()}`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        const payload = (await response.json().catch(() => null)) as SalesReportResponse | null;
        if (!response.ok || !payload) {
          const message = (payload as { message?: string; error?: string } | null)?.message
            || (payload as { message?: string; error?: string } | null)?.error
            || "Failed to load admin sales report.";
          setError(message);
          setReport(null);
          return;
        }

        setReport(payload);
        setLastSync(new Date());
      } catch {
        setError("Network error while loading admin sales report.");
        setReport(null);
      } finally {
        setIsLoading(false);
      }
    };

    void loadReport();
  }, [selectedMonth, selectedCashierId, refreshVersion]);

  const totals = report?.totals;

  const grossSales = safeNumber(totals?.total_gross_sales);
  const grossCost = safeNumber(totals?.total_gross_cost);
  const totalDiscount = safeNumber(totals?.total_discount_amt);
  const netProfit = safeNumber(totals?.total_net_profit);
  const lineItemsCount = safeNumber(totals?.total_line_items);
  const marginPercent = grossSales > 0 ? (netProfit / grossSales) * 100 : 0;

  const exportLineItemsCsv = () => {
    if (!report) return;

    const headers = [
      "sale_date",
      "sale_time",
      "cashier",
      "trx_no",
      "invoice_no",
      "item_code",
      "description",
      "selling_price",
      "price_level",
      "quantity_sold",
      "gross_sales",
      "gross_cost",
      "discount_pct",
      "discount_amt",
      "net_profit",
      "discount_tag",
      "customer_type",
      "payment_method",
    ];

    const rows = report.line_items.map((item) =>
      [
        item.sale_date,
        item.sale_time,
        item.cashier,
        item.trx_no,
        item.invoice_no,
        item.item_code,
        item.description,
        item.selling_price,
        item.price_level,
        item.quantity_sold,
        item.gross_sales,
        item.gross_cost,
        item.discount_pct,
        item.discount_amt,
        item.net_profit,
        item.discount_tag,
        item.customer_type,
        item.payment_method,
      ].map(escapeCsv).join(","),
    );

    const csv = `${headers.join(",")}\n${rows.join("\n")}`;
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const href = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = href;
    link.download = `admin-sales-report-${selectedMonth}.csv`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(href);
  };

  const summaryCards = useMemo(
    () => [
      {
        label: "Gross Sales",
        value: isLoading ? "—" : peso(grossSales),
        color: "#062d8c",
      },
      {
        label: "Gross Cost",
        value: isLoading ? "—" : peso(grossCost),
        color: "#7d5a00",
      },
      {
        label: "Discount Amount",
        value: isLoading ? "—" : peso(totalDiscount),
        color: "#c89400",
      },
      {
        label: "Net Profit",
        value: isLoading ? "—" : peso(netProfit),
        color: netProfit >= 0 ? "#00a83d" : "#c62828",
      },
      {
        label: "Line Items",
        value: isLoading ? "—" : lineItemsCount.toLocaleString(),
        color: "#1536ef",
      },
      {
        label: "Margin %",
        value: isLoading ? "—" : `${marginPercent.toFixed(2)}%`,
        color: marginPercent >= 0 ? "#0f38c9" : "#c62828",
      },
    ],
    [grossSales, grossCost, totalDiscount, netProfit, lineItemsCount, marginPercent, isLoading],
  );

  return (
    <div
      className="min-h-screen w-full overflow-y-auto overflow-x-hidden relative"
      style={{
        background:
          "radial-gradient(circle at top left, rgba(113,160,255,0.18) 0%, transparent 26%), radial-gradient(circle at top right, rgba(11,49,153,0.28) 0%, transparent 30%), linear-gradient(180deg, #041f63 0%, #0b3499 42%, #2c63e0 100%)",
      }}
    >
      <AdminSidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        activeItem="Sales Reports"
      />

      <div className="relative z-10 w-full max-w-[1800px] mx-auto px-4 sm:px-6 lg:px-8 xl:px-10 2xl:px-12 py-4 sm:py-6 flex flex-col gap-4 sm:gap-5">
        <AdminHeader
          onMenuClick={() => setSidebarOpen(true)}
          currentTime={currentTime}
          lastSync={lastSync}
          isOnline={isOnline}
        />

        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p
              className="text-[11px] font-bold tracking-[0.35em] uppercase"
              style={{ color: "rgba(216,231,255,0.66)" }}
            >
              Admin Reporting
            </p>
            <h2
              className="font-bold text-xl sm:text-2xl tracking-wide mt-1"
              style={{ color: "rgba(245,249,255,0.96)" }}
            >
              Sales Report
            </h2>
            <p className="text-xs sm:text-sm mt-1" style={{ color: "rgba(218,232,255,0.74)" }}>
              Monthly line-item report from backend POS records.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => setRefreshVersion((value) => value + 1)}
              className="h-9 sm:h-11 px-3 sm:px-4 rounded-2xl text-xs sm:text-sm font-bold text-white transition-opacity hover:opacity-90 flex items-center gap-1.5 sm:gap-2"
              style={{
                background: "linear-gradient(180deg, #2449ff 0%, #1133f2 100%)",
                border: "1px solid rgba(183,205,255,0.28)",
                boxShadow: "0 12px 24px rgba(2,24,95,0.28)",
              }}
            >
              <RefreshCw size={13} className="sm:w-4 sm:h-4" /> Refresh
            </button>
            <button
              type="button"
              onClick={exportLineItemsCsv}
              disabled={!report}
              className="h-9 sm:h-11 px-3 sm:px-4 rounded-2xl text-xs sm:text-sm font-bold text-[#062d8c] transition-opacity hover:opacity-90 flex items-center gap-1.5 sm:gap-2 disabled:opacity-50"
              style={{
                background: "linear-gradient(180deg, rgba(255,255,255,0.98) 0%, rgba(235,242,255,0.96) 100%)",
                border: "1px solid rgba(183,205,255,0.8)",
              }}
            >
              <Download size={12} className="sm:w-4 sm:h-4" /> Export CSV
            </button>
            <button
              type="button"
              onClick={() => window.print()}
              className="h-9 sm:h-11 px-3 sm:px-4 rounded-2xl text-xs sm:text-sm font-bold text-[#062d8c] transition-opacity hover:opacity-90 flex items-center gap-1.5 sm:gap-2"
              style={{
                background: "linear-gradient(180deg, rgba(255,255,255,0.98) 0%, rgba(235,242,255,0.96) 100%)",
                border: "1px solid rgba(183,205,255,0.8)",
              }}
            >
              <Printer size={12} className="sm:w-4 sm:h-4" /> Print / PDF
            </button>
          </div>
        </div>

        <div className="rounded-xl p-3 sm:p-4" style={TABLE_CARD_STYLE}>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            <div>
              <p className="text-xs font-bold uppercase tracking-wide text-slate-500 mb-1">Month</p>
              <label className="h-9 sm:h-10 w-full rounded-xl border border-[#cfdaf7] px-3 text-xs sm:text-sm font-semibold text-[#103182] bg-white flex items-center gap-2">
                <Calendar size={14} className="text-[#103182]" />
                <input
                  type="month"
                  value={selectedMonth}
                  onChange={(event) => setSelectedMonth(event.target.value)}
                  className="bg-transparent outline-none w-full"
                />
              </label>
            </div>
            <div>
              <p className="text-xs font-bold uppercase tracking-wide text-slate-500 mb-1">Cashier</p>
              <select
                value={selectedCashierId}
                onChange={(event) => setSelectedCashierId(event.target.value)}
                className="h-9 sm:h-10 w-full rounded-xl border border-[#cfdaf7] px-3 text-xs sm:text-sm font-semibold text-[#103182] bg-white"
              >
                <option value="all">All Cashiers</option>
                {cashiers.map((cashier) => (
                  <option key={cashier.user_id} value={String(cashier.user_id)}>
                    {cashier.full_name}
                  </option>
                ))}
              </select>
            </div>
            <div className="rounded-xl bg-[#eef3ff] px-3 py-2.5 sm:py-2">
              <p className="text-xs font-bold uppercase tracking-wide text-slate-500">Report Range</p>
              <p className="text-sm font-semibold text-[#103182] mt-1">
                {report ? `${report.filters.date_from} to ${report.filters.date_to}` : "-"}
              </p>
            </div>
          </div>
        </div>

        {error && (
          <div
            className="rounded-xl px-4 py-3 text-sm font-medium flex items-center gap-2"
            style={{
              background: "rgba(255,255,255,0.14)",
              color: "#f4f7ff",
              border: "1px solid rgba(255,255,255,0.3)",
            }}
          >
            <AlertTriangle size={16} /> {error}
          </div>
        )}

        <div className="rounded-[28px] p-5 sm:p-6" style={PANEL_CARD_STYLE}>
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 mb-5">
            {summaryCards.map((card) => (
              <div key={card.label} className="rounded-xl p-5" style={METRIC_CARD_STYLE}>
                <p className="text-base font-extrabold tracking-wide uppercase" style={{ color: "#062d8c" }}>
                  {card.label}
                </p>
                <p className="mt-2 leading-none" style={{ color: card.color, fontSize: "2rem", fontWeight: 800 }}>
                  {card.value}
                </p>
              </div>
            ))}
          </div>

          <div className="rounded-xl overflow-hidden" style={TABLE_CARD_STYLE}>
            <div className="px-4 py-3 border-b border-[#dbe3f7] flex items-center justify-between">
              <div>
                <p className="text-sm font-bold text-[#062d8c]">Sales Line Items</p>
                <p className="text-xs text-slate-500">Detailed monthly POS line items from backend</p>
              </div>
              <p className="text-xs font-semibold text-slate-500">
                {report ? `${report.line_items.length} rows` : "0 rows"}
              </p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[1600px] text-sm">
                <thead>
                  <tr className="bg-[#e8eefb] text-[#062d8c]">
                    <th className="px-3 py-2 text-left text-xs font-bold">Date</th>
                    <th className="px-3 py-2 text-left text-xs font-bold">Time</th>
                    <th className="px-3 py-2 text-left text-xs font-bold">Cashier</th>
                    <th className="px-3 py-2 text-left text-xs font-bold">TRX #</th>
                    <th className="px-3 py-2 text-left text-xs font-bold">Invoice #</th>
                    <th className="px-3 py-2 text-left text-xs font-bold">Item Code</th>
                    <th className="px-3 py-2 text-left text-xs font-bold">Description</th>
                    <th className="px-3 py-2 text-right text-xs font-bold">Sell Price</th>
                    <th className="px-3 py-2 text-left text-xs font-bold">Price Level</th>
                    <th className="px-3 py-2 text-right text-xs font-bold">Qty</th>
                    <th className="px-3 py-2 text-right text-xs font-bold">Gross Sales</th>
                    <th className="px-3 py-2 text-right text-xs font-bold">Gross Cost</th>
                    <th className="px-3 py-2 text-right text-xs font-bold">Disc %</th>
                    <th className="px-3 py-2 text-right text-xs font-bold">Disc Amt</th>
                    <th className="px-3 py-2 text-right text-xs font-bold">Net Profit</th>
                    <th className="px-3 py-2 text-left text-xs font-bold">Disc Tag</th>
                    <th className="px-3 py-2 text-left text-xs font-bold">Customer Type</th>
                    <th className="px-3 py-2 text-left text-xs font-bold">Payment</th>
                  </tr>
                </thead>
                <tbody>
                  {isLoading ? (
                    <tr>
                      <td colSpan={18} className="px-3 py-8 text-center text-slate-500 text-sm">
                        Loading admin sales report...
                      </td>
                    </tr>
                  ) : (report?.line_items || []).length === 0 ? (
                    <tr>
                      <td colSpan={18} className="px-3 py-8 text-center text-slate-500 text-sm">
                        No sales line items for this month/filter.
                      </td>
                    </tr>
                  ) : (
                    report!.line_items.map((row, index) => (
                      <tr key={`${row.sale_date}-${row.sale_time}-${row.trx_no}-${index}`} style={{ background: index % 2 === 0 ? "#f7f9ff" : "#edf2ff" }}>
                        <td className="px-3 py-2 text-[#001d63]">{row.sale_date}</td>
                        <td className="px-3 py-2 text-[#001d63]">{row.sale_time}</td>
                        <td className="px-3 py-2 text-[#001d63] font-semibold">{row.cashier}</td>
                        <td className="px-3 py-2 text-[#001d63]">{row.trx_no || "-"}</td>
                        <td className="px-3 py-2 text-[#001d63]">{row.invoice_no || "-"}</td>
                        <td className="px-3 py-2 text-[#001d63]">{row.item_code || "-"}</td>
                        <td className="px-3 py-2 text-[#001d63]">{row.description}</td>
                        <td className="px-3 py-2 text-right text-[#001d63]">{peso(safeNumber(row.selling_price))}</td>
                        <td className="px-3 py-2 text-[#001d63]">{row.price_level || "-"}</td>
                        <td className="px-3 py-2 text-right text-[#001d63]">{safeNumber(row.quantity_sold).toLocaleString()}</td>
                        <td className="px-3 py-2 text-right font-bold text-[#0f38c9]">{peso(safeNumber(row.gross_sales))}</td>
                        <td className="px-3 py-2 text-right text-[#7d5a00]">{peso(safeNumber(row.gross_cost))}</td>
                        <td className="px-3 py-2 text-right text-[#001d63]">{safeNumber(row.discount_pct).toFixed(2)}%</td>
                        <td className="px-3 py-2 text-right text-[#c89400]">{peso(safeNumber(row.discount_amt))}</td>
                        <td className="px-3 py-2 text-right font-bold" style={{ color: safeNumber(row.net_profit) >= 0 ? "#00a83d" : "#c62828" }}>
                          {peso(safeNumber(row.net_profit))}
                        </td>
                        <td className="px-3 py-2 text-[#001d63]">{row.discount_tag || "-"}</td>
                        <td className="px-3 py-2 text-[#001d63]">{row.customer_type || "-"}</td>
                        <td className="px-3 py-2 text-[#001d63]">{row.payment_method || "-"}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <AdminFooter lastSync={lastSync} />
      </div>
    </div>
  );
}

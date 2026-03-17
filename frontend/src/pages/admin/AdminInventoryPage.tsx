import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import {
  RefreshCw,
  Search,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Package,
  AlertTriangle,
  CalendarClock,
  Boxes,
} from "lucide-react";
import AdminSidebar from "../../components/admin/AdminSidebar";
import AdminHeader from "../../components/admin/AdminHeader";
import AdminFooter from "../../components/admin/AdminFooter";
import { getToken } from "../../hooks/useAuth";

type Classification =
  | "Medicines Supplies"
  | "Medical Supplies"
  | "Groceries Supplies";

type StatusType = "In Stock" | "Low" | "Critical";

type BranchOption = {
  id: number;
  label: string;
};

type ApiInventoryItem = {
  inventory_id: number;
  product_id: number;
  product_name?: string;
  product_name_official?: string;
  category?: string;
  barcode?: string | null;
  barcode_value?: string | null;
  batch_number?: string | null;
  expiry_date?: string | null;
  quantity_on_hand: number;
  price?: number;
  gondola_code?: string | null;
};

type InventoryRow = {
  id: number;
  name: string;
  sku: string;
  barcode: string;
  location: string;
  classification: Classification;
  stock: number;
  maxStock: number;
  price: number;
  expiry: string;
};

const PROD_API_BASE_URL = "https://web-production-2c7737.up.railway.app";
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || PROD_API_BASE_URL;

const BRANCHES: BranchOption[] = [
  { id: 1, label: "BMC MAIN" },
  { id: 2, label: "DIVERSION BRANCH" },
  { id: 3, label: "PANGANIBAN BRANCH" },
];

const ITEMS_PER_PAGE = 10;

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

const CLASS_COLORS: Record<Classification, string> = {
  "Medicines Supplies": "#00aeff",
  "Medical Supplies": "#00c354",
  "Groceries Supplies": "#ffc057",
};

const getStatus = (stock: number): StatusType => {
  if (stock < 5) return "Critical";
  if (stock < 10) return "Low";
  return "In Stock";
};

const formatDate = (isoDate?: string | null): string => {
  if (!isoDate) return "No Expiry";
  const parsed = new Date(isoDate);
  if (Number.isNaN(parsed.getTime())) return "No Expiry";
  return parsed.toLocaleDateString("en-US", {
    month: "short",
    day: "2-digit",
    year: "numeric",
  });
};

const isPlaceholderBarcode = (value?: string | null) => {
  const raw = typeof value === "string" ? value.trim() : "";
  if (!raw) return true;
  const normalized = raw.toUpperCase();
  if (
    /^[-‐‑–—―\s]+$/u.test(raw) ||
    normalized === "N/A" ||
    normalized === "NA" ||
    normalized === "NONE" ||
    !/[0-9A-Z]/i.test(raw)
  ) {
    return true;
  }
  return false;
};

const sanitizeBarcode = (...values: Array<string | null | undefined>) => {
  for (const candidate of values) {
    if (!isPlaceholderBarcode(candidate)) {
      return String(candidate).trim();
    }
  }
  return "No Barcode";
};

const normalizeClassification = (category?: string): Classification => {
  const normalized = (category || "").trim().toUpperCase();
  if (normalized === "MEDICINE") return "Medicines Supplies";
  if (normalized === "GROCERY") return "Groceries Supplies";
  return "Medical Supplies";
};

function ClassBadge({ label }: { label: Classification }) {
  return (
    <span
      className="inline-block rounded px-2 py-0.5 text-white whitespace-nowrap"
      style={{ background: CLASS_COLORS[label], fontSize: "10px" }}
    >
      {label}
    </span>
  );
}

function StatusBadge({ status }: { status: StatusType }) {
  const styles: Record<StatusType, { bg: string; color: string }> = {
    Critical: { bg: "rgba(255,0,0,0.25)", color: "red" },
    Low: { bg: "rgba(243,191,44,0.32)", color: "#c89400" },
    "In Stock": { bg: "rgba(0,191,44,0.25)", color: "#00bf2c" },
  };
  const style = styles[status];
  return (
    <span
      className="inline-flex items-center rounded-full px-2.5 py-0.5 whitespace-nowrap"
      style={{ background: style.bg, color: style.color, fontSize: "12px" }}
    >
      {status}
    </span>
  );
}

function StockBar({ stock, maxStock }: { stock: number; maxStock: number }) {
  const clampedMax = Math.max(maxStock, 1);
  const pct = Math.min(100, (stock / clampedMax) * 100);
  const color = stock < 5 ? "#f10000" : stock < 10 ? "#f3bf2c" : "#00bf2c";

  return (
    <div className="flex items-center gap-2">
      <div
        className="overflow-hidden rounded-full"
        style={{ background: "#d9d9d9", height: "6px", width: "48px" }}
      >
        <div
          className="h-full rounded-full"
          style={{ width: `${pct}%`, background: color }}
        />
      </div>
      <span className="text-sm tabular-nums" style={{ color, minWidth: "24px" }}>
        {stock}
      </span>
    </div>
  );
}

export default function AdminInventoryPage() {
  const [searchParams] = useSearchParams();
  const branchFromQuery = Number(searchParams.get("branch") || "1");
  const [currentTime, setCurrentTime] = useState(new Date());
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [selectedBranchId, setSelectedBranchId] = useState<number>(
    Number.isFinite(branchFromQuery) && BRANCHES.some((branch) => branch.id === branchFromQuery)
      ? branchFromQuery
      : 1,
  );
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [refreshVersion, setRefreshVersion] = useState(0);

  const [items, setItems] = useState<InventoryRow[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
    const loadInventory = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const token = getToken();
        if (!token) {
          setError("No auth token found. Please log in again.");
          setItems([]);
          return;
        }

        const response = await fetch(
          `${API_BASE_URL}/inventory/branch/${selectedBranchId}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          },
        );

        const data = await response.json();
        if (!response.ok) {
          setError(data.message || data.error || "Failed to load inventory.");
          setItems([]);
          return;
        }

        const rows: InventoryRow[] = (Array.isArray(data) ? data : []).map(
          (item: ApiInventoryItem) => {
            const stock = Number(item.quantity_on_hand || 0);
            return {
              id: Number(item.inventory_id),
              name:
                item.product_name_official ||
                item.product_name ||
                "Unnamed Product",
              sku: String(item.product_id || item.inventory_id || "—"),
              barcode: sanitizeBarcode(item.barcode, item.barcode_value),
              location: item.gondola_code || "—",
              classification: normalizeClassification(item.category),
              stock,
              maxStock: Math.max(20, stock * 2),
              price: Number(item.price || 0),
              expiry: formatDate(item.expiry_date),
            };
          },
        );

        setItems(rows);
      } catch {
        setError("Network error while loading inventory.");
        setItems([]);
      } finally {
        setIsLoading(false);
      }
    };

    void loadInventory();
  }, [refreshVersion, selectedBranchId]);

  const selectedBranchLabel =
    BRANCHES.find((branch) => branch.id === selectedBranchId)?.label ||
    "BMC MAIN";

  const filteredItems = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return items;

    return items.filter(
      (item) =>
        item.name.toLowerCase().includes(query) ||
        item.sku.toLowerCase().includes(query) ||
        item.barcode.toLowerCase().includes(query) ||
        item.location.toLowerCase().includes(query) ||
        item.classification.toLowerCase().includes(query),
    );
  }, [items, searchQuery]);

  const totalPages = Math.max(1, Math.ceil(filteredItems.length / ITEMS_PER_PAGE));
  const safePage = Math.min(currentPage, totalPages);

  const pageItems = filteredItems.slice(
    (safePage - 1) * ITEMS_PER_PAGE,
    safePage * ITEMS_PER_PAGE,
  );

  const categorySummary = useMemo(() => {
    const categories: Classification[] = [
      "Medicines Supplies",
      "Medical Supplies",
      "Groceries Supplies",
    ];

    return categories.map((category) => {
      const categoryItems = items.filter(
        (item) => item.classification === category,
      );

      return {
        category,
        label:
          category === "Medicines Supplies"
            ? "Medicines"
            : category === "Medical Supplies"
              ? "Medical Supplies"
              : "Grocery",
        count: categoryItems.length,
        totalValue: categoryItems.reduce(
          (sum, item) => sum + item.stock * item.price,
          0,
        ),
      };
    });
  }, [items]);

  const criticalCount = items.filter((item) => item.stock < 5).length;
  const lowCount = items.filter((item) => item.stock >= 5 && item.stock < 10).length;
  const totalUnits = items.reduce((sum, item) => sum + item.stock, 0);

  const pageNumbers = Array.from({ length: Math.min(totalPages, 5) }, (_, i) => i + 1);

  return (
    <div
      className="min-h-screen w-full overflow-y-auto overflow-x-hidden relative"
      style={{
        background:
          "radial-gradient(circle at top left, rgba(113,160,255,0.18) 0%, transparent 26%), radial-gradient(circle at top right, rgba(11,49,153,0.28) 0%, transparent 30%), linear-gradient(180deg, #041f63 0%, #0b3499 42%, #2c63e0 100%)",
      }}
    >
      <div
        className="absolute inset-x-0 top-0 h-[320px] pointer-events-none"
        style={{
          background:
            "linear-gradient(180deg, rgba(255,255,255,0.06) 0%, rgba(255,255,255,0) 100%)",
        }}
      />
      <div
        className="absolute -top-24 -left-16 w-72 h-72 rounded-full blur-3xl pointer-events-none"
        style={{ background: "rgba(124, 160, 255, 0.18)" }}
      />
      <div
        className="absolute top-40 right-0 w-96 h-96 rounded-full blur-3xl pointer-events-none"
        style={{ background: "rgba(8, 29, 96, 0.22)" }}
      />

      <AdminSidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        activeItem="Inventory"
      />

      <div className="relative z-10 w-full max-w-[1800px] mx-auto px-4 sm:px-6 lg:px-8 xl:px-10 2xl:px-12 py-6 flex flex-col gap-5">
        <AdminHeader
          onMenuClick={() => setSidebarOpen(true)}
          currentTime={currentTime}
          isOnline={isOnline}
        />

        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p
              className="text-[11px] font-bold tracking-[0.35em] uppercase"
              style={{ color: "rgba(216,231,255,0.66)" }}
            >
              Inventory Overview
            </p>
            <h2
              className="font-bold text-2xl tracking-wide mt-1"
              style={{ color: "rgba(245,249,255,0.96)" }}
            >
              Inventory Management
            </h2>
            <p className="text-sm mt-1" style={{ color: "rgba(218,232,255,0.74)" }}>
              Branch: {selectedBranchLabel}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <div
              className="relative flex items-center gap-2 h-11 px-4 rounded-2xl cursor-pointer transition-shadow"
              style={{
                minWidth: "220px",
                background:
                  "linear-gradient(180deg, rgba(255,255,255,0.96) 0%, rgba(226,235,255,0.93) 100%)",
                border: "1px solid rgba(112,136,214,0.34)",
                boxShadow:
                  "0 16px 32px rgba(3,31,99,0.22), inset 0 1px 0 rgba(255,255,255,0.85)",
              }}
            >
              <p className="font-semibold text-sm truncate flex-1 text-center text-[#103182]">
                {selectedBranchLabel}
              </p>
              <ChevronDown size={16} className="text-[#103182] shrink-0" />
              <select
                value={selectedBranchId}
                onChange={(event) => {
                  setSelectedBranchId(Number(event.target.value));
                  setCurrentPage(1);
                }}
                className="absolute inset-0 opacity-0 cursor-pointer"
              >
                {BRANCHES.map((branch) => (
                  <option key={branch.id} value={branch.id}>
                    {branch.label}
                  </option>
                ))}
              </select>
            </div>

            <button
              type="button"
              onClick={() => setRefreshVersion((value) => value + 1)}
              className="h-11 px-4 rounded-2xl text-sm font-bold text-white transition-opacity hover:opacity-90 flex items-center gap-2"
              style={{
                background: "linear-gradient(180deg, #2449ff 0%, #1133f2 100%)",
                border: "1px solid rgba(183,205,255,0.28)",
                boxShadow: "0 12px 24px rgba(2,24,95,0.28)",
              }}
            >
              <RefreshCw size={15} /> Refresh
            </button>
          </div>
        </div>

        <div className="rounded-[28px] p-5 sm:p-6" style={PANEL_CARD_STYLE}>

          <div className="mb-4 grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="rounded-xl p-5" style={METRIC_CARD_STYLE}>
              <p className="text-base font-extrabold tracking-wide uppercase" style={{ color: "#062d8c" }}>
                Total Items
              </p>
              <p className="mt-2 leading-none" style={{ color: "#062d8c", fontSize: "3rem", fontWeight: 800 }}>
                {items.length}
              </p>
              <div className="mt-3 flex items-center gap-2 text-xs font-semibold text-slate-600">
                <Boxes size={14} /> Listed inventory rows
              </div>
            </div>

            <div className="rounded-xl p-5" style={METRIC_CARD_STYLE}>
              <p className="text-base font-extrabold tracking-wide uppercase" style={{ color: "#062d8c" }}>
                Total Units
              </p>
              <p className="mt-2 leading-none" style={{ color: "#062d8c", fontSize: "3rem", fontWeight: 800 }}>
                {totalUnits.toLocaleString()}
              </p>
              <div className="mt-3 flex items-center gap-2 text-xs font-semibold text-slate-600">
                <Package size={14} /> On-hand quantity
              </div>
            </div>

            <div className="rounded-xl p-5" style={METRIC_CARD_STYLE}>
              <p className="text-base font-extrabold tracking-wide uppercase" style={{ color: "#062d8c" }}>
                Low Stock
              </p>
              <p className="mt-2 leading-none" style={{ color: "#c89400", fontSize: "3rem", fontWeight: 800 }}>
                {lowCount}
              </p>
              <div className="mt-3 flex items-center gap-2 text-xs font-semibold text-slate-600">
                <AlertTriangle size={14} /> Qty below 10
              </div>
            </div>

            <div className="rounded-xl p-5" style={METRIC_CARD_STYLE}>
              <p className="text-base font-extrabold tracking-wide uppercase" style={{ color: "#062d8c" }}>
                Critical
              </p>
              <p className="mt-2 leading-none" style={{ color: "#e60404", fontSize: "3rem", fontWeight: 800 }}>
                {criticalCount}
              </p>
              <div className="mt-3 flex items-center gap-2 text-xs font-semibold text-slate-600">
                <CalendarClock size={14} /> Qty below 5
              </div>
            </div>
          </div>

          <div className="mb-4 grid gap-3 md:grid-cols-3">
            {categorySummary.map((summary) => (
              <div
                key={summary.category}
                className="rounded-xl p-5"
                style={{
                  ...TABLE_CARD_STYLE,
                  borderColor: `${CLASS_COLORS[summary.category]}55`,
                }}
              >
                <p className="text-lg font-extrabold text-[#001955]">{summary.label}</p>
                <p className="text-xs font-semibold text-slate-500">
                  PHP {summary.totalValue.toLocaleString(undefined, { maximumFractionDigits: 0 })} value
                </p>
                <p className="mt-1 text-3xl font-black text-[#001955]">{summary.count}</p>
              </div>
            ))}
          </div>

          <div className="mb-4">
            <div
              className="flex h-11 max-w-sm items-center gap-2 rounded-2xl px-4"
              style={{
                background:
                  "linear-gradient(180deg, rgba(255,255,255,0.96) 0%, rgba(242,246,255,0.94) 100%)",
                border: "1px solid rgba(112,136,214,0.28)",
              }}
            >
              <Search size={14} style={{ color: "#707070" }} />
              <input
                type="text"
                placeholder="Search item, SKU, barcode, class..."
                value={searchQuery}
                onChange={(event) => {
                  setSearchQuery(event.target.value);
                  setCurrentPage(1);
                }}
                className="flex-1 bg-transparent text-sm outline-none"
                style={{ color: "#001d63" }}
              />
            </div>
          </div>

          <div className="overflow-x-auto rounded-xl" style={TABLE_CARD_STYLE}>
            <table className="w-full min-w-[980px] border-collapse text-sm">
              <thead>
                <tr style={{ background: "#e1e7f5", borderBottom: "1px solid #dbdee4" }}>
                  {[
                    "Item",
                    "SKU",
                    "Barcode",
                    "Location",
                    "Classification",
                    "Stock",
                    "Price",
                    "Expiry",
                    "Status",
                  ].map((label) => (
                    <th
                      key={label}
                      className="px-3 py-2.5 text-left text-[13px] font-semibold whitespace-nowrap"
                      style={{ color: "#001d63" }}
                    >
                      {label}
                    </th>
                  ))}
                </tr>
              </thead>

              <tbody>
                {isLoading ? (
                  <tr>
                    <td colSpan={9} className="px-3 py-10 text-center text-slate-500">
                      Loading inventory...
                    </td>
                  </tr>
                ) : error ? (
                  <tr>
                    <td colSpan={9} className="px-3 py-10 text-center text-red-600">
                      {error}
                    </td>
                  </tr>
                ) : pageItems.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="px-3 py-10 text-center text-slate-500">
                      No inventory items found.
                    </td>
                  </tr>
                ) : (
                  pageItems.map((item, index) => {
                    const status = getStatus(item.stock);
                    return (
                      <tr
                        key={item.id}
                        style={{ background: index % 2 === 0 ? "#f5f4f4" : "#e6e6e6" }}
                        className="transition-colors hover:brightness-95"
                      >
                        <td className="px-3 py-2 text-[13px] text-[#001d63]">{item.name}</td>
                        <td className="px-3 py-2 text-[13px] text-[#001d63]">{item.sku}</td>
                        <td className="px-3 py-2 font-mono text-[13px] text-[#001d63]">{item.barcode}</td>
                        <td className="px-3 py-2 text-[13px] text-[#001d63]">{item.location}</td>
                        <td className="px-3 py-2"><ClassBadge label={item.classification} /></td>
                        <td className="px-3 py-2"><StockBar stock={item.stock} maxStock={item.maxStock} /></td>
                        <td className="px-3 py-2 text-right text-[13px] text-[#001d63]">{item.price.toFixed(2)}</td>
                        <td className="px-3 py-2 text-[13px] text-[#001d63]">{item.expiry}</td>
                        <td className="px-3 py-2"><StatusBadge status={status} /></td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm text-slate-500">
              Showing {pageItems.length} of {filteredItems.length} items
            </p>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setCurrentPage((page) => Math.max(1, page - 1))}
                disabled={safePage <= 1}
                className="flex h-11 items-center gap-1 rounded-2xl px-4 text-sm font-bold disabled:opacity-40"
                style={{ background: "#efefef", color: "#0b0b0b", border: "1px solid #dad8d8" }}
              >
                <ChevronLeft size={14} /> Previous
              </button>

              {pageNumbers.map((pageNumber) => (
                <button
                  key={pageNumber}
                  type="button"
                  onClick={() => setCurrentPage(pageNumber)}
                  className="h-11 w-11 rounded-2xl text-sm font-bold"
                  style={{
                    background: safePage === pageNumber ? "#1133f2" : "#efefef",
                    color: safePage === pageNumber ? "#eaeaea" : "#0b0b0b",
                    border: "1px solid #dad8d8",
                  }}
                >
                  {pageNumber}
                </button>
              ))}

              <button
                type="button"
                onClick={() => setCurrentPage((page) => Math.min(totalPages, page + 1))}
                disabled={safePage >= totalPages}
                className="flex h-11 items-center gap-1 rounded-2xl px-4 text-sm font-bold disabled:opacity-40"
                style={{ background: "#efefef", color: "#0b0b0b", border: "1px solid #dad8d8" }}
              >
                Next <ChevronRight size={14} />
              </button>
            </div>
          </div>
        </div>

        <AdminFooter />
      </div>
    </div>
  );
}

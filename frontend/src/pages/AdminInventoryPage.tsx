import { useState, useEffect, useMemo } from "react";
import {
  Plus,
  Download,
  Edit2,
  ShoppingCart,
  X,
  ChevronDown,
  Search,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import AdminSidebar from "../components/AdminSidebar";
import AdminHeader from "../components/AdminHeader";

// Mocking the Figma image imports
const imgPills = "";
const imgSyringe = "";
const imgGroceries = "";

// --- Types -------------------------------------------------------------------

type Classification =
  | "Medicines Supplies"
  | "Medical Supplies"
  | "Groceries Supplies";

type StatusType = "In Stock" | "Low" | "Critical";

interface InventoryItem {
  id: number;
  name: string;
  sku: string;
  location: string;
  classification: Classification;
  supplier: string;
  branch: string;
  stock: number;
  maxStock: number;
  price: number;
  expiry: string;
}

// --- Mock Data ---------------------------------------------------------------

const INITIAL_ITEMS: InventoryItem[] = [
  {
    id: 1,
    name: "AICE 2N1 Vanilla Chocolate Sundae 800ML",
    sku: "8.89E+12",
    location: "A4",
    classification: "Groceries Supplies",
    supplier: "AICE Ice cream | Runheng Inc.",
    branch: "BMC MAIN",
    stock: 7,
    maxStock: 50,
    price: 144.2,
    expiry: "04/22/2026",
  },
  {
    id: 2,
    name: "Sangonbion Capsule",
    sku: "101526",
    location: "A4",
    classification: "Medicines Supplies",
    supplier: "Norvic Drugs Corporation",
    branch: "BMC MAIN",
    stock: 4,
    maxStock: 40,
    price: 144.2,
    expiry: "04/22/2026",
  },
  {
    id: 3,
    name: "Xray Lead 14ft.x 590ft.",
    sku: "2.01E+11",
    location: "A4",
    classification: "Medical Supplies",
    supplier: "SPL05 Medical Supplies",
    branch: "BMC MAIN",
    stock: 10,
    maxStock: 30,
    price: 144.2,
    expiry: "04/22/2026",
  },
  {
    id: 4,
    name: "Paracetamol 500MG Tab (ALVEDON)",
    sku: "101674",
    location: "B2",
    classification: "Medicines Supplies",
    supplier: "Milaor Trading Corporation",
    branch: "BMC MAIN",
    stock: 3,
    maxStock: 40,
    price: 8.5,
    expiry: "03/15/2026",
  },
  {
    id: 5,
    name: "Amoxicillin 500MG Cap (AMOXIL)",
    sku: "56712",
    location: "B3",
    classification: "Medicines Supplies",
    supplier: "Zuellig Pharma Corporation",
    branch: "BMC MAIN",
    stock: 15,
    maxStock: 50,
    price: 12.75,
    expiry: "06/30/2026",
  },
  {
    id: 6,
    name: "20CC Syringe (ANY BRAND)",
    sku: "2.02E+11",
    location: "C4",
    classification: "Medical Supplies",
    supplier: "VMED Medical Co",
    branch: "BMC MAIN",
    stock: 50,
    maxStock: 100,
    price: 5.25,
    expiry: "12/31/2026",
  },
  {
    id: 7,
    name: "Disposable Gloves Medium 100pcs",
    sku: "98234",
    location: "C3",
    classification: "Medical Supplies",
    supplier: "VMED Medical Co",
    branch: "BMC MAIN",
    stock: 8,
    maxStock: 30,
    price: 65.0,
    expiry: "09/20/2026",
  },
  {
    id: 8,
    name: "Biogesic 500MG Tab",
    sku: "78432",
    location: "B1",
    classification: "Medicines Supplies",
    supplier: "Unilab Inc.",
    branch: "DIVERSION BRANCH",
    stock: 0,
    maxStock: 40,
    price: 9.25,
    expiry: "02/28/2026",
  },
  {
    id: 9,
    name: "Lucky Me Pancit Canton 65g",
    sku: "34512",
    location: "D2",
    classification: "Groceries Supplies",
    supplier: "Century Pacific Food Inc.",
    branch: "BMC MAIN",
    stock: 120,
    maxStock: 200,
    price: 14.0,
    expiry: "08/15/2026",
  },
  {
    id: 10,
    name: "Milo 300g",
    sku: "45678",
    location: "D3",
    classification: "Groceries Supplies",
    supplier: "Nestle Philippines Inc.",
    branch: "BMC MAIN",
    stock: 25,
    maxStock: 80,
    price: 89.5,
    expiry: "07/20/2026",
  },
  {
    id: 11,
    name: "Dettol Antiseptic 500mL",
    sku: "67890",
    location: "C2",
    classification: "Medical Supplies",
    supplier: "Reckitt Benckiser Philippines",
    branch: "BMC MAIN",
    stock: 18,
    maxStock: 50,
    price: 145.0,
    expiry: "05/10/2026",
  },
  {
    id: 12,
    name: "Cougmax 100mL Syrup",
    sku: "23456",
    location: "B4",
    classification: "Medicines Supplies",
    supplier: "Pascual Labs",
    branch: "DIVERSION BRANCH",
    stock: 6,
    maxStock: 30,
    price: 55.0,
    expiry: "04/18/2026",
  },
  {
    id: 13,
    name: "Neozep Forte Tab",
    sku: "34567",
    location: "B2",
    classification: "Medicines Supplies",
    supplier: "United Lab Inc.",
    branch: "BMC MAIN",
    stock: 30,
    maxStock: 60,
    price: 8.75,
    expiry: "09/05/2026",
  },
  {
    id: 14,
    name: "Betadine Solution 100mL",
    sku: "45689",
    location: "C1",
    classification: "Medical Supplies",
    supplier: "Mundipharma Philippines",
    branch: "BMC MAIN",
    stock: 14,
    maxStock: 40,
    price: 78.25,
    expiry: "11/30/2026",
  },
  {
    id: 15,
    name: "Eden Cheese 165g",
    sku: "56789",
    location: "D1",
    classification: "Groceries Supplies",
    supplier: "Monde Nissin Corporation",
    branch: "BMC MAIN",
    stock: 45,
    maxStock: 100,
    price: 52.5,
    expiry: "05/25/2026",
  },
  {
    id: 16,
    name: "Bandage Gauze 4in x 4yd",
    sku: "78901",
    location: "C3",
    classification: "Medical Supplies",
    supplier: "VMED Medical Co",
    branch: "BMC MAIN",
    stock: 22,
    maxStock: 60,
    price: 35.0,
    expiry: "01/15/2027",
  },
  {
    id: 17,
    name: "Decolgen Tab",
    sku: "89012",
    location: "B3",
    classification: "Medicines Supplies",
    supplier: "Pascual Labs",
    branch: "PANGANIBAN BRANCH",
    stock: 11,
    maxStock: 40,
    price: 12.0,
    expiry: "07/01/2026",
  },
  {
    id: 18,
    name: "Del Monte Pineapple Juice 240mL",
    sku: "90123",
    location: "D4",
    classification: "Groceries Supplies",
    supplier: "Del Monte Philippines",
    branch: "BMC MAIN",
    stock: 65,
    maxStock: 150,
    price: 22.75,
    expiry: "10/12/2026",
  },
  {
    id: 19,
    name: "Ibuprofen 400MG Tab",
    sku: "01234",
    location: "B1",
    classification: "Medicines Supplies",
    supplier: "Interpharm Inc.",
    branch: "BMC MAIN",
    stock: 20,
    maxStock: 50,
    price: 11.25,
    expiry: "08/30/2026",
  },
  {
    id: 20,
    name: "Face Mask 3-ply 50pcs",
    sku: "12345",
    location: "C4",
    classification: "Medical Supplies",
    supplier: "MedPro Supplies",
    branch: "BMC MAIN",
    stock: 35,
    maxStock: 80,
    price: 75.0,
    expiry: "03/20/2027",
  },
];

const BRANCHES = ["BMC MAIN", "DIVERSION BRANCH", "PANGANIBAN BRANCH"] as const;
const CLASSIFICATIONS: Classification[] = [
  "Medicines Supplies",
  "Medical Supplies",
  "Groceries Supplies",
];
const ITEMS_PER_PAGE = 7;

const CLASS_COLORS: Record<Classification, string> = {
  "Medicines Supplies": "#00aeff",
  "Medical Supplies": "#00c354",
  "Groceries Supplies": "#ffc057",
};

// --- Helpers -----------------------------------------------------------------

function getStatus(stock: number): StatusType {
  if (stock < 5) return "Critical";
  if (stock < 10) return "Low";
  return "In Stock";
}

function getStockColor(stock: number): string {
  if (stock < 5) return "#f10000";
  if (stock < 10) return "#f3bf2c";
  return "#00bf2c";
}

// --- Sub-components ----------------------------------------------------------

function ClassBadge({ label }: { label: Classification }) {
  return (
    <span
      className="inline-block px-2 py-0.5 rounded text-white whitespace-nowrap"
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
  const s = styles[status];
  return (
    <span
      className="inline-flex items-center px-2.5 py-0.5 rounded-full whitespace-nowrap"
      style={{ background: s.bg, color: s.color, fontSize: "12px" }}
    >
      {status}
    </span>
  );
}

function StockBar({ stock, maxStock }: { stock: number; maxStock: number }) {
  const pct = Math.min(100, (stock / maxStock) * 100);
  return (
    <div className="flex items-center gap-2">
      <div
        className="rounded-full overflow-hidden"
        style={{
          background: "#d9d9d9",
          height: "6px",
          width: "44px",
          flexShrink: 0,
        }}
      >
        <div
          className="h-full rounded-full"
          style={{ width: pct + "%", background: getStockColor(stock) }}
        />
      </div>
      <span
        className="text-sm tabular-nums"
        style={{ color: getStockColor(stock), minWidth: "20px" }}
      >
        {stock}
      </span>
    </div>
  );
}

// --- Add / Edit Modal --------------------------------------------------------

interface ItemFormData {
  name: string;
  sku: string;
  location: string;
  classification: Classification;
  supplier: string;
  branch: string;
  stock: string;
  maxStock: string;
  price: string;
  expiry: string;
}

const EMPTY_FORM: ItemFormData = {
  name: "",
  sku: "",
  location: "",
  classification: "Medicines Supplies",
  supplier: "",
  branch: "BMC MAIN",
  stock: "",
  maxStock: "50",
  price: "",
  expiry: "",
};

function ItemModal({
  mode,
  initial,
  onSave,
  onClose,
}: {
  mode: "add" | "edit";
  initial: ItemFormData;
  onSave: (data: ItemFormData) => void;
  onClose: () => void;
}) {
  const [form, setForm] = useState<ItemFormData>(initial);

  function field(key: keyof ItemFormData, value: string) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  const inputCls =
    "w-full h-9 px-3 rounded-lg outline-none text-sm transition-colors";
  const inputStyle = {
    border: "1px solid #dad8d8",
    color: "#001d63",
    background: "#fff",
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      style={{ background: "rgba(0,0,0,0.5)" }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className="relative rounded-2xl p-6 flex flex-col gap-4 w-full max-w-lg mx-4"
        style={{
          background: "#f3f3f3",
          boxShadow: "0 8px 40px rgba(0,0,0,0.3)",
          maxHeight: "90vh",
          overflowY: "auto",
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between">
          <h2
            className="font-bold"
            style={{ color: "#001d63", fontSize: "18px" }}
          >
            {mode === "add" ? "+ Add New Item" : "Edit Item"}
          </h2>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-gray-200 transition-colors"
          >
            <X size={18} style={{ color: "#636363" }} />
          </button>
        </div>

        {/* Form fields */}
        <div className="grid grid-cols-2 gap-3">
          {/* Item Name (full width) */}
          <div className="col-span-2 flex flex-col gap-1">
            <label
              className="text-xs font-semibold"
              style={{ color: "#707070" }}
            >
              Item Name
            </label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => field("name", e.target.value)}
              placeholder="Enter item name"
              className={inputCls}
              style={inputStyle}
            />
          </div>

          {/* SKU */}
          <div className="flex flex-col gap-1">
            <label
              className="text-xs font-semibold"
              style={{ color: "#707070" }}
            >
              SKU
            </label>
            <input
              type="text"
              value={form.sku}
              onChange={(e) => field("sku", e.target.value)}
              placeholder="e.g. 101674"
              className={inputCls}
              style={inputStyle}
            />
          </div>

          {/* Location */}
          <div className="flex flex-col gap-1">
            <label
              className="text-xs font-semibold"
              style={{ color: "#707070" }}
            >
              Location
            </label>
            <input
              type="text"
              value={form.location}
              onChange={(e) => field("location", e.target.value)}
              placeholder="e.g. A4"
              className={inputCls}
              style={inputStyle}
            />
          </div>

          {/* Classification */}
          <div className="flex flex-col gap-1">
            <label
              className="text-xs font-semibold"
              style={{ color: "#707070" }}
            >
              Classification
            </label>
            <div className="relative">
              <select
                value={form.classification}
                onChange={(e) =>
                  field("classification", e.target.value as Classification)
                }
                className={inputCls + " cursor-pointer appearance-none pr-8"}
                style={inputStyle}
              >
                {CLASSIFICATIONS.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
              <ChevronDown
                size={14}
                className="absolute right-2 top-2.5 pointer-events-none"
                style={{ color: "#062d8c" }}
              />
            </div>
          </div>

          {/* Branch */}
          <div className="flex flex-col gap-1">
            <label
              className="text-xs font-semibold"
              style={{ color: "#707070" }}
            >
              Branch
            </label>
            <div className="relative">
              <select
                value={form.branch}
                onChange={(e) => field("branch", e.target.value)}
                className={inputCls + " cursor-pointer appearance-none pr-8"}
                style={inputStyle}
              >
                {BRANCHES.map((b) => (
                  <option key={b} value={b}>
                    {b}
                  </option>
                ))}
              </select>
              <ChevronDown
                size={14}
                className="absolute right-2 top-2.5 pointer-events-none"
                style={{ color: "#062d8c" }}
              />
            </div>
          </div>

          {/* Supplier (full width) */}
          <div className="col-span-2 flex flex-col gap-1">
            <label
              className="text-xs font-semibold"
              style={{ color: "#707070" }}
            >
              Supplier
            </label>
            <input
              type="text"
              value={form.supplier}
              onChange={(e) => field("supplier", e.target.value)}
              placeholder="Supplier name"
              className={inputCls}
              style={inputStyle}
            />
          </div>

          {/* Stock */}
          <div className="flex flex-col gap-1">
            <label
              className="text-xs font-semibold"
              style={{ color: "#707070" }}
            >
              Stock Qty
            </label>
            <input
              type="number"
              value={form.stock}
              onChange={(e) => field("stock", e.target.value)}
              placeholder="0"
              className={inputCls}
              style={inputStyle}
            />
          </div>

          {/* Max Stock */}
          <div className="flex flex-col gap-1">
            <label
              className="text-xs font-semibold"
              style={{ color: "#707070" }}
            >
              Max Stock
            </label>
            <input
              type="number"
              value={form.maxStock}
              onChange={(e) => field("maxStock", e.target.value)}
              placeholder="50"
              className={inputCls}
              style={inputStyle}
            />
          </div>

          {/* Price */}
          <div className="flex flex-col gap-1">
            <label
              className="text-xs font-semibold"
              style={{ color: "#707070" }}
            >
              Price (PHP)
            </label>
            <input
              type="number"
              step="0.01"
              value={form.price}
              onChange={(e) => field("price", e.target.value)}
              placeholder="0.00"
              className={inputCls}
              style={inputStyle}
            />
          </div>

          {/* Expiry */}
          <div className="flex flex-col gap-1">
            <label
              className="text-xs font-semibold"
              style={{ color: "#707070" }}
            >
              Expiry Date
            </label>
            <input
              type="text"
              value={form.expiry}
              onChange={(e) => field("expiry", e.target.value)}
              placeholder="MM/DD/YYYY"
              className={inputCls}
              style={inputStyle}
            />
          </div>
        </div>

        {/* Footer buttons */}
        <div className="flex justify-end gap-3 pt-1">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl text-sm font-bold transition-colors hover:bg-gray-200"
            style={{
              background: "#efefef",
              color: "#0b0b0b",
              border: "1px solid #dad8d8",
            }}
          >
            Cancel
          </button>
          <button
            onClick={() => {
              if (!form.name.trim()) {
                alert("Item name is required.");
                return;
              }
              onSave(form);
            }}
            className="px-5 py-2 rounded-xl text-sm font-bold text-white transition-opacity hover:opacity-90"
            style={{ background: "#1536ef" }}
          >
            {mode === "add" ? "Add Item" : "Save Changes"}
          </button>
        </div>
      </div>
    </div>
  );
}

// --- Main Page ---------------------------------------------------------------

export default function AdminInventoryPage() {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [selectedBranch, setSelectedBranch] = useState("BMC MAIN");

  const [items, setItems] = useState<InventoryItem[]>(INITIAL_ITEMS);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState("");

  const [modalMode, setModalMode] = useState<"add" | "edit" | null>(null);
  const [editTarget, setEditTarget] = useState<InventoryItem | null>(null);

  // ── Clocks ──────────────────────────────────────────────────────────────────
  useEffect(() => {
    const t = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    const h = () => setIsOnline(navigator.onLine);
    window.addEventListener("online", h);
    window.addEventListener("offline", h);
    return () => {
      window.removeEventListener("online", h);
      window.removeEventListener("offline", h);
    };
  }, []);

  // ── Derived data ─────────────────────────────────────────────────────────────
  const filteredItems = useMemo(() => {
    const q = searchQuery.toLowerCase();
    return items.filter(
      (i) =>
        !q ||
        i.name.toLowerCase().includes(q) ||
        i.sku.toLowerCase().includes(q) ||
        i.supplier.toLowerCase().includes(q) ||
        i.classification.toLowerCase().includes(q),
    );
  }, [items, searchQuery]);

  const totalPages = Math.max(
    1,
    Math.ceil(filteredItems.length / ITEMS_PER_PAGE),
  );
  const safePage = Math.min(currentPage, totalPages);
  const pageItems = filteredItems.slice(
    (safePage - 1) * ITEMS_PER_PAGE,
    safePage * ITEMS_PER_PAGE,
  );

  const categorySummary = useMemo(() => {
    const cats: Classification[] = [
      "Medicines Supplies",
      "Medical Supplies",
      "Groceries Supplies",
    ];
    return cats.map((cat) => {
      const sub = items.filter((i) => i.classification === cat);
      const totalValue = sub.reduce((s, i) => s + i.stock * i.price, 0);
      return { cat, count: sub.length, totalValue };
    });
  }, [items]);

  // ── Handlers ─────────────────────────────────────────────────────────────────
  function openAddModal() {
    setEditTarget(null);
    setModalMode("add");
  }

  function openEditModal(item: InventoryItem) {
    setEditTarget(item);
    setModalMode("edit");
  }

  function handleSave(data: ItemFormData) {
    if (modalMode === "add") {
      const newItem: InventoryItem = {
        id: Math.max(0, ...items.map((i) => i.id)) + 1,
        name: data.name.trim(),
        sku: data.sku.trim(),
        location: data.location.trim(),
        classification: data.classification,
        supplier: data.supplier.trim(),
        branch: data.branch,
        stock: parseInt(data.stock) || 0,
        maxStock: parseInt(data.maxStock) || 50,
        price: parseFloat(data.price) || 0,
        expiry: data.expiry.trim(),
      };
      setItems((prev) => [newItem, ...prev]);
    } else if (modalMode === "edit" && editTarget) {
      setItems((prev) =>
        prev.map((i) =>
          i.id === editTarget.id
            ? {
                ...i,
                name: data.name.trim(),
                sku: data.sku.trim(),
                location: data.location.trim(),
                classification: data.classification,
                supplier: data.supplier.trim(),
                branch: data.branch,
                stock: parseInt(data.stock) || 0,
                maxStock: parseInt(data.maxStock) || 50,
                price: parseFloat(data.price) || 0,
                expiry: data.expiry.trim(),
              }
            : i,
        ),
      );
    }
    setModalMode(null);
    setEditTarget(null);
    setCurrentPage(1);
  }

  function handleReorder(item: InventoryItem) {
    alert("Reorder request placed for: " + item.name);
  }

  const modalInitial: ItemFormData = editTarget
    ? {
        name: editTarget.name,
        sku: editTarget.sku,
        location: editTarget.location,
        classification: editTarget.classification,
        supplier: editTarget.supplier,
        branch: editTarget.branch,
        stock: String(editTarget.stock),
        maxStock: String(editTarget.maxStock),
        price: String(editTarget.price),
        expiry: editTarget.expiry,
      }
    : EMPTY_FORM;

  // ── Category card config ─────────────────────────────────────────────────────
  const CATEGORY_CARDS = [
    {
      key: "Medicines Supplies" as Classification,
      label: "Medicines",
      img: imgPills,
      gradient:
        "linear-gradient(-21deg, rgba(98,184,255,0.4) 58%, rgba(155,210,255,0.4) 84%)",
    },
    {
      key: "Medical Supplies" as Classification,
      label: "Medical Supplies",
      img: imgSyringe,
      gradient:
        "linear-gradient(-21deg, rgba(172,249,190,0.5) 58%, rgba(173,252,191,0.25) 84%)",
    },
    {
      key: "Groceries Supplies" as Classification,
      label: "Grocery",
      img: imgGroceries,
      gradient:
        "linear-gradient(-21deg, rgba(255,209,80,0.4) 58%, rgba(255,209,80,0.3) 72%)",
    },
  ];

  // ── Pagination ───────────────────────────────────────────────────────────────
  const pageNumbers = Array.from(
    { length: Math.min(totalPages, 5) },
    (_, i) => i + 1,
  );

  // ─────────────────────────────────────────────────────────────────────────────

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
        activeItem="Inventory"
      />

      {/* Add / Edit Modal */}
      {modalMode && (
        <ItemModal
          mode={modalMode}
          initial={modalInitial}
          onSave={handleSave}
          onClose={() => {
            setModalMode(null);
            setEditTarget(null);
          }}
        />
      )}

      <div className="max-w-7xl mx-auto px-4 py-6 flex flex-col gap-5">
        {/* Header */}
        <AdminHeader
          onMenuClick={() => setSidebarOpen(true)}
          currentTime={currentTime}
          isOnline={isOnline}
        />

        {/* Main Card */}
        <div
          className="rounded-2xl pb-5 flex flex-col gap-0"
          style={{
            background: "#f0f0f0",
            border: "1px solid rgba(47,47,47,0.68)",
            boxShadow: "0 0 50px 0px #062d8c",
          }}
        >
          {/* --- Top bar ---------------------------------------------------- */}
          <div className="px-7 pt-6 pb-4 flex items-center justify-between gap-4 flex-wrap">
            <h1
              className="font-extrabold"
              style={{ color: "#062d8c", fontSize: "24px" }}
            >
              Inventory Management
            </h1>

            <div className="flex items-center gap-3">
              {/* Branch selector */}
              <div
                className="relative flex items-center gap-2 h-9 px-4 rounded-xl cursor-pointer"
                style={{
                  background: "#fff",
                  border: "1px solid #dad8d8",
                  boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
                }}
              >
                <select
                  value={selectedBranch}
                  onChange={(e) => setSelectedBranch(e.target.value)}
                  className="absolute inset-0 opacity-0 cursor-pointer w-full"
                >
                  {BRANCHES.map((b) => (
                    <option key={b} value={b}>
                      {b}
                    </option>
                  ))}
                </select>
                <span
                  className="text-sm font-semibold pointer-events-none"
                  style={{ color: "#062d8c" }}
                >
                  {selectedBranch}
                </span>
                <ChevronDown
                  size={13}
                  style={{ color: "#062d8c" }}
                  className="pointer-events-none"
                />
              </div>

              {/* Add Item */}
              <button
                onClick={openAddModal}
                className="flex items-center gap-2 h-9 px-4 rounded-xl text-sm font-bold text-white transition-opacity hover:opacity-90"
                style={{
                  background: "#1536ef",
                  boxShadow: "0 4px 4px rgba(0,0,0,0.1)",
                }}
              >
                <Plus size={15} />
                Add Item
              </button>

              {/* Export */}
              <button
                className="flex items-center gap-2 h-9 px-4 rounded-xl text-sm font-bold transition-opacity hover:opacity-80"
                style={{
                  background: "#f2f2f2",
                  color: "#5f5f5f",
                  border: "1px solid #dad8d8",
                  boxShadow: "0 4px 4px rgba(0,0,0,0.1)",
                }}
              >
                <Download size={15} />
                Export
              </button>
            </div>
          </div>

          {/* --- Category Summary Cards ------------------------------------- */}
          <div className="px-7 pb-4 flex gap-5 flex-wrap">
            {CATEGORY_CARDS.map(({ key, label, img, gradient }) => {
              const summary = categorySummary.find((s) => s.cat === key);
              const count = summary?.count ?? 0;
              const value = summary?.totalValue ?? 0;
              return (
                <div
                  key={key}
                  className="flex-1 min-w-55 h-20 rounded-2xl relative overflow-hidden"
                  style={{
                    backgroundImage: gradient,
                    boxShadow: "0px 4px 4px rgba(0,0,0,0.25)",
                  }}
                >
                  {/* Inner shadow */}
                  <div
                    className="absolute inset-0 pointer-events-none rounded-2xl"
                    style={{ boxShadow: "inset 0px 4px 4px rgba(0,0,0,0.25)" }}
                  />
                  {/* Icon image */}
                  {img && (
                    <img
                      src={img}
                      alt=""
                      className="absolute object-contain pointer-events-none"
                      style={{
                        left: "28px",
                        top: "14px",
                        width: "30px",
                        height: "30px",
                      }}
                    />
                  )}
                  {/* Label */}
                  <p
                    className="absolute font-bold"
                    style={{
                      left: img ? "72px" : "28px",
                      top: "18px",
                      color: "#001955",
                      fontSize: "20px",
                    }}
                  >
                    {label}
                  </p>
                  {/* Value */}
                  <p
                    className="absolute"
                    style={{
                      left: img ? "72px" : "28px",
                      top: "44px",
                      color: "#878787",
                      fontSize: "13px",
                    }}
                  >
                    PHP{" "}
                    {value.toLocaleString(undefined, {
                      maximumFractionDigits: 0,
                    })}{" "}
                    value
                  </p>
                  {/* Count */}
                  <p
                    className="absolute font-extrabold"
                    style={{
                      right: "24px",
                      top: "22px",
                      color: "#001955",
                      fontSize: "38px",
                      lineHeight: 1,
                    }}
                  >
                    {count}
                  </p>
                </div>
              );
            })}
          </div>

          {/* --- Search bar ------------------------------------------------- */}
          <div className="px-7 pb-3">
            <div
              className="flex items-center gap-2 h-9 px-3 rounded-xl max-w-xs"
              style={{ background: "#fff", border: "1px solid #dad8d8" }}
            >
              <Search size={14} style={{ color: "#707070" }} />
              <input
                type="text"
                placeholder="Search items, SKU, supplier..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setCurrentPage(1);
                }}
                className="flex-1 bg-transparent outline-none text-sm"
                style={{ color: "#001d63" }}
              />
              {searchQuery && (
                <button onClick={() => setSearchQuery("")}>
                  <X size={12} style={{ color: "#707070" }} />
                </button>
              )}
            </div>
          </div>

          {/* --- Table ------------------------------------------------------ */}
          <div className="px-7 overflow-x-auto">
            <div
              className="rounded-xl overflow-hidden"
              style={{ border: "1px solid rgba(47,47,47,0.4)" }}
            >
              <table
                className="w-full text-sm border-collapse"
                style={{ minWidth: "900px" }}
              >
                <thead>
                  <tr
                    style={{
                      background: "#e1e7f5",
                      borderBottom: "1px solid #dbdee4",
                    }}
                  >
                    {[
                      { label: "Item", cls: "text-left  w-[22%]" },
                      { label: "SKU", cls: "text-left  w-[8%]" },
                      { label: "Location", cls: "text-left  w-[7%]" },
                      { label: "Classifications", cls: "text-left  w-[11%]" },
                      { label: "Supplier", cls: "text-left  w-[14%]" },
                      { label: "Branch", cls: "text-left  w-[10%]" },
                      { label: "Stock", cls: "text-left  w-[9%]" },
                      { label: "Price", cls: "text-right w-[7%]" },
                      { label: "Expiry", cls: "text-center w-[8%]" },
                      { label: "Status", cls: "text-center w-[7%]" },
                      { label: "Actions", cls: "text-center w-[5%]" },
                    ].map((col) => (
                      <th
                        key={col.label}
                        className={`px-3 py-2.5 font-semibold whitespace-nowrap ${col.cls}`}
                        style={{ color: "#001d63", fontSize: "13px" }}
                      >
                        {col.label}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {pageItems.length === 0 ? (
                    <tr>
                      <td
                        colSpan={11}
                        className="text-center py-10"
                        style={{ color: "#707070" }}
                      >
                        No items found.
                      </td>
                    </tr>
                  ) : (
                    pageItems.map((item, idx) => {
                      const status = getStatus(item.stock);
                      return (
                        <tr
                          key={item.id}
                          style={{
                            background: idx % 2 === 0 ? "#f5f4f4" : "#e6e6e6",
                          }}
                          className="transition-colors hover:brightness-95"
                        >
                          {/* Item */}
                          <td
                            className="px-3 py-1.5"
                            style={{ color: "#001d63", fontSize: "13px" }}
                          >
                            {item.name}
                          </td>

                          {/* SKU */}
                          <td
                            className="px-3 py-1.5"
                            style={{ color: "#001d63", fontSize: "13px" }}
                          >
                            {item.sku}
                          </td>

                          {/* Location */}
                          <td
                            className="px-3 py-1.5"
                            style={{ color: "#001d63", fontSize: "13px" }}
                          >
                            {item.location}
                          </td>

                          {/* Classification */}
                          <td className="px-3 py-1.5">
                            <ClassBadge label={item.classification} />
                          </td>

                          {/* Supplier */}
                          <td
                            className="px-3 py-1.5"
                            style={{ color: "#001d63", fontSize: "13px" }}
                          >
                            {item.supplier}
                          </td>

                          {/* Branch */}
                          <td
                            className="px-3 py-1.5"
                            style={{ color: "#001d63", fontSize: "13px" }}
                          >
                            {item.branch}
                          </td>

                          {/* Stock bar */}
                          <td className="px-3 py-1.5">
                            <StockBar
                              stock={item.stock}
                              maxStock={item.maxStock}
                            />
                          </td>

                          {/* Price */}
                          <td
                            className="px-3 py-1.5 text-right"
                            style={{ color: "#001d63", fontSize: "13px" }}
                          >
                            {item.price.toFixed(2)}
                          </td>

                          {/* Expiry */}
                          <td
                            className="px-3 py-1.5 text-center"
                            style={{ color: "#001d63", fontSize: "13px" }}
                          >
                            {item.expiry}
                          </td>

                          {/* Status */}
                          <td className="px-3 py-1.5 text-center">
                            <StatusBadge status={status} />
                          </td>

                          {/* Actions */}
                          <td className="px-3 py-1.5">
                            <div className="flex items-center justify-center gap-2">
                              <button
                                onClick={() => openEditModal(item)}
                                title="Edit"
                                className="hover:opacity-70 transition-opacity"
                              >
                                <Edit2 size={15} style={{ color: "#1133f2" }} />
                              </button>
                              <button
                                onClick={() => handleReorder(item)}
                                title="Reorder"
                                className="hover:opacity-70 transition-opacity"
                              >
                                <ShoppingCart
                                  size={15}
                                  style={{ color: "#00bf2c" }}
                                />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* --- Table footer: showing + pagination ------------------------- */}
          <div className="px-7 pt-4 flex items-center justify-between flex-wrap gap-3">
            {/* Showing X out of Y items */}
            <p style={{ color: "#777", fontSize: "14px" }}>
              Showing {Math.min(pageItems.length, ITEMS_PER_PAGE)} out of{" "}
              {filteredItems.length} items
            </p>

            {/* Pagination */}
            <div className="flex items-center gap-2">
              {/* Previous */}
              <button
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={safePage <= 1}
                className="h-10 px-4 rounded-xl text-sm font-bold transition-opacity disabled:opacity-40 flex items-center gap-1"
                style={{
                  background: "#efefef",
                  color: "#0b0b0b",
                  border: "1px solid #dad8d8",
                  boxShadow: "0 4px 4px 3px rgba(0,0,0,0.1)",
                }}
              >
                <ChevronLeft size={14} />
                Previous
              </button>

              {/* Page numbers */}
              {pageNumbers.map((pg) => (
                <button
                  key={pg}
                  onClick={() => setCurrentPage(pg)}
                  className="h-10 w-10 rounded-xl text-sm font-bold transition-opacity hover:opacity-90"
                  style={{
                    background: safePage === pg ? "#1133f2" : "#efefef",
                    color: safePage === pg ? "#eaeaea" : "#0b0b0b",
                    border: "1px solid #dad8d8",
                    boxShadow: "0 4px 4px 3px rgba(0,0,0,0.1)",
                  }}
                >
                  {pg}
                </button>
              ))}

              {/* Next */}
              <button
                onClick={() =>
                  setCurrentPage((p) => Math.min(totalPages, p + 1))
                }
                disabled={safePage >= totalPages}
                className="h-10 px-4 rounded-xl text-sm font-bold transition-opacity disabled:opacity-40 flex items-center gap-1"
                style={{
                  background: "#efefef",
                  color: "#0b0b0b",
                  border: "1px solid #dad8d8",
                  boxShadow: "0 4px 4px 3px rgba(0,0,0,0.1)",
                }}
              >
                Next
                <ChevronRight size={14} />
              </button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div
          className="text-center pb-4"
          style={{ color: "rgba(255,255,255,0.3)", fontSize: "12px" }}
        >
          Knopper POS Admin Dashboard &middot; {new Date().getFullYear()}
        </div>
      </div>
    </div>
  );
}

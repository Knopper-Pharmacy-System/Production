import { useState, useMemo } from "react";
import { Clock, Search, ChevronDown, X } from "lucide-react";

// --- Types -------------------------------------------------------------------

type Classification =
  | "Medicines Supplies"
  | "Groceries Supplies"
  | "Medical Supplies";
type Branch = "BMC MAIN" | "DIVERSION BRANCH" | "PANGANIBAN BRANCH";

interface NearExpiryItem {
  id: number;
  name: string;
  classification: Classification;
  branch: Branch;
  supplier: string;
  quantity: number;
  expiryDate: string;
  daysLeft: number;
}

interface NearExpiryModalProps {
  isOpen: boolean;
  onClose: () => void;
}

// --- Mock Data (20 items) ----------------------------------------------------

const ALL_ITEMS: NearExpiryItem[] = [
  {
    id: 1,
    name: "Paracetamol 500MG Tab (ALVEDON)",
    classification: "Medicines Supplies",
    branch: "BMC MAIN",
    supplier: "Milaor Trading Corporation",
    quantity: 7,
    expiryDate: "04/11/2026",
    daysLeft: 30,
  },
  {
    id: 2,
    name: "Paracetamol 500MG Tab (BIOGESIC) 500s",
    classification: "Medicines Supplies",
    branch: "BMC MAIN",
    supplier: "Zuellig Pharma Corporation",
    quantity: 4,
    expiryDate: "04/11/2026",
    daysLeft: 30,
  },
  {
    id: 3,
    name: "AICE 2N1 Vanilla Chocolate Sundae 800ML",
    classification: "Groceries Supplies",
    branch: "BMC MAIN",
    supplier: "AICE Ice cream | Runheng Inc.",
    quantity: 3,
    expiryDate: "04/11/2026",
    daysLeft: 30,
  },
  {
    id: 4,
    name: "AICE Choco Almond Dream 90ML",
    classification: "Groceries Supplies",
    branch: "BMC MAIN",
    supplier: "AICE Ice cream | Runheng Inc.",
    quantity: 7,
    expiryDate: "03/22/2026",
    daysLeft: 10,
  },
  {
    id: 5,
    name: "3D Massager",
    classification: "Groceries Supplies",
    branch: "BMC MAIN",
    supplier: "Divisoria",
    quantity: 4,
    expiryDate: "03/22/2026",
    daysLeft: 10,
  },
  {
    id: 6,
    name: "20CC Syringe (ANY BRAND)",
    classification: "Medical Supplies",
    branch: "BMC MAIN",
    supplier: "VMED Medical Co",
    quantity: 3,
    expiryDate: "03/22/2026",
    daysLeft: 10,
  },
  {
    id: 7,
    name: "3-WAY Foley Catheter fr. 24 (UROSENZ)",
    classification: "Medical Supplies",
    branch: "BMC MAIN",
    supplier: "M.D.S Medical Supplies",
    quantity: 3,
    expiryDate: "03/22/2026",
    daysLeft: 10,
  },
  {
    id: 8,
    name: "Amoxicillin 500MG Cap (AMOXIL)",
    classification: "Medicines Supplies",
    branch: "DIVERSION BRANCH",
    supplier: "Zuellig Pharma Corporation",
    quantity: 6,
    expiryDate: "04/05/2026",
    daysLeft: 24,
  },
  {
    id: 9,
    name: "Biogesic Suspension 60ML",
    classification: "Medicines Supplies",
    branch: "DIVERSION BRANCH",
    supplier: "Unilab Inc.",
    quantity: 5,
    expiryDate: "03/30/2026",
    daysLeft: 18,
  },
  {
    id: 10,
    name: "AICE Taro Milk Tea Ice Cream 800ML",
    classification: "Groceries Supplies",
    branch: "DIVERSION BRANCH",
    supplier: "AICE Ice cream | Runheng Inc.",
    quantity: 4,
    expiryDate: "03/25/2026",
    daysLeft: 13,
  },
  {
    id: 11,
    name: "Disposable Gloves (MEDIUM) 100pcs",
    classification: "Medical Supplies",
    branch: "DIVERSION BRANCH",
    supplier: "VMED Medical Co",
    quantity: 2,
    expiryDate: "03/20/2026",
    daysLeft: 8,
  },
  {
    id: 12,
    name: "Cetirizine 10MG Tab (ZYRTEC)",
    classification: "Medicines Supplies",
    branch: "PANGANIBAN BRANCH",
    supplier: "Milaor Trading Corporation",
    quantity: 8,
    expiryDate: "04/08/2026",
    daysLeft: 27,
  },
  {
    id: 13,
    name: "Losartan 50MG Tab (LOSARTAN)",
    classification: "Medicines Supplies",
    branch: "PANGANIBAN BRANCH",
    supplier: "Zuellig Pharma Corporation",
    quantity: 3,
    expiryDate: "03/28/2026",
    daysLeft: 16,
  },
  {
    id: 14,
    name: "Snickers Chocolate Bar 50G",
    classification: "Groceries Supplies",
    branch: "PANGANIBAN BRANCH",
    supplier: "Mars Philippines",
    quantity: 4,
    expiryDate: "03/24/2026",
    daysLeft: 12,
  },
  {
    id: 15,
    name: "Colgate Toothpaste Total 150G",
    classification: "Groceries Supplies",
    branch: "PANGANIBAN BRANCH",
    supplier: "Colgate-Palmolive",
    quantity: 2,
    expiryDate: "03/18/2026",
    daysLeft: 6,
  },
  {
    id: 16,
    name: "Surgical Mask (50pcs/box)",
    classification: "Medical Supplies",
    branch: "BMC MAIN",
    supplier: "M.D.S Medical Supplies",
    quantity: 5,
    expiryDate: "04/02/2026",
    daysLeft: 21,
  },
  {
    id: 17,
    name: "Ibuprofen 400MG Tab (ADVIL)",
    classification: "Medicines Supplies",
    branch: "BMC MAIN",
    supplier: "Pfizer Philippines",
    quantity: 9,
    expiryDate: "04/14/2026",
    daysLeft: 33,
  },
  {
    id: 18,
    name: "IV Catheter 22G (TERUMO)",
    classification: "Medical Supplies",
    branch: "DIVERSION BRANCH",
    supplier: "VMED Medical Co",
    quantity: 2,
    expiryDate: "03/17/2026",
    daysLeft: 5,
  },
  {
    id: 19,
    name: "Mango Float Ready Mix 500G",
    classification: "Groceries Supplies",
    branch: "DIVERSION BRANCH",
    supplier: "Goldilocks Bakeshop",
    quantity: 3,
    expiryDate: "03/23/2026",
    daysLeft: 11,
  },
  {
    id: 20,
    name: "Metformin 500MG Tab (GLUCOPHAGE)",
    classification: "Medicines Supplies",
    branch: "PANGANIBAN BRANCH",
    supplier: "Merck Philippines",
    quantity: 4,
    expiryDate: "04/07/2026",
    daysLeft: 26,
  },
];

const CLASSIFICATIONS = [
  "All Classifications",
  "Medicines Supplies",
  "Groceries Supplies",
  "Medical Supplies",
] as const;

const BRANCHES = [
  "All Branches",
  "BMC MAIN",
  "DIVERSION BRANCH",
  "PANGANIBAN BRANCH",
] as const;

// --- Helpers -----------------------------------------------------------------

const CLASSIFICATION_COLORS: Record<Classification, string> = {
  "Medicines Supplies": "#00aeff",
  "Groceries Supplies": "#ffc057",
  "Medical Supplies": "#00c354",
};

function ClassificationBadge({ label }: { label: Classification }) {
  return (
    <span
      className="inline-block px-2 py-0.5 rounded text-xs text-white whitespace-nowrap"
      style={{ background: CLASSIFICATION_COLORS[label] }}
    >
      {label}
    </span>
  );
}

function DaysLeftBadge({ days }: { days: number }) {
  const isCritical = days <= 15;
  return (
    <span
      className="inline-flex items-center justify-center px-2.5 py-1 rounded-full text-xs font-bold whitespace-nowrap min-w-8"
      style={{
        background: isCritical
          ? "rgba(243,44,44,0.32)"
          : "rgba(243,191,44,0.32)",
        color: isCritical ? "#FF0000" : "#c89400",
      }}
    >
      {days}
    </span>
  );
}

// --- Modal -------------------------------------------------------------------

export default function NearExpiryModal({
  isOpen,
  onClose,
}: NearExpiryModalProps) {
  const [search, setSearch] = useState("");
  const [classification, setClassification] = useState("All Classifications");
  const [branch, setBranch] = useState("All Branches");

  const filtered = useMemo(() => {
    return ALL_ITEMS.filter((item) => {
      const matchSearch =
        item.name.toLowerCase().includes(search.toLowerCase()) ||
        item.supplier.toLowerCase().includes(search.toLowerCase());
      const matchClass =
        classification === "All Classifications" ||
        item.classification === classification;
      const matchBranch = branch === "All Branches" || item.branch === branch;
      return matchSearch && matchClass && matchBranch;
    });
  }, [search, classification, branch]);

  function handleBulkMarkdown() {
    alert(
      "Bulk Markdown initiated for " + filtered.length + " visible item(s).",
    );
  }

  if (!isOpen) return null;

  return (
    /* Backdrop */
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.55)" }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      {/* Modal card */}
      <div
        className="relative flex flex-col rounded-2xl overflow-hidden w-full"
        style={{
          maxWidth: "960px",
          maxHeight: "90vh",
          background: "#fff",
          boxShadow: "0 8px 48px rgba(6,45,140,0.35)",
        }}
      >
        {/* Header */}
        <div
          className="flex items-start justify-between px-7 py-5 shrink-0"
          style={{ background: "#062d8c" }}
        >
          <div className="flex items-center gap-3">
            <div
              className="p-1.5 rounded-lg shrink-0"
              style={{ background: "rgba(255,214,90,0.22)" }}
            >
              <Clock size={20} style={{ color: "#ffd65a" }} />
            </div>
            <div>
              <h2 className="text-white font-bold" style={{ fontSize: "22px" }}>
                Near Expiry Items
              </h2>
              <p
                className="text-xs mt-0.5"
                style={{ color: "rgba(196,196,196,0.9)" }}
              >
                Products approaching their expiration date
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-white opacity-70 hover:opacity-100 transition-opacity mt-0.5"
          >
            <X size={22} />
          </button>
        </div>

        {/* Filter Bar */}
        <div
          className="flex flex-wrap items-center gap-3 px-7 py-4 shrink-0"
          style={{
            background: "#1a3fa0",
            borderBottom: "1px solid rgba(255,255,255,0.1)",
          }}
        >
          {/* Search */}
          <div
            className="flex items-center gap-2 px-3 rounded-lg h-10 flex-1"
            style={{
              minWidth: "160px",
              background: "rgba(195,195,195,0.26)",
              border: "1px solid rgba(237,234,234,0.4)",
            }}
          >
            <Search
              size={16}
              style={{ color: "rgba(233,232,232,0.91)" }}
              className="shrink-0"
            />
            <input
              type="text"
              placeholder="Search items..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="bg-transparent outline-none text-sm flex-1 min-w-0"
              style={{ color: "white" }}
            />
          </div>

          {/* Classification filter */}
          <div
            className="relative flex items-center h-10 rounded-lg px-3 gap-2"
            style={{
              minWidth: "175px",
              background: "rgba(195,195,195,0.26)",
              border: "1px solid rgba(237,234,234,0.4)",
            }}
          >
            <select
              value={classification}
              onChange={(e) => setClassification(e.target.value)}
              className="absolute inset-0 opacity-0 cursor-pointer w-full"
            >
              {CLASSIFICATIONS.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
            <span
              className="text-sm flex-1 truncate"
              style={{ color: "rgba(233,232,232,0.91)" }}
            >
              {classification}
            </span>
            <ChevronDown
              size={14}
              style={{ color: "rgba(233,232,232,0.91)" }}
              className="shrink-0"
            />
          </div>

          {/* Branch filter */}
          <div
            className="relative flex items-center h-10 rounded-lg px-3 gap-2"
            style={{
              minWidth: "160px",
              background: "rgba(195,195,195,0.26)",
              border: "1px solid rgba(237,234,234,0.4)",
            }}
          >
            <select
              value={branch}
              onChange={(e) => setBranch(e.target.value)}
              className="absolute inset-0 opacity-0 cursor-pointer w-full"
            >
              {BRANCHES.map((b) => (
                <option key={b} value={b}>
                  {b}
                </option>
              ))}
            </select>
            <span
              className="text-sm flex-1 truncate"
              style={{ color: "rgba(233,232,232,0.91)" }}
            >
              {branch}
            </span>
            <ChevronDown
              size={14}
              style={{ color: "rgba(233,232,232,0.91)" }}
              className="shrink-0"
            />
          </div>

          {/* Total Items display */}
          <div
            className="flex items-center gap-2 h-10 rounded-lg px-3"
            style={{
              minWidth: "140px",
              background: "rgba(195,195,195,0.26)",
              border: "1px solid rgba(237,234,234,0.4)",
            }}
          >
            <span
              className="text-sm"
              style={{ color: "rgba(233,232,232,0.91)" }}
            >
              Total Items:
            </span>
            <span className="text-sm font-bold text-white">
              {ALL_ITEMS.length}
            </span>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-auto flex-1">
          <table
            className="w-full text-sm border-collapse"
            style={{ minWidth: "860px" }}
          >
            <thead>
              <tr
                style={{
                  background: "#e1e7f5",
                  borderBottom: "1px solid #dbdee4",
                }}
              >
                {[
                  "Product Name",
                  "Classifications",
                  "Branch",
                  "Supplier",
                  "Quantity",
                  "Expiry Date",
                  "Days Left",
                ].map((col) => (
                  <th
                    key={col}
                    className={`px-4 py-2.5 font-semibold text-left whitespace-nowrap ${
                      ["Quantity", "Days Left"].includes(col)
                        ? "text-center"
                        : ""
                    }`}
                    style={{ color: "#001d63", fontSize: "13px" }}
                  >
                    {col}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td
                    colSpan={7}
                    className="text-center py-10 text-sm"
                    style={{ color: "#636363" }}
                  >
                    No items match your filters.
                  </td>
                </tr>
              ) : (
                filtered.map((item, idx) => (
                  <tr
                    key={item.id}
                    style={{
                      background: idx % 2 === 0 ? "#f5f4f4" : "#edeced",
                    }}
                    className="transition-colors hover:brightness-95"
                  >
                    {/* Product Name */}
                    <td
                      className="px-4 py-2.5 capitalize"
                      style={{ color: "#001d63", maxWidth: "230px" }}
                    >
                      <span className="line-clamp-2 leading-snug">
                        {item.name}
                      </span>
                    </td>

                    {/* Classification */}
                    <td className="px-4 py-2.5">
                      <ClassificationBadge label={item.classification} />
                    </td>

                    {/* Branch */}
                    <td
                      className="px-4 py-2.5 whitespace-nowrap"
                      style={{ color: "#001d63" }}
                    >
                      {item.branch}
                    </td>

                    {/* Supplier */}
                    <td
                      className="px-4 py-2.5"
                      style={{ color: "#001d63", maxWidth: "130px" }}
                    >
                      <span className="line-clamp-2 leading-snug">
                        {item.supplier}
                      </span>
                    </td>

                    {/* Quantity */}
                    <td
                      className="px-4 py-2.5 text-center"
                      style={{ color: "#001d63" }}
                    >
                      {item.quantity}
                    </td>

                    {/* Expiry Date */}
                    <td
                      className="px-4 py-2.5 text-center whitespace-nowrap"
                      style={{ color: "#001d63" }}
                    >
                      {item.expiryDate}
                    </td>

                    {/* Days Left */}
                    <td className="px-4 py-2.5 text-center">
                      <DaysLeftBadge days={item.daysLeft} />
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Footer */}
        <div
          className="flex items-center justify-between px-7 py-4 shrink-0"
          style={{ borderTop: "1px solid #e0e0e0", background: "#fafafa" }}
        >
          <p className="text-xs" style={{ color: "#636363" }}>
            Showing{" "}
            <span className="font-semibold" style={{ color: "#001d63" }}>
              {filtered.length}
            </span>{" "}
            out of{" "}
            <span className="font-semibold" style={{ color: "#001d63" }}>
              {ALL_ITEMS.length}
            </span>{" "}
            items
          </p>

          <div className="flex items-center gap-3">
            <button
              onClick={handleBulkMarkdown}
              className="px-5 py-2 rounded-lg text-sm font-bold text-white transition-opacity hover:opacity-90"
              style={{ background: "#1133f2" }}
            >
              Bulk Markdown
            </button>
            <button
              onClick={onClose}
              className="px-5 py-2 rounded-lg text-sm font-bold transition-colors hover:bg-gray-100"
              style={{
                color: "#001d63",
                border: "1px solid #d0d0d0",
                background: "#fff",
              }}
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

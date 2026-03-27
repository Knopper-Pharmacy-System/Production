import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
  Plus,
  Search,
  ChevronRight,
  ChevronDown,
  ChevronLeft,
  Truck,
  Package,
  PackagePlus,
  CheckCircle,
  ArrowRight,
  Trash2,
  X,
  Eye,
  ClipboardCheck,
  AlertTriangle,
  Download,
  RefreshCw,
} from "lucide-react";
import AdminSidebar from "../../components/admin/AdminSidebar";
import AdminHeader from "../../components/admin/AdminHeader";

// --- Types -------------------------------------------------------------------

type TransferStatus = "Preparing" | "In Transit" | "Delivered" | "Cancelled";

interface TransferItem {
  productName: string;
  sku: string;
  qty: number;
  unit: string;
}

interface StockTransfer {
  id: string;
  fromBranch: string;
  toBranch: string;
  date: string;
  dispatchedAt?: string;
  deliveredAt?: string;
  status: TransferStatus;
  items: TransferItem[];
  notes?: string;
  handledBy: string;
}

// --- Sample Data -------------------------------------------------------------

const BRANCHES = ["BMC MAIN", "DIVERSION BRANCH", "PANGANIBAN BRANCH"];

const PRODUCT_CATALOG: (TransferItem & { stock: number })[] = [
  {
    productName: "Paracetamol 500MG Tab (ALVEDON)",
    sku: "101674",
    unit: "Tab",
    qty: 0,
    stock: 220,
  },
  {
    productName: "Amoxicillin 500MG Cap",
    sku: "56712",
    unit: "Cap",
    qty: 0,
    stock: 115,
  },
  {
    productName: "Biogesic 500MG Tab",
    sku: "78432",
    unit: "Tab",
    qty: 0,
    stock: 80,
  },
  {
    productName: "Neozep Forte Tab",
    sku: "34567",
    unit: "Tab",
    qty: 0,
    stock: 60,
  },
  {
    productName: "Cougmax 100mL Syrup",
    sku: "23456",
    unit: "Bot",
    qty: 0,
    stock: 45,
  },
  {
    productName: "20CC Syringe (ANY BRAND)",
    sku: "2.02E+11",
    unit: "Pcs",
    qty: 0,
    stock: 500,
  },
  {
    productName: "Disposable Gloves Medium",
    sku: "98234",
    unit: "Box",
    qty: 0,
    stock: 30,
  },
  {
    productName: "Betadine Solution 100mL",
    sku: "45689",
    unit: "Bot",
    qty: 0,
    stock: 55,
  },
  {
    productName: "Dettol Antiseptic 500mL",
    sku: "67890",
    unit: "Bot",
    qty: 0,
    stock: 18,
  },
  {
    productName: "Face Mask 3-ply 50pcs",
    sku: "12345",
    unit: "Box",
    qty: 0,
    stock: 35,
  },
  {
    productName: "Ibuprofen 400MG Tab",
    sku: "01234",
    unit: "Tab",
    qty: 0,
    stock: 200,
  },
  { productName: "Decolgen Tab", sku: "89012", unit: "Tab", qty: 0, stock: 95 },
  {
    productName: "Lucky Me Pancit Canton 65g",
    sku: "34512",
    unit: "Pcs",
    qty: 0,
    stock: 300,
  },
  { productName: "Milo 300g", sku: "45678", unit: "Box", qty: 0, stock: 40 },
  {
    productName: "Eden Cheese 165g",
    sku: "56789",
    unit: "Pcs",
    qty: 0,
    stock: 72,
  },
  {
    productName: "Bandage Gauze 4in x 4yd",
    sku: "78901",
    unit: "Roll",
    qty: 0,
    stock: 60,
  },
];

const INITIAL_TRANSFERS: StockTransfer[] = [
  {
    id: "TRN-1044",
    fromBranch: "DIVERSION BRANCH",
    toBranch: "BMC MAIN",
    date: "03/22/2026",
    dispatchedAt: "03/22/2026 08:45 AM",
    status: "In Transit",
    handledBy: "J. Santos",
    notes: "Urgent replenishment for low-stock items.",
    items: [
      {
        productName: "Paracetamol 500MG Tab (ALVEDON)",
        sku: "101674",
        qty: 100,
        unit: "Tab",
      },
      {
        productName: "Amoxicillin 500MG Cap",
        sku: "56712",
        qty: 50,
        unit: "Cap",
      },
      { productName: "Biogesic 500MG Tab", sku: "78432", qty: 80, unit: "Tab" },
    ],
  },
  {
    id: "TRN-1043",
    fromBranch: "BMC MAIN",
    toBranch: "PANGANIBAN BRANCH",
    date: "03/20/2026",
    status: "Preparing",
    handledBy: "M. Reyes",
    items: [
      { productName: "Neozep Forte Tab", sku: "34567", qty: 60, unit: "Tab" },
      {
        productName: "Cougmax 100mL Syrup",
        sku: "23456",
        qty: 30,
        unit: "Bot",
      },
      {
        productName: "Ibuprofen 400MG Tab",
        sku: "01234",
        qty: 100,
        unit: "Tab",
      },
      {
        productName: "Face Mask 3-ply 50pcs",
        sku: "12345",
        qty: 10,
        unit: "Box",
      },
    ],
  },
  {
    id: "TRN-1042",
    fromBranch: "BMC MAIN",
    toBranch: "DIVERSION BRANCH",
    date: "03/10/2026",
    dispatchedAt: "03/10/2026 09:00 AM",
    status: "In Transit",
    handledBy: "A. Cruz",
    notes: "Monthly stock balancing.",
    items: [
      {
        productName: "20CC Syringe (ANY BRAND)",
        sku: "2.02E+11",
        qty: 200,
        unit: "Pcs",
      },
      {
        productName: "Disposable Gloves Medium",
        sku: "98234",
        qty: 20,
        unit: "Box",
      },
      {
        productName: "Betadine Solution 100mL",
        sku: "45689",
        qty: 30,
        unit: "Bot",
      },
    ],
  },
  {
    id: "TRN-1041",
    fromBranch: "PANGANIBAN BRANCH",
    toBranch: "BMC MAIN",
    date: "03/08/2026",
    dispatchedAt: "03/08/2026 10:30 AM",
    deliveredAt: "03/08/2026 01:15 PM",
    status: "Delivered",
    handledBy: "R. Garcia",
    items: [
      {
        productName: "Dettol Antiseptic 500mL",
        sku: "67890",
        qty: 10,
        unit: "Bot",
      },
      { productName: "Milo 300g", sku: "45678", qty: 20, unit: "Box" },
    ],
  },
  {
    id: "TRN-1040",
    fromBranch: "BMC MAIN",
    toBranch: "PANGANIBAN BRANCH",
    date: "03/05/2026",
    dispatchedAt: "03/05/2026 07:45 AM",
    deliveredAt: "03/05/2026 11:00 AM",
    status: "Delivered",
    handledBy: "J. Santos",
    items: [
      {
        productName: "Lucky Me Pancit Canton 65g",
        sku: "34512",
        qty: 150,
        unit: "Pcs",
      },
      { productName: "Eden Cheese 165g", sku: "56789", qty: 48, unit: "Pcs" },
      { productName: "Decolgen Tab", sku: "89012", qty: 60, unit: "Tab" },
    ],
  },
  {
    id: "TRN-1039",
    fromBranch: "DIVERSION BRANCH",
    toBranch: "PANGANIBAN BRANCH",
    date: "03/01/2026",
    dispatchedAt: "03/01/2026 08:00 AM",
    deliveredAt: "03/01/2026 12:30 PM",
    status: "Delivered",
    handledBy: "M. Reyes",
    items: [
      {
        productName: "Bandage Gauze 4in x 4yd",
        sku: "78901",
        qty: 25,
        unit: "Roll",
      },
      {
        productName: "Betadine Solution 100mL",
        sku: "45689",
        qty: 15,
        unit: "Bot",
      },
    ],
  },
  {
    id: "TRN-1038",
    fromBranch: "BMC MAIN",
    toBranch: "DIVERSION BRANCH",
    date: "02/28/2026",
    dispatchedAt: "02/28/2026 09:30 AM",
    deliveredAt: "02/28/2026 01:00 PM",
    status: "Delivered",
    handledBy: "A. Cruz",
    items: [
      {
        productName: "Paracetamol 500MG Tab (ALVEDON)",
        sku: "101674",
        qty: 200,
        unit: "Tab",
      },
      {
        productName: "Amoxicillin 500MG Cap",
        sku: "56712",
        qty: 100,
        unit: "Cap",
      },
    ],
  },
  {
    id: "TRN-1037",
    fromBranch: "PANGANIBAN BRANCH",
    toBranch: "DIVERSION BRANCH",
    date: "02/25/2026",
    status: "Cancelled",
    handledBy: "R. Garcia",
    notes:
      "Transfer cancelled due to supplier delivery received at destination.",
    items: [
      { productName: "Neozep Forte Tab", sku: "34567", qty: 30, unit: "Tab" },
    ],
  },
  {
    id: "TRN-1036",
    fromBranch: "BMC MAIN",
    toBranch: "PANGANIBAN BRANCH",
    date: "02/20/2026",
    dispatchedAt: "02/20/2026 08:15 AM",
    deliveredAt: "02/20/2026 12:00 PM",
    status: "Delivered",
    handledBy: "J. Santos",
    items: [
      {
        productName: "Face Mask 3-ply 50pcs",
        sku: "12345",
        qty: 20,
        unit: "Box",
      },
      {
        productName: "20CC Syringe (ANY BRAND)",
        sku: "2.02E+11",
        qty: 100,
        unit: "Pcs",
      },
    ],
  },
  {
    id: "TRN-1035",
    fromBranch: "DIVERSION BRANCH",
    toBranch: "BMC MAIN",
    date: "02/18/2026",
    dispatchedAt: "02/18/2026 10:00 AM",
    deliveredAt: "02/18/2026 02:30 PM",
    status: "Delivered",
    handledBy: "M. Reyes",
    items: [
      {
        productName: "Ibuprofen 400MG Tab",
        sku: "01234",
        qty: 80,
        unit: "Tab",
      },
      { productName: "Decolgen Tab", sku: "89012", qty: 40, unit: "Tab" },
    ],
  },
];

const ITEMS_PER_PAGE = 8;

// --- Status config -----------------------------------------------------------

const STATUS_CFG: Record<
  TransferStatus,
  { bg: string; color: string; dot: string; label: string }
> = {
  Preparing: {
    bg: "rgba(100,100,100,0.12)",
    color: "#555",
    dot: "#888",
    label: "Preparing",
  },
  "In Transit": {
    bg: "rgba(255,185,0,0.18)",
    color: "#c89400",
    dot: "#f3bf2c",
    label: "In Transit",
  },
  Delivered: {
    bg: "rgba(12,134,40,0.13)",
    color: "#0c8628",
    dot: "#00bf2c",
    label: "Delivered",
  },
  Cancelled: {
    bg: "rgba(241,0,0,0.1)",
    color: "#d40000",
    dot: "#f10000",
    label: "Cancelled",
  },
};

// --- Helpers -----------------------------------------------------------------

function StatusPill({ status }: { status: TransferStatus }) {
  const c = STATUS_CFG[status];
  return (
    <span
      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full font-semibold whitespace-nowrap"
      style={{ background: c.bg, color: c.color, fontSize: "12px" }}
    >
      <span
        className="w-1.5 h-1.5 rounded-full shrink-0"
        style={{ background: c.dot }}
      />
      {c.label}
    </span>
  );
}

function BranchTag({ name }: { name: string }) {
  const colors: Record<string, { bg: string; color: string }> = {
    "BMC MAIN": { bg: "#dceeff", color: "#0059b3" },
    "DIVERSION BRANCH": { bg: "#e8f5e9", color: "#2e7d32" },
    "PANGANIBAN BRANCH": { bg: "#fce4ec", color: "#c62828" },
  };
  const c = colors[name] ?? { bg: "#e1e7f5", color: "#062d8c" };
  return (
    <span
      className="inline-block px-2 py-0.5 rounded text-xs font-bold whitespace-nowrap"
      style={{ background: c.bg, color: c.color }}
    >
      {name}
    </span>
  );
}

function KpiCard({
  label,
  value,
  icon,
  iconBg,
  sub,
}: {
  label: string;
  value: string | number;
  icon: React.ReactNode;
  iconBg: string;
  sub?: string;
}) {
  return (
    <div
      className="flex items-center gap-4 px-5 py-4 rounded-xl"
      style={{
        background: "#fff",
        border: "1px solid rgba(47,47,47,0.1)",
        boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
      }}
    >
      <div
        className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0"
        style={{ background: iconBg }}
      >
        {icon}
      </div>
      <div className="flex flex-col gap-0.5">
        <span className="text-xs font-semibold" style={{ color: "#9aabbf" }}>
          {label}
        </span>
        <span
          className="font-extrabold"
          style={{ color: "#001d63", fontSize: "22px" }}
        >
          {value}
        </span>
        {sub && (
          <span className="text-xs" style={{ color: "#9aabbf" }}>
            {sub}
          </span>
        )}
      </div>
    </div>
  );
}

// --- Detail Drawer -----------------------------------------------------------

function TransferDetailDrawer({
  transfer,
  onClose,
  onConfirm,
}: {
  transfer: StockTransfer;
  onClose: () => void;
  onConfirm: (id: string) => void;
}) {
  const totalItems = transfer.items.reduce((s, i) => s + i.qty, 0);
  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40"
        style={{ background: "rgba(0,0,0,0.45)" }}
        onClick={onClose}
      />
      {/* Drawer */}
      <div
        className="fixed top-0 right-0 h-full z-50 flex flex-col overflow-hidden"
        style={{
          width: "420px",
          background: "#fff",
          boxShadow: "-8px 0 40px rgba(6,45,140,0.18)",
        }}
      >
        {/* Drawer header */}
        <div
          className="px-6 py-5 flex items-center justify-between shrink-0"
          style={{ background: "#062d8c" }}
        >
          <div className="flex flex-col gap-1">
            <span
              className="font-extrabold text-white"
              style={{ fontSize: "16px" }}
            >
              {transfer.id}
            </span>
            <StatusPill status={transfer.status} />
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg flex items-center justify-center hover:opacity-70 transition-opacity"
            style={{ background: "rgba(255,255,255,0.15)" }}
          >
            <X size={16} color="#fff" />
          </button>
        </div>

        {/* Scrollable body */}
        <div className="flex-1 overflow-y-auto px-6 py-5 flex flex-col gap-5">
          {/* Branch route */}
          <div
            className="flex items-center gap-3 p-4 rounded-xl"
            style={{ background: "#f0f5ff", border: "1px solid #e1e7f5" }}
          >
            <div className="flex flex-col gap-1 flex-1">
              <span
                className="text-xs font-semibold"
                style={{ color: "#9aabbf" }}
              >
                From Branch
              </span>
              <BranchTag name={transfer.fromBranch} />
            </div>
            <div
              className="w-8 h-8 rounded-full flex items-center justify-center shrink-0"
              style={{ background: "#e1e7f5" }}
            >
              <ArrowRight size={15} style={{ color: "#062d8c" }} />
            </div>
            <div className="flex flex-col gap-1 flex-1 items-end">
              <span
                className="text-xs font-semibold"
                style={{ color: "#9aabbf" }}
              >
                To Branch
              </span>
              <BranchTag name={transfer.toBranch} />
            </div>
          </div>

          {/* Info grid */}
          <div className="grid grid-cols-2 gap-3">
            {[
              { label: "Date Created", value: transfer.date },
              { label: "Handled By", value: transfer.handledBy },
              { label: "Dispatched", value: transfer.dispatchedAt ?? "—" },
              { label: "Delivered", value: transfer.deliveredAt ?? "—" },
            ].map(({ label, value }) => (
              <div
                key={label}
                className="flex flex-col gap-0.5 px-3 py-2.5 rounded-xl"
                style={{ background: "#f8faff", border: "1px solid #e1e7f5" }}
              >
                <span
                  className="text-xs font-semibold"
                  style={{ color: "#9aabbf" }}
                >
                  {label}
                </span>
                <span
                  className="text-sm font-bold"
                  style={{ color: "#001d63" }}
                >
                  {value}
                </span>
              </div>
            ))}
          </div>

          {/* Notes */}
          {transfer.notes && (
            <div
              className="flex items-start gap-2 px-3 py-3 rounded-xl"
              style={{
                background: "rgba(255,185,0,0.08)",
                border: "1px solid rgba(200,148,0,0.25)",
              }}
            >
              <AlertTriangle
                size={14}
                style={{ color: "#c89400", flexShrink: 0, marginTop: 1 }}
              />
              <p className="text-xs" style={{ color: "#7a5c00" }}>
                {transfer.notes}
              </p>
            </div>
          )}

          {/* Items */}
          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <span
                className="font-bold"
                style={{ color: "#062d8c", fontSize: "14px" }}
              >
                Transfer Items
              </span>
              <span
                className="px-2 py-0.5 rounded-full text-xs font-bold"
                style={{ background: "#e1e7f5", color: "#062d8c" }}
              >
                {totalItems} units
              </span>
            </div>
            <div
              className="rounded-xl overflow-hidden"
              style={{ border: "1px solid #e1e7f5" }}
            >
              <table className="w-full text-sm border-collapse">
                <thead>
                  <tr style={{ background: "#e1e7f5" }}>
                    <th
                      className="px-3 py-2 text-left font-semibold"
                      style={{ color: "#001d63", fontSize: "12px" }}
                    >
                      Product
                    </th>
                    <th
                      className="px-3 py-2 text-center font-semibold"
                      style={{ color: "#001d63", fontSize: "12px" }}
                    >
                      Qty
                    </th>
                    <th
                      className="px-3 py-2 text-left font-semibold"
                      style={{ color: "#001d63", fontSize: "12px" }}
                    >
                      Unit
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {transfer.items.map((item, idx) => (
                    <tr
                      key={idx}
                      style={{
                        background: idx % 2 === 0 ? "#f8faff" : "#fff",
                        borderTop: "1px solid #f0f0f0",
                      }}
                    >
                      <td
                        className="px-3 py-2.5"
                        style={{ color: "#001d63", fontSize: "12px" }}
                      >
                        {item.productName}
                      </td>
                      <td
                        className="px-3 py-2.5 text-center font-bold"
                        style={{ color: "#062d8c", fontSize: "13px" }}
                      >
                        {item.qty}
                      </td>
                      <td
                        className="px-3 py-2.5"
                        style={{ color: "#9aabbf", fontSize: "12px" }}
                      >
                        {item.unit}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Drawer footer */}
        <div
          className="px-6 py-4 flex items-center gap-3 shrink-0"
          style={{ borderTop: "1px solid #e1e7f5" }}
        >
          <button
            onClick={onClose}
            className="flex-1 h-10 rounded-xl text-sm font-bold hover:opacity-80 transition-opacity"
            style={{
              background: "#f0f0f0",
              color: "#555",
              border: "1px solid #dad8d8",
            }}
          >
            Close
          </button>
          {transfer.status === "In Transit" && (
            <button
              onClick={() => {
                onConfirm(transfer.id);
                onClose();
              }}
              className="flex-1 flex items-center justify-center gap-2 h-10 rounded-xl text-sm font-bold text-white hover:opacity-90 transition-opacity"
              style={{
                background: "#0c8628",
                boxShadow: "0 4px 12px rgba(12,134,40,0.3)",
              }}
            >
              <ClipboardCheck size={14} />
              Confirm Delivery
            </button>
          )}
          {transfer.status === "Preparing" && (
            <button
              onClick={() => {
                onConfirm(transfer.id);
                onClose();
              }}
              className="flex-1 flex items-center justify-center gap-2 h-10 rounded-xl text-sm font-bold text-white hover:opacity-90 transition-opacity"
              style={{
                background: "#1536ef",
                boxShadow: "0 4px 12px rgba(21,54,239,0.3)",
              }}
            >
              <Truck size={14} />
              Dispatch Now
            </button>
          )}
        </div>
      </div>
    </>
  );
}

// --- New Transfer Modal ------------------------------------------------------

function NewTransferModal({
  onClose,
  onCreate,
}: {
  onClose: () => void;
  onCreate: (t: StockTransfer) => void;
}) {
  const [fromBranch, setFromBranch] = useState("BMC MAIN");
  const [toBranch, setToBranch] = useState("");
  const [notes, setNotes] = useState("");
  const [handledBy, setHandledBy] = useState("J. Santos");
  const [productSearch, setProductSearch] = useState("");
  const [selectedProduct, setSelectedProduct] = useState("");
  const [qty, setQty] = useState(1);
  const [addedItems, setAddedItems] = useState<TransferItem[]>([]);
  const [error, setError] = useState("");
  const [productDropOpen, setProductDropOpen] = useState(false);

  const filteredProducts = useMemo(
    () =>
      PRODUCT_CATALOG.filter(
        (p) =>
          p.productName.toLowerCase().includes(productSearch.toLowerCase()) &&
          !addedItems.some((a) => a.sku === p.sku),
      ),
    [productSearch, addedItems],
  );

  const chosenProduct = PRODUCT_CATALOG.find(
    (p) => p.productName === selectedProduct,
  );

  function handleAddItem() {
    if (!chosenProduct) {
      setError("Please select a product.");
      return;
    }
    if (qty < 1) {
      setError("Quantity must be at least 1.");
      return;
    }
    if (qty > chosenProduct.stock) {
      setError(`Only ${chosenProduct.stock} units available in stock.`);
      return;
    }
    setAddedItems((prev) => [
      ...prev,
      {
        productName: chosenProduct.productName,
        sku: chosenProduct.sku,
        unit: chosenProduct.unit,
        qty,
      },
    ]);
    setSelectedProduct("");
    setProductSearch("");
    setQty(1);
    setError("");
    setProductDropOpen(false);
  }

  function handleRemoveItem(sku: string) {
    setAddedItems((prev) => prev.filter((i) => i.sku !== sku));
  }

  function handleDispatch() {
    if (!toBranch) {
      setError("Please select a destination branch.");
      return;
    }
    if (fromBranch === toBranch) {
      setError("Source and destination branches cannot be the same.");
      return;
    }
    if (addedItems.length === 0) {
      setError("Please add at least one item.");
      return;
    }
    setError("");

    const newDate = new Date().toLocaleDateString("en-US", {
      month: "2-digit",
      day: "2-digit",
      year: "numeric",
    });
    const now = new Date().toLocaleString("en-US", {
      month: "2-digit",
      day: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
    const newId = "TRN-" + (1045 + Math.floor(Math.random() * 10));

    onCreate({
      id: newId,
      fromBranch,
      toBranch,
      date: newDate,
      dispatchedAt: now,
      status: "In Transit",
      handledBy,
      notes,
      items: addedItems,
    });
    onClose();
  }

  const totalUnits = addedItems.reduce((s, i) => s + i.qty, 0);

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40 flex items-center justify-center px-4"
        style={{ background: "rgba(0,0,0,0.55)" }}
        onClick={onClose}
      >
        {/* Modal Card */}
        <div
          className="w-full max-w-xl flex flex-col rounded-2xl overflow-hidden"
          style={{
            background: "#fff",
            boxShadow: "0 24px 80px rgba(6,45,140,0.35)",
            maxHeight: "90vh",
          }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Modal header */}
          <div
            className="px-6 py-5 flex items-center justify-between shrink-0"
            style={{ background: "#062d8c" }}
          >
            <div className="flex flex-col gap-0.5">
              <span
                className="font-extrabold text-white"
                style={{ fontSize: "17px" }}
              >
                Create Transfer Manifest
              </span>
              <span
                className="text-xs"
                style={{ color: "rgba(255,255,255,0.6)" }}
              >
                Move stock between branches
              </span>
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-lg flex items-center justify-center hover:opacity-70 transition-opacity"
              style={{ background: "rgba(255,255,255,0.15)" }}
            >
              <X size={16} color="#fff" />
            </button>
          </div>

          {/* Scrollable body */}
          <div className="flex-1 overflow-y-auto px-6 py-5 flex flex-col gap-5">
            {/* Error banner */}
            {error && (
              <div
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl"
                style={{
                  background: "rgba(241,0,0,0.08)",
                  border: "1px solid rgba(212,0,0,0.2)",
                }}
              >
                <AlertTriangle size={14} style={{ color: "#d40000" }} />
                <span
                  className="text-xs font-semibold"
                  style={{ color: "#d40000" }}
                >
                  {error}
                </span>
              </div>
            )}

            {/* Branch selectors */}
            <div className="grid grid-cols-2 gap-4">
              {/* From Branch */}
              <div className="flex flex-col gap-1.5">
                <span
                  className="text-xs font-bold"
                  style={{ color: "#707070" }}
                >
                  From Branch
                </span>
                <div className="relative">
                  <select
                    value={fromBranch}
                    onChange={(e) => setFromBranch(e.target.value)}
                    className="w-full h-9 px-3 pr-8 rounded-lg text-sm appearance-none outline-none"
                    style={{
                      background: "#f5f4f4",
                      border: "1px solid #e0e0e0",
                      color: "#001d63",
                    }}
                  >
                    {BRANCHES.map((b) => (
                      <option key={b} value={b}>
                        {b}
                      </option>
                    ))}
                  </select>
                  <ChevronDown
                    size={12}
                    className="absolute right-2.5 top-3 pointer-events-none"
                    style={{ color: "#062d8c" }}
                  />
                </div>
              </div>

              {/* To Branch */}
              <div className="flex flex-col gap-1.5">
                <span
                  className="text-xs font-bold"
                  style={{ color: "#707070" }}
                >
                  Destination Branch <span style={{ color: "#d40000" }}>*</span>
                </span>
                <div className="relative">
                  <select
                    value={toBranch}
                    onChange={(e) => {
                      setToBranch(e.target.value);
                      setError("");
                    }}
                    className="w-full h-9 px-3 pr-8 rounded-lg text-sm appearance-none outline-none"
                    style={{
                      background: "#fff",
                      border: "1px solid #dad8d8",
                      color: toBranch ? "#001d63" : "#aaa",
                    }}
                  >
                    <option value="">-- select branch --</option>
                    {BRANCHES.filter((b) => b !== fromBranch).map((b) => (
                      <option key={b} value={b}>
                        {b}
                      </option>
                    ))}
                  </select>
                  <ChevronDown
                    size={12}
                    className="absolute right-2.5 top-3 pointer-events-none"
                    style={{ color: "#062d8c" }}
                  />
                </div>
              </div>
            </div>

            {/* Branch route preview */}
            {fromBranch && toBranch && (
              <div
                className="flex items-center gap-3 px-4 py-3 rounded-xl"
                style={{ background: "#f0f5ff", border: "1px solid #e1e7f5" }}
              >
                <BranchTag name={fromBranch} />
                <ArrowRight size={14} style={{ color: "#062d8c" }} />
                <BranchTag name={toBranch} />
                <span className="ml-auto text-xs" style={{ color: "#9aabbf" }}>
                  Transfer Route
                </span>
              </div>
            )}

            {/* Handled By */}
            <div className="flex flex-col gap-1.5">
              <span className="text-xs font-bold" style={{ color: "#707070" }}>
                Handled By
              </span>
              <input
                type="text"
                value={handledBy}
                onChange={(e) => setHandledBy(e.target.value)}
                placeholder="Staff name"
                className="w-full h-9 px-3 rounded-lg text-sm outline-none"
                style={{
                  background: "#fff",
                  border: "1px solid #dad8d8",
                  color: "#001d63",
                }}
              />
            </div>

            {/* Divider */}
            <div style={{ borderTop: "1.5px solid #e1e7f5" }} />

            {/* Items Section */}
            <div className="flex flex-col gap-3">
              <span
                className="font-bold"
                style={{ color: "#062d8c", fontSize: "14px" }}
              >
                Items to Transfer
              </span>

              {/* Product search + qty row */}
              <div className="flex gap-2 items-end">
                {/* Product search */}
                <div className="flex-1 flex flex-col gap-1.5">
                  <span
                    className="text-xs font-bold"
                    style={{ color: "#707070" }}
                  >
                    Product
                  </span>
                  <div className="relative">
                    <div
                      className="flex items-center gap-2 h-9 px-3 rounded-lg cursor-text"
                      style={{
                        background: "#fff",
                        border: "1px solid #dad8d8",
                      }}
                      onClick={() => setProductDropOpen(true)}
                    >
                      <Search
                        size={12}
                        style={{ color: "#9aabbf", flexShrink: 0 }}
                      />
                      <input
                        type="text"
                        placeholder="Search product..."
                        value={selectedProduct || productSearch}
                        onChange={(e) => {
                          setProductSearch(e.target.value);
                          setSelectedProduct("");
                          setProductDropOpen(true);
                          setError("");
                        }}
                        onFocus={() => setProductDropOpen(true)}
                        className="flex-1 text-sm bg-transparent outline-none"
                        style={{ color: "#001d63" }}
                      />
                      {selectedProduct && (
                        <button
                          onClick={() => {
                            setSelectedProduct("");
                            setProductSearch("");
                          }}
                          className="hover:opacity-60"
                        >
                          <X size={11} style={{ color: "#999" }} />
                        </button>
                      )}
                    </div>

                    {/* Dropdown */}
                    {productDropOpen &&
                      !selectedProduct &&
                      filteredProducts.length > 0 && (
                        <div
                          className="absolute top-full left-0 right-0 mt-1 rounded-xl overflow-hidden z-10"
                          style={{
                            background: "#fff",
                            border: "1px solid #e1e7f5",
                            boxShadow: "0 8px 24px rgba(6,45,140,0.15)",
                            maxHeight: "180px",
                            overflowY: "auto",
                          }}
                        >
                          {filteredProducts.map((p) => (
                            <button
                              key={p.sku}
                              onClick={() => {
                                setSelectedProduct(p.productName);
                                setProductSearch("");
                                setProductDropOpen(false);
                                setError("");
                              }}
                              className="w-full flex items-center justify-between px-3 py-2 text-left hover:opacity-80 transition-opacity"
                              style={{
                                background: "transparent",
                                borderBottom: "1px solid #f0f0f0",
                              }}
                            >
                              <div className="flex flex-col">
                                <span
                                  className="text-xs font-semibold"
                                  style={{ color: "#001d63" }}
                                >
                                  {p.productName}
                                </span>
                                <span
                                  className="text-xs"
                                  style={{ color: "#9aabbf" }}
                                >
                                  SKU: {p.sku} &middot; {p.unit}
                                </span>
                              </div>
                              <span
                                className="text-xs font-bold px-1.5 py-0.5 rounded"
                                style={{
                                  background:
                                    p.stock < 20
                                      ? "rgba(241,0,0,0.1)"
                                      : "rgba(12,134,40,0.1)",
                                  color: p.stock < 20 ? "#d40000" : "#0c8628",
                                }}
                              >
                                {p.stock} avail
                              </span>
                            </button>
                          ))}
                        </div>
                      )}
                  </div>
                </div>

                {/* Qty */}
                <div className="flex flex-col gap-1.5 w-20">
                  <span
                    className="text-xs font-bold"
                    style={{ color: "#707070" }}
                  >
                    Qty
                  </span>
                  <input
                    type="number"
                    value={qty}
                    min={1}
                    max={chosenProduct?.stock ?? 9999}
                    onChange={(e) => setQty(parseInt(e.target.value) || 1)}
                    className="w-full h-9 px-2 text-center rounded-lg text-sm outline-none"
                    style={{
                      background: "#fff",
                      border: "1px solid #dad8d8",
                      color: "#001d63",
                    }}
                  />
                </div>

                {/* Add button */}
                <button
                  onClick={handleAddItem}
                  className="flex items-center gap-1.5 h-9 px-4 rounded-lg text-sm font-bold text-white hover:opacity-90 transition-opacity shrink-0"
                  style={{
                    background: "#1536ef",
                    boxShadow: "0 4px 8px rgba(21,54,239,0.25)",
                  }}
                >
                  <Plus size={13} />
                  Add
                </button>
              </div>

              {/* Selected product info */}
              {chosenProduct && (
                <div
                  className="flex items-center gap-2 px-3 py-2 rounded-lg"
                  style={{
                    background: "rgba(21,54,239,0.06)",
                    border: "1px solid rgba(21,54,239,0.15)",
                  }}
                >
                  <Package size={12} style={{ color: "#1536ef" }} />
                  <span
                    className="text-xs font-semibold"
                    style={{ color: "#1536ef" }}
                  >
                    {chosenProduct.productName}
                  </span>
                  <span
                    className="ml-auto text-xs"
                    style={{ color: "#9aabbf" }}
                  >
                    {chosenProduct.stock} units in stock
                  </span>
                </div>
              )}

              {/* Added items list */}
              {addedItems.length > 0 ? (
                <div
                  className="rounded-xl overflow-hidden"
                  style={{ border: "1px solid #e1e7f5" }}
                >
                  <div
                    className="flex items-center justify-between px-3 py-2"
                    style={{ background: "#e1e7f5" }}
                  >
                    <span
                      className="text-xs font-bold"
                      style={{ color: "#001d63" }}
                    >
                      Items Added ({addedItems.length})
                    </span>
                    <span
                      className="text-xs font-semibold"
                      style={{ color: "#062d8c" }}
                    >
                      {totalUnits} total units
                    </span>
                  </div>
                  {addedItems.map((item, idx) => (
                    <div
                      key={item.sku}
                      className="flex items-center gap-3 px-3 py-2.5"
                      style={{
                        background: idx % 2 === 0 ? "#f8faff" : "#fff",
                        borderTop: "1px solid #f0f0f0",
                      }}
                    >
                      <Package
                        size={12}
                        style={{ color: "#9aabbf", flexShrink: 0 }}
                      />
                      <div className="flex-1 min-w-0">
                        <p
                          className="text-xs font-semibold truncate"
                          style={{ color: "#001d63" }}
                        >
                          {item.productName}
                        </p>
                        <p className="text-xs" style={{ color: "#9aabbf" }}>
                          SKU: {item.sku}
                        </p>
                      </div>
                      <span
                        className="font-bold px-2 py-0.5 rounded-lg shrink-0"
                        style={{
                          background: "#e1e7f5",
                          color: "#062d8c",
                          fontSize: "12px",
                        }}
                      >
                        {item.qty} {item.unit}
                      </span>
                      <button
                        onClick={() => handleRemoveItem(item.sku)}
                        className="w-6 h-6 rounded-lg flex items-center justify-center shrink-0 hover:opacity-80 transition-opacity"
                        style={{
                          background: "rgba(241,0,0,0.1)",
                          color: "#d40000",
                        }}
                      >
                        <Trash2 size={11} />
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <div
                  className="flex flex-col items-center justify-center py-8 rounded-xl"
                  style={{
                    background: "#f8faff",
                    border: "1.5px dashed #c5d2e8",
                  }}
                >
                  <Package size={24} style={{ color: "#c5d2e8" }} />
                  <p
                    className="text-xs mt-2 font-semibold"
                    style={{ color: "#9aabbf" }}
                  >
                    No items added yet. Use the search above.
                  </p>
                </div>
              )}
            </div>

            {/* Notes */}
            <div className="flex flex-col gap-1.5">
              <span className="text-xs font-bold" style={{ color: "#707070" }}>
                Notes (optional)
              </span>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Any special instructions for this transfer..."
                rows={2}
                className="w-full px-3 py-2 rounded-lg text-sm outline-none resize-none"
                style={{
                  background: "#fff",
                  border: "1px solid #dad8d8",
                  color: "#001d63",
                  lineHeight: "1.5",
                }}
              />
            </div>
          </div>

          {/* Modal footer */}
          <div
            className="px-6 py-4 flex items-center gap-3 shrink-0"
            style={{ borderTop: "1px solid #e1e7f5", background: "#fafafa" }}
          >
            <p className="text-xs flex-1" style={{ color: "#9aabbf" }}>
              {addedItems.length > 0
                ? `${addedItems.length} items, ${totalUnits} units total`
                : "Add items to proceed"}
            </p>
            <button
              onClick={onClose}
              className="h-10 px-5 rounded-xl text-sm font-bold hover:opacity-80 transition-opacity"
              style={{
                background: "#efefef",
                color: "#555",
                border: "1px solid #dad8d8",
              }}
            >
              Cancel
            </button>
            <button
              onClick={handleDispatch}
              className="flex items-center gap-2 h-10 px-5 rounded-xl text-sm font-bold text-white hover:opacity-90 transition-opacity"
              style={{
                background: "#062d8c",
                boxShadow: "0 4px 12px rgba(6,45,140,0.3)",
              }}
            >
              <Truck size={14} />
              Dispatch Transfer
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

// --- Confirm Delivery Prompt -------------------------------------------------

function ConfirmDeliveryPrompt({
  transfer,
  onConfirm,
  onCancel,
}: {
  transfer: StockTransfer;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  return (
    <>
      <div
        className="fixed inset-0 z-40"
        style={{ background: "rgba(0,0,0,0.5)" }}
        onClick={onCancel}
      />
      <div
        className="fixed inset-0 z-50 flex items-center justify-center px-4"
        style={{ pointerEvents: "none" }}
      >
        <div
          className="w-full max-w-sm rounded-2xl p-6 flex flex-col gap-5"
          style={{
            background: "#fff",
            boxShadow: "0 24px 64px rgba(6,45,140,0.3)",
            pointerEvents: "all",
          }}
        >
          <div className="flex items-start gap-3">
            <div
              className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0"
              style={{ background: "rgba(12,134,40,0.1)" }}
            >
              <CheckCircle size={22} style={{ color: "#0c8628" }} />
            </div>
            <div className="flex flex-col gap-1">
              <span
                className="font-bold"
                style={{ color: "#001d63", fontSize: "15px" }}
              >
                Confirm Delivery?
              </span>
              <p className="text-xs" style={{ color: "#707070" }}>
                Confirm that <strong>{transfer.id}</strong> has been received at{" "}
                <strong>{transfer.toBranch}</strong>. This will update inventory
                and close the transfer.
              </p>
            </div>
          </div>

          {/* Route summary */}
          <div
            className="flex items-center gap-2 px-3 py-2 rounded-xl"
            style={{ background: "#f0f5ff", border: "1px solid #e1e7f5" }}
          >
            <BranchTag name={transfer.fromBranch} />
            <ArrowRight size={13} style={{ color: "#062d8c" }} />
            <BranchTag name={transfer.toBranch} />
            <span className="ml-auto text-xs" style={{ color: "#9aabbf" }}>
              {transfer.items.length} items
            </span>
          </div>

          <div className="flex gap-3">
            <button
              onClick={onCancel}
              className="flex-1 h-10 rounded-xl text-sm font-bold hover:opacity-80 transition-opacity"
              style={{
                background: "#efefef",
                color: "#555",
                border: "1px solid #dad8d8",
              }}
            >
              Cancel
            </button>
            <button
              onClick={onConfirm}
              className="flex-1 h-10 rounded-xl text-sm font-bold text-white hover:opacity-90 transition-opacity"
              style={{
                background: "#0c8628",
                boxShadow: "0 4px 12px rgba(12,134,40,0.3)",
              }}
            >
              Yes, Confirm
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

// --- Main Page ---------------------------------------------------------------

export default function AdminStockTransfersPage() {
  const navigate = useNavigate();
  const [currentTime, setCurrentTime] = useState(new Date());
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // -- Data state --
  const [transfers, setTransfers] =
    useState<StockTransfer[]>(INITIAL_TRANSFERS);

  // -- UI state --
  const [activeTab, setActiveTab] = useState<TransferStatus | "All">("All");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [showNewModal, setShowNewModal] = useState(false);
  const [detailTransfer, setDetailTransfer] = useState<StockTransfer | null>(
    null,
  );
  const [confirmTransfer, setConfirmTransfer] = useState<StockTransfer | null>(
    null,
  );

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

  // -- KPI stats --
  const total = transfers.length;
  const preparing = transfers.filter((t) => t.status === "Preparing").length;
  const inTransit = transfers.filter((t) => t.status === "In Transit").length;
  const delivered = transfers.filter((t) => t.status === "Delivered").length;

  // -- Filter + search --
  const filtered = useMemo(() => {
    let data = transfers;
    if (activeTab !== "All") data = data.filter((t) => t.status === activeTab);
    if (search.trim()) {
      const q = search.toLowerCase();
      data = data.filter(
        (t) =>
          t.id.toLowerCase().includes(q) ||
          t.fromBranch.toLowerCase().includes(q) ||
          t.toBranch.toLowerCase().includes(q) ||
          t.handledBy.toLowerCase().includes(q),
      );
    }
    return data;
  }, [transfers, activeTab, search]);

  const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE);
  const paged = filtered.slice(
    (page - 1) * ITEMS_PER_PAGE,
    page * ITEMS_PER_PAGE,
  );

  const tabCount = (tab: TransferStatus | "All") =>
    tab === "All"
      ? transfers.length
      : transfers.filter((t) => t.status === tab).length;

  // -- Actions --
  function handleCreate(t: StockTransfer) {
    setTransfers((prev) => [t, ...prev]);
  }

  function handleConfirmDelivery(id: string) {
    setTransfers((prev) =>
      prev.map((t) =>
        t.id === id
          ? {
              ...t,
              status: "Delivered" as TransferStatus,
              deliveredAt: new Date().toLocaleString("en-US", {
                month: "2-digit",
                day: "2-digit",
                year: "numeric",
                hour: "2-digit",
                minute: "2-digit",
              }),
            }
          : t,
      ),
    );
  }

  const TABS: (TransferStatus | "All")[] = [
    "All",
    "Preparing",
    "In Transit",
    "Delivered",
    "Cancelled",
  ];

  return (
    <div
      className="min-h-screen w-full overflow-y-auto overflow-x-hidden relative"
      style={{
        background:
          "radial-gradient(circle at top left, rgba(113,160,255,0.18) 0%, transparent 26%), radial-gradient(circle at top right, rgba(11,49,153,0.28) 0%, transparent 30%), linear-gradient(180deg, #041f63 0%, #0b3499 42%, #2c63e0 100%)",
      }}
    >
      <div
        className="absolute inset-x-0 top-0 h-80 pointer-events-none"
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

      {/* Modals / Drawers */}
      {showNewModal && (
        <NewTransferModal
          onClose={() => setShowNewModal(false)}
          onCreate={handleCreate}
        />
      )}
      {detailTransfer && (
        <TransferDetailDrawer
          transfer={detailTransfer}
          onClose={() => setDetailTransfer(null)}
          onConfirm={(id) => {
            handleConfirmDelivery(id);
            setDetailTransfer(null);
          }}
        />
      )}
      {confirmTransfer && (
        <ConfirmDeliveryPrompt
          transfer={confirmTransfer}
          onConfirm={() => {
            handleConfirmDelivery(confirmTransfer.id);
            setConfirmTransfer(null);
          }}
          onCancel={() => setConfirmTransfer(null)}
        />
      )}

      <AdminSidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        activeItem="Stock Transfer"
        onNavigate={(item) => {
          if (item === "Dashboard" || item === "Overview") navigate("/");
          if (item === "Inventory" || item === "View Inventory")
            navigate("/admin/inventory");
          if (item === "Audit Sheet") navigate("/admin/audit-sheet");
          if (item === "PO List") navigate("/admin/purchase-orders");
        }}
      />

      <div className="relative z-10 w-full max-w-450 mx-auto px-4 sm:px-6 lg:px-8 xl:px-10 2xl:px-12 py-6 flex flex-col gap-5">
        <AdminHeader
          onMenuClick={() => setSidebarOpen(true)}
          currentTime={currentTime}
          isOnline={isOnline}
        />

        {/* ── Overview Bar ─────────────────────────────────────────────────── */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p
              className="text-[11px] font-bold tracking-[0.35em] uppercase"
              style={{ color: "rgba(216,231,255,0.66)" }}
            >
              Inventory Management
            </p>
            <h2
              className="font-bold text-2xl tracking-wide mt-1"
              style={{ color: "rgba(245,249,255,0.96)" }}
            >
              Stock Transfers
            </h2>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowNewModal(true)}
              className="flex items-center gap-2 px-5 h-11 rounded-2xl font-bold transition-all shadow-md active:scale-95"
              style={{
                background: "linear-gradient(180deg, #103182 0%, #081e54 100%)",
                color: "#fff",
                border: "1px solid rgba(255,255,255,0.15)",
                boxShadow:
                  "0 8px 24px rgba(6,45,140,0.3), inset 0 1px 0 rgba(255,255,255,0.2)",
              }}
            >
              <PackagePlus size={18} />
              New Transfer
            </button>
          </div>
        </div>

        {/* ================================================================
            Main Card
        ================================================================ */}
        <div
          className="rounded-2xl pb-6 flex flex-col gap-0"
          style={{
            background: "#f0f0f0",
            border: "1px solid rgba(47,47,47,0.68)",
            boxShadow: "0 0 50px 0px #062d8c",
          }}
        >
          <div className="px-7 pt-5 flex flex-col gap-5">
            {/* Top row actions (Export) */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {inTransit > 0 && (
                  <span
                    className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold"
                    style={{
                      background: "rgba(255,185,0,0.2)",
                      color: "#c89400",
                    }}
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-yellow-400 animate-pulse" />
                    {inTransit} in transit
                  </span>
                )}
              </div>
              <button
                className="flex items-center gap-1.5 h-9 px-4 rounded-xl text-xs font-bold hover:opacity-80 transition-opacity"
                style={{
                  background: "#e1e7f5",
                  color: "#062d8c",
                  border: "1px solid #c5d2e8",
                }}
              >
                <Download size={13} />
                Export
              </button>
            </div>

            {/* KPI Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <KpiCard
                label="Total Transfers"
                value={total}
                sub="All time"
                iconBg="rgba(21,54,239,0.1)"
                icon={<RefreshCw size={20} style={{ color: "#1536ef" }} />}
              />
              <KpiCard
                label="Preparing"
                value={preparing}
                sub="Being packed"
                iconBg="rgba(100,100,100,0.1)"
                icon={<Package size={20} style={{ color: "#555" }} />}
              />
              <KpiCard
                label="In Transit"
                value={inTransit}
                sub="En route to branch"
                iconBg="rgba(255,185,0,0.18)"
                icon={<Truck size={20} style={{ color: "#c89400" }} />}
              />
              <KpiCard
                label="Delivered"
                value={delivered}
                sub="Confirmed receipts"
                iconBg="rgba(12,134,40,0.13)"
                icon={<CheckCircle size={20} style={{ color: "#0c8628" }} />}
              />
            </div>

            {/* Filter Tabs + Search */}
            <div
              className="rounded-xl p-4 flex flex-col gap-3"
              style={{
                background: "#fff",
                border: "1px solid rgba(47,47,47,0.1)",
                boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
              }}
            >
              {/* Tabs */}
              <div className="flex items-center gap-1 flex-wrap">
                {TABS.map((tab) => {
                  const active = activeTab === tab;
                  const cfg =
                    tab !== "All" ? STATUS_CFG[tab as TransferStatus] : null;
                  return (
                    <button
                      key={tab}
                      onClick={() => {
                        setActiveTab(tab);
                        setPage(1);
                      }}
                      className="flex items-center gap-1.5 h-8 px-3 rounded-lg text-xs font-semibold transition-all"
                      style={{
                        background: active ? "#062d8c" : "transparent",
                        color: active ? "#fff" : "#707070",
                      }}
                    >
                      {cfg && !active && (
                        <span
                          className="w-1.5 h-1.5 rounded-full"
                          style={{ background: cfg.dot }}
                        />
                      )}
                      {tab}
                      <span
                        className="px-1.5 py-0.5 rounded-full font-bold"
                        style={{
                          background: active
                            ? "rgba(255,255,255,0.2)"
                            : "#e1e7f5",
                          color: active ? "#fff" : "#062d8c",
                          fontSize: "10px",
                        }}
                      >
                        {tabCount(tab)}
                      </span>
                    </button>
                  );
                })}
              </div>

              {/* Search row */}
              <div className="flex items-center gap-3">
                <div
                  className="flex items-center gap-2 h-9 px-3 rounded-lg flex-1"
                  style={{
                    background: "#f5f4f4",
                    border: "1px solid #e0e0e0",
                    minWidth: "200px",
                  }}
                >
                  <Search size={14} style={{ color: "#9aabbf" }} />
                  <input
                    type="text"
                    placeholder="Search by manifest ID, branch, handled by..."
                    value={search}
                    onChange={(e) => {
                      setSearch(e.target.value);
                      setPage(1);
                    }}
                    className="flex-1 text-sm bg-transparent outline-none"
                    style={{ color: "#001d63" }}
                  />
                  {search && (
                    <button
                      onClick={() => setSearch("")}
                      className="hover:opacity-60"
                    >
                      <X size={12} style={{ color: "#999" }} />
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Transfer Table */}
            <div
              className="rounded-xl overflow-hidden"
              style={{
                background: "#fff",
                border: "1px solid rgba(47,47,47,0.1)",
                boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
              }}
            >
              <div className="overflow-x-auto">
                <table
                  className="w-full text-sm border-collapse"
                  style={{ minWidth: "820px" }}
                >
                  <thead>
                    <tr
                      style={{
                        background: "#e1e7f5",
                        borderBottom: "1px solid #dbdee4",
                      }}
                    >
                      {[
                        { label: "#", cls: "text-center w-8" },
                        { label: "Manifest ID", cls: "text-left" },
                        { label: "From Branch", cls: "text-left" },
                        { label: "", cls: "text-center w-6" },
                        { label: "To Branch", cls: "text-left" },
                        { label: "Date", cls: "text-left" },
                        { label: "Items", cls: "text-center" },
                        { label: "Handled By", cls: "text-left" },
                        { label: "Status", cls: "text-left" },
                        { label: "Actions", cls: "text-center" },
                      ].map((h, i) => (
                        <th
                          key={i}
                          className={`px-3 py-2.5 font-semibold whitespace-nowrap ${h.cls}`}
                          style={{ color: "#001d63", fontSize: "13px" }}
                        >
                          {h.label}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {paged.length === 0 ? (
                      <tr>
                        <td
                          colSpan={10}
                          className="text-center py-14"
                          style={{ color: "#aaa" }}
                        >
                          <div className="flex flex-col items-center gap-2">
                            <RefreshCw size={28} style={{ color: "#e0e0e0" }} />
                            <span
                              className="text-sm font-semibold"
                              style={{ color: "#bbb" }}
                            >
                              No transfers found.
                            </span>
                          </div>
                        </td>
                      </tr>
                    ) : (
                      paged.map((transfer, idx) => {
                        const totalUnitsInTransfer = transfer.items.reduce(
                          (s, i) => s + i.qty,
                          0,
                        );
                        return (
                          <tr
                            key={transfer.id}
                            className="hover:brightness-95 transition-all cursor-pointer"
                            style={{
                              background: idx % 2 === 0 ? "#f5f4f4" : "#e6e6e6",
                            }}
                            onClick={() => setDetailTransfer(transfer)}
                          >
                            {/* # */}
                            <td
                              className="px-3 py-3 text-center w-8"
                              style={{ color: "#9aabbf", fontSize: "12px" }}
                            >
                              {(page - 1) * ITEMS_PER_PAGE + idx + 1}
                            </td>

                            {/* Manifest ID */}
                            <td className="px-3 py-3">
                              <span
                                className="font-bold"
                                style={{ color: "#1536ef", fontSize: "13px" }}
                              >
                                #{transfer.id}
                              </span>
                            </td>

                            {/* From Branch */}
                            <td className="px-3 py-3">
                              <BranchTag name={transfer.fromBranch} />
                            </td>

                            {/* Arrow */}
                            <td className="px-1 py-3 text-center">
                              <ArrowRight
                                size={13}
                                style={{ color: "#9aabbf" }}
                              />
                            </td>

                            {/* To Branch */}
                            <td className="px-3 py-3">
                              <BranchTag name={transfer.toBranch} />
                            </td>

                            {/* Date */}
                            <td
                              className="px-3 py-3"
                              style={{ color: "#001d63", fontSize: "13px" }}
                            >
                              <div>{transfer.date}</div>
                              {transfer.deliveredAt && (
                                <div
                                  className="text-xs"
                                  style={{ color: "#0c8628" }}
                                >
                                  Rcvd: {transfer.deliveredAt.split(" ")[0]}
                                </div>
                              )}
                              {transfer.dispatchedAt &&
                                !transfer.deliveredAt && (
                                  <div
                                    className="text-xs"
                                    style={{ color: "#c89400" }}
                                  >
                                    Dep:{" "}
                                    {transfer.dispatchedAt.split(",")[1] ??
                                      transfer.dispatchedAt.split(" ")[1]}
                                  </div>
                                )}
                            </td>

                            {/* Items */}
                            <td className="px-3 py-3 text-center">
                              <span
                                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg font-bold"
                                style={{
                                  background: "#e1e7f5",
                                  color: "#062d8c",
                                  fontSize: "12px",
                                }}
                              >
                                <Package size={10} />
                                {transfer.items.length} SKU
                              </span>
                              <div
                                className="text-xs mt-0.5"
                                style={{ color: "#9aabbf" }}
                              >
                                {totalUnitsInTransfer} units
                              </div>
                            </td>

                            {/* Handled By */}
                            <td
                              className="px-3 py-3"
                              style={{ color: "#001d63", fontSize: "13px" }}
                            >
                              <div className="flex items-center gap-1.5">
                                <div
                                  className="w-5 h-5 rounded-full flex items-center justify-center shrink-0"
                                  style={{ background: "#e1e7f5" }}
                                >
                                  <span
                                    style={{
                                      color: "#062d8c",
                                      fontSize: "8px",
                                      fontWeight: 700,
                                    }}
                                  >
                                    {transfer.handledBy
                                      .split(".")[0]
                                      .trim()
                                      .charAt(0)}
                                    {transfer.handledBy
                                      .split(".")[1]
                                      ?.trim()
                                      .charAt(0) ?? ""}
                                  </span>
                                </div>
                                {transfer.handledBy}
                              </div>
                            </td>

                            {/* Status */}
                            <td className="px-3 py-3">
                              <StatusPill status={transfer.status} />
                            </td>

                            {/* Actions */}
                            <td
                              className="px-3 py-3"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <div className="flex items-center justify-center gap-1.5 flex-wrap">
                                {/* View */}
                                <button
                                  title="View Details"
                                  onClick={() => setDetailTransfer(transfer)}
                                  className="flex items-center gap-1 h-7 px-2.5 rounded-lg text-xs font-semibold hover:opacity-80 transition-opacity"
                                  style={{
                                    background: "rgba(21,54,239,0.1)",
                                    color: "#1536ef",
                                  }}
                                >
                                  <Eye size={11} />
                                  View
                                </button>

                                {/* Dispatch Now (Preparing) */}
                                {transfer.status === "Preparing" && (
                                  <button
                                    title="Dispatch Now"
                                    onClick={() => {
                                      handleConfirmDelivery(transfer.id);
                                      setTransfers((prev) =>
                                        prev.map((t) =>
                                          t.id === transfer.id
                                            ? {
                                                ...t,
                                                status:
                                                  "In Transit" as TransferStatus,
                                                dispatchedAt:
                                                  new Date().toLocaleString(
                                                    "en-US",
                                                    {
                                                      month: "2-digit",
                                                      day: "2-digit",
                                                      year: "numeric",
                                                      hour: "2-digit",
                                                      minute: "2-digit",
                                                    },
                                                  ),
                                              }
                                            : t,
                                        ),
                                      );
                                    }}
                                    className="flex items-center gap-1 h-7 px-2.5 rounded-lg text-xs font-semibold hover:opacity-80 transition-opacity"
                                    style={{
                                      background: "rgba(21,54,239,0.1)",
                                      color: "#1536ef",
                                    }}
                                  >
                                    <Truck size={11} />
                                    Dispatch
                                  </button>
                                )}

                                {/* Confirm Delivery (In Transit) */}
                                {transfer.status === "In Transit" && (
                                  <button
                                    title="Confirm Delivery"
                                    onClick={() => setConfirmTransfer(transfer)}
                                    className="flex items-center gap-1 h-7 px-2.5 rounded-lg text-xs font-semibold text-white hover:opacity-90 transition-opacity"
                                    style={{
                                      background: "#0c8628",
                                      boxShadow:
                                        "0 2px 6px rgba(12,134,40,0.3)",
                                    }}
                                  >
                                    <ClipboardCheck size={11} />
                                    Confirm
                                  </button>
                                )}

                                {/* Delivered stamp */}
                                {transfer.status === "Delivered" && (
                                  <div
                                    className="flex items-center gap-1 h-7 px-2.5 rounded-lg text-xs font-semibold"
                                    style={{
                                      background: "rgba(12,134,40,0.1)",
                                      color: "#0c8628",
                                    }}
                                  >
                                    <CheckCircle size={11} />
                                    Done
                                  </div>
                                )}
                              </div>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div
                  className="flex items-center justify-between px-5 py-3"
                  style={{ borderTop: "1px solid #e1e7f5" }}
                >
                  <span className="text-xs" style={{ color: "#9aabbf" }}>
                    Showing{" "}
                    {Math.min((page - 1) * ITEMS_PER_PAGE + 1, filtered.length)}
                    {" - "}
                    {Math.min(page * ITEMS_PER_PAGE, filtered.length)} of{" "}
                    {filtered.length} records
                  </span>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => setPage((p) => Math.max(1, p - 1))}
                      disabled={page === 1}
                      className="w-7 h-7 rounded flex items-center justify-center disabled:opacity-30 hover:opacity-80"
                      style={{ background: "#e1e7f5", color: "#062d8c" }}
                    >
                      <ChevronLeft size={13} />
                    </button>
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map(
                      (p) => (
                        <button
                          key={p}
                          onClick={() => setPage(p)}
                          className="w-7 h-7 rounded text-xs font-bold"
                          style={{
                            background: p === page ? "#062d8c" : "#e1e7f5",
                            color: p === page ? "#fff" : "#062d8c",
                          }}
                        >
                          {p}
                        </button>
                      ),
                    )}
                    <button
                      onClick={() =>
                        setPage((p) => Math.min(totalPages, p + 1))
                      }
                      disabled={page === totalPages}
                      className="w-7 h-7 rounded flex items-center justify-center disabled:opacity-30 hover:opacity-80"
                      style={{ background: "#e1e7f5", color: "#062d8c" }}
                    >
                      <ChevronRight size={13} />
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Legend */}
            <div className="flex items-center gap-5 flex-wrap">
              {(
                [
                  "Preparing",
                  "In Transit",
                  "Delivered",
                  "Cancelled",
                ] as TransferStatus[]
              ).map((s) => (
                <div key={s} className="flex items-center gap-1.5">
                  <span
                    className="w-2 h-2 rounded-full"
                    style={{ background: STATUS_CFG[s].dot }}
                  />
                  <span
                    className="text-xs font-semibold"
                    style={{ color: "#9aabbf" }}
                  >
                    {s}
                  </span>
                </div>
              ))}
              <span className="text-xs ml-auto" style={{ color: "#9aabbf" }}>
                Click any row to view full manifest details
              </span>
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

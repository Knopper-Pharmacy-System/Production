import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import {
  ChevronRight,
  ChevronDown,
  Truck,
  Package,
  CheckCircle,
  AlertTriangle,
  ClipboardCheck,
  User,
  Calendar,
  Hash,
  MapPin,
  FileText,
  Check,
  X,
} from "lucide-react";
import AdminSidebar from "../../components/admin/AdminSidebar";
import AdminHeader from "../../components/admin/AdminHeader";

// --- Types -------------------------------------------------------------------

interface ReceiptLine {
  itemName: string;
  sku: string;
  unit: string;
  orderedQty: number;
  prevReceived: number;
  receivingNow: number;
  condition: "Good" | "Damaged" | "Expired";
}

interface ApprovedPO {
  id: string;
  supplier: string;
  orderDate: string;
  deliverTo: string;
  payTerm: string;
  status: "Approved" | "Partial";
  items: ReceiptLine[];
}

// --- Mock Data ---------------------------------------------------------------

const APPROVED_POS: ApprovedPO[] = [
  {
    id: "PO-2026-001",
    supplier: "Norvic Drugs Corporation",
    orderDate: "03/01/2026",
    deliverTo: "BMC MAIN",
    payTerm: "30 Days",
    status: "Approved",
    items: [
      {
        itemName: "Paracetamol 500MG Tab (ALVEDON)",
        sku: "101674",
        unit: "Tab",
        orderedQty: 200,
        prevReceived: 0,
        receivingNow: 200,
        condition: "Good",
      },
      {
        itemName: "Amoxicillin 500MG Cap",
        sku: "56712",
        unit: "Cap",
        orderedQty: 100,
        prevReceived: 0,
        receivingNow: 100,
        condition: "Good",
      },
      {
        itemName: "Biogesic 500MG Tab",
        sku: "78432",
        unit: "Tab",
        orderedQty: 150,
        prevReceived: 0,
        receivingNow: 150,
        condition: "Good",
      },
      {
        itemName: "Ibuprofen 400MG Tab",
        sku: "01234",
        unit: "Tab",
        orderedQty: 100,
        prevReceived: 0,
        receivingNow: 100,
        condition: "Good",
      },
      {
        itemName: "Decolgen Tab",
        sku: "89012",
        unit: "Tab",
        orderedQty: 80,
        prevReceived: 0,
        receivingNow: 80,
        condition: "Good",
      },
      {
        itemName: "Cougmax 100mL Syrup",
        sku: "23456",
        unit: "Bot",
        orderedQty: 50,
        prevReceived: 0,
        receivingNow: 50,
        condition: "Good",
      },
      {
        itemName: "Betadine Solution 100mL",
        sku: "45689",
        unit: "Bot",
        orderedQty: 40,
        prevReceived: 0,
        receivingNow: 40,
        condition: "Good",
      },
      {
        itemName: "Face Mask 3-ply 50pcs",
        sku: "12345",
        unit: "Box",
        orderedQty: 30,
        prevReceived: 0,
        receivingNow: 30,
        condition: "Good",
      },
      {
        itemName: "Disposable Gloves Medium",
        sku: "98234",
        unit: "Box",
        orderedQty: 25,
        prevReceived: 0,
        receivingNow: 25,
        condition: "Good",
      },
      {
        itemName: "Bandage Gauze 4in x 4yd",
        sku: "78901",
        unit: "Roll",
        orderedQty: 50,
        prevReceived: 0,
        receivingNow: 50,
        condition: "Good",
      },
    ],
  },
  {
    id: "PO-2026-007",
    supplier: "Century Pacific Food Inc.",
    orderDate: "03/15/2026",
    deliverTo: "PANGANIBAN BRANCH",
    payTerm: "COD",
    status: "Approved",
    items: [
      {
        itemName: "Lucky Me Pancit Canton 65g",
        sku: "34512",
        unit: "Pcs",
        orderedQty: 300,
        prevReceived: 0,
        receivingNow: 300,
        condition: "Good",
      },
      {
        itemName: "Del Monte Pineapple Juice 240mL",
        sku: "90123",
        unit: "Pcs",
        orderedQty: 200,
        prevReceived: 0,
        receivingNow: 200,
        condition: "Good",
      },
      {
        itemName: "Milo 300g",
        sku: "45678",
        unit: "Box",
        orderedQty: 100,
        prevReceived: 0,
        receivingNow: 100,
        condition: "Good",
      },
      {
        itemName: "Eden Cheese 165g",
        sku: "56789",
        unit: "Pcs",
        orderedQty: 150,
        prevReceived: 0,
        receivingNow: 150,
        condition: "Good",
      },
      {
        itemName: "Nestle Milo 3-in-1 10s",
        sku: "11223",
        unit: "Box",
        orderedQty: 80,
        prevReceived: 0,
        receivingNow: 80,
        condition: "Good",
      },
      {
        itemName: "Pancit Canton Extra Hot 65g",
        sku: "33445",
        unit: "Pcs",
        orderedQty: 200,
        prevReceived: 0,
        receivingNow: 200,
        condition: "Good",
      },
      {
        itemName: "Century Tuna Hot Spicy 155g",
        sku: "55667",
        unit: "Can",
        orderedQty: 144,
        prevReceived: 0,
        receivingNow: 144,
        condition: "Good",
      },
    ],
  },
  {
    id: "PO-2026-010",
    supplier: "United Lab Inc.",
    orderDate: "03/17/2026",
    deliverTo: "BMC MAIN",
    payTerm: "7 Days",
    status: "Partial",
    items: [
      {
        itemName: "Biogesic 500MG Tab",
        sku: "78432",
        unit: "Tab",
        orderedQty: 200,
        prevReceived: 100,
        receivingNow: 0,
        condition: "Good",
      },
      {
        itemName: "Neozep Forte Tab",
        sku: "34567",
        unit: "Tab",
        orderedQty: 150,
        prevReceived: 150,
        receivingNow: 0,
        condition: "Good",
      },
      {
        itemName: "Decolgen Tab",
        sku: "89012",
        unit: "Tab",
        orderedQty: 100,
        prevReceived: 50,
        receivingNow: 50,
        condition: "Good",
      },
      {
        itemName: "Cougmax 100mL Syrup",
        sku: "23456",
        unit: "Bot",
        orderedQty: 80,
        prevReceived: 0,
        receivingNow: 80,
        condition: "Good",
      },
      {
        itemName: "Paracetamol 500MG Tab",
        sku: "101674",
        unit: "Tab",
        orderedQty: 300,
        prevReceived: 200,
        receivingNow: 0,
        condition: "Good",
      },
      {
        itemName: "Amoxicillin 500MG Cap",
        sku: "56712",
        unit: "Cap",
        orderedQty: 100,
        prevReceived: 100,
        receivingNow: 0,
        condition: "Good",
      },
    ],
  },
  {
    id: "PO-2026-011",
    supplier: "Reckitt Benckiser Philippines",
    orderDate: "03/17/2026",
    deliverTo: "BMC MAIN",
    payTerm: "COD",
    status: "Approved",
    items: [
      {
        itemName: "Dettol Antiseptic 500mL",
        sku: "67890",
        unit: "Bot",
        orderedQty: 50,
        prevReceived: 0,
        receivingNow: 50,
        condition: "Good",
      },
      {
        itemName: "Dettol Hand Wash 250mL",
        sku: "67891",
        unit: "Bot",
        orderedQty: 40,
        prevReceived: 0,
        receivingNow: 40,
        condition: "Good",
      },
      {
        itemName: "Dettol Bar Soap 135g",
        sku: "67892",
        unit: "Pcs",
        orderedQty: 60,
        prevReceived: 0,
        receivingNow: 60,
        condition: "Good",
      },
      {
        itemName: "Lysol Spray 170g",
        sku: "67893",
        unit: "Can",
        orderedQty: 30,
        prevReceived: 0,
        receivingNow: 30,
        condition: "Good",
      },
      {
        itemName: "Vicks Vaporub 25g",
        sku: "67894",
        unit: "Jar",
        orderedQty: 72,
        prevReceived: 0,
        receivingNow: 72,
        condition: "Good",
      },
      {
        itemName: "Strepsils Original 24s",
        sku: "67895",
        unit: "Box",
        orderedQty: 48,
        prevReceived: 0,
        receivingNow: 48,
        condition: "Good",
      },
    ],
  },
];

const CONDITIONS: ("Good" | "Damaged" | "Expired")[] = [
  "Good",
  "Damaged",
  "Expired",
];

// --- Helpers -----------------------------------------------------------------

function today() {
  return new Date().toLocaleDateString("en-US", {
    month: "2-digit",
    day: "2-digit",
    year: "numeric",
  });
}

function genReceiptNo() {
  return (
    "DR-" +
    new Date().getFullYear() +
    "-" +
    String(Math.floor(Math.random() * 900) + 100)
  );
}

const CONDITION_STYLES: Record<string, { bg: string; color: string }> = {
  Good: { bg: "rgba(12,134,40,0.12)", color: "#0c8628" },
  Damaged: { bg: "rgba(241,0,0,0.1)", color: "#d40000" },
  Expired: { bg: "rgba(200,148,0,0.18)", color: "#c89400" },
};

// --- Main Page ---------------------------------------------------------------

export default function AdminReceiveDeliveryPage() {
  const navigate = useNavigate();
  const [currentTime, setCurrentTime] = useState(new Date());
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // -- PO selection --
  const [selectedPOId, setSelectedPOId] = useState<string>("");
  const [lines, setLines] = useState<ReceiptLine[]>([]);

  // -- Delivery info --
  const [receiptNo, setReceiptNo] = useState(genReceiptNo);
  const [deliveryDate, setDeliveryDate] = useState(today);
  const [driver, setDriver] = useState("Juan Dela Cruz");
  const [vehiclePlate, setVehiclePlate] = useState("ABC-1234");
  const [drNotes, setDrNotes] = useState("");

  // -- Submission --
  const [submitted, setSubmitted] = useState(false);

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

  const selectedPO = APPROVED_POS.find((p) => p.id === selectedPOId);

  function handleSelectPO(id: string) {
    setSelectedPOId(id);
    const po = APPROVED_POS.find((p) => p.id === id);
    if (po) setLines(po.items.map((item) => ({ ...item })));
    setSubmitted(false);
  }

  function updateLine(idx: number, patch: Partial<ReceiptLine>) {
    setLines((prev) =>
      prev.map((l, i) => (i === idx ? { ...l, ...patch } : l)),
    );
  }

  // -- Totals --
  const totalOrdered = lines.reduce((s, l) => s + l.orderedQty, 0);
  const totalPrevRecv = lines.reduce((s, l) => s + l.prevReceived, 0);
  const totalReceiving = lines.reduce((s, l) => s + l.receivingNow, 0);
  const totalRemaining = lines.reduce(
    (s, l) => s + Math.max(0, l.orderedQty - l.prevReceived - l.receivingNow),
    0,
  );

  const allComplete = totalRemaining === 0 && lines.length > 0;
  const receiptType = allComplete ? "Full Receipt" : "Partial Receipt";

  const damagedCount = lines.filter(
    (l) => l.condition !== "Good" && l.receivingNow > 0,
  ).length;

  const inputSty: React.CSSProperties = {
    background: "#fff",
    border: "1px solid #dad8d8",
    color: "#001d63",
  };

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
        activeItem="Receive Delivery"
        onNavigate={() => {}}
      />

      <div className="relative z-10 w-full max-w-450 mx-auto px-4 sm:px-6 lg:px-8 xl:px-10 2xl:px-12 py-6 flex flex-col gap-5">
        <AdminHeader
          onMenuClick={() => setSidebarOpen(true)}
          currentTime={currentTime}
          isOnline={isOnline}
        />

        {/* Main Card */}
        <div
          className="rounded-2xl pb-6 flex flex-col gap-0"
          style={{
            background: "#f0f0f0",
            border: "1px solid rgba(47,47,47,0.68)",
            boxShadow: "0 0 50px 0px #062d8c",
          }}
        >
          {/* Top bar */}
          <div className="px-7 pt-6 pb-5">
            <div className="flex items-center gap-1.5 mb-3">
              <span
                className="text-xs font-semibold"
                style={{ color: "#5a7ab5" }}
              >
                Ordering and Deliveries
              </span>
              <ChevronRight size={13} style={{ color: "#5a7ab5" }} />
              <span
                className="text-xs font-semibold"
                style={{ color: "#062d8c" }}
              >
                Receive Delivery
              </span>
            </div>
            <div className="flex items-center justify-between flex-wrap gap-3">
              <div className="flex items-center gap-3">
                <h1
                  className="font-extrabold"
                  style={{ color: "#062d8c", fontSize: "22px" }}
                >
                  Record Delivery Receipt
                </h1>
                {selectedPO && (
                  <span
                    className="px-3 py-1 rounded-full text-xs font-bold"
                    style={{
                      background:
                        selectedPO.status === "Partial"
                          ? "rgba(255,140,0,0.18)"
                          : "rgba(21,54,239,0.12)",
                      color:
                        selectedPO.status === "Partial" ? "#c86a00" : "#1536ef",
                    }}
                  >
                    {selectedPO.status === "Partial"
                      ? "Partial PO"
                      : "Approved PO"}
                  </span>
                )}
              </div>
              <button
                onClick={() => navigate("/admin/purchase-orders")}
                className="flex items-center gap-2 h-9 px-4 rounded-xl text-xs font-bold hover:opacity-80 transition-opacity"
                style={{
                  background: "#e1e7f5",
                  color: "#062d8c",
                  border: "1px solid #c5d2e8",
                }}
              >
                <FileText size={13} />
                View All POs
              </button>
            </div>
          </div>

          <div
            className="mx-7"
            style={{ borderTop: "1px solid rgba(47,47,47,0.12)" }}
          />

          <div className="px-7 pt-5 flex flex-col gap-5">
            {/* Success Banner */}
            {submitted && (
              <div
                className="flex items-center gap-3 px-5 py-4 rounded-xl"
                style={{
                  background: "rgba(12,134,40,0.1)",
                  border: "1px solid rgba(12,134,40,0.3)",
                }}
              >
                <CheckCircle size={20} style={{ color: "#0c8628" }} />
                <div>
                  <p className="font-bold" style={{ color: "#0c8628" }}>
                    Delivery Receipt Saved Successfully
                  </p>
                  <p className="text-xs" style={{ color: "#0c8628" }}>
                    {receiptNo} &middot; {receiptType} &middot; {totalReceiving}{" "}
                    units received from {selectedPO?.supplier}
                  </p>
                </div>
                <button
                  onClick={() => setSubmitted(false)}
                  className="ml-auto hover:opacity-70"
                  style={{ color: "#0c8628" }}
                >
                  <X size={16} />
                </button>
              </div>
            )}

            {/* Row 1: Select PO + Delivery Info */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
              {/* Select PO Card */}
              <div
                className="rounded-xl p-5 flex flex-col gap-4"
                style={{
                  background: "#fff",
                  border: "1px solid rgba(47,47,47,0.1)",
                  boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
                }}
              >
                <div
                  className="flex items-center gap-2 pb-1"
                  style={{ borderBottom: "1.5px solid #e1e7f5" }}
                >
                  <FileText size={14} style={{ color: "#062d8c" }} />
                  <span
                    className="font-bold"
                    style={{ color: "#062d8c", fontSize: "14px" }}
                  >
                    Select Purchase Order
                  </span>
                </div>

                {/* PO Dropdown */}
                <div className="flex flex-col gap-1">
                  <span
                    className="text-xs font-semibold"
                    style={{ color: "#707070" }}
                  >
                    Purchase Order
                  </span>
                  <div className="relative">
                    <select
                      value={selectedPOId}
                      onChange={(e) => handleSelectPO(e.target.value)}
                      className="w-full h-9 px-3 pr-8 rounded-lg text-sm appearance-none outline-none"
                      style={{
                        ...inputSty,
                        color: selectedPOId ? "#001d63" : "#aaa",
                      }}
                    >
                      <option value="">-- select an approved PO --</option>
                      {APPROVED_POS.map((po) => (
                        <option key={po.id} value={po.id}>
                          {po.id} | {po.supplier} [{po.status}]
                        </option>
                      ))}
                    </select>
                    <ChevronDown
                      size={13}
                      className="absolute right-2.5 top-2.75 pointer-events-none"
                      style={{ color: "#062d8c" }}
                    />
                  </div>
                </div>

                {/* PO Info Panel */}
                {selectedPO ? (
                  <div
                    className="rounded-xl p-4 flex flex-col gap-3"
                    style={{
                      background: "#f8faff",
                      border: "1px solid #e1e7f5",
                    }}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                        style={{ background: "#062d8c" }}
                      >
                        <span className="font-extrabold text-white">
                          {selectedPO.supplier.charAt(0)}
                        </span>
                      </div>
                      <div>
                        <p
                          className="font-bold"
                          style={{ color: "#001d63", fontSize: "13px" }}
                        >
                          {selectedPO.supplier}
                        </p>
                        <p className="text-xs" style={{ color: "#9aabbf" }}>
                          Order Date: {selectedPO.orderDate}
                        </p>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      {[
                        {
                          icon: <MapPin size={11} />,
                          label: "Deliver To",
                          value: selectedPO.deliverTo,
                        },
                        {
                          icon: <Hash size={11} />,
                          label: "Pay Term",
                          value: selectedPO.payTerm,
                        },
                        {
                          icon: <Package size={11} />,
                          label: "Items",
                          value:
                            String(selectedPO.items.length) + " line items",
                        },
                        {
                          icon: <Truck size={11} />,
                          label: "PO Status",
                          value: selectedPO.status,
                        },
                      ].map(({ icon, label, value }) => (
                        <div
                          key={label}
                          className="flex items-center gap-1.5 px-2 py-1.5 rounded-lg"
                          style={{
                            background: "#fff",
                            border: "1px solid #e1e7f5",
                          }}
                        >
                          <span style={{ color: "#1536ef" }}>{icon}</span>
                          <div className="flex flex-col">
                            <span
                              className="text-xs"
                              style={{ color: "#9aabbf", fontSize: "10px" }}
                            >
                              {label}
                            </span>
                            <span
                              className="font-semibold"
                              style={{ color: "#001d63", fontSize: "11px" }}
                            >
                              {value}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div
                    className="flex flex-col items-center justify-center py-8 rounded-xl"
                    style={{
                      background: "#f8faff",
                      border: "1.5px dashed #c5d2e8",
                    }}
                  >
                    <Truck size={28} style={{ color: "#c5d2e8" }} />
                    <p
                      className="text-xs mt-2 font-semibold"
                      style={{ color: "#9aabbf" }}
                    >
                      Select a Purchase Order to begin recording receipt
                    </p>
                  </div>
                )}
              </div>

              {/* Delivery Info Card */}
              <div
                className="rounded-xl p-5 flex flex-col gap-4"
                style={{
                  background: "#fff",
                  border: "1px solid rgba(47,47,47,0.1)",
                  boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
                }}
              >
                <div
                  className="flex items-center gap-2 pb-1"
                  style={{ borderBottom: "1.5px solid #e1e7f5" }}
                >
                  <ClipboardCheck size={14} style={{ color: "#062d8c" }} />
                  <span
                    className="font-bold"
                    style={{ color: "#062d8c", fontSize: "14px" }}
                  >
                    Delivery Information
                  </span>
                </div>

                {/* Receipt Number (auto) */}
                <div className="flex flex-col gap-1">
                  <span
                    className="text-xs font-semibold"
                    style={{ color: "#707070" }}
                  >
                    Delivery Receipt No.
                  </span>
                  <div className="flex gap-2">
                    <div
                      className="flex-1 h-9 px-3 rounded-lg flex items-center text-sm"
                      style={{
                        background: "#f5f4f4",
                        border: "1px solid #e0e0e0",
                        color: "#1536ef",
                      }}
                    >
                      <Hash
                        size={12}
                        className="mr-1.5"
                        style={{ color: "#1536ef" }}
                      />
                      {receiptNo}
                    </div>
                    <button
                      onClick={() => setReceiptNo(genReceiptNo())}
                      className="h-9 px-3 rounded-lg text-xs font-bold hover:opacity-80"
                      style={{
                        background: "#e1e7f5",
                        color: "#062d8c",
                        border: "1px solid #c5d2e8",
                      }}
                    >
                      Regen
                    </button>
                  </div>
                </div>

                {/* Delivery Date */}
                <div className="flex flex-col gap-1">
                  <span
                    className="text-xs font-semibold"
                    style={{ color: "#707070" }}
                  >
                    <Calendar size={11} className="inline mr-1" />
                    Delivery Date
                  </span>
                  <input
                    type="text"
                    value={deliveryDate}
                    onChange={(e) => setDeliveryDate(e.target.value)}
                    placeholder="MM/DD/YYYY"
                    className="w-full h-9 px-3 rounded-lg text-sm outline-none"
                    style={inputSty}
                  />
                </div>

                {/* Driver / Courier */}
                <div className="flex flex-col gap-1">
                  <span
                    className="text-xs font-semibold"
                    style={{ color: "#707070" }}
                  >
                    <User size={11} className="inline mr-1" />
                    Driver / Courier Name
                  </span>
                  <input
                    type="text"
                    value={driver}
                    onChange={(e) => setDriver(e.target.value)}
                    placeholder="e.g. Juan Dela Cruz"
                    className="w-full h-9 px-3 rounded-lg text-sm outline-none"
                    style={inputSty}
                  />
                </div>

                {/* Vehicle Plate */}
                <div className="flex flex-col gap-1">
                  <span
                    className="text-xs font-semibold"
                    style={{ color: "#707070" }}
                  >
                    Vehicle Plate No.
                  </span>
                  <input
                    type="text"
                    value={vehiclePlate}
                    onChange={(e) => setVehiclePlate(e.target.value)}
                    placeholder="e.g. ABC-1234"
                    className="w-full h-9 px-3 rounded-lg text-sm outline-none"
                    style={inputSty}
                  />
                </div>

                {/* Notes */}
                <div className="flex flex-col gap-1 flex-1">
                  <span
                    className="text-xs font-semibold"
                    style={{ color: "#707070" }}
                  >
                    Delivery Notes
                  </span>
                  <textarea
                    value={drNotes}
                    onChange={(e) => setDrNotes(e.target.value)}
                    placeholder="Any notes about this delivery (damage, missing items, etc.)..."
                    rows={3}
                    className="w-full px-3 py-2 rounded-lg text-sm outline-none resize-none"
                    style={{ ...inputSty, lineHeight: "1.5" }}
                  />
                </div>
              </div>
            </div>

            {/* Items Receipt Table */}
            {lines.length > 0 && (
              <div
                className="rounded-xl overflow-hidden"
                style={{
                  background: "#fff",
                  border: "1px solid rgba(47,47,47,0.1)",
                  boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
                }}
              >
                {/* Table Header */}
                <div
                  className="px-5 py-4 flex items-center justify-between flex-wrap gap-2"
                  style={{ borderBottom: "1.5px solid #e1e7f5" }}
                >
                  <div className="flex items-center gap-3">
                    <Package size={15} style={{ color: "#062d8c" }} />
                    <span
                      className="font-bold"
                      style={{ color: "#062d8c", fontSize: "14px" }}
                    >
                      Items to Receive
                    </span>
                    <span
                      className="px-2 py-0.5 rounded-full text-xs font-bold"
                      style={{ background: "#e1e7f5", color: "#062d8c" }}
                    >
                      {lines.length} items
                    </span>
                  </div>
                  <div className="flex items-center gap-4">
                    {damagedCount > 0 && (
                      <div className="flex items-center gap-1.5">
                        <AlertTriangle size={13} style={{ color: "#c89400" }} />
                        <span
                          className="text-xs font-semibold"
                          style={{ color: "#c89400" }}
                        >
                          {damagedCount} item{damagedCount > 1 ? "s" : ""} with
                          issues
                        </span>
                      </div>
                    )}
                    <span
                      className="px-3 py-1 rounded-full text-xs font-bold"
                      style={{
                        background: allComplete
                          ? "rgba(12,134,40,0.12)"
                          : "rgba(200,148,0,0.18)",
                        color: allComplete ? "#0c8628" : "#c89400",
                      }}
                    >
                      {receiptType}
                    </span>
                  </div>
                </div>

                {/* Table */}
                <div className="overflow-x-auto">
                  <table
                    className="w-full text-sm border-collapse"
                    style={{ minWidth: "780px" }}
                  >
                    <thead>
                      <tr
                        style={{
                          background: "#e1e7f5",
                          borderBottom: "1px solid #dbdee4",
                        }}
                      >
                        {[
                          "#",
                          "Item Name",
                          "SKU",
                          "Unit",
                          "Ordered",
                          "Prev. Received",
                          "Receiving Now",
                          "Remaining",
                          "Condition",
                        ].map((h, i) => (
                          <th
                            key={i}
                            className={`px-3 py-2.5 font-semibold whitespace-nowrap ${i === 0 ? "text-center" : i >= 4 && i <= 7 ? "text-right" : "text-left"}`}
                            style={{ color: "#001d63", fontSize: "13px" }}
                          >
                            {h}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {lines.map((line, idx) => {
                        const remaining = Math.max(
                          0,
                          line.orderedQty -
                            line.prevReceived -
                            line.receivingNow,
                        );
                        const isFullyReceived =
                          line.prevReceived >= line.orderedQty;
                        return (
                          <tr
                            key={idx}
                            style={{
                              background: idx % 2 === 0 ? "#f5f4f4" : "#e6e6e6",
                            }}
                          >
                            {/* # */}
                            <td
                              className="px-3 py-2.5 w-8 text-center"
                              style={{ color: "#9aabbf", fontSize: "12px" }}
                            >
                              {idx + 1}
                            </td>
                            {/* Item Name */}
                            <td
                              className="px-3 py-2.5"
                              style={{
                                color: "#001d63",
                                fontSize: "13px",
                                maxWidth: "200px",
                              }}
                            >
                              <div className="flex items-center gap-1.5">
                                {isFullyReceived && (
                                  <Check
                                    size={12}
                                    style={{ color: "#0c8628", flexShrink: 0 }}
                                  />
                                )}
                                <span
                                  className={
                                    isFullyReceived ? "opacity-60" : ""
                                  }
                                >
                                  {line.itemName}
                                </span>
                              </div>
                            </td>
                            {/* SKU */}
                            <td
                              className="px-3 py-2.5"
                              style={{ color: "#707070", fontSize: "12px" }}
                            >
                              {line.sku}
                            </td>
                            {/* Unit */}
                            <td
                              className="px-3 py-2.5"
                              style={{ color: "#001d63", fontSize: "13px" }}
                            >
                              {line.unit}
                            </td>
                            {/* Ordered */}
                            <td
                              className="px-3 py-2.5 text-right font-semibold"
                              style={{ color: "#001d63", fontSize: "13px" }}
                            >
                              {line.orderedQty}
                            </td>
                            {/* Prev Received */}
                            <td
                              className="px-3 py-2.5 text-right"
                              style={{
                                color:
                                  line.prevReceived > 0 ? "#0c8628" : "#9aabbf",
                                fontSize: "13px",
                                fontWeight: 600,
                              }}
                            >
                              {line.prevReceived}
                            </td>
                            {/* Receiving Now */}
                            <td className="px-3 py-2.5 text-right">
                              {isFullyReceived ? (
                                <span
                                  className="text-xs font-semibold px-2 py-0.5 rounded-full"
                                  style={{
                                    background: "rgba(12,134,40,0.12)",
                                    color: "#0c8628",
                                  }}
                                >
                                  Complete
                                </span>
                              ) : (
                                <input
                                  type="number"
                                  value={line.receivingNow}
                                  min={0}
                                  max={line.orderedQty - line.prevReceived}
                                  onChange={(e) =>
                                    updateLine(idx, {
                                      receivingNow: Math.min(
                                        parseInt(e.target.value) || 0,
                                        line.orderedQty - line.prevReceived,
                                      ),
                                    })
                                  }
                                  className="w-16 h-7 px-2 rounded text-xs text-right outline-none"
                                  style={{
                                    background: "#fff",
                                    border: "1px solid #dad8d8",
                                    color: "#001d63",
                                  }}
                                />
                              )}
                            </td>
                            {/* Remaining */}
                            <td
                              className="px-3 py-2.5 text-right font-semibold"
                              style={{
                                color: remaining === 0 ? "#0c8628" : "#d40000",
                                fontSize: "13px",
                              }}
                            >
                              {remaining}
                            </td>
                            {/* Condition */}
                            <td className="px-3 py-2.5">
                              {isFullyReceived ? (
                                <span
                                  className="text-xs font-semibold px-2 py-0.5 rounded-full"
                                  style={CONDITION_STYLES["Good"]}
                                >
                                  Good
                                </span>
                              ) : (
                                <div className="relative">
                                  <select
                                    value={line.condition}
                                    onChange={(e) =>
                                      updateLine(idx, {
                                        condition: e.target.value as
                                          | "Good"
                                          | "Damaged"
                                          | "Expired",
                                      })
                                    }
                                    className="h-7 px-2 pr-6 rounded text-xs appearance-none outline-none"
                                    style={{
                                      background:
                                        CONDITION_STYLES[line.condition].bg,
                                      color:
                                        CONDITION_STYLES[line.condition].color,
                                      border: "1px solid transparent",
                                      fontWeight: 600,
                                    }}
                                  >
                                    {CONDITIONS.map((c) => (
                                      <option key={c} value={c}>
                                        {c}
                                      </option>
                                    ))}
                                  </select>
                                  <ChevronDown
                                    size={10}
                                    className="absolute right-1.5 top-2.25 pointer-events-none"
                                    style={{
                                      color:
                                        CONDITION_STYLES[line.condition].color,
                                    }}
                                  />
                                </div>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                {/* Receipt Summary */}
                <div
                  className="px-5 py-4 flex items-center justify-between flex-wrap gap-4"
                  style={{ borderTop: "1.5px solid #e1e7f5" }}
                >
                  {/* Stats */}
                  <div className="flex items-center gap-6 flex-wrap">
                    {[
                      {
                        label: "Total Ordered",
                        value: totalOrdered,
                        color: "#001d63",
                      },
                      {
                        label: "Prev. Received",
                        value: totalPrevRecv,
                        color: "#1536ef",
                      },
                      {
                        label: "Receiving Now",
                        value: totalReceiving,
                        color: "#0c8628",
                      },
                      {
                        label: "Still Remaining",
                        value: totalRemaining,
                        color: totalRemaining > 0 ? "#d40000" : "#0c8628",
                      },
                    ].map(({ label, value, color }) => (
                      <div key={label} className="flex flex-col gap-0.5">
                        <span
                          className="text-xs font-semibold"
                          style={{ color: "#9aabbf" }}
                        >
                          {label}
                        </span>
                        <span
                          className="font-extrabold"
                          style={{ color, fontSize: "18px" }}
                        >
                          {value}
                        </span>
                      </div>
                    ))}
                  </div>

                  {/* Progress bar */}
                  <div className="flex flex-col gap-1 min-w-50">
                    <div className="flex justify-between">
                      <span
                        className="text-xs font-semibold"
                        style={{ color: "#9aabbf" }}
                      >
                        Receipt Progress
                      </span>
                      <span
                        className="text-xs font-bold"
                        style={{ color: "#062d8c" }}
                      >
                        {totalOrdered > 0
                          ? Math.round(
                              ((totalPrevRecv + totalReceiving) /
                                totalOrdered) *
                                100,
                            )
                          : 0}
                        %
                      </span>
                    </div>
                    <div
                      className="h-2.5 rounded-full"
                      style={{ background: "#e1e7f5" }}
                    >
                      <div
                        className="h-2.5 rounded-full transition-all"
                        style={{
                          width: `${totalOrdered > 0 ? Math.min(((totalPrevRecv + totalReceiving) / totalOrdered) * 100, 100) : 0}%`,
                          background: allComplete ? "#0c8628" : "#1536ef",
                        }}
                      />
                    </div>
                    <span
                      className="text-xs font-semibold text-right"
                      style={{ color: allComplete ? "#0c8628" : "#c89400" }}
                    >
                      {receiptType}
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Footer Buttons */}
            <div className="flex items-center justify-between flex-wrap gap-3 pt-1">
              <p className="text-xs" style={{ color: "#9aabbf" }}>
                {selectedPO
                  ? `${selectedPO.id} | ${selectedPO.supplier} | ${lines.length} items`
                  : "No purchase order selected"}
              </p>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => navigate("/admin/purchase-orders")}
                  className="h-10 px-5 rounded-xl text-sm font-bold hover:opacity-80 transition-opacity"
                  style={{
                    background: "#efefef",
                    color: "#0b0b0b",
                    border: "1px solid #dad8d8",
                  }}
                >
                  Cancel
                </button>
                <button
                  disabled={!selectedPO}
                  onClick={() => {
                    if (selectedPO) {
                      setSubmitted(true);
                      window.scrollTo({ top: 0, behavior: "smooth" });
                    }
                  }}
                  className="flex items-center gap-2 h-10 px-5 rounded-xl text-sm font-bold text-white transition-opacity hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed"
                  style={{
                    background: "#0c8628",
                    boxShadow: "0 4px 12px rgba(12,134,40,0.3)",
                  }}
                >
                  <ClipboardCheck size={15} />
                  Save Delivery Receipt
                </button>
              </div>
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

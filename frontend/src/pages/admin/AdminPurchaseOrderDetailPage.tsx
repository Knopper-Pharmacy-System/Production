import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft,
  Printer,
  Edit2,
  CheckCircle,
  XCircle,
  Truck,
  Paperclip,
  FileText,
  ChevronRight,
  Clock,
  User,
  MapPin,
  CreditCard,
  Calendar,
  Package,
  MessageSquare,
} from "lucide-react";
import AdminSidebar from "../../components/admin/AdminSidebar";
import AdminHeader from "../../components/admin/AdminHeader";

// --- Types -------------------------------------------------------------------

type POStatus =
  | "Draft"
  | "Pending"
  | "Approved"
  | "Partial"
  | "Delivered"
  | "Cancelled";

interface OrderLine {
  itemName: string;
  sku: string;
  qty: number;
  unit: string;
  unitPrice: number;
  received?: number;
}

interface PORecord {
  id: string;
  date: string;
  expectedDate: string;
  refDoc: string;
  supplier: string;
  supplierContact: string;
  deliverTo: string;
  payTerm: string;
  status: POStatus;
  remarks: string;
  items: OrderLine[];
  timeline: { action: string; user: string; time: string; note?: string }[];
}

// --- Mock Data ---------------------------------------------------------------

const PO_DATABASE: Record<string, PORecord> = {
  "PO-2026-001": {
    id: "PO-2026-001",
    date: "03/01/2026",
    expectedDate: "03/10/2026",
    refDoc: "REF-2026-001",
    supplier: "Norvic Drugs Corporation",
    supplierContact: "sales@norvicdrugs.com | +63 2 8888-0001",
    deliverTo: "BMC MAIN",
    payTerm: "30 Days",
    status: "Approved",
    remarks: "Please deliver before 5PM. Include delivery receipt.",
    items: [
      {
        itemName: "Paracetamol 500MG Tab (ALVEDON)",
        sku: "101674",
        qty: 200,
        unit: "Tab",
        unitPrice: 8.5,
        received: 200,
      },
      {
        itemName: "Amoxicillin 500MG Cap",
        sku: "56712",
        qty: 100,
        unit: "Cap",
        unitPrice: 12.75,
        received: 100,
      },
      {
        itemName: "Biogesic 500MG Tab",
        sku: "78432",
        qty: 150,
        unit: "Tab",
        unitPrice: 9.25,
        received: 150,
      },
      {
        itemName: "Ibuprofen 400MG Tab",
        sku: "01234",
        qty: 100,
        unit: "Tab",
        unitPrice: 11.25,
        received: 100,
      },
      {
        itemName: "Decolgen Tab",
        sku: "89012",
        qty: 80,
        unit: "Tab",
        unitPrice: 12.0,
        received: 80,
      },
      {
        itemName: "Cougmax 100mL Syrup",
        sku: "23456",
        qty: 50,
        unit: "Bot",
        unitPrice: 55.0,
        received: 50,
      },
      {
        itemName: "Neozep Forte Tab",
        sku: "34567",
        qty: 120,
        unit: "Tab",
        unitPrice: 8.75,
        received: 120,
      },
      {
        itemName: "Betadine Solution 100mL",
        sku: "45689",
        qty: 40,
        unit: "Bot",
        unitPrice: 78.25,
        received: 40,
      },
      {
        itemName: "Dettol Antiseptic 500mL",
        sku: "67890",
        qty: 20,
        unit: "Bot",
        unitPrice: 145.0,
        received: 20,
      },
      {
        itemName: "Face Mask 3-ply 50pcs",
        sku: "12345",
        qty: 30,
        unit: "Box",
        unitPrice: 75.0,
        received: 30,
      },
      {
        itemName: "Disposable Gloves Medium",
        sku: "98234",
        qty: 25,
        unit: "Box",
        unitPrice: 65.0,
        received: 25,
      },
      {
        itemName: "Bandage Gauze 4in x 4yd",
        sku: "78901",
        qty: 50,
        unit: "Roll",
        unitPrice: 35.0,
        received: 50,
      },
    ],
    timeline: [
      { action: "PO Created", user: "Admin", time: "03/01/2026 08:32 AM" },
      {
        action: "Submitted",
        user: "Admin",
        time: "03/01/2026 08:45 AM",
        note: "Submitted for approval",
      },
      {
        action: "Approved",
        user: "Manager",
        time: "03/02/2026 10:15 AM",
        note: "All items verified with budget allocation",
      },
      {
        action: "Sent to Supplier",
        user: "Admin",
        time: "03/02/2026 11:00 AM",
      },
    ],
  },
  "PO-2026-002": {
    id: "PO-2026-002",
    date: "03/05/2026",
    expectedDate: "03/15/2026",
    refDoc: "REF-2026-002",
    supplier: "VMED Medical Co",
    supplierContact: "orders@vmed.com | +63 2 8888-0002",
    deliverTo: "DIVERSION BRANCH",
    payTerm: "COD",
    status: "Pending",
    remarks: "Urgent order. Please prioritize.",
    items: [
      {
        itemName: "20CC Syringe (ANY BRAND)",
        sku: "2.02E+11",
        qty: 500,
        unit: "Pcs",
        unitPrice: 5.25,
      },
      {
        itemName: "Disposable Gloves Medium",
        sku: "98234",
        qty: 20,
        unit: "Box",
        unitPrice: 65.0,
      },
      {
        itemName: "Face Mask 3-ply 50pcs",
        sku: "12345",
        qty: 10,
        unit: "Box",
        unitPrice: 75.0,
      },
      {
        itemName: "Bandage Gauze 4in x 4yd",
        sku: "78901",
        qty: 30,
        unit: "Roll",
        unitPrice: 35.0,
      },
      {
        itemName: "Betadine Solution 100mL",
        sku: "45689",
        qty: 15,
        unit: "Bot",
        unitPrice: 78.25,
      },
    ],
    timeline: [
      { action: "PO Created", user: "Admin", time: "03/05/2026 09:00 AM" },
      {
        action: "Submitted",
        user: "Admin",
        time: "03/05/2026 09:30 AM",
        note: "Awaiting manager approval",
      },
    ],
  },
  "PO-2026-010": {
    id: "PO-2026-010",
    date: "03/17/2026",
    expectedDate: "03/28/2026",
    refDoc: "REF-2026-010",
    supplier: "United Lab Inc.",
    supplierContact: "supply@unilab.com.ph | +63 2 8888-0010",
    deliverTo: "BMC MAIN",
    payTerm: "7 Days",
    status: "Partial",
    remarks: "Second batch expected by end of month.",
    items: [
      {
        itemName: "Biogesic 500MG Tab",
        sku: "78432",
        qty: 200,
        unit: "Tab",
        unitPrice: 9.25,
        received: 100,
      },
      {
        itemName: "Neozep Forte Tab",
        sku: "34567",
        qty: 150,
        unit: "Tab",
        unitPrice: 8.75,
        received: 150,
      },
      {
        itemName: "Decolgen Tab",
        sku: "89012",
        qty: 100,
        unit: "Tab",
        unitPrice: 12.0,
        received: 50,
      },
      {
        itemName: "Cougmax 100mL Syrup",
        sku: "23456",
        qty: 80,
        unit: "Bot",
        unitPrice: 55.0,
        received: 0,
      },
      {
        itemName: "Paracetamol 500MG Tab",
        sku: "101674",
        qty: 300,
        unit: "Tab",
        unitPrice: 8.5,
        received: 200,
      },
      {
        itemName: "Amoxicillin 500MG Cap",
        sku: "56712",
        qty: 100,
        unit: "Cap",
        unitPrice: 12.75,
        received: 100,
      },
      {
        itemName: "Ibuprofen 400MG Tab",
        sku: "01234",
        qty: 120,
        unit: "Tab",
        unitPrice: 11.25,
        received: 120,
      },
      {
        itemName: "Betadine Solution 100mL",
        sku: "45689",
        qty: 30,
        unit: "Bot",
        unitPrice: 78.25,
        received: 30,
      },
      {
        itemName: "Face Mask 3-ply 50pcs",
        sku: "12345",
        qty: 20,
        unit: "Box",
        unitPrice: 75.0,
        received: 20,
      },
    ],
    timeline: [
      { action: "PO Created", user: "Admin", time: "03/17/2026 08:00 AM" },
      { action: "Submitted", user: "Admin", time: "03/17/2026 08:20 AM" },
      { action: "Approved", user: "Manager", time: "03/17/2026 10:00 AM" },
      {
        action: "Partial Delivery",
        user: "Admin",
        time: "03/20/2026 02:15 PM",
        note: "Items 1,3,5 partially delivered. Remaining items expected 03/28.",
      },
    ],
  },
};

// Fallback PO for unknown IDs
const FALLBACK_PO: PORecord = PO_DATABASE["PO-2026-001"];

const STATUS_STYLES: Record<POStatus, { bg: string; color: string }> = {
  Draft: { bg: "#e6e6e6", color: "#707070" },
  Pending: { bg: "rgba(255,209,80,0.28)", color: "#c89400" },
  Approved: { bg: "rgba(21,54,239,0.12)", color: "#1536ef" },
  Partial: { bg: "rgba(255,140,0,0.18)", color: "#c86a00" },
  Delivered: { bg: "rgba(12,134,40,0.14)", color: "#0c8628" },
  Cancelled: { bg: "rgba(241,0,0,0.12)", color: "#d40000" },
};

// --- Helpers -----------------------------------------------------------------

function fmtMoney(n: number) {
  return n.toLocaleString("en-PH", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function StatusBadge({ status, large }: { status: POStatus; large?: boolean }) {
  const s = STATUS_STYLES[status];
  return (
    <span
      className="inline-flex items-center px-3 rounded-full font-bold"
      style={{
        background: s.bg,
        color: s.color,
        fontSize: large ? "13px" : "12px",
        paddingTop: large ? "5px" : "2px",
        paddingBottom: large ? "5px" : "2px",
      }}
    >
      {status}
    </span>
  );
}

function InfoCard({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div
      className="flex items-start gap-3 px-4 py-3 rounded-xl"
      style={{ background: "#f8faff", border: "1px solid #e1e7f5" }}
    >
      <div
        className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 mt-0.5"
        style={{ background: "#e1e7f5" }}
      >
        {icon}
      </div>
      <div className="flex flex-col">
        <span className="text-xs font-semibold" style={{ color: "#9aabbf" }}>
          {label}
        </span>
        <span className="text-sm font-bold" style={{ color: "#001d63" }}>
          {value}
        </span>
      </div>
    </div>
  );
}

// --- Main Page ---------------------------------------------------------------

export default function AdminPurchaseOrderDetailPage() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [currentTime, setCurrentTime] = useState(new Date());
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showApproveMsg, setShowApproveMsg] = useState(false);
  const [showRejectMsg, setShowRejectMsg] = useState(false);

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

  const po = id && PO_DATABASE[id] ? PO_DATABASE[id] : FALLBACK_PO;

  const subtotal = po.items.reduce((s, l) => s + l.qty * l.unitPrice, 0);
  const tax = subtotal * 0.12;
  const total = subtotal + tax;

  const receivedQty = po.items.reduce((s, l) => s + (l.received ?? 0), 0);
  const totalQty = po.items.reduce((s, l) => s + l.qty, 0);

  const timelineColors: Record<string, string> = {
    "PO Created": "#9aabbf",
    Submitted: "#c89400",
    Approved: "#1536ef",
    "Sent to Supplier": "#0c8628",
    "Partial Delivery": "#c86a00",
    Delivered: "#0c8628",
    Rejected: "#d40000",
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
        activeItem="PO List"
        onNavigate={() => {}}
      />

      <div className="max-w-7xl mx-auto px-4 py-6 flex flex-col gap-5">
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
            {/* Breadcrumb + back */}
            <div className="flex items-center gap-2 mb-3">
              <button
                onClick={() => navigate("/admin/purchase-orders")}
                className="flex items-center gap-1 text-xs font-semibold hover:opacity-70 transition-opacity"
                style={{
                  color: "#5a7ab5",
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                }}
              >
                <ArrowLeft size={13} />
                Back
              </button>
              <ChevronRight size={13} style={{ color: "#5a7ab5" }} />
              <span
                className="text-xs font-semibold"
                style={{ color: "#5a7ab5" }}
              >
                Ordering and Deliveries
              </span>
              <ChevronRight size={13} style={{ color: "#5a7ab5" }} />
              <span
                className="text-xs font-semibold cursor-pointer hover:opacity-70"
                style={{ color: "#5a7ab5" }}
                onClick={() => navigate("/admin/purchase-orders")}
              >
                Purchase Orders
              </span>
              <ChevronRight size={13} style={{ color: "#5a7ab5" }} />
              <span
                className="text-xs font-semibold"
                style={{ color: "#062d8c" }}
              >
                {po.id}
              </span>
            </div>

            {/* Title + Actions */}
            <div className="flex items-center justify-between flex-wrap gap-3">
              <div className="flex items-center gap-3 flex-wrap">
                <h1
                  className="font-extrabold"
                  style={{ color: "#062d8c", fontSize: "22px" }}
                >
                  {po.id}
                </h1>
                <StatusBadge status={po.status} large />
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                {/* Print */}
                <button
                  className="flex items-center gap-1.5 h-9 px-4 rounded-xl text-xs font-bold hover:opacity-80 transition-opacity"
                  style={{
                    background: "#e1e7f5",
                    color: "#062d8c",
                    border: "1px solid #c5d2e8",
                  }}
                >
                  <Printer size={13} />
                  Print
                </button>
                {/* Edit (draft/pending only) */}
                {(po.status === "Draft" || po.status === "Pending") && (
                  <button
                    onClick={() => navigate("/admin/purchase-order")}
                    className="flex items-center gap-1.5 h-9 px-4 rounded-xl text-xs font-bold hover:opacity-80 transition-opacity"
                    style={{
                      background: "rgba(255,209,80,0.25)",
                      color: "#c89400",
                      border: "1px solid rgba(200,148,0,0.3)",
                    }}
                  >
                    <Edit2 size={13} />
                    Edit PO
                  </button>
                )}
                {/* Receive Delivery (approved/partial) */}
                {(po.status === "Approved" || po.status === "Partial") && (
                  <button
                    onClick={() => navigate("/admin/receive-delivery")}
                    className="flex items-center gap-1.5 h-9 px-4 rounded-xl text-xs font-bold text-white hover:opacity-90 transition-opacity"
                    style={{
                      background: "#0c8628",
                      boxShadow: "0 4px 12px rgba(12,134,40,0.25)",
                    }}
                  >
                    <Truck size={13} />
                    Receive Delivery
                  </button>
                )}
                {/* Approve (pending only) */}
                {po.status === "Pending" && (
                  <>
                    <button
                      onClick={() => {
                        setShowRejectMsg(true);
                        setTimeout(() => setShowRejectMsg(false), 2500);
                      }}
                      className="flex items-center gap-1.5 h-9 px-4 rounded-xl text-xs font-bold hover:opacity-80 transition-opacity"
                      style={{
                        background: "rgba(241,0,0,0.1)",
                        color: "#d40000",
                        border: "1px solid rgba(212,0,0,0.2)",
                      }}
                    >
                      <XCircle size={13} />
                      Reject
                    </button>
                    <button
                      onClick={() => {
                        setShowApproveMsg(true);
                        setTimeout(() => setShowApproveMsg(false), 2500);
                      }}
                      className="flex items-center gap-1.5 h-9 px-4 rounded-xl text-xs font-bold text-white hover:opacity-90 transition-opacity"
                      style={{
                        background: "#1536ef",
                        boxShadow: "0 4px 12px rgba(21,54,239,0.3)",
                      }}
                    >
                      <CheckCircle size={13} />
                      Approve
                    </button>
                  </>
                )}
              </div>
            </div>

            {/* Feedback messages */}
            {showApproveMsg && (
              <div
                className="mt-3 px-4 py-2 rounded-xl text-sm font-semibold flex items-center gap-2"
                style={{
                  background: "rgba(21,54,239,0.1)",
                  color: "#1536ef",
                  border: "1px solid rgba(21,54,239,0.2)",
                }}
              >
                <CheckCircle size={14} /> Purchase Order approved successfully.
              </div>
            )}
            {showRejectMsg && (
              <div
                className="mt-3 px-4 py-2 rounded-xl text-sm font-semibold flex items-center gap-2"
                style={{
                  background: "rgba(241,0,0,0.08)",
                  color: "#d40000",
                  border: "1px solid rgba(212,0,0,0.2)",
                }}
              >
                <XCircle size={14} /> Purchase Order rejected.
              </div>
            )}
          </div>

          {/* Divider */}
          <div
            className="mx-7"
            style={{ borderTop: "1px solid rgba(47,47,47,0.12)" }}
          />

          <div className="px-7 pt-5 flex flex-col gap-5">
            {/* Info Cards Row */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
              <InfoCard
                icon={<Calendar size={15} style={{ color: "#1536ef" }} />}
                label="PO Date"
                value={po.date}
              />
              <InfoCard
                icon={<Clock size={15} style={{ color: "#c89400" }} />}
                label="Expected Delivery"
                value={po.expectedDate}
              />
              <InfoCard
                icon={<User size={15} style={{ color: "#0c8628" }} />}
                label="Supplier"
                value={
                  po.supplier.length > 22
                    ? po.supplier.slice(0, 20) + "..."
                    : po.supplier
                }
              />
              <InfoCard
                icon={<MapPin size={15} style={{ color: "#c86a00" }} />}
                label="Deliver To"
                value={po.deliverTo}
              />
              <InfoCard
                icon={<CreditCard size={15} style={{ color: "#9a5ff0" }} />}
                label="Pay Term"
                value={po.payTerm}
              />
            </div>

            {/* Two-column: Document + Supplier */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
              {/* Document Details */}
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
                    Document Details
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  {[
                    { label: "PO Number", value: po.id },
                    { label: "Ref Doc #", value: po.refDoc },
                    { label: "PO Date", value: po.date },
                    { label: "Exp. Date", value: po.expectedDate },
                  ].map(({ label, value }) => (
                    <div key={label} className="flex flex-col gap-0.5">
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
                {/* Attached docs */}
                <div className="flex flex-col gap-2">
                  <span
                    className="text-xs font-semibold"
                    style={{ color: "#9aabbf" }}
                  >
                    Attached Documents
                  </span>
                  <div className="flex flex-wrap gap-2">
                    {["PO-sample-ref.pdf", "Quotation.docx"].map((f) => (
                      <div
                        key={f}
                        className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg cursor-pointer hover:opacity-80 transition-opacity"
                        style={{
                          background: "#e1e7f5",
                          border: "1px solid #c5d2e8",
                        }}
                      >
                        <Paperclip size={11} style={{ color: "#062d8c" }} />
                        <span
                          className="text-xs font-semibold"
                          style={{ color: "#062d8c" }}
                        >
                          {f}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
                {/* Remarks */}
                {po.remarks && (
                  <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-1.5">
                      <MessageSquare size={12} style={{ color: "#9aabbf" }} />
                      <span
                        className="text-xs font-semibold"
                        style={{ color: "#9aabbf" }}
                      >
                        Remarks
                      </span>
                    </div>
                    <p
                      className="text-sm px-3 py-2 rounded-lg"
                      style={{
                        background: "#f8faff",
                        color: "#001d63",
                        border: "1px solid #e1e7f5",
                      }}
                    >
                      {po.remarks}
                    </p>
                  </div>
                )}
              </div>

              {/* Supplier + Timeline */}
              <div className="flex flex-col gap-5">
                {/* Supplier Info */}
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
                    <User size={14} style={{ color: "#062d8c" }} />
                    <span
                      className="font-bold"
                      style={{ color: "#062d8c", fontSize: "14px" }}
                    >
                      Supplier Information
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div
                      className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0"
                      style={{ background: "#062d8c" }}
                    >
                      <span
                        className="font-extrabold text-white"
                        style={{ fontSize: "18px" }}
                      >
                        {po.supplier.charAt(0)}
                      </span>
                    </div>
                    <div className="flex flex-col gap-0.5">
                      <span className="font-bold" style={{ color: "#001d63" }}>
                        {po.supplier}
                      </span>
                      <span className="text-xs" style={{ color: "#9aabbf" }}>
                        {po.supplierContact}
                      </span>
                      <span
                        className="text-xs font-semibold px-2 py-0.5 rounded-full mt-1 inline-block"
                        style={{
                          background: "rgba(12,134,40,0.12)",
                          color: "#0c8628",
                        }}
                      >
                        Verified Supplier
                      </span>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    {[
                      { label: "Deliver To", value: po.deliverTo },
                      { label: "Pay Term", value: po.payTerm },
                    ].map(({ label, value }) => (
                      <div
                        key={label}
                        className="flex flex-col gap-0.5 px-3 py-2 rounded-lg"
                        style={{ background: "#f8faff" }}
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
                </div>

                {/* Order Timeline */}
                <div
                  className="rounded-xl p-5 flex flex-col gap-4 flex-1"
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
                    <Clock size={14} style={{ color: "#062d8c" }} />
                    <span
                      className="font-bold"
                      style={{ color: "#062d8c", fontSize: "14px" }}
                    >
                      Order Timeline
                    </span>
                  </div>
                  <div className="flex flex-col gap-0">
                    {po.timeline.map((event, idx) => {
                      const color = timelineColors[event.action] ?? "#9aabbf";
                      const isLast = idx === po.timeline.length - 1;
                      return (
                        <div key={idx} className="flex gap-3">
                          {/* Dot + line */}
                          <div className="flex flex-col items-center">
                            <div
                              className="w-3 h-3 rounded-full shrink-0 mt-1"
                              style={{
                                background: color,
                                boxShadow: `0 0 6px ${color}60`,
                              }}
                            />
                            {!isLast && (
                              <div
                                className="w-px flex-1 mt-1 mb-1"
                                style={{
                                  background: "#e1e7f5",
                                  minHeight: "20px",
                                }}
                              />
                            )}
                          </div>
                          {/* Content */}
                          <div
                            className={`flex flex-col gap-0.5 ${isLast ? "" : "pb-3"}`}
                          >
                            <span
                              className="text-sm font-bold"
                              style={{ color: "#001d63" }}
                            >
                              {event.action}
                            </span>
                            <span
                              className="text-xs"
                              style={{ color: "#9aabbf" }}
                            >
                              {event.user} &middot; {event.time}
                            </span>
                            {event.note && (
                              <span
                                className="text-xs mt-0.5"
                                style={{ color: "#707070" }}
                              >
                                {event.note}
                              </span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>

            {/* Items Table */}
            <div
              className="rounded-xl overflow-hidden"
              style={{
                background: "#fff",
                border: "1px solid rgba(47,47,47,0.1)",
                boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
              }}
            >
              {/* Header */}
              <div
                className="px-5 py-4 flex items-center justify-between"
                style={{ borderBottom: "1.5px solid #e1e7f5" }}
              >
                <div className="flex items-center gap-2">
                  <Package size={15} style={{ color: "#062d8c" }} />
                  <span
                    className="font-bold"
                    style={{ color: "#062d8c", fontSize: "14px" }}
                  >
                    Order Items
                  </span>
                  <span
                    className="px-2 py-0.5 rounded-full text-xs font-bold"
                    style={{ background: "#e1e7f5", color: "#062d8c" }}
                  >
                    {po.items.length} items
                  </span>
                </div>
                {/* Receipt progress for partial */}
                {(po.status === "Partial" || po.status === "Delivered") && (
                  <div className="flex items-center gap-2">
                    <span
                      className="text-xs font-semibold"
                      style={{ color: "#9aabbf" }}
                    >
                      Received: {receivedQty} / {totalQty} units
                    </span>
                    <div
                      className="w-28 h-2 rounded-full"
                      style={{ background: "#e1e7f5" }}
                    >
                      <div
                        className="h-2 rounded-full"
                        style={{
                          width: `${Math.min((receivedQty / totalQty) * 100, 100)}%`,
                          background:
                            po.status === "Delivered" ? "#0c8628" : "#c86a00",
                        }}
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Table */}
              <div className="overflow-x-auto">
                <table
                  className="w-full text-sm border-collapse"
                  style={{ minWidth: "700px" }}
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
                        "Qty Ordered",
                        ...(po.status !== "Draft" && po.status !== "Pending"
                          ? ["Qty Received"]
                          : []),
                        "Unit Price (PHP)",
                        "Amount (PHP)",
                      ].map((h, i) => (
                        <th
                          key={i}
                          className={`px-3 py-2.5 font-semibold whitespace-nowrap ${i >= 4 ? "text-right" : "text-left"}`}
                          style={{ color: "#001d63", fontSize: "13px" }}
                        >
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {po.items.map((item, idx) => {
                      const amount = item.qty * item.unitPrice;
                      const showRecv =
                        po.status !== "Draft" && po.status !== "Pending";
                      const recvPct =
                        showRecv && item.received !== undefined
                          ? item.received / item.qty
                          : 0;
                      return (
                        <tr
                          key={idx}
                          style={{
                            background: idx % 2 === 0 ? "#f5f4f4" : "#e6e6e6",
                          }}
                        >
                          <td
                            className="px-3 py-2.5 w-8 text-center"
                            style={{ color: "#9aabbf", fontSize: "12px" }}
                          >
                            {idx + 1}
                          </td>
                          <td
                            className="px-3 py-2.5"
                            style={{ color: "#001d63", fontSize: "13px" }}
                          >
                            {item.itemName}
                          </td>
                          <td
                            className="px-3 py-2.5"
                            style={{ color: "#707070", fontSize: "12px" }}
                          >
                            {item.sku}
                          </td>
                          <td
                            className="px-3 py-2.5"
                            style={{ color: "#001d63", fontSize: "13px" }}
                          >
                            {item.unit}
                          </td>
                          <td
                            className="px-3 py-2.5 text-right font-semibold"
                            style={{ color: "#001d63", fontSize: "13px" }}
                          >
                            {item.qty}
                          </td>
                          {showRecv && (
                            <td className="px-3 py-2.5 text-right">
                              <div className="flex items-center justify-end gap-2">
                                <span
                                  className="font-semibold"
                                  style={{
                                    color:
                                      item.received === item.qty
                                        ? "#0c8628"
                                        : item.received === 0
                                          ? "#d40000"
                                          : "#c86a00",
                                    fontSize: "13px",
                                  }}
                                >
                                  {item.received ?? 0}
                                </span>
                                <div
                                  className="w-14 h-1.5 rounded-full"
                                  style={{ background: "#e1e7f5" }}
                                >
                                  <div
                                    className="h-1.5 rounded-full"
                                    style={{
                                      width: `${recvPct * 100}%`,
                                      background:
                                        recvPct >= 1
                                          ? "#0c8628"
                                          : recvPct === 0
                                            ? "#d40000"
                                            : "#c86a00",
                                    }}
                                  />
                                </div>
                              </div>
                            </td>
                          )}
                          <td
                            className="px-3 py-2.5 text-right"
                            style={{ color: "#001d63", fontSize: "13px" }}
                          >
                            {fmtMoney(item.unitPrice)}
                          </td>
                          <td
                            className="px-3 py-2.5 text-right font-semibold"
                            style={{ color: "#001d63", fontSize: "13px" }}
                          >
                            {fmtMoney(amount)}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Totals */}
              <div
                className="flex justify-end px-5 py-4"
                style={{ borderTop: "1.5px solid #e1e7f5" }}
              >
                <div
                  className="flex flex-col gap-1.5"
                  style={{ minWidth: "240px" }}
                >
                  <div className="flex justify-between gap-8">
                    <span className="text-sm" style={{ color: "#707070" }}>
                      Subtotal
                    </span>
                    <span
                      className="text-sm font-semibold"
                      style={{ color: "#001d63" }}
                    >
                      PHP {fmtMoney(subtotal)}
                    </span>
                  </div>
                  <div className="flex justify-between gap-8">
                    <span className="text-sm" style={{ color: "#707070" }}>
                      VAT (12%)
                    </span>
                    <span
                      className="text-sm font-semibold"
                      style={{ color: "#001d63" }}
                    >
                      PHP {fmtMoney(tax)}
                    </span>
                  </div>
                  <div
                    className="my-1"
                    style={{ borderTop: "1.5px solid #e1e7f5" }}
                  />
                  <div className="flex justify-between gap-8">
                    <span
                      className="font-bold"
                      style={{ color: "#062d8c", fontSize: "14px" }}
                    >
                      Total
                    </span>
                    <span
                      className="font-extrabold"
                      style={{ color: "#062d8c", fontSize: "16px" }}
                    >
                      PHP {fmtMoney(total)}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Footer Row */}
            <div className="flex items-center justify-between flex-wrap gap-3 pt-1">
              <p className="text-xs" style={{ color: "#9aabbf" }}>
                {po.items.length} items &middot; Pay term: {po.payTerm} &middot;
                Ref: {po.refDoc}
              </p>
              <button
                onClick={() => navigate("/admin/purchase-orders")}
                className="h-10 px-5 rounded-xl text-sm font-bold hover:opacity-80 transition-opacity"
                style={{
                  background: "#e1e7f5",
                  color: "#062d8c",
                  border: "1px solid #c5d2e8",
                }}
              >
                Back to List
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

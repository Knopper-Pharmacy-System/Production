import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Building2,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  MapPin,
  RefreshCw,
  Search,
  ShieldCheck,
  TriangleAlert,
  Users,
} from "lucide-react";
import AdminSidebar from "../../components/admin/AdminSidebar";
import AdminHeader from "../../components/admin/AdminHeader";
import AdminFooter from "../../components/admin/AdminFooter";
import { getToken } from "../../hooks/useAuth";

type BranchStatus = "Healthy" | "Needs Attention" | "Setup Needed";

type ApiBranchInfo = {
  branch_id: number;
  branch_name: string;
  branch_code: string;
};

type ApiInventoryItem = {
  inventory_id: number;
  quantity_on_hand: number;
  price?: number;
};

type ApiUserRecord = {
  user_id: number;
  username: string;
  full_name: string;
  role: string;
  branch: string;
  status: string;
};

type BranchRow = {
  id: number;
  name: string;
  code: string;
  address: string;
  city: string;
  status: BranchStatus;
  userCount: number;
  activeUsers: number;
  managerCount: number;
  inventoryItems: number;
  totalUnits: number;
  lowStockCount: number;
  criticalCount: number;
  inventoryValue: number;
};

const PROD_API_BASE_URL = "https://web-production-2c7737.up.railway.app";
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || PROD_API_BASE_URL;
const BRANCH_SCAN_LIMIT = 30;
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

const BRANCH_METADATA: Record<number, { address: string; city: string }> = {
  1: {
    address: "#6A J. Miranda Ave., Concepcion Pequeña",
    city: "Naga City",
  },
  2: {
    address: "Roxas Avenue, Diversion Road, Triangulo",
    city: "Naga City",
  },
  3: {
    address: "Door 11 & 12, Pavilion 7, Panganiban Drive",
    city: "Naga City",
  },
};

const ROLE_IS_MANAGER = (role: string) => {
  const normalized = role.trim().toLowerCase();
  return normalized === "admin" || normalized === "manager";
};

const USER_IS_ACTIVE = (status: string) => status.trim().toLowerCase() === "active";

const peso = (value: number) =>
  `₱${value.toLocaleString(undefined, { maximumFractionDigits: 0 })}`;

function StatusBadge({ status }: { status: BranchStatus }) {
  const styles: Record<BranchStatus, { bg: string; color: string }> = {
    Healthy: { bg: "rgba(0,191,44,0.15)", color: "#00a83d" },
    "Needs Attention": { bg: "rgba(243,191,44,0.2)", color: "#c89400" },
    "Setup Needed": { bg: "rgba(160,160,160,0.16)", color: "#707070" },
  };

  return (
    <span
      className="inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold"
      style={{ background: styles[status].bg, color: styles[status].color }}
    >
      {status}
    </span>
  );
}

export default function AdminBranchesPage() {
  const navigate = useNavigate();
  const [currentTime, setCurrentTime] = useState(new Date());
  const [lastSync, setLastSync] = useState(new Date());
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [refreshVersion, setRefreshVersion] = useState(0);

  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"All" | BranchStatus>("All");
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedBranchId, setSelectedBranchId] = useState<number | null>(null);

  const [branches, setBranches] = useState<BranchRow[]>([]);
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
    const loadBranches = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const token = getToken();
        if (!token) {
          setError("No auth token found. Please log in again.");
          setBranches([]);
          return;
        }

        const headers = { Authorization: `Bearer ${token}` };

        const [usersResponse, discoveredBranches] = await Promise.all([
          fetch(`${API_BASE_URL}/users`, { headers }),
          Promise.all(
            Array.from({ length: BRANCH_SCAN_LIMIT }, (_, index) => index + 1).map(
              async (branchId) => {
                try {
                  const response = await fetch(`${API_BASE_URL}/branch/${branchId}`, {
                    headers,
                  });
                  if (!response.ok) return null;
                  const payload = (await response.json()) as ApiBranchInfo;
                  return payload;
                } catch {
                  return null;
                }
              },
            ),
          ),
        ]);

        const usersData = usersResponse.ok
          ? ((await usersResponse.json()) as ApiUserRecord[])
          : [];

        const validBranches = discoveredBranches.filter(
          (branch): branch is ApiBranchInfo => branch !== null,
        );

        if (validBranches.length === 0) {
          setBranches([]);
          setError("No branches were discovered from the current API.");
          return;
        }

        const usersByBranch = new Map<
          string,
          { total: number; active: number; managers: number }
        >();

        usersData.forEach((user) => {
          const branchName = user.branch || "Unknown Branch";
          const current = usersByBranch.get(branchName) || {
            total: 0,
            active: 0,
            managers: 0,
          };
          current.total += 1;
          if (USER_IS_ACTIVE(user.status)) current.active += 1;
          if (ROLE_IS_MANAGER(user.role)) current.managers += 1;
          usersByBranch.set(branchName, current);
        });

        const inventoryRows = await Promise.all(
          validBranches.map(async (branch) => {
            try {
              const response = await fetch(
                `${API_BASE_URL}/inventory/branch/${branch.branch_id}`,
                { headers },
              );
              if (!response.ok) {
                return { branchId: branch.branch_id, items: [] as ApiInventoryItem[] };
              }
              const payload = (await response.json()) as ApiInventoryItem[];
              return {
                branchId: branch.branch_id,
                items: Array.isArray(payload) ? payload : [],
              };
            } catch {
              return { branchId: branch.branch_id, items: [] as ApiInventoryItem[] };
            }
          }),
        );

        const inventoryByBranch = new Map(
          inventoryRows.map((entry) => [entry.branchId, entry.items]),
        );

        const nextBranches = validBranches
          .map((branch) => {
            const inventoryItems = inventoryByBranch.get(branch.branch_id) || [];
            const userStats = usersByBranch.get(branch.branch_name) || {
              total: 0,
              active: 0,
              managers: 0,
            };

            const totalUnits = inventoryItems.reduce(
              (sum, item) => sum + Number(item.quantity_on_hand || 0),
              0,
            );
            const lowStockCount = inventoryItems.filter(
              (item) => Number(item.quantity_on_hand || 0) < 10,
            ).length;
            const criticalCount = inventoryItems.filter(
              (item) => Number(item.quantity_on_hand || 0) < 5,
            ).length;
            const inventoryValue = inventoryItems.reduce(
              (sum, item) =>
                sum + Number(item.quantity_on_hand || 0) * Number(item.price || 0),
              0,
            );

            let status: BranchStatus = "Healthy";
            if (inventoryItems.length === 0 && userStats.total === 0) {
              status = "Setup Needed";
            } else if (criticalCount > 0 || lowStockCount > 0) {
              status = "Needs Attention";
            }

            return {
              id: branch.branch_id,
              name: branch.branch_name,
              code: branch.branch_code || `BR-${String(branch.branch_id).padStart(3, "0")}`,
              address: BRANCH_METADATA[branch.branch_id]?.address || "Address not set",
              city: BRANCH_METADATA[branch.branch_id]?.city || "Unknown City",
              status,
              userCount: userStats.total,
              activeUsers: userStats.active,
              managerCount: userStats.managers,
              inventoryItems: inventoryItems.length,
              totalUnits,
              lowStockCount,
              criticalCount,
              inventoryValue,
            } satisfies BranchRow;
          })
          .sort((first, second) => first.name.localeCompare(second.name));

        setBranches(nextBranches);
        setSelectedBranchId((current) => current ?? nextBranches[0]?.id ?? null);
        setLastSync(new Date());
      } catch {
        setError("Network error while loading branches.");
        setBranches([]);
      } finally {
        setIsLoading(false);
      }
    };

    void loadBranches();
  }, [refreshVersion]);

  const filteredBranches = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    return branches.filter((branch) => {
      const matchesSearch =
        !query ||
        branch.name.toLowerCase().includes(query) ||
        branch.code.toLowerCase().includes(query) ||
        branch.city.toLowerCase().includes(query);
      const matchesStatus = statusFilter === "All" || branch.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [branches, searchQuery, statusFilter]);

  const totalPages = Math.max(1, Math.ceil(filteredBranches.length / ITEMS_PER_PAGE));
  const safePage = Math.min(currentPage, totalPages);
  const pageItems = filteredBranches.slice(
    (safePage - 1) * ITEMS_PER_PAGE,
    safePage * ITEMS_PER_PAGE,
  );

  const pageNumbers = Array.from({ length: Math.min(totalPages, 5) }, (_, index) => index + 1);

  const selectedBranch =
    branches.find((branch) => branch.id === selectedBranchId) || pageItems[0] || null;

  const healthyCount = branches.filter((branch) => branch.status === "Healthy").length;
  const attentionCount = branches.filter(
    (branch) => branch.status === "Needs Attention",
  ).length;
  const totalUsers = branches.reduce((sum, branch) => sum + branch.userCount, 0);
  const totalInventoryValue = branches.reduce(
    (sum, branch) => sum + branch.inventoryValue,
    0,
  );

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
        activeItem="Branches"
      />

      <div className="relative z-10 w-full max-w-[1800px] mx-auto px-4 sm:px-6 lg:px-8 xl:px-10 2xl:px-12 py-6 flex flex-col gap-5">
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
              Branch Network
            </p>
            <h2
              className="font-bold text-2xl tracking-wide mt-1"
              style={{ color: "rgba(245,249,255,0.96)" }}
            >
              Branches Overview
            </h2>
            <p className="text-sm mt-1" style={{ color: "rgba(218,232,255,0.74)" }}>
              Search, monitor, and drill into branch-level staffing and inventory health.
            </p>
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

        {error && (
          <div
            className="rounded-xl px-4 py-3 text-sm font-medium"
            style={{
              background: "rgba(255,255,255,0.14)",
              color: "#f4f7ff",
              border: "1px solid rgba(255,255,255,0.3)",
            }}
          >
            {error}
          </div>
        )}

        <div className="rounded-[28px] p-5 sm:p-6" style={PANEL_CARD_STYLE}>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-5">
            <div className="rounded-xl p-5" style={METRIC_CARD_STYLE}>
              <p className="text-base font-extrabold tracking-wide uppercase" style={{ color: "#062d8c" }}>
                Total Branches
              </p>
              <p className="mt-2 leading-none" style={{ color: "#062d8c", fontSize: "3rem", fontWeight: 800 }}>
                {branches.length}
              </p>
              <div className="mt-3 flex items-center gap-2 text-xs font-semibold text-slate-600">
                <Building2 size={14} /> Auto-discovered branches
              </div>
            </div>
            <div className="rounded-xl p-5" style={METRIC_CARD_STYLE}>
              <p className="text-base font-extrabold tracking-wide uppercase" style={{ color: "#062d8c" }}>
                Healthy
              </p>
              <p className="mt-2 leading-none" style={{ color: "#00a83d", fontSize: "3rem", fontWeight: 800 }}>
                {healthyCount}
              </p>
              <div className="mt-3 flex items-center gap-2 text-xs font-semibold text-slate-600">
                <ShieldCheck size={14} /> Stable branches
              </div>
            </div>
            <div className="rounded-xl p-5" style={METRIC_CARD_STYLE}>
              <p className="text-base font-extrabold tracking-wide uppercase" style={{ color: "#062d8c" }}>
                Attention
              </p>
              <p className="mt-2 leading-none" style={{ color: "#c89400", fontSize: "3rem", fontWeight: 800 }}>
                {attentionCount}
              </p>
              <div className="mt-3 flex items-center gap-2 text-xs font-semibold text-slate-600">
                <TriangleAlert size={14} /> Low or critical stock
              </div>
            </div>
            <div className="rounded-xl p-5" style={METRIC_CARD_STYLE}>
              <p className="text-base font-extrabold tracking-wide uppercase" style={{ color: "#062d8c" }}>
                Staff Count
              </p>
              <p className="mt-2 leading-none" style={{ color: "#1536ef", fontSize: "3rem", fontWeight: 800 }}>
                {totalUsers}
              </p>
              <div className="mt-3 flex items-center gap-2 text-xs font-semibold text-slate-600">
                <Users size={14} /> Users across branches
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-[1.6fr_0.9fr] gap-4">
            <div className="rounded-xl p-4" style={TABLE_CARD_STYLE}>
              <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                <div className="flex h-11 max-w-sm items-center gap-2 rounded-2xl px-4"
                  style={{
                    background:
                      "linear-gradient(180deg, rgba(255,255,255,0.96) 0%, rgba(242,246,255,0.94) 100%)",
                    border: "1px solid rgba(112,136,214,0.28)",
                  }}
                >
                  <Search size={14} className="text-[#707070]" />
                  <input
                    type="text"
                    placeholder="Search branch, code, city..."
                    value={searchQuery}
                    onChange={(event) => {
                      setSearchQuery(event.target.value);
                      setCurrentPage(1);
                    }}
                    className="flex-1 bg-transparent text-sm outline-none text-[#001d63]"
                  />
                </div>

                <div className="relative flex h-11 items-center gap-2 rounded-2xl px-4"
                  style={{
                    background:
                      "linear-gradient(180deg, rgba(255,255,255,0.96) 0%, rgba(242,246,255,0.94) 100%)",
                    border: "1px solid rgba(112,136,214,0.28)",
                  }}
                >
                  <span className="text-sm font-semibold text-[#103182]">{statusFilter}</span>
                  <ChevronDown size={16} className="text-[#103182]" />
                  <select
                    value={statusFilter}
                    onChange={(event) => {
                      setStatusFilter(event.target.value as typeof statusFilter);
                      setCurrentPage(1);
                    }}
                    className="absolute inset-0 cursor-pointer opacity-0"
                  >
                    <option value="All">All Statuses</option>
                    <option value="Healthy">Healthy</option>
                    <option value="Needs Attention">Needs Attention</option>
                    <option value="Setup Needed">Setup Needed</option>
                  </select>
                </div>
              </div>

              <div className="overflow-x-auto rounded-xl">
                <table className="w-full min-w-[920px] text-sm">
                  <thead>
                    <tr className="bg-[#e8eefb] text-[#062d8c] border-b border-[#dbe3f7]">
                      <th className="px-3 py-2.5 text-left text-xs font-bold">Branch</th>
                      <th className="px-3 py-2.5 text-left text-xs font-bold">Code</th>
                      <th className="px-3 py-2.5 text-left text-xs font-bold">City</th>
                      <th className="px-3 py-2.5 text-right text-xs font-bold">Users</th>
                      <th className="px-3 py-2.5 text-right text-xs font-bold">Items</th>
                      <th className="px-3 py-2.5 text-right text-xs font-bold">Units</th>
                      <th className="px-3 py-2.5 text-right text-xs font-bold">Low</th>
                      <th className="px-3 py-2.5 text-left text-xs font-bold">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {isLoading ? (
                      <tr>
                        <td colSpan={8} className="px-3 py-10 text-center text-slate-500">
                          Loading branches...
                        </td>
                      </tr>
                    ) : pageItems.length === 0 ? (
                      <tr>
                        <td colSpan={8} className="px-3 py-10 text-center text-slate-500">
                          No branches found.
                        </td>
                      </tr>
                    ) : (
                      pageItems.map((branch, index) => (
                        <tr
                          key={branch.id}
                          onClick={() => setSelectedBranchId(branch.id)}
                          className="cursor-pointer hover:brightness-95"
                          style={{
                            background: index % 2 === 0 ? "#f7f9ff" : "#edf2ff",
                          }}
                        >
                          <td className="px-3 py-2 text-[#001d63] font-semibold">{branch.name}</td>
                          <td className="px-3 py-2 text-[#001d63]">{branch.code}</td>
                          <td className="px-3 py-2 text-[#001d63]">{branch.city}</td>
                          <td className="px-3 py-2 text-right text-[#001d63]">{branch.userCount}</td>
                          <td className="px-3 py-2 text-right text-[#001d63]">{branch.inventoryItems}</td>
                          <td className="px-3 py-2 text-right text-[#001d63]">{branch.totalUnits.toLocaleString()}</td>
                          <td className="px-3 py-2 text-right text-[#001d63]">{branch.lowStockCount}</td>
                          <td className="px-3 py-2"><StatusBadge status={branch.status} /></td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
                <p className="text-sm text-slate-500">
                  Showing {pageItems.length} of {filteredBranches.length} branches
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

            <div className="rounded-xl p-4" style={TABLE_CARD_STYLE}>
              <p className="text-sm font-bold text-[#062d8c]">Branch Details</p>
              <p className="text-xs text-slate-500 mb-4">Click a branch row to inspect quick details.</p>

              {selectedBranch ? (
                <div className="space-y-3">
                  <div className="rounded-xl bg-[#eef3ff] px-4 py-3">
                    <p className="text-lg font-extrabold text-[#062d8c]">{selectedBranch.name}</p>
                    <p className="text-xs font-semibold text-slate-500">{selectedBranch.code}</p>
                    <div className="mt-2 flex items-start gap-2 text-sm text-[#001d63]">
                      <MapPin size={14} className="mt-0.5 shrink-0" />
                      <span>{selectedBranch.address}, {selectedBranch.city}</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div className="rounded-xl bg-[#f7f9ff] px-4 py-3">
                      <p className="text-xs text-slate-500">Active Users</p>
                      <p className="font-black text-[#1536ef] text-xl">{selectedBranch.activeUsers}</p>
                    </div>
                    <div className="rounded-xl bg-[#f7f9ff] px-4 py-3">
                      <p className="text-xs text-slate-500">Managers</p>
                      <p className="font-black text-[#1536ef] text-xl">{selectedBranch.managerCount}</p>
                    </div>
                    <div className="rounded-xl bg-[#f7f9ff] px-4 py-3">
                      <p className="text-xs text-slate-500">Critical Items</p>
                      <p className="font-black text-[#c62828] text-xl">{selectedBranch.criticalCount}</p>
                    </div>
                    <div className="rounded-xl bg-[#f7f9ff] px-4 py-3">
                      <p className="text-xs text-slate-500">Inventory Value</p>
                      <p className="font-black text-[#00a83d] text-xl">{peso(selectedBranch.inventoryValue)}</p>
                    </div>
                  </div>

                  <div className="rounded-xl bg-[#f7f9ff] px-4 py-3">
                    <p className="text-xs text-slate-500">Status</p>
                    <div className="mt-1"><StatusBadge status={selectedBranch.status} /></div>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => navigate(`/admin/inventory?branch=${selectedBranch.id}`)}
                      className="rounded-2xl px-4 py-3 text-sm font-bold text-white"
                      style={{ background: "linear-gradient(180deg, #2449ff 0%, #1133f2 100%)" }}
                    >
                      View Inventory
                    </button>
                    <button
                      type="button"
                      onClick={() => navigate("/admin/users")}
                      className="rounded-2xl px-4 py-3 text-sm font-bold text-[#062d8c]"
                      style={{ background: "#e9efff", border: "1px solid rgba(112,136,214,0.28)" }}
                    >
                      View Users
                    </button>
                    <button
                      type="button"
                      onClick={() => navigate("/admin/audit-sheet")}
                      className="rounded-2xl px-4 py-3 text-sm font-bold text-[#062d8c]"
                      style={{ background: "#e9efff", border: "1px solid rgba(112,136,214,0.28)" }}
                    >
                      Audit Sheet
                    </button>
                    <button
                      type="button"
                      onClick={() => navigate("/admin/sales-reports")}
                      className="rounded-2xl px-4 py-3 text-sm font-bold text-[#062d8c]"
                      style={{ background: "#e9efff", border: "1px solid rgba(112,136,214,0.28)" }}
                    >
                      Sales Report
                    </button>
                  </div>
                </div>
              ) : (
                <p className="text-sm text-slate-500">No branch selected.</p>
              )}
            </div>
          </div>

          <div className="mt-5 rounded-xl px-4 py-3" style={TABLE_CARD_STYLE}>
            <p className="text-xs font-bold uppercase tracking-wide text-slate-500">Network Inventory Value</p>
            <p className="text-2xl font-black text-[#062d8c] mt-1">{peso(totalInventoryValue)}</p>
          </div>
        </div>

        <AdminFooter lastSync={lastSync} />
      </div>
    </div>
  );
}

import { useState, useEffect } from "react";
import {
  Menu,
  Bell,
  Wifi,
  WifiOff,
  ChevronDown,
  Search,
  UserPlus,
  Users,
  UserCheck,
  ShieldCheck,
  UserCog,
  MoreVertical,
  Pencil,
  Trash2,
  CheckCircle2,
  XCircle,
} from "lucide-react";
import bannerLogo from "../assets/banner_logo.png";
import AdminSidebar from "../components/AdminSidebar";
import CreateUserModal from "../components/CreateUserModal";

// ─── Types ────────────────────────────────────────────────────────────────────

type Role = "Admin" | "Manager" | "Cashier";
type Status = "Active" | "Inactive";

interface UserRecord {
  id: number;
  name: string;
  email: string;
  role: Role;
  branch: string;
  status: Status;
  lastLogin: string;
}

// ─── Data ─────────────────────────────────────────────────────────────────────

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

const ROLE_OPTIONS: Array<"All" | Role> = [
  "All",
  "Admin",
  "Manager",
  "Cashier",
];
const STATUS_OPTIONS: Array<"All" | Status> = ["All", "Active", "Inactive"];

const INITIAL_USERS: UserRecord[] = [
  {
    id: 1,
    name: "Maria Santos",
    email: "m.santos@knopperrx.com",
    role: "Admin",
    branch: "BMC MAIN",
    status: "Active",
    lastLogin: "Mar 12, 2026 09:41 AM",
  },
  {
    id: 2,
    name: "Jose Reyes",
    email: "j.reyes@knopperrx.com",
    role: "Manager",
    branch: "DIVERSION BRANCH",
    status: "Active",
    lastLogin: "Mar 12, 2026 08:15 AM",
  },
  {
    id: 3,
    name: "Ana Cruz",
    email: "a.cruz@knopperrx.com",
    role: "Cashier",
    branch: "BMC MAIN",
    status: "Active",
    lastLogin: "Mar 11, 2026 05:52 PM",
  },
  {
    id: 4,
    name: "Carlo Mendoza",
    email: "c.mendoza@knopperrx.com",
    role: "Cashier",
    branch: "PANGANIBAN BRANCH",
    status: "Active",
    lastLogin: "Mar 11, 2026 06:30 PM",
  },
  {
    id: 5,
    name: "Liza Flores",
    email: "l.flores@knopperrx.com",
    role: "Manager",
    branch: "BMC MAIN",
    status: "Active",
    lastLogin: "Mar 10, 2026 02:00 PM",
  },
  {
    id: 6,
    name: "Ramon Dela Torre",
    email: "r.delatorre@knopperrx.com",
    role: "Cashier",
    branch: "DIVERSION BRANCH",
    status: "Inactive",
    lastLogin: "Feb 28, 2026 11:22 AM",
  },
  {
    id: 7,
    name: "Grace Villanueva",
    email: "g.villanueva@knopperrx.com",
    role: "Cashier",
    branch: "PANGANIBAN BRANCH",
    status: "Inactive",
    lastLogin: "Mar 01, 2026 09:00 AM",
  },
  {
    id: 8,
    name: "Marco Aquino",
    email: "m.aquino@knopperrx.com",
    role: "Admin",
    branch: "BMC MAIN",
    status: "Active",
    lastLogin: "Mar 12, 2026 07:58 AM",
  },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

const ROLE_COLORS: Record<Role, { bg: string; text: string }> = {
  Admin: { bg: "rgba(203,60,255,0.15)", text: "#cb3cff" },
  Manager: { bg: "rgba(0,59,205,0.13)", text: "#3b6eff" },
  Cashier: { bg: "rgba(0,191,44,0.13)", text: "#00bf2c" },
};

const STATUS_COLORS: Record<Status, { bg: string; text: string; dot: string }> =
  {
    Active: {
      bg: "rgba(0,191,44,0.12)",
      text: "#00bf2c",
      dot: "#00bf2c",
    },
    Inactive: {
      bg: "rgba(180,180,180,0.15)",
      text: "#888",
      dot: "#aaa",
    },
  };

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function UsersPage() {
  const [currentTime, setCurrentTime] = useState<Date>(new Date());
  const [selectedBranch, setSelectedBranch] = useState<string>("BMC MAIN");
  const [sidebarOpen, setSidebarOpen] = useState<boolean>(false);
  const [isOnline, setIsOnline] = useState<boolean>(navigator.onLine);

  const [search, setSearch] = useState<string>("");
  const [roleFilter, setRoleFilter] = useState<"All" | Role>("All");
  const [statusFilter, setStatusFilter] = useState<"All" | Status>("All");
  const [openMenuId, setOpenMenuId] = useState<number | null>(null);
  const [users, setUsers] = useState<UserRecord[]>(INITIAL_USERS);
  const [createModalOpen, setCreateModalOpen] = useState<boolean>(false);

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
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Close action menu when clicking outside
  useEffect(() => {
    const handleClick = () => setOpenMenuId(null);
    document.addEventListener("click", handleClick);
    return () => document.removeEventListener("click", handleClick);
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

  const branchAddress =
    BRANCHES.find((b) => b.value === selectedBranch)?.address ?? "";

  const filtered = users.filter((u) => {
    const matchSearch =
      u.name.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase());
    const matchRole = roleFilter === "All" || u.role === roleFilter;
    const matchStatus = statusFilter === "All" || u.status === statusFilter;
    return matchSearch && matchRole && matchStatus;
  });

  const totalUsers = users.length;
  const activeUsers = users.filter((u) => u.status === "Active").length;
  const adminCount = users.filter((u) => u.role === "Admin").length;
  const cashierCount = users.filter((u) => u.role === "Cashier").length;

  const handleToggleStatus = (id: number) => {
    setUsers((prev) =>
      prev.map((u) =>
        u.id === id
          ? { ...u, status: u.status === "Active" ? "Inactive" : "Active" }
          : u,
      ),
    );
    setOpenMenuId(null);
  };

  const handleDelete = (id: number) => {
    setUsers((prev) => prev.filter((u) => u.id !== id));
    setOpenMenuId(null);
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
        activeItem="Users"
      />

      <CreateUserModal
        isOpen={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
      />

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
              <div
                className="relative bg-[#f4f4f4] flex items-center gap-2 h-10 px-4 rounded-2xl cursor-pointer w-full max-w-xs transition-shadow"
                style={{ boxShadow: "0 0 40px rgba(3,31,99,0.25)" }}
              >
                <p className="font-semibold text-sm truncate flex-1 text-center text-[#103182]">
                  {selectedBranch}
                </p>
                <ChevronDown size={16} className="text-[#103182] shrink-0" />
                <select
                  value={selectedBranch}
                  onChange={(e) => setSelectedBranch(e.target.value)}
                  className="absolute inset-0 opacity-0 cursor-pointer"
                >
                  {BRANCHES.map((b) => (
                    <option key={b.value} value={b.value}>
                      {b.value}
                    </option>
                  ))}
                </select>
              </div>
              <h1
                className="font-bold text-2xl tracking-wide leading-none"
                style={{ color: "rgba(193,227,255,0.9)" }}
              >
                User Management
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
                className={`relative flex items-center gap-2 h-10 px-4 rounded-2xl ${
                  isOnline ? "bg-[#0c8628]" : "bg-[#cc5500]"
                }`}
              >
                <div className="absolute inset-0 border border-[#062d8c] pointer-events-none rounded-2xl shadow-[0_0_40px_rgba(3,31,99,0.1)]" />
                {isOnline ? (
                  <Wifi size={16} className="text-[#acf9be]" />
                ) : (
                  <WifiOff size={16} className="text-white" />
                )}
                <span className="text-sm font-semibold tracking-wider text-[#acf9be] whitespace-nowrap">
                  {isOnline ? "ONLINE" : "OFFLINE"}
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
          {/* Total Users */}
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
              style={{ background: "rgba(0,59,205,0.1)" }}
            >
              <Users size={18} style={{ color: "#003bcd" }} />
            </div>
            <p
              className="text-base font-extrabold tracking-wide uppercase"
              style={{ color: "#062d8c" }}
            >
              TOTAL USERS
            </p>
            <p
              className="text-xs font-semibold mt-0.5"
              style={{ color: "#636363" }}
            >
              All registered accounts
            </p>
            <p
              className="font-extrabold mt-2 leading-none"
              style={{ color: "#003bcd", fontSize: "3rem" }}
            >
              {totalUsers}
            </p>
            <div className="flex items-center gap-1 mt-3">
              <span style={{ color: "#636363", fontSize: "10px" }}>
                Across all branches
              </span>
            </div>
          </div>

          {/* Active Users */}
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
              <UserCheck size={18} style={{ color: "#00bf2c" }} />
            </div>
            <p
              className="text-base font-extrabold tracking-wide uppercase"
              style={{ color: "#062d8c" }}
            >
              ACTIVE
            </p>
            <p
              className="text-xs font-semibold mt-0.5"
              style={{ color: "#636363" }}
            >
              Currently active accounts
            </p>
            <p
              className="font-extrabold mt-2 leading-none"
              style={{ color: "#00bf2c", fontSize: "3rem" }}
            >
              {activeUsers}
            </p>
            <div className="flex items-center gap-1 mt-3">
              <span
                className="font-bold"
                style={{ color: "#00bf2c", fontSize: "10px" }}
              >
                {totalUsers - activeUsers} inactive
              </span>
            </div>
          </div>

          {/* Admins */}
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
              style={{ background: "rgba(203,60,255,0.1)" }}
            >
              <ShieldCheck size={18} style={{ color: "#cb3cff" }} />
            </div>
            <p
              className="text-base font-extrabold tracking-wide uppercase"
              style={{ color: "#062d8c" }}
            >
              ADMINS
            </p>
            <p
              className="text-xs font-semibold mt-0.5"
              style={{ color: "#636363" }}
            >
              Administrator accounts
            </p>
            <p
              className="font-extrabold mt-2 leading-none"
              style={{ color: "#cb3cff", fontSize: "3rem" }}
            >
              {adminCount}
            </p>
            <div className="flex items-center gap-1 mt-3">
              <span style={{ color: "#636363", fontSize: "10px" }}>
                Full system access
              </span>
            </div>
          </div>

          {/* Cashiers */}
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
              <UserCog size={18} style={{ color: "#b39331" }} />
            </div>
            <p
              className="text-base font-extrabold tracking-wide uppercase"
              style={{ color: "#062d8c" }}
            >
              CASHIERS
            </p>
            <p
              className="text-xs font-semibold mt-0.5"
              style={{ color: "#636363" }}
            >
              POS operator accounts
            </p>
            <p
              className="font-extrabold mt-2 leading-none"
              style={{ color: "#b39331", fontSize: "3rem" }}
            >
              {cashierCount}
            </p>
            <div className="flex items-center gap-1 mt-3">
              <span style={{ color: "#636363", fontSize: "10px" }}>
                POS access only
              </span>
            </div>
          </div>
        </div>

        {/* ── Users Table Card ──────────────────────────────────────────────── */}
        <div
          className="rounded-2xl p-6"
          style={{
            background: "#f0f0f0",
            border: "1px solid rgba(47,47,47,0.68)",
            boxShadow: "0 4px 4px rgba(0,0,0,0.5)",
          }}
        >
          {/* Table Header Row */}
          <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
            <h2 className="font-bold text-base" style={{ color: "#062d8c" }}>
              All Users
            </h2>

            <div className="flex flex-wrap items-center gap-2">
              {/* Search */}
              <div
                className="flex items-center gap-2 px-3 h-9 rounded-lg"
                style={{
                  background: "#fff",
                  border: "1px solid rgba(0,0,0,0.15)",
                }}
              >
                <Search size={14} style={{ color: "#888" }} />
                <input
                  type="text"
                  placeholder="Search name or email..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="text-sm outline-none bg-transparent"
                  style={{ color: "#333", width: "180px" }}
                />
              </div>

              {/* Role Filter */}
              <select
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value as "All" | Role)}
                className="h-9 px-3 rounded-lg text-sm font-semibold outline-none cursor-pointer"
                style={{
                  background: "#fff",
                  border: "1px solid rgba(0,0,0,0.15)",
                  color: "#062d8c",
                }}
              >
                {ROLE_OPTIONS.map((r) => (
                  <option key={r} value={r}>
                    {r === "All" ? "All Roles" : r}
                  </option>
                ))}
              </select>

              {/* Status Filter */}
              <select
                value={statusFilter}
                onChange={(e) =>
                  setStatusFilter(e.target.value as "All" | Status)
                }
                className="h-9 px-3 rounded-lg text-sm font-semibold outline-none cursor-pointer"
                style={{
                  background: "#fff",
                  border: "1px solid rgba(0,0,0,0.15)",
                  color: "#062d8c",
                }}
              >
                {STATUS_OPTIONS.map((s) => (
                  <option key={s} value={s}>
                    {s === "All" ? "All Status" : s}
                  </option>
                ))}
              </select>

              {/* Add User */}
              <button
                onClick={() => setCreateModalOpen(true)}
                className="flex items-center gap-2 h-9 px-4 rounded-lg text-sm font-bold transition-opacity hover:opacity-90"
                style={{
                  background: "#1133f2",
                  color: "#fff",
                  border: "none",
                  cursor: "pointer",
                }}
              >
                <UserPlus size={15} />
                Add User
              </button>
            </div>
          </div>

          {/* Table */}
          <div
            className="overflow-x-auto rounded-xl"
            style={{ border: "1px solid rgba(0,0,0,0.1)" }}
          >
            <table
              className="w-full text-sm"
              style={{ borderCollapse: "collapse" }}
            >
              <thead>
                <tr style={{ background: "#062d8c" }}>
                  {["Name", "Role", "Branch", "Status", "Last Login", ""].map(
                    (col) => (
                      <th
                        key={col}
                        className="text-left px-4 py-3 font-semibold text-xs tracking-wider uppercase whitespace-nowrap"
                        style={{ color: "rgba(193,227,255,0.85)" }}
                      >
                        {col}
                      </th>
                    ),
                  )}
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr>
                    <td
                      colSpan={6}
                      className="text-center py-10 text-sm"
                      style={{ color: "#999", background: "#fff" }}
                    >
                      No users found.
                    </td>
                  </tr>
                ) : (
                  filtered.map((user, idx) => (
                    <tr
                      key={user.id}
                      style={{
                        background: idx % 2 === 0 ? "#fff" : "#f7f7fb",
                        borderBottom: "1px solid rgba(0,0,0,0.06)",
                      }}
                    >
                      {/* Name + Email */}
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div
                            className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0"
                            style={{
                              background: ROLE_COLORS[user.role].bg,
                              color: ROLE_COLORS[user.role].text,
                            }}
                          >
                            {user.name
                              .split(" ")
                              .map((n) => n[0])
                              .slice(0, 2)
                              .join("")}
                          </div>
                          <div>
                            <p
                              className="font-semibold"
                              style={{ color: "#1a1a2e" }}
                            >
                              {user.name}
                            </p>
                            <p
                              className="text-xs mt-0.5"
                              style={{ color: "#888" }}
                            >
                              {user.email}
                            </p>
                          </div>
                        </div>
                      </td>

                      {/* Role */}
                      <td className="px-4 py-3">
                        <span
                          className="px-2.5 py-1 rounded-full text-xs font-bold"
                          style={{
                            background: ROLE_COLORS[user.role].bg,
                            color: ROLE_COLORS[user.role].text,
                          }}
                        >
                          {user.role}
                        </span>
                      </td>

                      {/* Branch */}
                      <td
                        className="px-4 py-3 text-xs font-medium whitespace-nowrap"
                        style={{ color: "#444" }}
                      >
                        {user.branch}
                      </td>

                      {/* Status */}
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1.5">
                          <div
                            className="w-1.5 h-1.5 rounded-full"
                            style={{
                              background: STATUS_COLORS[user.status].dot,
                            }}
                          />
                          <span
                            className="px-2.5 py-1 rounded-full text-xs font-bold"
                            style={{
                              background: STATUS_COLORS[user.status].bg,
                              color: STATUS_COLORS[user.status].text,
                            }}
                          >
                            {user.status}
                          </span>
                        </div>
                      </td>

                      {/* Last Login */}
                      <td
                        className="px-4 py-3 text-xs whitespace-nowrap"
                        style={{ color: "#666" }}
                      >
                        {user.lastLogin}
                      </td>

                      {/* Actions */}
                      <td className="px-4 py-3 text-right">
                        <div className="relative inline-block">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setOpenMenuId(
                                openMenuId === user.id ? null : user.id,
                              );
                            }}
                            className="p-1.5 rounded-lg transition-colors"
                            style={{
                              background: "transparent",
                              border: "none",
                              cursor: "pointer",
                            }}
                            onMouseEnter={(e) => {
                              (
                                e.currentTarget as HTMLButtonElement
                              ).style.background = "rgba(0,0,0,0.07)";
                            }}
                            onMouseLeave={(e) => {
                              (
                                e.currentTarget as HTMLButtonElement
                              ).style.background = "transparent";
                            }}
                          >
                            <MoreVertical size={16} style={{ color: "#555" }} />
                          </button>

                          {openMenuId === user.id && (
                            <div
                              className="absolute right-0 top-8 z-10 rounded-xl overflow-hidden"
                              style={{
                                background: "#fff",
                                border: "1px solid rgba(0,0,0,0.12)",
                                boxShadow: "0 8px 24px rgba(0,0,0,0.15)",
                                minWidth: "160px",
                              }}
                              onClick={(e) => e.stopPropagation()}
                            >
                              <button
                                className="flex items-center gap-2 w-full px-4 py-2.5 text-sm font-medium transition-colors"
                                style={{
                                  background: "transparent",
                                  border: "none",
                                  cursor: "pointer",
                                  color: "#333",
                                }}
                                onMouseEnter={(e) => {
                                  (
                                    e.currentTarget as HTMLButtonElement
                                  ).style.background = "rgba(0,0,0,0.05)";
                                }}
                                onMouseLeave={(e) => {
                                  (
                                    e.currentTarget as HTMLButtonElement
                                  ).style.background = "transparent";
                                }}
                              >
                                <Pencil
                                  size={14}
                                  style={{ color: "#1133f2" }}
                                />
                                Edit User
                              </button>
                              <button
                                className="flex items-center gap-2 w-full px-4 py-2.5 text-sm font-medium transition-colors"
                                style={{
                                  background: "transparent",
                                  border: "none",
                                  cursor: "pointer",
                                  color: "#333",
                                }}
                                onClick={() => handleToggleStatus(user.id)}
                                onMouseEnter={(e) => {
                                  (
                                    e.currentTarget as HTMLButtonElement
                                  ).style.background = "rgba(0,0,0,0.05)";
                                }}
                                onMouseLeave={(e) => {
                                  (
                                    e.currentTarget as HTMLButtonElement
                                  ).style.background = "transparent";
                                }}
                              >
                                {user.status === "Active" ? (
                                  <>
                                    <XCircle
                                      size={14}
                                      style={{ color: "#e60404" }}
                                    />
                                    Deactivate
                                  </>
                                ) : (
                                  <>
                                    <CheckCircle2
                                      size={14}
                                      style={{ color: "#00bf2c" }}
                                    />
                                    Activate
                                  </>
                                )}
                              </button>
                              <div
                                className="w-full h-px"
                                style={{ background: "rgba(0,0,0,0.08)" }}
                              />
                              <button
                                className="flex items-center gap-2 w-full px-4 py-2.5 text-sm font-medium transition-colors"
                                style={{
                                  background: "transparent",
                                  border: "none",
                                  cursor: "pointer",
                                  color: "#e60404",
                                }}
                                onClick={() => handleDelete(user.id)}
                                onMouseEnter={(e) => {
                                  (
                                    e.currentTarget as HTMLButtonElement
                                  ).style.background = "rgba(230,4,4,0.07)";
                                }}
                                onMouseLeave={(e) => {
                                  (
                                    e.currentTarget as HTMLButtonElement
                                  ).style.background = "transparent";
                                }}
                              >
                                <Trash2 size={14} />
                                Delete User
                              </button>
                            </div>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Table Footer */}
          <div className="flex items-center justify-between mt-4">
            <p className="text-xs" style={{ color: "#888" }}>
              Showing {filtered.length} of {totalUsers} users
            </p>
          </div>
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

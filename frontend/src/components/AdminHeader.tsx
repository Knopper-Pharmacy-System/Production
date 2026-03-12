import { Menu, Bell, ChevronDown, Wifi, WifiOff } from "lucide-react";
import bannerLogo from "../assets/banner_logo.png";

// ─── Types ─────────────────────────────────────────────────────────────────────

export interface AdminHeaderProps {
  onMenuClick: () => void;
  currentTime: Date;
  selectedBranch: string;
  onBranchChange: (branch: string) => void;
  isOnline: boolean;
  title?: string;
}

// ─── Constants ─────────────────────────────────────────────────────────────────

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

// ─── Helpers ───────────────────────────────────────────────────────────────────

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

// ─── Component ─────────────────────────────────────────────────────────────────

export default function AdminHeader({
  onMenuClick,
  currentTime,
  selectedBranch,
  onBranchChange,
  isOnline,
  title,
}: AdminHeaderProps) {
  const branchAddress =
    BRANCHES.find((b) => b.value === selectedBranch)?.address ?? "";

  return (
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
            onClick={onMenuClick}
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
              onChange={(e) => onBranchChange(e.target.value)}
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
            {title ?? selectedBranch}
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
  );
}

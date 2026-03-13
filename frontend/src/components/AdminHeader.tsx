import { Menu, Bell, Wifi, WifiOff } from "lucide-react";
import bannerLogo from "../assets/banner_logo.png";

// ─── Types ─────────────────────────────────────────────────────────────────────

export interface AdminHeaderProps {
  onMenuClick: () => void;
  currentTime: Date;
  isOnline: boolean;
}

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
  isOnline,
}: AdminHeaderProps) {
  return (
    <div
      className="rounded-2xl px-4 sm:px-5 py-4"
      style={{
        background: "#0335af",
        border: "1px solid rgba(255,255,255,0.2)",
        boxShadow: "0 0 20px rgba(0,0,0,0.25)",
      }}
    >
      <div className="flex flex-col gap-3 xl:grid xl:grid-cols-[1fr_auto_1fr] xl:items-center xl:gap-4">
        {/* Left: Menu + Logo */}
        <div className="flex items-center gap-3 min-w-0">
          <button
            onClick={onMenuClick}
            className="p-1.5 rounded-lg transition-colors"
            style={{
              color: "rgba(255,255,255,0.8)",
              background: "rgba(255,255,255,0.08)",
              border: "none",
              cursor: "pointer",
            }}
          >
            <Menu size={24} />
          </button>
          <div className="flex flex-col min-w-0">
            <img
              src={bannerLogo}
              alt="Knopper Logo"
              className="h-9 sm:h-10 object-contain object-left"
              style={{ opacity: 0.85 }}
            />
            <div className="hidden sm:flex items-center gap-2 mt-1">
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
          className="flex items-center justify-between sm:justify-start gap-4 px-4 sm:px-5 py-3 rounded-2xl tabular-nums w-full xl:w-auto"
          style={{
            background: "rgba(0,20,69,0.7)",
            border: "1px solid rgba(255,255,255,0.2)",
            boxShadow: "0 4px 16px rgba(0,0,0,0.2)",
          }}
        >
          <div className="flex flex-col min-w-[150px]">
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
          <div className="flex flex-col min-w-[110px]">
            <span
              className="font-semibold tracking-widest uppercase"
              style={{ fontSize: "9px", color: "rgba(190,140,0,0.85)" }}
            >
              Current Time
            </span>
            <span
              className="text-sm font-semibold mt-0.5 whitespace-nowrap"
              style={{ color: "#c9d9ff" }}
            >
              {formatTime(currentTime)}
            </span>
          </div>
        </div>

        {/* Right: Status + Bell */}
        <div className="flex items-center gap-3 justify-end">
          <span
            className="hidden sm:inline text-sm font-semibold"
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
            <span
              className={`text-sm font-semibold tracking-wider whitespace-nowrap ${
                isOnline ? "text-[#acf9be]" : "text-white"
              }`}
            >
              {isOnline ? "ONLINE" : "OFFLINE"}
            </span>
          </div>
          <button
            className="p-2 rounded-lg transition-colors"
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

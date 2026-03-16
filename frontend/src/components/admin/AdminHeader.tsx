import { useEffect, useState } from "react";
import { Menu, Bell, Wifi, WifiOff } from "lucide-react";
import bannerLogo from "../../assets/banner_logo.png";

// ─── Types ─────────────────────────────────────────────────────────────────────

export interface AdminHeaderProps {
  onMenuClick: () => void;
  currentTime?: Date;
  lastSync?: Date;
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
  lastSync,
  isOnline,
}: AdminHeaderProps) {
  const [internalNow, setInternalNow] = useState<Date>(new Date());

  useEffect(() => {
    if (currentTime) return;
    const timer = setInterval(() => setInternalNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, [currentTime]);

  const displayTime = currentTime ?? internalNow;

  return (
    <div
      className="rounded-2xl px-4 sm:px-5 py-5"
      style={{
        background:
          "radial-gradient(circle at top left, rgba(117,166,255,0.22) 0%, transparent 28%), linear-gradient(135deg, #03257b 0%, #0b3fbe 52%, #1d57d2 100%)",
        border: "1px solid rgba(255,255,255,0.18)",
        boxShadow:
          "0 24px 50px rgba(0,14,61,0.28), inset 0 1px 0 rgba(255,255,255,0.14)",
      }}
    >
      <div className="flex flex-col gap-4 xl:grid xl:grid-cols-[1fr_auto_1fr] xl:items-center xl:gap-5">
        {/* Left: Menu + Logo */}
        <div className="flex items-center gap-3 min-w-0">
          <button
            onClick={onMenuClick}
            className="p-1.5 rounded-lg transition-colors"
            style={{
              color: "rgba(255,255,255,0.8)",
              background: "linear-gradient(180deg, rgba(255,255,255,0.16) 0%, rgba(255,255,255,0.08) 100%)",
              boxShadow: "inset 0 1px 0 rgba(255,255,255,0.18)",
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
          </div>
        </div>

        {/* Date/Time/Sync */}
        <div
          className="flex flex-wrap items-center justify-center gap-3 sm:gap-4 tabular-nums w-full xl:w-auto"
          style={{ color: "#d8e4ff" }}
        >
          <div className="flex items-center gap-2">
            <span
              className="text-[10px] font-semibold tracking-widest uppercase"
              style={{ color: "rgba(190,140,0,0.85)" }}
            >
              Date
            </span>
            <span className="text-sm font-semibold whitespace-nowrap">
              {formatDate(displayTime)}
            </span>
          </div>
          <span className="hidden sm:inline" style={{ color: "rgba(255,255,255,0.35)" }}>
            •
          </span>
          <div className="flex items-center gap-2">
            <span
              className="text-[10px] font-semibold tracking-widest uppercase"
              style={{ color: "rgba(190,140,0,0.85)" }}
            >
              Time
            </span>
            <span className="text-sm font-semibold whitespace-nowrap">
              {formatTime(displayTime)}
            </span>
          </div>
          <span className="hidden sm:inline" style={{ color: "rgba(255,255,255,0.35)" }}>
            •
          </span>
          <div className="flex items-center gap-2">
            <span
              className="text-[10px] font-semibold tracking-widest uppercase"
              style={{ color: "rgba(190,140,0,0.85)" }}
            >
              Sync
            </span>
            <span className="text-sm font-semibold whitespace-nowrap">
              {lastSync ? formatTime(lastSync) : "--:--:--"}
            </span>
          </div>
        </div>

        {/* Right: Status + Bell */}
        <div className="flex items-center gap-3 justify-end flex-wrap">
          <div className="hidden md:flex items-center gap-2 mr-2">
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
              background:
                "linear-gradient(180deg, rgba(255,255,255,0.22) 0%, rgba(255,255,255,0.12) 100%)",
              boxShadow: "inset 0 1px 0 rgba(255,255,255,0.12)",
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

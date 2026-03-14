import { useState, type ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  Package,
  BarChart2,
  Building2,
  Users,
  Settings,
  Search,
  ChevronDown,
  ChevronRight,
  LogOut,
  ClipboardList,
} from "lucide-react";
import logoSolid from "../../assets/logo_solid.png";
import { logout } from "../../hooks/useAuth";

interface AdminSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  activeItem?: string;
  onNavigate?: (item: string) => void;
}

// ─── Sub-components ────────────────────────────────────────────────────────────

function Divider() {
  return (
    <div
      className="w-full h-px my-1"
      style={{ background: "rgba(255,255,255,0.2)" }}
    />
  );
}

function SidebarItem({
  label,
  icon,
  active = false,
  chevron = "none",
  onClick,
}: {
  label: string;
  icon?: ReactNode;
  active?: boolean;
  chevron?: "down" | "right" | "none";
  onClick?: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="flex items-center w-full h-10.5 rounded-[7px] px-3.5 transition-colors"
      style={{
        background: active ? "rgba(3,53,175,0.6)" : "transparent",
        border: "none",
        cursor: "pointer",
      }}
      onMouseEnter={(e) => {
        if (!active)
          (e.currentTarget as HTMLButtonElement).style.background =
            "rgba(255,255,255,0.05)";
      }}
      onMouseLeave={(e) => {
        if (!active)
          (e.currentTarget as HTMLButtonElement).style.background =
            "transparent";
      }}
    >
      <div className="flex items-center gap-5 flex-1 min-w-0">
        {icon && (
          <span className="shrink-0 flex items-center justify-center w-3.5 h-3.5">
            {icon}
          </span>
        )}
        <span
          className="text-sm leading-3.5 whitespace-nowrap"
          style={{
            fontFamily: "'Inter', sans-serif",
            fontWeight: 500,
            color: active ? "#CB3CFF" : "#D6D6D6",
          }}
        >
          {label}
        </span>
      </div>
      {chevron !== "none" && (
        <span className="ml-auto shrink-0 opacity-80 flex items-center">
          {chevron === "down" ? (
            <ChevronDown size={14} color="#AEB9E1" />
          ) : (
            <ChevronRight size={14} color="#D6D6D6" />
          )}
        </span>
      )}
    </button>
  );
}

function ExitConfirmModal({
  isOpen,
  onCancel,
  onConfirm,
}: {
  isOpen: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-[#02124a]/70 backdrop-blur-[2px] p-4">
      <div
        className="w-full max-w-md rounded-2xl p-6 relative overflow-hidden"
        style={{
          background:
            "radial-gradient(circle at top left, rgba(117,166,255,0.22) 0%, transparent 38%), linear-gradient(150deg, #052275 0%, #0a3aaa 55%, #1d57d2 100%)",
          border: "1px solid rgba(255,255,255,0.18)",
          boxShadow:
            "0 22px 46px rgba(0, 16, 70, 0.45), inset 0 1px 0 rgba(255,255,255,0.14)",
        }}
      >
        <div
          className="absolute inset-x-0 top-0 h-1"
          style={{ background: "linear-gradient(90deg, #88b1ff 0%, #cb3cff 100%)" }}
        />

        <div className="flex items-center gap-3">
          <div
            className="flex h-12 w-12 items-center justify-center rounded-2xl"
            style={{
              background:
                "linear-gradient(180deg, rgba(255,255,255,0.24) 0%, rgba(255,255,255,0.1) 100%)",
              border: "1px solid rgba(255,255,255,0.22)",
            }}
          >
            <LogOut size={22} color="#ffd6d6" />
          </div>
          <div>
            <h3 className="text-lg font-black" style={{ color: "#eef4ff" }}>
              Exit Admin Panel?
            </h3>
            <p className="text-sm mt-1" style={{ color: "rgba(221,232,255,0.78)" }}>
              You will be logged out and returned to the login screen.
            </p>
          </div>
        </div>

        <div className="mt-6 flex justify-end gap-3">
          <button
            type="button"
            onClick={onCancel}
            className="rounded-xl px-5 py-3 text-sm font-black uppercase tracking-wide transition-colors"
            style={{
              border: "1px solid rgba(193,214,255,0.38)",
              background: "rgba(255,255,255,0.12)",
              color: "#e6efff",
            }}
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="rounded-xl px-5 py-3 text-sm font-black uppercase tracking-wide text-white transition-opacity hover:opacity-90"
            style={{
              background:
                "linear-gradient(180deg, rgba(238,51,51,0.95) 0%, rgba(198,29,29,0.95) 100%)",
              border: "1px solid rgba(255,198,198,0.45)",
              boxShadow: "0 10px 20px rgba(119, 15, 15, 0.3)",
            }}
          >
            Exit
          </button>
        </div>
      </div>
    </div>
  );
}

function UserProfile({ onClick }: { onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="flex items-center w-full px-1.5 py-1.5 rounded-[7px] transition-colors"
      style={{ background: "transparent", border: "none", cursor: "pointer" }}
      onMouseEnter={(e) => {
        (e.currentTarget as HTMLButtonElement).style.background =
          "rgba(255,80,80,0.12)";
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLButtonElement).style.background = "transparent";
      }}
    >
      {/* Avatar */}
      <div
        className="shrink-0 w-8 h-8 rounded-full overflow-hidden flex items-center justify-center"
        style={{ background: "rgba(203,60,255,0.2)" }}
      >
        <img
          src={logoSolid}
          alt="Knopper"
          className="w-6.5 h-6.5 object-contain"
        />
      </div>

      {/* Text */}
      <div className="ml-2.5 flex flex-col text-left">
        <span
          className="text-sm leading-3.5 whitespace-nowrap"
          style={{
            fontFamily: "'Inter', sans-serif",
            fontWeight: 500,
            color: "#FFFFFF",
          }}
        >
          Knopper Pharmacy
        </span>
        <span
          className="text-xs leading-3.5 mt-1 whitespace-nowrap"
          style={{ fontFamily: "'Inter', sans-serif", color: "#AEB9E1" }}
        >
          Account settings
        </span>
      </div>

      {/* Logout icon */}
      <span className="ml-auto shrink-0 opacity-80 flex items-center">
        <LogOut size={14} color="rgba(255,100,100,0.9)" />
      </span>
    </button>
  );
}

// ─── Main Component ────────────────────────────────────────────────────────────

export default function AdminSidebar({
  isOpen,
  onClose,
  activeItem = "Dashboard",
  onNavigate,
}: AdminSidebarProps) {
  const [dashboardExpanded, setDashboardExpanded] = useState(true);
  const [showExitConfirm, setShowExitConfirm] = useState(false);
  const navigate = useNavigate();

  const NAV_ROUTES: Record<string, string> = {
    Dashboard: "/admin",
    Overview: "/admin",
    Users: "/admin/users",
    "Audit Sheet": "/admin/audit-sheet",
    Settings: "/admin/settings",
  };

  const handleNav = (item: string) => {
    onNavigate?.(item);
    if (NAV_ROUTES[item]) {
      navigate(NAV_ROUTES[item]);
      onClose();
    }
  };

  return (
    <>
      {/* Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40"
          style={{ background: "rgba(0,0,0,0.5)" }}
          onClick={onClose}
        />
      )}

      <ExitConfirmModal
        isOpen={showExitConfirm}
        onCancel={() => setShowExitConfirm(false)}
        onConfirm={() => logout()}
      />

      {/* Side Panel */}
      <div
        className="fixed top-0 left-0 h-full z-50 shadow-2xl transition-transform duration-300 flex flex-col"
        style={{
          width: "300px",
          background: "#0321A0",
          transform: isOpen ? "translateX(0)" : "translateX(-100%)",
          borderRight: "1px solid rgba(255,255,255,0.08)",
        }}
      >
        {/* Search Bar */}
        <div className="px-7 pt-7 pb-4">
          <div
            className="flex items-center gap-2 px-3.5 h-10.5 rounded-sm"
            style={{
              background: "#F0F0F0",
              border: "0.6px solid #343B4F",
            }}
          >
            <Search size={14} color="#062D8C" />
            <span
              className="text-xs leading-3.5 whitespace-nowrap"
              style={{
                fontFamily: "'Inter', sans-serif",
                fontWeight: 500,
                color: "#062D8C",
              }}
            >
              Search for...
            </span>
          </div>
        </div>

        {/* Navigation */}
        <div className="flex-1 overflow-y-auto px-7 flex flex-col gap-1">
          {/* Dashboard (expandable) */}
          <div className="flex flex-col gap-1">
            <button
              onClick={() => {
                setDashboardExpanded((p) => !p);
                handleNav("Dashboard");
              }}
              className="flex items-center w-full h-10.5 rounded-[7px] px-3.5 transition-colors"
              style={{
                background: "rgba(3,53,175,0.5)",
                border: "none",
                cursor: "pointer",
              }}
            >
              <div className="flex items-center gap-5 flex-1">
                <span className="shrink-0 flex items-center justify-center w-3.5 h-3.5">
                  <LayoutDashboard size={14} color="#CB3CFF" />
                </span>
                <span
                  className="text-sm leading-3.5"
                  style={{
                    fontFamily: "'Inter', sans-serif",
                    fontWeight: 500,
                    color: "#CB3CFF",
                  }}
                >
                  Dashboard
                </span>
              </div>
              <span className="ml-auto shrink-0 opacity-80">
                {dashboardExpanded ? (
                  <ChevronDown size={14} color="#AEB9E1" />
                ) : (
                  <ChevronRight size={14} color="#AEB9E1" />
                )}
              </span>
            </button>

            {dashboardExpanded && (
              <div className="flex flex-col">
                {["Overview", "Inventory", "Products", "Tasks"].map((sub) => (
                  <button
                    key={sub}
                    onClick={() => handleNav(sub)}
                    className="flex items-center w-full h-10.5 rounded-[7px] px-3.5 transition-colors"
                    style={{
                      background:
                        activeItem === sub
                          ? "rgba(255,255,255,0.08)"
                          : "transparent",
                      border: "none",
                      cursor: "pointer",
                    }}
                    onMouseEnter={(e) => {
                      if (activeItem !== sub)
                        (
                          e.currentTarget as HTMLButtonElement
                        ).style.background = "rgba(255,255,255,0.05)";
                    }}
                    onMouseLeave={(e) => {
                      if (activeItem !== sub)
                        (
                          e.currentTarget as HTMLButtonElement
                        ).style.background = "transparent";
                    }}
                  >
                    <span
                      className="text-sm leading-3.5 whitespace-nowrap"
                      style={{
                        fontFamily: "'Inter', sans-serif",
                        fontWeight: 500,
                        color: "#D6D6D6",
                      }}
                    >
                      {sub}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Sales Reports */}
          <SidebarItem
            label="Sales Reports"
            icon={
              <BarChart2
                size={14}
                color={activeItem === "Sales Reports" ? "#CB3CFF" : "#D6D6D6"}
              />
            }
            active={activeItem === "Sales Reports"}
            chevron="right"
            onClick={() => handleNav("Sales Reports")}
          />

          {/* Branches */}
          <SidebarItem
            label="Branches"
            icon={
              <Building2
                size={14}
                color={activeItem === "Branches" ? "#CB3CFF" : "#D6D6D6"}
              />
            }
            active={activeItem === "Branches"}
            chevron="right"
            onClick={() => handleNav("Branches")}
          />

          {/* Users */}
          <SidebarItem
            label="Users"
            icon={
              <Users
                size={14}
                color={activeItem === "Users" ? "#CB3CFF" : "#D6D6D6"}
              />
            }
            active={activeItem === "Users"}
            chevron="right"
            onClick={() => handleNav("Users")}
          />

          {/* Inventory */}
          <SidebarItem
            label="Inventory"
            icon={
              <Package
                size={14}
                color={activeItem === "Inventory" ? "#CB3CFF" : "#D6D6D6"}
              />
            }
            active={activeItem === "Inventory"}
            chevron="right"
            onClick={() => handleNav("Inventory")}
          />

          {/* Audit Sheet */}
          <SidebarItem
            label="Audit Sheet"
            icon={
              <ClipboardList
                size={14}
                color={activeItem === "Audit Sheet" ? "#CB3CFF" : "#D6D6D6"}
              />
            }
            active={activeItem === "Audit Sheet"}
            chevron="right"
            onClick={() => handleNav("Audit Sheet")}
          />

          <div className="flex-1 min-h-6" />
        </div>

        {/* Bottom Section */}
        <div className="px-7 pb-7 flex flex-col gap-4">
          <Divider />

          <SidebarItem
            label="Settings"
            icon={
              <Settings
                size={14}
                color={activeItem === "Settings" ? "#CB3CFF" : "#D6D6D6"}
              />
            }
            active={activeItem === "Settings"}
            chevron="right"
            onClick={() => handleNav("Settings")}
          />

          <Divider />

          <UserProfile onClick={() => setShowExitConfirm(true)} />
        </div>
      </div>
    </>
  );
}

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
} from "lucide-react";
import logoSolid from "../assets/logo_solid.png";
import { logout } from "../hooks/useAuth";

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

function UserProfile() {
  return (
    <button
      onClick={logout}
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
  const navigate = useNavigate();

  const NAV_ROUTES: Record<string, string> = {
    Dashboard: "/admin",
    Overview: "/admin",
    Users: "/admin/users",
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

          <UserProfile />
        </div>
      </div>
    </>
  );
}

import { LogOut } from "lucide-react";
import logoSolid from "../assets/logo_solid.png";
import { logout } from "../hooks/useAuth";

interface AdminSidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

const NAV_ITEMS = [
  "Dashboard",
  "Inventory",
  "Sales Reports",
  "Branches",
  "Users",
  "Settings",
];

export default function AdminSidebar({ isOpen, onClose }: AdminSidebarProps) {
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

      {/* Sidebar Panel */}
      <div
        className="fixed top-0 left-0 h-full w-64 z-50 shadow-2xl transition-transform duration-300 flex flex-col"
        style={{
          background: "#031a6b",
          transform: isOpen ? "translateX(0)" : "translateX(-100%)",
        }}
      >
        <div
          className="p-5"
          style={{ borderBottom: "1px solid rgba(255,255,255,0.1)" }}
        >
          <img
            src={logoSolid}
            alt="Knopper Logo"
            className="h-12 object-contain"
            style={{ opacity: 0.9 }}
          />
        </div>

        <nav
          className="p-4 flex flex-col gap-1 text-sm flex-1"
          style={{ color: "rgba(255,255,255,0.8)" }}
        >
          {NAV_ITEMS.map((item) => (
            <button
              key={item}
              className="text-left px-4 py-3 rounded-lg transition-colors"
              style={{
                background: "transparent",
                color: "rgba(255,255,255,0.8)",
                border: "none",
                cursor: "pointer",
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLButtonElement).style.background =
                  "rgba(255,255,255,0.1)";
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLButtonElement).style.background =
                  "transparent";
              }}
            >
              {item}
            </button>
          ))}
        </nav>

        <div
          className="p-4"
          style={{ borderTop: "1px solid rgba(255,255,255,0.1)" }}
        >
          <button
            onClick={logout}
            className="flex items-center gap-3 w-full text-left px-4 py-3 rounded-lg transition-colors"
            style={{
              background: "transparent",
              color: "rgba(255,100,100,0.9)",
              border: "none",
              fontSize: "0.875rem",
              cursor: "pointer",
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLButtonElement).style.background =
                "rgba(255,80,80,0.12)";
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLButtonElement).style.background =
                "transparent";
            }}
          >
            <LogOut size={16} />
            <span>Logout</span>
          </button>
        </div>
      </div>
    </>
  );
}

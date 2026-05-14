import { type ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import { logout } from "../../hooks/useAuth";
import { useSalesAnalyticsStore } from "../../features/salesAnalytics/store/useSalesAnalyticsStore";
import {
  Building2,
  ChevronRight,
  ClipboardList,
  History,
  LayoutDashboard,
  LogOut,
  Search,
  PackageSearch,
  Settings,
  UploadCloud,
  Users,
  X,
} from "lucide-react";

interface ManagerSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  activeItem?: string;
  onNavigate?: (item: string) => void;
}

type NavItem = {
  label: string;
  icon: ReactNode;
  onClick: () => void;
  active: boolean;
};

function SidebarItem({ label, icon, active, onClick }: NavItem) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex w-full items-center gap-3 rounded-[7px] px-3.5 py-2.5 text-left transition-colors"
      style={{
        background: active ? "rgba(3,53,175,0.6)" : "transparent",
        border: "none",
        cursor: "pointer",
      }}
      onMouseEnter={(event) => {
        if (!active) {
          event.currentTarget.style.background = "rgba(255,255,255,0.05)";
        }
      }}
      onMouseLeave={(event) => {
        if (!active) {
          event.currentTarget.style.background = "transparent";
        }
      }}
    >
      <span className="flex h-4 w-4 shrink-0 items-center justify-center text-[#D6D6D6]">
        {icon}
      </span>
      <span
        className="text-sm font-medium whitespace-nowrap"
        style={{ color: active ? "#CB3CFF" : "#D6D6D6" }}
      >
        {label}
      </span>
      {active ? (
        <span className="ml-auto flex items-center opacity-85">
          <ChevronRight size={14} color="#AEB9E1" />
        </span>
      ) : null}
    </button>
  );
}

function SectionCard({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="rounded-[18px] border border-white/10 bg-white/6 p-4 shadow-[0_12px_30px_rgba(0,0,0,0.18)]">
      <div className="mb-3 flex items-center justify-between gap-3">
        <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-blue-100/85">
          {title}
        </p>
      </div>
      {children}
    </section>
  );
}

function UserProfile({ onLogout }: { onLogout: () => void }) {
  return (
    <button
      type="button"
      onClick={onLogout}
      className="flex w-full items-center gap-3 rounded-[7px] px-1.5 py-1.5 text-left transition-colors"
      style={{ border: "none", background: "transparent", cursor: "pointer" }}
      onMouseEnter={(event) => {
        event.currentTarget.style.background = "rgba(255,80,80,0.12)";
      }}
      onMouseLeave={(event) => {
        event.currentTarget.style.background = "transparent";
      }}
    >
      <div
        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full"
        style={{ background: "rgba(203,60,255,0.2)" }}
      >
        <svg
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path d="M12 2L2 7L12 12L22 7L12 2Z" stroke="#CB3CFF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M2 17L12 22L22 17" stroke="#CB3CFF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M2 12L12 17L22 12" stroke="#CB3CFF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </div>

      <div className="flex min-w-0 flex-col text-left">
        <span className="truncate text-sm font-medium text-white">Knopper Pharmacy</span>
        <span className="mt-1 truncate text-xs text-[#AEB9E1]">Account settings</span>
      </div>

      <span className="ml-auto flex items-center opacity-80">
        <LogOut size={14} color="rgba(255,100,100,0.9)" />
      </span>
    </button>
  );
}

export default function ManagerSidebar({
  isOpen,
  onClose,
  activeItem = "Dashboard",
  onNavigate,
}: ManagerSidebarProps) {
  const navigate = useNavigate();
  const branches = useSalesAnalyticsStore((state) => state.branches);
  const selectedBranchId = useSalesAnalyticsStore((state) => state.selectedBranchId);
  const setSelectedBranch = useSalesAnalyticsStore((state) => state.setSelectedBranch);

  const closeAnd = (item: string, action: () => void) => {
    onNavigate?.(item);
    action();
    onClose();
  };

  const goToDashboard = () => {
    navigate("/manager");
  };

  const goToUpload = () => {
    navigate("/manager/upload-reports");
  };

  const goToCatalog = () => {
    navigate("/manager/product-catalog");
  };

  const goToInventory = () => {
    navigate("/manager/inventory-insights");
  };

  const handleLogout = () => {
    logout();
    navigate("/");
    onClose();
  };

  return (
    <>
      {isOpen ? (
        <button
          type="button"
          aria-label="Close navigation overlay"
          className="fixed inset-0 z-40 cursor-default bg-black/50"
          onClick={onClose}
        />
      ) : null}

      <aside
        className="fixed left-0 top-0 z-50 flex h-full w-[300px] max-w-[88vw] flex-col border-r border-white/8 bg-[#0321A0] text-white shadow-2xl transition-transform duration-300"
        style={{ transform: isOpen ? "translateX(0)" : "translateX(-102%)" }}
      >
        <div className="px-6 pb-4 pt-6">
          <div className="flex items-center gap-2 rounded-sm border border-[#343B4F] bg-[#F0F0F0] px-3.5 h-10.5">
            <Search size={14} color="#062D8C" />
            <span className="text-sm font-medium leading-[1.2] whitespace-nowrap text-[#062D8C]">
              Search for...
            </span>
          </div>
        </div>

        <div className="flex items-center justify-between gap-3 px-6 pb-4">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-blue-100/80">Manager Console</p>
            <h2 className="mt-1 text-lg font-bold">Knopper Pharmacy</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-white/10 bg-white/8 p-2 text-white transition hover:bg-white/12"
            aria-label="Close sidebar"
          >
            <X size={18} />
          </button>
        </div>

        <div className="flex-1 space-y-4 overflow-y-auto px-6 pb-4">
          <SectionCard title="Navigation">
            <div className="space-y-1.5">
              <SidebarItem
                label="Dashboard"
                icon={<LayoutDashboard size={14} color={activeItem === "Dashboard" ? "#CB3CFF" : "#D6D6D6"} />}
                active={activeItem === "Dashboard"}
                onClick={() => closeAnd("Dashboard", goToDashboard)}
              />
              <SidebarItem
                label="Upload Reports"
                icon={<UploadCloud size={14} color={activeItem === "Upload Reports" ? "#CB3CFF" : "#D6D6D6"} />}
                active={activeItem === "Upload Reports"}
                onClick={() => closeAnd("Upload Reports", goToUpload)}
              />
              <SidebarItem
                label="Branches"
                icon={<Building2 size={14} color={activeItem === "Branches" ? "#CB3CFF" : "#D6D6D6"} />}
                active={activeItem === "Branches"}
                onClick={() => closeAnd("Branches", () => navigate("/manager/branches"))}
              />
              <SidebarItem
                label="Staff / Cashiers"
                icon={<Users size={14} color={activeItem === "Staff / Cashiers" ? "#CB3CFF" : "#D6D6D6"} />}
                active={activeItem === "Staff / Cashiers"}
                onClick={() => closeAnd("Staff / Cashiers", () => navigate("/manager/cashiers"))}
              />
              <SidebarItem
                label="Upload History"
                icon={<History size={14} color={activeItem === "Upload History" ? "#CB3CFF" : "#D6D6D6"} />}
                active={activeItem === "Upload History"}
                onClick={() => closeAnd("Upload History", () => navigate("/manager/upload-history"))}
              />
              <SidebarItem
                label="Product Catalog"
                icon={<ClipboardList size={14} color={activeItem === "Product Catalog" ? "#CB3CFF" : "#D6D6D6"} />}
                active={activeItem === "Product Catalog"}
                onClick={() => closeAnd("Product Catalog", goToCatalog)}
              />
              <SidebarItem
                label="Inventory Insights"
                icon={<PackageSearch size={14} color={activeItem === "Inventory Insights" ? "#CB3CFF" : "#D6D6D6"} />}
                active={activeItem === "Inventory Insights"}
                onClick={() => closeAnd("Inventory Insights", goToInventory)}
              />
              <SidebarItem
                label="Settings"
                icon={<Settings size={14} color={activeItem === "Settings" ? "#CB3CFF" : "#D6D6D6"} />}
                active={activeItem === "Settings"}
                onClick={() => closeAnd("Settings", () => navigate("/manager/settings"))}
              />
            </div>
          </SectionCard>

          <SectionCard title="Branches">
            <div className="space-y-2">
              {branches.length > 0 ? (
                branches.map((branch) => {
                  const isSelected = branch.id === selectedBranchId;
                  return (
                    <button
                      key={branch.id}
                      type="button"
                      onClick={() => {
                        setSelectedBranch(branch.id);
                        onClose();
                      }}
                      className={`flex w-full items-center justify-between rounded-[14px] border px-3 py-2.5 text-left transition ${
                        isSelected ? "bg-white/14" : "bg-white/6 hover:bg-white/10"
                      }`}
                      style={{ borderColor: isSelected ? "rgba(255,255,255,0.22)" : "rgba(255,255,255,0.08)" }}
                    >
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-white">{branch.name}</p>
                        <p className="mt-0.5 text-[11px] uppercase tracking-[0.16em] text-blue-100/80">{branch.code}</p>
                      </div>
                      {isSelected ? <ChevronRight size={16} className="text-blue-100" /> : null}
                    </button>
                  );
                })
              ) : (
                <p className="text-sm text-slate-200">No branches created yet.</p>
              )}
            </div>

            <button
              type="button"
              onClick={() => closeAnd("Branches", () => navigate("/manager/branches"))}
              className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-[14px] border border-white/12 bg-white/10 px-3 py-2.5 text-sm font-semibold text-white transition hover:bg-white/15"
            >
              <Building2 size={16} />
              Create New Branch
            </button>
          </SectionCard>
        </div>

        <div className="border-t border-white/10 px-6 py-4">
          <UserProfile onLogout={handleLogout} />
        </div>
      </aside>
    </>
  );
}

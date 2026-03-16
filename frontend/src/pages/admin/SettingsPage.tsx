import { useEffect, useMemo, useState } from "react";
import {
  Bell,
  Coins,
  ChevronRight,
  ClipboardList,
  Save,
  Settings2,
  ShieldCheck,
  Warehouse,
} from "lucide-react";
import AdminSidebar from "../../components/admin/AdminSidebar";
import AdminHeader from "../../components/admin/AdminHeader";
import {
  getActiveShift,
  getCurrentBranchName,
  updateActiveShiftOpeningBalance,
  type ShiftSession,
} from "../../features/pos/api/db";

type SettingsTab = "general" | "inventory" | "audit" | "cash" | "security";

interface GeneralSettings {
  branchLabel: string;
  adminEmail: string;
  timezone: string;
  summaryEmailEnabled: boolean;
}

interface InventorySettings {
  lowStockThreshold: number;
  nearExpiryDays: number;
  defaultReorderLevel: number;
  defaultTargetStock: number;
}

interface AuditSettings {
  requireReason: boolean;
  allowManualAdjustments: boolean;
  autoSaveDraft: boolean;
  varianceTolerance: number;
}

interface SecuritySettings {
  sessionTimeoutMinutes: number;
  requireManagerApproval: boolean;
  loginAuditTrail: boolean;
}

interface CashSettings {
  defaultFloat: number;
  requireAdminConfirmation: boolean;
}

const BRANCH_OPTIONS = [
  "BMC MAIN",
  "DIVERSION BRANCH",
  "PANGANIBAN BRANCH",
] as const;

const TAB_CONFIG: Array<{
  id: SettingsTab;
  label: string;
  description: string;
  icon: typeof Settings2;
}> = [
  {
    id: "general",
    label: "General",
    description: "Branch profile and notifications",
    icon: Settings2,
  },
  {
    id: "inventory",
    label: "Inventory Rules",
    description: "Thresholds and stock defaults",
    icon: Warehouse,
  },
  {
    id: "audit",
    label: "Audit Rules",
    description: "Adjustment behavior and draft flow",
    icon: ClipboardList,
  },
  {
    id: "cash",
    label: "Cash Control",
    description: "Reset and manage cashier float",
    icon: Coins,
  },
  {
    id: "security",
    label: "Security",
    description: "Sessions and approval controls",
    icon: ShieldCheck,
  },
];

function ToggleRow({
  label,
  hint,
  checked,
  onChange,
}: {
  label: string;
  hint: string;
  checked: boolean;
  onChange: () => void;
}) {
  return (
    <div className="flex items-center justify-between gap-4 rounded-xl px-4 py-3" style={{ background: "rgba(255,255,255,0.72)", border: "1px solid rgba(118,140,203,0.2)" }}>
      <div>
        <p className="text-sm font-bold" style={{ color: "#062d8c" }}>
          {label}
        </p>
        <p className="text-xs mt-0.5" style={{ color: "#6a728a" }}>
          {hint}
        </p>
      </div>
      <button
        type="button"
        onClick={onChange}
        className="relative h-7 w-13 rounded-full transition-colors"
        style={{
          background: checked ? "#1133f2" : "#cbd5e1",
          border: "none",
          cursor: "pointer",
        }}
      >
        <span
          className="absolute top-1 h-5 w-5 rounded-full bg-white transition-all"
          style={{ left: checked ? "28px" : "4px" }}
        />
      </button>
    </div>
  );
}

export default function SettingsPage() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [lastSync, setLastSync] = useState(new Date());
  const [activeTab, setActiveTab] = useState<SettingsTab>("general");
  const [settingsMessage, setSettingsMessage] = useState<string | null>(null);
  const [settingsError, setSettingsError] = useState<string | null>(null);
  const [isUpdatingCash, setIsUpdatingCash] = useState(false);
  const [activeShift, setActiveShift] = useState<ShiftSession | null>(null);
  const [cashOverrideAmount, setCashOverrideAmount] = useState("0");
  const [selectedCashBranch, setSelectedCashBranch] = useState(getCurrentBranchName());

  const [general, setGeneral] = useState<GeneralSettings>({
    branchLabel: "Knopper Pharmacy Admin",
    adminEmail: "admin@knopperpharmacy.com",
    timezone: "Asia/Manila",
    summaryEmailEnabled: true,
  });

  const [inventory, setInventory] = useState<InventorySettings>({
    lowStockThreshold: 10,
    nearExpiryDays: 30,
    defaultReorderLevel: 10,
    defaultTargetStock: 100,
  });

  const [audit, setAudit] = useState<AuditSettings>({
    requireReason: true,
    allowManualAdjustments: true,
    autoSaveDraft: true,
    varianceTolerance: 0,
  });

  const [security, setSecurity] = useState<SecuritySettings>({
    sessionTimeoutMinutes: 60,
    requireManagerApproval: true,
    loginAuditTrail: true,
  });

  const [cashSettings, setCashSettings] = useState<CashSettings>({
    defaultFloat: 0,
    requireAdminConfirmation: true,
  });

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
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
    const loadActiveShift = async () => {
      const shift = await getActiveShift(selectedCashBranch);
      setActiveShift(shift);
      setCashOverrideAmount(String(shift?.openingBalance ?? cashSettings.defaultFloat));
    };

    void loadActiveShift();
  }, [cashSettings.defaultFloat, selectedCashBranch]);

  const activeConfig = useMemo(
    () => TAB_CONFIG.find((tab) => tab.id === activeTab) ?? TAB_CONFIG[0],
    [activeTab],
  );

  const handleSave = () => {
    setSettingsError(null);
    setSettingsMessage("Settings saved successfully.");
    setLastSync(new Date());
  };

  const refreshActiveShift = async () => {
    const shift = await getActiveShift(selectedCashBranch);
    setActiveShift(shift);
    return shift;
  };

  const handleApplyCashAmount = async (amount: number) => {
    setIsUpdatingCash(true);
    setSettingsError(null);
    setSettingsMessage(null);

    try {
      const updatedShift = await updateActiveShiftOpeningBalance(
        amount,
        selectedCashBranch,
      );
      if (!updatedShift) {
        setSettingsError(`No active cashier shift found for ${selectedCashBranch}.`);
        return;
      }

      setActiveShift(updatedShift);
      setCashOverrideAmount(String(updatedShift.openingBalance));
      setLastSync(new Date());
      setSettingsMessage(
        `${selectedCashBranch} opening balance updated to PHP ${updatedShift.openingBalance.toFixed(2)}.`,
      );
    } catch {
      setSettingsError("Could not update active opening balance.");
    } finally {
      setIsUpdatingCash(false);
    }
  };

  const handleResetCash = async () => {
    await handleApplyCashAmount(0);
  };

  return (
    <div
      className="min-h-screen w-full overflow-y-auto overflow-x-hidden relative"
      style={{
        background:
          "radial-gradient(ellipse 80% 50% at 60% -10%, rgba(99,145,255,0.18) 0%, transparent 70%), linear-gradient(160deg, #041e6e 0%, #062d8c 35%, #0b3fbe 65%, #1d57d2 100%)",
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
        activeItem="Settings"
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
              System Configuration
            </p>
            <h2
              className="font-bold text-2xl tracking-wide mt-1"
              style={{ color: "rgba(245,249,255,0.96)" }}
            >
              Admin Settings
            </h2>
            <p className="text-sm mt-1" style={{ color: "rgba(218,232,255,0.74)" }}>
              Manage branch behavior, inventory rules, audit policies, and security defaults.
            </p>
          </div>
          <button
            type="button"
            onClick={handleSave}
            className="flex items-center gap-2 h-11 px-5 rounded-2xl text-sm font-bold text-white transition-opacity hover:opacity-90"
            style={{
              background: "linear-gradient(180deg, #0f34f4 0%, #274fff 100%)",
              boxShadow: "0 16px 32px rgba(3,31,99,0.24)",
              border: "1px solid rgba(255,255,255,0.12)",
            }}
          >
            <Save size={16} />
            Save Settings
          </button>
        </div>

        {(settingsMessage || settingsError) && (
          <div
            className="rounded-xl px-4 py-3 text-sm font-semibold"
            style={{
              background: settingsError
                ? "rgba(230,4,4,0.12)"
                : "rgba(0,191,44,0.12)",
              color: settingsError ? "#a30000" : "#067647",
              border: settingsError
                ? "1px solid rgba(230,4,4,0.25)"
                : "1px solid rgba(0,191,44,0.25)",
            }}
          >
            {settingsError || settingsMessage}
          </div>
        )}

        <div className="grid grid-cols-1 xl:grid-cols-[300px_minmax(0,1fr)] gap-5">
          <div
            className="rounded-2xl p-4 flex flex-col gap-2"
            style={{
              background: "linear-gradient(180deg, rgba(255,255,255,0.98) 0%, rgba(233,241,255,0.96) 100%)",
              border: "1px solid rgba(77,108,196,0.24)",
              boxShadow: "0 18px 42px rgba(1,24,84,0.18), inset 0 1px 0 rgba(255,255,255,0.88)",
            }}
          >
            {TAB_CONFIG.map((tab) => {
              const Icon = tab.icon;
              const isActive = tab.id === activeTab;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id)}
                  className="flex items-center gap-3 rounded-xl px-4 py-3 text-left transition-colors"
                  style={{
                    background: isActive ? "rgba(17,51,242,0.12)" : "transparent",
                    border: isActive
                      ? "1px solid rgba(17,51,242,0.18)"
                      : "1px solid transparent",
                  }}
                >
                  <span
                    className="flex h-10 w-10 items-center justify-center rounded-xl"
                    style={{
                      background: isActive ? "rgba(17,51,242,0.12)" : "rgba(148,163,184,0.14)",
                    }}
                  >
                    <Icon size={18} color={isActive ? "#1133f2" : "#64748b"} />
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold" style={{ color: isActive ? "#062d8c" : "#1e293b" }}>
                      {tab.label}
                    </p>
                    <p className="text-xs mt-0.5" style={{ color: "#64748b" }}>
                      {tab.description}
                    </p>
                  </div>
                  <ChevronRight size={16} color={isActive ? "#1133f2" : "#94a3b8"} />
                </button>
              );
            })}
          </div>

          <div
            className="rounded-2xl p-6 flex flex-col gap-5"
            style={{
              background: "linear-gradient(180deg, #ffffff 0%, #f4f7ff 100%)",
              border: "1px solid rgba(115,139,205,0.24)",
              boxShadow: "inset 0 1px 0 rgba(255,255,255,0.9), 0 10px 28px rgba(11,37,97,0.09)",
            }}
          >
            <div>
              <p className="text-xs font-bold tracking-[0.25em] uppercase" style={{ color: "#7b89ad" }}>
                {activeConfig.label}
              </p>
              <h3 className="text-xl font-bold mt-1" style={{ color: "#062d8c" }}>
                {activeConfig.description}
              </h3>
            </div>

            {activeTab === "general" && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-semibold" style={{ color: "#6a728a" }}>
                    Display Name
                  </label>
                  <input
                    value={general.branchLabel}
                    onChange={(event) =>
                      setGeneral((prev) => ({ ...prev, branchLabel: event.target.value }))
                    }
                    className="h-11 rounded-xl px-4 text-sm outline-none"
                    style={{ border: "1px solid #c9cfdb", color: "#001d63" }}
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-semibold" style={{ color: "#6a728a" }}>
                    Admin Email
                  </label>
                  <input
                    value={general.adminEmail}
                    onChange={(event) =>
                      setGeneral((prev) => ({ ...prev, adminEmail: event.target.value }))
                    }
                    className="h-11 rounded-xl px-4 text-sm outline-none"
                    style={{ border: "1px solid #c9cfdb", color: "#001d63" }}
                  />
                </div>
                <div className="flex flex-col gap-1 lg:col-span-2">
                  <label className="text-xs font-semibold" style={{ color: "#6a728a" }}>
                    Timezone
                  </label>
                  <select
                    value={general.timezone}
                    onChange={(event) =>
                      setGeneral((prev) => ({ ...prev, timezone: event.target.value }))
                    }
                    className="h-11 rounded-xl px-4 text-sm outline-none"
                    style={{ border: "1px solid #c9cfdb", color: "#001d63", background: "#fff" }}
                  >
                    <option value="Asia/Manila">Asia/Manila</option>
                    <option value="Asia/Singapore">Asia/Singapore</option>
                    <option value="UTC">UTC</option>
                  </select>
                </div>
                <div className="lg:col-span-2">
                  <ToggleRow
                    label="Daily Summary Email"
                    hint="Send a daily admin summary for stock, users, and audit activity."
                    checked={general.summaryEmailEnabled}
                    onChange={() =>
                      setGeneral((prev) => ({
                        ...prev,
                        summaryEmailEnabled: !prev.summaryEmailEnabled,
                      }))
                    }
                  />
                </div>
              </div>
            )}

            {activeTab === "inventory" && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {[
                  {
                    label: "Low Stock Threshold",
                    value: inventory.lowStockThreshold,
                    key: "lowStockThreshold",
                  },
                  {
                    label: "Near Expiry Days",
                    value: inventory.nearExpiryDays,
                    key: "nearExpiryDays",
                  },
                  {
                    label: "Default Reorder Level",
                    value: inventory.defaultReorderLevel,
                    key: "defaultReorderLevel",
                  },
                  {
                    label: "Default Target Stock",
                    value: inventory.defaultTargetStock,
                    key: "defaultTargetStock",
                  },
                ].map((field) => (
                  <div key={field.key} className="flex flex-col gap-1">
                    <label className="text-xs font-semibold" style={{ color: "#6a728a" }}>
                      {field.label}
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={field.value}
                      onChange={(event) =>
                        setInventory((prev) => ({
                          ...prev,
                          [field.key]: Math.max(0, Number(event.target.value) || 0),
                        }))
                      }
                      className="h-11 rounded-xl px-4 text-sm outline-none"
                      style={{ border: "1px solid #c9cfdb", color: "#001d63" }}
                    />
                  </div>
                ))}
              </div>
            )}

            {activeTab === "audit" && (
              <div className="flex flex-col gap-4">
                <ToggleRow
                  label="Require Adjustment Reason"
                  hint="Force admins to select a reason whenever quantity is changed."
                  checked={audit.requireReason}
                  onChange={() =>
                    setAudit((prev) => ({ ...prev, requireReason: !prev.requireReason }))
                  }
                />
                <ToggleRow
                  label="Allow Manual Adjustments"
                  hint="Allow direct quantity changes from the audit table and adjustment panel."
                  checked={audit.allowManualAdjustments}
                  onChange={() =>
                    setAudit((prev) => ({
                      ...prev,
                      allowManualAdjustments: !prev.allowManualAdjustments,
                    }))
                  }
                />
                <ToggleRow
                  label="Auto-save Draft"
                  hint="Keep audit forms in draft mode while the team is still counting items."
                  checked={audit.autoSaveDraft}
                  onChange={() =>
                    setAudit((prev) => ({ ...prev, autoSaveDraft: !prev.autoSaveDraft }))
                  }
                />
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-semibold" style={{ color: "#6a728a" }}>
                    Variance Tolerance
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={audit.varianceTolerance}
                    onChange={(event) =>
                      setAudit((prev) => ({
                        ...prev,
                        varianceTolerance: Math.max(0, Number(event.target.value) || 0),
                      }))
                    }
                    className="h-11 rounded-xl px-4 text-sm outline-none"
                    style={{ border: "1px solid #c9cfdb", color: "#001d63" }}
                  />
                  <p className="text-xs mt-1" style={{ color: "#6a728a" }}>
                    Variance above this count can be flagged for manual review.
                  </p>
                </div>
              </div>
            )}

            {activeTab === "cash" && (
              <div className="flex flex-col gap-4">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                  <div
                    className="rounded-xl p-4"
                    style={{ background: "rgba(227,242,255,0.78)", border: "1px solid rgba(96,165,250,0.2)" }}
                  >
                    <p className="text-xs font-bold uppercase tracking-wide" style={{ color: "#5f6f94" }}>
                      Active Shift
                    </p>
                    <p className="text-lg font-black mt-1" style={{ color: "#062d8c" }}>
                      {activeShift ? activeShift.shiftId : "No active shift"}
                    </p>
                    <p className="text-xs mt-1" style={{ color: "#6a728a" }}>
                      Branch: {selectedCashBranch}
                    </p>
                  </div>
                  <div
                    className="rounded-xl p-4"
                    style={{ background: "rgba(227,255,237,0.75)", border: "1px solid rgba(52,211,153,0.2)" }}
                  >
                    <p className="text-xs font-bold uppercase tracking-wide" style={{ color: "#5f6f94" }}>
                      Current Float
                    </p>
                    <p className="text-lg font-black mt-1" style={{ color: "#067647" }}>
                      PHP {(activeShift?.openingBalance ?? 0).toFixed(2)}
                    </p>
                  </div>
                  <div
                    className="rounded-xl p-4"
                    style={{ background: "rgba(255,247,237,0.9)", border: "1px solid rgba(251,191,36,0.2)" }}
                  >
                    <p className="text-xs font-bold uppercase tracking-wide" style={{ color: "#5f6f94" }}>
                      Status
                    </p>
                    <p className="text-lg font-black mt-1" style={{ color: "#b45309" }}>
                      {activeShift ? activeShift.status : "IDLE"}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  <div className="flex flex-col gap-1">
                    <label className="text-xs font-semibold" style={{ color: "#6a728a" }}>
                      Branch Selection
                    </label>
                    <select
                      value={selectedCashBranch}
                      onChange={(event) => setSelectedCashBranch(event.target.value)}
                      className="h-11 rounded-xl px-4 text-sm outline-none"
                      style={{ border: "1px solid #c9cfdb", color: "#001d63", background: "#fff" }}
                    >
                      {BRANCH_OPTIONS.map((branch) => (
                        <option key={branch} value={branch}>
                          {branch}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-xs font-semibold" style={{ color: "#6a728a" }}>
                      Default Admin Float
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={cashSettings.defaultFloat}
                      onChange={(event) =>
                        setCashSettings((prev) => ({
                          ...prev,
                          defaultFloat: Math.max(0, Number(event.target.value) || 0),
                        }))
                      }
                      className="h-11 rounded-xl px-4 text-sm outline-none"
                      style={{ border: "1px solid #c9cfdb", color: "#001d63" }}
                    />
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-xs font-semibold" style={{ color: "#6a728a" }}>
                      Active Shift Override
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={cashOverrideAmount}
                      onChange={(event) => setCashOverrideAmount(event.target.value)}
                      className="h-11 rounded-xl px-4 text-sm outline-none"
                      style={{ border: "1px solid #c9cfdb", color: "#001d63" }}
                    />
                  </div>
                </div>

                <ToggleRow
                  label="Require Admin Confirmation"
                  hint="Keep money resets restricted to an admin review workflow."
                  checked={cashSettings.requireAdminConfirmation}
                  onChange={() =>
                    setCashSettings((prev) => ({
                      ...prev,
                      requireAdminConfirmation: !prev.requireAdminConfirmation,
                    }))
                  }
                />

                <div
                  className="rounded-xl px-4 py-4 flex flex-col gap-3"
                  style={{ background: "rgba(255,255,255,0.72)", border: "1px solid rgba(118,140,203,0.2)" }}
                >
                  <p className="text-sm font-bold" style={{ color: "#062d8c" }}>
                    Admin Cash Actions
                  </p>
                  <p className="text-xs" style={{ color: "#6a728a" }}>
                    Use this when admin is handling the drawer and needs to correct or fully reset the cashier opening money.
                  </p>
                  <div className="flex flex-wrap gap-3">
                    <button
                      type="button"
                      disabled={isUpdatingCash || !activeShift}
                      onClick={() => {
                        const amount = Math.max(0, Number(cashOverrideAmount) || 0);
                        void handleApplyCashAmount(amount);
                      }}
                      className="rounded-xl bg-blue-700 px-5 py-3 text-sm font-black uppercase tracking-wide text-white hover:bg-blue-800 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {isUpdatingCash ? "Updating..." : "Apply Cash Amount"}
                    </button>
                    <button
                      type="button"
                      disabled={isUpdatingCash || !activeShift}
                      onClick={() => void handleResetCash()}
                      className="rounded-xl border border-red-300 bg-red-50 px-5 py-3 text-sm font-black uppercase tracking-wide text-red-700 hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      Reset Money to PHP 0.00
                    </button>
                    <button
                      type="button"
                      disabled={isUpdatingCash}
                      onClick={() => {
                        void refreshActiveShift().then((shift) => {
                          setCashOverrideAmount(String(shift?.openingBalance ?? cashSettings.defaultFloat));
                        });
                      }}
                      className="rounded-xl border border-slate-300 bg-white px-5 py-3 text-sm font-black uppercase tracking-wide text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      Refresh Cash Status
                    </button>
                  </div>
                </div>
              </div>
            )}

            {activeTab === "security" && (
              <div className="flex flex-col gap-4">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  <div className="flex flex-col gap-1">
                    <label className="text-xs font-semibold" style={{ color: "#6a728a" }}>
                      Session Timeout (minutes)
                    </label>
                    <input
                      type="number"
                      min="5"
                      value={security.sessionTimeoutMinutes}
                      onChange={(event) =>
                        setSecurity((prev) => ({
                          ...prev,
                          sessionTimeoutMinutes: Math.max(5, Number(event.target.value) || 5),
                        }))
                      }
                      className="h-11 rounded-xl px-4 text-sm outline-none"
                      style={{ border: "1px solid #c9cfdb", color: "#001d63" }}
                    />
                  </div>
                  <div
                    className="rounded-xl px-4 py-3 flex items-center gap-3"
                    style={{ background: "rgba(227,242,255,0.78)", border: "1px solid rgba(96,165,250,0.2)" }}
                  >
                    <Bell size={18} color="#0f56d9" />
                    <p className="text-sm font-medium" style={{ color: "#18407f" }}>
                      Security changes affect all future admin sessions.
                    </p>
                  </div>
                </div>
                <ToggleRow
                  label="Require Manager Approval"
                  hint="Critical adjustments and overrides should be approved by a manager."
                  checked={security.requireManagerApproval}
                  onChange={() =>
                    setSecurity((prev) => ({
                      ...prev,
                      requireManagerApproval: !prev.requireManagerApproval,
                    }))
                  }
                />
                <ToggleRow
                  label="Login Audit Trail"
                  hint="Record login attempts and admin actions for later review."
                  checked={security.loginAuditTrail}
                  onChange={() =>
                    setSecurity((prev) => ({
                      ...prev,
                      loginAuditTrail: !prev.loginAuditTrail,
                    }))
                  }
                />
              </div>
            )}
          </div>
        </div>

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
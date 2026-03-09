import React, { useState, useEffect, useRef, useCallback } from "react";
import type { ChangeEvent, FormEvent, KeyboardEvent as ReactKeyboardEvent } from "react";
import { useNavigate } from "react-router-dom";
import {
  Eye,
  EyeOff,
  ChevronDown,
  LoaderCircle,
  LogIn,
  AlertCircle,
  X,
} from "lucide-react";
import bannerLogo from "../assets/banner_logo.png";
import logoOutline from "../assets/logo_outline.png";
import { login } from "../api/auth.js";
import { getStoredRole, isAuthenticated, useAuth } from "../hooks/useAuth";

// --- Types & Constants ---
type AllowedRole = "admin" | "cashier" | "staff" | "omvb_manager";

type FieldErrors = {
  username: boolean;
  password: boolean;
  branch: boolean;
};

const BRANCHES = [
  {
    value: "BMC MAIN",
    label: "BMC MAIN",
    address: "#6A J. Miranda Ave., Concepcion Pequena, Naga City",
  },
  {
    value: "DIVERSION BRANCH",
    label: "DIVERSION BRANCH",
    address: "Roxas Avenue, Diversion Road, Triangulo, Naga City",
  },
  {
    value: "PANGANIBAN BRANCH",
    label: "PANGANIBAN BRANCH",
    address: "Door 11 & 12, Pavilion 7, Panganiban Drive Concepcion Pequena, Naga City",
  },
];

const normalizeRole = (role: string): AllowedRole | "" => {
  const normalized = role.trim().toLowerCase();
  if (normalized === "admin") return "admin";
  if (normalized === "cashier") return "cashier";
  if (normalized === "staff") return "staff";
  if (normalized === "omvb_manager") return "omvb_manager";
  return "";
};

const roleHomePath = (role: string) => {
  switch (normalizeRole(role)) {
    case "admin": return "/admin";
    case "cashier": return "/cashier";
    case "staff": return "/staff";
    case "omvb_manager": return "/inv-manager";
    default: return "/";
  }
};

function LoginPage() {
  const navigate = useNavigate();
  const { login: authLogin } = useAuth();

  // --- States ---
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [branch, setBranch] = useState(() => localStorage.getItem("lastBranch") || "");
  const [currentDateTime, setCurrentDateTime] = useState({ date: "", time: "" });
  const [credentials, setCredentials] = useState({ username: "", password: "" });
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({ username: false, password: false, branch: false });
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  // --- Refs ---
  const usernameRef = useRef<HTMLInputElement | null>(null);
  const passwordRef = useRef<HTMLInputElement | null>(null);
  const formRef = useRef<HTMLFormElement | null>(null);
  const toastTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const selectedBranch = BRANCHES.find((item) => item.value === branch);

  // --- Helper: Toast Notification ---
  const showToast = (message: string) => {
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    setToast(message);
    toastTimerRef.current = setTimeout(() => setToast(null), 4500);
  };

  // --- Effects ---
  useEffect(() => {
    if (isAuthenticated()) {
      navigate(roleHomePath(getStoredRole()), { replace: true });
    }
  }, [navigate]);

  useEffect(() => {
    if (branch) localStorage.setItem("lastBranch", branch);
  }, [branch]);

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
    const tick = () => {
      const now = new Date();
      setCurrentDateTime({
        date: now.toLocaleDateString("en-US", { weekday: "short", month: "long", day: "numeric", year: "numeric" }),
        time: now.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: true }),
      });
    };
    tick();
    const interval = window.setInterval(tick, 1000);
    return () => window.clearInterval(interval);
  }, []);

  // --- Handlers ---
  const handleChange = useCallback((event: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = event.target;
    setCredentials((prev) => ({ ...prev, [name]: value }));
    setFieldErrors((prev) => ({ ...prev, [name as keyof FieldErrors]: false }));
  }, []);

  const handleKeyDown = useCallback((event: ReactKeyboardEvent<HTMLInputElement>, nextRef: React.RefObject<HTMLInputElement | null> | null) => {
    if (event.key !== "Enter") return;
    event.preventDefault();
    if (nextRef?.current) nextRef.current.focus();
    else formRef.current?.requestSubmit();
  }, []);

  const handleLogin = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    
    const errors = {
      branch: !branch,
      username: !credentials.username.trim(),
      password: !credentials.password.trim()
    };
    
    setFieldErrors(errors);

    const missingFields: string[] = [];
    if (errors.branch) missingFields.push("Branch");
    if (errors.username) missingFields.push("User ID");
    if (errors.password) missingFields.push("Password");

    if (missingFields.length > 0) {
      showToast(`Required fields: ${missingFields.join(", ")}`);
      return;
    }

    setIsLoading(true);

    try {
      const response = await login({
        username: credentials.username.trim(),
        password: credentials.password.trim(),
      });

      authLogin(response.access_token, response.role);

      const destination = roleHomePath(response.role);
      if (destination === "/") {
        showToast(`Unsupported role: ${response.role}`);
        return;
      }

      navigate(destination, { replace: true });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Authentication failed. Please try again.";
      showToast(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-linear-to-b from-[#062d8c] from-59% to-[#3266e6] h-screen w-full flex flex-col overflow-hidden">
      <style>{`
        @keyframes toastSlideIn {
          from { transform: translate(-50%, -16px); opacity: 0; }
          to   { transform: translate(-50%, 0);    opacity: 1; }
        }
        .toast-enter { animation: toastSlideIn 0.3s cubic-bezier(0.16,1,0.3,1) forwards; }
      `}</style>

      {/* ── Modern Toast ── */}
      {toast && (
        <div className="toast-enter fixed top-6 left-1/2 z-50 flex items-start gap-3 bg-[#07184a]/90 backdrop-blur-xl border border-red-400/40 rounded-2xl shadow-[0_8px_40px_rgba(0,0,0,0.5)] px-5 py-4 min-w-72 max-w-sm">
          <AlertCircle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
          <p className="text-white/90 text-sm font-medium flex-1 leading-snug">
            {toast}
          </p>
          <button
            type="button"
            onClick={() => setToast(null)}
            className="shrink-0 text-white/40 hover:text-white/90 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* ── Header ── */}
      <header className="flex items-center justify-between px-6 lg:px-50 pt-10 pb-4 shrink-0">
        <div className="h-12 sm:h-14 lg:h-18 w-auto">
          <img alt="Banner Logo" className="h-full w-auto object-contain pointer-events-none" src={bannerLogo} />
        </div>

        <p className="hidden sm:block font-semibold text-base sm:text-lg lg:text-2xl text-[rgba(228,226,226,0.44)] whitespace-nowrap">
          TERMINAL ID: 000
        </p>

        <div className="flex items-center gap-2 sm:gap-3">
          <p className="hidden sm:block font-semibold text-sm sm:text-base text-[rgba(255,255,255,0.6)] whitespace-nowrap">
            STATUS:
          </p>
          <div className={`relative flex gap-2 h-10 sm:h-11 items-center justify-center px-4 rounded-[18px] ${isOnline ? "bg-[#0c8628]" : "bg-[#cc5500]"}`}>
            <div className={`w-2.5 h-2.5 rounded-full ${isOnline ? "bg-[#acf9be]" : "bg-white"}`} />
            <p className="font-semibold text-[#acf9be] text-base sm:text-lg whitespace-nowrap uppercase">
              {isOnline ? "ONLINE" : "OFFLINE"}
            </p>
          </div>
        </div>
      </header>

      <div className="mx-6 lg:mx-50 h-px bg-[#7C7C7C] opacity-90 shrink-0" />

      {/* ── Main Layout ── */}
      <div className="flex-1 flex flex-col px-6 lg:px-50 min-h-0 overflow-hidden">
        <main className="flex flex-col lg:flex-row flex-1 gap-6 py-6 min-h-0">
          
          {/* Left - Branding */}
          <div className="hidden lg:flex lg:w-2/5 items-center justify-center shrink-0">
            <img alt="Logo Outline" className="w-full max-w-[450px] h-auto object-contain pointer-events-none" src={logoOutline} />
          </div>

          {/* Right - Branch & Info */}
          <div className="flex flex-col gap-6 flex-1 justify-center">
            
            {/* Mobile Branding */}
            <div className="flex lg:hidden justify-center shrink-0">
              <img alt="Logo Outline" className="h-48 sm:h-64 w-auto object-contain pointer-events-none opacity-80" src={logoOutline} />
            </div>

            {/* Branch Details */}
            <div className="grid grid-cols-1 sm:grid-cols-3 items-center gap-6">
              <div className="flex flex-col gap-2">
                <p className="font-semibold text-xl sm:text-2xl text-white">BRANCH:</p>
                <div className={`relative bg-[#f4f4f4] flex items-center h-14 px-4 rounded-2xl shadow-lg w-full max-w-xs transition-all border-2 ${fieldErrors.branch ? "border-red-500 ring-2 ring-red-400" : "border-transparent"}`}>
                  <p className={`font-semibold flex-1 text-center truncate ${branch ? "text-[#103182]" : "text-gray-400"}`}>
                    {selectedBranch?.label ?? "Select Branch"}
                  </p>
                  <ChevronDown className="w-5 h-5 text-[#103182]" />
                  <select 
                    value={branch} 
                    onChange={(e) => {
                      setBranch(e.target.value);
                      setFieldErrors(prev => ({ ...prev, branch: false }));
                    }} 
                    className="absolute inset-0 opacity-0 cursor-pointer"
                  >
                    <option value="" disabled>Select Branch</option>
                    {BRANCHES.map((b) => <option key={b.value} value={b.value}>{b.label}</option>)}
                  </select>
                </div>
              </div>

              <div className="sm:col-span-2 text-center sm:text-left">
                <p className="font-semibold text-[#b9e0ff] text-3xl sm:text-4xl lg:text-5xl leading-tight uppercase truncate">
                  {selectedBranch?.label || "NO BRANCH SELECTED"}
                </p>
                <p className="text-[#b9e0ff] text-sm lg:text-base opacity-80 mt-1">
                  {selectedBranch?.address || "Select a branch to continue"}
                </p>
              </div>
            </div>

            {/* Glassmorphic Time/Date Card */}
            <div className="relative bg-[#001445]/50 rounded-3xl border border-white/20 backdrop-blur-xl shadow-2xl p-8 lg:p-12 flex flex-col sm:flex-row gap-6 overflow-hidden">
              <div className="absolute inset-0 bg-linear-to-br from-white/10 to-transparent pointer-events-none rounded-3xl" />
              
              <div className="flex-1 flex flex-col gap-1">
                <span className="font-semibold text-sm tracking-widest text-amber-500/90 uppercase">Current Date:</span>
                <span className="font-semibold text-[#c9d9ff] text-2xl lg:text-3xl whitespace-nowrap">{currentDateTime.date}</span>
              </div>
              
              <div className="hidden sm:block w-px bg-gray-500/50 mx-10 self-stretch" />
              
              <div className="flex-1 flex flex-col gap-1">
                <span className="font-bold text-sm tracking-widest text-amber-500/90 uppercase">Local Time:</span>
                <span className="font-semibold text-[#c9d9ff] text-4xl lg:text-5xl tabular-nums whitespace-nowrap">{currentDateTime.time}</span>
              </div>
            </div>
          </div>
        </main>

        {/* ── Fixed Login Bar ── */}
        <div className="shrink-0 pb-12 lg:pb-16">
          <form ref={formRef} onSubmit={handleLogin} className="relative bg-[#062d8c]/60 rounded-3xl lg:rounded-4xl shadow-2xl p-4 flex flex-col sm:flex-row gap-4 items-stretch">
            
            {/* Username */}
            <div className={`flex items-center bg-[#edeaea] rounded-[20px] h-22 lg:h-25 px-6 gap-4 flex-1 transition-all border-2 ${fieldErrors.username ? "border-red-500 ring-2 ring-red-400" : "border-black"}`}>
              <span className="font-semibold text-[#001d63] text-base lg:text-lg whitespace-nowrap shrink-0">USER ID:</span>
              <div className="w-px h-8 bg-gray-400/60" />
              <input 
                ref={usernameRef}
                name="username"
                type="text"
                value={credentials.username}
                onChange={handleChange}
                onKeyDown={(e) => handleKeyDown(e, passwordRef)}
                className="flex-1 text-xl lg:text-2xl font-medium outline-none text-[#101010] bg-transparent"
                placeholder="Enter User ID"
                autoComplete="username"
                autoFocus
              />
            </div>

            {/* Password */}
            <div className={`flex items-center bg-[#edeaea] rounded-[20px] h-22 lg:h-25 px-6 gap-4 flex-1 transition-all border-2 ${fieldErrors.password ? "border-red-500 ring-2 ring-red-400" : "border-black"}`}>
              <span className="font-semibold text-[#001d63] text-base lg:text-lg whitespace-nowrap shrink-0">PASSWORD:</span>
              <div className="w-px h-8 bg-gray-400/60" />
              <input 
                ref={passwordRef}
                name="password"
                type={showPassword ? "text" : "password"}
                value={credentials.password}
                onChange={handleChange}
                onKeyDown={(e) => handleKeyDown(e, null)}
                className="flex-1 text-xl lg:text-2xl font-medium outline-none text-[#101010] bg-transparent"
                placeholder="••••••••"
                autoComplete="current-password"
              />
              <button 
                type="button" 
                onClick={() => setShowPassword(!showPassword)}
                className="text-gray-500 hover:text-gray-800 transition-colors"
                disabled={isLoading}
              >
                {showPassword ? <EyeOff size={24} /> : <Eye size={24} />}
              </button>
            </div>

            {/* Submit Button */}
            <button 
              type="submit" 
              disabled={isLoading}
              className="bg-[#041848] text-[#cad6f2] h-22 lg:h-25 px-10 rounded-2xl font-bold flex items-center justify-center gap-3 hover:bg-[#052060] transition-all disabled:opacity-50 shadow-xl active:scale-95"
            >
              {isLoading ? (
                <>
                  <LoaderCircle className="animate-spin" />
                  <span className="text-lg">AUTH...</span>
                </>
              ) : (
                <>
                  <span className="text-xl">LOGIN</span>
                  <LogIn size={22} />
                </>
              )}
            </button>
          </form>
        </div>
      </div>

      {/* ── Footer ── */}
      <footer className="shrink-0 pb-4 flex justify-center items-center gap-3 text-[rgba(228,226,226,0.44)] font-semibold text-xs sm:text-sm">
        <p>Core Node v2.4.0</p>
        <div className="w-1.5 h-1.5 bg-white/40 rounded-full" />
        <p>AES-256 Encrypted</p>
      </footer>
    </div>
  );
}

export default LoginPage;
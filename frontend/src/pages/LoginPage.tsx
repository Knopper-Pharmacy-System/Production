import { useState, useEffect, useRef, useCallback } from "react";
import type { ChangeEvent, FormEvent, KeyboardEvent } from "react";
import { useNavigate } from "react-router-dom";
import { Eye, EyeOff, ChevronDown, LoaderCircle, LogIn, AlertCircle, X } from "lucide-react";
import bannerLogo from "../assets/banner_logo.png";
import logoOutline from "../assets/logo_outline.png";
import { login } from "../api/auth.js";
import { getStoredRole, isAuthenticated, useAuth } from "../hooks/useAuth";

type AllowedRole = "admin" | "cashier" | "staff" | "omvb_manager";

type FieldErrors = {
  branch: boolean;
  username: boolean;
  password: boolean;
};

const BRANCHES = [
  {
    value: "BMC MAIN",
    label: "BMC MAIN",
    address: "#6A J. Miranda Ave., Concepcion Pequeña, Naga City",
  },
  {
    value: "DIVERSION BRANCH",
    label: "DIVERSION BRANCH",
    address: "Roxas Avenue, Diversion Road, Triangulo, Naga City",
  },
  {
    value: "PANGANIBAN BRANCH",
    label: "PANGANIBAN BRANCH",
    address: "Door 11 & 12, Pavilion 7, Panganiban Drive Concepcion Pequeña, Naga City",
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
    case "admin":
      return "/admin";
    case "cashier":
      return "/cashier";
    case "staff":
      return "/staff";
    case "omvb_manager":
      return "/inv-manager";
    default:
      return "/";
  }
};

function LoginPage() {
  const navigate = useNavigate();
  const { login: authLogin } = useAuth();

  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [branch, setBranch] = useState(() => localStorage.getItem("lastBranch") || "");
  const [currentDateTime, setCurrentDateTime] = useState({ date: "", time: "" });
  const [credentials, setCredentials] = useState({ username: "", password: "" });
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({ branch: false, username: false, password: false });
  const [toast, setToast] = useState<string | null>(null);
  const toastTimerRef = useRef<number | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const usernameRef = useRef<HTMLInputElement | null>(null);
  const passwordRef = useRef<HTMLInputElement | null>(null);
  const formRef = useRef<HTMLFormElement | null>(null);

  const selectedBranch = BRANCHES.find((item) => item.value === branch);

  const showToast = useCallback((message: string) => {
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    setToast(message);
    toastTimerRef.current = setTimeout(() => setToast(null), 4500);
  }, []);

  useEffect(() => {
    return () => {
      if (toastTimerRef.current) {
        clearTimeout(toastTimerRef.current);
        toastTimerRef.current = null;
      }
    };
  }, []);

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
    const formatDateTime = () => {
      const now = new Date();
      return {
        date: now.toLocaleDateString("en-US", {
          weekday: "short",
          month: "long",
          day: "numeric",
          year: "numeric",
        }),
        time: now.toLocaleTimeString("en-US", {
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
          hour12: true,
        }),
      };
    };

    setCurrentDateTime(formatDateTime());
    const interval = window.setInterval(() => setCurrentDateTime(formatDateTime()), 1000);
    return () => window.clearInterval(interval);
  }, []);

  const handleChange = useCallback(
    (event: ChangeEvent<HTMLInputElement>) => {
      const { name, value } = event.target;
      setCredentials((prev) => ({ ...prev, [name]: value }));
      const key = name as keyof FieldErrors;
      if (fieldErrors[key]) {
        setFieldErrors((prev) => ({ ...prev, [key]: false }));
      }
    },
    [fieldErrors],
  );

  const handleKeyDown = useCallback(
    (event: KeyboardEvent<HTMLInputElement>, nextRef: React.RefObject<HTMLInputElement | null> | null) => {
      if (event.key !== "Enter") return;
      event.preventDefault();
      if (nextRef?.current) {
        nextRef.current.focus();
      } else {
        formRef.current?.requestSubmit();
      }
    },
    [],
  );

  const validateForm = useCallback(() => {
    const trimmedUsername = credentials.username.trim();
    const trimmedPassword = credentials.password.trim();
    const errors: FieldErrors = { branch: !branch, username: !trimmedUsername, password: !trimmedPassword };

    setFieldErrors(errors);
    return !errors.branch && !errors.username && !errors.password;
  }, [credentials, branch]);

  const handleLogin = useCallback(async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setFieldErrors({ branch: false, username: false, password: false });

    if (!validateForm()) {
      const missing = [];
      if (!branch) missing.push("Branch");
      if (!credentials.username.trim()) missing.push("User ID");
      if (!credentials.password.trim()) missing.push("Password");
      showToast(`Required field${missing.length > 1 ? "s" : ""}: ${missing.join(", ")}`);
      return;
    }

    setIsLoading(true);

    try {
      console.log("[LOGIN] Attempting with username:", credentials.username.trim());

      const data = await login({
        username: credentials.username.trim(),
        password: credentials.password.trim(),
      });

      console.log("[LOGIN] Success - received:", { role: data.role });

      // Save token and role
      authLogin(data.access_token, data.role);

      const destination = roleHomePath(data.role);
      if (destination === "/") {
        showToast(`Unsupported role: ${data.role || "unknown"}`);
        return;
      }

      showToast("Login successful!");
      navigate(destination, { replace: true });
    } catch (err: any) {
      console.error("[LOGIN] Failed:", err);

      let message = "Authentication failed. Please try again.";
      if (err.message.includes("401") || err.message.includes("Invalid")) {
        message = "Invalid username or password";
      } else if (err.message.includes("fetch") || err.message.includes("network")) {
        message = "Cannot reach server. Login online first for offline access.";
      } else if (err.message) {
        message = err.message;
      }

      showToast(message);
    } finally {
      setIsLoading(false);
    }
  }, [authLogin, credentials, navigate, validateForm, branch, showToast]);

  const getInputClasses = (error: boolean) =>
    `flex items-center bg-[#edeaea] border-2 ${
      error ? "border-red-500 ring-2 ring-red-400" : "border-transparent"
    } rounded-xl sm:rounded-2xl shadow-[0_0_20px_2px_rgba(0,0,0,0.25)] h-16 sm:h-20 px-4 sm:px-6 gap-3 flex-1 min-w-0 transition-all duration-200`;

  return (
    <div
      className="bg-gradient-to-b from-[#062d8c] from-[59%] to-[#3266e6] min-h-screen w-full flex flex-col overflow-x-hidden"
      data-name="newest login"
    >
      <style>{`
        @keyframes toastSlideIn {
          from { transform: translateY(-16px); opacity: 0; }
          to   { transform: translateY(0);    opacity: 1; }
        }
        .toast-enter { animation: toastSlideIn 0.3s cubic-bezier(0.16,1,0.3,1) forwards; }
      `}</style>

      {/* ── Modern Toast ── */}
      {toast && (
        <div className="toast-enter fixed top-6 left-1/2 -translate-x-1/2 z-50 flex items-start gap-3 bg-[#07184a]/90 backdrop-blur-xl border border-red-400/40 rounded-2xl shadow-[0_8px_40px_rgba(0,0,0,0.5)] px-5 py-4 min-w-72 max-w-sm">
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
      <header className="flex items-center justify-between px-4 sm:px-6 lg:px-12 pt-10 sm:pt-14 pb-4 shrink-0">
        <div className="h-10 sm:h-12 lg:h-16 w-auto">
          <img alt="Banner Logo" className="h-full w-auto object-contain pointer-events-none" src={bannerLogo} />
        </div>

        <p className="hidden md:block font-semibold text-base lg:text-xl text-[rgba(228,226,226,0.44)] whitespace-nowrap">
          TERMINAL ID: 000
        </p>

        <div className="flex items-center gap-2 sm:gap-3">
          <p className="hidden sm:block font-semibold text-sm sm:text-base text-[rgba(255,255,255,0.6)] whitespace-nowrap">
            STATUS:
          </p>
          <div
            className={`relative flex gap-2 h-9 sm:h-10 items-center justify-center px-3 sm:px-4 rounded-xl sm:rounded-2xl ${
              isOnline ? "bg-[#0c8628]" : "bg-[#cc5500]"
            }`}
          >
            <div className="absolute border border-[#062d8c] inset-0 pointer-events-none rounded-xl sm:rounded-2xl shadow-[0_0_40px_rgba(3,31,99,0.1)]" />
            <div className={`w-2.5 h-2.5 rounded-full ${isOnline ? "bg-[#acf9be]" : "bg-white"}`} />
            <p className="font-semibold text-[#acf9be] text-sm sm:text-base whitespace-nowrap">
              {isOnline ? "ONLINE" : "OFFLINE"}
            </p>
          </div>
        </div>
      </header>

      <div className="mx-4 sm:mx-6 lg:mx-12 h-px bg-[#7C7C7C]/90 shrink-0" />

      <div className="flex-1 flex flex-col px-4 sm:px-6 lg:px-12 min-h-0">
        <main className="flex flex-col lg:flex-row flex-1 gap-6 py-6 min-h-0">
          <div className="hidden lg:flex lg:w-2/5 items-center justify-center shrink-0">
            <img alt="Logo Outline" className="w-full max-w-[420px] h-auto object-contain pointer-events-none" src={logoOutline} />
          </div>

          <div className="flex flex-col gap-5 flex-1 justify-center">
            <div className="flex lg:hidden justify-center pb-4">
              <img alt="Logo Outline" className="h-48 sm:h-64 w-auto object-contain pointer-events-none opacity-80" src={logoOutline} />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 items-start sm:items-center gap-4 sm:gap-6">
              <div className="flex flex-col gap-2 sm:col-span-1">
                <p className="font-semibold text-xl sm:text-2xl text-white">BRANCH:</p>
                <div className={`relative bg-[#f4f4f4] flex items-center gap-2 h-12 sm:h-14 px-4 rounded-2xl shadow-[0_0_40px_rgba(3,31,99,0.25)] cursor-pointer w-full max-w-sm transition-shadow ${fieldErrors.branch ? "ring-2 ring-red-400" : ""}`}>
                  <p
                    className={`font-semibold text-base sm:text-lg truncate flex-1 text-center ${
                      branch ? "text-[#103182]" : fieldErrors.branch ? "text-red-400" : "text-gray-500"
                    }`}
                  >
                    {selectedBranch?.label ?? "Select Branch"}
                  </p>
                  <ChevronDown className={`text-[#103182] w-5 h-5 shrink-0 ${fieldErrors.branch ? "text-red-400" : ""}`} />
                  <select
                    value={branch}
                    onChange={(event) => {
                      setBranch(event.target.value);
                      setFieldErrors((prev) => ({ ...prev, branch: false }));
                    }}
                    className="absolute inset-0 opacity-0 cursor-pointer"
                  >
                    <option value="" disabled>
                      Select Branch
                    </option>
                    {BRANCHES.map((item) => (
                      <option key={item.value} value={item.value}>
                        {item.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="sm:col-span-2 flex flex-col gap-1 items-center sm:items-start text-center sm:text-left">
                <p className="font-semibold text-[#b9e0ff] text-2xl sm:text-3xl lg:text-5xl leading-tight">
                  {selectedBranch?.label || "NO BRANCH SELECTED"}
                </p>
                <p className="text-[#b9e0ff] text-sm sm:text-base opacity-80 max-w-prose">
                  {selectedBranch?.address || "Select a branch to continue"}
                </p>
              </div>
            </div>

            <div className="relative bg-[#001445]/50 rounded-3xl border border-white/20 backdrop-blur-xl shadow-[0_8px_32px_rgba(0,20,69,0.6)] ring-1 ring-white/10 p-6 sm:p-8 lg:p-10 flex flex-col sm:flex-row gap-6">
              <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent pointer-events-none rounded-3xl" />
              <div className="flex-1 flex flex-col gap-1">
                <span className="font-semibold text-sm tracking-wider text-[rgba(190,140,0,0.85)]">CURRENT DATE</span>
                <span className="font-semibold text-[#c9d9ff] text-xl sm:text-2xl lg:text-3xl">{currentDateTime.date}</span>
              </div>
              <div className="hidden sm:block w-px bg-gray-500/50 mx-6 lg:mx-10 self-stretch" />
              <div className="block sm:hidden h-px bg-gray-500/50 my-4" />
              <div className="flex-1 flex flex-col gap-1">
                <span className="font-bold text-sm tracking-wider text-[rgba(190,140,0,0.85)]">LOCAL TIME</span>
                <span className="font-semibold text-[#c9d9ff] text-2xl sm:text-3xl lg:text-4xl tabular-nums">{currentDateTime.time}</span>
              </div>
            </div>
          </div>
        </main>

        <div className="shrink-0 pb-12 sm:pb-16 lg:pb-20">
          <form
            ref={formRef}
            onSubmit={handleLogin}
            className="relative bg-[rgba(6,45,140,0.58)] rounded-2xl sm:rounded-3xl shadow-[0_0_30px_20px_rgba(6,45,140,0.71)] p-4 sm:p-5 flex flex-col sm:flex-row gap-4 items-start"
          >
            <fieldset disabled={isLoading} className="contents">
              <div className="flex-1 min-w-0 relative">
                <div className={getInputClasses(fieldErrors.username)}>
                  <span className="font-semibold text-[#001d63] text-base sm:text-lg whitespace-nowrap shrink-0">USER ID</span>
                  <div className="w-px h-8 bg-[#606060]/60 shrink-0" />
                  <input
                    ref={usernameRef}
                    type="text"
                    name="username"
                    value={credentials.username}
                    onChange={handleChange}
                    onKeyDown={(event) => handleKeyDown(event, passwordRef)}
                    className="flex-1 min-w-0 font-normal text-[#101010] text-base sm:text-lg lg:text-xl bg-transparent border-none outline-none placeholder:text-gray-500"
                    placeholder=""
                    autoComplete="username"
                    autoFocus
                  />
                </div>
              </div>

              <div className="flex-1 min-w-0 relative">
                <div className={getInputClasses(fieldErrors.password)}>
                  <span className="font-semibold text-[#001d63] text-base sm:text-lg whitespace-nowrap shrink-0">PASSWORD</span>
                  <div className="w-px h-8 bg-[#606060]/60 shrink-0" />
                  <input
                    ref={passwordRef}
                    type={showPassword ? "text" : "password"}
                    name="password"
                    value={credentials.password}
                    onChange={handleChange}
                    onKeyDown={(event) => handleKeyDown(event, null)}
                    className="flex-1 min-w-0 font-normal text-[#101010] text-base sm:text-lg lg:text-xl bg-transparent border-none outline-none placeholder:text-gray-500"
                    placeholder=""
                    autoComplete="current-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((prev) => !prev)}
                    className="shrink-0 p-1 text-gray-600 hover:text-gray-800 transition-colors disabled:opacity-50"
                    disabled={isLoading}
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? <EyeOff size={22} /> : <Eye size={22} />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="relative bg-[#041848] flex items-center justify-center gap-2.5 h-16 sm:h-20 px-6 sm:px-8 rounded-xl sm:rounded-2xl hover:bg-[#052060] active:bg-[#031030] transition-colors w-full sm:w-56 shrink-0 shadow-md disabled:opacity-70 disabled:cursor-not-allowed mt-0"
              >
                <div className="absolute inset-0 border border-[rgba(195,195,195,0.26)] rounded-xl sm:rounded-2xl shadow-[0_0_20px_rgba(0,0,0,0.44)] pointer-events-none" />
                <span className="relative font-semibold text-[#cad6f2] text-base sm:text-lg whitespace-nowrap flex items-center gap-2">
                  {isLoading ? (
                    <>
                      <LoaderCircle className="animate-spin w-5 h-5" />
                      AUTHENTICATING...
                    </>
                  ) : (
                    <>
                      LOGIN <LogIn size={20} />
                    </>
                  )}
                </span>
              </button>
            </fieldset>
          </form>
        </div>
      </div>

      <footer className="shrink-0 pb-4 px-4 sm:px-6 lg:px-12 flex items-center justify-center gap-3 text-center">
        <p className="font-semibold text-xs sm:text-sm text-[rgba(228,226,226,0.44)]">Core Node v2.4.0</p>
        <div className="w-1.5 h-1.5 bg-[#E4E2E2] opacity-40 rounded-full hidden sm:block" />
        <p className="font-semibold text-xs sm:text-sm text-[rgba(228,226,226,0.44)]">AES-256 Encrypted</p>
      </footer>
    </div>
  );
}

export default LoginPage;
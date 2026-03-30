import { useState, useEffect, useRef, useCallback } from "react";
import type { ChangeEvent, FormEvent, KeyboardEvent } from "react";
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
import banner from "../assets/banner.png";
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
    address:
      "Door 11 & 12, Pavilion 7, Panganiban Drive Concepcion Pequeña, Naga City",
  },
];

const normalizeRole = (role: string): AllowedRole | "" => {
  const n = role.trim().toLowerCase();
  if (n === "admin") return "admin";
  if (n === "cashier") return "cashier";
  if (n === "staff") return "staff";
  if (n === "omvb_manager") return "omvb_manager";
  return "";
};

const roleHomePath = (role: string) => {
  switch (normalizeRole(role)) {
    case "admin":
      return "/admin";
    case "cashier":
      return "/pos";
    case "staff":
      return "/staff";
    case "omvb_manager":
      return "/inv-manager";
    default:
      return "/";
  }
};

// ── Icon components ───────────────────────────────────────────────────────────

function UserIcon() {
  return (
    <svg
      width="22"
      height="25"
      viewBox="0 0 22.5 25"
      fill="none"
      className="shrink-0"
    >
      <path
        d="M11.25 12.5C14.7 12.5 17.5 9.7 17.5 6.25C17.5 2.8 14.7 0 11.25 0C7.8 0 5 2.8 5 6.25C5 9.7 7.8 12.5 11.25 12.5ZM11.25 15.625C7.5 15.625 0 17.5 0 21.25V25H22.5V21.25C22.5 17.5 15 15.625 11.25 15.625Z"
        fill="#103182"
        fillOpacity="0.9"
      />
    </svg>
  );
}

function LockIcon() {
  return (
    <svg
      width="20"
      height="26"
      viewBox="0 0 20 26.25"
      fill="none"
      className="shrink-0"
    >
      <path
        d="M10 0C6.55 0 3.75 2.8 3.75 6.25V8.75H2.5C1.125 8.75 0 9.875 0 11.25V23.75C0 25.125 1.125 26.25 2.5 26.25H17.5C18.875 26.25 20 25.125 20 23.75V11.25C20 9.875 18.875 8.75 17.5 8.75H16.25V6.25C16.25 2.8 13.45 0 10 0ZM10 3.125C11.725 3.125 13.125 4.525 13.125 6.25V8.75H6.875V6.25C6.875 4.525 8.275 3.125 10 3.125ZM10 14.375C11.375 14.375 12.5 15.5 12.5 16.875C12.5 18.25 11.375 19.375 10 19.375C8.625 19.375 7.5 18.25 7.5 16.875C7.5 15.5 8.625 14.375 10 14.375Z"
        fill="#103182"
        fillOpacity="0.9"
      />
    </svg>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

function LoginPage() {
  const navigate = useNavigate();
  const { login: authLogin } = useAuth();

  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [branch, setBranch] = useState(
    () => localStorage.getItem("lastBranch") || "",
  );
  const [currentDateTime, setCurrentDateTime] = useState({
    date: "",
    time: "",
  });
  const [credentials, setCredentials] = useState({
    username: "",
    password: "",
  });
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({
    branch: false,
    username: false,
    password: false,
  });
  const [toast, setToast] = useState<string | null>(null);
  const toastTimerRef = useRef<number | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const usernameRef = useRef<HTMLInputElement | null>(null);
  const passwordRef = useRef<HTMLInputElement | null>(null);
  const mobileFormRef = useRef<HTMLFormElement | null>(null);
  const desktopFormRef = useRef<HTMLFormElement | null>(null);

  const selectedBranch = BRANCHES.find((b) => b.value === branch);

  // ── Toast ─────────────────────────────────────────────────────────────────

  const showToast = useCallback((message: string) => {
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    setToast(message);
    toastTimerRef.current = window.setTimeout(() => setToast(null), 4500);
  }, []);

  useEffect(
    () => () => {
      if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    },
    [],
  );

  // ── Effects ───────────────────────────────────────────────────────────────

  useEffect(() => {
    if (isAuthenticated())
      navigate(roleHomePath(getStoredRole()), { replace: true });
  }, [navigate]);

  useEffect(() => {
    if (branch) localStorage.setItem("lastBranch", branch);
  }, [branch]);

  useEffect(() => {
    const handle = () => setIsOnline(navigator.onLine);
    window.addEventListener("online", handle);
    window.addEventListener("offline", handle);
    return () => {
      window.removeEventListener("online", handle);
      window.removeEventListener("offline", handle);
    };
  }, []);

  useEffect(() => {
    const fmt = () => {
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
    setCurrentDateTime(fmt());
    const id = window.setInterval(() => setCurrentDateTime(fmt()), 1000);
    return () => window.clearInterval(id);
  }, []);

  // ── Handlers ──────────────────────────────────────────────────────────────

  const handleChange = useCallback(
    (e: ChangeEvent<HTMLInputElement>) => {
      const { name, value } = e.target;
      setCredentials((p) => ({ ...p, [name]: value }));
      const key = name as keyof FieldErrors;
      if (fieldErrors[key]) setFieldErrors((p) => ({ ...p, [key]: false }));
    },
    [fieldErrors],
  );

  const handleKeyDown = useCallback(
    (
      e: KeyboardEvent<HTMLInputElement>,
      nextRef: React.RefObject<HTMLInputElement | null> | null,
      formRef: React.RefObject<HTMLFormElement | null>,
    ) => {
      if (e.key !== "Enter") return;
      e.preventDefault();
      if (nextRef?.current) nextRef.current.focus();
      else formRef.current?.requestSubmit();
    },
    [],
  );

  const isMobile = () => window.innerWidth < 1024;

  const validateForm = useCallback(() => {
    const mobile = isMobile();
    const errors: FieldErrors = {
      branch: !mobile && !branch,
      username: !credentials.username.trim(),
      password: !credentials.password.trim(),
    };
    setFieldErrors(errors);
    return !errors.branch && !errors.username && !errors.password;
  }, [credentials, branch]);

  const handleLogin = useCallback(
    async (e: FormEvent<HTMLFormElement>) => {
      e.preventDefault();
      setFieldErrors({ branch: false, username: false, password: false });

      if (!validateForm()) {
        const mobile = isMobile();
        const missing: string[] = [];
        if (!mobile && !branch) missing.push("Branch");
        if (!credentials.username.trim()) missing.push("User ID");
        if (!credentials.password.trim()) missing.push("Password");
        showToast(
          `Required field${missing.length > 1 ? "s" : ""}: ${missing.join(", ")}`,
        );
        return;
      }

      setIsLoading(true);
      try {
        const data = await login({
          username: credentials.username.trim(),
          password: credentials.password.trim(),
        });
        authLogin(data.access_token, data.role, credentials.password.trim());
        localStorage.setItem("cashier_username", credentials.username.trim());
        const dest = roleHomePath(data.role);
        if (dest === "/") {
          showToast(`Unsupported role: ${data.role || "unknown"}`);
          return;
        }
        showToast("Login successful!");
        navigate(dest, { replace: true });
      } catch (err: any) {
        let msg = "Authentication failed. Please try again.";
        if (err.message?.includes("401") || err.message?.includes("Invalid"))
          msg = "Invalid username or password";
        else if (
          err.message?.includes("fetch") ||
          err.message?.includes("network")
        )
          msg = "Cannot reach server. Login online first for offline access.";
        else if (err.message) msg = err.message;
        showToast(msg);
      } finally {
        setIsLoading(false);
      }
    },
    [authLogin, credentials, navigate, validateForm, branch, showToast],
  );

  // Desktop input pill class
  const deskInput = (err: boolean) =>
    `flex items-center bg-[#edeaea] border-2 ${
      err ? "border-red-500 ring-2 ring-red-400" : "border-transparent"
    } rounded-2xl shadow-[0_0_20px_2px_rgba(0,0,0,0.25)] h-20 px-6 gap-3 flex-1 min-w-0 transition-all duration-200`;

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <>
      <style>{`
        @keyframes toastSlideIn {
          from { transform: translateY(-14px) translateX(-50%); opacity: 0; }
          to   { transform: translateY(0)     translateX(-50%); opacity: 1; }
        }
        .toast-in  { animation: toastSlideIn 0.3s cubic-bezier(0.16,1,0.3,1) forwards; }

        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(18px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .page-in { animation: fadeUp 0.45s cubic-bezier(0.16,1,0.3,1) both; }
      `}</style>

      {/* Shared toast */}
      {toast && (
        <div
          className="toast-in fixed top-6 left-1/2 z-50 flex items-start gap-3 backdrop-blur-xl border border-red-400/40 rounded-2xl shadow-[0_8px_40px_rgba(0,0,0,0.5)] px-5 py-4 min-w-68 max-w-88"
          style={{ background: "rgba(7,24,74,0.95)" }}
        >
          <AlertCircle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
          <p className="text-white/90 text-sm font-medium flex-1 leading-snug">
            {toast}
          </p>
          <button
            type="button"
            onClick={() => setToast(null)}
            className="shrink-0 text-white/40 hover:text-white/90 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* ════════════════════════════════════════════════════════════
          MOBILE  (< lg)  —  exact Figma layout
      ════════════════════════════════════════════════════════════ */}
      <div
        className="page-in lg:hidden relative min-h-screen w-full flex flex-col"
        style={{
          background: "linear-gradient(180deg, #062d8c 40%, #3266e6 100%)",
        }}
      >
        {/* ONLINE pill — floating top-right, no header */}
        <div className="absolute top-5 right-5 z-10">
          <div
            className="flex items-center gap-2 px-4 py-1.75 rounded-full border border-[#062d8c]"
            style={{ background: isOnline ? "#0c8628" : "#cc5500" }}
          >
            <div
              className={`w-2.25 h-2.25 rounded-full ${isOnline ? "bg-[#acf9be]" : "bg-white"}`}
            />
            <span
              className="font-semibold text-[11px] tracking-wide"
              style={{
                color: isOnline ? "#acf9be" : "white",
                fontFamily: "'Inter', sans-serif",
              }}
            >
              {isOnline ? "ONLINE" : "OFFLINE"}
            </span>
          </div>
        </div>

        {/* Logo area — shield then "knopper YOUR BETTER OPTION" */}
        <div className="flex flex-col items-center pt-14 pb-0 px-6 select-none">
          <img
            src={logoOutline}
            alt="Knopper Logo"
            className="pointer-events-none"
            style={{ width: "260px", height: "auto" }}
          />
          <img
            src={banner}
            alt="Knopper"
            className="pointer-events-none mt-3"
            style={{ width: "260px", height: "auto" }}
          />
        </div>

        {/* Form */}
        <form
          ref={mobileFormRef}
          onSubmit={handleLogin}
          className="flex flex-col flex-1 px-6 pt-8 pb-6"
        >
          <fieldset disabled={isLoading} className="contents">
            {/* USER ID field */}
            <div className="flex flex-col gap-1.75 mb-4.5">
              <label
                className="font-semibold text-[15px] tracking-wide"
                style={{ color: "#b9e0ff", fontFamily: "'Inter', sans-serif" }}
              >
                USER ID:
              </label>
              <div
                className="flex items-center overflow-hidden transition-all"
                style={{
                  background: "#edeaea",
                  border: fieldErrors.username
                    ? "2px solid #ef4444"
                    : "2px solid transparent",
                  borderRadius: "16px",
                  height: "66px",
                  boxShadow: "0 2px 24px rgba(0,0,0,0.28)",
                }}
              >
                <div className="flex items-center justify-center shrink-0 pl-5 pr-3">
                  <UserIcon />
                </div>
                <div
                  className="shrink-0 self-stretch my-3.5 w-px"
                  style={{ background: "rgba(96,96,96,0.5)" }}
                />
                <input
                  ref={usernameRef}
                  type="text"
                  name="username"
                  value={credentials.username}
                  onChange={handleChange}
                  onKeyDown={(e) =>
                    handleKeyDown(e, passwordRef, mobileFormRef)
                  }
                  autoComplete="username"
                  autoFocus
                  className="flex-1 min-w-0 bg-transparent border-none outline-none px-4 text-[#101010]"
                  style={{
                    fontSize: "17px",
                    fontFamily: "'Inter', sans-serif",
                  }}
                />
              </div>
            </div>

            {/* PASSWORD field */}
            <div className="flex flex-col gap-1.75 mb-8">
              <label
                className="font-semibold text-[15px] tracking-wide"
                style={{ color: "#b9e0ff", fontFamily: "'Inter', sans-serif" }}
              >
                PASSWORD:
              </label>
              <div
                className="flex items-center overflow-hidden transition-all"
                style={{
                  background: "#edeaea",
                  border: fieldErrors.password
                    ? "2px solid #ef4444"
                    : "2px solid transparent",
                  borderRadius: "16px",
                  height: "66px",
                  boxShadow: "0 2px 24px rgba(0,0,0,0.28)",
                }}
              >
                <div className="flex items-center justify-center shrink-0 pl-5 pr-3">
                  <LockIcon />
                </div>
                <div
                  className="shrink-0 self-stretch my-3.5 w-px"
                  style={{ background: "rgba(96,96,96,0.5)" }}
                />
                <input
                  ref={passwordRef}
                  type={showPassword ? "text" : "password"}
                  name="password"
                  value={credentials.password}
                  onChange={handleChange}
                  onKeyDown={(e) => handleKeyDown(e, null, mobileFormRef)}
                  autoComplete="current-password"
                  className="flex-1 min-w-0 bg-transparent border-none outline-none px-4 text-[#101010]"
                  style={{
                    fontSize: "17px",
                    fontFamily: "'Inter', sans-serif",
                  }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((p) => !p)}
                  className="shrink-0 pr-4 pl-2 text-gray-500 hover:text-gray-700 transition-colors"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
            </div>

            {/* LOGIN → button — centered, fixed width matching Figma */}
            <div className="flex justify-center">
              <button
                type="submit"
                disabled={isLoading}
                className="flex items-center justify-center transition-opacity hover:opacity-90 active:opacity-75 disabled:opacity-60 disabled:cursor-not-allowed"
                style={{
                  background: "#041848",
                  border: "1px solid rgba(195,195,195,0.26)",
                  borderRadius: "18px",
                  boxShadow: "0 4px 28px rgba(0,0,0,0.5)",
                  height: "65px",
                  width: "182px",
                }}
              >
                <span
                  className="font-semibold flex items-center gap-2"
                  style={{
                    color: "#cad6f2",
                    fontSize: "20px",
                    fontFamily: "'Inter', sans-serif",
                  }}
                >
                  {isLoading ? (
                    <>
                      <LoaderCircle className="animate-spin w-5 h-5" />
                      <span style={{ fontSize: "14px" }}>
                        AUTHENTICATING...
                      </span>
                    </>
                  ) : (
                    "LOGIN \u2192"
                  )}
                </span>
              </button>
            </div>
          </fieldset>

          {/* Flex spacer to pin footer at bottom */}
          <div className="flex-1" />

          {/* Footer */}
          <div className="flex items-center justify-center gap-3 pt-6 pb-1">
            <span
              className="font-semibold text-[12px]"
              style={{
                color: "rgba(228,226,226,0.44)",
                fontFamily: "'Inter', sans-serif",
              }}
            >
              Core Node v2.4.0
            </span>
            <div className="w-1.5 h-1.5 rounded-full bg-[#E4E2E2] opacity-40" />
            <span
              className="font-semibold text-[12px]"
              style={{
                color: "rgba(228,226,226,0.44)",
                fontFamily: "'Inter', sans-serif",
              }}
            >
              AES-256 Encrypted
            </span>
          </div>
        </form>
      </div>

      {/* ════════════════════════════════════════════════════════════
          DESKTOP  (≥ lg)
      ════════════════════════════════════════════════════════════ */}
      <div
        className="page-in hidden lg:flex min-h-screen w-full flex-col overflow-x-hidden"
        style={{
          background: "linear-gradient(180deg, #062d8c 59%, #3266e6 100%)",
        }}
      >
        {/* Header */}
        <header className="flex items-center justify-between px-12 pt-14 pb-4 shrink-0">
          <div className="h-16 w-auto">
            <img
              alt="Banner Logo"
              className="h-full w-auto object-contain pointer-events-none"
              src={bannerLogo}
            />
          </div>
          <p className="font-semibold text-xl text-[rgba(228,226,226,0.44)] whitespace-nowrap">
            TERMINAL ID: 000
          </p>
          <div className="flex items-center gap-3">
            <p className="font-semibold text-base text-[rgba(255,255,255,0.6)] whitespace-nowrap">
              STATUS:
            </p>
            <div
              className={`relative flex gap-2 h-10 items-center justify-center px-4 rounded-2xl ${isOnline ? "bg-[#0c8628]" : "bg-[#cc5500]"}`}
            >
              <div className="absolute border border-[#062d8c] inset-0 pointer-events-none rounded-2xl shadow-[0_0_40px_rgba(3,31,99,0.1)]" />
              <div
                className={`w-2.5 h-2.5 rounded-full ${isOnline ? "bg-[#acf9be]" : "bg-white"}`}
              />
              <p className="font-semibold text-[#acf9be] text-base whitespace-nowrap">
                {isOnline ? "ONLINE" : "OFFLINE"}
              </p>
            </div>
          </div>
        </header>

        {/* Divider */}
        <div className="mx-12 h-px bg-[#7C7C7C]/90 shrink-0" />

        {/* Body */}
        <div className="flex-1 flex flex-col px-12 min-h-0">
          <main className="flex flex-row flex-1 gap-6 py-6 min-h-0">
            {/* Left — shield logo */}
            <div className="flex w-2/5 items-center justify-center shrink-0">
              <img
                alt="Logo Outline"
                className="w-full max-w-104 h-auto object-contain pointer-events-none"
                src={logoOutline}
              />
            </div>

            {/* Right — branch info + date/time */}
            <div className="flex flex-col gap-5 flex-1 justify-center">
              {/* Branch selector + address */}
              <div className="grid grid-cols-3 items-center gap-6">
                <div className="flex flex-col gap-2 col-span-1">
                  <p className="font-semibold text-2xl text-white">BRANCH:</p>
                  <div
                    className={`relative bg-[#f4f4f4] flex items-center gap-2 h-14 px-4 rounded-2xl shadow-[0_0_40px_rgba(3,31,99,0.25)] cursor-pointer w-full max-w-sm transition-shadow ${fieldErrors.branch ? "ring-2 ring-red-400" : ""}`}
                  >
                    <p
                      className={`font-semibold text-lg truncate flex-1 text-center ${branch ? "text-[#103182]" : fieldErrors.branch ? "text-red-400" : "text-gray-500"}`}
                    >
                      {selectedBranch?.label ?? "Select Branch"}
                    </p>
                    <ChevronDown
                      className={`w-5 h-5 shrink-0 ${fieldErrors.branch ? "text-red-400" : "text-[#103182]"}`}
                    />
                    <select
                      value={branch}
                      onChange={(e) => {
                        setBranch(e.target.value);
                        setFieldErrors((p) => ({ ...p, branch: false }));
                      }}
                      className="absolute inset-0 opacity-0 cursor-pointer"
                    >
                      <option value="" disabled>
                        Select Branch
                      </option>
                      {BRANCHES.map((b) => (
                        <option key={b.value} value={b.value}>
                          {b.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
                <div className="col-span-2 flex flex-col gap-1">
                  <p className="font-semibold text-[#b9e0ff] text-5xl leading-tight">
                    {selectedBranch?.label || "NO BRANCH SELECTED"}
                  </p>
                  <p className="text-[#b9e0ff] text-base opacity-80 max-w-prose">
                    {selectedBranch?.address || "Select a branch to continue"}
                  </p>
                </div>
              </div>

              {/* Date / time card */}
              <div className="relative bg-[#001445]/50 rounded-3xl border border-white/20 backdrop-blur-xl shadow-[0_8px_32px_rgba(0,20,69,0.6)] ring-1 ring-white/10 p-10 flex flex-row">
                <div className="absolute inset-0 bg-linear-to-br from-white/10 to-transparent pointer-events-none rounded-3xl" />
                <div className="flex-1 flex flex-col gap-1">
                  <span className="font-semibold text-sm tracking-wider text-[rgba(190,140,0,0.85)]">
                    CURRENT DATE
                  </span>
                  <span className="font-semibold text-[#c9d9ff] text-3xl">
                    {currentDateTime.date}
                  </span>
                </div>
                <div className="w-px bg-gray-500/50 mx-10 self-stretch" />
                <div className="flex-1 flex flex-col gap-1">
                  <span className="font-bold text-sm tracking-wider text-[rgba(190,140,0,0.85)]">
                    LOCAL TIME
                  </span>
                  <span className="font-semibold text-[#c9d9ff] text-4xl tabular-nums">
                    {currentDateTime.time}
                  </span>
                </div>
              </div>
            </div>
          </main>

          {/* Desktop login form */}
          <div className="shrink-0 pb-20">
            <form
              ref={desktopFormRef}
              onSubmit={handleLogin}
              className="relative bg-[rgba(6,45,140,0.58)] rounded-3xl shadow-[0_0_30px_20px_rgba(6,45,140,0.71)] p-5 flex flex-row gap-4 items-start"
            >
              <fieldset disabled={isLoading} className="contents">
                {/* USER ID */}
                <div className="flex-1 min-w-0">
                  <div className={deskInput(fieldErrors.username)}>
                    <span className="font-semibold text-[#001d63] text-lg whitespace-nowrap shrink-0">
                      USER ID
                    </span>
                    <div className="w-px h-8 bg-[#606060]/60 shrink-0" />
                    <input
                      type="text"
                      name="username"
                      value={credentials.username}
                      onChange={handleChange}
                      onKeyDown={(e) =>
                        handleKeyDown(e, passwordRef, desktopFormRef)
                      }
                      className="flex-1 min-w-0 font-normal text-[#101010] text-xl bg-transparent border-none outline-none placeholder:text-gray-500"
                      placeholder=""
                      autoComplete="username"
                    />
                  </div>
                </div>

                {/* PASSWORD */}
                <div className="flex-1 min-w-0">
                  <div className={deskInput(fieldErrors.password)}>
                    <span className="font-semibold text-[#001d63] text-lg whitespace-nowrap shrink-0">
                      PASSWORD
                    </span>
                    <div className="w-px h-8 bg-[#606060]/60 shrink-0" />
                    <input
                      type={showPassword ? "text" : "password"}
                      name="password"
                      value={credentials.password}
                      onChange={handleChange}
                      onKeyDown={(e) => handleKeyDown(e, null, desktopFormRef)}
                      className="flex-1 min-w-0 font-normal text-[#101010] text-xl bg-transparent border-none outline-none placeholder:text-gray-500"
                      placeholder=""
                      autoComplete="current-password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((p) => !p)}
                      className="shrink-0 p-1 text-gray-600 hover:text-gray-800 transition-colors disabled:opacity-50"
                      disabled={isLoading}
                      aria-label={
                        showPassword ? "Hide password" : "Show password"
                      }
                    >
                      {showPassword ? <EyeOff size={22} /> : <Eye size={22} />}
                    </button>
                  </div>
                </div>

                {/* LOGIN button */}
                <button
                  type="submit"
                  disabled={isLoading}
                  className="relative bg-[#041848] flex items-center justify-center gap-2.5 h-20 px-8 rounded-2xl hover:bg-[#052060] active:bg-[#031030] transition-colors w-56 shrink-0 shadow-md disabled:opacity-70 disabled:cursor-not-allowed"
                >
                  <div className="absolute inset-0 border border-[rgba(195,195,195,0.26)] rounded-2xl shadow-[0_0_20px_rgba(0,0,0,0.44)] pointer-events-none" />
                  <span className="relative font-semibold text-[#cad6f2] text-lg whitespace-nowrap flex items-center gap-2">
                    {isLoading ? (
                      <>
                        <LoaderCircle className="animate-spin w-5 h-5" />{" "}
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

        {/* Footer */}
        <footer className="shrink-0 pb-4 px-12 flex items-center justify-center gap-3">
          <p className="font-semibold text-sm text-[rgba(228,226,226,0.44)]">
            Core Node v2.4.0
          </p>
          <div className="w-1.5 h-1.5 bg-[#E4E2E2] opacity-40 rounded-full" />
          <p className="font-semibold text-sm text-[rgba(228,226,226,0.44)]">
            AES-256 Encrypted
          </p>
        </footer>
      </div>
    </>
  );
}

export default LoginPage;

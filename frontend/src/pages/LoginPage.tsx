import * as React from "react";
import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import type { ChangeEvent, FormEvent, KeyboardEvent } from "react";
import { useNavigate } from "react-router-dom";
import {
  LoaderCircle,
  LogIn,
  Eye,
  EyeOff,
  AlertCircle,
  X,
  Building2,
} from "lucide-react";
import bannerLogo from "../assets/banner_logo.png";
import logoOutline from "../assets/logo_outline.png";
import { login } from "../api/auth.js";
import { getPublicBranches } from "../api/branches";
import { getStoredRole, isAuthenticated, useAuth } from "../hooks/useAuth";

// Add module declarations for image imports
declare module "*.png" {
  const value: string;
  export default value;
}

type AllowedRole = "admin" | "cashier" | "staff" | "manager";

type Branch = {
  id: number;
  value: string;
  label: string;
  address: string;
};

type Credentials = {
  username: string;
  password: string;
};

type FieldErrors = Partial<Record<keyof Credentials | "branch", boolean>>;

const FALLBACK_BRANCHES: Branch[] = [
  {
    id: 1,
    value: "BMC MAIN",
    label: "BMC MAIN",
    address: "#6A J. Miranda Ave., Concepcion Pequeña, Naga City",
  },
  {
    id: 2,
    value: "DIVERSION BRANCH",
    label: "DIVERSION BRANCH",
    address: "Roxas Avenue, Diversion Road, Triangulo, Naga City",
  },
  {
    id: 3,
    value: "PANGANIBAN BRANCH",
    label: "PANGANIBAN BRANCH",
    address: "Door 11 & 12, Pavilion 7, Panganiban Drive Concepcion Pequeña, Naga City",
  },
];

const normalizeRole = (role: string): AllowedRole | "" => {
  const normalized = role.trim().toLowerCase();
  const roleMap: Record<string, AllowedRole> = {
    admin: "admin",
    cashier: "cashier",
    staff: "staff",
    manager: "manager",
    omvb_manager: "manager",
  };
  return (roleMap[normalized] as AllowedRole) || "";
};

const ROLE_PATHS: Record<AllowedRole, string> = {
  admin: "/admin",
  cashier: "/pos",
  staff: "/pos",
  manager: "/manager",
};

const roleHomePath = (role: string): string =>
  normalizeRole(role) ? ROLE_PATHS[normalizeRole(role) as AllowedRole]! : "/";

type ErrorMessageType = 
  | "Login failed. Please try again."
  | "Invalid username or password"
  | "Cannot connect to server. Please check your connection."
  | "Login successful! Redirecting..."
  | string;

const ERROR_MESSAGES = {
  invalidCredentials: "Invalid username or password" as const,
  networkError: "Cannot connect to server. Please check your connection." as const,
  unsupportedRole: (role: string) => `Unsupported role: ${role}` as ErrorMessageType,
  missingFields: (fields: string[]) => `Please fill in: ${fields.join(", ")}` as ErrorMessageType,
  loginSuccess: "Login successful! Redirecting..." as const,
  generic: "Login failed. Please try again." as const,
};

const LoginPage = () => {
  const navigate = useNavigate();
  const { login: authLogin } = useAuth();

  // State
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [branches, setBranches] = useState<Branch[]>(FALLBACK_BRANCHES);
  const [branch, setBranch] = useState(() => localStorage.getItem("lastBranch") || "");
  const [currentDateTime, setCurrentDateTime] = useState({ date: "", time: "" });
  const [credentials, setCredentials] = useState<Credentials>({ username: "", password: "" });
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [toast, setToast] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [capsLockOn, setCapsLockOn] = useState(false);

  // Refs
  const usernameRef = useRef<HTMLInputElement>(null);
  const passwordRef = useRef<HTMLInputElement>(null);
  const formRef = useRef<HTMLFormElement>(null);

  // Memoized values
  const selectedBranch = useMemo(
    () => branches.find((b) => b.value === branch),
    [branch, branches]
  );

  const isFormValid = useMemo(() => {
    return !!branch && !!credentials.username.trim() && !!credentials.password.trim();
  }, [branch, credentials]);

  // Event handlers
  const showToast = useCallback((message: string) => {
    setToast(message);
    const timeout = setTimeout(() => setToast(null), 4500);
    return () => clearTimeout(timeout);
  }, []);

  const handleFieldChange = useCallback((e: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setCredentials((prev) => ({ ...prev, [name as keyof Credentials]: value }));
    setFieldErrors((prev) => ({ ...prev, [name as keyof FieldErrors]: false }));
  }, []);

  const handleBranchChange = useCallback((e: ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value;
    setBranch(value);
    setFieldErrors((prev) => ({ ...prev, branch: false }));
    if (value) localStorage.setItem("lastBranch", value);
  }, []);

  const handleKeyDown = useCallback((e: KeyboardEvent<HTMLInputElement>, nextRef?: React.RefObject<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      nextRef?.current?.focus() || formRef.current?.requestSubmit();
    }
  }, []);

  const handlePasswordKeyDown = useCallback((e: KeyboardEvent<HTMLInputElement>) => {
    setCapsLockOn(e.getModifierState("CapsLock"));
    handleKeyDown(e);
  }, [handleKeyDown]);

  const validateForm = useCallback((): boolean => {
    const errors: FieldErrors = {
      branch: !branch,
      username: !credentials.username.trim(),
      password: !credentials.password.trim(),
    };
    setFieldErrors(errors);
    return Object.values(errors).every((error) => !error);
  }, [branch, credentials]);

  const handleSubmit = useCallback(async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    if (!validateForm()) {
      const missing: string[] = [];
      if (!branch) missing.push("Branch");
      if (!credentials.username.trim()) missing.push("User ID");
      if (!credentials.password.trim()) missing.push("Password");
      showToast(ERROR_MESSAGES.missingFields(missing));
      return;
    }

    setIsLoading(true);

    try {
      const { access_token: token, role } = await login({
        username: credentials.username.trim(),
        password: credentials.password.trim(),
      });

      authLogin(token, role, credentials.password.trim());
      localStorage.setItem("cashier_username", credentials.username.trim());

      const destination = roleHomePath(role);
      if (destination === "/") {
        showToast(ERROR_MESSAGES.unsupportedRole(role));
        return;
      }

      showToast(ERROR_MESSAGES.loginSuccess);
      setTimeout(() => navigate(destination, { replace: true }), 800);
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      let message = ERROR_MESSAGES.generic;

      if (errorMessage.includes("401") || errorMessage.toLowerCase().includes("invalid")) {
        message = ERROR_MESSAGES.invalidCredentials;
      } else if (
        errorMessage.toLowerCase().includes("network") ||
        errorMessage.toLowerCase().includes("fetch")
      ) {
        message = ERROR_MESSAGES.networkError;
      }

      showToast(message);
    } finally {
      setIsLoading(false);
    }
  }, [credentials, branch, authLogin, navigate, showToast, validateForm]);

  // Effects
  useEffect(() => {
    let isMounted = true;

    const loadBranches = async () => {
      try {
        const apiBranches = await getPublicBranches();
        const mappedBranches: Branch[] = apiBranches.map((item) => ({
          id: item.branch_id,
          value: item.branch_name,
          label: item.branch_name,
          address: item.branch_address || "",
        }));

        if (!isMounted) return;

        setBranches(mappedBranches);

        const storedBranch = localStorage.getItem("lastBranch") || "";
        if (storedBranch && !mappedBranches.some((b) => b.value === storedBranch)) {
          setBranch("");
          localStorage.removeItem("lastBranch");
        }
      } catch (error) {
        console.error("[LoginPage] Failed to load branches:", error);
        if (!isMounted) return;
        setBranches(FALLBACK_BRANCHES);
      }
    };

    loadBranches();

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    if (isAuthenticated()) {
      navigate(roleHomePath(getStoredRole()), { replace: true });
    }
  }, [navigate]);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentDateTime({
        date: now.toLocaleDateString("en-US", {
          weekday: "long",
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
      });
    };

    const interval = setInterval(updateTime, 1000);
    updateTime();
    return () => clearInterval(interval);
  }, []);

  // Render
  return (
    <LoginPageContent
      branches={branches}
      selectedBranch={selectedBranch}
      branch={branch}
      credentials={credentials}
      fieldErrors={fieldErrors}
      isOnline={isOnline}
      currentDateTime={currentDateTime}
      isLoading={isLoading}
      showPassword={showPassword}
      capsLockOn={capsLockOn}
      isFormValid={isFormValid}
      onBranchChange={handleBranchChange}
      onFieldChange={handleFieldChange}
      onPasswordKeyDown={handlePasswordKeyDown}
      onKeyDown={handleKeyDown}
      onTogglePassword={() => setShowPassword(!showPassword)}
      onSubmit={handleSubmit}
      formRef={formRef}
      usernameRef={usernameRef}
      passwordRef={passwordRef}
      onDismissToast={() => setToast(null)}
      toast={toast}
    />
  );
};

// Fixed LoginPageContentProps type
type LoginPageContentProps = {
  branches: Branch[];
  selectedBranch: Branch | undefined;
  branch: string;
  credentials: Credentials;
  fieldErrors: FieldErrors;
  isOnline: boolean;
  currentDateTime: { date: string; time: string };
  isLoading: boolean;
  showPassword: boolean;
  capsLockOn: boolean;
  isFormValid: boolean;
  onBranchChange: (e: ChangeEvent<HTMLSelectElement>) => void;
  onFieldChange: (e: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => void;
  onPasswordKeyDown: (e: KeyboardEvent<HTMLInputElement>) => void;
  onKeyDown: (e: KeyboardEvent<HTMLInputElement>, nextRef?: React.RefObject<HTMLInputElement>) => void;
  onTogglePassword: () => void;
  onSubmit: (e: FormEvent<HTMLFormElement>) => void;
  formRef: React.RefObject<HTMLFormElement | null>;
  usernameRef: React.RefObject<HTMLInputElement | null>;
  passwordRef: React.RefObject<HTMLInputElement | null>;
  onDismissToast: () => void;
  toast: string | null;
};

const LoginPageContent = ({
  branches,
  selectedBranch,
  branch,
  credentials,
  fieldErrors,
  isOnline,
  currentDateTime,
  isLoading,
  showPassword,
  capsLockOn,
  isFormValid,
  onBranchChange,
  onFieldChange,
  onPasswordKeyDown,
  onKeyDown,
  onTogglePassword,
  onSubmit,
  formRef,
  usernameRef,
  passwordRef,
  onDismissToast,
  toast,
}: LoginPageContentProps) => (
  <>
    <div className="min-h-[100dvh] bg-gradient-to-br from-[#081427] via-[#0d1f42] to-[#163566] flex items-center justify-center p-3 sm:p-4 lg:p-6 overflow-hidden relative">
      {/* Background accents */}
      <div className="hidden lg:block absolute inset-0 bg-[radial-gradient(at_top_right,rgba(59,130,246,0.3)_0%,transparent_50%)]" />
      <div className="hidden lg:block absolute inset-0 bg-[radial-gradient(at_bottom_left,rgba(99,102,241,0.2)_0%,transparent_60%)]" />

      {/* Toast */}
      {toast && (
        <Toast message={toast} onDismiss={onDismissToast} />
      )}

      <div className="w-full max-w-screen-2xl mx-auto px-6 sm:px-8 lg:px-12">
        <LoginForm
          branches={branches}
          selectedBranch={selectedBranch}
          branch={branch}
          credentials={credentials}
          fieldErrors={fieldErrors}
          isOnline={isOnline}
          currentDateTime={currentDateTime}
          isLoading={isLoading}
          showPassword={showPassword}
          capsLockOn={capsLockOn}
          isFormValid={isFormValid}
          onBranchChange={onBranchChange}
          onFieldChange={onFieldChange}
          onPasswordKeyDown={onPasswordKeyDown}
          onKeyDown={onKeyDown}
          onTogglePassword={onTogglePassword}
          onSubmit={onSubmit}
          formRef={formRef}
          usernameRef={usernameRef}
          passwordRef={passwordRef}
        />
      </div>
    </div>
  </>
);

// Update LoginForm props type
type LoginFormProps = Omit<LoginPageContentProps, "toast" | "onDismissToast">;

const LoginForm = (props: LoginFormProps) => {
  const {
    branches,
    selectedBranch,
    branch,
    credentials,
    fieldErrors,
    isOnline,
    currentDateTime,
    isLoading,
    showPassword,
    capsLockOn,
    isFormValid,
    onBranchChange,
    onFieldChange,
    onPasswordKeyDown,
    onKeyDown,
    onTogglePassword,
    onSubmit,
    formRef,
    usernameRef,
    passwordRef,
  } = props;

  return (
    <>
      {/* Mobile/Tablet */}
      <div className="lg:hidden">
        <MobileLoginForm {...props} />
      </div>
      
      {/* Desktop */}
      <div className="hidden lg:block">
        <DesktopLoginForm {...props} />
      </div>
    </>
  );
};

// Rest of the components remain the same...
const Toast = ({ message, onDismiss }: { message: string; onDismiss: () => void }) => (
  <div className="fixed top-3 left-3 right-3 sm:top-6 sm:left-1/2 sm:-translate-x-1/2 z-50 glass rounded-2xl px-4 py-3 sm:px-6 sm:py-4 flex items-center gap-3 shadow-2xl border border-red-500/30 max-w-md">
    <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0" />
    <p className="text-white text-xs sm:text-sm font-medium flex-1">{message}</p>
    <button
      onClick={onDismiss}
      className="text-white/60 hover:text-white transition-colors p-1 -m-1 rounded-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-400/60"
      aria-label="Dismiss toast"
    >
      <X size={18} />
    </button>
  </div>
);

// Mobile and Desktop variants - update prop types
type ResponsiveFormProps = LoginFormProps;

const MobileLoginForm = (props: ResponsiveFormProps) => (
  <div className="flex flex-col gap-6 items-center">
    <BrandingLogo src={bannerLogo} size="w-56 sm:w-64" />
    <LoginCard size="sm">
      <LoginCardHeader isOnline={props.isOnline} />
      <form ref={props.formRef} onSubmit={props.onSubmit} className="space-y-4 sm:space-y-5">
        <BranchSelector
          branches={props.branches}
          branch={props.branch}
          fieldError={props.fieldErrors.branch}
          onChange={props.onBranchChange}
          isLoading={props.isLoading}
          selectedBranch={props.selectedBranch}
        />
        <InputField
          ref={props.usernameRef}
          label="USER ID"
          name="username"
          value={props.credentials.username}
          error={props.fieldErrors.username}
          onChange={props.onFieldChange}
          onKeyDown={(e) => props.onKeyDown(e, props.passwordRef)}
          placeholder="Enter your User ID"
          autoComplete="username"
          autoFocus
          disabled={props.isLoading}
          type="text"
          size="sm"
        />
        <PasswordField
          ref={props.passwordRef}
          label="PASSWORD"
          name="password"
          value={props.credentials.password}
          error={props.fieldErrors.password}
          onChange={props.onFieldChange}
          onKeyDown={props.onPasswordKeyDown}
          placeholder="Enter your password"
          showPassword={props.showPassword}
          capsLockOn={props.capsLockOn}
          onTogglePassword={props.onTogglePassword}
          disabled={props.isLoading}
          size="sm"
        />
        <SubmitButton isLoading={props.isLoading} isFormValid={props.isFormValid} />
      </form>
      <DateTimeDisplay dateTime={props.currentDateTime} size="sm" />
    </LoginCard>
  </div>
);

const DesktopLoginForm = (props: ResponsiveFormProps) => (
  <div className="glass rounded-[32px] p-6 sm:p-8 lg:p-16 shadow-2xl border border-white/20">
    <div className="flex flex-row gap-16 items-center">
      <BrandingLogo src={logoOutline} size="w-[32rem]" />
      <div className="w-full max-w-[520px]">
        <LoginCard size="lg">
          <LoginCardHeader isOnline={props.isOnline} size="lg" />
          <form ref={props.formRef} onSubmit={props.onSubmit} className="space-y-6">
            <BranchSelector
              branches={props.branches}
              branch={props.branch}
              fieldError={props.fieldErrors.branch}
              onChange={props.onBranchChange}
              isLoading={props.isLoading}
              selectedBranch={props.selectedBranch}
              size="lg"
            />
            <InputField
              ref={props.usernameRef}
              label="USER ID"
              name="username"
              value={props.credentials.username}
              error={props.fieldErrors.username}
              onChange={props.onFieldChange}
              onKeyDown={(e) => props.onKeyDown(e, props.passwordRef)}
              placeholder="Enter your User ID"
              autoComplete="username"
              autoFocus
              disabled={props.isLoading}
              type="text"
              size="lg"
            />
            <PasswordField
              ref={props.passwordRef}
              label="PASSWORD"
              name="password"
              value={props.credentials.password}
              error={props.fieldErrors.password}
              onChange={props.onFieldChange}
              onKeyDown={props.onPasswordKeyDown}
              placeholder="Enter your password"
              showPassword={props.showPassword}
              capsLockOn={props.capsLockOn}
              onTogglePassword={props.onTogglePassword}
              disabled={props.isLoading}
              size="lg"
            />
            <SubmitButton isLoading={props.isLoading} isFormValid={props.isFormValid} />
          </form>
          <DateTimeDisplay dateTime={props.currentDateTime} size="lg" />
        </LoginCard>
      </div>
    </div>
  </div>
);

// Rest of the reusable UI components remain unchanged...
type Size = "sm" | "lg";

const BrandingLogo = ({ src, size }: { src: string; size: string }) => (
  <div className="flex justify-center lg:justify-start">
    <img src={src} alt="Knopper" className={`${size} drop-shadow-2xl`} />
  </div>
);

const LoginCard = ({ size, children }: { size: Size; children: React.ReactNode }) => (
  <div className={`glass rounded-[28px] p-6 sm:p-8 ${size === 'lg' ? 'p-12 shadow-2xl' : 'shadow-2xl border border-white/20'} border border-white/20`}>
    {children}
  </div>
);

const LoginCardHeader = ({ isOnline, size }: { isOnline: boolean; size?: Size }) => (
  <div className={size === 'lg' ? 'flex items-start justify-between gap-3 mb-10' : 'flex items-start justify-between gap-3 mb-6'}>
    <div>
      <img src={bannerLogo} alt="Knopper" className={size === 'lg' ? 'h-20 object-contain mb-4' : 'h-12 sm:h-16 object-contain mb-2 sm:mb-3'} />
      <p className={size === 'lg' ? 'text-blue-200/80 text-lg' : 'text-blue-200/80 mt-1 sm:mt-2 text-xs sm:text-sm'}>
        Log-in to your account
      </p>
    </div>
    <OnlineStatusIndicator isOnline={isOnline} size={size} />
  </div>
);

const OnlineStatusIndicator = ({ isOnline, size }: { isOnline: boolean; size?: Size }) => (
  <div className={`rounded-full flex items-center font-bold tracking-wide ${
    isOnline 
      ? "bg-emerald-500/25 text-emerald-300" 
      : "bg-orange-500/25 text-orange-300"
  } ${size === 'lg' ? 'px-4 py-2 gap-2 text-sm' : 'px-3 py-1.5 sm:px-4 sm:py-2 gap-1.5 sm:gap-2 text-[10px] sm:text-xs'}`}>
    <div className={`rounded-full ${
      isOnline ? "bg-emerald-400 animate-pulse" : "bg-orange-400"
    } ${size === 'lg' ? 'w-2.5 h-2.5' : 'w-2 h-2 sm:w-2.5 sm:h-2.5'}`} />
    <span>{isOnline ? "ONLINE" : "OFFLINE"}</span>
  </div>
);

const BranchSelector = ({
  branches,
  branch,
  fieldError,
  onChange,
  isLoading,
  selectedBranch,
  size = "sm" as Size,
}: {
  branches: Branch[];
  branch: string;
  fieldError?: boolean;
  onChange: (e: ChangeEvent<HTMLSelectElement>) => void;
  isLoading: boolean;
  selectedBranch?: Branch;
  size?: Size;
}) => (
  <div>
    <label className="block text-white/80 text-sm font-semibold mb-3 flex items-center gap-2 tracking-wide">
      <Building2 size={18} className="text-blue-400" />
      SELECT BRANCH
    </label>
    <div className="relative">
      <select
        value={branch}
        onChange={onChange}
        disabled={isLoading}
        className={`login-select-no-glow w-full input-base border rounded-xl text-white text-base focus:outline-none focus:ring-0 transition-all appearance-none font-medium ${
          fieldError ? "border-red-500" : "border-blue-500/30"
        } ${size === 'lg' ? 'px-5 py-3.5' : 'px-4 py-3 sm:px-5 sm:py-3.5'} ${
          isLoading ? "opacity-60 cursor-not-allowed" : ""
        }`}
        aria-invalid={fieldError}
      >
        <option value="" className="bg-[#0a1428] text-white/50">
          Choose your branch
        </option>
        {branches.map((b) => (
          <option key={b.value} value={b.value} className="bg-[#0a1428]">
            {b.label}
          </option>
        ))}
      </select>
      <div className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-blue-400/60">
        ▼
      </div>
    </div>
    {selectedBranch && (
      <p className={size === 'lg' ? 'mt-2 text-sm text-blue-300/70 pl-1 font-medium' : 'mt-2 text-[11px] sm:text-xs text-blue-300/70 pl-1 font-medium'}>
        {selectedBranch.address}
      </p>
    )}
  </div>
);

const InputField = React.forwardRef<HTMLInputElement, {
  label: string;
  name: string;
  value: string;
  error?: boolean;
  onChange: (e: ChangeEvent<HTMLInputElement>) => void;
  onKeyDown: (e: KeyboardEvent<HTMLInputElement>) => void;
  placeholder: string;
  autoComplete?: string;
  autoFocus?: boolean;
  disabled?: boolean;
  type: string;
  size?: Size;
}>(({ label, size = "sm", ...props }, ref) => (
  <div>
    <label className={size === 'lg' ? 'block text-white/80 text-sm font-semibold mb-3 tracking-wide' : 'block text-white/80 text-xs sm:text-sm font-semibold mb-2 sm:mb-3 tracking-wide'}>
      {label}
    </label>
    <div className={`input-focus flex h-14 w-full items-center input-base border border-white/20 rounded-xl ${
      props.error 
        ? "border-red-500 ring-2 ring-red-500/30" 
        : "border-blue-500/30"
    } ${size === 'lg' ? 'px-4' : 'px-3 sm:px-4'}`}>
      <input
        ref={ref}
        {...props}
        className={`login-clean-input min-w-0 flex-1 w-full min-h-0 h-full bg-transparent outline-none text-white placeholder:text-white/35 text-[15px] font-sans font-medium ${
          props.disabled ? "opacity-60 cursor-not-allowed" : ""
        }`}
        style={{ fontFamily: 'Inter, sans-serif', fontSize: '15px' }}
        aria-invalid={props.error}
      />
    </div>
  </div>
));

const PasswordField = React.forwardRef<HTMLInputElement, {
  label: string;
  name: string;
  value: string;
  error?: boolean;
  onChange: (e: ChangeEvent<HTMLInputElement>) => void;
  onKeyDown: (e: KeyboardEvent<HTMLInputElement>) => void;
  placeholder: string;
  showPassword: boolean;
  capsLockOn: boolean;
  onTogglePassword: () => void;
  disabled?: boolean;
  size?: Size;
}>(({ label, showPassword, capsLockOn, onTogglePassword, size = "sm", ...props }, ref) => (
  <div>
    <label className={size === 'lg' ? 'block text-white/80 text-sm font-semibold mb-3 tracking-wide' : 'block text-white/80 text-xs sm:text-sm font-semibold mb-2 sm:mb-3 tracking-wide'}>
      {label}
    </label>
    <div className={`input-focus flex h-14 w-full items-center input-base border border-white/20 rounded-xl ${
      props.error 
        ? "border-red-500 ring-2 ring-red-500/30" 
        : "border-blue-500/30"
    } ${size === 'lg' ? 'px-4' : 'px-3 sm:px-4'}`}>
      <input
        ref={ref}
        type={showPassword ? "text" : "password"}
        {...props}
        className={`login-clean-input min-w-0 flex-1 w-full min-h-0 h-full bg-transparent outline-none text-white placeholder:text-white/35 text-[15px] font-sans font-medium ${
          props.disabled ? "opacity-60 cursor-not-allowed" : ""
        }`}
        style={{ fontFamily: 'Inter, sans-serif', fontSize: '15px' }}
        aria-invalid={props.error}
      />
      <TogglePasswordButton
        showPassword={showPassword}
        onClick={onTogglePassword}
        disabled={props.disabled}
      />
    </div>
    {capsLockOn && (
      <p className="mt-1 text-xs text-orange-300 flex items-center gap-1">
        <AlertCircle size={12} />
        Caps Lock is on
      </p>
    )}
  </div>
));

const TogglePasswordButton = ({
  showPassword,
  onClick,
  disabled,
}: {
  showPassword: boolean;
  onClick: () => void;
  disabled?: boolean;
}) => (
  <button
    type="button"
    onClick={onClick}
    disabled={disabled}
    className={`inline-flex items-center justify-center shrink-0 min-w-14 h-14 w-14 ml-2 p-0 rounded-lg border border-transparent bg-transparent text-white/50 hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-400/60 focus-visible:ring-offset-0 transition-all ${
      disabled ? "opacity-60 cursor-not-allowed" : ""
    }`}
    aria-label={showPassword ? "Hide password" : "Show password"}
    aria-pressed={showPassword}
  >
    {showPassword ? (
      <EyeOff size={24} strokeWidth={2.25} />
    ) : (
      <Eye size={24} strokeWidth={2.25} />
    )}
  </button>
);

const SubmitButton = ({ isLoading, isFormValid }: { isLoading: boolean; isFormValid: boolean }) => (
  <button
    type="submit"
    disabled={isLoading || !isFormValid}
    className="w-full mt-6 sm:mt-8 lg:mt-8 bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-600 hover:from-blue-500 hover:via-indigo-500 hover:to-blue-500 active:scale-95 transition-all font-bold text-white text-base sm:text-lg lg:text-lg py-3.5 sm:py-4 lg:py-4 rounded-xl flex items-center justify-center gap-3 shadow-xl hover:shadow-2xl disabled:opacity-60 disabled:cursor-not-allowed"
  >
    {isLoading ? (
      <>
        <LoaderCircle className="animate-spin w-5 h-5" />
        AUTHENTICATING...
      </>
    ) : (
      <>
        SIGN IN
        <LogIn size={22} />
      </>
    )}
  </button>
);

const DateTimeDisplay = ({
  dateTime,
  size,
}: {
  dateTime: { date: string; time: string };
  size: Size;
}) => (
  <div className={size === 'lg' ? 'mt-6 text-center text-white/50 text-sm' : 'mt-4 sm:mt-6 text-center text-white/50 text-xs sm:text-sm'}>
    {dateTime.date} • {dateTime.time}
  </div>
);

export default LoginPage;
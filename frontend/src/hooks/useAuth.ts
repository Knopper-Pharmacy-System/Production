// src/hooks/useAuth.ts
const TOKEN_KEY = "access_token";
const ROLE_KEY = "user_role";
const SESSION_PASSWORD_KEY = "session_login_password";
const TERMINAL_LOCK_KEY = "cashier_terminal_locked";

export function setSessionLoginPassword(password: string) {
  sessionStorage.setItem(SESSION_PASSWORD_KEY, password);
}

export function getSessionLoginPassword(): string {
  return sessionStorage.getItem(SESSION_PASSWORD_KEY) || "";
}

export function clearSessionLoginPassword() {
  sessionStorage.removeItem(SESSION_PASSWORD_KEY);
}

export function setTerminalLockState(isLocked: boolean) {
  if (isLocked) {
    sessionStorage.setItem(TERMINAL_LOCK_KEY, "true");
    return;
  }

  sessionStorage.removeItem(TERMINAL_LOCK_KEY);
}

export function getTerminalLockState(): boolean {
  return sessionStorage.getItem(TERMINAL_LOCK_KEY) === "true";
}

export function clearTerminalLockState() {
  sessionStorage.removeItem(TERMINAL_LOCK_KEY);
}

export function useAuth() {
  const login = (token: string, role: string, password?: string) => {
    localStorage.setItem(TOKEN_KEY, token);
    localStorage.setItem(ROLE_KEY, role);
    clearTerminalLockState();
    if (typeof password === "string") {
      setSessionLoginPassword(password);
    }
  };

  const logout = () => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(ROLE_KEY);
    clearSessionLoginPassword();
    clearTerminalLockState();
    window.location.href = "/";
  };

  return { login, logout };
}

export function getStoredRole(): string {
  return localStorage.getItem(ROLE_KEY) || "";
}

export function getToken(): string {
  return localStorage.getItem(TOKEN_KEY) || "";
}

export function isAuthenticated(): boolean {
  return Boolean(getToken());
}

export function logout() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(ROLE_KEY);
  localStorage.removeItem("cashier_username");
  clearSessionLoginPassword();
  clearTerminalLockState();
  window.location.href = "/";
}
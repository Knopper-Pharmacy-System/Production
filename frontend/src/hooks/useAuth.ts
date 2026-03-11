// src/hooks/useAuth.ts
const TOKEN_KEY = "access_token";
const ROLE_KEY = "user_role";

export function useAuth() {
  const login = (token: string, role: string) => {
    localStorage.setItem(TOKEN_KEY, token);
    localStorage.setItem(ROLE_KEY, role);
  };

  const logout = () => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(ROLE_KEY);
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
  window.location.href = "/";
}
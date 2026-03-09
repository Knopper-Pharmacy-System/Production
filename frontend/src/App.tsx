import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import type { ReactNode } from "react";
import LoginPage from "./pages/LoginPage";
import CashierPosPage from "./pages/CashierPosPage";
import { getStoredRole, isAuthenticated, logout } from "./hooks/useAuth";
import "./App.css";

type AllowedRole = "admin" | "cashier" | "staff" | "omvb_manager";

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

function ProtectedRoute({
  expectedRole,
  children,
}: {
  expectedRole: AllowedRole;
  children: ReactNode;
}) {
  if (!isAuthenticated()) return <Navigate to="/" replace />;

  const currentRole = normalizeRole(getStoredRole());
  if (currentRole !== expectedRole) {
    return <Navigate to={roleHomePath(currentRole)} replace />;
  }

  return <>{children}</>;
}

function RolePage({ title }: { title: string }) {
  return (
    <main className="role-page">
      <h1>{title}</h1>
      <p>Logged in as: {getStoredRole()}</p>
      <button type="button" onClick={logout}>
        Logout
      </button>
    </main>
  );
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LoginPage />} />
        <Route
          path="/admin"
          element={
            <ProtectedRoute expectedRole="admin">
              <RolePage title="Admin Interface" />
            </ProtectedRoute>
          }
        />
        <Route
          path="/cashier"
          element={
            <ProtectedRoute expectedRole="cashier">
              <CashierPosPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/staff"
          element={
            <ProtectedRoute expectedRole="staff">
              <RolePage title="Staff Interface" />
            </ProtectedRoute>
          }
        />
        <Route
          path="/inv-manager"
          element={
            <ProtectedRoute expectedRole="omvb_manager">
              <RolePage title="Inventory Manager Interface" />
            </ProtectedRoute>
          }
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
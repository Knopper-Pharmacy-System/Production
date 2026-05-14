// src/api/dashboard.ts
// import { API_BASE_URL } from "./baseUrl"; // kept for compatibility; fetchJson builds from API_BASE_URL

export interface DashboardMetrics {
  lowStockCount: number;
  nearExpiryCount: number;
  totalItemUnits: number;
  inventoryValue: number;
}

export interface LowStockItem {
  inventoryId: number;
  name: string;
  quantity: number;
  reorder: number;
  status: "Critical" | "Low";
}

export interface NearExpiryItem {
  inventoryId: number;
  name: string;
  expiry: string;
  daysLeft: number;
}

export interface SalesTrendData {
  day: string;
  sales: number;
}

export interface StockDistributionData {
  name: string;
  value: number;
  color: string;
}

export async function getDashboardMetrics(branchId: number): Promise<DashboardMetrics> {
  const { fetchJson, getTokenOrThrow } = await import("./fetchJson");
  const token = getTokenOrThrow();

  return fetchJson<DashboardMetrics>({
    path: `/dashboard/metrics/${branchId}`,
    method: "GET",
    token,
  });
}

export async function getLowStockItems(branchId: number): Promise<LowStockItem[]> {
  const { fetchJson, getTokenOrThrow } = await import("./fetchJson");
  const token = getTokenOrThrow();

  return fetchJson<LowStockItem[]>({
    path: `/dashboard/low-stock/${branchId}`,
    method: "GET",
    token,
  });
}

export async function getNearExpiryItems(branchId: number): Promise<NearExpiryItem[]> {
  const { fetchJson, getTokenOrThrow } = await import("./fetchJson");
  const token = getTokenOrThrow();

  return fetchJson<NearExpiryItem[]>({
    path: `/dashboard/near-expiry/${branchId}`,
    method: "GET",
    token,
  });
}

export async function getSalesTrend(branchId: number, period: 'week' | 'month' | 'year' = 'week'): Promise<SalesTrendData[]> {
  const { fetchJson, getTokenOrThrow } = await import("./fetchJson");
  const token = getTokenOrThrow();

  return fetchJson<SalesTrendData[]>({
    path: `/dashboard/sales-trend/${branchId}`,
    method: "GET",
    token,
    query: { period },
  });
}

export async function getStockDistribution(branchId: number): Promise<StockDistributionData[]> {
  const { fetchJson, getTokenOrThrow } = await import("./fetchJson");
  const token = getTokenOrThrow();

  return fetchJson<StockDistributionData[]>({
    path: `/dashboard/stock-distribution/${branchId}`,
    method: "GET",
    token,
  });
}
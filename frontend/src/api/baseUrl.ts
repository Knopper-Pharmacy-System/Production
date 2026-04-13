const PROD_API_BASE_URL = "https://web-production-783f2.up.railway.app";

function normalizeBaseUrl(url: string): string {
  return url.trim().replace(/\/+$/, "");
}

function isLocalHost(hostname: string): boolean {
  return hostname === "localhost" || hostname === "127.0.0.1" || hostname === "::1";
}

function resolveApiBaseUrl(): string {
  const configured = import.meta.env.VITE_API_BASE_URL;
  let configuredUrl = configured ? normalizeBaseUrl(configured) : "";

  if (configuredUrl && !/^https?:\/\//i.test(configuredUrl)) {
    configuredUrl = `https://${configuredUrl}`;
  }

  if (!configuredUrl) {
    return PROD_API_BASE_URL;
  }

  try {
    const parsed = new URL(configuredUrl);
    const isConfiguredLocal = isLocalHost(parsed.hostname);
    const runningInBrowser = typeof window !== "undefined";

    if (runningInBrowser && isConfiguredLocal && !isLocalHost(window.location.hostname)) {
      return PROD_API_BASE_URL;
    }

    return configuredUrl;
  } catch {
    return configuredUrl;
  }
}

export const API_BASE_URL = resolveApiBaseUrl();

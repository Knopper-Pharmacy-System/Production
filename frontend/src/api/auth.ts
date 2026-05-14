// src/api/auth.ts
import { API_BASE_URL, PROD_API_BASE_URL } from "./baseUrl";

export type LoginPayload = {
  username: string;
  password: string;
};

export type LoginResponse = {
  access_token: string;
  role: string;
  // branch?: number;   // optional – your backend doesn't send it yet
};

async function loginRequest(baseUrl: string, payload: LoginPayload): Promise<LoginResponse> {
  const response = await fetch(`${baseUrl}/login`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    let errorData;
    try {
      errorData = await response.json();
    } catch {
      errorData = {};
    }
    throw new Error(errorData.message || `Login failed (${response.status})`);
  }

  const data = await response.json();

  if (!data.access_token || !data.role) {
    throw new Error("Invalid response from server: missing token or role");
  }

  return data as LoginResponse;
}

export async function login(payload: LoginPayload): Promise<LoginResponse> {
  try {
    return await loginRequest(API_BASE_URL, payload);
  } catch (primaryErr: any) {
    const isNetworkError =
      primaryErr?.name === "TypeError" ||
      String(primaryErr?.message || "").toLowerCase().includes("fetch");

    // If configured endpoint is unreachable, retry against the hardcoded production URL.
    if (isNetworkError && API_BASE_URL !== PROD_API_BASE_URL) {
      try {
        return await loginRequest(PROD_API_BASE_URL, payload);
      } catch {
        // Fall through to normalized error handling below.
      }
    }

    console.error("[auth.ts] Login error:", primaryErr);

    if (isNetworkError) {
      throw new Error(
        `Cannot reach login server (${API_BASE_URL}). Check VITE_API_BASE_URL and ensure the API URL is reachable from this device.`
      );
    }

    throw new Error(primaryErr?.message || "Login failed.");
  }
}
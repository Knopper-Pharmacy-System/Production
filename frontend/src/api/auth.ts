const PROD_API_BASE_URL = "https://web-production-2c7737.up.railway.app";
const API_BASE_URL = import.meta.env.DEV ? "/api" : PROD_API_BASE_URL;

type LoginPayload = {
  username: string;
  password: string;
};

export type LoginResponse = {
  access_token: string;
  role: string;
};

export async function login(payload: LoginPayload): Promise<LoginResponse> {
  let response: Response;
  try {
    response = await fetch(`${API_BASE_URL}/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });
  } catch {
    throw new Error("Cannot reach login server (network/CORS). Please check backend URL and CORS settings.");
  }

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data.message || "Login failed.");
  }

  return data as LoginResponse;
}

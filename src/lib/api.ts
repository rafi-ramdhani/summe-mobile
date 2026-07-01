import * as Crypto from "expo-crypto";
import { env } from "./config";
import { getToken } from "./secureToken";

export class ApiError extends Error {
  public readonly status: number;
  public readonly code?: string;
  constructor(status: number, statusText: string, data?: { message?: string; code?: string }) {
    super(data?.message || `API ${status} ${statusText}`);
    this.name = "ApiError";
    this.status = status;
    this.code = data?.code;
  }
}

export const generateUUID = () => Crypto.randomUUID();

export async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const isFormData = typeof FormData !== "undefined" && init?.body instanceof FormData;
  const headers: Record<string, string> = {
    Accept: "application/json",
    "X-Client": "mobile",
  };
  if (!isFormData) headers["Content-Type"] = "application/json";
  const token = getToken();
  if (token) headers.Authorization = `Bearer ${token}`;
  if (init?.headers) Object.assign(headers, init.headers as Record<string, string>);

  const res = await fetch(`${env.API_BASE_URL}${path}`, { ...init, headers });

  if (!res.ok) {
    let errorData;
    try { errorData = await res.json(); } catch { /* not json */ }
    throw new ApiError(res.status, res.statusText, errorData);
  }
  if (res.status === 204) return undefined as T;
  return res.json();
}

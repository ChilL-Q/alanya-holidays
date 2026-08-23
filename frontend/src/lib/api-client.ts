import { supabase } from "./supabase";
import { logger } from "@/lib/logger";

export const API_BASE_URL: string =
  (import.meta.env.VITE_API_URL as string | undefined)?.replace(/\/+$/, "") ||
  "/api";

export class ApiError extends Error {
  readonly status: number;
  readonly statusText: string;
  readonly data: unknown;
  readonly endpoint: string;
  readonly isAborted?: boolean;

  constructor(
    message: string,
    status: number,
    statusText: string,
    data?: unknown,
    endpoint: string = "",
    isAborted?: boolean
  ) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.statusText = statusText;
    this.data = data;
    this.endpoint = endpoint;
    this.isAborted = isAborted;
  }
}

export interface RequestOptions extends Omit<RequestInit, "body"> {
  params?: Record<string, string | number | boolean | undefined | null>;
  skipAuth?: boolean;
}

export function isAbortError(err: unknown): boolean {
  if (!err) return false;
  if (typeof DOMException !== "undefined" && err instanceof DOMException && err.name === "AbortError") return true;
  if (err instanceof Error && (err.name === "AbortError" || err.message.toLowerCase().includes("aborted"))) return true;
  if (err instanceof ApiError && (err.statusText === "AbortError" || err.isAborted === true)) return true;
  return false;
}

export function shouldUseOfflineFallback(err: unknown): boolean {
  if (!err) return false;
  if (isAbortError(err)) return false;
  if (err instanceof ApiError) {
    return err.status >= 500 || err.status === 0;
  }
  if (err instanceof Error) {
    return true;
  }
  return false;
}

export class ApiClient {
  private baseUrl: string;

  constructor(baseUrl: string = API_BASE_URL) {
    this.baseUrl = baseUrl;
  }

  private buildUrl(endpoint: string, params?: RequestOptions["params"]): string {
    const isAbsolute =
      endpoint.startsWith("http://") || endpoint.startsWith("https://");
    const cleanEndpoint = endpoint.startsWith("/") ? endpoint : `/${endpoint}`;
    let urlString = isAbsolute ? endpoint : `${this.baseUrl}${cleanEndpoint}`;

    if (params) {
      const searchParams = new URLSearchParams();
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          searchParams.append(key, String(value));
        }
      });
      const queryString = searchParams.toString();
      if (queryString) {
        urlString += (urlString.includes("?") ? "&" : "?") + queryString;
      }
    }

    return urlString;
  }

  private async getAuthHeader(): Promise<Record<string, string>> {
    try {
      const { data } = await supabase.auth.getSession();
      const token = data?.session?.access_token;
      if (token) {
        return { Authorization: `Bearer ${token}` };
      }
    } catch (err: unknown) {
      logger.warn("Failed to retrieve Supabase auth session for API request:", err);
    }
    return {};
  }

  async request<T = unknown>(
    endpoint: string,
    options: RequestOptions & { body?: BodyInit | Record<string, unknown> | null } = {}
  ): Promise<T> {
    const { params, skipAuth = false, headers = {}, body, ...customConfig } = options;

    const authHeaders = skipAuth ? {} : await this.getAuthHeader();
    const finalHeaders: Record<string, string> = {
      ...authHeaders,
      ...(headers as Record<string, string>),
    };

    let serializedBody: BodyInit | undefined;
    if (body !== undefined && body !== null) {
      if (
        typeof body === "string" ||
        body instanceof Blob ||
        body instanceof FormData ||
        body instanceof URLSearchParams ||
        body instanceof ArrayBuffer
      ) {
        serializedBody = body;
      } else {
        serializedBody = JSON.stringify(body);
        if (!finalHeaders["Content-Type"]) {
          finalHeaders["Content-Type"] = "application/json";
        }
      }
    }

    if (!finalHeaders["Accept"]) {
      finalHeaders["Accept"] = "application/json, text/plain, */*";
    }

    const url = this.buildUrl(endpoint, params);

    let response: Response;
    try {
      response = await fetch(url, {
        ...customConfig,
        headers: finalHeaders,
        body: serializedBody,
      });
    } catch (err: unknown) {
      if (
        (err instanceof Error && (err.name === "AbortError" || err.message.toLowerCase().includes("aborted"))) ||
        (customConfig.signal && customConfig.signal.aborted)
      ) {
        throw err;
      }
      const message =
        err instanceof Error ? err.message : "Network request failed";
      throw new ApiError(message, 0, "NetworkError", null, endpoint);
    }

    let responseData: unknown = null;
    const contentType = response.headers.get("content-type") || "";
    if (contentType.includes("application/json")) {
      try {
        responseData = await response.json();
      } catch {
        responseData = null;
      }
    } else {
      try {
        responseData = await response.text();
      } catch {
        responseData = null;
      }
    }

    if (!response.ok) {
      let errorMessage = `HTTP error ${response.status} (${response.statusText})`;
      if (responseData && typeof responseData === "object") {
        const payload = responseData as Record<string, unknown>;
        if (typeof payload.message === "string") {
          errorMessage = payload.message;
        } else if (typeof payload.error === "string") {
          errorMessage = payload.error;
        }
      } else if (typeof responseData === "string" && responseData.length > 0) {
        errorMessage = responseData;
      }

      throw new ApiError(
        errorMessage,
        response.status,
        response.statusText,
        responseData,
        endpoint
      );
    }

    return responseData as T;
  }

  get<T = unknown>(endpoint: string, options?: RequestOptions): Promise<T> {
    return this.request<T>(endpoint, { ...options, method: "GET" });
  }

  post<T = unknown>(
    endpoint: string,
    data?: unknown,
    options?: RequestOptions
  ): Promise<T> {
    return this.request<T>(endpoint, {
      ...options,
      method: "POST",
      body: data as BodyInit | Record<string, unknown>,
    });
  }

  put<T = unknown>(
    endpoint: string,
    data?: unknown,
    options?: RequestOptions
  ): Promise<T> {
    return this.request<T>(endpoint, {
      ...options,
      method: "PUT",
      body: data as BodyInit | Record<string, unknown>,
    });
  }

  patch<T = unknown>(
    endpoint: string,
    data?: unknown,
    options?: RequestOptions
  ): Promise<T> {
    return this.request<T>(endpoint, {
      ...options,
      method: "PATCH",
      body: data as BodyInit | Record<string, unknown>,
    });
  }

  delete<T = unknown>(endpoint: string, options?: RequestOptions): Promise<T> {
    return this.request<T>(endpoint, { ...options, method: "DELETE" });
  }
}

export const apiClient = new ApiClient();

export type RequestConfig<TData = unknown> = {
  url: string;
  method: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  params?: Record<string, unknown>;
  data?: TData | BodyInit;
  headers?: HeadersInit;
  signal?: AbortSignal;
};

export type ResponseConfig<TData = unknown> = {
  data: TData;
  status: number;
  headers: Headers;
};

export type ResponseErrorConfig<TError = unknown> = {
  data?: TError;
  status: number;
  headers: Headers;
};

export type Client = <TData = unknown, _TError = unknown, TVariables = unknown>(
  config: RequestConfig<TVariables>,
) => Promise<ResponseConfig<TData>>;

const DEFAULT_BASE_URL = "http://localhost:3333";
const DEFAULT_BASE_ORIGIN = new URL(DEFAULT_BASE_URL).origin;

type ImportMetaWithEnv = ImportMeta & {
  env?: {
    VITE_API_BASE_URL?: string;
  };
};

export function getApiBaseUrl() {
  return (import.meta as ImportMetaWithEnv).env?.VITE_API_BASE_URL?.trim() || DEFAULT_BASE_URL;
}

export function resolveApiUrl(url: string) {
  const baseUrl = getApiBaseUrl();
  const target = new URL(url, baseUrl);

  if (target.origin !== DEFAULT_BASE_ORIGIN) {
    return target.toString();
  }

  return new URL(`${target.pathname}${target.search}${target.hash}`, baseUrl).toString();
}

function buildUrl(baseURL: string, url: string, params?: Record<string, unknown>) {
  const rawTarget = new URL(url, baseURL);
  const target =
    rawTarget.origin === DEFAULT_BASE_ORIGIN
      ? new URL(`${rawTarget.pathname}${rawTarget.search}${rawTarget.hash}`, baseURL)
      : rawTarget;

  if (!params) {
    return target;
  }

  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === null) {
      continue;
    }

    if (Array.isArray(value)) {
      value.forEach((item) => {
        target.searchParams.append(key, String(item));
      });
      continue;
    }

    target.searchParams.set(key, String(value));
  }

  return target;
}

export const client: Client = async <TData, _TError, TVariables>(
  config: RequestConfig<TVariables>,
) => {
  const { url, method, params, data, headers, signal } = config;
  const isFormData = typeof FormData !== "undefined" && data instanceof FormData;

  const response = await fetch(buildUrl(getApiBaseUrl(), url, params), {
    method,
    headers: {
      ...(isFormData ? {} : { "content-type": "application/json" }),
      ...headers,
    },
    body: data === undefined ? undefined : isFormData ? data : JSON.stringify(data),
    credentials: "include",
    signal,
  });

  const contentType = response.headers.get("content-type");
  const body = contentType?.includes("application/json")
    ? ((await response.json()) as TData)
    : ((await response.text()) as TData);

  return {
    data: body,
    status: response.status,
    headers: response.headers,
  };
};

export default client;

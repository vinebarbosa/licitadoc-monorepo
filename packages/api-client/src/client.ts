export type RequestConfig<TData = unknown> = {
  url: string;
  method: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  params?: Record<string, unknown>;
  data?: TData;
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

function buildUrl(baseURL: string, url: string, params?: Record<string, unknown>) {
  const target = new URL(url, baseURL);

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

  const response = await fetch(buildUrl(DEFAULT_BASE_URL, url, params), {
    method,
    headers: {
      "content-type": "application/json",
      ...headers,
    },
    body: data === undefined ? undefined : JSON.stringify(data),
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

import type { CookieJar } from "./cookie-jar";
import type { ApiTestServer } from "./test-server";

export type JsonValue =
  | null
  | boolean
  | number
  | string
  | JsonValue[]
  | {
      [key: string]: JsonValue;
    };

export type TestRequestOptions = {
  body?: JsonValue;
  cookieJar?: CookieJar;
  method?: string;
};

export async function request(
  server: ApiTestServer,
  path: string,
  { body, cookieJar, method = "GET" }: TestRequestOptions = {},
) {
  const headers = new Headers();
  headers.set("accept", "application/json");
  headers.set("origin", server.baseUrl);

  if (body !== undefined) {
    headers.set("content-type", "application/json");
  }

  cookieJar?.apply(headers);

  const response = await fetch(`${server.baseUrl}${path}`, {
    method,
    headers,
    body: body === undefined ? undefined : JSON.stringify(body),
  });

  cookieJar?.store(response.headers);

  return response;
}

export async function readJson<T>(response: Response) {
  const text = await response.text();

  return text.length === 0 ? null : (JSON.parse(text) as T);
}

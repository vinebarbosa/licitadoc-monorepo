import type { AddressInfo } from "node:net";
import net from "node:net";
import { buildApp } from "../../../src/app/build-app";

export type ApiTestApp = Awaited<ReturnType<typeof buildApp>>;

export type ApiTestServer = {
  app: ApiTestApp;
  baseUrl: string;
  close: () => Promise<void>;
};

const TEST_HOST = "127.0.0.1";

async function reservePort() {
  return new Promise<number>((resolve, reject) => {
    const server = net.createServer();

    server.once("error", reject);
    server.listen(0, TEST_HOST, () => {
      const address = server.address();

      if (!address || typeof address === "string") {
        server.close(() => reject(new Error("Failed to reserve an ephemeral test port.")));
        return;
      }

      const { port } = address;
      server.close((error) => {
        if (error) {
          reject(error);
          return;
        }

        resolve(port);
      });
    });
  });
}

export async function startTestServer(): Promise<ApiTestServer> {
  const port = await reservePort();
  const baseUrl = `http://${TEST_HOST}:${port}`;
  const previousEnv = {
    NODE_ENV: process.env.NODE_ENV,
    HOST: process.env.HOST,
    PORT: process.env.PORT,
    BETTER_AUTH_URL: process.env.BETTER_AUTH_URL,
    CORS_ORIGIN: process.env.CORS_ORIGIN,
    DATABASE_URL: process.env.DATABASE_URL,
  };

  process.env.NODE_ENV = "test";
  process.env.HOST = TEST_HOST;
  process.env.PORT = String(port);
  process.env.BETTER_AUTH_URL = baseUrl;
  process.env.CORS_ORIGIN = baseUrl;

  if (process.env.AUTH_E2E_DATABASE_URL) {
    process.env.DATABASE_URL = process.env.AUTH_E2E_DATABASE_URL;
  }

  const app = await buildApp();

  await app.listen({
    host: TEST_HOST,
    port,
  });

  return {
    app,
    baseUrl,
    async close() {
      await app.close();

      for (const [key, value] of Object.entries(previousEnv)) {
        if (value === undefined) {
          delete process.env[key];
          continue;
        }

        process.env[key] = value;
      }
    },
  };
}

export function getListeningOrigin(app: ApiTestApp) {
  const address = app.server.address();

  if (!address || typeof address === "string") {
    throw new Error("Test server is not listening on a TCP address.");
  }

  const { address: host, port } = address as AddressInfo;

  return `http://${host}:${port}`;
}

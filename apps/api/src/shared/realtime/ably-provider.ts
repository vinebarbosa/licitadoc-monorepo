import * as Ably from "ably";
import type { RealtimeProvider } from "./types";

type AblyRestClient = {
  channels: {
    get: (channel: string) => {
      publish: (name: string, data: Record<string, unknown>) => Promise<void>;
    };
  };
  auth: {
    createTokenRequest: (input: {
      clientId: string;
      capability: string;
      ttl: number;
    }) => Promise<Record<string, unknown>> | Record<string, unknown>;
  };
};

function createAblyRestClient(apiKey: string): AblyRestClient {
  return new Ably.Rest({ key: apiKey }) as unknown as AblyRestClient;
}

export function createAblyRealtimeProvider(apiKey: string): RealtimeProvider {
  const client = createAblyRestClient(apiKey);

  return {
    providerKey: "ably",
    isEnabled: true,
    async publish({ channel, name, data }) {
      await client.channels.get(channel).publish(name, data);
    },
    async createTokenRequest({ clientId, capability, ttlMs }) {
      const tokenRequest = await client.auth.createTokenRequest({
        clientId,
        capability: JSON.stringify(capability),
        ttl: ttlMs,
      });

      return {
        provider: "ably",
        realtimeEnabled: true,
        tokenRequest,
      };
    },
  };
}

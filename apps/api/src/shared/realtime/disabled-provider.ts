import type { RealtimeProvider } from "./types";

export function createDisabledRealtimeProvider(): RealtimeProvider {
  return {
    providerKey: "disabled",
    isEnabled: false,
    async publish() {
      return;
    },
    async createTokenRequest() {
      return {
        provider: "disabled",
        realtimeEnabled: false,
        tokenRequest: null,
      };
    },
  };
}

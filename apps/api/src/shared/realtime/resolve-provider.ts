import { createAblyRealtimeProvider } from "./ably-provider";
import { createDisabledRealtimeProvider } from "./disabled-provider";
import type { RealtimeProvider } from "./types";

export function resolveRealtimeProvider({
  provider,
  ablyApiKey,
}: {
  provider: string;
  ablyApiKey?: string;
}): RealtimeProvider {
  if (provider === "ably" && ablyApiKey) {
    return createAblyRealtimeProvider(ablyApiKey);
  }

  return createDisabledRealtimeProvider();
}

export type RealtimeCapability = Record<string, string[]>;

export type RealtimePublishInput = {
  channel: string;
  name: string;
  data: Record<string, unknown>;
};

export type RealtimeTokenInput = {
  clientId: string;
  capability: RealtimeCapability;
  ttlMs: number;
};

export type RealtimeTokenResponse = {
  provider: string;
  realtimeEnabled: boolean;
  tokenRequest: Record<string, unknown> | null;
};

export type RealtimeProvider = {
  providerKey: string;
  isEnabled: boolean;
  publish(input: RealtimePublishInput): Promise<void>;
  createTokenRequest(input: RealtimeTokenInput): Promise<RealtimeTokenResponse>;
};

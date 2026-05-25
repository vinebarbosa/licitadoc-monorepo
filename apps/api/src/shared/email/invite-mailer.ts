import { renderInviteEmailHtml, renderInviteEmailText } from "./invite-email-template";

type InviteRole = "organization_owner" | "member";

export type InviteEmailInput = {
  brandMarkUrl?: string;
  expiresAt: Date;
  inviteId: string;
  inviteUrl: string;
  role: InviteRole;
  signInUrl?: string;
  temporaryPassword?: string;
  to: string;
};

export interface InviteMailer {
  sendInviteEmail(input: InviteEmailInput): Promise<void>;
}

type InviteMailerFetchResponse = {
  ok: boolean;
  status: number;
};

type InviteMailerFetch = (
  input: Parameters<typeof fetch>[0],
  init?: Parameters<typeof fetch>[1],
) => Promise<InviteMailerFetchResponse>;

export class InviteEmailDeliveryError extends Error {
  constructor(message = "Invite email delivery failed.", options?: ErrorOptions) {
    super(message, options);
    this.name = "InviteEmailDeliveryError";
  }
}

export class StubInviteMailer implements InviteMailer {
  readonly deliveries: InviteEmailInput[] = [];
  private nextFailure: Error | undefined;

  clear() {
    this.deliveries.splice(0);
    this.nextFailure = undefined;
  }

  failNextDelivery(error = new InviteEmailDeliveryError()) {
    this.nextFailure = error;
  }

  async sendInviteEmail(input: InviteEmailInput) {
    if (this.nextFailure) {
      const error = this.nextFailure;
      this.nextFailure = undefined;
      throw error;
    }

    this.deliveries.push(input);
  }
}

type ResendInviteMailerInput = {
  apiKey?: string;
  brandMarkUrl?: string;
  fetchFn?: InviteMailerFetch;
  fromEmail?: string;
};

const RESEND_API_BASE_URL = "https://api.resend.com";
const RESEND_USER_AGENT = "licitadoc-api/1.0";

export class ResendInviteMailer implements InviteMailer {
  private readonly apiKey: string;
  private readonly brandMarkUrl: string | undefined;
  private readonly fetchFn: InviteMailerFetch;
  private readonly fromEmail: string;

  constructor({
    apiKey,
    brandMarkUrl,
    fetchFn = fetch as InviteMailerFetch,
    fromEmail,
  }: ResendInviteMailerInput) {
    const normalizedApiKey = apiKey?.trim();
    const normalizedBrandMarkUrl = brandMarkUrl?.trim();
    const normalizedFromEmail = fromEmail?.trim();

    if (!normalizedApiKey || !normalizedFromEmail) {
      throw new InviteEmailDeliveryError("Resend invite e-mail configuration is incomplete.");
    }

    this.apiKey = normalizedApiKey;
    this.brandMarkUrl = normalizedBrandMarkUrl || undefined;
    this.fetchFn = fetchFn;
    this.fromEmail = normalizedFromEmail;
  }

  async sendInviteEmail(input: InviteEmailInput) {
    const html = await renderInviteEmailHtml({
      ...input,
      brandMarkUrl: input.brandMarkUrl ?? this.brandMarkUrl,
    });

    const response = await this.fetchFn(`${RESEND_API_BASE_URL}/emails`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
        "Content-Type": "application/json",
        "Idempotency-Key": `invite-${input.inviteId}`,
        "User-Agent": RESEND_USER_AGENT,
      },
      body: JSON.stringify({
        from: this.fromEmail,
        to: [input.to],
        subject: "Seu convite para acessar o Licitadoc",
        html,
        text: renderInviteEmailText(input),
        tags: [
          {
            name: "category",
            value: "invite",
          },
          {
            name: "invite_id",
            value: input.inviteId,
          },
        ],
      }),
    });

    if (!response.ok) {
      throw new InviteEmailDeliveryError(
        `Resend invite e-mail request failed with status ${response.status}.`,
      );
    }
  }
}

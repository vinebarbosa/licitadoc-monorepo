type InviteRole = "organization_owner" | "member";

export type InviteEmailInput = {
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
  fetchFn?: typeof fetch;
  fromEmail?: string;
};

const RESEND_API_BASE_URL = "https://api.resend.com";
const RESEND_USER_AGENT = "licitadoc-api/1.0";

export class ResendInviteMailer implements InviteMailer {
  private readonly apiKey: string;
  private readonly fetchFn: typeof fetch;
  private readonly fromEmail: string;

  constructor({ apiKey, fetchFn = fetch, fromEmail }: ResendInviteMailerInput) {
    const normalizedApiKey = apiKey?.trim();
    const normalizedFromEmail = fromEmail?.trim();

    if (!normalizedApiKey || !normalizedFromEmail) {
      throw new InviteEmailDeliveryError("Resend invite e-mail configuration is incomplete.");
    }

    this.apiKey = normalizedApiKey;
    this.fetchFn = fetchFn;
    this.fromEmail = normalizedFromEmail;
  }

  async sendInviteEmail(input: InviteEmailInput) {
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
        html: buildInviteEmailHtml(input),
        text: buildInviteEmailText(input),
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

function buildInviteEmailText(input: InviteEmailInput) {
  if (input.temporaryPassword) {
    return [
      "Voce foi convidado para acessar o Licitadoc.",
      `Perfil: ${getRoleLabel(input.role)}.`,
      `Acesse o sistema: ${input.signInUrl ?? input.inviteUrl}`,
      `Senha temporaria: ${input.temporaryPassword}`,
      "No primeiro acesso, voce devera informar seu nome e definir uma nova senha.",
      `Este convite expira em ${input.expiresAt.toISOString()}.`,
    ].join("\n");
  }

  return [
    "Voce foi convidado para acessar o Licitadoc.",
    `Perfil: ${getRoleLabel(input.role)}.`,
    `Acesse o convite: ${input.inviteUrl}`,
    `Este convite expira em ${input.expiresAt.toISOString()}.`,
  ].join("\n");
}

function buildInviteEmailHtml(input: InviteEmailInput) {
  const targetUrl = input.temporaryPassword
    ? (input.signInUrl ?? input.inviteUrl)
    : input.inviteUrl;
  const escapedInviteUrl = escapeHtml(targetUrl);

  if (input.temporaryPassword) {
    return [
      "<p>Voce foi convidado para acessar o Licitadoc.</p>",
      `<p>Perfil: <strong>${escapeHtml(getRoleLabel(input.role))}</strong>.</p>`,
      `<p><a href="${escapedInviteUrl}">Acessar o sistema</a></p>`,
      `<p>Senha temporaria: <strong>${escapeHtml(input.temporaryPassword)}</strong></p>`,
      "<p>No primeiro acesso, voce devera informar seu nome e definir uma nova senha.</p>",
      `<p>Este convite expira em ${escapeHtml(input.expiresAt.toISOString())}.</p>`,
    ].join("");
  }

  return [
    "<p>Voce foi convidado para acessar o Licitadoc.</p>",
    `<p>Perfil: <strong>${escapeHtml(getRoleLabel(input.role))}</strong>.</p>`,
    `<p><a href="${escapedInviteUrl}">Aceitar convite</a></p>`,
    `<p>Este convite expira em ${escapeHtml(input.expiresAt.toISOString())}.</p>`,
  ].join("");
}

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function getRoleLabel(role: InviteRole) {
  return role === "organization_owner" ? "gestor da organizacao" : "membro";
}

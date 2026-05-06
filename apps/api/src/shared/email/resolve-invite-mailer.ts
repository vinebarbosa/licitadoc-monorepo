import { type InviteMailer, ResendInviteMailer, StubInviteMailer } from "./invite-mailer";

type ResolveInviteMailerInput = {
  apiKey?: string;
  fromEmail?: string;
  providerKey: "stub" | "resend";
};

export function resolveInviteMailer({
  apiKey,
  fromEmail,
  providerKey,
}: ResolveInviteMailerInput): InviteMailer {
  if (providerKey === "stub") {
    return new StubInviteMailer();
  }

  return new ResendInviteMailer({
    apiKey,
    fromEmail,
  });
}

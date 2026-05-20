import assert from "node:assert/strict";
import { test } from "vitest";
import { renderInviteEmailHtml, renderInviteEmailText } from "./invite-email-template";
import type { InviteEmailInput } from "./invite-mailer";
import { ResendInviteMailer } from "./invite-mailer";

const ownerInviteInput: InviteEmailInput = {
  expiresAt: new Date("2030-01-01T00:00:00.000Z"),
  inviteId: "invite-owner-1",
  inviteUrl: "https://app.licitadoc.test/invites/owner-token",
  role: "organization_owner",
  to: "owner@example.com",
};

const provisionedMemberInviteInput: InviteEmailInput = {
  expiresAt: new Date("2030-01-02T00:00:00.000Z"),
  inviteId: "invite-member-1",
  inviteUrl: "https://app.licitadoc.test/invites/member-token",
  role: "member",
  signInUrl: "https://app.licitadoc.test/sign-in",
  temporaryPassword: "TempPass123",
  to: "member@example.com",
};

test("renderInviteEmailHtml renders branded organization owner invites", async () => {
  const html = await renderInviteEmailHtml(ownerInviteInput);
  const text = renderInviteEmailText(ownerInviteInput);

  assertLandingPageBranding(html);
  assertNoSvgLogoAssets(html);
  assertLightPalette(html);
  assert.match(html, /Voce foi convidado para o LicitaDoc/);
  assert.match(html, /gestor da organizacao/);
  assert.match(html, /Aceitar convite/);
  assert.match(html, /https:\/\/app\.licitadoc\.test\/invites\/owner-token/);
  assert.match(html, /2030-01-01T00:00:00\.000Z/);
  assert.match(text, /Acesse o convite: https:\/\/app\.licitadoc\.test\/invites\/owner-token/);
  assert.match(text, /Este convite expira em 2030-01-01T00:00:00\.000Z/);
});

test("renderInviteEmailHtml renders provisioned member credentials guidance", async () => {
  const html = await renderInviteEmailHtml(provisionedMemberInviteInput);
  const text = renderInviteEmailText(provisionedMemberInviteInput);

  assertLandingPageBranding(html);
  assertNoSvgLogoAssets(html);
  assertLightPalette(html);
  assert.match(html, /Seu acesso ao LicitaDoc foi criado/);
  assert.match(html, /membro/);
  assert.match(html, /Acessar o sistema/);
  assert.match(html, /https:\/\/app\.licitadoc\.test\/sign-in/);
  assert.match(html, /Senha temporaria/);
  assert.match(html, /TempPass123/);
  assert.match(html, /defina uma nova senha/);
  assert.match(html, /background-color:#eceff2/);
  assert.match(html, /2030-01-02T00:00:00\.000Z/);
  assert.match(text, /Acesse o sistema: https:\/\/app\.licitadoc\.test\/sign-in/);
  assert.match(text, /Senha temporaria: TempPass123/);
  assert.match(text, /No primeiro acesso, voce devera informar seu nome/);
});

test("ResendInviteMailer keeps invite delivery semantics with branded HTML", async () => {
  const requests: Array<{
    input: Parameters<typeof fetch>[0];
    init: Parameters<typeof fetch>[1];
  }> = [];
  const mailer = new ResendInviteMailer({
    apiKey: "resend-key",
    fetchFn: async (input, init) => {
      requests.push({ input, init });

      return {
        ok: true,
        status: 202,
      };
    },
    fromEmail: "LicitaDoc <convites@licitadoc.test>",
  });

  await mailer.sendInviteEmail(ownerInviteInput);

  assert.equal(requests.length, 1);
  assert.equal(requests[0]?.input, "https://api.resend.com/emails");
  assert.equal(requests[0]?.init?.method, "POST");

  const headers = requests[0]?.init?.headers as Record<string, string>;
  assert.equal(headers.Authorization, "Bearer resend-key");
  assert.equal(headers["Idempotency-Key"], "invite-invite-owner-1");

  const payload = JSON.parse(String(requests[0]?.init?.body)) as {
    from: string;
    html: string;
    subject: string;
    tags: Array<{ name: string; value: string }>;
    text: string;
    to: string[];
  };

  assert.equal(payload.from, "LicitaDoc <convites@licitadoc.test>");
  assert.deepEqual(payload.to, ["owner@example.com"]);
  assert.equal(payload.subject, "Seu convite para acessar o Licitadoc");
  assertLandingPageBranding(payload.html);
  assertNoSvgLogoAssets(payload.html);
  assert.match(payload.html, /Aceitar convite/);
  assert.match(
    payload.text,
    /Acesse o convite: https:\/\/app\.licitadoc\.test\/invites\/owner-token/,
  );
  assert.deepEqual(payload.tags, [
    {
      name: "category",
      value: "invite",
    },
    {
      name: "invite_id",
      value: "invite-owner-1",
    },
  ]);
});

test("ResendInviteMailer keeps provisioned member delivery semantics", async () => {
  const requests: Array<{
    input: Parameters<typeof fetch>[0];
    init: Parameters<typeof fetch>[1];
  }> = [];
  const mailer = new ResendInviteMailer({
    apiKey: "resend-key",
    fetchFn: async (input, init) => {
      requests.push({ input, init });

      return {
        ok: true,
        status: 202,
      };
    },
    fromEmail: "LicitaDoc <convites@licitadoc.test>",
  });

  await mailer.sendInviteEmail(provisionedMemberInviteInput);

  assert.equal(requests.length, 1);
  assert.equal(requests[0]?.input, "https://api.resend.com/emails");

  const headers = requests[0]?.init?.headers as Record<string, string>;
  assert.equal(headers["Idempotency-Key"], "invite-invite-member-1");

  const payload = JSON.parse(String(requests[0]?.init?.body)) as {
    html: string;
    tags: Array<{ name: string; value: string }>;
    text: string;
    to: string[];
  };

  assert.deepEqual(payload.to, ["member@example.com"]);
  assertLandingPageBranding(payload.html);
  assertNoSvgLogoAssets(payload.html);
  assert.match(payload.html, /Acessar o sistema/);
  assert.match(payload.html, /https:\/\/app\.licitadoc\.test\/sign-in/);
  assert.match(payload.html, /Senha temporaria/);
  assert.match(payload.html, /TempPass123/);
  assert.match(payload.text, /Acesse o sistema: https:\/\/app\.licitadoc\.test\/sign-in/);
  assert.match(payload.text, /Senha temporaria: TempPass123/);
  assert.deepEqual(payload.tags, [
    {
      name: "category",
      value: "invite",
    },
    {
      name: "invite_id",
      value: "invite-member-1",
    },
  ]);
});

function assertLandingPageBranding(html: string) {
  const cardIndex = html.indexOf("background-color:#ffffff;border:1px solid #d9dfe5");
  const brandIndex = html.indexOf('data-brand-mark="landing-scale"');

  assert.ok(cardIndex >= 0);
  assert.ok(brandIndex > cardIndex);
  assert.match(html, /Logo LicitaDoc/);
  assert.match(html, /data-brand-mark="landing-scale"/);
  assert.match(html, /<img/);
  assert.match(html, /src="https:\/\/app\.licitadoc\.test\/brand\/licitadoc-email-mark\.png"/);
  assert.match(html, /alt="Logo LicitaDoc"/);
  assert.match(html, /height="32"/);
  assert.match(html, /width="32"/);
  assert.match(html, /height:56px/);
  assert.match(html, /width:56px/);
  assert.match(html, /LicitaDoc/);
  assert.doesNotMatch(html, />LD</);
}

function assertNoSvgLogoAssets(html: string) {
  assert.doesNotMatch(html, /<svg/i);
  assert.doesNotMatch(html, /image\/svg\+xml/i);
  assert.doesNotMatch(html, /\.svg\b/i);
}

function assertLightPalette(html: string) {
  assert.match(html, /name="color-scheme" content="light"|content="light" name="color-scheme"/);
  assert.match(
    html,
    /name="supported-color-schemes" content="light"|content="light" name="supported-color-schemes"/,
  );
  assert.match(html, /background-color:#f9fafb/);
  assert.match(html, /background-color:#fff/);
  assert.match(html, /background-color:#004f6a/);
  assert.match(html, /color:#f8f8f8/);
  assert.match(html, /border:1px solid #d9dfe5/);
  assert.match(html, /background-color:#e6eef1/);
}

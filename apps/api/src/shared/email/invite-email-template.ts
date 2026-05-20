import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Preview,
  Section,
  Text,
} from "@react-email/components";
import { render } from "@react-email/render";
import React from "react";
import type { InviteEmailInput } from "./invite-mailer";

const BRAND_NAME = "LicitaDoc";
const EMAIL_PALETTE = {
  background: "#f9fafb",
  border: "#d9dfe5",
  card: "#ffffff",
  foreground: "#0f171f",
  muted: "#eceff2",
  mutedForeground: "#5b646f",
  primary: "#004f6a",
  primaryForeground: "#f8f8f8",
  primaryTint: "#e6eef1",
  primaryTintBorder: "#c9dce3",
};

type InviteEmailView = {
  actionLabel: string;
  helpText: string;
  preview: string;
  targetUrl: string;
};

export async function renderInviteEmailHtml(input: InviteEmailInput) {
  return render(React.createElement(InviteEmail, input));
}

export function renderInviteEmailText(input: InviteEmailInput) {
  if (input.temporaryPassword) {
    return [
      "Voce foi convidado para acessar o LicitaDoc.",
      `Perfil: ${getRoleLabel(input.role)}.`,
      `Acesse o sistema: ${input.signInUrl ?? input.inviteUrl}`,
      `Senha temporaria: ${input.temporaryPassword}`,
      "No primeiro acesso, voce devera informar seu nome e definir uma nova senha.",
      `Este convite expira em ${input.expiresAt.toISOString()}.`,
    ].join("\n");
  }

  return [
    "Voce foi convidado para acessar o LicitaDoc.",
    `Perfil: ${getRoleLabel(input.role)}.`,
    `Acesse o convite: ${input.inviteUrl}`,
    `Este convite expira em ${input.expiresAt.toISOString()}.`,
  ].join("\n");
}

function InviteEmail(input: InviteEmailInput) {
  const view = getInviteEmailView(input);
  const expiresAt = input.expiresAt.toISOString();
  const roleLabel = getRoleLabel(input.role);

  return React.createElement(
    Html,
    null,
    React.createElement(
      Head,
      null,
      React.createElement("meta", { content: "light", name: "color-scheme" }),
      React.createElement("meta", { content: "light", name: "supported-color-schemes" }),
      React.createElement(
        "style",
        null,
        ":root{color-scheme:light;supported-color-schemes:light;}",
      ),
    ),
    React.createElement(Preview, null, view.preview),
    React.createElement(
      Body,
      { style: styles.body },
      React.createElement(
        Container,
        { style: styles.container },
        React.createElement(
          Section,
          { style: styles.brandHeader },
          React.createElement(
            "div",
            {
              "aria-label": `Logo ${BRAND_NAME}`,
              "data-brand-mark": "landing-scale",
              role: "img",
              style: styles.brandIdentity,
            },
            React.createElement(
              "span",
              { style: styles.brandMark },
              React.createElement(ScaleBrandIcon),
            ),
            React.createElement("span", { style: styles.brandName }, BRAND_NAME),
          ),
        ),
        React.createElement(
          Section,
          { style: styles.card },
          React.createElement(Heading, { as: "h1", style: styles.heading }, view.preview),
          React.createElement(
            Text,
            { style: styles.paragraph },
            "Voce recebeu um convite para acessar o LicitaDoc.",
          ),
          React.createElement(
            Text,
            { style: styles.paragraph },
            "Perfil: ",
            React.createElement("strong", null, roleLabel),
            ".",
          ),
          React.createElement(
            Button,
            {
              href: view.targetUrl,
              style: styles.button,
            },
            view.actionLabel,
          ),
          React.createElement(Text, { style: styles.helpText }, view.helpText),
          input.temporaryPassword
            ? React.createElement(
                Section,
                { style: styles.passwordBox },
                React.createElement(Text, { style: styles.passwordLabel }, "Senha temporaria"),
                React.createElement(Text, { style: styles.passwordValue }, input.temporaryPassword),
                React.createElement(
                  Text,
                  { style: styles.passwordHelp },
                  "No primeiro acesso, informe seu nome e defina uma nova senha.",
                ),
              )
            : null,
          React.createElement(Hr, { style: styles.divider }),
          React.createElement(
            Text,
            { style: styles.expiration },
            `Este convite expira em ${expiresAt}.`,
          ),
        ),
        React.createElement(
          Text,
          { style: styles.footer },
          "Se voce nao esperava este convite, ignore este e-mail.",
        ),
      ),
    ),
  );
}

function getInviteEmailView(input: InviteEmailInput): InviteEmailView {
  if (input.temporaryPassword) {
    return {
      actionLabel: "Acessar o sistema",
      helpText: "Use a senha temporaria abaixo para concluir seu primeiro acesso.",
      preview: "Seu acesso ao LicitaDoc foi criado",
      targetUrl: input.signInUrl ?? input.inviteUrl,
    };
  }

  return {
    actionLabel: "Aceitar convite",
    helpText: "Clique no botao para aceitar o convite e concluir seu acesso.",
    preview: "Voce foi convidado para o LicitaDoc",
    targetUrl: input.inviteUrl,
  };
}

function getRoleLabel(role: InviteEmailInput["role"]) {
  return role === "organization_owner" ? "gestor da organizacao" : "membro";
}

function ScaleBrandIcon() {
  return React.createElement(
    "svg",
    {
      "aria-hidden": "true",
      fill: "none",
      height: "20",
      stroke: EMAIL_PALETTE.primary,
      strokeLinecap: "round",
      strokeLinejoin: "round",
      strokeWidth: "2.4",
      style: styles.brandIcon,
      viewBox: "0 0 24 24",
      width: "20",
      xmlns: "http://www.w3.org/2000/svg",
    },
    React.createElement("path", { d: "m16 16 3-8 3 8c-.87.65-1.92 1-3 1s-2.13-.35-3-1Z" }),
    React.createElement("path", { d: "m2 16 3-8 3 8c-.87.65-1.92 1-3 1s-2.13-.35-3-1Z" }),
    React.createElement("path", { d: "M7 21h10" }),
    React.createElement("path", { d: "M12 3v18" }),
    React.createElement("path", { d: "M3 7h2c2 0 5-1 7-2 2 1 5 2 7 2h2" }),
  );
}

const styles = {
  body: {
    backgroundColor: EMAIL_PALETTE.background,
    color: EMAIL_PALETTE.foreground,
    fontFamily:
      "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
    margin: 0,
  },
  brandHeader: {
    padding: "28px 0 18px",
    textAlign: "center" as const,
  },
  brandIdentity: {
    display: "inline-block",
    margin: "0 auto",
  },
  brandIcon: {
    display: "block",
    margin: "0 auto",
  },
  brandMark: {
    backgroundColor: EMAIL_PALETTE.primaryTint,
    border: `1px solid ${EMAIL_PALETTE.primaryTintBorder}`,
    borderRadius: "8px",
    color: EMAIL_PALETTE.primary,
    display: "inline-block",
    height: "36px",
    lineHeight: "36px",
    margin: "0 10px 0 0",
    padding: "8px",
    textAlign: "center" as const,
    verticalAlign: "middle",
    width: "36px",
  },
  brandName: {
    color: EMAIL_PALETTE.foreground,
    display: "inline-block",
    fontSize: "18px",
    fontWeight: 700,
    letterSpacing: "0",
    margin: 0,
    verticalAlign: "middle",
  },
  button: {
    backgroundColor: EMAIL_PALETTE.primary,
    borderRadius: "8px",
    color: EMAIL_PALETTE.primaryForeground,
    display: "inline-block",
    fontSize: "15px",
    fontWeight: 700,
    lineHeight: "20px",
    margin: "18px 0 16px",
    padding: "13px 22px",
    textDecoration: "none",
  },
  card: {
    backgroundColor: EMAIL_PALETTE.card,
    border: `1px solid ${EMAIL_PALETTE.border}`,
    borderRadius: "8px",
    padding: "32px",
  },
  container: {
    margin: "0 auto",
    maxWidth: "560px",
    padding: "0 20px 32px",
  },
  divider: {
    borderColor: EMAIL_PALETTE.border,
    margin: "26px 0 18px",
  },
  expiration: {
    color: EMAIL_PALETTE.mutedForeground,
    fontSize: "13px",
    lineHeight: "20px",
    margin: 0,
  },
  footer: {
    color: EMAIL_PALETTE.mutedForeground,
    fontSize: "12px",
    lineHeight: "18px",
    margin: "18px 0 0",
    textAlign: "center" as const,
  },
  heading: {
    color: EMAIL_PALETTE.foreground,
    fontSize: "24px",
    fontWeight: 700,
    letterSpacing: "0",
    lineHeight: "32px",
    margin: "0 0 18px",
  },
  helpText: {
    color: EMAIL_PALETTE.mutedForeground,
    fontSize: "14px",
    lineHeight: "22px",
    margin: "0 0 4px",
  },
  paragraph: {
    color: EMAIL_PALETTE.foreground,
    fontSize: "15px",
    lineHeight: "24px",
    margin: "0 0 12px",
  },
  passwordBox: {
    backgroundColor: EMAIL_PALETTE.muted,
    border: `1px solid ${EMAIL_PALETTE.border}`,
    borderRadius: "8px",
    margin: "18px 0 0",
    padding: "16px",
  },
  passwordHelp: {
    color: EMAIL_PALETTE.mutedForeground,
    fontSize: "13px",
    lineHeight: "20px",
    margin: "10px 0 0",
  },
  passwordLabel: {
    color: EMAIL_PALETTE.mutedForeground,
    fontSize: "12px",
    fontWeight: 700,
    lineHeight: "18px",
    margin: "0 0 6px",
    textTransform: "uppercase" as const,
  },
  passwordValue: {
    color: EMAIL_PALETTE.foreground,
    fontFamily: "Menlo, Consolas, 'Liberation Mono', monospace",
    fontSize: "18px",
    fontWeight: 700,
    letterSpacing: "0",
    lineHeight: "24px",
    margin: 0,
  },
};

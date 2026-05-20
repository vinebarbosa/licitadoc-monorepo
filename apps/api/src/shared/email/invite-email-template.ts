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
const BRAND_MARK = "LD";

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
    React.createElement(Head),
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
            Text,
            { style: styles.brandMark, role: "img", "aria-label": `Logo ${BRAND_NAME}` },
            BRAND_MARK,
          ),
          React.createElement(Text, { style: styles.brandName }, BRAND_NAME),
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

const styles = {
  body: {
    backgroundColor: "#f6f8fb",
    color: "#172033",
    fontFamily:
      "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
    margin: 0,
  },
  brandHeader: {
    padding: "28px 0 18px",
    textAlign: "center" as const,
  },
  brandMark: {
    backgroundColor: "#0f766e",
    borderRadius: "14px",
    color: "#ffffff",
    display: "inline-block",
    fontSize: "18px",
    fontWeight: 700,
    height: "44px",
    lineHeight: "44px",
    margin: "0 auto 10px",
    textAlign: "center" as const,
    width: "44px",
  },
  brandName: {
    color: "#172033",
    fontSize: "18px",
    fontWeight: 700,
    letterSpacing: "0",
    margin: 0,
  },
  button: {
    backgroundColor: "#0f766e",
    borderRadius: "8px",
    color: "#ffffff",
    display: "inline-block",
    fontSize: "15px",
    fontWeight: 700,
    lineHeight: "20px",
    margin: "18px 0 16px",
    padding: "13px 22px",
    textDecoration: "none",
  },
  card: {
    backgroundColor: "#ffffff",
    border: "1px solid #d9e2ec",
    borderRadius: "8px",
    padding: "32px",
  },
  container: {
    margin: "0 auto",
    maxWidth: "560px",
    padding: "0 20px 32px",
  },
  divider: {
    borderColor: "#d9e2ec",
    margin: "26px 0 18px",
  },
  expiration: {
    color: "#526071",
    fontSize: "13px",
    lineHeight: "20px",
    margin: 0,
  },
  footer: {
    color: "#6b7787",
    fontSize: "12px",
    lineHeight: "18px",
    margin: "18px 0 0",
    textAlign: "center" as const,
  },
  heading: {
    color: "#172033",
    fontSize: "24px",
    fontWeight: 700,
    letterSpacing: "0",
    lineHeight: "32px",
    margin: "0 0 18px",
  },
  helpText: {
    color: "#526071",
    fontSize: "14px",
    lineHeight: "22px",
    margin: "0 0 4px",
  },
  paragraph: {
    color: "#263244",
    fontSize: "15px",
    lineHeight: "24px",
    margin: "0 0 12px",
  },
  passwordBox: {
    backgroundColor: "#eef7f5",
    border: "1px solid #b7ded7",
    borderRadius: "8px",
    margin: "18px 0 0",
    padding: "16px",
  },
  passwordHelp: {
    color: "#526071",
    fontSize: "13px",
    lineHeight: "20px",
    margin: "10px 0 0",
  },
  passwordLabel: {
    color: "#526071",
    fontSize: "12px",
    fontWeight: 700,
    lineHeight: "18px",
    margin: "0 0 6px",
    textTransform: "uppercase" as const,
  },
  passwordValue: {
    color: "#172033",
    fontFamily: "Menlo, Consolas, 'Liberation Mono', monospace",
    fontSize: "18px",
    fontWeight: 700,
    letterSpacing: "0",
    lineHeight: "24px",
    margin: 0,
  },
};

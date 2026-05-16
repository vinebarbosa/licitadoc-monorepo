import type { HelpContext, HelpQuickActionId } from "./help-context";

export function getInitialHelpMessage(context: HelpContext) {
  return `Olá. Estou aqui para ajudar com ${context.subtitle.toLowerCase()}. Você pode escolher uma sugestão ou descrever sua dúvida.`;
}

export function getQuickActionResponse(actionId: HelpQuickActionId) {
  switch (actionId) {
    case "generate-document":
      return "Para gerar um documento, abra o processo desejado e use a ação de geração. Confira o tipo de documento, o processo vinculado e revise a prévia antes de imprimir.";
    case "import-pdf":
      return "Para importar um PDF, inicie um novo processo e selecione a opção de preencher a partir da solicitação de despesa. Depois revise objeto, itens, justificativa e departamentos antes de salvar.";
    case "invite-member":
      return "Para convidar um membro, acesse Membros, informe nome e e-mail institucional e envie o convite. A pessoa concluirá o perfil antes de acessar os fluxos do órgão.";
    case "support":
      return "Posso orientar por aqui com passos seguros. Se precisar de atendimento humano, registre a dúvida com o processo, documento ou tela em que você está trabalhando.";
  }
}

export function getLocalHelpResponse(message: string, context: HelpContext) {
  const normalizedMessage = message.toLocaleLowerCase("pt-BR");

  if (normalizedMessage.includes("pdf") || normalizedMessage.includes("import")) {
    return getQuickActionResponse("import-pdf");
  }

  if (normalizedMessage.includes("document")) {
    return getQuickActionResponse("generate-document");
  }

  if (
    normalizedMessage.includes("membro") ||
    normalizedMessage.includes("convite") ||
    normalizedMessage.includes("usuário") ||
    normalizedMessage.includes("usuario")
  ) {
    return getQuickActionResponse("invite-member");
  }

  if (normalizedMessage.includes("suporte") || normalizedMessage.includes("atendimento")) {
    return getQuickActionResponse("support");
  }

  return `Para esta tela, recomendo começar por: ${context.suggestions[0]} Se quiser, descreva o processo ou documento e eu organizo os próximos passos.`;
}

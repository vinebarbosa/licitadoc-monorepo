import {
  Bot,
  Camera,
  CheckCheck,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock,
  FileText,
  Headphones,
  History,
  MessageCircle,
  Minus,
  Paperclip,
  Plus,
  Send,
  Sparkles,
  Upload,
  UserPlus,
  X,
} from "lucide-react";
import { type ComponentType, type FormEvent, useEffect, useMemo, useRef, useState } from "react";
import { useLocation } from "react-router-dom";
import { cn } from "@/shared/lib/utils";
import { Button } from "@/shared/ui/button";
import { Textarea } from "@/shared/ui/textarea";
import {
  getContextualHelpContext,
  type HelpQuickAction,
  type HelpQuickActionId,
} from "../model/help-context";
import {
  getInitialHelpMessage,
  getLocalHelpResponse,
  getQuickActionResponse,
} from "../model/help-responses";
import {
  createSupportHistoryEntry,
  createSupportProtocol,
  getDeterministicSupportReply,
  getInitialSupportReply,
  getSupportIntakeMessage,
  getSupportStatusLabel,
  SEEDED_SUPPORT_HISTORY,
  SUPPORT_ESTIMATED_RESPONSE,
  type SupportHistoryRecord,
  type SupportMessage,
  updateSupportHistoryEntry,
} from "../model/help-support";

type HelpMessage = {
  id: string;
  role: "assistant" | "user";
  content: string;
};

type HelpMode = "assistant" | "support-intake" | "support-chat" | "support-history";

const actionIcons: Record<HelpQuickActionId, ComponentType<{ className?: string }>> = {
  "generate-document": FileText,
  "import-pdf": Upload,
  "invite-member": UserPlus,
  support: Headphones,
};

function createMessage(role: HelpMessage["role"], content: string): HelpMessage {
  return {
    id: `${role}-${Date.now()}-${Math.random().toString(16).slice(2)}`,
    role,
    content,
  };
}

function getCurrentTimeLabel() {
  return new Date().toLocaleTimeString("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function createSupportMessage(
  role: SupportMessage["role"],
  content: string,
  status?: SupportMessage["status"],
): SupportMessage {
  return {
    id: `${role}-${Date.now()}-${Math.random().toString(16).slice(2)}`,
    role,
    content,
    time: getCurrentTimeLabel(),
    status,
  };
}

function createScreenshotPreviewMessage(contextTitle: string): SupportMessage {
  return {
    id: `screenshot-${Date.now()}-${Math.random().toString(16).slice(2)}`,
    role: "user",
    content: "Captura de tela anexada",
    time: getCurrentTimeLabel(),
    status: "read",
    attachment: {
      type: "screenshot",
      title: "Captura de tela",
      subtitle: contextTitle,
    },
  };
}

export function ContextualHelpWidget() {
  const location = useLocation();
  const context = useMemo(() => getContextualHelpContext(location.pathname), [location.pathname]);
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [mode, setMode] = useState<HelpMode>("assistant");
  const [inputValue, setInputValue] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [areSuggestionsVisible, setAreSuggestionsVisible] = useState(false);
  const [areQuickActionsVisible, setAreQuickActionsVisible] = useState(false);
  const [supportIssue, setSupportIssue] = useState("");
  const [supportInputValue, setSupportInputValue] = useState("");
  const [isSupportTyping, setIsSupportTyping] = useState(false);
  const [isScreenshotAttached, setIsScreenshotAttached] = useState(false);
  const [supportProtocol, setSupportProtocol] = useState(() => createSupportProtocol(context.key));
  const [activeSupportRecordId, setActiveSupportRecordId] = useState<string | null>(null);
  const [supportHistory, setSupportHistory] =
    useState<SupportHistoryRecord[]>(SEEDED_SUPPORT_HISTORY);
  const [supportMessages, setSupportMessages] = useState<SupportMessage[]>([]);
  const [messages, setMessages] = useState<HelpMessage[]>(() => [
    createMessage("assistant", getInitialHelpMessage(context)),
  ]);
  const responseTimeoutRef = useRef<number | null>(null);
  const supportResponseTimeoutRef = useRef<number | null>(null);

  useEffect(() => {
    setMessages([createMessage("assistant", getInitialHelpMessage(context))]);
    setIsTyping(false);
    setAreSuggestionsVisible(false);
    setAreQuickActionsVisible(false);
    setMode("assistant");
    setSupportIssue("");
    setSupportInputValue("");
    setSupportMessages([]);
    setIsSupportTyping(false);
    setIsScreenshotAttached(false);
    setActiveSupportRecordId(null);
    setSupportProtocol(createSupportProtocol(context.key));

    if (responseTimeoutRef.current !== null) {
      window.clearTimeout(responseTimeoutRef.current);
      responseTimeoutRef.current = null;
    }

    if (supportResponseTimeoutRef.current !== null) {
      window.clearTimeout(supportResponseTimeoutRef.current);
      supportResponseTimeoutRef.current = null;
    }
  }, [context]);

  useEffect(() => {
    return () => {
      if (responseTimeoutRef.current !== null) {
        window.clearTimeout(responseTimeoutRef.current);
      }
      if (supportResponseTimeoutRef.current !== null) {
        window.clearTimeout(supportResponseTimeoutRef.current);
      }
    };
  }, []);

  function queueAssistantResponse(content: string) {
    setIsTyping(true);

    if (responseTimeoutRef.current !== null) {
      window.clearTimeout(responseTimeoutRef.current);
    }

    responseTimeoutRef.current = window.setTimeout(() => {
      setMessages((currentMessages) => [...currentMessages, createMessage("assistant", content)]);
      setIsTyping(false);
      responseTimeoutRef.current = null;
    }, 250);
  }

  function submitMessage(message: string) {
    const trimmedMessage = message.trim();

    if (!trimmedMessage) {
      return;
    }

    setMessages((currentMessages) => [...currentMessages, createMessage("user", trimmedMessage)]);
    setInputValue("");
    setAreSuggestionsVisible(false);
    setAreQuickActionsVisible(false);
    queueAssistantResponse(getLocalHelpResponse(trimmedMessage, context));
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    submitMessage(inputValue);
  }

  function handleQuickAction(action: HelpQuickAction) {
    if (action.id === "support") {
      setMode("support-intake");
      setAreSuggestionsVisible(false);
      setAreQuickActionsVisible(false);
      setIsTyping(false);
      setSupportIssue("");
      setSupportInputValue("");
      setSupportMessages([]);
      setIsScreenshotAttached(false);
      setActiveSupportRecordId(null);

      if (responseTimeoutRef.current !== null) {
        window.clearTimeout(responseTimeoutRef.current);
        responseTimeoutRef.current = null;
      }

      return;
    }

    setMessages((currentMessages) => [
      ...currentMessages,
      createMessage("user", `Ação: ${action.label}`),
    ]);
    setAreSuggestionsVisible(false);
    setAreQuickActionsVisible(false);
    queueAssistantResponse(getQuickActionResponse(action.id));
  }

  function returnToAssistant() {
    setMode("assistant");
    setIsSupportTyping(false);

    if (supportResponseTimeoutRef.current !== null) {
      window.clearTimeout(supportResponseTimeoutRef.current);
      supportResponseTimeoutRef.current = null;
    }
  }

  function startNewSupportRequest() {
    setMode("support-intake");
    setSupportIssue("");
    setSupportInputValue("");
    setSupportMessages([]);
    setIsSupportTyping(false);
    setIsScreenshotAttached(false);
    setActiveSupportRecordId(null);

    if (supportResponseTimeoutRef.current !== null) {
      window.clearTimeout(supportResponseTimeoutRef.current);
      supportResponseTimeoutRef.current = null;
    }
  }

  function openSupportHistory() {
    setMode("support-history");
    setIsSupportTyping(false);

    if (supportResponseTimeoutRef.current !== null) {
      window.clearTimeout(supportResponseTimeoutRef.current);
      supportResponseTimeoutRef.current = null;
    }
  }

  function openSupportHistoryRecord(record: SupportHistoryRecord) {
    setSupportProtocol(record.protocol);
    setSupportMessages(record.messages);
    setSupportInputValue("");
    setActiveSupportRecordId(record.id);
    setMode("support-chat");
  }

  function handleSupportIntakeSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const trimmedIssue = supportIssue.trim();

    if (!trimmedIssue) {
      return;
    }

    const nextProtocol = createSupportProtocol(context.key);

    const nextMessages = [
      createSupportMessage("system", `Atendimento ${nextProtocol} iniciado`),
      ...(isScreenshotAttached ? [createScreenshotPreviewMessage(context.title)] : []),
      createSupportMessage("user", trimmedIssue, "read"),
      createSupportMessage("support", getInitialSupportReply(context)),
    ];
    const nextHistoryEntry = createSupportHistoryEntry({
      protocol: nextProtocol,
      issue: trimmedIssue,
      messages: nextMessages,
      hasScreenshot: isScreenshotAttached,
    });

    setSupportProtocol(nextProtocol);
    setSupportMessages(nextMessages);
    setSupportHistory((currentHistory) => [nextHistoryEntry, ...currentHistory]);
    setActiveSupportRecordId(nextHistoryEntry.id);
    setSupportInputValue("");
    setMode("support-chat");
  }

  function queueSupportResponse(content: string) {
    setIsSupportTyping(true);

    if (supportResponseTimeoutRef.current !== null) {
      window.clearTimeout(supportResponseTimeoutRef.current);
    }

    supportResponseTimeoutRef.current = window.setTimeout(() => {
      setSupportMessages((currentMessages) => {
        const nextMessages = [...currentMessages, createSupportMessage("support", content)];

        if (activeSupportRecordId !== null) {
          setSupportHistory((currentHistory) =>
            updateSupportHistoryEntry(currentHistory, activeSupportRecordId, nextMessages, content),
          );
        }

        return nextMessages;
      });
      setIsSupportTyping(false);
      supportResponseTimeoutRef.current = null;
    }, 450);
  }

  function submitSupportMessage(message: string) {
    const trimmedMessage = message.trim();

    if (!trimmedMessage) {
      return;
    }

    setSupportMessages((currentMessages) => {
      const nextMessages = [
        ...currentMessages,
        createSupportMessage("user", trimmedMessage, "sent"),
      ];

      if (activeSupportRecordId !== null) {
        setSupportHistory((currentHistory) =>
          updateSupportHistoryEntry(
            currentHistory,
            activeSupportRecordId,
            nextMessages,
            trimmedMessage,
          ),
        );
      }

      return nextMessages;
    });
    setSupportInputValue("");
    queueSupportResponse(getDeterministicSupportReply(trimmedMessage));
  }

  function handleSupportChatSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    submitSupportMessage(supportInputValue);
  }

  function handleOpenToggle() {
    setIsOpen((currentValue) => !currentValue);
    setIsMinimized(false);
  }

  const headerSubtitle =
    mode === "assistant"
      ? "Assistente disponível agora"
      : `${SUPPORT_ESTIMATED_RESPONSE} no suporte`;
  const activeSupportRecord =
    activeSupportRecordId === null
      ? null
      : (supportHistory.find((record) => record.id === activeSupportRecordId) ?? null);
  const isActiveSupportConversation = activeSupportRecord?.status !== "resolved";

  return (
    <div className="pointer-events-none fixed right-4 bottom-4 z-50 flex max-w-[calc(100vw-2rem)] flex-col items-end gap-3 sm:right-6 sm:bottom-6">
      {isOpen ? (
        <section
          aria-label="Ajuda do LicitaDoc"
          className={cn(
            "pointer-events-auto w-[calc(100vw-2rem)] overflow-hidden rounded-lg border border-border bg-card text-card-foreground shadow-xl sm:w-[24rem]",
            isMinimized ? "max-h-16" : "max-h-[min(42rem,calc(100vh-6rem))]",
          )}
        >
          <header className="flex items-center gap-3 border-b bg-primary px-4 py-3 text-primary-foreground">
            <div className="relative flex size-9 shrink-0 items-center justify-center rounded-md bg-primary-foreground/15">
              <Bot className="size-4" aria-hidden="true" />
              <span className="-right-0.5 -bottom-0.5 absolute size-3 rounded-full border-2 border-primary bg-emerald-400" />
            </div>
            <div className="min-w-0 flex-1">
              <h2 className="truncate font-semibold text-sm">{context.title}</h2>
              <p className="truncate text-primary-foreground/75 text-xs">
                {isMinimized ? "Chat minimizado" : headerSubtitle}
              </p>
            </div>
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              className="text-primary-foreground/80 hover:bg-primary-foreground/15 hover:text-primary-foreground"
              aria-label={isMinimized ? "Expandir ajuda" : "Minimizar ajuda"}
              onClick={() => setIsMinimized((currentValue) => !currentValue)}
            >
              <Minus className="size-4" aria-hidden="true" />
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              className="text-primary-foreground/80 hover:bg-primary-foreground/15 hover:text-primary-foreground"
              aria-label="Fechar ajuda"
              onClick={() => {
                setIsOpen(false);
                setIsMinimized(false);
              }}
            >
              <X className="size-4" aria-hidden="true" />
            </Button>
          </header>

          {!isMinimized && (
            <div className="flex h-[min(38rem,calc(100vh-8rem))] min-h-0 flex-col">
              {mode === "assistant" ? (
                <>
                  {areSuggestionsVisible ? (
                    <div className="border-b bg-muted/40 px-4 py-2.5">
                      <div className="mb-2 flex items-center gap-2 text-muted-foreground text-xs">
                        <Sparkles className="size-3.5 text-primary" aria-hidden="true" />
                        <span className="flex-1">Sugestões para esta tela</span>
                        <button
                          type="button"
                          className="font-medium text-primary text-xs hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                          onClick={() => setAreSuggestionsVisible(false)}
                        >
                          Ocultar
                        </button>
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {context.suggestions.map((suggestion) => (
                          <button
                            key={suggestion}
                            type="button"
                            className="rounded-md border bg-background px-2.5 py-1.5 text-left text-xs transition-colors hover:border-primary/40 hover:bg-primary/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                            onClick={() => submitMessage(suggestion)}
                          >
                            {suggestion}
                          </button>
                        ))}
                      </div>
                    </div>
                  ) : null}

                  <div className="min-h-0 flex-1 space-y-3 overflow-y-auto bg-background/40 px-4 py-4">
                    {messages.map((message) => (
                      <div
                        key={message.id}
                        className={cn(
                          "flex gap-2",
                          message.role === "user" ? "justify-end" : "justify-start",
                        )}
                      >
                        {message.role === "assistant" ? (
                          <div className="mt-1 flex size-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                            <Bot className="size-3.5" aria-hidden="true" />
                          </div>
                        ) : null}
                        <div
                          className={cn(
                            "max-w-[86%] rounded-lg px-3 py-2 text-sm leading-relaxed shadow-xs",
                            message.role === "user"
                              ? "bg-primary text-primary-foreground"
                              : "border bg-background",
                          )}
                        >
                          {message.content}
                        </div>
                      </div>
                    ))}
                    {isTyping ? (
                      <div className="flex items-center gap-2 text-muted-foreground text-xs">
                        <div className="flex size-6 items-center justify-center rounded-full bg-primary/10 text-primary">
                          <Bot className="size-3.5" aria-hidden="true" />
                        </div>
                        <span>Preparando orientação segura...</span>
                      </div>
                    ) : null}
                  </div>

                  <div className="border-t px-4 py-3">
                    {areQuickActionsVisible ? (
                      <div className="mb-3">
                        <div className="mb-2 flex items-center gap-2 text-muted-foreground text-xs">
                          <span className="flex-1">Ações rápidas</span>
                          <button
                            type="button"
                            className="font-medium text-primary text-xs hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                            onClick={() => setAreQuickActionsVisible(false)}
                          >
                            Ocultar
                          </button>
                        </div>
                        <div className="grid gap-2">
                          {context.quickActions.map((action) => (
                            <QuickActionButton
                              key={action.id}
                              action={action}
                              onSelect={() => handleQuickAction(action)}
                            />
                          ))}
                        </div>
                      </div>
                    ) : (
                      <div className="mb-2 flex flex-wrap gap-2">
                        <Button
                          type="button"
                          variant="secondary"
                          size="sm"
                          className="h-7 px-2 text-xs"
                          onClick={() => setAreSuggestionsVisible(true)}
                        >
                          <Sparkles className="size-3.5" aria-hidden="true" />
                          Sugestões
                        </Button>
                        <Button
                          type="button"
                          variant="secondary"
                          size="sm"
                          className="h-7 px-2 text-xs"
                          onClick={() => setAreQuickActionsVisible(true)}
                        >
                          Ações rápidas
                        </Button>
                      </div>
                    )}
                    {areQuickActionsVisible ? null : (
                      <Button
                        type="button"
                        variant="secondary"
                        className="mb-2 w-full justify-start border-primary/20 bg-primary/5 text-primary hover:bg-primary/10"
                        onClick={startNewSupportRequest}
                      >
                        <Headphones className="size-4" aria-hidden="true" />
                        Falar com suporte
                        <ChevronRight className="ml-auto size-4" aria-hidden="true" />
                      </Button>
                    )}
                    <form onSubmit={handleSubmit} className="flex items-end gap-2">
                      <Textarea
                        value={inputValue}
                        onChange={(event) => setInputValue(event.target.value)}
                        placeholder="Escreva sua dúvida..."
                        aria-label="Mensagem para ajuda"
                        className="min-h-10 resize-none text-sm"
                        rows={1}
                        onKeyDown={(event) => {
                          if (event.key === "Enter" && !event.shiftKey) {
                            event.preventDefault();
                            submitMessage(inputValue);
                          }
                        }}
                      />
                      <Button
                        type="submit"
                        size="icon"
                        aria-label="Enviar mensagem de ajuda"
                        disabled={!inputValue.trim()}
                      >
                        <Send className="size-4" aria-hidden="true" />
                      </Button>
                    </form>
                    <p className="mt-2 flex items-center justify-center gap-1.5 text-muted-foreground text-xs">
                      <CheckCircle2 className="size-3.5 text-emerald-600" aria-hidden="true" />
                      Assistente do LicitaDoc com respostas locais
                    </p>
                  </div>
                </>
              ) : null}

              {mode === "support-intake" ? (
                <div className="flex min-h-0 flex-1 flex-col bg-background/40">
                  <div className="border-b bg-muted/40 px-4 py-3">
                    <div className="mb-3 flex items-center justify-between gap-2">
                      <button
                        type="button"
                        className="inline-flex items-center gap-1.5 font-medium text-primary text-xs hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                        onClick={returnToAssistant}
                      >
                        <ChevronLeft className="size-3.5" aria-hidden="true" />
                        Voltar ao assistente
                      </button>
                      <button
                        type="button"
                        className="inline-flex items-center gap-1.5 font-medium text-primary text-xs hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                        onClick={openSupportHistory}
                      >
                        <History className="size-3.5" aria-hidden="true" />
                        Meus atendimentos
                      </button>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="flex size-9 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary">
                        <Headphones className="size-4" aria-hidden="true" />
                      </div>
                      <div className="min-w-0">
                        <h3 className="font-semibold text-sm">Falar com suporte</h3>
                        <p className="mt-1 text-muted-foreground text-xs leading-relaxed">
                          {getSupportIntakeMessage(context)}
                        </p>
                        <p className="mt-2 inline-flex items-center gap-1.5 rounded-full border bg-background px-2 py-1 text-muted-foreground text-xs">
                          <Clock className="size-3.5 text-primary" aria-hidden="true" />
                          {SUPPORT_ESTIMATED_RESPONSE}
                        </p>
                      </div>
                    </div>
                  </div>

                  <form
                    onSubmit={handleSupportIntakeSubmit}
                    className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto px-4 py-4"
                  >
                    <div>
                      <p className="mb-2 font-medium text-muted-foreground text-xs">Anexos</p>
                      <button
                        type="button"
                        aria-pressed={isScreenshotAttached}
                        aria-label={
                          isScreenshotAttached
                            ? "Remover captura de tela"
                            : "Anexar captura de tela"
                        }
                        className={cn(
                          "grid w-full grid-cols-[2rem_1fr_auto] items-center gap-3 rounded-md border bg-background p-3 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                          isScreenshotAttached
                            ? "border-primary/40 bg-primary/5"
                            : "hover:border-primary/40 hover:bg-primary/5",
                        )}
                        onClick={() => setIsScreenshotAttached((currentValue) => !currentValue)}
                      >
                        <span className="flex size-8 items-center justify-center rounded-md bg-primary/10 text-primary">
                          <Camera className="size-4" aria-hidden="true" />
                        </span>
                        <span className="min-w-0">
                          <span className="block font-medium text-sm">
                            {isScreenshotAttached
                              ? "Captura de tela anexada"
                              : "Anexar captura de tela"}
                          </span>
                          <span className="block text-muted-foreground text-xs">
                            {isScreenshotAttached
                              ? "Toque novamente para remover."
                              : "Ajuda o suporte a ver o que apareceu para você."}
                          </span>
                        </span>
                        {isScreenshotAttached ? (
                          <CheckCircle2 className="size-4 text-emerald-600" aria-hidden="true" />
                        ) : null}
                      </button>
                      {isScreenshotAttached ? (
                        <div className="mt-2 rounded-md border bg-background p-2">
                          <SupportScreenshotPreview
                            title="Captura de tela"
                            subtitle={context.title}
                          />
                        </div>
                      ) : null}
                    </div>

                    <div>
                      <label
                        htmlFor="support-issue"
                        className="mb-2 block font-medium text-muted-foreground text-xs"
                      >
                        Descreva sua dúvida ou bloqueio
                      </label>
                      <Textarea
                        id="support-issue"
                        value={supportIssue}
                        onChange={(event) => setSupportIssue(event.target.value)}
                        placeholder="Ex.: não consigo concluir a geração do documento..."
                        aria-label="Descrição para o suporte"
                        className="min-h-28 resize-none text-sm"
                      />
                    </div>

                    <div className="mt-auto flex items-center gap-2">
                      <Button
                        type="button"
                        variant="secondary"
                        className="flex-1"
                        onClick={returnToAssistant}
                      >
                        Voltar
                      </Button>
                      <Button type="submit" className="flex-1" disabled={!supportIssue.trim()}>
                        Iniciar chat
                      </Button>
                    </div>
                  </form>
                </div>
              ) : null}

              {mode === "support-history" ? (
                <div className="flex min-h-0 flex-1 flex-col bg-background/40">
                  <div className="border-b bg-muted/40 px-4 py-3">
                    <div className="mb-3 flex items-center justify-between gap-2">
                      <button
                        type="button"
                        className="inline-flex items-center gap-1.5 font-medium text-primary text-xs hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                        onClick={returnToAssistant}
                      >
                        <ChevronLeft className="size-3.5" aria-hidden="true" />
                        Voltar ao assistente
                      </button>
                      <Button
                        type="button"
                        size="sm"
                        className="h-8"
                        onClick={startNewSupportRequest}
                      >
                        <Plus className="size-3.5" aria-hidden="true" />
                        Novo
                      </Button>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="flex size-9 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary">
                        <History className="size-4" aria-hidden="true" />
                      </div>
                      <div className="min-w-0">
                        <h3 className="font-semibold text-sm">Meus atendimentos</h3>
                        <p className="mt-1 text-muted-foreground text-xs leading-relaxed">
                          Veja mensagens que você já enviou ao suporte e retome atendimentos em
                          andamento.
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4">
                    {supportHistory.length > 0 ? (
                      <div className="space-y-2">
                        {supportHistory.map((record) => (
                          <SupportHistoryButton
                            key={record.id}
                            record={record}
                            onSelect={() => openSupportHistoryRecord(record)}
                          />
                        ))}
                      </div>
                    ) : (
                      <div className="flex h-full flex-col items-center justify-center rounded-md border bg-background p-5 text-center">
                        <History className="size-8 text-muted-foreground" aria-hidden="true" />
                        <h3 className="mt-3 font-semibold text-sm">Nenhum atendimento ainda</h3>
                        <p className="mt-1 text-muted-foreground text-xs">
                          Quando você falar com o suporte, as conversas aparecem aqui.
                        </p>
                        <Button
                          type="button"
                          size="sm"
                          className="mt-4"
                          onClick={startNewSupportRequest}
                        >
                          <Plus className="size-3.5" aria-hidden="true" />
                          Novo atendimento
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              ) : null}

              {mode === "support-chat" ? (
                <div className="flex min-h-0 flex-1 flex-col bg-background/40">
                  <div className="border-b bg-muted/40 px-4 py-2.5">
                    <div className="mb-2 flex items-center justify-between gap-2">
                      <button
                        type="button"
                        className="inline-flex items-center gap-1.5 font-medium text-primary text-xs hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                        onClick={returnToAssistant}
                      >
                        <ChevronLeft className="size-3.5" aria-hidden="true" />
                        Voltar ao assistente
                      </button>
                      <button
                        type="button"
                        className="inline-flex items-center gap-1.5 font-medium text-primary text-xs hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                        onClick={openSupportHistory}
                      >
                        <History className="size-3.5" aria-hidden="true" />
                        Histórico
                      </button>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground">
                        <Headphones className="size-4" aria-hidden="true" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex min-w-0 items-center justify-between gap-2">
                          <h3 className="truncate font-semibold text-sm">Suporte LicitaDoc</h3>
                          <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full border bg-background px-2 py-0.5 text-muted-foreground text-xs">
                            <span className="size-1.5 rounded-full bg-emerald-500" />
                            Online agora
                          </span>
                        </div>
                        <p className="mt-0.5 truncate text-muted-foreground text-xs">
                          {supportProtocol} - {SUPPORT_ESTIMATED_RESPONSE}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="min-h-0 flex-1 space-y-3 overflow-y-auto px-4 py-4">
                    {supportMessages.map((message) =>
                      message.role === "system" ? (
                        <div key={message.id} className="flex justify-center">
                          <span className="rounded-full border bg-background px-2.5 py-1 text-muted-foreground text-xs">
                            {message.content}
                          </span>
                        </div>
                      ) : (
                        <div
                          key={message.id}
                          className={cn(
                            "flex gap-2",
                            message.role === "user" ? "justify-end" : "justify-start",
                          )}
                        >
                          {message.role === "support" ? (
                            <div className="mt-1 flex size-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                              <Headphones className="size-3.5" aria-hidden="true" />
                            </div>
                          ) : null}
                          <div
                            className={cn(
                              "max-w-[86%] rounded-lg px-3 py-2 text-sm leading-relaxed shadow-xs",
                              message.role === "user" && !message.attachment
                                ? "bg-primary text-primary-foreground"
                                : "border bg-background",
                            )}
                          >
                            {message.attachment?.type === "screenshot" ? (
                              <SupportScreenshotPreview
                                title={message.attachment.title}
                                subtitle={message.attachment.subtitle}
                              />
                            ) : (
                              <p>{message.content}</p>
                            )}
                            <span
                              className={cn(
                                "mt-1 flex items-center justify-end gap-1 text-[0.68rem]",
                                message.role === "user" && !message.attachment
                                  ? "text-primary-foreground/75"
                                  : "text-muted-foreground",
                              )}
                            >
                              {message.time}
                              {message.role === "user" ? (
                                <CheckCheck className="size-3" aria-label="Mensagem enviada" />
                              ) : null}
                            </span>
                          </div>
                        </div>
                      ),
                    )}
                    {isSupportTyping ? (
                      <div className="flex items-center gap-2 text-muted-foreground text-xs">
                        <div className="flex size-6 items-center justify-center rounded-full bg-primary/10 text-primary">
                          <Headphones className="size-3.5" aria-hidden="true" />
                        </div>
                        <span>Suporte preparando resposta...</span>
                      </div>
                    ) : null}
                  </div>

                  <div className="border-t px-4 py-3">
                    {isActiveSupportConversation ? (
                      <form onSubmit={handleSupportChatSubmit} className="flex items-end gap-2">
                        <Textarea
                          value={supportInputValue}
                          onChange={(event) => setSupportInputValue(event.target.value)}
                          placeholder="Escreva para o suporte..."
                          aria-label="Mensagem para o suporte"
                          className="min-h-10 resize-none text-sm"
                          rows={1}
                          onKeyDown={(event) => {
                            if (event.key === "Enter" && !event.shiftKey) {
                              event.preventDefault();
                              submitSupportMessage(supportInputValue);
                            }
                          }}
                        />
                        <Button
                          type="submit"
                          size="icon"
                          aria-label="Enviar mensagem para o suporte"
                          disabled={!supportInputValue.trim()}
                        >
                          <Send className="size-4" aria-hidden="true" />
                        </Button>
                      </form>
                    ) : (
                      <div className="rounded-md border bg-muted/40 p-3 text-sm">
                        <p className="font-medium">Este atendimento foi resolvido.</p>
                        <p className="mt-1 text-muted-foreground text-xs">
                          Para continuar com outra dúvida, abra um novo atendimento.
                        </p>
                        <Button
                          type="button"
                          size="sm"
                          className="mt-3"
                          onClick={startNewSupportRequest}
                        >
                          <Plus className="size-3.5" aria-hidden="true" />
                          Novo atendimento
                        </Button>
                      </div>
                    )}
                    <p className="mt-2 flex items-center justify-center gap-1.5 text-muted-foreground text-xs">
                      <CheckCircle2 className="size-3.5 text-emerald-600" aria-hidden="true" />
                      {activeSupportRecord?.status === "resolved"
                        ? "Atendimento resolvido"
                        : "Atendimento local pronto para integração"}
                    </p>
                  </div>
                </div>
              ) : null}
            </div>
          )}
        </section>
      ) : null}

      {!isOpen ? (
        <Button
          type="button"
          size="icon-lg"
          className="pointer-events-auto relative size-12 rounded-full shadow-lg"
          aria-label="Abrir ajuda"
          aria-expanded={isOpen}
          onClick={handleOpenToggle}
        >
          <MessageCircle className="size-5" aria-hidden="true" />
          <span
            className="-top-0.5 -right-0.5 absolute size-3 rounded-full border-2 border-background bg-emerald-500"
            aria-hidden="true"
          />
          <span className="sr-only">Ajuda disponível</span>
        </Button>
      ) : null}
    </div>
  );
}

function SupportHistoryButton({
  record,
  onSelect,
}: {
  record: SupportHistoryRecord;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      className="group w-full rounded-md border bg-background p-3 text-left transition-colors hover:border-primary/40 hover:bg-primary/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      onClick={onSelect}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex min-w-0 items-center gap-2">
            <p className="truncate font-medium text-sm">{record.title}</p>
            {record.hasScreenshot ? (
              <Paperclip
                className="size-3.5 shrink-0 text-muted-foreground"
                aria-label="Com anexo"
              />
            ) : null}
          </div>
          <p className="mt-1 truncate text-muted-foreground text-xs">{record.latestPreview}</p>
        </div>
        <ChevronRight
          className="mt-1 size-4 shrink-0 text-muted-foreground transition-transform duration-150 group-hover:translate-x-0.5 group-hover:text-primary"
          aria-hidden="true"
        />
      </div>
      <div className="mt-2 flex flex-wrap items-center gap-1.5 text-xs">
        <span className="rounded-full border bg-muted/40 px-2 py-0.5 text-muted-foreground">
          {record.protocol}
        </span>
        <span className="rounded-full border bg-muted/40 px-2 py-0.5 text-muted-foreground">
          {getSupportStatusLabel(record.status)}
        </span>
        <span className="rounded-full border bg-muted/40 px-2 py-0.5 text-muted-foreground">
          {record.timestamp}
        </span>
      </div>
    </button>
  );
}

function SupportScreenshotPreview({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <div className="w-52 max-w-full">
      <div
        role="img"
        aria-label="Prévia da captura de tela anexada"
        className="overflow-hidden rounded-md border bg-muted/60"
      >
        <div className="flex h-5 items-center gap-1 border-b bg-primary/90 px-2">
          <span className="size-1.5 rounded-full bg-primary-foreground/80" />
          <span className="h-1.5 w-12 rounded-full bg-primary-foreground/50" />
        </div>
        <div className="grid h-24 grid-cols-[2.25rem_1fr] bg-background">
          <div className="border-r bg-muted/70 p-1.5">
            <div className="mb-1.5 h-2 rounded bg-primary/20" />
            <div className="mb-1 h-1.5 rounded bg-muted-foreground/20" />
            <div className="h-1.5 rounded bg-muted-foreground/20" />
          </div>
          <div className="space-y-2 p-2">
            <div className="h-2 w-20 rounded bg-foreground/15" />
            <div className="grid grid-cols-2 gap-1.5">
              <div className="h-8 rounded border bg-muted/50" />
              <div className="h-8 rounded border bg-muted/50" />
            </div>
            <div className="h-2 w-full rounded bg-muted-foreground/15" />
            <div className="h-2 w-3/4 rounded bg-muted-foreground/15" />
          </div>
        </div>
      </div>
      <div className="mt-2">
        <p className="font-medium text-foreground text-xs">{title}</p>
        <p className="truncate text-muted-foreground text-xs">{subtitle}</p>
      </div>
    </div>
  );
}

function QuickActionButton({
  action,
  onSelect,
}: {
  action: HelpQuickAction;
  onSelect: () => void;
}) {
  const Icon = actionIcons[action.id];

  return (
    <button
      type="button"
      aria-label={action.label}
      className="group grid min-h-12 grid-cols-[1.75rem_1fr_auto] items-center gap-2 rounded-md border bg-background p-2 text-left transition-colors hover:border-primary/40 hover:bg-primary/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      onClick={onSelect}
    >
      <span className="flex size-7 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary">
        <Icon className="size-3.5" aria-hidden="true" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate font-medium text-xs">{action.label}</span>
        <span className="block truncate text-muted-foreground text-xs">{action.description}</span>
      </span>
      <ChevronRight
        className="size-4 text-muted-foreground transition-transform duration-150 group-hover:translate-x-0.5 group-hover:text-primary"
        aria-hidden="true"
      />
    </button>
  );
}

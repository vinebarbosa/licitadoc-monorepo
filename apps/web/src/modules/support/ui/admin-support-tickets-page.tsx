import {
  AlertCircle,
  Camera,
  CheckCircle2,
  Clock,
  FileText,
  Headphones,
  ImageIcon,
  MessageSquareText,
  Paperclip,
  RotateCcw,
  Search,
  Send,
  Sparkles,
  UserCheck,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useAuthSession } from "@/modules/auth";
import { cn } from "@/shared/lib/utils";
import { Badge } from "@/shared/ui/badge";
import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";
import { Label } from "@/shared/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/shared/ui/select";
import { Textarea } from "@/shared/ui/textarea";
import {
  type SupportTicketRealtimeEvent,
  useSupportTicketDetail,
  useSupportTicketMessageCreate,
  useSupportTicketRead,
  useSupportTicketRealtime,
  useSupportTicketsList,
  useSupportTicketTyping,
  useSupportTicketUpdate,
} from "../api/support-tickets";
import {
  DEFAULT_SUPPORT_AGENT,
  defaultSupportTicketFilters,
  filterSupportTickets,
  formatSupportQueueFreshness,
  formatSupportFileSize,
  getSupportMessageTimeline,
  getInitialSupportTicketId,
  getSupportAttachmentImageUrl,
  getLatestTicketPreview,
  getSelectedSupportTicket,
  getSupportTicketQueueCounts,
  getTicketSlaState,
  type SupportAgent,
  type SupportTicketQueueCounts,
  type SupportTicket,
  type SupportTicketAttachment,
  type SupportTicketFilters,
  type SupportTicketPriority,
  type SupportTicketStatus,
  supportPriorityConfig,
  supportSourceConfig,
  supportStatusConfig,
} from "../model/support-tickets";

const priorityOptions: Array<{ value: SupportTicketPriority | "all"; label: string }> = [
  { value: "all", label: "Todas" },
  { value: "urgent", label: "Urgente" },
  { value: "high", label: "Alta" },
  { value: "medium", label: "Media" },
  { value: "low", label: "Baixa" },
];

const assigneeOptions: Array<{ value: SupportTicketFilters["assignee"]; label: string }> = [
  { value: "all", label: "Responsavel" },
  { value: "unassigned", label: "Sem responsavel" },
  { value: "mine", label: "Meus chamados" },
];

const sourceOptions: Array<{ value: SupportTicketFilters["source"]; label: string }> = [
  { value: "all", label: "Origem" },
  { value: "process", label: "Processos" },
  { value: "document", label: "Documentos" },
  { value: "workspace", label: "Central" },
];

const quickReplies = [
  {
    label: "Verificar",
    text: "Vou verificar isso agora e te retorno por aqui.",
  },
  {
    label: "Pedir captura",
    text: "Pode me enviar uma captura da tela atual?",
  },
  {
    label: "Orientar passo",
    text: "Consegui identificar o ponto. Vou orientar o proximo passo.",
  },
];

function getAgentFromSession(session: ReturnType<typeof useAuthSession>["session"]): SupportAgent {
  return {
    id: session?.user.id ?? DEFAULT_SUPPORT_AGENT.id,
    name: session?.user.name ?? DEFAULT_SUPPORT_AGENT.name,
  };
}

function FilterSelect<T extends string>({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: T;
  options: Array<{ value: T; label: string }>;
  onChange: (value: T) => void;
}) {
  return (
    <Select value={value} onValueChange={(nextValue) => onChange(nextValue as T)}>
      <SelectTrigger
        size="sm"
        aria-label={label}
        className="h-8 w-full min-w-0 rounded-md border-border/70 bg-background/80 px-2.5 text-xs shadow-xs transition-colors hover:border-primary/40 hover:bg-primary/5 focus-visible:ring-primary/20"
      >
        <SelectValue placeholder={label} />
      </SelectTrigger>
      <SelectContent align="start" className="min-w-[11rem]">
        {options.map((option) => (
          <SelectItem key={option.value} value={option.value} className="text-xs">
            {option.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

function SlaBadge({ ticket }: { ticket: SupportTicket }) {
  const state = getTicketSlaState(ticket);
  const label = {
    ok: "SLA em dia",
    warning: "SLA proximo",
    breached: "SLA vencido",
    done: "Finalizado",
  }[state];
  const className = {
    ok: "border-emerald-200 bg-emerald-50 text-emerald-700",
    warning: "border-amber-200 bg-amber-50 text-amber-700",
    breached: "border-red-200 bg-red-50 text-red-700",
    done: "border-slate-200 bg-slate-50 text-slate-600",
  }[state];

  return (
    <Badge variant="outline" className={cn("gap-1 whitespace-nowrap", className)}>
      <Clock className="size-3" aria-hidden="true" />
      {label}
    </Badge>
  );
}

function StatusTabs({
  filters,
  counts,
  onChange,
}: {
  filters: SupportTicketFilters;
  counts: SupportTicketQueueCounts;
  onChange: (status: SupportTicketStatus | "all") => void;
}) {
  const tabs: Array<{ value: SupportTicketStatus | "all"; label: string; count: number }> = [
    { value: "all", label: "Todos", count: counts.all },
    { value: "open", label: "Abertos", count: counts.open },
    { value: "waiting", label: "Aguardando", count: counts.waiting },
    { value: "resolved", label: "Resolvidos", count: counts.resolved },
  ];

  return (
    <fieldset className="grid grid-cols-4 gap-1 rounded-md bg-muted p-1">
      <legend className="sr-only">Status da fila</legend>
      {tabs.map((tab) => (
        <button
          key={tab.value}
          type="button"
          aria-pressed={filters.status === tab.value}
          className={cn(
            "min-w-0 rounded-sm px-1.5 py-1.5 text-center text-muted-foreground text-xs transition-colors hover:bg-background/80 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
            filters.status === tab.value && "bg-background text-foreground shadow-xs",
          )}
          onClick={() => onChange(tab.value)}
        >
          <span className="block leading-tight">{tab.label}</span>
          <span className="font-semibold tabular-nums">{tab.count}</span>
        </button>
      ))}
    </fieldset>
  );
}

function TicketQueueButton({
  ticket,
  selected,
  onSelect,
}: {
  ticket: SupportTicket;
  selected: boolean;
  onSelect: () => void;
}) {
  const status = supportStatusConfig[ticket.status];
  const priority = supportPriorityConfig[ticket.priority];
  const freshness = formatSupportQueueFreshness(ticket.updatedAt);

  return (
    <button
      type="button"
      className={cn(
        "group relative w-full rounded-md border bg-background p-3 text-left transition-all hover:border-primary/40 hover:bg-primary/5 hover:shadow-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
        selected && "border-primary/60 bg-primary/5 shadow-xs",
      )}
      onClick={onSelect}
    >
      <span
        className={cn(
          "absolute inset-y-3 left-0 w-0.5 rounded-r bg-transparent transition-colors",
          selected && "bg-primary",
        )}
      />
      <div className="flex min-w-0 items-start justify-between gap-2">
        <div className="min-w-0">
          <div className="flex min-w-0 items-center gap-2">
            <span className="truncate font-semibold text-primary text-xs">{ticket.protocol}</span>
            {ticket.unreadCount > 0 ? (
              <Badge className="h-5 rounded-sm px-1.5 text-[11px]">
                {ticket.unreadCount} novas
              </Badge>
            ) : null}
            {ticket.attachments.length > 0 ? (
              <Paperclip className="size-3.5 text-muted-foreground" aria-label="Possui anexo" />
            ) : null}
          </div>
          <p className="mt-1 line-clamp-1 font-medium text-sm">{ticket.subject}</p>
          <p className="mt-0.5 truncate text-muted-foreground text-xs">
            {ticket.requester.name} - {supportSourceConfig[ticket.context.source].label}
          </p>
        </div>
        <time
          dateTime={ticket.updatedAt}
          title={freshness.title}
          aria-label={freshness.ariaLabel}
          className="shrink-0 whitespace-nowrap font-medium text-muted-foreground text-xs tabular-nums"
        >
          {freshness.label}
        </time>
      </div>
      <p className="mt-2 line-clamp-2 text-muted-foreground text-xs">
        {getLatestTicketPreview(ticket)}
      </p>
      <div className="mt-3 flex min-w-0 flex-wrap items-center gap-1.5">
        <Badge
          variant="outline"
          className={cn("h-5 max-w-full px-1.5 text-[11px]", status.className)}
        >
          <span className="truncate">{status.label}</span>
        </Badge>
        <Badge
          variant="outline"
          className={cn("h-5 max-w-full px-1.5 text-[11px]", priority.className)}
        >
          <span className="truncate">{priority.label}</span>
        </Badge>
        <Badge
          variant="outline"
          className={cn(
            "h-5 max-w-full px-1.5 text-[11px]",
            getTicketSlaState(ticket) === "breached" && "border-red-200 bg-red-50 text-red-700",
            getTicketSlaState(ticket) === "warning" &&
              "border-amber-200 bg-amber-50 text-amber-700",
            getTicketSlaState(ticket) === "ok" &&
              "border-emerald-200 bg-emerald-50 text-emerald-700",
            getTicketSlaState(ticket) === "done" && "border-slate-200 bg-slate-50 text-slate-600",
          )}
        >
          <Clock className="size-3 shrink-0" aria-hidden="true" />
          <span className="truncate">
            {
              {
                ok: "SLA em dia",
                warning: "SLA proximo",
                breached: "SLA vencido",
                done: "Finalizado",
              }[getTicketSlaState(ticket)]
            }
          </span>
        </Badge>
      </div>
    </button>
  );
}

function AttachmentPreview({ attachment }: { attachment: SupportTicketAttachment }) {
  const imageUrl = getSupportAttachmentImageUrl(attachment);

  return (
    <div
      role="img"
      aria-label={`Preview do anexo ${attachment.name}`}
      className="mt-2 overflow-hidden rounded-md border bg-background shadow-xs"
    >
      <div className="flex items-center justify-between gap-3 border-b bg-muted/70 px-3 py-2">
        <div className="flex min-w-0 items-center gap-2">
          <span className="flex size-8 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary">
            <ImageIcon className="size-4" aria-hidden="true" />
          </span>
          <div className="min-w-0">
            <p className="truncate font-medium text-xs">{attachment.name}</p>
            <p className="truncate text-muted-foreground text-[11px]">{attachment.description}</p>
          </div>
        </div>
        {imageUrl ? (
          <Button type="button" variant="ghost" size="sm" className="h-7 px-2 text-xs" asChild>
            <a href={imageUrl} target="_blank" rel="noreferrer">
              Abrir
            </a>
          </Button>
        ) : null}
      </div>
      {imageUrl ? (
        <div className="p-3">
          <img
            src={imageUrl}
            alt={attachment.name}
            className="max-h-56 w-full rounded-md border object-contain"
          />
          {attachment.sizeBytes ? (
            <p className="mt-2 text-muted-foreground text-[11px]">
              {formatSupportFileSize(attachment.sizeBytes)}
            </p>
          ) : null}
        </div>
      ) : (
        <div className="space-y-2 p-3">
          <div className="h-2.5 w-3/4 rounded bg-slate-200" />
          <div className="h-2.5 w-1/2 rounded bg-slate-200" />
          <div className="grid grid-cols-2 gap-2 pt-1">
            <div className="h-12 rounded border bg-sky-50" />
            <div className="h-12 rounded border bg-emerald-50" />
          </div>
          <div className="h-7 rounded border border-primary/30 bg-primary/10" />
        </div>
      )}
    </div>
  );
}

function TicketContext({ ticket }: { ticket: SupportTicket }) {
  return (
    <div className="space-y-4 text-sm">
      <div>
        <p className="text-muted-foreground text-xs">Solicitante</p>
        <p className="font-medium">{ticket.requester.name}</p>
        <p className="truncate text-muted-foreground text-xs">{ticket.requester.email}</p>
      </div>
      {ticket.requester.organization ? (
        <div>
          <p className="text-muted-foreground text-xs">Organizacao</p>
          <p>{ticket.requester.organization}</p>
        </div>
      ) : null}
      <div>
        <p className="text-muted-foreground text-xs">Origem</p>
        <p>{ticket.context.screen}</p>
      </div>
      {ticket.context.entityLabel ? (
        <div>
          <p className="text-muted-foreground text-xs">Contexto</p>
          <p>{ticket.context.entityLabel}</p>
        </div>
      ) : null}
      <div>
        <p className="text-muted-foreground text-xs">Rota</p>
        <p className="break-all font-mono text-xs">{ticket.context.route}</p>
      </div>
      <div className="rounded-md border bg-muted/40 p-3">
        <div className="flex items-center gap-2">
          <Camera className="size-4 text-primary" aria-hidden="true" />
          <p className="font-medium text-xs">Evidencias no chat</p>
        </div>
        <p className="mt-1 text-muted-foreground text-xs">
          {ticket.attachments.length > 0
            ? `${ticket.attachments.length} anexo aparece inline na conversa.`
            : "Nenhuma captura anexada neste chamado."}
        </p>
      </div>
    </div>
  );
}

function RequesterHistory({ ticket }: { ticket: SupportTicket }) {
  return (
    <div className="space-y-2 rounded-md border bg-muted/30 p-3">
      <div className="flex items-center gap-2">
        <MessageSquareText className="size-4 text-primary" aria-hidden="true" />
        <p className="font-medium text-sm">Historico recente</p>
      </div>
      <p className="text-muted-foreground text-xs">
        {ticket.requester.name} tem 3 atendimentos recentes, com 1 resolvido nas ultimas 24h.
      </p>
    </div>
  );
}

function TicketConversation({
  ticket,
  reply,
  typingNames,
  onReplyChange,
  onSubmitReply,
}: {
  ticket: SupportTicket;
  reply: string;
  typingNames: string[];
  onReplyChange: (value: string) => void;
  onSubmitReply: () => void;
}) {
  const isResolved = ticket.status === "resolved";
  const timeline = getSupportMessageTimeline(ticket.messages);

  return (
    <div className="flex min-h-0 flex-1 flex-col bg-background">
      <div className="flex-1 space-y-4 overflow-y-auto bg-[linear-gradient(180deg,hsl(var(--muted)/0.35),hsl(var(--background)))] px-4 py-5 sm:px-6">
        {timeline.map((item) => {
          if (item.type === "day") {
            return (
              <div key={item.id} className="flex justify-center">
                <span className="rounded-full border bg-background/90 px-3 py-1 font-medium text-muted-foreground text-[11px] shadow-xs">
                  {item.label}
                </span>
              </div>
            );
          }

          const message = item.message;
          const messageAttachments = ticket.attachments.filter(
            (attachment) => attachment.messageId === message.id,
          );

          return (
            <div
              key={message.id}
              className={cn(
                "flex",
                message.role === "support" ? "justify-end" : "justify-start",
                message.role === "system" && "justify-center",
              )}
            >
              <div
                className={cn(
                  "max-w-[min(560px,88%)] rounded-md px-3 py-2 text-sm shadow-xs",
                  message.role === "support" && "bg-primary text-primary-foreground",
                  message.role === "user" && "border bg-card",
                  message.role === "system" &&
                    "bg-muted px-3 py-1 text-muted-foreground text-xs shadow-none",
                )}
              >
                <div
                  className={cn(
                    "mb-1 flex items-center gap-2 text-xs opacity-80",
                    message.role === "system" && "mb-0",
                  )}
                >
                  <span>{message.authorName}</span>
                  <time dateTime={message.timestamp} title={item.timestampTitle}>
                    {item.timeLabel}
                  </time>
                </div>
                <p className="leading-relaxed">{message.content}</p>
                {messageAttachments.map((attachment) => (
                  <AttachmentPreview key={attachment.id} attachment={attachment} />
                ))}
              </div>
            </div>
          );
        })}
        {typingNames.length > 0 ? (
          <div className="flex justify-start">
            <div className="rounded-md border bg-card px-3 py-2 text-muted-foreground text-xs shadow-xs">
              {typingNames.join(", ")} {typingNames.length === 1 ? "esta" : "estao"} digitando...
            </div>
          </div>
        ) : null}
      </div>
      <div className="border-t bg-card/80 p-3">
        {isResolved ? (
          <div className="flex items-center justify-between gap-3 rounded-md border border-emerald-200 bg-emerald-50 p-3 text-emerald-700 text-sm">
            <span className="flex min-w-0 items-center gap-2">
              <CheckCircle2 className="size-4 shrink-0" aria-hidden="true" />
              Este chamado foi resolvido. Reabra para responder novamente.
            </span>
          </div>
        ) : (
          <div className="grid gap-2">
            <div className="flex flex-wrap gap-2">
              {quickReplies.map((quickReply) => (
                <Button
                  key={quickReply.label}
                  type="button"
                  variant="outline"
                  size="sm"
                  className="h-7 rounded-full px-3 text-xs"
                  onClick={() => onReplyChange(quickReply.text)}
                >
                  <Sparkles className="size-3" aria-hidden="true" />
                  {quickReply.label}
                </Button>
              ))}
            </div>
            <Label htmlFor="support-ticket-reply" className="sr-only">
              Resposta ao usuario
            </Label>
            <div className="flex items-end gap-2">
              <Button
                type="button"
                variant="outline"
                size="icon"
                className="size-10 shrink-0"
                aria-label="Anexar arquivo"
              >
                <Paperclip className="size-4" aria-hidden="true" />
              </Button>
              <Button
                type="button"
                variant="outline"
                size="icon"
                className="size-10 shrink-0"
                aria-label="Adicionar captura"
              >
                <Camera className="size-4" aria-hidden="true" />
              </Button>
              <Textarea
                id="support-ticket-reply"
                value={reply}
                onChange={(event) => onReplyChange(event.target.value)}
                placeholder="Escreva uma resposta para o usuario..."
                className="min-h-10 flex-1 resize-none bg-background"
              />
              <Button
                type="button"
                className="size-10 shrink-0"
                size="icon"
                onClick={onSubmitReply}
                disabled={!reply.trim()}
                aria-label="Enviar resposta"
              >
                <Send className="size-4" aria-hidden="true" />
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function TicketHeader({
  selectedTicket,
  agent,
  onAssign,
  onPriorityChange,
  onStatusChange,
}: {
  selectedTicket: SupportTicket;
  agent: SupportAgent;
  onAssign: (ticket: SupportTicket) => void;
  onPriorityChange: (ticket: SupportTicket, priority: SupportTicketPriority) => void;
  onStatusChange: (ticket: SupportTicket, status: SupportTicketStatus) => void;
}) {
  return (
    <header className="border-b bg-background px-4 py-3 sm:px-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="outline">{selectedTicket.protocol}</Badge>
            <Badge
              variant="outline"
              className={supportStatusConfig[selectedTicket.status].className}
            >
              {supportStatusConfig[selectedTicket.status].label}
            </Badge>
            <SlaBadge ticket={selectedTicket} />
          </div>
        </div>
        <div className="flex shrink-0 flex-wrap items-center justify-end gap-2">
          <Badge
            variant="outline"
            className="gap-1 border-emerald-200 bg-emerald-50 text-emerald-700"
          >
            <span className="size-2 rounded-full bg-emerald-500" />
            Online agora
          </Badge>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => onAssign(selectedTicket)}
            disabled={selectedTicket.assignee?.id === agent.id}
          >
            <UserCheck className="size-4" aria-hidden="true" />
            Assumir
          </Button>
          {selectedTicket.status === "resolved" ? (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => onStatusChange(selectedTicket, "open")}
            >
              <RotateCcw className="size-4" aria-hidden="true" />
              Reabrir
            </Button>
          ) : (
            <Button
              type="button"
              size="sm"
              onClick={() => onStatusChange(selectedTicket, "resolved")}
            >
              <CheckCircle2 className="size-4" aria-hidden="true" />
              Resolver
            </Button>
          )}
        </div>
      </div>
      <div className="mt-3 flex min-w-0 items-center gap-3">
        <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground">
          <Headphones className="size-5" aria-hidden="true" />
        </span>
        <div className="min-w-0">
          <h2 className="line-clamp-2 font-semibold text-base tracking-normal">
            {selectedTicket.subject}
          </h2>
          <p className="truncate text-muted-foreground text-xs">
            {selectedTicket.requester.name} -{" "}
            {selectedTicket.assignee ? `por ${selectedTicket.assignee.name}` : "sem responsavel"}
          </p>
        </div>
      </div>
      <div className="mt-3 flex flex-wrap items-center gap-2">
        <span className="text-muted-foreground text-xs">Prioridade</span>
        <div className="w-36">
          <FilterSelect
            label="Alterar prioridade"
            value={selectedTicket.priority}
            options={priorityOptions.filter(
              (option): option is { value: SupportTicketPriority; label: string } =>
                option.value !== "all",
            )}
            onChange={(priority) => onPriorityChange(selectedTicket, priority)}
          />
        </div>
      </div>
    </header>
  );
}

function EmptyConversation() {
  return (
    <section className="flex min-h-0 min-w-0 flex-1 items-center justify-center rounded-md border border-dashed bg-background p-10 text-center">
      <div>
        <Headphones className="mx-auto size-10 text-muted-foreground" aria-hidden="true" />
        <p className="mt-3 font-medium">Nenhum chamado selecionado</p>
        <p className="mt-1 text-muted-foreground text-sm">
          Aplique outros filtros para encontrar um atendimento.
        </p>
      </div>
    </section>
  );
}

export function AdminSupportTicketsPageContent() {
  const { session } = useAuthSession();
  const agent = useMemo(() => getAgentFromSession(session), [session]);
  const [filters, setFilters] = useState(defaultSupportTicketFilters);
  const [selectedTicketId, setSelectedTicketId] = useState<string | null>(null);
  const [reply, setReply] = useState("");
  const [typingByActor, setTypingByActor] = useState<Record<string, string>>({});
  const typingTimersRef = useRef<Record<string, ReturnType<typeof setTimeout>>>({});
  const stopTypingTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const ticketsQuery = useSupportTicketsList(filters);
  const tickets = ticketsQuery.data?.items ?? [];
  const detailQuery = useSupportTicketDetail(selectedTicketId);
  const updateTicket = useSupportTicketUpdate();
  const createMessage = useSupportTicketMessageCreate();
  const markRead = useSupportTicketRead();
  const publishTyping = useSupportTicketTyping();
  const markReadTicket = markRead.mutate;

  const filteredTickets = useMemo(
    () => filterSupportTickets(tickets, filters, agent),
    [tickets, filters, agent],
  );
  const selectedTicket = getSelectedSupportTicket(filteredTickets, selectedTicketId);
  const selectedTicketDetail = detailQuery.data ?? selectedTicket;
  const fallbackCounts = useMemo(() => getSupportTicketQueueCounts(tickets), [tickets]);
  const queueCounts = ticketsQuery.data?.counts ?? fallbackCounts;
  const typingNames = useMemo(() => Object.values(typingByActor), [typingByActor]);

  useEffect(() => {
    if (!selectedTicketId && filteredTickets.length > 0) {
      setSelectedTicketId(getInitialSupportTicketId(filteredTickets));
      return;
    }

    if (selectedTicketId && !filteredTickets.some((ticket) => ticket.id === selectedTicketId)) {
      setSelectedTicketId(filteredTickets[0]?.id ?? null);
    }
  }, [filteredTickets, selectedTicketId]);

  useEffect(() => {
    if (!selectedTicketId) {
      return;
    }

    markReadTicket({ ticketId: selectedTicketId });
  }, [markReadTicket, selectedTicketId]);

  const handleRealtimeTyping = useCallback(
    (event: Extract<SupportTicketRealtimeEvent, { type: "ticket.typing" }>) => {
      if (event.actor.id === agent.id) {
        return;
      }

      const timer = typingTimersRef.current[event.actor.id];

      if (timer) {
        clearTimeout(timer);
      }

      if (!event.isTyping) {
        setTypingByActor((current) => {
          const next = { ...current };
          delete next[event.actor.id];
          return next;
        });
        return;
      }

      setTypingByActor((current) => ({
        ...current,
        [event.actor.id]: event.actor.name,
      }));
      typingTimersRef.current[event.actor.id] = setTimeout(() => {
        setTypingByActor((current) => {
          const next = { ...current };
          delete next[event.actor.id];
          return next;
        });
      }, 3500);
    },
    [agent.id],
  );

  useSupportTicketRealtime({
    ticket: selectedTicketDetail,
    enabled: !!selectedTicketDetail,
    onTyping: handleRealtimeTyping,
  });

  function updateFilters(nextFilters: Partial<SupportTicketFilters>) {
    setFilters((current) => ({ ...current, ...nextFilters }));
  }

  function handleAssign(ticket: SupportTicket) {
    updateTicket.mutate({
      ticketId: ticket.id,
      data: { assigneeUserId: agent.id },
    });
  }

  function handlePriorityChange(ticket: SupportTicket, priority: SupportTicketPriority) {
    updateTicket.mutate({
      ticketId: ticket.id,
      data: { priority },
    });
  }

  function handleStatusChange(ticket: SupportTicket, status: SupportTicketStatus) {
    updateTicket.mutate({
      ticketId: ticket.id,
      data: { status },
    });
  }

  function handleReply(ticket: SupportTicket) {
    const content = reply.trim();

    if (!content) {
      return;
    }

    createMessage.mutate(
      {
        ticketId: ticket.id,
        data: { content },
      },
      {
        onSuccess: () => setReply(""),
      },
    );
  }

  function handleReplyChange(value: string) {
    setReply(value);

    if (!selectedTicketDetail || !value.trim()) {
      return;
    }

    publishTyping.mutate({
      ticketId: selectedTicketDetail.id,
      data: { isTyping: true },
    });

    if (stopTypingTimerRef.current) {
      clearTimeout(stopTypingTimerRef.current);
    }

    stopTypingTimerRef.current = setTimeout(() => {
      publishTyping.mutate({
        ticketId: selectedTicketDetail.id,
        data: { isTyping: false },
      });
    }, 1200);
  }

  return (
    <main className="flex h-[calc(100dvh-3.5rem)] min-h-0 min-w-0 flex-col gap-3 overflow-hidden p-4">
      <div className="mx-auto flex w-full max-w-[1500px] shrink-0 flex-col gap-2 lg:flex-row lg:items-center lg:justify-between">
        <div className="min-w-0">
          <h1 className="font-semibold text-2xl tracking-normal">Chamados de suporte</h1>
        </div>
        <Badge
          variant="outline"
          className="w-fit gap-1 border-emerald-200 bg-emerald-50 text-emerald-700"
        >
          <span className="size-2 rounded-full bg-emerald-500" />
          {agent.name} atendendo agora
        </Badge>
      </div>

      <div className="mx-auto grid min-h-0 w-full max-w-[1500px] flex-1 gap-3 overflow-hidden xl:grid-cols-[380px_minmax(0,1fr)_280px] 2xl:grid-cols-[390px_minmax(0,1fr)_300px]">
        <section className="flex min-h-0 min-w-0 flex-col overflow-hidden rounded-md border bg-card shadow-xs">
          <div className="space-y-3 border-b p-3">
            <div className="flex items-center justify-between gap-2">
              <div>
                <p className="font-semibold text-sm">Fila de atendimento</p>
                <p className="text-muted-foreground text-xs">
                  {ticketsQuery.isLoading
                    ? "Carregando chamados"
                    : `${filteredTickets.length} de ${queueCounts.all} chamados`}
                </p>
              </div>
              <Badge variant="outline" className="border-red-200 bg-red-50 text-red-700">
                <span>{queueCounts.attention}</span>
                <span>Atenção</span>
              </Badge>
            </div>
            <StatusTabs
              filters={filters}
              counts={queueCounts}
              onChange={(status) => updateFilters({ status })}
            />
            <div className="relative">
              <Label htmlFor="support-ticket-search" className="sr-only">
                Buscar
              </Label>
              <Search className="-translate-y-1/2 absolute top-1/2 left-3 size-4 text-muted-foreground" />
              <Input
                id="support-ticket-search"
                aria-label="Buscar"
                value={filters.search}
                onChange={(event) => updateFilters({ search: event.target.value })}
                placeholder="Buscar protocolo, usuario ou tela"
                className="h-9 pl-9"
              />
            </div>
            <div className="grid grid-cols-3 gap-2">
              <FilterSelect
                label="Prioridade"
                value={filters.priority}
                options={priorityOptions}
                onChange={(priority) => updateFilters({ priority })}
              />
              <FilterSelect
                label="Responsavel"
                value={filters.assignee}
                options={assigneeOptions}
                onChange={(assignee) => updateFilters({ assignee })}
              />
              <FilterSelect
                label="Origem"
                value={filters.source}
                options={sourceOptions}
                onChange={(source) => updateFilters({ source })}
              />
            </div>
          </div>

          <div className="min-h-0 flex-1 space-y-2 overflow-y-auto p-3">
            {filteredTickets.length > 0 ? (
              filteredTickets.map((ticket) => (
                <TicketQueueButton
                  key={ticket.id}
                  ticket={ticket}
                  selected={ticket.id === selectedTicket?.id}
                  onSelect={() => setSelectedTicketId(ticket.id)}
                />
              ))
            ) : (
              <div className="rounded-md border border-dashed p-6 text-center">
                <AlertCircle className="mx-auto size-8 text-muted-foreground" aria-hidden="true" />
                <p className="mt-3 font-medium text-sm">Nenhum chamado encontrado</p>
                <p className="mt-1 text-muted-foreground text-xs">
                  Ajuste os filtros para visualizar outros atendimentos.
                </p>
              </div>
            )}
          </div>
        </section>

        {selectedTicketDetail ? (
          <>
            <section className="flex min-h-0 min-w-0 flex-col overflow-hidden rounded-md border bg-background shadow-xs">
              <TicketHeader
                selectedTicket={selectedTicketDetail}
                agent={agent}
                onAssign={handleAssign}
                onPriorityChange={handlePriorityChange}
                onStatusChange={handleStatusChange}
              />
              <div className="border-b bg-muted/20 px-4 py-2 xl:hidden">
                <details className="group">
                  <summary className="flex cursor-pointer list-none items-center justify-between text-sm">
                    <span className="font-medium">Contexto do atendimento</span>
                    <span className="text-muted-foreground text-xs group-open:hidden">Mostrar</span>
                    <span className="hidden text-muted-foreground text-xs group-open:inline">
                      Ocultar
                    </span>
                  </summary>
                  <div className="mt-3 grid gap-4 sm:grid-cols-2">
                    <TicketContext ticket={selectedTicketDetail} />
                    <RequesterHistory ticket={selectedTicketDetail} />
                  </div>
                </details>
              </div>
              <TicketConversation
                ticket={selectedTicketDetail}
                reply={reply}
                typingNames={typingNames}
                onReplyChange={handleReplyChange}
                onSubmitReply={() => handleReply(selectedTicketDetail)}
              />
            </section>

            <aside className="hidden min-h-0 min-w-0 flex-col rounded-md border bg-card shadow-xs xl:flex">
              <div className="border-b p-4">
                <p className="font-semibold text-sm">Contexto do usuario</p>
                <p className="text-muted-foreground text-xs">Dados para apoiar a resposta.</p>
              </div>
              <div className="min-h-0 flex-1 space-y-4 overflow-y-auto p-4">
                <TicketContext ticket={selectedTicketDetail} />
                <RequesterHistory ticket={selectedTicketDetail} />
                <div className="rounded-md border bg-muted/30 p-3">
                  <div className="flex items-center gap-2">
                    <FileText className="size-4 text-primary" aria-hidden="true" />
                    <p className="font-medium text-sm">Atendimento em tempo real</p>
                  </div>
                  <p className="mt-1 text-muted-foreground text-xs">
                    Mensagens e status sao persistidos na API; o realtime apenas sincroniza a tela.
                  </p>
                </div>
              </div>
            </aside>
          </>
        ) : (
          <EmptyConversation />
        )}
      </div>
    </main>
  );
}

import {
  AlertCircle,
  Building2,
  Calendar,
  ChevronDown,
  ChevronRight,
  ClipboardList,
  Edit3,
  Eye,
  FilePlus2,
  FileSearch,
  Hash,
  Layers3,
  Loader2,
  Package,
  RefreshCw,
  Scale,
  ScrollText,
  User,
} from "lucide-react";
import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import { Badge } from "@/shared/ui/badge";
import { Button } from "@/shared/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/shared/ui/card";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/shared/ui/empty";
import { PageBackLink } from "@/shared/ui/page-back";
import { Progress } from "@/shared/ui/progress";
import { Separator } from "@/shared/ui/separator";
import { Skeleton } from "@/shared/ui/skeleton";
import type { ProcessDetailDocument, ProcessDetailResponse } from "../api/processes";
import { useProcessDetail } from "../api/processes";
import {
  formatProcessDetailDate,
  getProcessDetailDisplayName,
  getProcessDetailDocumentActionLinks,
  getProcessDetailDocumentStatusConfig,
  getProcessEditPath,
  getProcessStatusConfig,
} from "../model/processes";

const procurementMethodLabels: Record<string, string> = {
  licitacao: "Licitação",
  dispensa: "Dispensa",
  inexigibilidade: "Inexigibilidade",
};

const biddingModalityLabels: Record<string, string> = {
  concorrencia: "Concorrência",
  concurso: "Concurso",
  dialogo_competitivo: "Diálogo Competitivo",
  leilao: "Leilão",
  pregao: "Pregão",
  "pregao-eletronico": "Pregão Eletrônico",
};

const documentIcons = {
  dfd: ClipboardList,
  etp: FileSearch,
  tr: ScrollText,
  minuta: Scale,
} satisfies Record<ProcessDetailDocument["type"], typeof ClipboardList>;

function formatDisplayText(value: string | null | undefined, fallback = "Não informado") {
  const trimmed = value?.trim();

  return trimmed ? trimmed : fallback;
}

function normalizeMonetaryNumber(value: string) {
  const sanitized = value.replace(/[^\d,.-]/g, "").replace(/\s+/g, "");

  if (!/\d/.test(sanitized)) {
    return null;
  }

  const lastCommaIndex = sanitized.lastIndexOf(",");
  const lastDotIndex = sanitized.lastIndexOf(".");
  const decimalSeparator =
    lastCommaIndex > lastDotIndex ? "," : lastDotIndex > lastCommaIndex ? "." : null;
  let normalized = sanitized;

  if (decimalSeparator) {
    const decimalIndex = sanitized.lastIndexOf(decimalSeparator);
    const integerPart = sanitized.slice(0, decimalIndex).replace(/[,.]/g, "");
    const decimalPart = sanitized.slice(decimalIndex + 1).replace(/[,.]/g, "");
    normalized = `${integerPart}.${decimalPart}`;
  } else {
    normalized = sanitized.replace(/[,.]/g, "");
  }

  const amount = Number.parseFloat(normalized);

  return Number.isFinite(amount) ? amount : null;
}

function formatCurrencyValue(value: string | null | undefined) {
  const trimmed = value?.trim();

  if (!trimmed) {
    return "Não informado";
  }

  if (trimmed.startsWith("R$")) {
    return trimmed;
  }

  const amount = normalizeMonetaryNumber(trimmed);

  if (amount === null) {
    return trimmed;
  }

  return amount.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

function getProcurementMethodLabel(value: string | null) {
  if (!value) {
    return "Não informado";
  }

  return procurementMethodLabels[value] ?? value;
}

function getBiddingModalityLabel(value: string | null) {
  if (!value) {
    return null;
  }

  return biddingModalityLabels[value] ?? value;
}

function ProcessDetailLoadingState() {
  return (
    <main className="container mx-auto max-w-6xl px-4 py-6 md:py-8">
      <div className="space-y-6">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
          Carregando processo...
        </div>
        <div className="space-y-3">
          <Skeleton className="h-8 w-72 max-w-full" />
          <Skeleton className="h-5 w-48 max-w-full" />
        </div>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <Skeleton className="h-24" />
          <Skeleton className="h-24" />
          <Skeleton className="h-24 sm:col-span-2" />
        </div>
        <div className="grid gap-6 lg:grid-cols-[1fr_380px]">
          <div className="space-y-6">
            <Skeleton className="h-72" />
            <Skeleton className="h-64" />
          </div>
          <div className="space-y-6">
            <Skeleton className="h-72" />
            <Skeleton className="h-56" />
          </div>
        </div>
      </div>
    </main>
  );
}

function ProcessDetailFailureState({
  canRetry,
  description,
  onRetry,
  title,
}: {
  canRetry: boolean;
  description: string;
  onRetry?: () => void;
  title: string;
}) {
  return (
    <main className="flex-1 overflow-auto p-6">
      <div className="mx-auto max-w-5xl">
        <Empty className="py-16">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <AlertCircle className="h-6 w-6" />
            </EmptyMedia>
            <EmptyTitle>{title}</EmptyTitle>
            <EmptyDescription>{description}</EmptyDescription>
          </EmptyHeader>
          <EmptyContent className="flex-row justify-center">
            {canRetry ? (
              <Button type="button" onClick={onRetry}>
                <RefreshCw className="mr-2 h-4 w-4" />
                Tentar novamente
              </Button>
            ) : null}
            <Button asChild variant="outline">
              <Link to="/app/processos">Voltar para Processos</Link>
            </Button>
          </EmptyContent>
        </Empty>
      </div>
    </main>
  );
}

function ProcessHeader({ process }: { process: ProcessDetailResponse }) {
  const status = getProcessStatusConfig(process.status);

  return (
    <div className="space-y-4">
      <PageBackLink to="/app/processos" />

      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-1">
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-2xl font-semibold tracking-tight">
              {getProcessDetailDisplayName(process)}
            </h1>
            <Badge variant="outline" className={status.className}>
              {status.label}
            </Badge>
          </div>
          <div className="flex flex-wrap items-center gap-2 text-muted-foreground">
            <Hash className="h-4 w-4" />
            <span className="font-mono text-sm">{process.processNumber}</span>
            {process.externalId ? (
              <>
                <span className="text-muted-foreground/50">|</span>
                <span className="text-sm">ID Externo: {process.externalId}</span>
              </>
            ) : null}
          </div>
        </div>

        <Button asChild variant="outline" size="sm">
          <Link to={getProcessEditPath(process.id)}>
            <Edit3 className="mr-2 h-4 w-4" />
            Editar Processo
          </Link>
        </Button>
      </div>
    </div>
  );
}

function ProcessInfo({ process }: { process: ProcessDetailResponse }) {
  const biddingModality = getBiddingModalityLabel(process.biddingModality);

  return (
    <Card>
      <CardHeader className="pb-4">
        <CardTitle className="text-base font-semibold">Informações do Processo</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="space-y-1">
            <p className="text-xs font-medium text-muted-foreground">Forma de contratação</p>
            <p className="text-sm font-medium">
              {getProcurementMethodLabel(process.procurementMethod)}
            </p>
          </div>
          {biddingModality ? (
            <div className="space-y-1">
              <p className="text-xs font-medium text-muted-foreground">Modalidade</p>
              <p className="text-sm font-medium">{biddingModality}</p>
            </div>
          ) : null}
          <div className="space-y-1">
            <p className="text-xs font-medium text-muted-foreground">Responsável</p>
            <div className="flex items-center gap-2">
              <User className="h-4 w-4 text-muted-foreground" />
              <p className="text-sm font-medium">{process.responsibleName}</p>
            </div>
          </div>
          <div className="space-y-1">
            <p className="text-xs font-medium text-muted-foreground">Data de emissão</p>
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <p className="text-sm font-medium">{formatProcessDetailDate(process.issuedAt)}</p>
            </div>
          </div>
        </div>

        <Separator />

        <div className="space-y-2">
          <p className="text-xs font-medium text-muted-foreground">Objeto da contratação</p>
          <p className="text-sm leading-relaxed text-foreground/90">{process.object}</p>
        </div>

        <div className="space-y-2">
          <p className="text-xs font-medium text-muted-foreground">Justificativa</p>
          <p className="text-sm leading-relaxed text-foreground/90">{process.justification}</p>
        </div>
      </CardContent>
    </Card>
  );
}

function InstitutionalContext({ process }: { process: ProcessDetailResponse }) {
  return (
    <Card className="min-w-0 gap-0 overflow-hidden">
      <CardHeader className="pb-4">
        <CardTitle className="text-base font-semibold">Contexto Institucional</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-start gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10">
            <Building2 className="h-4 w-4 text-primary" />
          </div>
          <div className="min-w-0">
            <p className="break-words text-sm font-medium">{process.organization.name}</p>
            <p className="text-xs text-muted-foreground">Órgão responsável</p>
          </div>
        </div>

        <Separator />

        <div className="space-y-3">
          <p className="text-xs font-medium text-muted-foreground">
            UNIDADES ({process.departments.length})
          </p>
          <div className="grid min-w-0 gap-2">
            {process.departments.map((department) => (
              <div
                key={department.id}
                className="flex min-w-0 items-center gap-3 rounded-lg border bg-muted/30 p-3"
              >
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-background">
                  <Building2 className="h-4 w-4 text-muted-foreground" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="break-words text-sm font-medium">{department.name}</p>
                  <p className="text-xs text-muted-foreground">
                    Código: {department.budgetUnitCode ?? "Não informado"}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function ProcessItems({ items }: { items: ProcessDetailResponse["items"] }) {
  const [expandedKits, setExpandedKits] = useState<string[]>([]);

  if (items.length === 0) {
    return null;
  }

  function toggleKit(id: string) {
    setExpandedKits((current) =>
      current.includes(id) ? current.filter((itemId) => itemId !== id) : [...current, id],
    );
  }

  return (
    <Card aria-label="Itens da Solicitação" role="region">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between gap-3">
          <CardTitle className="text-base font-semibold">Itens da Solicitação</CardTitle>
          <Badge variant="secondary">
            {items.length} {items.length === 1 ? "item" : "itens"}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {items.map((item) => {
          const isExpanded = item.kind === "kit" && expandedKits.includes(item.id);

          return (
            <div
              key={item.id}
              className="rounded-lg border bg-card transition-colors hover:bg-muted/30"
            >
              <div className="p-4">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                  <div className="flex items-start gap-3">
                    <div
                      className={
                        item.kind === "kit"
                          ? "flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-amber-100 text-amber-600"
                          : "flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary"
                      }
                    >
                      {item.kind === "kit" ? (
                        <Layers3 className="h-4 w-4" />
                      ) : (
                        <Package className="h-4 w-4" />
                      )}
                    </div>
                    <div className="space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-mono text-xs text-muted-foreground">
                          #{item.code}
                        </span>
                        {item.kind === "kit" ? (
                          <Badge variant="outline" className="text-xs">
                            Kit
                          </Badge>
                        ) : null}
                      </div>
                      <p className="font-medium">{item.title}</p>
                      {item.description ? (
                        <p className="text-sm leading-relaxed text-muted-foreground">
                          {item.description}
                        </p>
                      ) : null}
                    </div>
                  </div>

                  <div className="shrink-0 text-left sm:text-right">
                    <p className="font-semibold">{formatCurrencyValue(item.totalValue)}</p>
                    <p className="text-xs text-muted-foreground">
                      {formatDisplayText(item.quantity, "Qtd. não informada")} {item.unit}
                      {item.unitValue ? ` x ${formatCurrencyValue(item.unitValue)}` : ""}
                    </p>
                  </div>
                </div>

                {item.kind === "kit" && item.components.length > 0 ? (
                  <button
                    type="button"
                    onClick={() => toggleKit(item.id)}
                    className="mt-3 flex w-full items-center justify-center gap-1 rounded-md border border-dashed py-2 text-xs text-muted-foreground transition-colors hover:bg-muted/50 hover:text-foreground"
                  >
                    {isExpanded ? (
                      <>
                        <ChevronDown className="h-3 w-3" />
                        Ocultar {item.components.length} componentes
                      </>
                    ) : (
                      <>
                        <ChevronRight className="h-3 w-3" />
                        Ver {item.components.length} componentes
                      </>
                    )}
                  </button>
                ) : null}
              </div>

              {item.kind === "kit" && isExpanded ? (
                <div className="border-t bg-muted/20 px-4 py-3">
                  <div className="space-y-2">
                    {item.components.map((component) => (
                      <div
                        key={component.id}
                        className="flex flex-col gap-2 rounded-md bg-background p-3 sm:flex-row sm:items-start sm:justify-between"
                      >
                        <div className="space-y-0.5">
                          <p className="text-sm font-medium">{component.title}</p>
                          {component.description ? (
                            <p className="text-xs leading-relaxed text-muted-foreground">
                              {component.description}
                            </p>
                          ) : null}
                        </div>
                        <p className="shrink-0 text-xs text-muted-foreground">
                          {formatDisplayText(component.quantity, "Qtd. não informada")}{" "}
                          {component.unit}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              ) : null}
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}

function ControlDates({ process }: { process: ProcessDetailResponse }) {
  return (
    <Card className="gap-0">
      <CardHeader className="pb-3">
        <CardTitle className="text-base font-semibold">Datas de Controle</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid gap-4">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-muted">
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </div>
            <div>
              <p className="text-sm font-medium">{formatProcessDetailDate(process.issuedAt)}</p>
              <p className="text-xs text-muted-foreground">Data de emissão</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-muted">
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </div>
            <div>
              <p className="text-sm font-medium">{formatProcessDetailDate(process.createdAt)}</p>
              <p className="text-xs text-muted-foreground">Criado em</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-muted">
              <RefreshCw className="h-4 w-4 text-muted-foreground" />
            </div>
            <div>
              <p className="text-sm font-medium">
                {formatProcessDetailDate(process.detailUpdatedAt)}
              </p>
              <p className="text-xs text-muted-foreground">Última atualização</p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function DocumentCard({
  document,
  processId,
}: {
  document: ProcessDetailDocument;
  processId: string;
}) {
  const status = getProcessDetailDocumentStatusConfig(document.status);
  const StatusIcon = status.icon;
  const DocumentIcon = documentIcons[document.type];
  const links = getProcessDetailDocumentActionLinks(processId, document);
  const hasPrimaryGenerationAction = links.createHref || links.regenerateHref;

  return (
    <Card className="group relative overflow-hidden transition-all hover:border-primary/30 hover:shadow-md">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-muted/60 ring-1 ring-black/5">
              <DocumentIcon className="h-6 w-6 text-primary" />
            </div>
            <div>
              <CardTitle className="text-lg font-bold">{document.label}</CardTitle>
              <CardDescription className="text-sm font-medium text-foreground/80">
                {document.title}
              </CardDescription>
            </div>
          </div>
          <Badge variant="outline" className={`gap-1 text-xs ${status.className}`}>
            <StatusIcon data-status-icon={status.iconName} className="h-3.5 w-3.5" />
            {status.label}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        <p className="text-sm leading-relaxed text-muted-foreground">{document.description}</p>

        {document.progress !== null ? (
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>Progresso</span>
              <span>{document.progress}%</span>
            </div>
            <Progress value={document.progress} />
          </div>
        ) : null}

        <div className="flex flex-wrap gap-2">
          {hasPrimaryGenerationAction ? (
            <Button
              asChild
              size="sm"
              variant={links.regenerateHref ? "outline" : "default"}
              className="flex-1"
            >
              <Link to={links.regenerateHref ?? links.createHref ?? "#"}>
                {document.status === "em_edicao" ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : links.regenerateHref ? (
                  <RefreshCw className="mr-2 h-4 w-4" />
                ) : (
                  <FilePlus2 data-action-icon="file-plus-2" className="mr-2 h-4 w-4" />
                )}
                {links.regenerateHref ? "Gerar novamente" : "Gerar"}
              </Link>
            </Button>
          ) : null}

          {links.viewHref ? (
            <Button asChild size="sm" variant="outline">
              <Link to={links.viewHref}>
                <Eye className="mr-2 h-4 w-4" />
                Visualizar
              </Link>
            </Button>
          ) : null}
        </div>
      </CardContent>
    </Card>
  );
}

function DocumentActions({ process }: { process: ProcessDetailResponse }) {
  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg font-semibold">Documentos do Processo</h2>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {process.documents.map((document) => (
          <DocumentCard key={document.type} document={document} processId={process.id} />
        ))}
      </div>
    </div>
  );
}

function Summary({ process }: { process: ProcessDetailResponse }) {
  return (
    <Card className="border-muted/50 sm:col-span-2 gap-0">
      <CardHeader className="pb-3">
        <CardTitle className="text-base font-semibold">Resumo Financeiro</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted/50">
            <Scale className="h-5 w-5 text-muted-foreground/60" />
          </div>
          <div>
            <p className="text-lg font-semibold text-foreground/80">
              {formatCurrencyValue(process.summary.estimatedTotalValue)}
            </p>
            <p className="text-xs text-muted-foreground/70">Valor total estimado</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function getErrorMessage(error: { data?: { message?: string } } | null | undefined) {
  return error?.data?.message ?? "Falha ao carregar o processo.";
}

export function ProcessDetailPageContent() {
  const { processId = "" } = useParams();
  const processQuery = useProcessDetail(processId);
  const process = processQuery.data;

  if (!processId) {
    return (
      <ProcessDetailFailureState
        title="Processo não encontrado"
        description="O identificador do processo não foi informado nesta rota."
        canRetry={false}
      />
    );
  }

  if (processQuery.isLoading) {
    return <ProcessDetailLoadingState />;
  }

  if (processQuery.isError) {
    if (processQuery.error?.status === 403 || processQuery.error?.status === 404) {
      return (
        <ProcessDetailFailureState
          title="Processo não encontrado"
          description="Não foi possível localizar este processo na área visível da sua sessão."
          canRetry={false}
        />
      );
    }

    return (
      <ProcessDetailFailureState
        title="Não foi possível carregar o processo"
        description={getErrorMessage(processQuery.error)}
        canRetry
        onRetry={() => void processQuery.refetch()}
      />
    );
  }

  if (!process) {
    return (
      <ProcessDetailFailureState
        title="Processo não encontrado"
        description="Não foi possível localizar este processo na resposta da API."
        canRetry={false}
      />
    );
  }

  return (
    <main className="container mx-auto max-w-6xl px-4 py-6 md:py-8">
      <div className="space-y-6">
        <ProcessHeader process={process} />

        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,380px)]">
          <div className="min-w-0 space-y-6">
            <ProcessInfo process={process} />
            <ProcessItems items={process.items} />
          </div>

          <div className="min-w-0 space-y-6">
            <InstitutionalContext process={process} />
            <ControlDates process={process} />
            <Summary process={process} />
          </div>
        </div>

        <DocumentActions process={process} />
      </div>
    </main>
  );
}

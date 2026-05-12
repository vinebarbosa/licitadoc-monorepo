import {
  AlertCircle,
  ClipboardList,
  Copy,
  Eye,
  FileSearch,
  MoreHorizontal,
  Pencil,
  Plus,
  RefreshCw,
  Scale,
  ScrollText,
} from "lucide-react";
import { useMemo } from "react";
import { Link, useParams } from "react-router-dom";
import { toast } from "sonner";
import { useAppShellHeader } from "@/modules/app-shell";
import { cn } from "@/shared/lib/utils";
import { Badge } from "@/shared/ui/badge";
import { Button } from "@/shared/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/shared/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/shared/ui/dropdown-menu";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/shared/ui/empty";
import { Progress } from "@/shared/ui/progress";
import { Separator } from "@/shared/ui/separator";
import { Skeleton } from "@/shared/ui/skeleton";
import { useProcessDetail } from "../api/processes";
import {
  formatProcessDetailDate,
  getProcessDetailBreadcrumbs,
  getProcessDetailDepartmentLabel,
  getProcessDetailDisplayName,
  getProcessDetailDocumentActionLinks,
  getProcessDetailDocumentStatusConfig,
  getProcessDetailErrorMessage,
  getProcessDetailItems,
  getProcessEditPath,
  getProcessEstimatedValueLabel,
  getProcessPreviewPath,
  getProcessStatusConfig,
  getProcessTypeLabel,
  type ProcessDetailSourceItem,
} from "../model/processes";

const processDocumentIcons = {
  dfd: ClipboardList,
  etp: FileSearch,
  tr: ScrollText,
  minuta: Scale,
} as const;

const detailSummarySkeletonKeys = ["responsavel", "valor", "criado", "atualizado"];
const detailDocumentSkeletonKeys = ["dfd", "etp", "tr", "minuta"];

function ProcessItemMetadata({ label, value }: { label: string; value: string | null }) {
  if (!value) {
    return null;
  }

  return (
    <span className="inline-flex items-center gap-1 rounded-md border border-border/80 px-2 py-1 text-xs text-muted-foreground">
      <span>{label}</span>
      <span className="font-medium text-foreground">{value}</span>
    </span>
  );
}

function ProcessDetailItemsSection({ items }: { items: ProcessDetailSourceItem[] }) {
  if (items.length === 0) {
    return null;
  }

  return (
    <section
      aria-labelledby="process-detail-items-heading"
      className="space-y-3"
      data-testid="process-detail-items"
    >
      <div className="flex flex-wrap items-center gap-2">
        <p id="process-detail-items-heading" className="text-sm text-muted-foreground">
          Itens da Solicitação
        </p>
        <Badge variant="secondary" className="text-xs font-medium">
          {items.length} {items.length === 1 ? "item" : "itens"}
        </Badge>
      </div>

      <div className="overflow-hidden rounded-md border border-border/80">
        <div className="divide-y divide-border/80">
          {items.map((item) => (
            <div key={item.id} className="space-y-3 p-4">
              <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                <div className="min-w-0 space-y-2">
                  <div className="flex flex-wrap items-center gap-2">
                    {item.code ? (
                      <Badge variant="outline" className="font-mono text-xs">
                        {item.code}
                      </Badge>
                    ) : null}
                    <p className="text-sm font-medium leading-relaxed break-words">{item.title}</p>
                  </div>
                  {item.description ? (
                    <p className="text-sm leading-relaxed text-muted-foreground break-words">
                      {item.description}
                    </p>
                  ) : null}
                </div>

                <div className="flex shrink-0 flex-wrap gap-2 lg:max-w-sm lg:justify-end">
                  <ProcessItemMetadata label="Qtd." value={item.quantity} />
                  <ProcessItemMetadata label="Un." value={item.unit} />
                  <ProcessItemMetadata label="Unit." value={item.unitValue} />
                  <ProcessItemMetadata label="Total" value={item.totalValue} />
                </div>
              </div>

              {item.components.length > 0 ? (
                <div className="space-y-2 border-l border-border pl-4">
                  <p className="text-xs font-medium text-muted-foreground">Componentes</p>
                  <div className="space-y-2">
                    {item.components.map((component) => (
                      <div
                        key={component.id}
                        className="flex flex-col gap-2 text-sm sm:flex-row sm:items-start sm:justify-between"
                      >
                        <div className="min-w-0">
                          <p className="font-medium leading-relaxed break-words">
                            {component.title}
                          </p>
                          {component.description ? (
                            <p className="text-muted-foreground leading-relaxed break-words">
                              {component.description}
                            </p>
                          ) : null}
                        </div>
                        <div className="flex shrink-0 flex-wrap gap-2 sm:justify-end">
                          <ProcessItemMetadata label="Qtd." value={component.quantity} />
                          <ProcessItemMetadata label="Un." value={component.unit} />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : null}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function ProcessDetailLoadingState() {
  return (
    <main className="flex-1 overflow-auto p-6">
      <div className="mx-auto max-w-7xl space-y-6">
        <div className="space-y-3">
          <p className="text-sm text-muted-foreground">Carregando processo...</p>
          <Skeleton className="h-8 w-80 max-w-full" />
          <div className="flex flex-wrap gap-3">
            <Skeleton className="h-6 w-28" />
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-4 w-36" />
          </div>
        </div>

        <Card>
          <CardContent className="grid gap-6 p-6 md:grid-cols-2 lg:grid-cols-4">
            {detailSummarySkeletonKeys.map((key) => (
              <div key={key} className="space-y-2">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-5 w-40 max-w-full" />
              </div>
            ))}
          </CardContent>
        </Card>

        <div className="space-y-4">
          <Skeleton className="h-7 w-52" />
          <div className="grid gap-4 md:grid-cols-2">
            {detailDocumentSkeletonKeys.map((key) => (
              <Card key={key}>
                <CardHeader>
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <Skeleton className="h-10 w-10 rounded-lg" />
                      <div className="space-y-2">
                        <Skeleton className="h-5 w-14" />
                        <Skeleton className="h-4 w-44 max-w-full" />
                      </div>
                    </div>
                    <Skeleton className="h-6 w-24" />
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-32" />
                  <div className="flex gap-2">
                    <Skeleton className="h-9 w-24" />
                    <Skeleton className="h-9 w-24" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </main>
  );
}

function ProcessDetailFailureState({
  title,
  description,
  canRetry,
  onRetry,
}: {
  title: string;
  description: string;
  canRetry: boolean;
  onRetry?: () => void;
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

export function ProcessDetailPageContent() {
  const { processId = "" } = useParams();
  const processQuery = useProcessDetail(processId);
  const process = processQuery.data;
  const breadcrumbs = useMemo(
    () => ({
      breadcrumbs: getProcessDetailBreadcrumbs(process),
    }),
    [process],
  );

  useAppShellHeader(breadcrumbs);

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
    const errorStatus = processQuery.error?.status;

    if (errorStatus === 403 || errorStatus === 404) {
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
        description={getProcessDetailErrorMessage(processQuery.error)}
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

  const processStatus = getProcessStatusConfig(process.status);
  const departmentLabel = getProcessDetailDepartmentLabel(process);
  const previewPath = getProcessPreviewPath(process.id);
  const editPath = getProcessEditPath(process.id);
  const processItems = getProcessDetailItems(process);

  return (
    <main className="flex-1 overflow-auto p-6">
      <div className="mx-auto max-w-7xl space-y-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="text-2xl font-semibold tracking-tight">
                {getProcessDetailDisplayName(process)}
              </h1>
              <Badge variant="outline" className={cn("font-medium", processStatus.className)}>
                {processStatus.label}
              </Badge>
            </div>
            <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
              <span className="font-mono">{process.processNumber}</span>
              <Separator orientation="vertical" className="h-4" />
              <span>{getProcessTypeLabel(process.type)}</span>
              <Separator orientation="vertical" className="h-4" />
              <span>{departmentLabel}</span>
            </div>
          </div>

          <div className="flex gap-2">
            <Button asChild variant="outline">
              <Link to={previewPath}>
                <Eye className="mr-2 h-4 w-4" />
                Visualizar
              </Link>
            </Button>
            <Button asChild variant="outline">
              <Link to={editPath}>
                <Pencil className="mr-2 h-4 w-4" />
                Editar
              </Link>
            </Button>
          </div>
        </div>

        <Card>
          <CardContent className="p-6">
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
              <div>
                <p className="text-sm text-muted-foreground">Responsável</p>
                <p className="font-medium">{process.responsibleName}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Valor Estimado</p>
                <p className="font-medium">
                  {getProcessEstimatedValueLabel(process.estimatedValue)}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Criado em</p>
                <p className="font-medium">{formatProcessDetailDate(process.createdAt)}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Última Atualização</p>
                <p className="font-medium">{formatProcessDetailDate(process.detailUpdatedAt)}</p>
              </div>
            </div>

            <Separator className="my-4" />

            <div className="space-y-4">
              <div>
                <p className="mb-2 text-sm text-muted-foreground">Objeto</p>
                <p className="text-sm leading-relaxed">{process.object}</p>
              </div>
              <div>
                <p className="mb-2 text-sm text-muted-foreground">Justificativa</p>
                <p className="text-sm leading-relaxed">{process.justification}</p>
              </div>
              <ProcessDetailItemsSection items={processItems} />
            </div>
          </CardContent>
        </Card>

        <div>
          <h2 className="mb-4 text-lg font-medium">Documentos do Processo</h2>
          <div className="grid auto-rows-fr gap-4 md:grid-cols-2">
            {process.documents.map((document) => {
              const DocumentIcon = processDocumentIcons[document.type];
              const documentStatus = getProcessDetailDocumentStatusConfig(document.status);
              const StatusIcon = documentStatus.icon;
              const actionLinks = getProcessDetailDocumentActionLinks(process.id, document);

              return (
                <Card
                  key={document.type}
                  className={cn(
                    "group relative flex h-full flex-col transition-all hover:border-primary/30 hover:shadow-md",
                    document.status === "em_edicao" && "border-primary/20",
                    document.status === "erro" && "border-critical/30",
                  )}
                >
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-center gap-3">
                        <div
                          className={cn(
                            "rounded-lg p-2.5",
                            document.status === "concluido" && "bg-success/10",
                            document.status === "em_edicao" && "bg-primary/10",
                            document.status === "pendente" && "bg-muted",
                            document.status === "erro" && "bg-critical/10",
                          )}
                        >
                          <DocumentIcon
                            className={cn(
                              "h-5 w-5",
                              document.status === "concluido" && "text-success",
                              document.status === "em_edicao" && "text-primary",
                              document.status === "pendente" && "text-muted-foreground",
                              document.status === "erro" && "text-critical",
                            )}
                          />
                        </div>

                        <div>
                          <CardTitle className="text-base">{document.label}</CardTitle>
                          <CardDescription className="text-xs">{document.title}</CardDescription>
                        </div>
                      </div>

                      <Badge
                        variant="outline"
                        className={cn("font-medium text-xs", documentStatus.className)}
                      >
                        <StatusIcon
                          className="mr-1 h-3 w-3"
                          data-status-icon={documentStatus.iconName}
                        />
                        {documentStatus.label}
                      </Badge>
                    </div>
                  </CardHeader>

                  <CardContent className="flex flex-1 flex-col space-y-4">
                    <p className="text-sm text-muted-foreground">{document.description}</p>

                    {document.progress !== null ? (
                      <div className="space-y-1">
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-muted-foreground">Progresso</span>
                          <span className="font-medium">{document.progress}%</span>
                        </div>
                        <Progress value={document.progress} />
                      </div>
                    ) : null}

                    {document.lastUpdatedAt ? (
                      <p className="text-xs text-muted-foreground">
                        Última atualização: {formatProcessDetailDate(document.lastUpdatedAt)}
                      </p>
                    ) : null}

                    <div className="mt-auto flex flex-wrap items-center gap-2 pt-1">
                      {actionLinks.createHref ? (
                        <Button asChild size="sm">
                          <Link to={actionLinks.createHref}>
                            <Plus className="mr-1 h-4 w-4" />
                            Gerar
                          </Link>
                        </Button>
                      ) : null}

                      {actionLinks.regenerateHref ? (
                        <Button asChild size="sm">
                          <Link to={actionLinks.regenerateHref}>
                            <RefreshCw className="mr-1 h-4 w-4" />
                            Gerar novamente
                          </Link>
                        </Button>
                      ) : null}

                      {actionLinks.editHref ? (
                        <Button asChild size="sm" variant="outline">
                          <Link to={actionLinks.editHref}>
                            <Pencil className="mr-1 h-4 w-4" />
                            Editar
                          </Link>
                        </Button>
                      ) : null}

                      {actionLinks.viewHref ? (
                        <Button asChild size="sm" variant="outline">
                          <Link to={actionLinks.viewHref}>
                            <Eye className="mr-1 h-4 w-4" />
                            Visualizar
                          </Link>
                        </Button>
                      ) : null}

                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button aria-label="Mais ações" size="sm" variant="ghost">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem
                            onClick={() =>
                              toast.info("Duplicação de documentos ainda não está disponível.")
                            }
                          >
                            <Copy className="mr-2 h-4 w-4" data-action-icon="copy" />
                            Duplicar
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </div>
    </main>
  );
}

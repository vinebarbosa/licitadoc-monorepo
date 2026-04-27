import { AlertTriangle, ArrowLeft, Clock, ExternalLink, FileText, RefreshCw } from "lucide-react";
import { useMemo } from "react";
import { Link, useParams } from "react-router-dom";
import { useAppShellHeader } from "@/modules/app-shell";
import { cn } from "@/shared/lib/utils";
import { Badge } from "@/shared/ui/badge";
import { Button } from "@/shared/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/ui/card";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/shared/ui/empty";
import { Separator } from "@/shared/ui/separator";
import { Skeleton } from "@/shared/ui/skeleton";
import { useDocumentDetail } from "../api/documents";
import {
  documentStatusConfig,
  documentTypeConfig,
  formatUpdatedAt,
  getDocumentPreviewBreadcrumbs,
  getDocumentProcessLabel,
  getDocumentResponsibleLabel,
  getDocumentTypeLabel,
  getPreviewableDraftContent,
  getProcessLink,
  mapApiStatusToDisplay,
  mapApiTypeToDisplay,
} from "../model/documents";
import { DocumentMarkdownPreview } from "./document-markdown-preview";

function DocumentPreviewLoadingState() {
  return (
    <main className="flex-1 overflow-auto p-6">
      <div className="mx-auto max-w-6xl space-y-6">
        <div className="flex items-start gap-4">
          <Skeleton className="h-9 w-9 rounded-md" />
          <div className="flex-1 space-y-3">
            <Skeleton className="h-8 w-80 max-w-full" />
            <div className="flex flex-wrap gap-2">
              <Skeleton className="h-6 w-24" />
              <Skeleton className="h-6 w-28" />
            </div>
          </div>
        </div>

        <Card>
          <CardContent className="grid gap-6 p-6 md:grid-cols-2 lg:grid-cols-4">
            {["tipo", "processo", "responsaveis", "atualizado"].map((key) => (
              <div key={key} className="space-y-2">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-5 w-40 max-w-full" />
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-44" />
          </CardHeader>
          <CardContent className="space-y-3">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-11/12" />
            <Skeleton className="h-4 w-4/5" />
            <Skeleton className="h-40 w-full" />
          </CardContent>
        </Card>
      </div>
    </main>
  );
}

function DocumentPreviewFailureState({
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
              <AlertTriangle className="h-6 w-6" />
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
              <Link to="/app/documentos">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Voltar para Documentos
              </Link>
            </Button>
          </EmptyContent>
        </Empty>
      </div>
    </main>
  );
}

function DocumentPreviewStateCard({
  title,
  description,
  icon,
}: {
  title: string;
  description: string;
  icon: "clock" | "alert" | "file";
}) {
  const Icon = icon === "clock" ? Clock : icon === "alert" ? AlertTriangle : FileText;

  return (
    <Card>
      <CardContent className="p-8">
        <Empty className="py-6">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <Icon className="h-6 w-6" />
            </EmptyMedia>
            <EmptyTitle>{title}</EmptyTitle>
            <EmptyDescription>{description}</EmptyDescription>
          </EmptyHeader>
        </Empty>
      </CardContent>
    </Card>
  );
}

export function DocumentPreviewPageUI() {
  const { documentId = "" } = useParams();
  const documentQuery = useDocumentDetail(documentId);
  const document = documentQuery.data;
  const breadcrumbs = useMemo(
    () => ({
      breadcrumbs: getDocumentPreviewBreadcrumbs(document),
      showSearch: false,
    }),
    [document],
  );

  useAppShellHeader(breadcrumbs);

  if (!documentId) {
    return (
      <DocumentPreviewFailureState
        title="Documento não encontrado"
        description="O identificador do documento não foi informado nesta rota."
        canRetry={false}
      />
    );
  }

  if (documentQuery.isLoading) {
    return <DocumentPreviewLoadingState />;
  }

  if (documentQuery.isError) {
    const errorStatus = documentQuery.error?.status;

    if (errorStatus === 403 || errorStatus === 404) {
      return (
        <DocumentPreviewFailureState
          title="Documento não encontrado"
          description="Não foi possível localizar este documento na área visível da sua sessão."
          canRetry={false}
        />
      );
    }

    return (
      <DocumentPreviewFailureState
        title="Não foi possível carregar o documento"
        description="Verifique a conexão e tente carregar o preview novamente."
        canRetry
        onRetry={() => void documentQuery.refetch()}
      />
    );
  }

  if (!document) {
    return (
      <DocumentPreviewFailureState
        title="Documento não encontrado"
        description="Não foi possível localizar este documento na resposta da API."
        canRetry={false}
      />
    );
  }

  const displayStatus = mapApiStatusToDisplay(document.status);
  const statusConf = documentStatusConfig[displayStatus];
  const StatusIcon = statusConf.icon;
  const displayType = mapApiTypeToDisplay(document.type);
  const typeConf = displayType ? documentTypeConfig[displayType] : null;
  const TypeIcon = typeConf?.icon ?? FileText;
  const draftContent = getPreviewableDraftContent(document.draftContent);
  const processLink = getProcessLink(document.processId);

  return (
    <main className="flex-1 overflow-auto p-6">
      <div className="mx-auto max-w-4xl space-y-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="flex min-w-0 items-start gap-4">
            <Button asChild variant="ghost" size="icon" className="-ml-2 shrink-0">
              <Link to="/app/documentos" aria-label="Voltar para Documentos">
                <ArrowLeft className="h-5 w-5" />
              </Link>
            </Button>
            <div className="min-w-0 space-y-2">
              <div className="flex flex-wrap items-center gap-3">
                <h1 className="break-words text-2xl font-semibold tracking-tight">
                  {document.name}
                </h1>
                <Badge variant="outline" className={cn("font-medium", statusConf.className)}>
                  <StatusIcon className="mr-1 h-3 w-3" />
                  {statusConf.label}
                </Badge>
              </div>
              <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
                <span className="inline-flex items-center gap-1">
                  <TypeIcon className="h-4 w-4" />
                  {getDocumentTypeLabel(document.type)}
                </span>
                <Separator orientation="vertical" className="hidden h-4 sm:block" />
                <Link
                  to={processLink}
                  className="inline-flex items-center gap-1 hover:text-primary"
                >
                  {getDocumentProcessLabel(document)}
                  <ExternalLink className="h-3.5 w-3.5" />
                </Link>
              </div>
            </div>
          </div>

          <Button asChild variant="outline">
            <Link to="/app/documentos">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Documentos
            </Link>
          </Button>
        </div>

        <Card>
          <CardContent className="grid gap-6 p-6 md:grid-cols-2 lg:grid-cols-4">
            <div>
              <p className="text-sm text-muted-foreground">Tipo</p>
              <p className="font-medium">{getDocumentTypeLabel(document.type)}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Processo</p>
              <Button asChild variant="link" className="h-auto p-0 font-medium">
                <Link to={processLink}>{getDocumentProcessLabel(document)}</Link>
              </Button>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Responsáveis</p>
              <p className="font-medium">{getDocumentResponsibleLabel(document.responsibles)}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Última Atualização</p>
              <p className="font-medium">{formatUpdatedAt(document.updatedAt)}</p>
            </div>
          </CardContent>
        </Card>

        {document.status === "generating" ? (
          <DocumentPreviewStateCard
            title="Preview em geração"
            description="O documento ainda está sendo gerado. Tente atualizar o preview em alguns instantes."
            icon="clock"
          />
        ) : document.status === "failed" ? (
          <DocumentPreviewStateCard
            title="Geração do documento falhou"
            description="Não há conteúdo para visualizar porque a geração deste documento terminou com erro."
            icon="alert"
          />
        ) : draftContent ? (
          <Card>
            <CardContent>
              <article className="min-h-[520px] px-6 py-8 md:px-10">
                <DocumentMarkdownPreview content={draftContent} />
              </article>
            </CardContent>
          </Card>
        ) : (
          <DocumentPreviewStateCard
            title="Documento sem conteúdo"
            description="Este documento está concluído, mas ainda não possui conteúdo salvo para preview."
            icon="file"
          />
        )}
      </div>
    </main>
  );
}

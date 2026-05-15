import {
  AlertTriangle,
  CheckCircle2,
  ClipboardList,
  Clock,
  FileSearch,
  type LucideIcon,
  Scale,
  ScrollText,
} from "lucide-react";
import type { DocumentDetailResponse, DocumentsListItem } from "../api/documents";

export type DocumentType = "dfd" | "etp" | "tr" | "minuta";
export type DocumentDisplayStatus = "concluido" | "em_edicao" | "pendente" | "erro";

export const documentTypeConfig: Record<
  DocumentType,
  { icon: LucideIcon; className: string; label: string }
> = {
  dfd: {
    icon: ClipboardList,
    className: "bg-chart-1/15 text-chart-1 border-chart-1/30",
    label: "Formalização de Demanda",
  },
  etp: {
    icon: FileSearch,
    className: "bg-chart-2/15 text-chart-2 border-chart-2/30",
    label: "Estudo Técnico Preliminar",
  },
  tr: {
    icon: ScrollText,
    className: "bg-chart-3/15 text-chart-3 border-chart-3/30",
    label: "Termo de Referência",
  },
  minuta: {
    icon: Scale,
    className: "bg-chart-5/15 text-chart-5 border-chart-5/30",
    label: "Minuta do Contrato",
  },
};

export const documentStatusConfig: Record<
  DocumentDisplayStatus,
  { label: string; className: string; icon: LucideIcon }
> = {
  concluido: {
    label: "Concluído",
    className: "bg-success/15 text-success border-success/30",
    icon: CheckCircle2,
  },
  em_edicao: {
    label: "Em edição",
    className: "bg-pending/15 text-pending border-pending/30",
    icon: Clock,
  },
  pendente: {
    label: "Pendente",
    className: "bg-muted text-muted-foreground border-muted",
    icon: Clock,
  },
  erro: {
    label: "Erro",
    className: "bg-critical/15 text-critical border-critical/30",
    icon: AlertTriangle,
  },
};

export function mapApiStatusToDisplay(apiStatus: string): DocumentDisplayStatus {
  if (apiStatus === "completed") return "concluido";
  if (apiStatus === "generating") return "em_edicao";
  if (apiStatus === "failed") return "erro";
  return "pendente";
}

export function mapApiTypeToDisplay(apiType: string): DocumentType | null {
  if (apiType === "dfd" || apiType === "etp" || apiType === "tr" || apiType === "minuta") {
    return apiType;
  }
  return null;
}

export function getDocumentDisplayType(item: DocumentsListItem): string {
  return item.type.toUpperCase();
}

export function deriveInitialDocumentName(
  documentType: DocumentType,
  processNumber: string,
): string {
  return `${documentType.toUpperCase()} - ${processNumber}`;
}

export function getDocumentEditLink(item: DocumentsListItem): string {
  return `/app/documento/${item.id}`;
}

export function getDocumentPreviewLink(item: DocumentsListItem): string {
  return `/app/documento/${item.id}/preview`;
}

export function getProcessLink(processId: string): string {
  return `/app/processo/${processId}`;
}

export function getDocumentPreviewBreadcrumbs(
  document: Pick<DocumentDetailResponse, "name"> | null | undefined,
) {
  return [
    { label: "Central de Trabalho", href: "/app" },
    { label: "Documentos", href: "/app/documentos" },
    { label: document?.name ?? "Preview do Documento" },
  ];
}

export function getDocumentTypeLabel(type: string): string {
  const displayType = mapApiTypeToDisplay(type);

  if (!displayType) {
    return type.toUpperCase();
  }

  return documentTypeConfig[displayType].label;
}

export function getDocumentResponsibleLabel(responsibles: string[]): string {
  if (responsibles.length === 0) {
    return "Não informado";
  }

  return responsibles.join(", ");
}

export function getDocumentProcessLabel(
  document: Pick<DocumentDetailResponse, "processId" | "processNumber">,
): string {
  return document.processNumber ?? document.processId;
}

export function getPreviewableDraftContent(content: string | null | undefined): string | null {
  const trimmedContent = content?.trim() ?? "";

  return trimmedContent.length > 0 ? trimmedContent : null;
}

export function formatUpdatedAt(isoString: string): string {
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(isoString));
}

export function deriveDocumentStats(items: DocumentsListItem[]) {
  const total = items.length;
  const concluido = items.filter((i) => mapApiStatusToDisplay(i.status) === "concluido").length;
  const em_edicao = items.filter((i) => mapApiStatusToDisplay(i.status) === "em_edicao").length;
  const erro = items.filter((i) => mapApiStatusToDisplay(i.status) === "erro").length;
  return { total, concluido, em_edicao, erro };
}

export function filterDocuments(
  items: DocumentsListItem[],
  {
    search,
    typeFilter,
    statusFilter,
  }: { search: string; typeFilter: string; statusFilter: string },
): DocumentsListItem[] {
  return items.filter((doc) => {
    const q = search.toLowerCase();
    const matchesSearch =
      !q ||
      doc.name.toLowerCase().includes(q) ||
      (doc.processNumber ?? "").toLowerCase().includes(q);
    const matchesType = typeFilter === "todos" || doc.type === typeFilter;
    const matchesStatus =
      statusFilter === "todos" || mapApiStatusToDisplay(doc.status) === statusFilter;
    return matchesSearch && matchesType && matchesStatus;
  });
}

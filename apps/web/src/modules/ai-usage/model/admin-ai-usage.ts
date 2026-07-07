import type { AdminAiUsageQueryParams } from "../api/admin-ai-usage";

export type AiUsageFilters = {
  documentType: string;
  from: string;
  model: string;
  organizationId: string;
  page: number;
  pageSize: number;
  providerKey: string;
  search: string;
  sort: "recent" | "cost_desc";
  status: "all" | "generating" | "completed" | "failed";
  to: string;
};

export const defaultAiUsageFilters: AiUsageFilters = {
  documentType: "all",
  from: "",
  model: "all",
  organizationId: "all",
  page: 1,
  pageSize: 10,
  providerKey: "all",
  search: "",
  sort: "recent",
  status: "all",
  to: "",
};

export const periodOptions = [
  { value: "7d", label: "Ultimos 7 dias", days: 7 },
  { value: "14d", label: "Ultimos 14 dias", days: 14 },
  { value: "30d", label: "Ultimos 30 dias", days: 30 },
  { value: "60d", label: "Ultimos 60 dias", days: 60 },
  { value: "90d", label: "Ultimos 90 dias", days: 90 },
] as const;

export type PeriodOption = (typeof periodOptions)[number]["value"];

const statusLabels: Record<Exclude<AiUsageFilters["status"], "all">, string> = {
  completed: "Concluida",
  failed: "Falhou",
  generating: "Gerando",
};

const documentTypeLabels: Record<string, string> = {
  dfd: "DFD",
  etp: "ETP",
  minuta: "Minuta",
  tr: "TR",
};

export function getAiUsageFilters(searchParams: URLSearchParams): AiUsageFilters {
  const status = searchParams.get("status");
  const sort = searchParams.get("sort");

  return {
    documentType: searchParams.get("documentType") ?? defaultAiUsageFilters.documentType,
    from: searchParams.get("from") ?? defaultAiUsageFilters.from,
    model: searchParams.get("model") ?? defaultAiUsageFilters.model,
    organizationId: searchParams.get("organizationId") ?? defaultAiUsageFilters.organizationId,
    page: Number(searchParams.get("page") ?? defaultAiUsageFilters.page),
    pageSize: Number(searchParams.get("pageSize") ?? defaultAiUsageFilters.pageSize),
    providerKey: searchParams.get("providerKey") ?? defaultAiUsageFilters.providerKey,
    search: searchParams.get("search") ?? defaultAiUsageFilters.search,
    sort: sort === "cost_desc" ? "cost_desc" : "recent",
    status:
      status === "generating" || status === "completed" || status === "failed" ? status : "all",
    to: searchParams.get("to") ?? defaultAiUsageFilters.to,
  };
}

export function getAiUsageQueryParams(filters: AiUsageFilters): AdminAiUsageQueryParams {
  const search = filters.search.trim();

  return {
    documentType: filters.documentType === "all" ? undefined : filters.documentType,
    from: filters.from || undefined,
    model: filters.model === "all" ? undefined : filters.model,
    organizationId: filters.organizationId === "all" ? undefined : filters.organizationId,
    page: filters.page,
    pageSize: filters.pageSize,
    providerKey: filters.providerKey === "all" ? undefined : filters.providerKey,
    search: search || undefined,
    sort: filters.sort,
    status: filters.status === "all" ? undefined : filters.status,
    to: filters.to || undefined,
  };
}

export function getAiUsageSearchParams(filters: AiUsageFilters) {
  const params = new URLSearchParams();

  for (const [key, value] of Object.entries(filters)) {
    const normalizedValue = key === "search" && typeof value === "string" ? value.trim() : value;

    if (
      normalizedValue === "" ||
      normalizedValue === "all" ||
      normalizedValue === defaultAiUsageFilters[key as keyof AiUsageFilters]
    ) {
      continue;
    }

    params.set(key, String(normalizedValue));
  }

  return params;
}

export function getPeriodRange(days: number, now = new Date()) {
  const to = now;
  const from = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);

  return {
    from: from.toISOString(),
    to: to.toISOString(),
  };
}

export function getSelectedPeriod(filters: AiUsageFilters): PeriodOption | "custom" {
  if (!filters.from || !filters.to) {
    return "30d";
  }

  const from = new Date(filters.from).getTime();
  const to = new Date(filters.to).getTime();
  const diffDays = Math.round((to - from) / (24 * 60 * 60 * 1000));
  const match = periodOptions.find((option) => option.days === diffDays);

  return match?.value ?? "custom";
}

export function formatUsd(value: number | null | undefined) {
  if (value == null) {
    return "Custo desconhecido";
  }

  return new Intl.NumberFormat("pt-BR", {
    currency: "USD",
    maximumFractionDigits: value >= 1 ? 2 : 4,
    minimumFractionDigits: 2,
    style: "currency",
  }).format(value);
}

export function formatInteger(value: number) {
  return new Intl.NumberFormat("pt-BR").format(value);
}

export function formatCompactNumber(value: number) {
  return new Intl.NumberFormat("pt-BR", {
    maximumFractionDigits: 1,
    notation: "compact",
  }).format(value);
}

export function formatPercent(value: number | null | undefined) {
  if (value == null) {
    return "N/D";
  }

  return new Intl.NumberFormat("pt-BR", {
    maximumFractionDigits: 1,
    style: "percent",
  }).format(value);
}

export function formatDuration(durationMs: number | null) {
  if (durationMs == null) {
    return "Em andamento";
  }

  if (durationMs < 1_000) {
    return `${durationMs} ms`;
  }

  return `${Math.round(durationMs / 1_000)} s`;
}

export function formatDateTime(value: string | null) {
  if (!value) {
    return "N/D";
  }

  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(new Date(value));
}

export function getDocumentTypeLabel(value: string) {
  return documentTypeLabels[value] ?? value.toUpperCase();
}

export function getStatusLabel(value: string) {
  if (value === "completed" || value === "failed" || value === "generating") {
    return statusLabels[value];
  }

  return value;
}

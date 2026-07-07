import {
  Activity,
  AlertTriangle,
  CalendarDays,
  Coins,
  Cpu,
  DollarSign,
  Download,
  FileText,
  Info,
  RefreshCw,
  Search,
  TrendingUp,
  Zap,
} from "lucide-react";
import type { ReactNode } from "react";
import { useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from "recharts";
import { cn } from "@/shared/lib/utils";
import { Alert, AlertDescription, AlertTitle } from "@/shared/ui/alert";
import { Badge } from "@/shared/ui/badge";
import { Button } from "@/shared/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/ui/card";
import {
  type ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/shared/ui/chart";
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/shared/ui/empty";
import { Input } from "@/shared/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/shared/ui/select";
import { Skeleton } from "@/shared/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/shared/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/shared/ui/tabs";
import {
  type AdminAiUsageBreakdownItem,
  type AdminAiUsageDashboard,
  type AdminAiUsageRun,
  useAdminAiUsageDashboard,
} from "../api/admin-ai-usage";
import {
  type AiUsageFilters,
  formatCompactNumber,
  formatDateTime,
  formatDuration,
  formatInteger,
  formatPercent,
  formatUsd,
  getAiUsageFilters,
  getAiUsageQueryParams,
  getAiUsageSearchParams,
  getDocumentTypeLabel,
  getPeriodRange,
  getSelectedPeriod,
  getStatusLabel,
  periodOptions,
} from "../model/admin-ai-usage";

const chartConfig = {
  costUsd: {
    color: "var(--color-chart-1)",
    label: "Custo",
  },
  failedRunCount: {
    color: "var(--color-chart-4)",
    label: "Falhas",
  },
} satisfies ChartConfig;

const statusClassNames: Record<string, string> = {
  completed: "border-success/30 bg-success/10 text-success",
  failed: "border-critical/30 bg-critical/10 text-critical",
  generating: "border-info/30 bg-info/10 text-info",
};

type SelectOption = {
  label: string;
  value: string;
};

function getOptionsFromBreakdown(
  items: AdminAiUsageBreakdownItem[],
  labelMap?: (value: string) => string,
) {
  return items.map((item) => ({
    label: labelMap ? labelMap(item.key) : item.label,
    value: item.key,
  }));
}

function escapeCsvCell(value: number | string | null | undefined) {
  const text = value == null ? "" : String(value);

  return `"${text.replaceAll('"', '""')}"`;
}

function buildRunsCsv(runs: AdminAiUsageRun[]) {
  const headers = [
    "Documento",
    "Organizacao",
    "Processo",
    "Modelo",
    "Provedor",
    "Status",
    "Custo USD",
    "Tokens",
    "Inicio",
  ];
  const rows = runs.map((run) => [
    run.documentName,
    run.organizationName,
    run.processLabel,
    run.model,
    run.providerKey,
    getStatusLabel(run.status),
    run.costKnown ? run.costUsd : null,
    run.totalTokens,
    run.startedAt,
  ]);

  return [headers, ...rows].map((row) => row.map(escapeCsvCell).join(",")).join("\n");
}

function downloadCsv(filename: string, csv: string) {
  const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
  const link = document.createElement("a");

  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

function MetricCard({
  icon,
  iconClassName,
  label,
  loading,
  sublabel,
  value,
}: {
  icon: ReactNode;
  iconClassName?: string;
  label: string;
  loading: boolean;
  sublabel?: string;
  value: string;
}) {
  return (
    <Card className="rounded-lg py-0">
      <CardContent className="p-4">
        {loading ? (
          <div className="space-y-3">
            <Skeleton className="h-3 w-28" />
            <Skeleton className="h-7 w-24" />
            <Skeleton className="h-3 w-32" />
          </div>
        ) : (
          <div className="flex min-h-32 flex-col justify-between gap-4">
            <div className="flex items-start justify-between gap-3">
              <p className="font-semibold text-[11px] text-muted-foreground uppercase leading-tight">
                {label}
              </p>
              <span className={cn("rounded-md bg-primary/10 p-1.5 text-primary", iconClassName)}>
                {icon}
              </span>
            </div>
            <div>
              <p className="font-semibold text-[clamp(1.5rem,2vw,1.875rem)] tabular-nums leading-none tracking-tight">
                {value}
              </p>
              {sublabel ? <p className="mt-2 text-muted-foreground text-xs">{sublabel}</p> : null}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function FilterSelect({
  allLabel = "Todos",
  className,
  label,
  onChange,
  options,
  value,
}: {
  allLabel?: string;
  className?: string;
  label: string;
  onChange: (value: string) => void;
  options: SelectOption[];
  value: string;
}) {
  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger
        aria-label={label}
        className={cn("h-8 min-w-0 bg-background text-xs", className)}
      >
        <SelectValue placeholder={allLabel} />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="all">{allLabel}</SelectItem>
        {options.map((option) => (
          <SelectItem key={option.value} value={option.value}>
            {option.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

function FilterToolbar({
  data,
  filters,
  onChange,
  onExport,
}: {
  data: AdminAiUsageDashboard | undefined;
  filters: AiUsageFilters;
  onChange: (next: Partial<AiUsageFilters>) => void;
  onExport: () => void;
}) {
  const selectedPeriod = getSelectedPeriod(filters);
  const modelOptions = getOptionsFromBreakdown(data?.breakdowns.models ?? []);
  const documentTypeOptions = getOptionsFromBreakdown(
    data?.breakdowns.documentTypes ?? [],
    getDocumentTypeLabel,
  );
  const statusOptions = [
    { value: "completed", label: "Concluidas" },
    { value: "failed", label: "Falhas" },
    { value: "generating", label: "Gerando" },
  ];

  return (
    <div className="space-y-2 rounded-lg border bg-card p-2 shadow-sm">
      <div className="flex flex-col gap-2 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-wrap items-center gap-1 rounded-md border bg-muted p-1">
          <CalendarDays className="ml-2 size-3.5 text-muted-foreground" />
          {periodOptions.map((option) => (
            <button
              key={option.value}
              type="button"
              aria-pressed={selectedPeriod === option.value}
              className={cn(
                "rounded-sm px-3 py-1.5 font-medium text-xs leading-none transition-colors",
                selectedPeriod === option.value
                  ? "bg-background text-foreground shadow-xs"
                  : "text-muted-foreground hover:text-foreground",
              )}
              onClick={() => onChange({ ...getPeriodRange(option.days), page: 1 })}
            >
              {option.label}
            </button>
          ))}
          {selectedPeriod === "custom" ? (
            <span className="px-3 py-1.5 text-muted-foreground text-xs">Personalizado</span>
          ) : null}
        </div>

        <div className="flex flex-wrap items-center gap-3 text-muted-foreground text-xs">
          <span>{formatInteger(data?.recentRuns.total ?? 0)} execucoes</span>
          <Button
            variant="outline"
            size="sm"
            className="h-8 gap-1.5"
            disabled={!data?.recentRuns.items.length}
            onClick={onExport}
          >
            <Download className="size-3.5" />
            Exportar CSV
          </Button>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        <div className="relative w-full sm:w-64">
          <Search className="-translate-y-1/2 absolute top-1/2 left-3 size-4 text-muted-foreground" />
          <Input
            aria-label="Buscar processo ou orgao"
            className="h-8 bg-background pl-9 text-sm"
            placeholder="Buscar processo, org..."
            value={filters.search}
            onChange={(event) => onChange({ search: event.target.value, page: 1 })}
          />
        </div>
        <FilterSelect
          allLabel="Todos os modelos"
          className="w-full sm:w-44"
          label="Modelo"
          value={filters.model}
          options={modelOptions}
          onChange={(model) => onChange({ model, page: 1 })}
        />
        <FilterSelect
          allLabel="Todos os tipos"
          className="w-full sm:w-44"
          label="Tipo de documento"
          value={filters.documentType}
          options={documentTypeOptions}
          onChange={(documentType) => onChange({ documentType, page: 1 })}
        />
        <FilterSelect
          allLabel="Todos os status"
          className="w-full sm:w-44"
          label="Status"
          value={filters.status}
          options={statusOptions}
          onChange={(status) => onChange({ status: status as AiUsageFilters["status"], page: 1 })}
        />
      </div>
    </div>
  );
}

function DashboardSkeleton() {
  return (
    <div className="space-y-5">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        {["cost", "avg", "docs", "tokens", "cache", "fails"].map((key) => (
          <MetricCard
            key={key}
            loading
            label="Carregando"
            value=""
            icon={<Activity className="size-4" />}
          />
        ))}
      </div>
      <div className="grid gap-4 xl:grid-cols-5">
        <Card className="rounded-lg py-0">
          <CardContent className="p-4">
            <Skeleton className="h-72 w-full" />
          </CardContent>
        </Card>
        <Card className="rounded-lg py-0">
          <CardContent className="space-y-4 p-4">
            <Skeleton className="h-6 w-40" />
            <Skeleton className="h-32 w-full" />
            <Skeleton className="h-20 w-full" />
          </CardContent>
        </Card>
      </div>
      <Skeleton className="h-72 w-full" />
    </div>
  );
}

function SummaryCards({ data, loading }: { data?: AdminAiUsageDashboard; loading: boolean }) {
  const summary = data?.summary;

  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
      <MetricCard
        loading={loading}
        label="Custo total"
        value={formatUsd(summary?.knownCostUsd)}
        sublabel={`${formatInteger(summary?.unknownCostRunCount ?? 0)} execucoes sem custo`}
        icon={<DollarSign className="size-4" />}
      />
      <MetricCard
        loading={loading}
        label="Custo medio/doc"
        value={formatUsd(summary?.averageCostPerCompletedDocumentUsd)}
        sublabel="por documento concluido"
        icon={<TrendingUp className="size-4" />}
      />
      <MetricCard
        loading={loading}
        label="Documentos gerados"
        value={formatInteger(summary?.generatedDocumentCount ?? 0)}
        sublabel={`${formatInteger(summary?.completedRunCount ?? 0)} com sucesso`}
        icon={<FileText className="size-4" />}
      />
      <MetricCard
        loading={loading}
        label="Tokens consumidos"
        value={formatCompactNumber(summary?.totalTokens ?? 0)}
        sublabel={`${formatCompactNumber(summary?.totalOutputTokens ?? 0)} de saida`}
        icon={<Cpu className="size-4" />}
      />
      <MetricCard
        loading={loading}
        label="Economia de cache"
        value={formatPercent(summary?.cacheInputTokenShare)}
        sublabel={`${formatCompactNumber(summary?.totalCachedInputTokens ?? 0)} tokens em cache`}
        icon={<Zap className="size-4" />}
        iconClassName="bg-warning-muted text-warning-muted-foreground"
      />
      <MetricCard
        loading={loading}
        label="Taxa de falha"
        value={formatPercent(summary?.failureRate)}
        sublabel={`${formatInteger(summary?.failedRunCount ?? 0)} falhas`}
        icon={<AlertTriangle className="size-4" />}
        iconClassName="bg-critical-muted text-critical-muted-foreground"
      />
    </div>
  );
}

function UsageChart({ data }: { data: AdminAiUsageDashboard }) {
  return (
    <Card className="rounded-lg py-0 xl:col-span-3">
      <CardHeader className="border-b px-4 py-3">
        <div className="flex items-start justify-between gap-4">
          <div>
            <CardTitle className="text-sm">Tendencia de custo</CardTitle>
            <p className="mt-0.5 text-muted-foreground text-xs">
              Custo diario (USD) e erros no periodo
            </p>
          </div>
          <div className="hidden items-center gap-3 text-muted-foreground text-xs sm:flex">
            <span className="flex items-center gap-1.5">
              <span className="inline-block h-0.5 w-3 rounded-full bg-chart-1" />
              Custo (USD)
            </span>
            <span className="flex items-center gap-1.5">
              <span className="inline-block h-0.5 w-3 rounded-full bg-chart-4" />
              Erros
            </span>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-4">
        <ChartContainer config={chartConfig} className="h-[300px] aspect-auto">
          <AreaChart data={data.trend} margin={{ left: 0, right: 12, top: 12 }}>
            <CartesianGrid vertical={false} />
            <XAxis
              dataKey="date"
              tickLine={false}
              axisLine={false}
              tickFormatter={(value) => value.slice(5)}
            />
            <YAxis tickLine={false} axisLine={false} tickFormatter={(value) => `$${value}`} />
            <ChartTooltip
              content={(props) => {
                const { content: _content, ...tooltipProps } = props;

                return (
                  <ChartTooltipContent
                    {...tooltipProps}
                    labelFormatter={(value) => `Dia ${value}`}
                    formatter={(value, name) =>
                      name === "costUsd" ? formatUsd(Number(value)) : formatInteger(Number(value))
                    }
                  />
                );
              }}
            />
            <Area
              type="monotone"
              dataKey="costUsd"
              stroke="var(--color-costUsd)"
              fill="var(--color-costUsd)"
              fillOpacity={0.18}
              strokeWidth={2}
            />
            <Area
              type="monotone"
              dataKey="failedRunCount"
              stroke="var(--color-failedRunCount)"
              fill="var(--color-failedRunCount)"
              fillOpacity={0.08}
              strokeWidth={2}
            />
          </AreaChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}

function BreakdownList({ items }: { items: AdminAiUsageBreakdownItem[] }) {
  const maxCost = Math.max(...items.map((item) => item.knownCostUsd), 0);

  if (items.length === 0) {
    return <p className="py-8 text-center text-muted-foreground text-sm">Sem dados para exibir.</p>;
  }

  return (
    <div className="space-y-3">
      {items.map((item) => (
        <div key={item.key} className="space-y-1.5">
          <div className="flex items-center justify-between gap-3 text-sm">
            <div className="min-w-0">
              <p className="truncate font-medium">{item.label}</p>
              <p className="text-muted-foreground text-xs">
                {formatInteger(item.runCount)} runs · {formatCompactNumber(item.totalTokens)} tokens
              </p>
            </div>
            <div className="shrink-0 text-right">
              <p className="font-semibold tabular-nums">{formatUsd(item.knownCostUsd)}</p>
              <p className="text-muted-foreground text-xs">
                {formatPercent(item.shareOfKnownCost)}
              </p>
            </div>
          </div>
          <div className="h-1.5 overflow-hidden rounded-full bg-muted">
            <div
              className="h-full rounded-full bg-primary/70"
              style={{ width: `${maxCost > 0 ? (item.knownCostUsd / maxCost) * 100 : 0}%` }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

function Breakdowns({ className, data }: { className?: string; data: AdminAiUsageDashboard }) {
  return (
    <Card className={cn("flex flex-col rounded-lg py-0", className)}>
      <CardHeader className="border-b px-4 py-3">
        <CardTitle className="text-sm">Breakdown</CardTitle>
        <p className="text-muted-foreground text-xs">Distribuicao de custo por dimensao</p>
      </CardHeader>
      <CardContent className="flex-1 p-4">
        <Tabs defaultValue="models">
          <TabsList className="mb-4 grid h-8 w-full grid-cols-3 text-xs">
            <TabsTrigger value="models">Modelos</TabsTrigger>
            <TabsTrigger value="documentTypes">Documentos</TabsTrigger>
            <TabsTrigger value="organizations">Organizacoes</TabsTrigger>
          </TabsList>
          <TabsContent value="models" className="mt-0">
            <BreakdownList items={data.breakdowns.models} />
          </TabsContent>
          <TabsContent value="documentTypes" className="mt-0">
            <BreakdownList items={data.breakdowns.documentTypes} />
          </TabsContent>
          <TabsContent value="organizations" className="mt-0">
            <BreakdownList items={data.breakdowns.organizations} />
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}

function RunStatusBadge({ status }: { status: string }) {
  return (
    <Badge variant="outline" className={cn("whitespace-nowrap", statusClassNames[status])}>
      {getStatusLabel(status)}
    </Badge>
  );
}

function RunsTable({
  filters,
  onPageChange,
  runs,
}: {
  filters: AiUsageFilters;
  onPageChange: (page: number) => void;
  runs: AdminAiUsageDashboard["recentRuns"];
}) {
  return (
    <Card className="rounded-lg py-0">
      <CardHeader className="border-b px-4 py-3">
        <CardTitle className="text-sm">Execucoes recentes</CardTitle>
        <p className="text-muted-foreground text-xs">
          {formatInteger(runs.items.length)} registro{runs.items.length === 1 ? "" : "s"} no periodo
        </p>
      </CardHeader>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Documento</TableHead>
                <TableHead>Organizacao</TableHead>
                <TableHead>Modelo</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Custo</TableHead>
                <TableHead className="text-right">Tokens</TableHead>
                <TableHead>Inicio</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {runs.items.map((run) => (
                <RunRow key={run.id} run={run} />
              ))}
            </TableBody>
          </Table>
        </div>
        <div className="flex flex-col gap-3 border-t p-4 text-sm md:flex-row md:items-center md:justify-between">
          <p className="text-muted-foreground">
            Mostrando {formatInteger(runs.items.length)} de {formatInteger(runs.total)} execucoes
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={filters.page <= 1}
              onClick={() => onPageChange(filters.page - 1)}
            >
              Anterior
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={filters.page >= runs.totalPages || runs.totalPages === 0}
              onClick={() => onPageChange(filters.page + 1)}
            >
              Proxima
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function RunRow({ run }: { run: AdminAiUsageRun }) {
  const documentPath = `/app/documento/${run.documentId}`;
  const processPath = run.processId ? `/app/processo/${run.processId}` : null;

  return (
    <TableRow>
      <TableCell className="min-w-64">
        <div className="space-y-1">
          <Link to={documentPath} className="font-medium hover:underline">
            {run.documentName}
          </Link>
          <p className="text-muted-foreground text-xs">
            {getDocumentTypeLabel(run.documentType)}
            {processPath ? (
              <>
                {" · "}
                <Link to={processPath} className="hover:underline">
                  {run.processLabel ?? "Processo"}
                </Link>
              </>
            ) : null}
          </p>
        </div>
      </TableCell>
      <TableCell className="min-w-48">{run.organizationName}</TableCell>
      <TableCell className="min-w-48">
        <div className="space-y-1">
          <Badge variant="secondary" className="font-mono text-[11px]">
            {run.model}
          </Badge>
          <p className="text-muted-foreground text-xs">{run.providerKey}</p>
        </div>
      </TableCell>
      <TableCell>
        <div className="space-y-1">
          <RunStatusBadge status={run.status} />
          <p className="text-muted-foreground text-xs">{formatDuration(run.durationMs)}</p>
        </div>
      </TableCell>
      <TableCell className="text-right font-medium tabular-nums">
        {run.costKnown ? formatUsd(run.costUsd) : "Desconhecido"}
      </TableCell>
      <TableCell className="text-right tabular-nums">
        {formatCompactNumber(run.totalTokens)}
      </TableCell>
      <TableCell className="min-w-36 text-muted-foreground text-xs">
        {formatDateTime(run.startedAt)}
      </TableCell>
    </TableRow>
  );
}

function EmptyDashboard() {
  return (
    <Card className="rounded-lg py-0">
      <CardContent className="p-0">
        <Empty className="py-12">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <Coins className="size-6" />
            </EmptyMedia>
            <EmptyTitle>Nenhum uso de IA encontrado</EmptyTitle>
            <EmptyDescription>
              Ajuste os filtros ou gere novos documentos para popular este painel.
            </EmptyDescription>
          </EmptyHeader>
        </Empty>
      </CardContent>
    </Card>
  );
}

function ErrorState({ onRetry }: { onRetry: () => void }) {
  return (
    <Alert variant="destructive" className="rounded-lg">
      <AlertTriangle className="size-4" />
      <AlertTitle>Nao foi possivel carregar o uso de IA</AlertTitle>
      <AlertDescription>
        <p>Confira sua conexao e tente novamente.</p>
        <Button variant="outline" size="sm" className="mt-2" onClick={onRetry}>
          Tentar novamente
        </Button>
      </AlertDescription>
    </Alert>
  );
}

export function AdminAiUsagePage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [lastUpdatedAt, setLastUpdatedAt] = useState(() => new Date());
  const filters = useMemo(() => getAiUsageFilters(searchParams), [searchParams]);
  const queryParams = useMemo(() => getAiUsageQueryParams(filters), [filters]);
  const usageQuery = useAdminAiUsageDashboard(queryParams);
  const dashboardData =
    usageQuery.data && "summary" in usageQuery.data ? usageQuery.data : undefined;
  const hasLoadError = usageQuery.isError || (!usageQuery.isLoading && !dashboardData);

  function updateFilters(next: Partial<AiUsageFilters>) {
    const nextFilters = { ...filters, ...next };

    setSearchParams(getAiUsageSearchParams(nextFilters), { replace: true });
  }

  async function handleRefresh() {
    await usageQuery.refetch();
    setLastUpdatedAt(new Date());
  }

  function handleExportCsv() {
    if (!dashboardData) {
      return;
    }

    const today = new Date().toISOString().slice(0, 10);

    downloadCsv(`uso-ia-${today}.csv`, buildRunsCsv(dashboardData.recentRuns.items));
  }

  return (
    <div className="flex-1 overflow-auto">
      <div className="sticky top-0 z-10 border-b bg-background/95 px-6 py-3 backdrop-blur">
        <div className="mx-auto flex max-w-7xl flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-3">
            <div className="rounded-md bg-accent p-1.5">
              <Cpu className="size-4 text-accent-foreground" />
            </div>
            <div>
              <h1 className="font-semibold text-base leading-none">Uso de IA</h1>
              <p className="mt-1 text-muted-foreground text-xs">
                Monitoramento de consumo e custo monetario · atualizado as{" "}
                {lastUpdatedAt.toLocaleTimeString("pt-BR", {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <div className="hidden items-center gap-1.5 rounded-md bg-info-muted px-2 py-1 text-info-muted-foreground text-xs sm:flex">
              <Info className="size-3.5" />
              Custos em USD · Lei 14.133
            </div>
            <Button
              variant="outline"
              size="sm"
              className="h-8 gap-1.5 text-xs"
              onClick={handleRefresh}
              disabled={usageQuery.isFetching}
            >
              <RefreshCw className={cn("size-3.5", usageQuery.isFetching && "animate-spin")} />
              Atualizar
            </Button>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-7xl space-y-5 px-6 py-5">
        <FilterToolbar
          data={dashboardData}
          filters={filters}
          onChange={updateFilters}
          onExport={handleExportCsv}
        />

        {hasLoadError ? <ErrorState onRetry={() => void handleRefresh()} /> : null}
        {usageQuery.isLoading ? <DashboardSkeleton /> : null}

        {!usageQuery.isLoading && dashboardData && dashboardData.summary.runCount === 0 ? (
          <>
            <SummaryCards data={dashboardData} loading={false} />
            <EmptyDashboard />
          </>
        ) : null}

        {!usageQuery.isLoading && dashboardData && dashboardData.summary.runCount > 0 ? (
          <>
            <SummaryCards data={dashboardData} loading={false} />
            <div className="grid gap-4 xl:grid-cols-5">
              <UsageChart data={dashboardData} />
              <Breakdowns data={dashboardData} className="xl:col-span-2" />
            </div>
            <RunsTable
              filters={filters}
              runs={dashboardData.recentRuns}
              onPageChange={(page) => updateFilters({ page })}
            />
            <p className="pb-2 text-center text-muted-foreground text-[11px]">
              Dados referentes ao periodo selecionado · Custos calculados em USD com base nos
              metadados da geracao · Acesso restrito a administradores do sistema
            </p>
          </>
        ) : null}
      </div>
    </div>
  );
}

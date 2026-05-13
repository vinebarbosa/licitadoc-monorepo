import { Plus, RefreshCw, Search } from "lucide-react";
import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { cn } from "@/shared/lib/utils";
import { Badge } from "@/shared/ui/badge";
import { Button } from "@/shared/ui/button";
import { Card } from "@/shared/ui/card";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/shared/ui/empty";
import { Input } from "@/shared/ui/input";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/shared/ui/pagination";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/shared/ui/select";
import { Skeleton } from "@/shared/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/shared/ui/table";
import { useProcessesList } from "../api/processes";
import {
  formatProcessListDate,
  getDefaultProcessesFilters,
  getProcessDetailPath,
  getProcessDisplayName,
  getProcessesFilterSearchParams,
  getProcessesQueryParams,
  getProcessStatusConfig,
  getProcessTypeLabel,
  type ProcessesFilters,
  processTypeOptions,
  statusOptions,
} from "../model/processes";

function ProcessesTableSkeleton() {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className="w-[120px]">Número</TableHead>
          <TableHead>Nome</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>Tipo</TableHead>
          <TableHead>Responsável</TableHead>
          <TableHead>Documentos</TableHead>
          <TableHead className="text-right">Última Atualização</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {["one", "two", "three", "four", "five"].map((rowKey) => (
          <TableRow key={rowKey}>
            <TableCell>
              <Skeleton className="h-4 w-24" />
            </TableCell>
            <TableCell>
              <Skeleton className="h-4 w-64 max-w-full" />
            </TableCell>
            <TableCell>
              <Skeleton className="h-6 w-24" />
            </TableCell>
            <TableCell>
              <Skeleton className="h-4 w-36" />
            </TableCell>
            <TableCell>
              <Skeleton className="h-4 w-28" />
            </TableCell>
            <TableCell>
              <Skeleton className="h-4 w-20" />
            </TableCell>
            <TableCell className="text-right">
              <Skeleton className="ml-auto h-4 w-24" />
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

export function ProcessesListingPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [filters, setFilters] = useState<ProcessesFilters>(() =>
    getDefaultProcessesFilters(searchParams),
  );

  useEffect(() => {
    setFilters(getDefaultProcessesFilters(searchParams));
  }, [searchParams]);

  const processesQuery = useProcessesList(getProcessesQueryParams(filters));
  const hasInvalidResponse = Boolean(
    processesQuery.data && !Array.isArray(processesQuery.data.items),
  );
  const hasError = processesQuery.isError || hasInvalidResponse;
  const processes = hasInvalidResponse ? [] : (processesQuery.data?.items ?? []);
  const total = hasInvalidResponse ? 0 : (processesQuery.data?.total ?? processes.length);
  const totalPages = hasInvalidResponse ? 0 : (processesQuery.data?.totalPages ?? 0);

  function updateRoute(nextFilters: ProcessesFilters) {
    setSearchParams(getProcessesFilterSearchParams(nextFilters), { replace: true });
  }

  function handleFilterChange(nextFilters: Partial<ProcessesFilters>) {
    updateRoute({ ...filters, ...nextFilters, page: nextFilters.page ?? 1 });
  }

  return (
    <main className="flex-1 overflow-auto p-6">
      <div className="mx-auto max-w-7xl space-y-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">Processos de Contratação</h1>
            <p className="text-muted-foreground">Gerencie todos os processos de contratação</p>
          </div>
          <Button asChild>
            <Link to="/app/processo/novo">
              <Plus className="mr-2 h-4 w-4" />
              Novo Processo
            </Link>
          </Button>
        </div>

        <div className="flex flex-col gap-4 md:flex-row md:items-center">
          <div className="relative max-w-sm flex-1">
            <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              aria-label="Buscar processos"
              placeholder="Buscar processos..."
              className="pl-9"
              value={filters.search}
              onChange={(event) => handleFilterChange({ search: event.target.value })}
            />
          </div>
          <div className="flex flex-col gap-2 sm:flex-row">
            <Select
              value={filters.status}
              onValueChange={(status) =>
                handleFilterChange({ status: status as ProcessesFilters["status"] })
              }
            >
              <SelectTrigger className="w-full sm:w-[150px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos</SelectItem>
                {statusOptions.map((status) => (
                  <SelectItem key={status.value} value={status.value}>
                    {status.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select
              value={filters.procurementMethod}
              onValueChange={(procurementMethod) => handleFilterChange({ procurementMethod })}
            >
              <SelectTrigger className="w-full sm:w-[180px]">
                <SelectValue placeholder="Tipo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos os tipos</SelectItem>
                {processTypeOptions.map((type) => (
                  <SelectItem key={type.value} value={type.value}>
                    {type.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <Card>
          {processesQuery.isLoading ? (
            <ProcessesTableSkeleton />
          ) : hasError ? (
            <Empty className="py-12">
              <EmptyHeader>
                <EmptyMedia variant="icon">
                  <RefreshCw className="h-6 w-6" />
                </EmptyMedia>
                <EmptyTitle>Não foi possível carregar os processos</EmptyTitle>
                <EmptyDescription>
                  Verifique a conexão e tente atualizar a listagem.
                </EmptyDescription>
              </EmptyHeader>
              <EmptyContent>
                <Button onClick={() => void processesQuery.refetch()}>
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Tentar novamente
                </Button>
              </EmptyContent>
            </Empty>
          ) : processes.length === 0 ? (
            <Empty className="py-12">
              <EmptyHeader>
                <EmptyMedia variant="icon">
                  <Search className="h-6 w-6" />
                </EmptyMedia>
                <EmptyTitle>Nenhum processo encontrado</EmptyTitle>
                <EmptyDescription>
                  Ajuste os filtros ou crie um novo processo de contratação.
                </EmptyDescription>
              </EmptyHeader>
              <EmptyContent>
                <Button asChild>
                  <Link to="/app/processo/novo">
                    <Plus className="mr-2 h-4 w-4" />
                    Novo Processo
                  </Link>
                </Button>
              </EmptyContent>
            </Empty>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[120px]">Número</TableHead>
                  <TableHead>Nome</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Responsável</TableHead>
                  <TableHead>Documentos</TableHead>
                  <TableHead className="text-right">Última Atualização</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {processes.map((process) => {
                  const status = getProcessStatusConfig(process.status);
                  const detailPath = getProcessDetailPath(process);
                  const documentDots = [
                    ...process.documents.completedTypes.map((type) => ({
                      completed: true,
                      type,
                    })),
                    ...process.documents.missingTypes.map((type) => ({
                      completed: false,
                      type,
                    })),
                  ];

                  return (
                    <TableRow
                      key={process.id}
                      className="cursor-pointer transition-colors hover:bg-accent/50"
                    >
                      <TableCell className="font-mono text-sm">
                        <Link to={detailPath} className="hover:text-primary">
                          {process.processNumber}
                        </Link>
                      </TableCell>
                      <TableCell>
                        <Link to={detailPath} className="font-medium hover:text-primary">
                          <div className="w-full max-w-50">
                            <span className="text-ellipsis block max-w-full whitespace-nowrap overflow-hidden">
                              {getProcessDisplayName(process)}
                            </span>
                          </div>
                        </Link>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className={cn("font-medium", status.className)}>
                          {status.label}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {getProcessTypeLabel(process.procurementMethod ?? "")}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {process.responsibleName ?? "Nao informado"}
                      </TableCell>
                      <TableCell>
                        <fieldset
                          className="m-0 flex items-center gap-2 border-0 p-0"
                          aria-label={`Documentos completos: ${process.documents.completedCount} de ${process.documents.totalRequiredCount}`}
                        >
                          <div className="flex gap-0.5">
                            {documentDots.map((dot) => (
                              <div
                                key={dot.type}
                                aria-hidden="true"
                                className={cn(
                                  "h-2 w-2 rounded-full",
                                  dot.completed ? "bg-success" : "bg-muted",
                                )}
                              />
                            ))}
                          </div>
                          <span className="text-xs text-muted-foreground">
                            {process.documents.completedCount}/
                            {process.documents.totalRequiredCount}
                          </span>
                        </fieldset>
                      </TableCell>
                      <TableCell className="text-right text-muted-foreground">
                        {formatProcessListDate(process.listUpdatedAt)}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </Card>

        {!processesQuery.isLoading && !hasError && processes.length > 0 ? (
          <div className="flex flex-col gap-4 text-sm text-muted-foreground md:flex-row md:items-center md:justify-between">
            <p>
              Mostrando {processes.length} de {total} processos
            </p>
            <Pagination className="mx-0 w-auto justify-start md:justify-end">
              <PaginationContent>
                <PaginationItem>
                  <PaginationPrevious
                    href="#"
                    onClick={(event) => {
                      event.preventDefault();

                      if (filters.page > 1) {
                        updateRoute({ ...filters, page: filters.page - 1 });
                      }
                    }}
                    aria-disabled={filters.page <= 1}
                    className={cn(filters.page <= 1 && "pointer-events-none opacity-50")}
                  />
                </PaginationItem>
                {Array.from({ length: totalPages }).map((_, index) => {
                  const page = index + 1;

                  return (
                    <PaginationItem key={page}>
                      <PaginationLink
                        href="#"
                        isActive={page === filters.page}
                        onClick={(event) => {
                          event.preventDefault();
                          updateRoute({ ...filters, page });
                        }}
                      >
                        {page}
                      </PaginationLink>
                    </PaginationItem>
                  );
                })}
                <PaginationItem>
                  <PaginationNext
                    href="#"
                    onClick={(event) => {
                      event.preventDefault();

                      if (filters.page < totalPages) {
                        updateRoute({ ...filters, page: filters.page + 1 });
                      }
                    }}
                    aria-disabled={filters.page >= totalPages}
                    className={cn(filters.page >= totalPages && "pointer-events-none opacity-50")}
                  />
                </PaginationItem>
              </PaginationContent>
            </Pagination>
          </div>
        ) : null}
      </div>
    </main>
  );
}

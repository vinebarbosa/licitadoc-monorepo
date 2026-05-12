import {
  AlertTriangle,
  CheckCircle2,
  Clock,
  Copy,
  Eye,
  FolderOpen,
  MoreHorizontal,
  Pencil,
  Plus,
  RefreshCw,
  Search,
  Trash2,
} from "lucide-react";
import { useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { toast } from "sonner";
import { cn } from "@/shared/lib/utils";
import { Badge } from "@/shared/ui/badge";
import { Button } from "@/shared/ui/button";
import { Card, CardContent } from "@/shared/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
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
import { Input } from "@/shared/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/shared/ui/select";
import { Skeleton } from "@/shared/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/shared/ui/table";
import { useDocumentsList } from "../api/documents";
import {
  deriveDocumentStats,
  documentStatusConfig,
  documentTypeConfig,
  filterDocuments,
  formatUpdatedAt,
  getDocumentDisplayType,
  getDocumentEditLink,
  getDocumentPreviewLink,
  getProcessLink,
  mapApiStatusToDisplay,
  mapApiTypeToDisplay,
} from "../model/documents";

function DocumentsTableSkeleton() {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Nome</TableHead>
          <TableHead>Tipo</TableHead>
          <TableHead>Processo</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>Responsável</TableHead>
          <TableHead className="text-right">Última Atualização</TableHead>
          <TableHead className="w-[50px]" />
        </TableRow>
      </TableHeader>
      <TableBody>
        {["a", "b", "c", "d", "e"].map((k) => (
          <TableRow key={k}>
            <TableCell>
              <Skeleton className="h-4 w-56" />
            </TableCell>
            <TableCell>
              <Skeleton className="h-6 w-20" />
            </TableCell>
            <TableCell>
              <Skeleton className="h-4 w-24" />
            </TableCell>
            <TableCell>
              <Skeleton className="h-6 w-24" />
            </TableCell>
            <TableCell>
              <Skeleton className="h-4 w-28" />
            </TableCell>
            <TableCell className="text-right">
              <Skeleton className="ml-auto h-4 w-24" />
            </TableCell>
            <TableCell />
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

export function DocumentsListingPage() {
  const [searchParams] = useSearchParams();
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("todos");
  const [typeFilter, setTypeFilter] = useState(() => {
    const tipo = searchParams.get("tipo");
    return tipo ?? "todos";
  });

  const documentsQuery = useDocumentsList();
  const allItems = documentsQuery.data?.items ?? [];
  const stats = useMemo(() => deriveDocumentStats(allItems), [allItems]);
  const filteredItems = useMemo(
    () => filterDocuments(allItems, { search: searchQuery, typeFilter, statusFilter }),
    [allItems, searchQuery, typeFilter, statusFilter],
  );

  const hasInvalidResponse =
    documentsQuery.data != null && !Array.isArray(documentsQuery.data.items);
  const hasError = documentsQuery.isError || hasInvalidResponse;
  const isLoading = documentsQuery.isLoading;

  return (
    <main className="flex-1 overflow-auto p-6">
      <div className="mx-auto max-w-7xl space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">Documentos</h1>
            <p className="text-muted-foreground">
              Gerencie todos os documentos de licitação (Lei 14.133)
            </p>
          </div>
          <Button asChild>
            <Link to="/app/documento/novo">
              <Plus className="mr-2 h-4 w-4" />
              Novo Documento
            </Link>
          </Button>
        </div>

        {/* Stats */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="rounded-lg bg-muted p-2">
                  <FolderOpen className="h-5 w-5 text-muted-foreground" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{isLoading ? "—" : stats.total}</p>
                  <p className="text-xs text-muted-foreground">Total</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="rounded-lg bg-success/20 p-2">
                  <CheckCircle2 className="h-5 w-5 text-success" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{isLoading ? "—" : stats.concluido}</p>
                  <p className="text-xs text-muted-foreground">Concluídos</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="rounded-lg bg-pending/20 p-2">
                  <Clock className="h-5 w-5 text-pending" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{isLoading ? "—" : stats.em_edicao}</p>
                  <p className="text-xs text-muted-foreground">Em edição</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="rounded-lg bg-critical/20 p-2">
                  <AlertTriangle className="h-5 w-5 text-critical" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{isLoading ? "—" : stats.erro}</p>
                  <p className="text-xs text-muted-foreground">Com erro</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <div className="flex flex-col gap-4 md:flex-row md:items-center">
          <div className="relative max-w-sm flex-1">
            <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              aria-label="Buscar documentos"
              placeholder="Buscar documentos..."
              className="pl-9"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <div className="flex gap-2">
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-[130px]">
                <SelectValue placeholder="Tipo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos</SelectItem>
                <SelectItem value="dfd">DFD</SelectItem>
                <SelectItem value="etp">ETP</SelectItem>
                <SelectItem value="tr">TR</SelectItem>
                <SelectItem value="minuta">Minuta</SelectItem>
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos</SelectItem>
                <SelectItem value="em_edicao">Em edição</SelectItem>
                <SelectItem value="concluido">Concluído</SelectItem>
                <SelectItem value="erro">Com erro</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Table */}
        <Card>
          {isLoading ? (
            <DocumentsTableSkeleton />
          ) : hasError ? (
            <Empty className="py-12">
              <EmptyHeader>
                <EmptyMedia variant="icon">
                  <RefreshCw className="h-6 w-6" />
                </EmptyMedia>
                <EmptyTitle>Não foi possível carregar os documentos</EmptyTitle>
                <EmptyDescription>
                  Verifique a conexão e tente atualizar a listagem.
                </EmptyDescription>
              </EmptyHeader>
              <EmptyContent>
                <Button onClick={() => void documentsQuery.refetch()}>
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Tentar novamente
                </Button>
              </EmptyContent>
            </Empty>
          ) : filteredItems.length === 0 ? (
            <Empty className="py-12">
              <EmptyHeader>
                <EmptyMedia variant="icon">
                  <Search className="h-6 w-6" />
                </EmptyMedia>
                <EmptyTitle>Nenhum documento encontrado</EmptyTitle>
                <EmptyDescription>Ajuste os filtros ou crie um novo documento.</EmptyDescription>
              </EmptyHeader>
              <EmptyContent>
                <Button asChild>
                  <Link to="/app/documento/novo">
                    <Plus className="mr-2 h-4 w-4" />
                    Novo Documento
                  </Link>
                </Button>
              </EmptyContent>
            </Empty>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Processo</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Responsável</TableHead>
                  <TableHead className="text-right">Última Atualização</TableHead>
                  <TableHead className="w-[50px]" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredItems.map((doc) => {
                  const displayStatus = mapApiStatusToDisplay(doc.status);
                  const statusConf = documentStatusConfig[displayStatus];
                  const StatusIcon = statusConf.icon;
                  const docType = mapApiTypeToDisplay(doc.type);
                  const typeConf = docType ? documentTypeConfig[docType] : null;
                  const TypeIcon = typeConf?.icon ?? null;
                  const editLink = getDocumentEditLink(doc);
                  const previewLink = getDocumentPreviewLink(doc);
                  const processLink = doc.processId ? getProcessLink(doc.processId) : null;

                  return (
                    <TableRow key={doc.id} className="cursor-pointer hover:bg-accent/50">
                      <TableCell>
                        <Link to={previewLink} className="font-medium hover:text-primary">
                          {doc.name}
                        </Link>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className={cn("font-medium", typeConf?.className)}>
                          {TypeIcon ? <TypeIcon className="mr-1 h-3 w-3" /> : null}
                          {getDocumentDisplayType(doc)}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {processLink ? (
                          <Link to={processLink} className="text-sm hover:text-primary">
                            {doc.processNumber ?? doc.processId}
                          </Link>
                        ) : (
                          <span className="text-sm text-muted-foreground">—</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className={cn("font-medium", statusConf.className)}
                        >
                          <StatusIcon className="mr-1 h-3 w-3" />
                          {statusConf.label}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {doc.responsibles[0] ?? "—"}
                      </TableCell>
                      <TableCell className="text-right text-muted-foreground">
                        {formatUpdatedAt(doc.updatedAt)}
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              aria-label="Mais ações"
                              variant="ghost"
                              size="sm"
                              className="h-8 w-8 p-0"
                            >
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem asChild>
                              <Link to={editLink}>
                                <Pencil className="mr-2 h-4 w-4" />
                                Editar
                              </Link>
                            </DropdownMenuItem>
                            <DropdownMenuItem asChild>
                              <Link to={previewLink}>
                                <Eye className="mr-2 h-4 w-4" />
                                Visualizar
                              </Link>
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() =>
                                toast.info("Duplicação de documentos ainda não está disponível.")
                              }
                            >
                              <Copy className="mr-2 h-4 w-4" />
                              Duplicar
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              className="text-critical"
                              onClick={() =>
                                toast.info("Exclusão de documentos ainda não está disponível.")
                              }
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              Excluir
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </Card>

        {/* Pagination info */}
        {!isLoading && !hasError && (
          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <p>
              Mostrando {filteredItems.length} de {allItems.length} documentos
            </p>
          </div>
        )}
      </div>
    </main>
  );
}

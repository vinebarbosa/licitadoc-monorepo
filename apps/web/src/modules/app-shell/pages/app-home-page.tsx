import {
  ArrowRight,
  ClipboardList,
  FileEdit,
  FileSearch,
  Plus,
  RefreshCw,
  Scale,
  ScrollText,
  Search,
} from "lucide-react";
import { Link } from "react-router-dom";
import {
  formatProcessListDate,
  getProcessDetailPath,
  getProcessDisplayName,
  getProcessStatusConfig,
  getProcessTypeLabel,
  useProcessesList,
} from "@/modules/processes";
import { cn } from "@/shared/lib/utils";
import { Badge } from "@/shared/ui/badge";
import { Button } from "@/shared/ui/button";
import { Card, CardContent } from "@/shared/ui/card";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/shared/ui/empty";
import { Skeleton } from "@/shared/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/shared/ui/table";

const HOME_PROCESS_PAGE_SIZE = 5;

const quickActions = [
  {
    title: "Criar DFD",
    description: "Documento de Formalização de Demanda",
    icon: ClipboardList,
    href: "/app/documento/novo?tipo=dfd",
    color: "text-primary",
  },
  {
    title: "Criar ETP",
    description: "Estudo Técnico Preliminar",
    icon: FileSearch,
    href: "/app/documento/novo?tipo=etp",
    color: "text-primary",
  },
  {
    title: "Criar TR",
    description: "Termo de Referência",
    icon: ScrollText,
    href: "/app/documento/novo?tipo=tr",
    color: "text-primary",
  },
  {
    title: "Criar Minuta",
    description: "Minuta do Contrato",
    icon: Scale,
    href: "/app/documento/novo?tipo=minuta",
    color: "text-primary",
  },
] as const;

const inProgressDocuments = [
  {
    id: "DOC-2024-0089",
    name: "ETP - Serviços de TI",
    type: "ETP",
    process: "PE 045/2024",
    lastEdited: "há 2 horas",
    progress: 75,
  },
  {
    id: "DOC-2024-0088",
    name: "TR - Material de Escritório",
    type: "TR",
    process: "PE 044/2024",
    lastEdited: "há 1 dia",
    progress: 40,
  },
  {
    id: "DOC-2024-0085",
    name: "DFD - Equipamentos de Informática",
    type: "DFD",
    process: "PE 043/2024",
    lastEdited: "há 3 dias",
    progress: 90,
  },
] as const;

const documentTypeConfig: Record<string, { className: string }> = {
  DFD: { className: "bg-chart-1/15 text-chart-1 border-chart-1/30" },
  ETP: { className: "bg-chart-2/15 text-chart-2 border-chart-2/30" },
  TR: { className: "bg-chart-3/15 text-chart-3 border-chart-3/30" },
  Minuta: { className: "bg-chart-5/15 text-chart-5 border-chart-5/30" },
};

function HomeProcessesTableSkeleton() {
  return (
    <Table aria-label="Carregando processos">
      <TableHeader>
        <TableRow>
          <TableHead className="w-[120px]">Número</TableHead>
          <TableHead>Nome</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>Tipo</TableHead>
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

export function AppHomePage() {
  const processesQuery = useProcessesList({ page: 1, pageSize: HOME_PROCESS_PAGE_SIZE });
  const hasInvalidResponse = Boolean(
    processesQuery.data && !Array.isArray(processesQuery.data.items),
  );
  const hasProcessError = processesQuery.isError || hasInvalidResponse;
  const processes = hasInvalidResponse ? [] : (processesQuery.data?.items ?? []);

  return (
    <main aria-label="Área inicial do app" className="flex-1 overflow-auto p-6">
      <div className="mx-auto max-w-7xl space-y-8">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">Central de Trabalho</h1>
            <p className="text-muted-foreground">
              Gerencie seus processos de contratação e documentos
            </p>
          </div>
          <Button asChild size="lg">
            <Link to="/app/processo/novo">
              <Plus className="mr-2 h-4 w-4" />
              Novo Processo
            </Link>
          </Button>
        </div>

        <section>
          <h2 className="mb-4 text-lg font-medium">Ações Rápidas</h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {quickActions.map((action) => (
              <Link key={action.title} to={action.href} className="group">
                <Card className="h-full cursor-pointer bg-card py-0 transition-all hover:border-primary/30 hover:bg-accent/5 hover:shadow-md">
                  <CardContent className="p-6">
                    <div className="flex flex-col gap-4">
                      <div className="w-fit rounded-lg bg-primary/10 p-3 transition-colors group-hover:bg-primary/15">
                        <action.icon className={cn("h-6 w-6", action.color)} />
                      </div>
                      <div>
                        <h3 className="font-medium text-foreground transition-colors group-hover:text-primary">
                          {action.title}
                        </h3>
                        <p className="mt-1 text-muted-foreground text-sm">{action.description}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </section>

        <section>
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-medium">Continuar de onde parei</h2>
            <Button variant="ghost" size="sm" asChild>
              <Link to="/app/documentos">
                Ver todos
                <ArrowRight className="ml-1 h-4 w-4" />
              </Link>
            </Button>
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            {inProgressDocuments.map((doc) => (
              <Card key={doc.id} className="bg-card py-0 transition-shadow hover:shadow-sm">
                <CardContent className="p-4">
                  <div className="mb-3 flex items-start justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <div className="rounded-md bg-muted p-2">
                        <FileEdit className="h-4 w-4 text-muted-foreground" />
                      </div>
                      <Badge
                        variant="outline"
                        className={cn("font-medium", documentTypeConfig[doc.type]?.className)}
                      >
                        {doc.type}
                      </Badge>
                    </div>
                    <span className="whitespace-nowrap text-muted-foreground text-xs">
                      {doc.lastEdited}
                    </span>
                  </div>
                  <h3 className="mb-1 line-clamp-1 font-medium text-sm">{doc.name}</h3>
                  <p className="mb-3 text-muted-foreground text-xs">Processo: {doc.process}</p>
                  <div className="flex items-center justify-between">
                    <div className="flex flex-1 items-center gap-2">
                      <div
                        className="h-1.5 flex-1 overflow-hidden rounded-full bg-muted"
                        role="progressbar"
                        aria-label={`Progresso: ${doc.progress}%`}
                        aria-valuemax={100}
                        aria-valuemin={0}
                        aria-valuenow={doc.progress}
                      >
                        <div
                          className="h-full rounded-full bg-primary transition-all"
                          style={{ width: `${doc.progress}%` }}
                        />
                      </div>
                      <span className="text-muted-foreground text-xs">{doc.progress}%</span>
                    </div>
                    <Button variant="outline" size="sm" className="ml-4" asChild>
                      <Link to={`/app/documento/${doc.id}`}>Continuar</Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        <section>
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-medium">Processos de Contratação</h2>
            <Button variant="ghost" size="sm" asChild>
              <Link to="/app/processos">
                Ver todos
                <ArrowRight className="ml-1 h-4 w-4" />
              </Link>
            </Button>
          </div>
          <Card className="overflow-hidden py-0">
            {processesQuery.isLoading ? (
              <HomeProcessesTableSkeleton />
            ) : hasProcessError ? (
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
                    Crie um novo processo de contratação para começar.
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
                            <span className="block max-w-80 overflow-hidden text-ellipsis whitespace-nowrap">
                              {getProcessDisplayName(process)}
                            </span>
                          </Link>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className={cn("font-medium", status.className)}>
                            {status.label}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {getProcessTypeLabel(process.type)}
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
                            <span className="text-muted-foreground text-xs">
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
        </section>
      </div>
    </main>
  );
}

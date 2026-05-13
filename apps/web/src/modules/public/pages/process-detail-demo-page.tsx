import {
  AlertCircle,
  ArrowLeft,
  Building2,
  Calendar,
  Check,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  Clock,
  Edit3,
  Eye,
  FileCheck,
  FileQuestion,
  FileSearch,
  FileText,
  Hash,
  Layers3,
  Loader2,
  Package,
  Play,
  RefreshCw,
  Scale,
  User,
  XCircle,
} from "lucide-react";
import { useState } from "react";
import { Link } from "react-router-dom";
import { Badge } from "@/shared/ui/badge";
import { Button } from "@/shared/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/shared/ui/card";
import { Separator } from "@/shared/ui/separator";

// Types
type DocumentStatus = "ready" | "generating" | "error" | "generated";

interface ProcessItem {
  id: string;
  kind: "simple" | "kit";
  code: string;
  title: string;
  description: string;
  quantity: number;
  unit: string;
  unitValue: number;
  totalValue: number;
  components?: ProcessItemComponent[];
}

interface ProcessItemComponent {
  title: string;
  description: string;
  quantity: number;
  unit: string;
}

interface Department {
  id: string;
  name: string;
  code: string;
}

interface Document {
  id: string;
  acronym: string;
  name: string;
  description: string;
  status: DocumentStatus;
}

interface ProcessData {
  id: string;
  number: string;
  title: string;
  object: string;
  justification: string;
  status: string;
  contractingForm: string;
  biddingModality: string | null;
  responsible: string;
  externalId: string | null;
  organization: string;
  departments: Department[];
  items: ProcessItem[];
  documents: Document[];
  issueDate: string;
  createdAt: string;
  updatedAt: string;
}

// Mock Data
const mockProcess: ProcessData = {
  id: "proc-001",
  number: "PE-2024/0142",
  title: "Aquisição de equipamentos de TI",
  object:
    "Aquisição de equipamentos de informática para modernização da infraestrutura tecnológica das unidades administrativas, incluindo computadores, monitores e acessórios, visando a melhoria da eficiência operacional dos serviços públicos municipais.",
  justification:
    "A infraestrutura tecnológica atual encontra-se obsoleta, com equipamentos com mais de 8 anos de uso, comprometendo a produtividade dos servidores e a qualidade do atendimento à população. A modernização é essencial para garantir a continuidade e eficiência dos serviços públicos.",
  status: "em_andamento",
  contractingForm: "Licitação",
  biddingModality: "Pregão Eletrônico",
  responsible: "Maria Silva Santos",
  externalId: "PNCP-2024-001234",
  organization: "Prefeitura Municipal de São Paulo",
  departments: [
    { id: "dep-001", name: "Secretaria de Administração", code: "001.001" },
    { id: "dep-002", name: "Secretaria de Educação", code: "001.003" },
  ],
  items: [
    {
      id: "item-001",
      kind: "simple",
      code: "001",
      title: "Monitor LED 27 polegadas",
      description:
        "Monitor LED 27 polegadas, resolução mínima Full HD 1920x1080, conexões HDMI e DisplayPort, suporte VESA, ajuste de altura e inclinação.",
      quantity: 50,
      unit: "Unidade",
      unitValue: 1200.0,
      totalValue: 60000.0,
    },
    {
      id: "item-002",
      kind: "kit",
      code: "002",
      title: "Kit Estação de Trabalho Completa",
      description:
        "Conjunto completo para estação de trabalho, incluindo computador desktop, monitor e periféricos para uso administrativo.",
      quantity: 30,
      unit: "Kit",
      unitValue: 5500.0,
      totalValue: 165000.0,
      components: [
        {
          title: "Computador Desktop",
          description:
            "Processador mínimo Intel Core i5 12ª geração ou equivalente, 16GB RAM DDR4, SSD 512GB NVMe, placa de vídeo integrada.",
          quantity: 1,
          unit: "Unidade",
        },
        {
          title: "Monitor LED 24 polegadas",
          description: "Monitor LED 24 polegadas, Full HD, conexões HDMI e VGA.",
          quantity: 1,
          unit: "Unidade",
        },
        {
          title: "Teclado e Mouse",
          description: "Kit teclado ABNT2 e mouse óptico USB, ambos com fio.",
          quantity: 1,
          unit: "Conjunto",
        },
      ],
    },
    {
      id: "item-003",
      kind: "simple",
      code: "003",
      title: "Webcam Full HD",
      description:
        "Webcam com resolução Full HD 1080p, microfone integrado com cancelamento de ruído, clip ajustável para monitores, conexão USB.",
      quantity: 25,
      unit: "Unidade",
      unitValue: 350.0,
      totalValue: 8750.0,
    },
  ],
  documents: [
    {
      id: "doc-001",
      acronym: "DFD",
      name: "Documento de Formalização da Demanda",
      description:
        "Registra a necessidade de contratação e define os requisitos iniciais do processo.",
      status: "generated",
    },
    {
      id: "doc-002",
      acronym: "ETP",
      name: "Estudo Técnico Preliminar",
      description:
        "Analisa a viabilidade técnica, econômica e ambiental da contratação pretendida.",
      status: "generating",
    },
    {
      id: "doc-003",
      acronym: "TR",
      name: "Termo de Referência",
      description:
        "Especifica o objeto, condições e obrigações para a execução da contratação.",
      status: "ready",
    },
    {
      id: "doc-004",
      acronym: "Minuta",
      name: "Minuta do Contrato",
      description:
        "Estabelece as cláusulas contratuais que regerão a relação entre as partes.",
      status: "error",
    },
  ],
  issueDate: "15/11/2024",
  createdAt: "10/11/2024",
  updatedAt: "12/05/2025",
};

// Helpers
function formatCurrency(value: number): string {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);
}

function getStatusBadge(status: string) {
  const statusMap: Record<string, { label: string; className: string }> = {
    em_andamento: { label: "Em andamento", className: "bg-blue-50 text-blue-700 border-blue-200" },
    concluido: { label: "Concluído", className: "bg-emerald-50 text-emerald-700 border-emerald-200" },
    cancelado: { label: "Cancelado", className: "bg-red-50 text-red-700 border-red-200" },
    rascunho: { label: "Rascunho", className: "bg-slate-50 text-slate-600 border-slate-200" },
  };
  const config = statusMap[status] || { label: status, className: "bg-slate-50 text-slate-600 border-slate-200" };
  return <Badge variant="outline" className={config.className}>{config.label}</Badge>;
}

function getDocumentStatusConfig(status: DocumentStatus) {
  const config = {
    ready: {
      label: "Pronto para gerar",
      icon: FileQuestion,
      color: "text-muted-foreground",
      bgColor: "bg-muted/50",
      borderColor: "border-muted",
      badgeClassName: "bg-slate-50 text-slate-600 border-slate-200",
    },
    generating: {
      label: "Gerando...",
      icon: Loader2,
      color: "text-blue-600",
      bgColor: "bg-blue-50",
      borderColor: "border-blue-200",
      badgeClassName: "bg-blue-50 text-blue-700 border-blue-200",
    },
    error: {
      label: "Erro na geração",
      icon: XCircle,
      color: "text-red-600",
      bgColor: "bg-red-50",
      borderColor: "border-red-200",
      badgeClassName: "bg-red-50 text-red-700 border-red-200",
    },
    generated: {
      label: "Gerado",
      icon: CheckCircle2,
      color: "text-emerald-600",
      bgColor: "bg-emerald-50",
      borderColor: "border-emerald-200",
      badgeClassName: "bg-emerald-50 text-emerald-700 border-emerald-200",
    },
  };
  return config[status];
}

// Components
function ProcessHeader({ process }: { process: ProcessData }) {
  return (
    <div className="space-y-4">
      <Link
        to="/demo/processo/novo"
        className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        Voltar
      </Link>

      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-semibold tracking-tight">{process.title}</h1>
            {getStatusBadge(process.status)}
          </div>
          <div className="flex items-center gap-2 text-muted-foreground">
            <Hash className="h-4 w-4" />
            <span className="font-mono text-sm">{process.number}</span>
            {process.externalId && (
              <>
                <span className="text-muted-foreground/50">|</span>
                <span className="text-sm">ID Externo: {process.externalId}</span>
              </>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm">
            <Edit3 className="mr-2 h-4 w-4" />
            Editar Processo
          </Button>
        </div>
      </div>
    </div>
  );
}

function ExecutiveSummary({ process }: { process: ProcessData }) {
  const totalItems = process.items.length;
  const totalComponents = process.items.reduce(
    (acc, item) => acc + (item.components?.length || 0),
    0
  );
  const totalValue = process.items.reduce((acc, item) => acc + item.totalValue, 0);

  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
      <Card className="bg-gradient-to-br from-background to-muted/30">
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
              <Package className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-2xl font-semibold">{totalItems}</p>
              <p className="text-xs text-muted-foreground">Itens</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-gradient-to-br from-background to-muted/30">
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
              <Layers3 className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-2xl font-semibold">{totalComponents}</p>
              <p className="text-xs text-muted-foreground">Componentes</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-gradient-to-br from-background to-muted/30 sm:col-span-2">
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-100">
              <Scale className="h-5 w-5 text-emerald-600" />
            </div>
            <div>
              <p className="text-2xl font-semibold">{formatCurrency(totalValue)}</p>
              <p className="text-xs text-muted-foreground">Valor total estimado</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function ProcessInfo({ process }: { process: ProcessData }) {
  return (
    <Card>
      <CardHeader className="pb-4">
        <CardTitle className="text-base font-semibold">Informações do Processo</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Basic Info Grid */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="space-y-1">
            <p className="text-xs font-medium text-muted-foreground">Forma de contratação</p>
            <p className="text-sm font-medium">{process.contractingForm}</p>
          </div>
          {process.biddingModality && (
            <div className="space-y-1">
              <p className="text-xs font-medium text-muted-foreground">Modalidade</p>
              <p className="text-sm font-medium">{process.biddingModality}</p>
            </div>
          )}
          <div className="space-y-1">
            <p className="text-xs font-medium text-muted-foreground">Responsável</p>
            <div className="flex items-center gap-2">
              <User className="h-4 w-4 text-muted-foreground" />
              <p className="text-sm font-medium">{process.responsible}</p>
            </div>
          </div>
          <div className="space-y-1">
            <p className="text-xs font-medium text-muted-foreground">Data de emissão</p>
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <p className="text-sm font-medium">{process.issueDate}</p>
            </div>
          </div>
        </div>

        <Separator />

        {/* Object */}
        <div className="space-y-2">
          <p className="text-xs font-medium text-muted-foreground">Objeto da contratação</p>
          <p className="text-sm leading-relaxed text-foreground/90">{process.object}</p>
        </div>

        {/* Justification */}
        <div className="space-y-2">
          <p className="text-xs font-medium text-muted-foreground">Justificativa</p>
          <p className="text-sm leading-relaxed text-foreground/90">{process.justification}</p>
        </div>
      </CardContent>
    </Card>
  );
}

function InstitutionalContext({ process }: { process: ProcessData }) {
  return (
    <Card>
      <CardHeader className="pb-4">
        <CardTitle className="text-base font-semibold">Contexto Institucional</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-start gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10">
            <Building2 className="h-4 w-4 text-primary" />
          </div>
          <div>
            <p className="text-sm font-medium">{process.organization}</p>
            <p className="text-xs text-muted-foreground">Órgão responsável</p>
          </div>
        </div>

        <Separator />

        <div className="space-y-3">
          <p className="text-xs font-medium text-muted-foreground">
            Unidades vinculadas ({process.departments.length})
          </p>
          <div className="grid gap-2 sm:grid-cols-2">
            {process.departments.map((dept) => (
              <div
                key={dept.id}
                className="flex items-center gap-3 rounded-lg border bg-muted/30 p-3"
              >
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-background">
                  <Building2 className="h-4 w-4 text-muted-foreground" />
                </div>
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">{dept.name}</p>
                  <p className="text-xs text-muted-foreground">Código: {dept.code}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function ProcessItems({ items }: { items: ProcessItem[] }) {
  const [expandedKits, setExpandedKits] = useState<string[]>([]);

  const toggleKit = (id: string) => {
    setExpandedKits((prev) =>
      prev.includes(id) ? prev.filter((k) => k !== id) : [...prev, id]
    );
  };

  return (
    <Card>
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base font-semibold">Itens do Processo</CardTitle>
          <Badge variant="secondary">{items.length} itens</Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {items.map((item) => (
          <div
            key={item.id}
            className="rounded-lg border bg-card transition-colors hover:bg-muted/30"
          >
            <div className="p-4">
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-3">
                  <div
                    className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${
                      item.kind === "kit"
                        ? "bg-amber-100 text-amber-600"
                        : "bg-primary/10 text-primary"
                    }`}
                  >
                    {item.kind === "kit" ? (
                      <Layers3 className="h-4 w-4" />
                    ) : (
                      <Package className="h-4 w-4" />
                    )}
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs text-muted-foreground">
                        #{item.code}
                      </span>
                      {item.kind === "kit" && (
                        <Badge variant="outline" className="text-xs">
                          Kit
                        </Badge>
                      )}
                    </div>
                    <p className="font-medium">{item.title}</p>
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {item.description}
                    </p>
                  </div>
                </div>

                <div className="text-right shrink-0">
                  <p className="font-semibold">{formatCurrency(item.totalValue)}</p>
                  <p className="text-xs text-muted-foreground">
                    {item.quantity} {item.unit} x {formatCurrency(item.unitValue)}
                  </p>
                </div>
              </div>

              {item.kind === "kit" && item.components && item.components.length > 0 && (
                <button
                  onClick={() => toggleKit(item.id)}
                  className="mt-3 flex w-full items-center justify-center gap-1 rounded-md border border-dashed py-2 text-xs text-muted-foreground transition-colors hover:bg-muted/50 hover:text-foreground"
                >
                  {expandedKits.includes(item.id) ? (
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
              )}
            </div>

            {item.kind === "kit" &&
              item.components &&
              expandedKits.includes(item.id) && (
                <div className="border-t bg-muted/20 px-4 py-3">
                  <div className="space-y-2">
                    {item.components.map((comp, idx) => (
                      <div
                        key={idx}
                        className="flex items-start justify-between gap-4 rounded-md bg-background p-3"
                      >
                        <div className="space-y-0.5">
                          <p className="text-sm font-medium">{comp.title}</p>
                          <p className="text-xs text-muted-foreground line-clamp-1">
                            {comp.description}
                          </p>
                        </div>
                        <p className="shrink-0 text-xs text-muted-foreground">
                          {comp.quantity} {comp.unit}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

function DocumentCard({ document }: { document: Document }) {
  const config = getDocumentStatusConfig(document.status);
  const StatusIcon = config.icon;

  return (
    <Card className={`group relative overflow-hidden transition-all hover:shadow-md border-2 ${config.borderColor}`}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className={`flex h-12 w-12 items-center justify-center rounded-xl ${config.bgColor}`}>
            {document.status === "generating" ? (
              <Loader2 className={`h-6 w-6 ${config.color} animate-spin`} />
            ) : document.status === "generated" ? (
              <FileCheck className={`h-6 w-6 ${config.color}`} />
            ) : document.status === "error" ? (
              <AlertCircle className={`h-6 w-6 ${config.color}`} />
            ) : (
              <FileText className={`h-6 w-6 ${config.color}`} />
            )}
          </div>
          <Badge variant="outline" className={`text-xs ${config.badgeClassName}`}>
            {config.label}
          </Badge>
        </div>
        <div className="space-y-1 pt-2">
          <CardTitle className="text-xl font-bold">{document.acronym}</CardTitle>
          <CardDescription className="text-sm font-medium text-foreground/80">
            {document.name}
          </CardDescription>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        <p className="text-sm text-muted-foreground leading-relaxed">
          {document.description}
        </p>

        <div className="flex flex-wrap gap-2">
          <Button
            size="sm"
            variant={document.status === "generated" ? "outline" : "default"}
            className="flex-1"
          >
            {document.status === "generating" ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Gerando...
              </>
            ) : document.status === "generated" ? (
              <>
                <RefreshCw className="mr-2 h-4 w-4" />
                Regerar
              </>
            ) : (
              <>
                <Play className="mr-2 h-4 w-4" />
                Gerar
              </>
            )}
          </Button>

          {document.status === "generated" && (
            <>
              <Button size="sm" variant="outline">
                <Eye className="mr-2 h-4 w-4" />
                Ver
              </Button>
              <Button size="sm" variant="outline">
                <Edit3 className="mr-2 h-4 w-4" />
                Editar
              </Button>
            </>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

function DocumentActions({ documents }: { documents: Document[] }) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">Central de Documentos</h2>
          <p className="text-sm text-muted-foreground">
            Gere e gerencie os documentos do processo
          </p>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {documents.map((doc) => (
          <DocumentCard key={doc.id} document={doc} />
        ))}
      </div>
    </div>
  );
}

function ControlDates({ process }: { process: ProcessData }) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base font-semibold">Datas de Controle</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid gap-4 sm:grid-cols-3">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-muted">
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </div>
            <div>
              <p className="text-sm font-medium">{process.issueDate}</p>
              <p className="text-xs text-muted-foreground">Data de emissão</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-muted">
              <Clock className="h-4 w-4 text-muted-foreground" />
            </div>
            <div>
              <p className="text-sm font-medium">{process.createdAt}</p>
              <p className="text-xs text-muted-foreground">Criado em</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-muted">
              <RefreshCw className="h-4 w-4 text-muted-foreground" />
            </div>
            <div>
              <p className="text-sm font-medium">{process.updatedAt}</p>
              <p className="text-xs text-muted-foreground">Última atualização</p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// Main Component
export function ProcessDetailDemoPage() {
  const process = mockProcess;

  return (
    <main className="container mx-auto max-w-6xl px-4 py-6 md:py-8">
      <div className="space-y-6">
        {/* Header */}
        <ProcessHeader process={process} />

        {/* Executive Summary */}
        <ExecutiveSummary process={process} />

        {/* Main Content Grid */}
        <div className="grid gap-6 lg:grid-cols-[1fr_380px]">
          {/* Left Column */}
          <div className="space-y-6">
            <ProcessInfo process={process} />
            <ProcessItems items={process.items} />
          </div>

          {/* Right Column */}
          <div className="space-y-6">
            <InstitutionalContext process={process} />
            <ControlDates process={process} />
          </div>
        </div>

        {/* Document Actions - Full Width */}
        <DocumentActions documents={process.documents} />
      </div>
    </main>
  );
}

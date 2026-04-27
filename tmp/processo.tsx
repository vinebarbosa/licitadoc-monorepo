import { useParams, Link } from 'react-router'
import { AppHeader } from '@/components/app-header'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import {
  ClipboardList,
  FileSearch,
  ScrollText,
  Scale,
  Plus,
  Eye,
  Pencil,
  Copy,
  CheckCircle2,
  Clock,
  AlertTriangle,
  MoreHorizontal
} from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { cn } from '@/lib/utils'

// Mock data do processo
const processData = {
  id: 'PE-2024-045',
  name: 'Contratação de Serviços de TI',
  status: 'em_edicao' as const,
  type: 'Pregão Eletrônico',
  created: '15 Mar 2024',
  lastUpdate: '28 Mar 2024',
  responsible: 'Maria Costa',
  department: 'Departamento de Tecnologia',
  estimatedValue: 'R$ 450.000,00',
  description: 'Contratação de empresa especializada para prestação de serviços de tecnologia da informação, incluindo suporte técnico, desenvolvimento de sistemas e gestão de infraestrutura.'
}

type DocumentStatus = 'concluido' | 'em_edicao' | 'pendente' | 'erro'

interface Document {
  type: 'DFD' | 'ETP' | 'TR' | 'Minuta'
  title: string
  description: string
  status: DocumentStatus
  icon: React.ElementType
  lastUpdate?: string
  progress?: number
}

const documents: Document[] = [
  {
    type: 'DFD',
    title: 'Documento de Formalização de Demanda',
    description: 'Justificativa da necessidade de contratação',
    status: 'concluido',
    icon: ClipboardList,
    lastUpdate: '20 Mar 2024'
  },
  {
    type: 'ETP',
    title: 'Estudo Técnico Preliminar',
    description: 'Análise técnica e levantamento de soluções',
    status: 'em_edicao',
    icon: FileSearch,
    lastUpdate: '28 Mar 2024',
    progress: 75
  },
  {
    type: 'TR',
    title: 'Termo de Referência',
    description: 'Especificações técnicas e requisitos',
    status: 'pendente',
    icon: ScrollText
  },
  {
    type: 'Minuta',
    title: 'Minuta do Contrato',
    description: 'Cláusulas e condições contratuais',
    status: 'pendente',
    icon: Scale
  }
]

type ProcessStatus = 'finalizado' | 'em_edicao' | 'em_revisao' | 'erro'

const processStatusConfig: Record<ProcessStatus, { label: string; className: string }> = {
  finalizado: {
    label: 'Finalizado',
    className: 'bg-success/15 text-success border-success/30'
  },
  em_edicao: {
    label: 'Em edição',
    className: 'bg-pending/15 text-pending border-pending/30'
  },
  em_revisao: {
    label: 'Em revisão',
    className: 'bg-warning/15 text-warning-foreground border-warning/30'
  },
  erro: {
    label: 'Erro',
    className: 'bg-critical/15 text-critical border-critical/30'
  }
}

const documentStatusConfig: Record<DocumentStatus, { 
  label: string
  className: string
  icon: React.ElementType 
}> = {
  concluido: {
    label: 'Concluído',
    className: 'bg-success/15 text-success border-success/30',
    icon: CheckCircle2
  },
  em_edicao: {
    label: 'Em edição',
    className: 'bg-pending/15 text-pending border-pending/30',
    icon: Clock
  },
  pendente: {
    label: 'Pendente',
    className: 'bg-muted text-muted-foreground border-muted',
    icon: Clock
  },
  erro: {
    label: 'Erro',
    className: 'bg-critical/15 text-critical border-critical/30',
    icon: AlertTriangle
  }
}

export default function ProcessoPage() {
  const { id } = useParams()

  return (
    <div className="flex flex-col h-full">
      <AppHeader 
        breadcrumbs={[
          { label: 'Central de Trabalho', href: '/app' },
          { label: 'Processos', href: '/app/processos' },
          { label: processData.id }
        ]} 
      />
      
      <main className="flex-1 overflow-auto p-6">
        <div className="max-w-7xl mx-auto space-y-6">
          {/* Header do Processo */}
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div className="space-y-2">
              <div className="flex items-center gap-3">
                <h1 className="text-2xl font-semibold tracking-tight">
                  {processData.name}
                </h1>
                <Badge 
                  variant="outline" 
                  className={cn(
                    'font-medium',
                    processStatusConfig[processData.status].className
                  )}
                >
                  {processStatusConfig[processData.status].label}
                </Badge>
              </div>
              <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                <span className="font-mono">{processData.id}</span>
                <Separator orientation="vertical" className="h-4" />
                <span>{processData.type}</span>
                <Separator orientation="vertical" className="h-4" />
                <span>{processData.department}</span>
              </div>
            </div>
            <div className="flex gap-2">
              <Button variant="outline">
                <Eye className="mr-2 h-4 w-4" />
                Visualizar
              </Button>
              <Button variant="outline">
                <Pencil className="mr-2 h-4 w-4" />
                Editar
              </Button>
            </div>
          </div>

          {/* Informações do Processo */}
          <Card>
            <CardContent className="p-6">
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
                <div>
                  <p className="text-sm text-muted-foreground">Responsável</p>
                  <p className="font-medium">{processData.responsible}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Valor Estimado</p>
                  <p className="font-medium">{processData.estimatedValue}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Criado em</p>
                  <p className="font-medium">{processData.created}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Última Atualização</p>
                  <p className="font-medium">{processData.lastUpdate}</p>
                </div>
              </div>
              {processData.description && (
                <>
                  <Separator className="my-4" />
                  <div>
                    <p className="text-sm text-muted-foreground mb-2">Descrição</p>
                    <p className="text-sm leading-relaxed">{processData.description}</p>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* Grid de Documentos */}
          <div>
            <h2 className="text-lg font-medium mb-4">Documentos do Processo</h2>
            <div className="grid gap-4 md:grid-cols-2">
              {documents.map((doc) => {
                const StatusIcon = documentStatusConfig[doc.status].icon
                
                return (
                  <Card 
                    key={doc.type}
                    className={cn(
                      'relative group transition-all hover:shadow-md hover:border-primary/30',
                      doc.status === 'em_edicao' && 'border-primary/20'
                    )}
                  >
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                          <div className={cn(
                            'p-2.5 rounded-lg',
                            doc.status === 'concluido' && 'bg-success/10',
                            doc.status === 'em_edicao' && 'bg-primary/10',
                            doc.status === 'pendente' && 'bg-muted',
                            doc.status === 'erro' && 'bg-critical/10'
                          )}>
                            <doc.icon className={cn(
                              'h-5 w-5',
                              doc.status === 'concluido' && 'text-success',
                              doc.status === 'em_edicao' && 'text-primary',
                              doc.status === 'pendente' && 'text-muted-foreground',
                              doc.status === 'erro' && 'text-critical'
                            )} />
                          </div>
                          <div>
                            <CardTitle className="text-base">{doc.type}</CardTitle>
                            <CardDescription className="text-xs">
                              {doc.title}
                            </CardDescription>
                          </div>
                        </div>
                        <Badge 
                          variant="outline" 
                          className={cn(
                            'font-medium text-xs',
                            documentStatusConfig[doc.status].className
                          )}
                        >
                          <StatusIcon className="h-3 w-3 mr-1" />
                          {documentStatusConfig[doc.status].label}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-muted-foreground mb-4">
                        {doc.description}
                      </p>
                      
                      {doc.progress !== undefined && (
                        <div className="mb-4">
                          <div className="flex items-center justify-between text-xs mb-1">
                            <span className="text-muted-foreground">Progresso</span>
                            <span className="font-medium">{doc.progress}%</span>
                          </div>
                          <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                            <div 
                              className="h-full bg-primary rounded-full transition-all"
                              style={{ width: `${doc.progress}%` }}
                            />
                          </div>
                        </div>
                      )}
                      
                      {doc.lastUpdate && (
                        <p className="text-xs text-muted-foreground mb-4">
                          Última atualização: {doc.lastUpdate}
                        </p>
                      )}
                      
                      <div className="flex items-center gap-2">
                        {doc.status === 'pendente' ? (
                          <Button size="sm" asChild>
                            <Link to={`/app/documento/novo?tipo=${doc.type.toLowerCase()}&processo=${processData.id}`}>
                              <Plus className="h-4 w-4 mr-1" />
                              Criar
                            </Link>
                          </Button>
                        ) : (
                          <>
                            <Button size="sm" variant="outline" asChild>
                              <Link to={`/app/documento/${doc.type.toLowerCase()}-${processData.id}`}>
                                <Pencil className="h-4 w-4 mr-1" />
                                Editar
                              </Link>
                            </Button>
                            <Button size="sm" variant="outline" asChild>
                              <Link to={`/app/documento/${doc.type.toLowerCase()}-${processData.id}/preview`}>
                                <Eye className="h-4 w-4 mr-1" />
                                Visualizar
                              </Link>
                            </Button>
                          </>
                        )}
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button size="sm" variant="ghost">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem>
                              <Copy className="h-4 w-4 mr-2" />
                              Duplicar
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}

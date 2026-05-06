import { Link } from 'react-router'
import { AppHeader } from '@/components/app-header'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { 
  FileEdit,
  ArrowRight,
  Plus,
  ClipboardList,
  FileSearch,
  ScrollText,
  Scale,
} from 'lucide-react'
import { cn } from '@/lib/utils'

// Tipos de documentos da Lei 14.133
const quickActions = [
  {
    title: 'Criar DFD',
    description: 'Documento de Formalização de Demanda',
    icon: ClipboardList,
    href: '/app/documento/novo?tipo=dfd',
    color: 'text-primary'
  },
  {
    title: 'Criar ETP',
    description: 'Estudo Técnico Preliminar',
    icon: FileSearch,
    href: '/app/documento/novo?tipo=etp',
    color: 'text-primary'
  },
  {
    title: 'Criar TR',
    description: 'Termo de Referência',
    icon: ScrollText,
    href: '/app/documento/novo?tipo=tr',
    color: 'text-primary'
  },
  {
    title: 'Criar Minuta',
    description: 'Minuta do Contrato',
    icon: Scale,
    href: '/app/documento/novo?tipo=minuta',
    color: 'text-primary'
  }
]

// Documentos em andamento
const inProgressDocuments = [
  {
    id: 'DOC-2024-0089',
    name: 'ETP - Serviços de TI',
    type: 'ETP',
    process: 'PE 045/2024',
    lastEdited: 'há 2 horas',
    progress: 75
  },
  {
    id: 'DOC-2024-0088',
    name: 'TR - Material de Escritório',
    type: 'TR',
    process: 'PE 044/2024',
    lastEdited: 'há 1 dia',
    progress: 40
  },
  {
    id: 'DOC-2024-0085',
    name: 'DFD - Equipamentos de Informática',
    type: 'DFD',
    process: 'PE 043/2024',
    lastEdited: 'há 3 dias',
    progress: 90
  }
]

// Processos de contratação
const processes = [
  {
    id: 'PE-2024-045',
    name: 'Contratação de Serviços de TI',
    status: 'em_edicao' as const,
    type: 'Pregão Eletrônico',
    lastUpdate: '28 Mar 2024',
    documentsCount: { total: 4, completed: 2 }
  },
  {
    id: 'PE-2024-044',
    name: 'Aquisição de Material de Escritório',
    status: 'em_revisao' as const,
    type: 'Pregão Eletrônico',
    lastUpdate: '27 Mar 2024',
    documentsCount: { total: 4, completed: 3 }
  },
  {
    id: 'PE-2024-043',
    name: 'Equipamentos de Informática',
    status: 'finalizado' as const,
    type: 'Pregão Eletrônico',
    lastUpdate: '25 Mar 2024',
    documentsCount: { total: 4, completed: 4 }
  },
  {
    id: 'CC-2024-012',
    name: 'Obra de Reforma do Prédio Sede',
    status: 'erro' as const,
    type: 'Concorrência',
    lastUpdate: '24 Mar 2024',
    documentsCount: { total: 4, completed: 1 }
  },
  {
    id: 'PE-2024-042',
    name: 'Serviços de Limpeza e Conservação',
    status: 'finalizado' as const,
    type: 'Pregão Eletrônico',
    lastUpdate: '22 Mar 2024',
    documentsCount: { total: 4, completed: 4 }
  }
]

type ProcessStatus = 'finalizado' | 'em_edicao' | 'em_revisao' | 'erro'

const statusConfig: Record<ProcessStatus, { label: string; className: string }> = {
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

const typeConfig: Record<string, { className: string }> = {
  DFD: { className: 'bg-chart-1/15 text-chart-1 border-chart-1/30' },
  ETP: { className: 'bg-chart-2/15 text-chart-2 border-chart-2/30' },
  TR: { className: 'bg-chart-3/15 text-chart-3 border-chart-3/30' },
  Minuta: { className: 'bg-chart-5/15 text-chart-5 border-chart-5/30' }
}

export default function DashboardPage() {
  return (
    <div className="flex flex-col h-full">
      <AppHeader 
        breadcrumbs={[{ label: 'Central de Trabalho' }]} 
      />
      
      <main className="flex-1 overflow-auto p-6">
        <div className="max-w-7xl mx-auto space-y-8">
          {/* Header com Botão Novo Processo */}
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <h1 className="text-2xl font-semibold tracking-tight">
                Central de Trabalho
              </h1>
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

          {/* Ações Rápidas */}
          <section>
            <h2 className="text-lg font-medium mb-4">Ações Rápidas</h2>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {quickActions.map((action) => (
                <Link key={action.title} to={action.href}>
                  <Card className="h-full bg-card hover:bg-accent/5 hover:shadow-md hover:border-primary/30 transition-all cursor-pointer group">
                    <CardContent className="p-6">
                      <div className="flex flex-col gap-4">
                        <div className="p-3 rounded-lg bg-primary/10 w-fit group-hover:bg-primary/15 transition-colors">
                          <action.icon className={cn('h-6 w-6', action.color)} />
                        </div>
                        <div>
                          <h3 className="font-medium text-foreground group-hover:text-primary transition-colors">
                            {action.title}
                          </h3>
                          <p className="text-sm text-muted-foreground mt-1">
                            {action.description}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          </section>

          {/* Continuar de onde parei */}
          <section>
            <div className="flex items-center justify-between mb-4">
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
                <Card key={doc.id} className="bg-card hover:shadow-sm transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-3 mb-3">
                      <div className="flex items-center gap-2">
                        <div className="p-2 rounded-md bg-muted">
                          <FileEdit className="h-4 w-4 text-muted-foreground" />
                        </div>
                        <Badge 
                          variant="outline" 
                          className={cn(
                            'font-medium',
                            typeConfig[doc.type]?.className
                          )}
                        >
                          {doc.type}
                        </Badge>
                      </div>
                      <span className="text-xs text-muted-foreground whitespace-nowrap">
                        {doc.lastEdited}
                      </span>
                    </div>
                    <h4 className="font-medium text-sm mb-1 line-clamp-1">{doc.name}</h4>
                    <p className="text-xs text-muted-foreground mb-3">
                      Processo: {doc.process}
                    </p>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 flex-1">
                        <div className="h-1.5 flex-1 bg-muted rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-primary rounded-full transition-all"
                            style={{ width: `${doc.progress}%` }}
                          />
                        </div>
                        <span className="text-xs text-muted-foreground">{doc.progress}%</span>
                      </div>
                      <Button variant="outline" size="sm" className="ml-4" asChild>
                        <Link to={`/app/documento/${doc.id}`}>
                          Continuar
                        </Link>
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </section>

          {/* Processos de Contratação */}
          <section>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-medium">Processos de Contratação</h2>
              <Button variant="ghost" size="sm" asChild>
                <Link to="/app/processos">
                  Ver todos
                  <ArrowRight className="ml-1 h-4 w-4" />
                </Link>
              </Button>
            </div>
            <Card>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[100px]">Número</TableHead>
                    <TableHead>Nome</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Documentos</TableHead>
                    <TableHead className="text-right">Última Atualização</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {processes.map((process) => (
                    <TableRow key={process.id} className="cursor-pointer hover:bg-accent/50">
                      <TableCell className="font-mono text-sm">
                        <Link to={`/app/processo/${process.id}`} className="hover:text-primary">
                          {process.id}
                        </Link>
                      </TableCell>
                      <TableCell>
                        <Link to={`/app/processo/${process.id}`} className="hover:text-primary font-medium">
                          {process.name}
                        </Link>
                      </TableCell>
                      <TableCell>
                        <Badge 
                          variant="outline" 
                          className={cn(
                            'font-medium',
                            statusConfig[process.status].className
                          )}
                        >
                          {statusConfig[process.status].label}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {process.type}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div className="flex gap-0.5">
                            {[...Array(process.documentsCount.total)].map((_, i) => (
                              <div 
                                key={i}
                                className={cn(
                                  'w-2 h-2 rounded-full',
                                  i < process.documentsCount.completed 
                                    ? 'bg-success' 
                                    : 'bg-muted'
                                )}
                              />
                            ))}
                          </div>
                          <span className="text-xs text-muted-foreground">
                            {process.documentsCount.completed}/{process.documentsCount.total}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="text-right text-muted-foreground">
                        {process.lastUpdate}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Card>
          </section>
        </div>
      </main>
    </div>
  )
}

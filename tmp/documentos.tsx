import * as React from 'react'
import { Link } from 'react-router'
import { AppHeader } from '@/components/app-header'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { 
  Plus, 
  Search, 
  ClipboardList, 
  FileSearch, 
  ScrollText, 
  Scale,
  MoreHorizontal,
  Pencil,
  Eye,
  Copy,
  Trash2,
  FolderOpen,
  CheckCircle2,
  Clock,
  AlertTriangle
} from 'lucide-react'
import { cn } from '@/lib/utils'

type DocumentType = 'DFD' | 'ETP' | 'TR' | 'Minuta'
type DocumentStatus = 'concluido' | 'em_edicao' | 'pendente' | 'erro'

interface Document {
  id: string
  name: string
  type: DocumentType
  process: string
  processName: string
  status: DocumentStatus
  lastUpdate: string
  responsible: string
}

// Mock data
const documents: Document[] = [
  {
    id: 'DOC-2024-0089',
    name: 'ETP - Serviços de TI',
    type: 'ETP',
    process: 'PE-2024-045',
    processName: 'Contratação de Serviços de TI',
    status: 'em_edicao',
    lastUpdate: '28 Mar 2024',
    responsible: 'Maria Costa'
  },
  {
    id: 'DOC-2024-0088',
    name: 'DFD - Serviços de TI',
    type: 'DFD',
    process: 'PE-2024-045',
    processName: 'Contratação de Serviços de TI',
    status: 'concluido',
    lastUpdate: '20 Mar 2024',
    responsible: 'Maria Costa'
  },
  {
    id: 'DOC-2024-0087',
    name: 'TR - Material de Escritório',
    type: 'TR',
    process: 'PE-2024-044',
    processName: 'Aquisição de Material de Escritório',
    status: 'em_edicao',
    lastUpdate: '27 Mar 2024',
    responsible: 'João Silva'
  },
  {
    id: 'DOC-2024-0086',
    name: 'ETP - Material de Escritório',
    type: 'ETP',
    process: 'PE-2024-044',
    processName: 'Aquisição de Material de Escritório',
    status: 'concluido',
    lastUpdate: '25 Mar 2024',
    responsible: 'João Silva'
  },
  {
    id: 'DOC-2024-0085',
    name: 'DFD - Equipamentos de Informática',
    type: 'DFD',
    process: 'PE-2024-043',
    processName: 'Equipamentos de Informática',
    status: 'concluido',
    lastUpdate: '22 Mar 2024',
    responsible: 'Maria Costa'
  },
  {
    id: 'DOC-2024-0084',
    name: 'Minuta - Equipamentos de Informática',
    type: 'Minuta',
    process: 'PE-2024-043',
    processName: 'Equipamentos de Informática',
    status: 'concluido',
    lastUpdate: '24 Mar 2024',
    responsible: 'Ana Santos'
  },
  {
    id: 'DOC-2024-0083',
    name: 'TR - Equipamentos de Informática',
    type: 'TR',
    process: 'PE-2024-043',
    processName: 'Equipamentos de Informática',
    status: 'concluido',
    lastUpdate: '23 Mar 2024',
    responsible: 'Maria Costa'
  },
  {
    id: 'DOC-2024-0082',
    name: 'DFD - Reforma do Prédio',
    type: 'DFD',
    process: 'CC-2024-012',
    processName: 'Obra de Reforma do Prédio Sede',
    status: 'erro',
    lastUpdate: '24 Mar 2024',
    responsible: 'Carlos Oliveira'
  }
]

const typeConfig: Record<DocumentType, { 
  icon: React.ElementType
  className: string
  label: string
}> = {
  DFD: { 
    icon: ClipboardList, 
    className: 'bg-chart-1/15 text-chart-1 border-chart-1/30',
    label: 'Formalização de Demanda'
  },
  ETP: { 
    icon: FileSearch, 
    className: 'bg-chart-2/15 text-chart-2 border-chart-2/30',
    label: 'Estudo Técnico Preliminar'
  },
  TR: { 
    icon: ScrollText, 
    className: 'bg-chart-3/15 text-chart-3 border-chart-3/30',
    label: 'Termo de Referência'
  },
  Minuta: { 
    icon: Scale, 
    className: 'bg-chart-5/15 text-chart-5 border-chart-5/30',
    label: 'Minuta do Contrato'
  }
}

const statusConfig: Record<DocumentStatus, { 
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

const documentStats = {
  total: 47,
  concluido: 38,
  em_edicao: 6,
  erro: 3
}

export default function DocumentosPage() {
  const [searchQuery, setSearchQuery] = React.useState('')
  const [statusFilter, setStatusFilter] = React.useState<string>('todos')
  const [typeFilter, setTypeFilter] = React.useState<string>('todos')

  const filteredDocuments = documents.filter(doc => {
    const matchesSearch = doc.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      doc.process.toLowerCase().includes(searchQuery.toLowerCase()) ||
      doc.processName.toLowerCase().includes(searchQuery.toLowerCase())
    
    const matchesStatus = statusFilter === 'todos' || doc.status === statusFilter
    const matchesType = typeFilter === 'todos' || doc.type === typeFilter
    
    return matchesSearch && matchesStatus && matchesType
  })

  return (
    <div className="flex flex-col h-full">
      <AppHeader 
        breadcrumbs={[
          { label: 'Central de Trabalho', href: '/app' },
          { label: 'Documentos' }
        ]} 
      />
      
      <main className="flex-1 overflow-auto p-6">
        <div className="max-w-7xl mx-auto space-y-6">
          {/* Header */}
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <h1 className="text-2xl font-semibold tracking-tight">
                Documentos
              </h1>
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
                  <div className="p-2 rounded-lg bg-muted">
                    <FolderOpen className="h-5 w-5 text-muted-foreground" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{documentStats.total}</p>
                    <p className="text-xs text-muted-foreground">Total</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-success/20">
                    <CheckCircle2 className="h-5 w-5 text-success" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{documentStats.concluido}</p>
                    <p className="text-xs text-muted-foreground">Concluídos</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-pending/20">
                    <Clock className="h-5 w-5 text-pending" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{documentStats.em_edicao}</p>
                    <p className="text-xs text-muted-foreground">Em edição</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-critical/20">
                    <AlertTriangle className="h-5 w-5 text-critical" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{documentStats.erro}</p>
                    <p className="text-xs text-muted-foreground">Com erro</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Filters */}
          <div className="flex flex-col gap-4 md:flex-row md:items-center">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
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
                  <SelectItem value="DFD">DFD</SelectItem>
                  <SelectItem value="ETP">ETP</SelectItem>
                  <SelectItem value="TR">TR</SelectItem>
                  <SelectItem value="Minuta">Minuta</SelectItem>
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
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[120px]">ID</TableHead>
                  <TableHead>Nome</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Processo</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Responsável</TableHead>
                  <TableHead className="text-right">Última Atualização</TableHead>
                  <TableHead className="w-[50px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredDocuments.map((doc) => {
                  const TypeIcon = typeConfig[doc.type].icon
                  const StatusIcon = statusConfig[doc.status].icon
                  
                  return (
                    <TableRow key={doc.id} className="cursor-pointer hover:bg-accent/50">
                      <TableCell className="font-mono text-sm">
                        {doc.id}
                      </TableCell>
                      <TableCell>
                        <Link to={`/app/documento/${doc.id}`} className="hover:text-primary font-medium">
                          {doc.name}
                        </Link>
                      </TableCell>
                      <TableCell>
                        <Badge 
                          variant="outline" 
                          className={cn(
                            'font-medium',
                            typeConfig[doc.type].className
                          )}
                        >
                          <TypeIcon className="h-3 w-3 mr-1" />
                          {doc.type}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Link to={`/app/processo/${doc.process}`} className="hover:text-primary text-sm">
                          {doc.process}
                        </Link>
                      </TableCell>
                      <TableCell>
                        <Badge 
                          variant="outline" 
                          className={cn(
                            'font-medium',
                            statusConfig[doc.status].className
                          )}
                        >
                          <StatusIcon className="h-3 w-3 mr-1" />
                          {statusConfig[doc.status].label}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {doc.responsible}
                      </TableCell>
                      <TableCell className="text-right text-muted-foreground">
                        {doc.lastUpdate}
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem asChild>
                              <Link to={`/app/documento/${doc.id}`}>
                                <Pencil className="h-4 w-4 mr-2" />
                                Editar
                              </Link>
                            </DropdownMenuItem>
                            <DropdownMenuItem asChild>
                              <Link to={`/app/documento/${doc.id}/preview`}>
                                <Eye className="h-4 w-4 mr-2" />
                                Visualizar
                              </Link>
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                              <Copy className="h-4 w-4 mr-2" />
                              Duplicar
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem className="text-critical">
                              <Trash2 className="h-4 w-4 mr-2" />
                              Excluir
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </Card>

          {/* Pagination info */}
          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <p>Mostrando {filteredDocuments.length} de {documents.length} documentos</p>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" disabled>Anterior</Button>
              <Button variant="outline" size="sm" disabled>Próximo</Button>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}

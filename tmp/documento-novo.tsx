import { useState } from 'react'
import { useNavigate, useSearchParams, Link } from 'react-router'
import { AppHeader } from '@/components/app-header'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  ArrowLeft,
  ArrowRight,
  ClipboardList,
  FileSearch,
  ScrollText,
  Scale
} from 'lucide-react'
import { cn } from '@/lib/utils'

const documentTypes = [
  {
    id: 'dfd',
    title: 'DFD',
    fullName: 'Documento de Formalização de Demanda',
    description: 'Justifica a necessidade da contratação, com base no planejamento estratégico da instituição.',
    icon: ClipboardList,
    color: 'text-chart-1',
    bgColor: 'bg-chart-1/10',
    borderColor: 'border-chart-1/30'
  },
  {
    id: 'etp',
    title: 'ETP',
    fullName: 'Estudo Técnico Preliminar',
    description: 'Analisa as soluções disponíveis no mercado e define a melhor estratégia de contratação.',
    icon: FileSearch,
    color: 'text-chart-2',
    bgColor: 'bg-chart-2/10',
    borderColor: 'border-chart-2/30'
  },
  {
    id: 'tr',
    title: 'TR',
    fullName: 'Termo de Referência',
    description: 'Especifica as condições técnicas, requisitos e critérios para a contratação.',
    icon: ScrollText,
    color: 'text-chart-3',
    bgColor: 'bg-chart-3/10',
    borderColor: 'border-chart-3/30'
  },
  {
    id: 'minuta',
    title: 'Minuta',
    fullName: 'Minuta do Contrato',
    description: 'Define as cláusulas contratuais, obrigações das partes e penalidades.',
    icon: Scale,
    color: 'text-chart-5',
    bgColor: 'bg-chart-5/10',
    borderColor: 'border-chart-5/30'
  }
]

const processList = [
  { id: 'PE-2024-045', name: 'Contratação de Serviços de TI' },
  { id: 'PE-2024-044', name: 'Aquisição de Material de Escritório' },
  { id: 'PE-2024-043', name: 'Equipamentos de Informática' },
  { id: 'CC-2024-012', name: 'Obra de Reforma do Prédio Sede' },
  { id: 'PE-2024-042', name: 'Serviços de Limpeza e Conservação' }
]

export default function NovoDocumentoPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  
  const tipoParam = searchParams.get('tipo')
  const processoParam = searchParams.get('processo')
  
  const [selectedType, setSelectedType] = useState<string | null>(tipoParam)
  const [selectedProcess, setSelectedProcess] = useState<string>(processoParam || '')
  const [documentName, setDocumentName] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleTypeSelect = (typeId: string) => {
    setSelectedType(typeId)
    const type = documentTypes.find(t => t.id === typeId)
    if (type && selectedProcess) {
      const process = processList.find(p => p.id === selectedProcess)
      if (process) {
        setDocumentName(`${type.title} - ${process.name}`)
      }
    }
  }

  const handleProcessSelect = (processId: string) => {
    setSelectedProcess(processId)
    if (selectedType) {
      const type = documentTypes.find(t => t.id === selectedType)
      const process = processList.find(p => p.id === processId)
      if (type && process) {
        setDocumentName(`${type.title} - ${process.name}`)
      }
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedType || !selectedProcess) return
    
    setIsSubmitting(true)
    
    // Simula criação
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    // Redireciona para a página de edição do documento
    navigate('/app/documento/DOC-2024-0090')
  }

  const canSubmit = selectedType && selectedProcess && documentName

  return (
    <div className="flex flex-col h-full">
      <AppHeader 
        breadcrumbs={[
          { label: 'Central de Trabalho', href: '/app' },
          { label: 'Documentos', href: '/app/documentos' },
          { label: 'Novo Documento' }
        ]} 
      />
      
      <main className="flex-1 overflow-auto p-6">
        <div className="max-w-4xl mx-auto space-y-6">
          {/* Header */}
          <div className="flex items-start gap-4">
            <Link 
              to="/app/documentos"
              className="mt-0.5 p-2 -ml-2 text-muted-foreground hover:text-foreground hover:bg-accent rounded-md transition-colors"
              title="Voltar para Documentos"
            >
              <ArrowLeft className="h-5 w-5" />
            </Link>
            <div className="flex-1">
              <h1 className="text-2xl font-semibold tracking-tight">
                Novo Documento
              </h1>
              <p className="text-muted-foreground text-sm mt-1">
                Selecione o tipo de documento que deseja criar
              </p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Seleção de Tipo */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Tipo de Documento</CardTitle>
                <CardDescription>
                  Escolha o tipo de documento conforme a Lei 14.133/2021
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 md:grid-cols-2">
                  {documentTypes.map((type) => (
                    <button
                      key={type.id}
                      type="button"
                      onClick={() => handleTypeSelect(type.id)}
                      className={cn(
                        'flex items-start gap-4 p-4 rounded-lg border-2 text-left transition-all hover:shadow-md',
                        selectedType === type.id 
                          ? `${type.borderColor} ${type.bgColor}` 
                          : 'border-border hover:border-primary/30'
                      )}
                    >
                      <div className={cn(
                        'p-2.5 rounded-lg',
                        selectedType === type.id ? type.bgColor : 'bg-muted'
                      )}>
                        <type.icon className={cn(
                          'h-5 w-5',
                          selectedType === type.id ? type.color : 'text-muted-foreground'
                        )} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-semibold">{type.title}</span>
                          {selectedType === type.id && (
                            <span className={cn('text-xs px-2 py-0.5 rounded-full', type.bgColor, type.color)}>
                              Selecionado
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground mb-1">
                          {type.fullName}
                        </p>
                        <p className="text-xs text-muted-foreground leading-relaxed">
                          {type.description}
                        </p>
                      </div>
                    </button>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Seleção de Processo */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Processo de Contratação</CardTitle>
                <CardDescription>
                  Vincule este documento a um processo existente
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="processo">Processo *</Label>
                  <Select value={selectedProcess} onValueChange={handleProcessSelect}>
                    <SelectTrigger id="processo">
                      <SelectValue placeholder="Selecione o processo" />
                    </SelectTrigger>
                    <SelectContent>
                      {processList.map((process) => (
                        <SelectItem key={process.id} value={process.id}>
                          <span className="font-mono text-xs mr-2">{process.id}</span>
                          <span>{process.name}</span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="nome">Nome do Documento</Label>
                  <Input
                    id="nome"
                    value={documentName}
                    onChange={(e) => setDocumentName(e.target.value)}
                    placeholder="Nome será gerado automaticamente"
                  />
                  <p className="text-xs text-muted-foreground">
                    O nome é gerado automaticamente, mas pode ser personalizado.
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Ações */}
            <div className="flex justify-end gap-4">
              <Button type="button" variant="outline" asChild>
                <Link to="/app/documentos">Cancelar</Link>
              </Button>
              <Button type="submit" disabled={!canSubmit || isSubmitting}>
                {isSubmitting ? 'Criando...' : 'Criar e Editar'}
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </div>
          </form>
        </div>
      </main>
    </div>
  )
}

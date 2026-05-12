import { useParams, Link } from 'react-router'
import { AppHeader } from '@/components/app-header'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import {
  ArrowLeft,
  Download,
  FileText,
  Printer
} from 'lucide-react'

// Mock data do documento
const documentData = {
  id: 'etp-PE-2024-045',
  type: 'ETP',
  title: 'Estudo Técnico Preliminar',
  process: {
    id: 'PE-2024-045',
    name: 'Contratação de Serviços de TI'
  },
  content: {
    descricao_necessidade: 'A presente contratação tem por objetivo suprir a necessidade de serviços especializados de Tecnologia da Informação para o órgão, considerando a crescente demanda por soluções digitais e a necessidade de modernização dos sistemas existentes, conforme previsto no Plano Anual de Contratações (PAC) 2024.',
    area_requisitante: 'Departamento de Tecnologia da Informação - DTI',
    requisitos_contratacao: 'Os requisitos mínimos para a contratação são:\n\n- Experiência comprovada em desenvolvimento de sistemas web;\n- Equipe técnica com certificações em tecnologias modernas;\n- Capacidade de atendimento em regime 8x5;\n- Metodologia ágil de desenvolvimento;\n- Suporte técnico presencial e remoto.',
    estimativa_quantidades: 'A estimativa foi baseada no consumo dos últimos 12 meses e na projeção de demandas para o próximo exercício:\n\n- 2.400 horas/ano de desenvolvimento\n- 1.200 horas/ano de suporte técnico\n- 600 horas/ano de consultoria especializada',
    levantamento_mercado: 'Foram identificadas as seguintes soluções no mercado:\n\n1. Fábrica de Software com equipe dedicada\n2. Contratação de postos de trabalho terceirizados\n3. Desenvolvimento interno com capacitação de servidores\n\nA análise comparativa demonstrou que a opção 1 apresenta melhor custo-benefício.',
    estimativa_preco: 'A pesquisa de preços foi realizada considerando:\n\n- Painel de Preços do Governo Federal\n- Contratos similares em outros órgãos\n- Propostas de fornecedores\n\nValor médio estimado: R$ 450.000,00 (quatrocentos e cinquenta mil reais)',
    descricao_solucao: 'A solução escolhida consiste na contratação de empresa especializada em Tecnologia da Informação para prestação de serviços sob demanda, com alocação de profissionais qualificados conforme necessidade do órgão.',
    justificativa_parcelamento: 'O parcelamento não é viável tecnicamente, considerando que os serviços são interdependentes e requerem gestão unificada para garantir a qualidade e continuidade das entregas.',
    resultados_pretendidos: 'Espera-se alcançar os seguintes resultados:\n\n- Modernização dos sistemas legados\n- Redução do tempo de resposta a incidentes em 40%\n- Aumento da satisfação dos usuários internos\n- Conformidade com a LGPD',
    analise_riscos: 'Os principais riscos identificados são:\n\nRisco 1: Rotatividade de profissionais\n- Probabilidade: Média\n- Impacto: Alto\n- Mitigação: Exigência de substituição em até 5 dias úteis\n\nRisco 2: Descumprimento de prazos\n- Probabilidade: Baixa\n- Impacto: Médio\n- Mitigação: Aplicação de glosas contratuais'
  },
  metadata: {
    elaboradoPor: 'Maria Costa',
    cargo: 'Analista de Licitações',
    data: '28 de março de 2024',
    orgao: 'Secretaria de Administração',
    unidade: 'Coordenação de Compras e Licitações'
  }
}

const sections = [
  { id: 'descricao_necessidade', title: '1. Descrição da Necessidade' },
  { id: 'area_requisitante', title: '2. Área Requisitante' },
  { id: 'requisitos_contratacao', title: '3. Requisitos da Contratação' },
  { id: 'estimativa_quantidades', title: '4. Estimativa de Quantidades' },
  { id: 'levantamento_mercado', title: '5. Levantamento de Mercado' },
  { id: 'estimativa_preco', title: '6. Estimativa de Preço' },
  { id: 'descricao_solucao', title: '7. Descrição da Solução' },
  { id: 'justificativa_parcelamento', title: '8. Justificativa para Parcelamento' },
  { id: 'resultados_pretendidos', title: '9. Resultados Pretendidos' },
  { id: 'analise_riscos', title: '10. Análise de Riscos' }
]

export default function DocumentoPreviewPage() {
  const { id } = useParams()

  return (
    <div className="flex flex-col h-full">
      <AppHeader 
        breadcrumbs={[
          { label: 'Central de Trabalho', href: '/app' },
          { label: 'Processos', href: '/app/processos' },
          { label: documentData.process.id, href: `/app/processo/${documentData.process.id}` },
          { label: documentData.type, href: `/app/documento/${id}` },
          { label: 'Visualização' }
        ]} 
      />
      
      <main className="flex-1 overflow-auto bg-muted/30">
        <div className="p-6">
          <div className="max-w-4xl mx-auto space-y-6">
            {/* Header com ações */}
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div className="flex items-center gap-3">
                <Button variant="outline" size="sm" asChild>
                  <Link to={`/app/documento/${id}`}>
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Voltar para edição
                  </Link>
                </Button>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm">
                  <Printer className="h-4 w-4 mr-2" />
                  Imprimir
                </Button>
                <Button variant="outline" size="sm">
                  <FileText className="h-4 w-4 mr-2" />
                  Exportar DOCX
                </Button>
                <Button size="sm">
                  <Download className="h-4 w-4 mr-2" />
                  Exportar PDF
                </Button>
              </div>
            </div>

            {/* Preview do Documento */}
            <Card className="shadow-lg">
              <CardContent className="p-8 md:p-12">
                {/* Cabeçalho do Documento */}
                <div className="text-center mb-8">
                  <p className="text-sm text-muted-foreground mb-2">
                    {documentData.metadata.orgao}
                  </p>
                  <p className="text-sm text-muted-foreground mb-4">
                    {documentData.metadata.unidade}
                  </p>
                  <h1 className="text-xl font-bold mb-2 uppercase tracking-wide">
                    {documentData.title}
                  </h1>
                  <p className="text-sm text-muted-foreground">
                    Processo: {documentData.process.id}
                  </p>
                </div>

                <Separator className="my-6" />

                {/* Objeto */}
                <div className="mb-8">
                  <h2 className="font-semibold mb-2">OBJETO</h2>
                  <p className="text-sm leading-relaxed">
                    {documentData.process.name}
                  </p>
                </div>

                <Separator className="my-6" />

                {/* Seções do Documento */}
                <div className="space-y-6">
                  {sections.map((section) => {
                    const content = documentData.content[section.id as keyof typeof documentData.content]
                    if (!content) return null
                    
                    return (
                      <div key={section.id}>
                        <h2 className="font-semibold mb-3 text-sm uppercase tracking-wide">
                          {section.title}
                        </h2>
                        <div className="text-sm leading-relaxed whitespace-pre-line pl-4 border-l-2 border-muted">
                          {content}
                        </div>
                      </div>
                    )
                  })}
                </div>

                <Separator className="my-8" />

                {/* Assinatura */}
                <div className="mt-12 text-center">
                  <p className="text-sm text-muted-foreground mb-8">
                    {documentData.metadata.data}
                  </p>
                  <div className="inline-block">
                    <div className="border-t border-foreground pt-2 px-8">
                      <p className="font-medium">{documentData.metadata.elaboradoPor}</p>
                      <p className="text-sm text-muted-foreground">{documentData.metadata.cargo}</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  )
}

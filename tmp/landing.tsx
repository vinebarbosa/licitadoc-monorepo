import { Link } from 'react-router'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { 
  Scale, 
  FileText, 
  Shield, 
  Clock, 
  CheckCircle2, 
  ArrowRight, 
  Zap,
  Users,
  FileCheck,
  Building2,
  ChevronRight
} from 'lucide-react'

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto flex h-16 max-w-7xl items-center justify-between px-4 md:px-6">
          <Link to="/" className="flex items-center gap-2.5">
            <div className="p-1.5 rounded-lg bg-primary/10">
              <Scale className="h-5 w-5 text-primary" />
            </div>
            <span className="text-lg font-semibold tracking-tight">LicitaDoc</span>
          </Link>
          
          <nav className="hidden md:flex items-center gap-8">
            <a href="#funcionalidades" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              Funcionalidades
            </a>
            <a href="#como-funciona" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              Como Funciona
            </a>
            <a href="#contato" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              Contato
            </a>
          </nav>
          
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" asChild>
              <Link to="/entrar">Entrar</Link>
            </Button>
            <Button size="sm" asChild>
              <Link to="/cadastro">
                Solicitar Acesso
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-primary/5 via-transparent to-transparent" />
        
        <div className="container relative mx-auto max-w-7xl px-4 md:px-6 py-24 md:py-32 lg:py-40">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
            <div className="space-y-8">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-sm text-primary">
                <Zap className="h-3.5 w-3.5" />
                <span>Conforme a Lei 14.133/2021</span>
              </div>
              
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight text-balance leading-[1.1]">
                Documentos para Contratações Públicas
              </h1>
              
              <p className="text-lg md:text-xl text-muted-foreground leading-relaxed max-w-xl">
                Gere documentos oficiais exigidos pela Nova Lei de Licitações de forma 
                inteligente: DFD, ETP, Termo de Referência e Minuta de Contrato.
              </p>
              
              <div className="flex flex-col sm:flex-row gap-4">
                <Button size="lg" className="h-12 px-8" asChild>
                  <Link to="/cadastro">
                    Solicitar Acesso
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
                <Button size="lg" variant="outline" className="h-12 px-8" asChild>
                  <a href="#como-funciona">
                    Como Funciona
                  </a>
                </Button>
              </div>
            </div>
            
            <div className="relative hidden lg:block">
              <div className="absolute inset-0 bg-gradient-to-tr from-primary/10 to-accent/10 rounded-3xl blur-3xl" />
              <Card className="relative border-border/50 shadow-2xl">
                <CardContent className="p-8">
                  <div className="space-y-6">
                    <div className="flex items-center gap-4">
                      <div className="p-3 rounded-xl bg-primary/10">
                        <FileText className="h-6 w-6 text-primary" />
                      </div>
                      <div>
                        <h3 className="font-semibold">Documento em Geração</h3>
                        <p className="text-sm text-muted-foreground">Termo de Referência - TI</p>
                      </div>
                    </div>
                    
                    <div className="space-y-3">
                      <div className="flex items-center gap-3">
                        <CheckCircle2 className="h-5 w-5 text-green-600" />
                        <span className="text-sm">Análise de requisitos concluída</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <CheckCircle2 className="h-5 w-5 text-green-600" />
                        <span className="text-sm">Estimativa de preços gerada</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="h-5 w-5 rounded-full border-2 border-primary border-t-transparent animate-spin" />
                        <span className="text-sm text-muted-foreground">Formatando documento final...</span>
                      </div>
                    </div>
                    
                    <div className="h-2 bg-muted rounded-full overflow-hidden">
                      <div className="h-full w-3/4 bg-primary rounded-full transition-all duration-500" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="border-y border-border/40 bg-muted/30">
        <div className="container mx-auto max-w-7xl px-4 md:px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 divide-x divide-border/40">
            {[
              { value: "85%", label: "menos tempo na elaboração" },
              { value: "100%", label: "conforme a Lei 14.133" },
              { value: "500+", label: "documentos gerados" },
              { value: "50+", label: "órgãos atendidos" },
            ].map((stat, i) => (
              <div key={i} className="py-12 px-6 text-center">
                <div className="text-3xl md:text-4xl font-bold text-foreground">{stat.value}</div>
                <div className="mt-2 text-sm text-muted-foreground">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="funcionalidades" className="py-24 md:py-32">
        <div className="container mx-auto max-w-7xl px-4 md:px-6">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-4">
              Tudo que você precisa para suas contratações
            </h2>
            <p className="text-lg text-muted-foreground">
              Ferramentas desenvolvidas especificamente para atender às exigências 
              da Nova Lei de Licitações e Contratos.
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              {
                icon: FileText,
                title: "Documento de Formalização da Demanda",
                description: "Gere DFDs completos com justificativa, alinhamento estratégico e requisitantes identificados."
              },
              {
                icon: FileCheck,
                title: "Estudo Técnico Preliminar",
                description: "ETPs detalhados com análise de soluções, riscos identificados e viabilidade técnica."
              },
              {
                icon: Scale,
                title: "Termo de Referência",
                description: "TRs estruturados com especificações técnicas, critérios de julgamento e obrigações contratuais."
              },
              {
                icon: Shield,
                title: "Conformidade Garantida",
                description: "Todos os documentos seguem rigorosamente os requisitos da Lei 14.133/2021."
              },
              {
                icon: Clock,
                title: "Agilidade no Processo",
                description: "Reduza drasticamente o tempo de elaboração dos documentos preparatórios."
              },
              {
                icon: Users,
                title: "Colaboração em Equipe",
                description: "Múltiplos usuários podem trabalhar no mesmo processo simultaneamente."
              },
            ].map((feature, i) => (
              <Card key={i} className="border-border/50 hover:border-primary/30 transition-colors group">
                <CardContent className="p-6">
                  <div className="p-3 rounded-xl bg-primary/10 w-fit mb-4 group-hover:bg-primary/15 transition-colors">
                    <feature.icon className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="font-semibold mb-2">{feature.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {feature.description}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section id="como-funciona" className="py-24 md:py-32 bg-muted/30 border-y border-border/40">
        <div className="container mx-auto max-w-7xl px-4 md:px-6">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-4">
              Como funciona
            </h2>
            <p className="text-lg text-muted-foreground">
              Em poucos passos, você gera documentos completos e prontos para uso.
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                step: "01",
                title: "Inicie um novo processo",
                description: "Insira as informações básicas da contratação: objeto, modalidade e área requisitante."
              },
              {
                step: "02",
                title: "Preencha os dados",
                description: "Complete os campos específicos de cada documento com auxílio de sugestões inteligentes."
              },
              {
                step: "03",
                title: "Gere e exporte",
                description: "Obtenha documentos formatados prontos para assinatura e anexação ao processo."
              },
            ].map((item, i) => (
              <div key={i} className="relative">
                <div className="text-6xl font-bold text-primary/10 mb-4">{item.step}</div>
                <h3 className="text-xl font-semibold mb-2">{item.title}</h3>
                <p className="text-muted-foreground leading-relaxed">{item.description}</p>
                {i < 2 && (
                  <ChevronRight className="hidden md:block absolute top-8 -right-4 h-8 w-8 text-border" />
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 md:py-32">
        <div className="container mx-auto max-w-7xl px-4 md:px-6">
          <div className="relative overflow-hidden rounded-3xl bg-sidebar p-8 md:p-16">
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-primary/20 via-transparent to-transparent" />
            
            <div className="relative z-10 max-w-2xl">
              <h2 className="text-3xl md:text-4xl font-bold tracking-tight text-sidebar-foreground mb-4">
                Pronto para modernizar suas contratações?
              </h2>
              <p className="text-lg text-sidebar-foreground/70 mb-8">
                Solicite acesso à plataforma e comece a gerar documentos em conformidade 
                com a Nova Lei de Licitações ainda hoje.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <Button size="lg" variant="secondary" className="h-12 px-8" asChild>
                  <Link to="/cadastro">
                    Solicitar Acesso
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
                <Button size="lg" variant="outline" className="h-12 px-8 border-sidebar-border text-sidebar-foreground hover:bg-sidebar-accent" asChild>
                  <a href="#contato">
                    Falar com a Equipe
                  </a>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer id="contato" className="border-t border-border/40 bg-muted/30">
        <div className="container mx-auto max-w-7xl px-4 md:px-6 py-12 md:py-16">
          <div className="grid md:grid-cols-4 gap-8">
            <div className="md:col-span-2">
              <Link to="/" className="flex items-center gap-2.5 mb-4">
                <div className="p-1.5 rounded-lg bg-primary/10">
                  <Scale className="h-5 w-5 text-primary" />
                </div>
                <span className="text-lg font-semibold tracking-tight">LicitaDoc</span>
              </Link>
              <p className="text-sm text-muted-foreground max-w-sm leading-relaxed">
                Plataforma de geração de documentos para contratações públicas, 
                em conformidade com a Lei 14.133/2021.
              </p>
            </div>
            
            <div>
              <h4 className="font-semibold mb-4">Plataforma</h4>
              <ul className="space-y-3 text-sm text-muted-foreground">
                <li><a href="#funcionalidades" className="hover:text-foreground transition-colors">Funcionalidades</a></li>
                <li><a href="#como-funciona" className="hover:text-foreground transition-colors">Como Funciona</a></li>
                <li><Link to="/entrar" className="hover:text-foreground transition-colors">Acessar</Link></li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-semibold mb-4">Legal</h4>
              <ul className="space-y-3 text-sm text-muted-foreground">
                <li><Link to="/termos" className="hover:text-foreground transition-colors">Termos de Uso</Link></li>
                <li><Link to="/privacidade" className="hover:text-foreground transition-colors">Privacidade</Link></li>
                <li><a href="#contato" className="hover:text-foreground transition-colors">Contato</a></li>
              </ul>
            </div>
          </div>
          
          <Separator className="my-8" />
          
          <div className="flex flex-col md:flex-row justify-between items-center gap-4 text-sm text-muted-foreground">
            <p>2024 LicitaDoc. Todos os direitos reservados.</p>
            <div className="flex items-center gap-2">
              <Building2 className="h-4 w-4" />
              <span>Desenvolvido para o setor público brasileiro</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}

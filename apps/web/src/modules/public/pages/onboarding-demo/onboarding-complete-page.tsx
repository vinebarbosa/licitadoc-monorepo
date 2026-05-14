import { Link, useSearchParams } from "react-router-dom";
import {
  ArrowRight,
  Building2,
  CheckCircle2,
  FileText,
  Sparkles,
  User,
  Users,
} from "lucide-react";
import { Button } from "@/shared/ui/button";
import { Card, CardContent } from "@/shared/ui/card";
import { cn } from "@/lib/utils";

// Demo data
const demoOrgAdmin = {
  fullName: "Maria da Silva Santos",
  email: "maria.santos@prefeitura.sp.gov.br",
  organization: "Prefeitura Municipal de São Paulo",
};

const demoMember = {
  fullName: "João Pedro Oliveira",
  email: "joao.oliveira@prefeitura.sp.gov.br",
  organization: "Prefeitura Municipal de São Paulo",
};

function FeatureCard({
  icon: Icon,
  title,
  description,
}: {
  icon: React.ElementType;
  title: string;
  description: string;
}) {
  return (
    <div className="flex gap-3 rounded-lg p-3 transition-colors hover:bg-muted/30">
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10">
        <Icon className="h-4 w-4 text-primary" />
      </div>
      <div>
        <h3 className="text-sm font-medium">{title}</h3>
        <p className="text-xs text-muted-foreground">{description}</p>
      </div>
    </div>
  );
}

function CompletedItem({ label }: { label: string }) {
  return (
    <div className="flex items-center gap-2">
      <div className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-100">
        <CheckCircle2 className="h-3 w-3 text-emerald-600" />
      </div>
      <span className="text-sm text-foreground/80">{label}</span>
    </div>
  );
}

export function OnboardingCompletePage() {
  const [searchParams] = useSearchParams();
  const isOrgAdmin = searchParams.get("role") === "admin";

  const user = isOrgAdmin ? demoOrgAdmin : demoMember;

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20">
      {/* Header */}
      <header className="border-b bg-background/80 backdrop-blur-sm">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <Link to="/" className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
              <span className="text-sm font-bold text-primary-foreground">LD</span>
            </div>
            <span className="text-lg font-semibold tracking-tight">LicitaDoc</span>
          </Link>
          <div className="flex items-center gap-3">
            <div className="hidden text-right sm:block">
              <p className="text-sm font-medium">{user.fullName}</p>
              <p className="text-xs text-muted-foreground">{user.email}</p>
            </div>
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10">
              <span className="text-sm font-semibold text-primary">
                {user.fullName.split(' ').map(n => n[0]).slice(0, 2).join('')}
              </span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto max-w-2xl px-4 py-16">
        {/* Success Icon */}
        <div className="mb-6 flex justify-center">
          <div className="relative">
            <div className="flex h-20 w-20 items-center justify-center rounded-3xl bg-emerald-100">
              <CheckCircle2 className="h-10 w-10 text-emerald-600" />
            </div>
            <div className="absolute -right-1 -top-1 flex h-8 w-8 items-center justify-center rounded-full bg-primary">
              <Sparkles className="h-4 w-4 text-primary-foreground" />
            </div>
          </div>
        </div>

        {/* Welcome Message */}
        <div className="mb-10 text-center">
          <h1 className="text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
            Tudo pronto, {user.fullName.split(' ')[0]}!
          </h1>
          <p className="mt-3 text-muted-foreground">
            {isOrgAdmin
              ? "Sua conta e organização foram configuradas com sucesso. Você já pode começar a usar o LicitaDoc."
              : "Seu perfil foi configurado com sucesso. Você já pode acessar a plataforma."}
          </p>
        </div>

        {/* Summary Card */}
        <Card className="mb-8 border-muted/50">
          <CardContent className="p-6">
            <h2 className="mb-4 text-sm font-semibold text-muted-foreground">
              Resumo da configuração
            </h2>
            <div className="space-y-3">
              <CompletedItem label="Perfil pessoal configurado" />
              <CompletedItem label="Senha de acesso definida" />
              {isOrgAdmin && (
                <>
                  <CompletedItem label="Organização cadastrada" />
                  <CompletedItem label="Dados institucionais salvos" />
                </>
              )}
              <CompletedItem label="Acesso à plataforma liberado" />
            </div>

            {/* Organization Info for Admin */}
            {isOrgAdmin && (
              <div className="mt-6 rounded-lg border border-muted/50 bg-muted/20 p-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                    <Building2 className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">{user.organization}</p>
                    <p className="text-xs text-muted-foreground">Organização vinculada</p>
                  </div>
                </div>
              </div>
            )}

            {/* Member org info */}
            {!isOrgAdmin && (
              <div className="mt-6 rounded-lg border border-muted/50 bg-muted/20 p-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                    <Users className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">{user.organization}</p>
                    <p className="text-xs text-muted-foreground">Você foi adicionado a esta organização</p>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* What you can do */}
        <div className="mb-10">
          <h2 className="mb-4 text-center text-sm font-semibold text-muted-foreground">
            O que você pode fazer agora
          </h2>
          <div className="grid gap-2 sm:grid-cols-2">
            <FeatureCard
              icon={FileText}
              title="Criar processos"
              description="Inicie novos processos de contratação"
            />
            <FeatureCard
              icon={Building2}
              title="Gerar documentos"
              description="DFD, ETP, TR e Minuta automatizados"
            />
            {isOrgAdmin && (
              <>
                <FeatureCard
                  icon={Users}
                  title="Gerenciar equipe"
                  description="Convide membros para sua organização"
                />
                <FeatureCard
                  icon={User}
                  title="Configurar perfis"
                  description="Defina papéis e permissões"
                />
              </>
            )}
          </div>
        </div>

        {/* CTA */}
        <div className="text-center">
          <Link to="/app">
            <Button size="lg" className="min-w-[200px]">
              Entrar na plataforma
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </Link>
          <p className="mt-4 text-xs text-muted-foreground/70">
            Você será redirecionado para a Central de Trabalho
          </p>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t bg-background/50 py-6">
        <div className="container mx-auto px-4 text-center">
          <p className="text-xs text-muted-foreground/60">
            LicitaDoc - Documentos para Contratações Públicas conforme Lei 14.133
          </p>
        </div>
      </footer>
    </div>
  );
}

import {
  ArrowLeft,
  ArrowRight,
  Building2,
  CheckCircle2,
  Eye,
  EyeOff,
  Lock,
  Mail,
  Phone,
  Scale,
  Shield,
  User,
} from "lucide-react";
import { useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/shared/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/shared/ui/card";
import { Checkbox } from "@/shared/ui/checkbox";
import { Input } from "@/shared/ui/input";
import { Label } from "@/shared/ui/label";
import { Separator } from "@/shared/ui/separator";

type RequestAccessFormState = {
  name: string;
  email: string;
  phone: string;
  organization: string;
  password: string;
  confirmPassword: string;
};

const initialFormState: RequestAccessFormState = {
  name: "",
  email: "",
  phone: "",
  organization: "",
  password: "",
  confirmPassword: "",
};

export function RequestAccessPage() {
  const [formState, setFormState] = useState(initialFormState);
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  function updateField(field: keyof RequestAccessFormState, value: string) {
    setFormState((currentState) => ({ ...currentState, [field]: value }));
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsLoading(true);

    await new Promise((resolve) => {
      setTimeout(resolve, 300);
    });

    setIsLoading(false);
    setIsSubmitted(true);
  }

  if (isSubmitted) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background p-6">
        <Card className="w-full max-w-md border-border/50 shadow-lg">
          <CardContent className="pt-10 pb-8 text-center">
            <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-success/10">
              <CheckCircle2 className="h-8 w-8 text-success" />
            </div>
            <h1 className="mb-3 text-2xl font-semibold">Solicitação enviada</h1>
            <p className="mb-6 text-muted-foreground">
              Sua solicitação de acesso foi recebida. A equipe irá analisar o pedido e retornar com
              as próximas instruções.
            </p>
            <Button asChild className="w-full" size="lg">
              <Link to="/entrar">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Voltar para o login
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background lg:grid lg:grid-cols-2">
      <section className="hidden bg-sidebar lg:flex lg:flex-col lg:justify-between lg:p-12 lg:text-sidebar-foreground">
        <div>
          <div className="mb-12 flex items-center gap-3">
            <div className="rounded-xl border border-sidebar-border bg-sidebar-primary/20 p-2.5">
              <Scale className="h-7 w-7 text-sidebar-primary" />
            </div>
            <span className="text-2xl font-semibold tracking-tight">LicitaDoc</span>
          </div>

          <div className="max-w-md space-y-6">
            <h1 className="text-4xl font-bold leading-tight">Solicite seu acesso</h1>
            <p className="text-lg leading-relaxed text-sidebar-foreground/70">
              Preserve a experiência pública de onboarding enquanto o fluxo de provisionamento
              continua controlado pelo modelo atual de acesso.
            </p>
          </div>
        </div>

        <div className="space-y-8">
          <div className="flex items-start gap-4">
            <div className="rounded-lg bg-sidebar-accent p-2">
              <Shield className="h-5 w-5 text-sidebar-primary" />
            </div>
            <div>
              <h2 className="mb-1 font-medium">Acesso controlado</h2>
              <p className="text-sm text-sidebar-foreground/60">
                As solicitações continuam passando por análise antes da liberação no ambiente.
              </p>
            </div>
          </div>

          <Separator className="bg-sidebar-border" />

          <p className="text-sm text-sidebar-foreground/50">
            Plataforma exclusiva para o setor público brasileiro.
          </p>
        </div>
      </section>

      <section className="flex items-center justify-center p-6">
        <div className="w-full max-w-md py-8">
          <div className="mb-8 flex items-center gap-3 lg:hidden">
            <div className="rounded-xl border border-border bg-primary/10 p-2">
              <Scale className="h-6 w-6 text-primary" />
            </div>
            <span className="text-xl font-semibold tracking-tight">LicitaDoc</span>
          </div>

          <Card className="border-border/50 shadow-lg">
            <CardHeader className="space-y-1 pb-6">
              <CardTitle className="text-2xl font-semibold">Solicite acesso</CardTitle>
              <CardDescription className="text-muted-foreground">
                Preencha seus dados institucionais para solicitar acesso à plataforma.
              </CardDescription>
            </CardHeader>

            <CardContent>
              <form className="space-y-4" onSubmit={handleSubmit}>
                <div className="space-y-2">
                  <Label htmlFor="name">Nome completo</Label>
                  <div className="relative">
                    <User className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      id="name"
                      className="pl-10"
                      required
                      value={formState.name}
                      onChange={(event) => updateField("name", event.target.value)}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">E-mail institucional</Label>
                  <div className="relative">
                    <Mail className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      id="email"
                      type="email"
                      className="pl-10"
                      required
                      value={formState.email}
                      onChange={(event) => updateField("email", event.target.value)}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone">Telefone</Label>
                  <div className="relative">
                    <Phone className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      id="phone"
                      type="tel"
                      className="pl-10"
                      required
                      value={formState.phone}
                      onChange={(event) => updateField("phone", event.target.value)}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="organization">Órgão ou entidade</Label>
                  <div className="relative">
                    <Building2 className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      id="organization"
                      className="pl-10"
                      required
                      value={formState.organization}
                      onChange={(event) => updateField("organization", event.target.value)}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password">Senha</Label>
                  <div className="relative">
                    <Lock className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      className="pr-10 pl-10"
                      minLength={8}
                      required
                      value={formState.password}
                      onChange={(event) => updateField("password", event.target.value)}
                    />
                    <button
                      type="button"
                      className="absolute top-1/2 right-3 -translate-y-1/2 text-muted-foreground transition-colors hover:text-foreground"
                      onClick={() => setShowPassword((currentValue) => !currentValue)}
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirm-password">Confirmar senha</Label>
                  <div className="relative">
                    <Lock className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      id="confirm-password"
                      type={showConfirmPassword ? "text" : "password"}
                      className="pr-10 pl-10"
                      required
                      value={formState.confirmPassword}
                      onChange={(event) => updateField("confirmPassword", event.target.value)}
                    />
                    <button
                      type="button"
                      className="absolute top-1/2 right-3 -translate-y-1/2 text-muted-foreground transition-colors hover:text-foreground"
                      onClick={() => setShowConfirmPassword((currentValue) => !currentValue)}
                    >
                      {showConfirmPassword ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                </div>

                <div className="flex items-start gap-2 pt-2">
                  <Checkbox
                    id="terms"
                    checked={acceptTerms}
                    onCheckedChange={(checked) => setAcceptTerms(checked === true)}
                  />
                  <Label
                    htmlFor="terms"
                    className="cursor-pointer font-normal leading-relaxed text-muted-foreground"
                  >
                    Li e concordo com os Termos de Uso e a Política de Privacidade.
                  </Label>
                </div>

                <Button
                  className="w-full"
                  size="lg"
                  type="submit"
                  disabled={isLoading || !acceptTerms}
                >
                  {isLoading ? (
                    <span className="flex items-center gap-2">Enviando...</span>
                  ) : (
                    <span className="flex items-center gap-2">
                      Solicitar acesso
                      <ArrowRight className="h-4 w-4" />
                    </span>
                  )}
                </Button>
              </form>

              <div className="mt-6 border-t border-border pt-6">
                <p className="text-center text-sm text-muted-foreground">
                  Já possui uma conta?{" "}
                  <Link
                    to="/entrar"
                    className="font-medium text-primary transition-colors hover:text-primary/80"
                  >
                    Faça login
                  </Link>
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>
    </div>
  );
}

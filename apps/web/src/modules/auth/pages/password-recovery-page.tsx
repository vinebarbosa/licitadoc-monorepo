import { ArrowLeft, ArrowRight, CheckCircle2, KeyRound, Mail, Scale, Shield } from "lucide-react";
import { useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/shared/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/shared/ui/card";
import { Input } from "@/shared/ui/input";
import { Label } from "@/shared/ui/label";
import { Separator } from "@/shared/ui/separator";
import { getAuthErrorMessage, usePasswordResetRequest } from "../api/use-auth";

const DEFAULT_RESET_ERROR = "Não foi possível solicitar a redefinição de senha. Tente novamente.";

function getResetRedirectUrl() {
  if (typeof window === "undefined") {
    return "/recuperar-senha";
  }

  return `${window.location.origin}/recuperar-senha`;
}

export function PasswordRecoveryPage() {
  const [email, setEmail] = useState("");
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const passwordResetRequest = usePasswordResetRequest();

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrorMessage(null);

    try {
      await passwordResetRequest.mutateAsync({
        data: {
          email,
          redirectTo: getResetRedirectUrl(),
        },
      });
      setIsSubmitted(true);
    } catch (error) {
      setErrorMessage(getAuthErrorMessage(error, DEFAULT_RESET_ERROR));
    }
  }

  if (isSubmitted) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background p-6">
        <Card className="w-full max-w-md border-border/50 shadow-lg">
          <CardContent className="pt-10 pb-8 text-center">
            <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-success/10">
              <CheckCircle2 className="h-8 w-8 text-success" />
            </div>
            <h1 className="mb-3 text-2xl font-semibold">E-mail enviado</h1>
            <p className="mb-2 text-muted-foreground">
              Se o e-mail <span className="font-medium text-foreground">{email}</span> estiver
              cadastrado, você receberá instruções para redefinir sua senha.
            </p>
            <p className="mb-6 text-sm text-muted-foreground">
              Verifique também sua caixa de spam.
            </p>
            <div className="space-y-3">
              <Button asChild className="w-full" size="lg">
                <Link to="/entrar">
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Voltar para o login
                </Link>
              </Button>
              <Button
                className="w-full"
                size="lg"
                variant="outline"
                onClick={() => setIsSubmitted(false)}
              >
                Tentar outro e-mail
              </Button>
            </div>
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
            <h1 className="text-4xl font-bold leading-tight">Recuperar senha</h1>
            <p className="text-lg leading-relaxed text-sidebar-foreground/70">
              Informe seu e-mail e enviaremos as instruções para recuperar o acesso com segurança.
            </p>
          </div>
        </div>

        <div className="space-y-8">
          <div className="flex items-start gap-4">
            <div className="rounded-lg bg-sidebar-accent p-2">
              <Shield className="h-5 w-5 text-sidebar-primary" />
            </div>
            <div>
              <h2 className="mb-1 font-medium">Processo seguro</h2>
              <p className="text-sm text-sidebar-foreground/60">
                A confirmação não revela se um e-mail existe ou não na base atual.
              </p>
            </div>
          </div>

          <Separator className="bg-sidebar-border" />

          <p className="text-sm text-sidebar-foreground/50">
            Em caso de dúvida, contate o suporte.
          </p>
        </div>
      </section>

      <section className="flex items-center justify-center p-6">
        <div className="w-full max-w-md">
          <div className="mb-8 flex items-center gap-3 lg:hidden">
            <div className="rounded-xl border border-border bg-primary/10 p-2">
              <Scale className="h-6 w-6 text-primary" />
            </div>
            <span className="text-xl font-semibold tracking-tight">LicitaDoc</span>
          </div>

          <Card className="border-border/50 shadow-lg">
            <CardHeader className="space-y-1 pb-6">
              <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-primary/10">
                <KeyRound className="h-7 w-7 text-primary" />
              </div>
              <CardTitle className="text-center text-2xl font-semibold">
                Esqueceu sua senha?
              </CardTitle>
              <CardDescription className="text-center text-muted-foreground">
                Digite seu e-mail e enviaremos um link para redefinir sua senha.
              </CardDescription>
            </CardHeader>

            <CardContent>
              <form className="space-y-5" onSubmit={handleSubmit}>
                <div className="space-y-2">
                  <Label htmlFor="email">E-mail</Label>
                  <div className="relative">
                    <Mail className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      id="email"
                      type="email"
                      autoFocus
                      className="pl-10"
                      required
                      value={email}
                      onChange={(event) => setEmail(event.target.value)}
                    />
                  </div>
                </div>

                {errorMessage ? (
                  <p className="text-sm text-destructive" role="alert">
                    {errorMessage}
                  </p>
                ) : null}

                <Button
                  className="w-full"
                  size="lg"
                  type="submit"
                  disabled={passwordResetRequest.isPending}
                >
                  {passwordResetRequest.isPending ? (
                    <span className="flex items-center gap-2">Enviando...</span>
                  ) : (
                    <span className="flex items-center gap-2">
                      Enviar instruções
                      <ArrowRight className="h-4 w-4" />
                    </span>
                  )}
                </Button>
              </form>

              <div className="mt-6 border-t border-border pt-6">
                <Button asChild className="w-full" variant="ghost">
                  <Link to="/entrar">
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Voltar para o login
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>
    </div>
  );
}

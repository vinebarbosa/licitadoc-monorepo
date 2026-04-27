import { ArrowRight, Eye, EyeOff, Lock, Mail, Scale, Shield } from "lucide-react";
import { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { Button } from "@/shared/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/shared/ui/card";
import { Checkbox } from "@/shared/ui/checkbox";
import { Input } from "@/shared/ui/input";
import { Label } from "@/shared/ui/label";
import { Separator } from "@/shared/ui/separator";
import {
  getAuthErrorMessage,
  getAuthRedirectTarget,
  getAuthResponseMessage,
  isSuccessfulSignInResponse,
  useSignIn,
} from "../api/use-auth";

const DEFAULT_SIGN_IN_ERROR = "Erro ao fazer login. Verifique suas credenciais e tente novamente.";

export function SignInPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const signIn = useSignIn();
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const redirectTo = getAuthRedirectTarget(searchParams.get("redirectTo"));

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrorMessage(null);

    try {
      const result = await signIn.mutateAsync({
        data: {
          email,
          password,
          rememberMe,
          callbackURL: redirectTo,
        },
      });

      if (!isSuccessfulSignInResponse(result)) {
        setErrorMessage(getAuthResponseMessage(result) ?? DEFAULT_SIGN_IN_ERROR);
        return;
      }

      navigate(redirectTo, { replace: true });
    } catch (error) {
      setErrorMessage(getAuthErrorMessage(error, DEFAULT_SIGN_IN_ERROR));
    }
  }

  return (
    <div className="min-h-screen bg-background lg:grid lg:grid-cols-2">
      <section className="hidden bg-sidebar lg:flex lg:flex-col lg:justify-between lg:overflow-hidden lg:p-12 lg:text-sidebar-foreground">
        <div>
          <div className="mb-12 flex items-center gap-3">
            <div className="rounded-xl border border-sidebar-border bg-sidebar-primary/20 p-2.5">
              <Scale className="h-7 w-7 text-sidebar-primary" />
            </div>
            <span className="text-2xl font-semibold tracking-tight">LicitaDoc</span>
          </div>

          <div className="max-w-md space-y-6">
            <h1 className="text-4xl font-bold leading-tight">Acesse sua conta</h1>
            <p className="text-lg leading-relaxed text-sidebar-foreground/70">
              Entre com suas credenciais para continuar no fluxo da plataforma de documentos para
              contratações públicas.
            </p>
          </div>
        </div>

        <div className="space-y-8">
          <div className="flex items-start gap-4">
            <div className="rounded-lg bg-sidebar-accent p-2">
              <Shield className="h-5 w-5 text-sidebar-primary" />
            </div>
            <div>
              <h2 className="mb-1 font-medium">Segurança e Conformidade</h2>
              <p className="text-sm text-sidebar-foreground/60">
                O acesso preserva a política atual de autenticação e sessão do ambiente.
              </p>
            </div>
          </div>

          <Separator className="bg-sidebar-border" />

          <p className="text-sm text-sidebar-foreground/50">
            Plataforma desenvolvida para o setor público brasileiro.
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
              <CardTitle className="text-2xl font-semibold">Acesse sua conta</CardTitle>
              <CardDescription className="text-muted-foreground">
                Entre com suas credenciais para continuar.
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
                      autoComplete="email"
                      className="pl-10"
                      placeholder="seu@email.gov.br"
                      required
                      value={email}
                      onChange={(event) => setEmail(event.target.value)}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="password">Senha</Label>
                    <Link
                      to="/recuperar-senha"
                      className="text-sm text-primary transition-colors hover:text-primary/80"
                    >
                      Esqueceu a senha?
                    </Link>
                  </div>

                  <div className="relative">
                    <Lock className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      autoComplete="current-password"
                      className="pr-10 pl-10"
                      placeholder="Digite sua senha"
                      required
                      value={password}
                      onChange={(event) => setPassword(event.target.value)}
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

                <div className="flex items-center gap-2">
                  <Checkbox
                    id="remember-me"
                    checked={rememberMe}
                    onCheckedChange={(checked) => setRememberMe(checked === true)}
                  />
                  <Label
                    htmlFor="remember-me"
                    className="cursor-pointer font-normal text-muted-foreground"
                  >
                    Manter conectado
                  </Label>
                </div>

                {errorMessage ? (
                  <p className="text-sm text-destructive" role="alert">
                    {errorMessage}
                  </p>
                ) : null}

                <Button className="w-full" size="lg" type="submit" disabled={signIn.isPending}>
                  {signIn.isPending ? (
                    <span className="flex items-center gap-2">Entrando...</span>
                  ) : (
                    <span className="flex items-center gap-2">
                      Entrar
                      <ArrowRight className="h-4 w-4" />
                    </span>
                  )}
                </Button>
              </form>

              <div className="mt-6 border-t border-border pt-6">
                <p className="text-center text-sm text-muted-foreground">
                  Não possui uma conta?{" "}
                  <Link
                    to="/cadastro"
                    className="font-medium text-primary transition-colors hover:text-primary/80"
                  >
                    Solicite acesso
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

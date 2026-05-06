import { ArrowLeft, Compass, Home, SearchX } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/shared/ui/button";
import { Card, CardContent } from "@/shared/ui/card";

export function NotFoundPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-6">
      <Card className="w-full max-w-lg border-border/50 shadow-lg">
        <CardContent className="space-y-6 pt-10 pb-8 text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-muted">
            <SearchX className="h-8 w-8 text-primary" />
          </div>
          <div className="space-y-2">
            <p className="text-sm font-medium uppercase tracking-[0.24em] text-muted-foreground">
              Erro 404
            </p>
            <h1 className="text-3xl font-semibold">Página não encontrada</h1>
            <p className="text-muted-foreground">
              O endereço informado não corresponde a nenhuma rota conhecida da aplicação.
            </p>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
            <Button asChild size="lg">
              <Link to="/">
                <Home className="mr-2 h-4 w-4" />
                Voltar para a página inicial
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline">
              <Link to="/entrar">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Ir para o login
              </Link>
            </Button>
          </div>
          <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
            <Compass className="h-4 w-4" />
            <span>Revise a URL ou retorne para um fluxo conhecido.</span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

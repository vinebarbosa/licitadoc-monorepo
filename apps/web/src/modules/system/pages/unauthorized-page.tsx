import { ArrowLeft, Home, ShieldAlert } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/shared/ui/button";
import { Card, CardContent } from "@/shared/ui/card";

export function UnauthorizedPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-6">
      <Card className="w-full max-w-lg border-border/50 shadow-lg">
        <CardContent className="space-y-6 pt-10 pb-8 text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-warning/15">
            <ShieldAlert className="h-8 w-8 text-warning-foreground" />
          </div>
          <div className="space-y-2">
            <p className="text-sm font-medium uppercase tracking-[0.24em] text-muted-foreground">
              Acesso negado
            </p>
            <h1 className="text-3xl font-semibold">Você não tem permissão para esta área</h1>
            <p className="text-muted-foreground">
              Sua sessão está ativa, mas o perfil atual não possui autorização para acessar esta
              rota.
            </p>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
            <Button asChild size="lg">
              <Link to="/">
                <Home className="mr-2 h-4 w-4" />
                Voltar para o início
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline">
              <Link to="/entrar">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Trocar de conta
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

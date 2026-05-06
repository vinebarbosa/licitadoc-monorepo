import { useQueryClient } from "@tanstack/react-query";
import { ArrowRight, Eye, EyeOff, Lock, User } from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { getAuthErrorMessage } from "@/modules/auth";
import { Button } from "@/shared/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/shared/ui/card";
import { Input } from "@/shared/ui/input";
import { Label } from "@/shared/ui/label";
import {
  invalidateSession,
  updateSessionUserAfterProfile,
  useCompleteOwnerProfile,
} from "../api/use-owner-onboarding";

const DEFAULT_PROFILE_ERROR = "Não foi possível concluir seu perfil. Tente novamente.";

export function MemberProfileOnboardingPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const completeProfile = useCompleteOwnerProfile();
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrorMessage(null);

    try {
      const user = await completeProfile.mutateAsync({
        data: {
          name,
          password,
        },
      });

      updateSessionUserAfterProfile(queryClient, user);
      await invalidateSession(queryClient);
      navigate("/app", { replace: true });
    } catch (error) {
      setErrorMessage(getAuthErrorMessage(error, DEFAULT_PROFILE_ERROR));
    }
  }

  return (
    <main className="min-h-screen bg-background px-4 py-10 sm:px-6">
      <div className="mx-auto flex min-h-[calc(100vh-5rem)] w-full max-w-xl items-center">
        <Card className="w-full border-border/60 shadow-sm">
          <CardHeader>
            <CardTitle>Bem-vindo ao LicitaDoc</CardTitle>
            <CardDescription>
              Informe seu nome e crie uma nova senha para acessar o sistema.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form className="space-y-5" onSubmit={handleSubmit}>
              <div className="space-y-2">
                <Label htmlFor="name">Nome</Label>
                <div className="relative">
                  <User className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="name"
                    autoComplete="name"
                    className="pl-10"
                    minLength={2}
                    required
                    value={name}
                    onChange={(event) => setName(event.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="new-password">Nova senha</Label>
                <div className="relative">
                  <Lock className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="new-password"
                    type={showPassword ? "text" : "password"}
                    autoComplete="new-password"
                    className="pr-10 pl-10"
                    minLength={8}
                    maxLength={128}
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

              {errorMessage ? (
                <p className="text-sm text-destructive" role="alert">
                  {errorMessage}
                </p>
              ) : null}

              <Button
                className="w-full"
                size="lg"
                type="submit"
                disabled={completeProfile.isPending}
              >
                <span className="flex items-center gap-2">
                  Acessar o sistema
                  <ArrowRight className="h-4 w-4" />
                </span>
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}

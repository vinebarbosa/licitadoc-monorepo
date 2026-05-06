import { useQueryClient } from "@tanstack/react-query";
import { ArrowRight, Eye, EyeOff, Lock, User } from "lucide-react";
import { useState } from "react";
import { getAuthErrorMessage, getAuthResponseMessage, useAuthSession } from "@/modules/auth";
import { Button } from "@/shared/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/shared/ui/dialog";
import { Input } from "@/shared/ui/input";
import { Label } from "@/shared/ui/label";
import {
  invalidateSession,
  updateSessionUserAfterProfile,
  useCompleteOwnerProfile,
} from "../api/use-owner-onboarding";

const DEFAULT_PROFILE_ERROR = "Não foi possível concluir seu cadastro. Tente novamente.";

type ProfileUser = Awaited<ReturnType<ReturnType<typeof useCompleteOwnerProfile>["mutateAsync"]>>;

function isProfileUser(value: unknown): value is ProfileUser {
  return (
    typeof value === "object" &&
    value !== null &&
    "id" in value &&
    "role" in value &&
    "onboardingStatus" in value
  );
}

export function MemberOnboardingModal() {
  const queryClient = useQueryClient();
  const { onboardingStatus, role } = useAuthSession();
  const completeProfile = useCompleteOwnerProfile();
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const isOpen = role === "member" && onboardingStatus === "pending_profile";

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

      if (!isProfileUser(user)) {
        setErrorMessage(getAuthResponseMessage(user) ?? DEFAULT_PROFILE_ERROR);
        return;
      }

      updateSessionUserAfterProfile(queryClient, user);
      await invalidateSession(queryClient);
    } catch (error) {
      setErrorMessage(getAuthErrorMessage(error, DEFAULT_PROFILE_ERROR));
    }
  }

  return (
    <Dialog open={isOpen}>
      <DialogContent
        showCloseButton={false}
        className="sm:max-w-md"
        onEscapeKeyDown={(event) => event.preventDefault()}
        onInteractOutside={(event) => event.preventDefault()}
        onPointerDownOutside={(event) => event.preventDefault()}
      >
        <DialogHeader>
          <DialogTitle>Complete seu cadastro</DialogTitle>
          <DialogDescription>Informe seu nome e crie uma nova senha.</DialogDescription>
        </DialogHeader>

        <form className="space-y-5" onSubmit={handleSubmit}>
          <div className="space-y-2">
            <Label htmlFor="member-onboarding-name">Nome</Label>
            <div className="relative">
              <User className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                id="member-onboarding-name"
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
            <Label htmlFor="member-onboarding-password">Nova senha</Label>
            <div className="relative">
              <Lock className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                id="member-onboarding-password"
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
                aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"}
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

          <Button className="w-full" type="submit" disabled={completeProfile.isPending}>
            <span className="flex items-center gap-2">
              Concluir cadastro
              <ArrowRight className="h-4 w-4" />
            </span>
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}

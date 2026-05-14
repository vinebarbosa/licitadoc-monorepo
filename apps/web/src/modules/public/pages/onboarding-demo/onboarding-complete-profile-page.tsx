import { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { ArrowRight, Check, Eye, EyeOff, Lock, Shield, User } from "lucide-react";
import { Button } from "@/shared/ui/button";
import { Card, CardContent } from "@/shared/ui/card";
import { Input } from "@/shared/ui/input";
import { Label } from "@/shared/ui/label";
import { cn } from "@/lib/utils";

// Demo data
const demoUser = {
  email: "maria.santos@prefeitura.sp.gov.br",
  tempName: "Maria",
};

type OnboardingStep = "profile" | "organization" | "complete";

function StepIndicator({ 
  currentStep, 
  isOrgAdmin 
}: { 
  currentStep: OnboardingStep;
  isOrgAdmin: boolean;
}) {
  const steps = isOrgAdmin 
    ? [
        { id: "profile", label: "Perfil", description: "Seus dados" },
        { id: "organization", label: "Organização", description: "Dados do órgão" },
        { id: "complete", label: "Pronto", description: "Acesso liberado" },
      ]
    : [
        { id: "profile", label: "Perfil", description: "Seus dados" },
        { id: "complete", label: "Pronto", description: "Acesso liberado" },
      ];

  const currentIndex = steps.findIndex(s => s.id === currentStep);

  return (
    <div className="flex items-center justify-center gap-2">
      {steps.map((step, index) => {
        const isActive = index === currentIndex;
        const isComplete = index < currentIndex;
        const isLast = index === steps.length - 1;

        return (
          <div key={step.id} className="flex items-center">
            <div className="flex flex-col items-center">
              <div
                className={cn(
                  "flex h-8 w-8 items-center justify-center rounded-full text-xs font-semibold transition-all",
                  isActive && "bg-primary text-primary-foreground",
                  isComplete && "bg-primary/10 text-primary",
                  !isActive && !isComplete && "bg-muted text-muted-foreground"
                )}
              >
                {isComplete ? <Check className="h-4 w-4" /> : index + 1}
              </div>
              <span className={cn(
                "mt-1.5 text-xs font-medium",
                isActive ? "text-foreground" : "text-muted-foreground"
              )}>
                {step.label}
              </span>
            </div>
            {!isLast && (
              <div className={cn(
                "mx-3 h-0.5 w-12 rounded-full",
                isComplete ? "bg-primary/30" : "bg-muted"
              )} />
            )}
          </div>
        );
      })}
    </div>
  );
}

function PasswordStrength({ password }: { password: string }) {
  const getStrength = (pwd: string) => {
    let score = 0;
    if (pwd.length >= 8) score++;
    if (pwd.length >= 12) score++;
    if (/[A-Z]/.test(pwd)) score++;
    if (/[0-9]/.test(pwd)) score++;
    if (/[^A-Za-z0-9]/.test(pwd)) score++;
    return score;
  };

  const strength = getStrength(password);
  const labels = ["", "Fraca", "Razoável", "Boa", "Forte", "Excelente"];
  const colors = ["", "bg-red-500", "bg-orange-500", "bg-yellow-500", "bg-emerald-500", "bg-emerald-600"];

  if (!password) return null;

  return (
    <div className="mt-2 space-y-1.5">
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((level) => (
          <div
            key={level}
            className={cn(
              "h-1 flex-1 rounded-full transition-colors",
              level <= strength ? colors[strength] : "bg-muted"
            )}
          />
        ))}
      </div>
      <p className={cn(
        "text-xs",
        strength >= 4 ? "text-emerald-600" : strength >= 2 ? "text-muted-foreground" : "text-red-500"
      )}>
        Força da senha: {labels[strength]}
      </p>
    </div>
  );
}

export function OnboardingCompleteProfilePage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const isOrgAdmin = searchParams.get("role") === "admin";
  
  const [formData, setFormData] = useState({
    fullName: "",
    password: "",
    confirmPassword: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    if (isOrgAdmin) {
      navigate("/demo/onboarding/organizacao");
    } else {
      navigate("/demo/onboarding/concluido");
    }
  };

  const isValid = 
    formData.fullName.length >= 3 && 
    formData.password.length >= 8 && 
    formData.password === formData.confirmPassword;

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
          <div className="text-sm text-muted-foreground">
            {demoUser.email}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto max-w-2xl px-4 py-12">
        {/* Progress */}
        <div className="mb-10">
          <StepIndicator currentStep="profile" isOrgAdmin={isOrgAdmin} />
        </div>

        {/* Welcome Section */}
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10">
            <User className="h-7 w-7 text-primary" />
          </div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">
            Bem-vindo ao LicitaDoc, {demoUser.tempName}
          </h1>
          <p className="mt-2 text-muted-foreground">
            Vamos configurar seu perfil para começar a usar a plataforma.
          </p>
        </div>

        {/* Form Card */}
        <Card className="border-muted/50">
          <CardContent className="p-6 sm:p-8">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Full Name */}
              <div className="space-y-2">
                <Label htmlFor="fullName" className="text-sm font-medium">
                  Nome completo
                </Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground/60" />
                  <Input
                    id="fullName"
                    type="text"
                    placeholder="Seu nome completo"
                    value={formData.fullName}
                    onChange={(e) => setFormData(prev => ({ ...prev, fullName: e.target.value }))}
                    className="pl-10"
                    autoFocus
                  />
                </div>
              </div>

              {/* Password Section */}
              <div className="space-y-4 rounded-lg border border-muted/50 bg-muted/20 p-4">
                <div className="flex items-center gap-2 text-sm font-medium text-foreground/80">
                  <Shield className="h-4 w-4 text-primary/70" />
                  <span>Criar nova senha</span>
                </div>
                <p className="text-xs text-muted-foreground">
                  Substitua sua senha provisória por uma senha segura de sua escolha.
                </p>

                {/* New Password */}
                <div className="space-y-2">
                  <Label htmlFor="password" className="text-sm font-medium">
                    Nova senha
                  </Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground/60" />
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      placeholder="Mínimo 8 caracteres"
                      value={formData.password}
                      onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
                      className="pl-10 pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground/60 hover:text-muted-foreground"
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                  <PasswordStrength password={formData.password} />
                </div>

                {/* Confirm Password */}
                <div className="space-y-2">
                  <Label htmlFor="confirmPassword" className="text-sm font-medium">
                    Confirmar senha
                  </Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground/60" />
                    <Input
                      id="confirmPassword"
                      type={showConfirmPassword ? "text" : "password"}
                      placeholder="Digite a senha novamente"
                      value={formData.confirmPassword}
                      onChange={(e) => setFormData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                      className="pl-10 pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground/60 hover:text-muted-foreground"
                    >
                      {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                  {formData.confirmPassword && formData.password !== formData.confirmPassword && (
                    <p className="text-xs text-red-500">As senhas não coincidem</p>
                  )}
                </div>
              </div>

              {/* Submit */}
              <Button 
                type="submit" 
                className="w-full"
                disabled={!isValid || isSubmitting}
              >
                {isSubmitting ? (
                  "Salvando..."
                ) : (
                  <>
                    Continuar
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Security Note */}
        <p className="mt-6 text-center text-xs text-muted-foreground/70">
          Seus dados estão protegidos e serão usados apenas para acesso à plataforma.
        </p>
      </main>
    </div>
  );
}

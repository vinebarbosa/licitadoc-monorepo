import {
  ArrowLeft,
  ArrowRight,
  Building2,
  Check,
  CheckCircle2,
  Eye,
  EyeOff,
  Globe,
  Hash,
  Lock,
  Mail,
  MapPin,
  Phone,
  Shield,
  Sparkles,
  User,
  Users,
} from "lucide-react";
import type { ElementType, FormEventHandler, ReactNode } from "react";
import { Link } from "react-router-dom";
import { cn } from "@/shared/lib/utils";
import { Button } from "@/shared/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/shared/ui/card";
import { Input } from "@/shared/ui/input";
import { Label } from "@/shared/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/shared/ui/select";

export type OnboardingRole = "organization_owner" | "member";
type OnboardingStep = "profile" | "organization" | "complete";

export type ProfileFormData = {
  fullName: string;
  password: string;
  confirmPassword: string;
};

export type OrganizationFormData = {
  name: string;
  slug: string;
  officialName: string;
  cnpj: string;
  city: string;
  state: string;
  address: string;
  cep: string;
  phone: string;
  email: string;
  website: string;
  authorityName: string;
  authorityRole: string;
};

export const brazilianStates = [
  "AC",
  "AL",
  "AP",
  "AM",
  "BA",
  "CE",
  "DF",
  "ES",
  "GO",
  "MA",
  "MT",
  "MS",
  "MG",
  "PA",
  "PB",
  "PR",
  "PE",
  "PI",
  "RJ",
  "RN",
  "RS",
  "RO",
  "RR",
  "SC",
  "SP",
  "SE",
  "TO",
] as const;

export function createEmptyOrganizationFormData(): OrganizationFormData {
  return {
    name: "",
    slug: "",
    officialName: "",
    cnpj: "",
    city: "",
    state: "",
    address: "",
    cep: "",
    phone: "",
    email: "",
    website: "",
    authorityName: "",
    authorityRole: "",
  };
}

export function normalizeSlug(value: string) {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function formatCnpj(value: string) {
  const numbers = value.replace(/\D/g, "");

  return numbers
    .replace(/(\d{2})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d)/, "$1/$2")
    .replace(/(\d{4})(\d)/, "$1-$2")
    .slice(0, 18);
}

export function formatCep(value: string) {
  const numbers = value.replace(/\D/g, "");

  return numbers.replace(/(\d{5})(\d)/, "$1-$2").slice(0, 9);
}

export function formatPhone(value: string) {
  const numbers = value.replace(/\D/g, "");

  if (numbers.length <= 10) {
    return numbers.replace(/(\d{2})(\d)/, "($1) $2").replace(/(\d{4})(\d)/, "$1-$2");
  }

  return numbers
    .replace(/(\d{2})(\d)/, "($1) $2")
    .replace(/(\d{5})(\d)/, "$1-$2")
    .slice(0, 15);
}

function getFirstName(fullName: string) {
  const trimmedName = fullName.trim();

  if (!trimmedName) {
    return "você";
  }

  return trimmedName.split(/\s+/)[0] ?? "você";
}

function getInitials(fullName: string, fallbackEmail: string) {
  const source = fullName.trim() || fallbackEmail.trim();

  return source
    .split(/[\s@.]+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((token) => token[0]?.toUpperCase() ?? "")
    .join("");
}

function OnboardingHeader({
  email,
  fullName,
}: {
  email: string;
  fullName?: string;
}) {
  const initials = getInitials(fullName ?? "", email);

  return (
    <header className="border-b bg-background/80 backdrop-blur-sm">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <Link to="/" className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
            <span className="text-sm font-bold text-primary-foreground">LD</span>
          </div>
          <span className="text-lg font-semibold tracking-tight">LicitaDoc</span>
        </Link>
        {fullName ? (
          <div className="flex items-center gap-3">
            <div className="hidden text-right sm:block">
              <p className="text-sm font-medium">{fullName}</p>
              <p className="text-xs text-muted-foreground">{email}</p>
            </div>
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10">
              <span className="text-sm font-semibold text-primary">{initials}</span>
            </div>
          </div>
        ) : (
          <div className="text-sm text-muted-foreground">{email}</div>
        )}
      </div>
    </header>
  );
}

function StepIndicator({
  currentStep,
  role,
}: {
  currentStep: OnboardingStep;
  role: OnboardingRole;
}) {
  const steps =
    role === "organization_owner"
      ? [
          { id: "profile", label: "Perfil" },
          { id: "organization", label: "Organização" },
          { id: "complete", label: "Pronto" },
        ]
      : [
          { id: "profile", label: "Perfil" },
          { id: "complete", label: "Pronto" },
        ];
  const currentIndex = steps.findIndex((step) => step.id === currentStep);

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
                  !isActive && !isComplete && "bg-muted text-muted-foreground",
                )}
              >
                {isComplete ? <Check className="h-4 w-4" /> : index + 1}
              </div>
              <span
                className={cn(
                  "mt-1.5 text-xs font-medium",
                  isActive ? "text-foreground" : "text-muted-foreground",
                )}
              >
                {step.label}
              </span>
            </div>
            {!isLast ? (
              <div
                className={cn(
                  "mx-3 h-0.5 w-12 rounded-full",
                  isComplete ? "bg-primary/30" : "bg-muted",
                )}
              />
            ) : null}
          </div>
        );
      })}
    </div>
  );
}

function PasswordStrength({ password }: { password: string }) {
  const getStrength = (value: string) => {
    let score = 0;
    if (value.length >= 8) score += 1;
    if (value.length >= 12) score += 1;
    if (/[A-Z]/.test(value)) score += 1;
    if (/[0-9]/.test(value)) score += 1;
    if (/[^A-Za-z0-9]/.test(value)) score += 1;

    return score;
  };

  const strength = getStrength(password);
  const labels = ["", "Fraca", "Razoavel", "Boa", "Forte", "Excelente"];
  const colors = [
    "",
    "bg-red-500",
    "bg-orange-500",
    "bg-yellow-500",
    "bg-emerald-500",
    "bg-emerald-600",
  ];

  if (!password) {
    return null;
  }

  return (
    <div className="mt-2 space-y-1.5">
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((level) => (
          <div
            key={level}
            className={cn(
              "h-1 flex-1 rounded-full transition-colors",
              level <= strength ? colors[strength] : "bg-muted",
            )}
          />
        ))}
      </div>
      <p
        className={cn(
          "text-xs",
          strength >= 4
            ? "text-emerald-600"
            : strength >= 2
              ? "text-muted-foreground"
              : "text-red-500",
        )}
      >
        Forca da senha: {labels[strength]}
      </p>
    </div>
  );
}

function FormSection({
  title,
  description,
  icon: Icon,
  children,
}: {
  title: string;
  description?: string;
  icon: ElementType;
  children: ReactNode;
}) {
  return (
    <Card className="border-muted/50">
      <CardHeader className="pb-4">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-muted/60">
            <Icon className="h-4 w-4 text-muted-foreground" />
          </div>
          <div>
            <CardTitle className="text-sm font-semibold">{title}</CardTitle>
            {description ? <CardDescription className="text-xs">{description}</CardDescription> : null}
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">{children}</CardContent>
    </Card>
  );
}

function ErrorMessage({ message }: { message?: string | null }) {
  if (!message) {
    return null;
  }

  return (
    <div
      role="alert"
      className="rounded-lg border border-destructive/20 bg-destructive/5 px-4 py-3 text-sm text-destructive"
    >
      {message}
    </div>
  );
}

export function ProfileOnboardingView({
  role,
  email,
  temporaryName,
  formData,
  showPassword,
  showConfirmPassword,
  isSubmitting = false,
  errorMessage,
  onFormDataChange,
  onTogglePassword,
  onToggleConfirmPassword,
  onSubmit,
}: {
  role: OnboardingRole;
  email: string;
  temporaryName?: string;
  formData: ProfileFormData;
  showPassword: boolean;
  showConfirmPassword: boolean;
  isSubmitting?: boolean;
  errorMessage?: string | null;
  onFormDataChange: (nextData: ProfileFormData) => void;
  onTogglePassword: () => void;
  onToggleConfirmPassword: () => void;
  onSubmit: FormEventHandler<HTMLFormElement>;
}) {
  const isValid =
    formData.fullName.trim().length >= 3 &&
    formData.password.length >= 8 &&
    formData.password === formData.confirmPassword;

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20">
      <OnboardingHeader email={email} />

      <main className="container mx-auto max-w-2xl px-4 py-12">
        <div className="mb-10">
          <StepIndicator currentStep="profile" role={role} />
        </div>

        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10">
            <User className="h-7 w-7 text-primary" />
          </div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">
            Bem-vindo ao LicitaDoc, {getFirstName(temporaryName ?? formData.fullName)}
          </h1>
          <p className="mt-2 text-muted-foreground">
            Vamos configurar seu perfil para comecar a usar a plataforma.
          </p>
        </div>

        <Card className="border-muted/50">
          <CardContent className="p-6 sm:p-8">
            <form onSubmit={onSubmit} className="space-y-6">
              <ErrorMessage message={errorMessage} />

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
                    onChange={(event) =>
                      onFormDataChange({ ...formData, fullName: event.target.value })
                    }
                    className="pl-10"
                    autoFocus
                  />
                </div>
              </div>

              <div className="space-y-4 rounded-lg border border-muted/50 bg-muted/20 p-4">
                <div className="flex items-center gap-2 text-sm font-medium text-foreground/80">
                  <Shield className="h-4 w-4 text-primary/70" />
                  <span>Criar nova senha</span>
                </div>
                <p className="text-xs text-muted-foreground">
                  Substitua sua senha provisoria por uma senha segura de sua escolha.
                </p>

                <div className="space-y-2">
                  <Label htmlFor="password" className="text-sm font-medium">
                    Nova senha
                  </Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground/60" />
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      placeholder="Minimo 8 caracteres"
                      value={formData.password}
                      onChange={(event) =>
                        onFormDataChange({ ...formData, password: event.target.value })
                      }
                      className="pl-10 pr-10"
                    />
                    <button
                      type="button"
                      onClick={onTogglePassword}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground/60 hover:text-muted-foreground"
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                  <PasswordStrength password={formData.password} />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirmPassword" className="text-sm font-medium">
                    Confirmar nova senha
                  </Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground/60" />
                    <Input
                      id="confirmPassword"
                      type={showConfirmPassword ? "text" : "password"}
                      placeholder="Repita sua nova senha"
                      value={formData.confirmPassword}
                      onChange={(event) =>
                        onFormDataChange({ ...formData, confirmPassword: event.target.value })
                      }
                      className="pl-10 pr-10"
                    />
                    <button
                      type="button"
                      onClick={onToggleConfirmPassword}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground/60 hover:text-muted-foreground"
                    >
                      {showConfirmPassword ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                  {formData.confirmPassword &&
                  formData.password !== formData.confirmPassword ? (
                    <p className="text-xs text-red-500">As senhas precisam ser iguais.</p>
                  ) : null}
                </div>
              </div>

              <div className="rounded-lg border border-primary/10 bg-primary/5 p-4">
                <div className="flex gap-3">
                  <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                    <Shield className="h-4 w-4 text-primary" />
                  </div>
                  <div>
                    <h2 className="text-sm font-medium text-foreground">Seu acesso será ativado agora</h2>
                    <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                      Depois de concluir esta etapa, você segue para a configuração final do seu
                      ambiente.
                    </p>
                  </div>
                </div>
              </div>

              <Button type="submit" className="w-full sm:w-auto" size="lg" disabled={!isValid || isSubmitting}>
                {isSubmitting ? "Salvando..." : "Continuar"}
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </form>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}

export function OrganizationOnboardingView({
  email,
  fullName,
  formData,
  isSubmitting = false,
  errorMessage,
  backHref,
  onFormDataChange,
  onSubmit,
}: {
  email: string;
  fullName: string;
  formData: OrganizationFormData;
  isSubmitting?: boolean;
  errorMessage?: string | null;
  backHref: string;
  onFormDataChange: (nextData: OrganizationFormData) => void;
  onSubmit: FormEventHandler<HTMLFormElement>;
}) {
  const isValid =
    formData.name.trim().length >= 3 &&
    normalizeSlug(formData.slug || formData.name).length > 0 &&
    formData.officialName.trim().length >= 3 &&
    formData.cnpj.replace(/\D/g, "").length === 14 &&
    formData.city.trim().length >= 2 &&
    formData.state.trim().length === 2 &&
    formData.address.trim().length >= 5 &&
    formData.cep.replace(/\D/g, "").length === 8 &&
    formData.phone.replace(/\D/g, "").length >= 10 &&
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email.trim()) &&
    formData.authorityName.trim().length >= 3 &&
    formData.authorityRole.trim().length >= 3;

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20">
      <OnboardingHeader email={email} fullName={fullName} />

      <main className="container mx-auto max-w-3xl px-4 py-10">
        <div className="mb-8">
          <StepIndicator currentStep="organization" role="organization_owner" />
        </div>

        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10">
            <Building2 className="h-7 w-7 text-primary" />
          </div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">
            Configure sua organização
          </h1>
          <p className="mt-2 text-muted-foreground">
            Cadastre os dados do órgão ou entidade que ficará vinculada à sua conta.
          </p>
        </div>

        <form onSubmit={onSubmit} className="space-y-6">
          <ErrorMessage message={errorMessage} />

          <FormSection
            title="Identificação institucional"
            description="Dados básicos da organização"
            icon={Building2}
          >
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="name">Nome da organização *</Label>
                <Input
                  id="name"
                  placeholder="Ex: Prefeitura de São Paulo"
                  value={formData.name}
                  onChange={(event) =>
                    onFormDataChange({ ...formData, name: event.target.value })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="slug">Identificador (slug)</Label>
                <div className="relative">
                  <Hash className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground/60" />
                  <Input
                    id="slug"
                    placeholder="prefeitura-sp"
                    value={formData.slug}
                    onChange={(event) =>
                      onFormDataChange({
                        ...formData,
                        slug: normalizeSlug(event.target.value),
                      })
                    }
                    className="pl-10"
                  />
                </div>
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="officialName">Nome oficial *</Label>
                <Input
                  id="officialName"
                  placeholder="Razão social completa"
                  value={formData.officialName}
                  onChange={(event) =>
                    onFormDataChange({ ...formData, officialName: event.target.value })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="cnpj">CNPJ *</Label>
                <Input
                  id="cnpj"
                  placeholder="00.000.000/0000-00"
                  value={formData.cnpj}
                  onChange={(event) =>
                    onFormDataChange({ ...formData, cnpj: formatCnpj(event.target.value) })
                  }
                  maxLength={18}
                />
              </div>
            </div>
          </FormSection>

          <FormSection
            title="Localização e contato"
            description="Onde a organização está sediada e como ela pode ser contatada"
            icon={MapPin}
          >
            <div className="grid gap-4 sm:grid-cols-[1fr_112px]">
              <div className="space-y-2">
                <Label htmlFor="city">Cidade *</Label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground/60" />
                  <Input
                    id="city"
                    placeholder="Ex: São Paulo"
                    value={formData.city}
                    onChange={(event) =>
                      onFormDataChange({ ...formData, city: event.target.value })
                    }
                    className="pl-10"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="state">UF *</Label>
                <Select
                  value={formData.state}
                  onValueChange={(value) => onFormDataChange({ ...formData, state: value })}
                >
                  <SelectTrigger id="state">
                    <SelectValue placeholder="UF" />
                  </SelectTrigger>
                  <SelectContent>
                    {brazilianStates.map((state) => (
                      <SelectItem key={state} value={state}>
                        {state}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="address">Endereço *</Label>
              <Input
                id="address"
                placeholder="Rua, número e complemento"
                value={formData.address}
                onChange={(event) =>
                  onFormDataChange({ ...formData, address: event.target.value })
                }
              />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="cep">CEP *</Label>
                <Input
                  id="cep"
                  placeholder="00000-000"
                  value={formData.cep}
                  onChange={(event) =>
                    onFormDataChange({ ...formData, cep: formatCep(event.target.value) })
                  }
                  maxLength={9}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Telefone *</Label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground/60" />
                  <Input
                    id="phone"
                    placeholder="(11) 3333-0000"
                    value={formData.phone}
                    onChange={(event) =>
                      onFormDataChange({ ...formData, phone: formatPhone(event.target.value) })
                    }
                    className="pl-10"
                  />
                </div>
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="email">E-mail institucional *</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground/60" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="contato@orgão.gov.br"
                    value={formData.email}
                    onChange={(event) =>
                      onFormDataChange({ ...formData, email: event.target.value })
                    }
                    className="pl-10"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="website">Site institucional</Label>
                <div className="relative">
                  <Globe className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground/60" />
                  <Input
                    id="website"
                    placeholder="https://www.orgao.gov.br"
                    value={formData.website}
                    onChange={(event) =>
                      onFormDataChange({ ...formData, website: event.target.value })
                    }
                    className="pl-10"
                  />
                </div>
              </div>
            </div>
          </FormSection>

          <FormSection
            title="Autoridade responsável"
            description="Pessoa que representa institucionalmente a organização"
            icon={User}
          >
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="authorityName">Nome da autoridade *</Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground/60" />
                  <Input
                    id="authorityName"
                    placeholder="Nome completo"
                    value={formData.authorityName}
                    onChange={(event) =>
                      onFormDataChange({ ...formData, authorityName: event.target.value })
                    }
                    className="pl-10"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="authorityRole">Cargo *</Label>
                <Input
                  id="authorityRole"
                  placeholder="Ex: Prefeita, Secretário"
                  value={formData.authorityRole}
                  onChange={(event) =>
                    onFormDataChange({ ...formData, authorityRole: event.target.value })
                  }
                />
              </div>
            </div>
          </FormSection>

          <div className="flex flex-col gap-3 sm:flex-row sm:justify-between">
            <Button asChild variant="ghost" size="lg">
              <Link to={backHref}>
                <ArrowLeft className="mr-2 h-4 w-4" />
                Voltar
              </Link>
            </Button>
            <Button type="submit" size="lg" disabled={!isValid || isSubmitting}>
              {isSubmitting ? "Salvando..." : "Finalizar configuração"}
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        </form>
      </main>
    </div>
  );
}

function FeatureCard({
  icon: Icon,
  title,
  description,
}: {
  icon: ElementType;
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

export function CompletionOnboardingView({
  role,
  fullName,
  email,
  organizationName,
  continueHref,
}: {
  role: OnboardingRole;
  fullName: string;
  email: string;
  organizationName?: string | null;
  continueHref: string;
}) {
  const isOrgAdmin = role === "organization_owner";

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20">
      <OnboardingHeader email={email} fullName={fullName} />

      <main className="container mx-auto max-w-2xl px-4 py-16">
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

        <div className="mb-10 text-center">
          <h1 className="text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
            Tudo pronto, {getFirstName(fullName)}!
          </h1>
          <p className="mt-3 text-muted-foreground">
            {isOrgAdmin
              ? "Sua conta e organização foram configuradas com sucesso. Você já pode começar a usar o LicitaDoc."
              : "Seu perfil foi configurado com sucesso. Você já pode acessar a plataforma."}
          </p>
        </div>

        <Card className="mb-8 border-muted/50">
          <CardContent className="p-6">
            <h2 className="mb-4 text-sm font-semibold text-muted-foreground">
              Resumo da configuração
            </h2>
            <div className="space-y-3">
              <CompletedItem label="Perfil pessoal configurado" />
              <CompletedItem label="Senha de acesso definida" />
              {isOrgAdmin ? <CompletedItem label="Organização cadastrada" /> : null}
              {isOrgAdmin ? <CompletedItem label="Dados institucionais salvos" /> : null}
              <CompletedItem label="Acesso à plataforma liberado" />
            </div>

            {organizationName ? (
              <div className="mt-6 rounded-lg border border-muted/50 bg-muted/20 p-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                    {isOrgAdmin ? (
                      <Building2 className="h-5 w-5 text-primary" />
                    ) : (
                      <Users className="h-5 w-5 text-primary" />
                    )}
                  </div>
                  <div>
                    <p className="text-sm font-medium">{organizationName}</p>
                    <p className="text-xs text-muted-foreground">
                      {isOrgAdmin ? "Organização vinculada" : "Você foi adicionado a esta organização"}
                    </p>
                  </div>
                </div>
              </div>
            ) : null}
          </CardContent>
        </Card>

        <div className="mb-10">
          <h2 className="mb-4 text-center text-sm font-semibold text-muted-foreground">
            O que você pode fazer agora
          </h2>
          <div className="grid gap-2 sm:grid-cols-2">
            <FeatureCard
              icon={Building2}
              title="Organizar processos"
              description="Estruture processos de contratação com clareza"
            />
            <FeatureCard
              icon={Users}
              title="Trabalhar em equipe"
              description="Colabore com as pessoas certas em cada etapa"
            />
            <FeatureCard
              icon={Shield}
              title="Manter conformidade"
              description="Avance com mais confiança e contexto institucional"
            />
            <FeatureCard
              icon={Sparkles}
              title="Ganhar velocidade"
              description="Comece a gerar documentos e operar com mais fluidez"
            />
          </div>
        </div>

        <div className="text-center">
          <Link to={continueHref}>
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

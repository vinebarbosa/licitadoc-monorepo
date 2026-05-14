import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  ArrowRight,
  Building2,
  Check,
  Globe,
  Mail,
  MapPin,
  Phone,
  User,
  Hash,
} from "lucide-react";
import { Button } from "@/shared/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/shared/ui/card";
import { Input } from "@/shared/ui/input";
import { Label } from "@/shared/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/ui/select";
import { cn } from "@/lib/utils";

// Demo data
const demoUser = {
  email: "maria.santos@prefeitura.sp.gov.br",
  fullName: "Maria da Silva Santos",
};

const brazilianStates = [
  "AC", "AL", "AP", "AM", "BA", "CE", "DF", "ES", "GO", "MA",
  "MT", "MS", "MG", "PA", "PB", "PR", "PE", "PI", "RJ", "RN",
  "RS", "RO", "RR", "SC", "SP", "SE", "TO"
];

type OnboardingStep = "profile" | "organization" | "complete";

function StepIndicator({ currentStep }: { currentStep: OnboardingStep }) {
  const steps = [
    { id: "profile", label: "Perfil", description: "Seus dados" },
    { id: "organization", label: "Organização", description: "Dados do órgão" },
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

function FormSection({ 
  title, 
  description, 
  icon: Icon, 
  children 
}: { 
  title: string;
  description?: string;
  icon: React.ElementType;
  children: React.ReactNode;
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
            {description && (
              <CardDescription className="text-xs">{description}</CardDescription>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {children}
      </CardContent>
    </Card>
  );
}

export function OnboardingOrganizationPage() {
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [formData, setFormData] = useState({
    // Identification
    name: "",
    slug: "",
    officialName: "",
    cnpj: "",
    // Location
    city: "",
    state: "",
    address: "",
    cep: "",
    // Contact
    phone: "",
    email: "",
    website: "",
    // Authority
    authorityName: "",
    authorityRole: "",
  });

  const updateField = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const formatCNPJ = (value: string) => {
    const numbers = value.replace(/\D/g, '');
    return numbers
      .replace(/(\d{2})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d)/, '$1/$2')
      .replace(/(\d{4})(\d)/, '$1-$2')
      .slice(0, 18);
  };

  const formatCEP = (value: string) => {
    const numbers = value.replace(/\D/g, '');
    return numbers.replace(/(\d{5})(\d)/, '$1-$2').slice(0, 9);
  };

  const formatPhone = (value: string) => {
    const numbers = value.replace(/\D/g, '');
    if (numbers.length <= 10) {
      return numbers
        .replace(/(\d{2})(\d)/, '($1) $2')
        .replace(/(\d{4})(\d)/, '$1-$2');
    }
    return numbers
      .replace(/(\d{2})(\d)/, '($1) $2')
      .replace(/(\d{5})(\d)/, '$1-$2')
      .slice(0, 15);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    navigate("/demo/onboarding/concluido?role=admin");
  };

  const isValid = 
    formData.name.length >= 3 &&
    formData.officialName.length >= 3 &&
    formData.cnpj.length === 18 &&
    formData.city.length >= 2 &&
    formData.state.length === 2 &&
    formData.authorityName.length >= 3 &&
    formData.authorityRole.length >= 3;

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
              <p className="text-sm font-medium">{demoUser.fullName}</p>
              <p className="text-xs text-muted-foreground">{demoUser.email}</p>
            </div>
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10">
              <span className="text-sm font-semibold text-primary">
                {demoUser.fullName.split(' ').map(n => n[0]).slice(0, 2).join('')}
              </span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto max-w-3xl px-4 py-10">
        {/* Progress */}
        <div className="mb-8">
          <StepIndicator currentStep="organization" />
        </div>

        {/* Header Section */}
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

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Institutional Identification */}
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
                  onChange={(e) => updateField('name', e.target.value)}
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
                    onChange={(e) => updateField('slug', e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
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
                  onChange={(e) => updateField('officialName', e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="cnpj">CNPJ *</Label>
                <Input
                  id="cnpj"
                  placeholder="00.000.000/0000-00"
                  value={formData.cnpj}
                  onChange={(e) => updateField('cnpj', formatCNPJ(e.target.value))}
                  maxLength={18}
                />
              </div>
            </div>
          </FormSection>

          {/* Location & Contact */}
          <FormSection 
            title="Localização e contato" 
            description="Endereço e informações de contato"
            icon={MapPin}
          >
            <div className="grid gap-4 sm:grid-cols-3">
              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="city">Cidade *</Label>
                <Input
                  id="city"
                  placeholder="Nome da cidade"
                  value={formData.city}
                  onChange={(e) => updateField('city', e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="state">UF *</Label>
                <Select value={formData.state} onValueChange={(value) => updateField('state', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="UF" />
                  </SelectTrigger>
                  <SelectContent>
                    {brazilianStates.map((state) => (
                      <SelectItem key={state} value={state}>{state}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-3">
              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="address">Endereço</Label>
                <Input
                  id="address"
                  placeholder="Rua, número, complemento"
                  value={formData.address}
                  onChange={(e) => updateField('address', e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="cep">CEP</Label>
                <Input
                  id="cep"
                  placeholder="00000-000"
                  value={formData.cep}
                  onChange={(e) => updateField('cep', formatCEP(e.target.value))}
                  maxLength={9}
                />
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="phone">Telefone</Label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground/60" />
                  <Input
                    id="phone"
                    placeholder="(00) 00000-0000"
                    value={formData.phone}
                    onChange={(e) => updateField('phone', formatPhone(e.target.value))}
                    className="pl-10"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">E-mail institucional</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground/60" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="contato@orgao.gov.br"
                    value={formData.email}
                    onChange={(e) => updateField('email', e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
            </div>
          </FormSection>

          {/* Digital Presence */}
          <FormSection 
            title="Presença digital" 
            description="Site e redes (opcional)"
            icon={Globe}
          >
            <div className="space-y-2">
              <Label htmlFor="website">Site institucional</Label>
              <div className="relative">
                <Globe className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground/60" />
                <Input
                  id="website"
                  placeholder="https://www.orgao.gov.br"
                  value={formData.website}
                  onChange={(e) => updateField('website', e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
          </FormSection>

          {/* Responsible Authority */}
          <FormSection 
            title="Autoridade responsável" 
            description="Representante legal da organização"
            icon={User}
          >
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="authorityName">Nome completo *</Label>
                <Input
                  id="authorityName"
                  placeholder="Nome da autoridade"
                  value={formData.authorityName}
                  onChange={(e) => updateField('authorityName', e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="authorityRole">Cargo *</Label>
                <Input
                  id="authorityRole"
                  placeholder="Ex: Prefeito, Secretário"
                  value={formData.authorityRole}
                  onChange={(e) => updateField('authorityRole', e.target.value)}
                />
              </div>
            </div>
          </FormSection>

          {/* Actions */}
          <div className="flex items-center justify-between pt-4">
            <Button 
              type="button" 
              variant="ghost"
              onClick={() => navigate("/demo/onboarding/perfil?role=admin")}
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Voltar
            </Button>
            <Button 
              type="submit"
              disabled={!isValid || isSubmitting}
            >
              {isSubmitting ? (
                "Salvando..."
              ) : (
                <>
                  Finalizar cadastro
                  <ArrowRight className="ml-2 h-4 w-4" />
                </>
              )}
            </Button>
          </div>
        </form>

        {/* Note */}
        <p className="mt-8 text-center text-xs text-muted-foreground/70">
          Campos marcados com * são obrigatórios. Você poderá editar esses dados posteriormente.
        </p>
      </main>
    </div>
  );
}

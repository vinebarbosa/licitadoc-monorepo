import { useQueryClient } from "@tanstack/react-query";
import { Building2, Check, LinkIcon, Mail, MapPin, Phone, UserRound } from "lucide-react";
import type { ComponentType, ReactNode } from "react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { getAuthErrorMessage } from "@/modules/auth";
import { Button } from "@/shared/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/shared/ui/card";
import { Input } from "@/shared/ui/input";
import { Label } from "@/shared/ui/label";
import {
  invalidateSession,
  type OwnerOrganizationInput,
  updateSessionUserAfterOrganization,
  useCompleteOwnerOrganization,
} from "../api/use-owner-onboarding";

const DEFAULT_ORGANIZATION_ERROR = "Não foi possível concluir o cadastro da organização.";

const initialOrganization: OwnerOrganizationInput = {
  name: "",
  slug: "",
  officialName: "",
  cnpj: "",
  city: "",
  state: "",
  address: "",
  zipCode: "",
  phone: "",
  institutionalEmail: "",
  website: "",
  logoUrl: "",
  authorityName: "",
  authorityRole: "",
};

function slugify(value: string) {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function OwnerOrganizationOnboardingPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const createOrganization = useCompleteOwnerOrganization();
  const [organization, setOrganization] = useState(initialOrganization);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  function updateField<Key extends keyof OwnerOrganizationInput>(
    field: Key,
    value: OwnerOrganizationInput[Key],
  ) {
    setOrganization((currentValue) => ({
      ...currentValue,
      [field]: value,
      ...(field === "name" && !currentValue.slug ? { slug: slugify(String(value)) } : {}),
    }));
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrorMessage(null);

    try {
      const createdOrganization = await createOrganization.mutateAsync({
        data: {
          ...organization,
          website: organization.website || null,
          logoUrl: organization.logoUrl || null,
        },
      });

      updateSessionUserAfterOrganization(queryClient, createdOrganization);
      await invalidateSession(queryClient);
      navigate("/app", { replace: true });
    } catch (error) {
      setErrorMessage(getAuthErrorMessage(error, DEFAULT_ORGANIZATION_ERROR));
    }
  }

  return (
    <main className="min-h-screen bg-background px-4 py-8 sm:px-6">
      <div className="mx-auto w-full max-w-5xl">
        <Card className="border-border/60 shadow-sm">
          <CardHeader>
            <CardTitle>Dados da organização</CardTitle>
            <CardDescription>Cadastre a prefeitura vinculada ao seu usuário.</CardDescription>
          </CardHeader>
          <CardContent>
            <form className="space-y-8" onSubmit={handleSubmit}>
              <div className="grid gap-5 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="organization-name">Nome</Label>
                  <IconInput icon={Building2}>
                    <Input
                      id="organization-name"
                      className="pl-10"
                      required
                      value={organization.name}
                      onChange={(event) => updateField("name", event.target.value)}
                    />
                  </IconInput>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="organization-slug">Slug</Label>
                  <Input
                    id="organization-slug"
                    required
                    value={organization.slug}
                    onChange={(event) => updateField("slug", slugify(event.target.value))}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="official-name">Nome oficial</Label>
                  <Input
                    id="official-name"
                    required
                    value={organization.officialName}
                    onChange={(event) => updateField("officialName", event.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="cnpj">CNPJ</Label>
                  <Input
                    id="cnpj"
                    required
                    value={organization.cnpj}
                    onChange={(event) => updateField("cnpj", event.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="city">Cidade</Label>
                  <IconInput icon={MapPin}>
                    <Input
                      id="city"
                      className="pl-10"
                      required
                      value={organization.city}
                      onChange={(event) => updateField("city", event.target.value)}
                    />
                  </IconInput>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="state">UF</Label>
                  <Input
                    id="state"
                    maxLength={2}
                    required
                    value={organization.state}
                    onChange={(event) => updateField("state", event.target.value.toUpperCase())}
                  />
                </div>

                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="address">Endereço</Label>
                  <Input
                    id="address"
                    required
                    value={organization.address}
                    onChange={(event) => updateField("address", event.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="zip-code">CEP</Label>
                  <Input
                    id="zip-code"
                    required
                    value={organization.zipCode}
                    onChange={(event) => updateField("zipCode", event.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone">Telefone</Label>
                  <IconInput icon={Phone}>
                    <Input
                      id="phone"
                      className="pl-10"
                      required
                      value={organization.phone}
                      onChange={(event) => updateField("phone", event.target.value)}
                    />
                  </IconInput>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="institutional-email">E-mail institucional</Label>
                  <IconInput icon={Mail}>
                    <Input
                      id="institutional-email"
                      className="pl-10"
                      required
                      type="email"
                      value={organization.institutionalEmail}
                      onChange={(event) => updateField("institutionalEmail", event.target.value)}
                    />
                  </IconInput>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="website">Site</Label>
                  <IconInput icon={LinkIcon}>
                    <Input
                      id="website"
                      className="pl-10"
                      value={organization.website ?? ""}
                      onChange={(event) => updateField("website", event.target.value)}
                    />
                  </IconInput>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="authority-name">Autoridade responsável</Label>
                  <IconInput icon={UserRound}>
                    <Input
                      id="authority-name"
                      className="pl-10"
                      required
                      value={organization.authorityName}
                      onChange={(event) => updateField("authorityName", event.target.value)}
                    />
                  </IconInput>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="authority-role">Cargo</Label>
                  <Input
                    id="authority-role"
                    required
                    value={organization.authorityRole}
                    onChange={(event) => updateField("authorityRole", event.target.value)}
                  />
                </div>
              </div>

              {errorMessage ? (
                <p className="text-sm text-destructive" role="alert">
                  {errorMessage}
                </p>
              ) : null}

              <Button size="lg" type="submit" disabled={createOrganization.isPending}>
                <span className="flex items-center gap-2">
                  Concluir onboarding
                  <Check className="h-4 w-4" />
                </span>
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}

function IconInput({
  children,
  icon: Icon,
}: {
  children: ReactNode;
  icon: ComponentType<{ className?: string }>;
}) {
  return (
    <div className="relative">
      <Icon className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
      {children}
    </div>
  );
}

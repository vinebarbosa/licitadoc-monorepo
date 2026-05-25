import { resolveApiUrl } from "@licitadoc/api-client";
import {
  AlertCircle,
  AlertTriangle,
  Briefcase,
  Building2,
  Check,
  CheckCircle2,
  ChevronDown,
  Clock,
  Download,
  FileImage,
  FileText,
  Filter,
  FolderOpen,
  Globe,
  Hash,
  Image as ImageIcon,
  Info,
  Mail,
  MapPin,
  MoreHorizontal,
  Pencil,
  Phone,
  Plus,
  RefreshCw,
  Save,
  Search,
  Shield,
  Trash2,
  Upload,
  User,
  UserPlus,
  Users,
  X,
  XCircle,
} from "lucide-react";
import type { ChangeEvent, DragEvent, ElementType } from "react";
import { useEffect, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { cn } from "@/shared/lib/utils";
import {
  type OwnerOrganizationDepartment,
  type OwnerOrganizationInvite,
  type OwnerOrganizationMember,
  type OwnerOrganizationProfile,
  useOwnerOrganizationCreateDepartment,
  useOwnerOrganizationCreateInvite,
  useOwnerOrganizationDeleteDepartment,
  useOwnerOrganizationDeleteMember,
  useOwnerOrganizationDepartments,
  useOwnerOrganizationInvites,
  useOwnerOrganizationMembers,
  useOwnerOrganizationProfile,
  useOwnerOrganizationResendInvite,
  useOwnerOrganizationRevokeInvite,
  useOwnerOrganizationUpdate,
  useOwnerOrganizationUpdateDepartment,
  useOwnerOrganizationUploadCrest,
  useOwnerOrganizationUploadLetterhead,
  useOwnerOrganizationUploadLogo,
} from "../api/owner-organization";
import {
  formatCEP,
  formatCNPJ,
  formatPhone,
  getOwnerOrganizationEmptyDepartmentForm,
  getOwnerOrganizationErrorMessage,
  getOwnerOrganizationInviteStatus,
  getOwnerOrganizationUserInitials,
  isOwnerOrganizationActiveMember,
  isOwnerOrganizationPendingInvite,
  isOwnerOrganizationVisibleInvite,
  OWNER_ORGANIZATION_ROLE_COLORS,
  OWNER_ORGANIZATION_ROLE_LABELS,
  type OwnerOrganizationDepartmentFormValues,
  type OwnerOrganizationFormValues,
  type OwnerOrganizationMemberRole,
  slugifyOrganizationValue,
  toOwnerOrganizationDepartmentCreatePayload,
  toOwnerOrganizationDepartmentFormValues,
  toOwnerOrganizationDepartmentUpdatePayload,
  toOwnerOrganizationFormValues,
  toOwnerOrganizationUpdatePayload,
} from "../model/owner-organization";

type Tab = "dados" | "membros" | "departamentos" | "documentos";

type UploadedFile = {
  name: string;
  size?: number;
  type: string;
  url: string;
  uploadedAt: string;
};

type OrgFormErrors = Partial<Record<keyof OwnerOrganizationFormValues, string>>;
type DeptFormErrors = Partial<Record<keyof OwnerOrganizationDepartmentFormValues, string>>;

const TABS: Array<{ id: Tab; label: string; icon: ElementType }> = [
  { id: "dados", label: "Dados da Prefeitura", icon: Building2 },
  { id: "membros", label: "Membros & Convites", icon: Users },
  { id: "departamentos", label: "Departamentos", icon: FolderOpen },
  { id: "documentos", label: "Documentos", icon: FileImage },
];

function getTabFromQuery(value: string | null): Tab {
  if (value === "membros" || value === "departamentos" || value === "documentos") {
    return value;
  }

  return "dados";
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function formatDateTime(iso: string) {
  return new Date(iso).toLocaleString("pt-BR", {
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function formatBytes(bytes?: number) {
  if (bytes == null) {
    return null;
  }

  if (bytes < 1024) {
    return `${bytes} B`;
  }

  if (bytes < 1024 * 1024) {
    return `${(bytes / 1024).toFixed(1)} KB`;
  }

  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function resolveOrganizationAssetUrl(url: string | null | undefined, cacheKey?: string) {
  if (!url) {
    return null;
  }

  try {
    const resolvedUrl = new URL(resolveApiUrl(url));

    if (cacheKey) {
      resolvedUrl.searchParams.set("v", cacheKey);
    }

    return resolvedUrl.toString();
  } catch {
    return null;
  }
}

function LoadingLine({ className }: { className?: string }) {
  return <span className={cn("block animate-pulse rounded bg-muted", className)} />;
}

function SectionState({
  icon: Icon = AlertCircle,
  message,
  onRetry,
}: {
  icon?: ElementType;
  message: string;
  onRetry?: () => void;
}) {
  return (
    <div className="rounded-lg border border-border bg-card px-4 py-8 text-center">
      <Icon className="mx-auto mb-2 h-7 w-7 text-muted-foreground/60" />
      <p className="text-muted-foreground text-sm">{message}</p>
      {onRetry ? (
        <button
          className="mt-3 inline-flex items-center gap-1.5 rounded-md border border-border bg-card px-3 py-1.5 font-medium text-foreground text-sm transition-colors hover:bg-muted"
          onClick={onRetry}
          type="button"
        >
          <RefreshCw className="h-3.5 w-3.5" />
          Tentar novamente
        </button>
      ) : null}
    </div>
  );
}

function InlineError({ message }: { message: string }) {
  return (
    <div className="flex items-center gap-2 rounded-md border border-destructive/20 bg-destructive/5 px-3 py-2 text-destructive text-xs">
      <AlertCircle className="h-3.5 w-3.5 shrink-0" />
      {message}
    </div>
  );
}

function StatCard({
  label,
  value,
  sub,
  icon: Icon,
  accent,
  loading,
}: {
  label: string;
  value: string | number;
  sub?: string;
  icon: ElementType;
  accent?: "success" | "warning" | "primary";
  loading?: boolean;
}) {
  const colors = {
    success: "bg-success/10 text-success",
    warning: "bg-warning/10 text-warning",
    primary: "bg-primary/10 text-primary",
  };

  return (
    <div className="flex items-center gap-3 rounded-lg border border-border bg-card px-4 py-3.5">
      <div
        className={cn(
          "flex h-9 w-9 shrink-0 items-center justify-center rounded-md",
          accent ? colors[accent] : "bg-muted text-muted-foreground",
        )}
      >
        <Icon className="h-4.5 w-4.5" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="mb-1 text-xs leading-none text-muted-foreground">{label}</p>
        {loading ? (
          <LoadingLine className="h-5 w-10" />
        ) : (
          <p className="font-bold text-xl leading-none text-foreground">{value}</p>
        )}
        {sub ? <p className="mt-1 text-[11px] leading-none text-muted-foreground">{sub}</p> : null}
      </div>
    </div>
  );
}

function OrgSummaryStrip({ organization }: { organization: OwnerOrganizationProfile }) {
  const values = toOwnerOrganizationFormValues(organization);
  const location = [values.cidade, values.uf].filter(Boolean).join("/");

  return (
    <div className="space-y-1.5 text-muted-foreground text-xs">
      <div className="flex items-center gap-1.5">
        <Hash className="h-3.5 w-3.5 shrink-0" />
        {values.cnpj}
      </div>
      <div className="flex items-center gap-1.5">
        <MapPin className="h-3.5 w-3.5 shrink-0" />
        {location}
      </div>
      <div className="flex min-w-0 flex-wrap items-center gap-x-4 gap-y-1.5">
        <span className="flex shrink-0 items-center gap-1.5 whitespace-nowrap">
          <Phone className="h-3.5 w-3.5 shrink-0" />
          {values.telefone}
        </span>
        <span className="flex min-w-0 max-w-full items-center gap-1.5 sm:max-w-64">
          <Mail className="h-3.5 w-3.5 shrink-0" />
          <span className="truncate">{values.emailInstitucional}</span>
        </span>
        {values.site ? (
          <span className="flex min-w-0 max-w-full items-center gap-1.5 sm:max-w-72">
            <Globe className="h-3.5 w-3.5 shrink-0" />
            <span className="truncate">{values.site}</span>
          </span>
        ) : null}
      </div>
      <div className="flex max-w-full items-start gap-1.5">
        <User className="mt-px h-3.5 w-3.5 shrink-0" />
        <span className="min-w-0 break-words">Prefeito: {values.autoridadeMaxima}</span>
      </div>
    </div>
  );
}

function Field({
  label,
  value,
  icon: Icon,
  editing,
  field,
  formData,
  errors,
  onChange,
  formatter,
  placeholder,
  hint,
  span,
}: {
  label: string;
  value: string;
  icon: ElementType;
  editing: boolean;
  field: keyof OwnerOrganizationFormValues;
  formData: OwnerOrganizationFormValues;
  errors: OrgFormErrors;
  onChange: (field: keyof OwnerOrganizationFormValues, value: string) => void;
  formatter?: (value: string) => string;
  placeholder?: string;
  hint?: string;
  span?: boolean;
}) {
  const hasError = Boolean(errors[field]);
  const inputId = `org-${field}`;

  return (
    <div className={cn("flex flex-col gap-1", span && "md:col-span-2")}>
      <label
        className="flex items-center gap-1.5 font-medium text-muted-foreground text-xs"
        htmlFor={inputId}
      >
        <Icon className="h-3.5 w-3.5 shrink-0" />
        {label}
      </label>
      {editing ? (
        <div>
          <input
            className={cn(
              "w-full rounded-md border bg-card px-3 py-2 text-foreground text-sm outline-none transition-colors",
              "focus:border-ring focus:ring-2 focus:ring-ring/30",
              hasError ? "border-destructive" : "border-border",
            )}
            id={inputId}
            onChange={(event) => {
              const raw = event.target.value;
              onChange(field, formatter ? formatter(raw) : raw);
            }}
            placeholder={placeholder}
            value={formData[field]}
          />
          {hasError ? (
            <p className="mt-1 flex items-center gap-1 text-[11px] text-destructive">
              <AlertCircle className="h-3 w-3" />
              {errors[field]}
            </p>
          ) : null}
        </div>
      ) : (
        <p className="min-h-8 py-1.5 text-foreground text-sm leading-snug">
          {value || <span className="text-muted-foreground italic">Não informado</span>}
        </p>
      )}
      {hint && !editing ? <p className="text-[11px] text-muted-foreground">{hint}</p> : null}
    </div>
  );
}

function TabDados({
  organization,
  isLoading,
  isError,
  onRetry,
}: {
  organization?: OwnerOrganizationProfile;
  isLoading: boolean;
  isError: boolean;
  onRetry: () => void;
}) {
  const updateOrganization = useOwnerOrganizationUpdate();
  const [editing, setEditing] = useState(false);
  const [formData, setFormData] = useState<OwnerOrganizationFormValues | null>(null);
  const [errors, setErrors] = useState<OrgFormErrors>({});
  const [savedAt, setSavedAt] = useState<string | null>(null);

  useEffect(() => {
    if (organization && !editing) {
      setFormData(toOwnerOrganizationFormValues(organization));
    }
  }, [editing, organization]);

  if (isLoading && !organization) {
    return (
      <div className="space-y-6">
        <div>
          <LoadingLine className="h-5 w-44" />
          <LoadingLine className="mt-2 h-4 w-96 max-w-full" />
        </div>
        <section className="overflow-hidden rounded-lg border border-border">
          <div className="border-border border-b bg-muted/50 px-4 py-2.5">
            <LoadingLine className="h-4 w-36" />
          </div>
          <div className="grid grid-cols-1 gap-x-6 gap-y-4 p-4 md:grid-cols-2">
            <LoadingLine className="h-12 w-full md:col-span-2" />
            <LoadingLine className="h-12 w-full md:col-span-2" />
            <LoadingLine className="h-12 w-full" />
          </div>
        </section>
      </div>
    );
  }

  if (isError || !organization || !formData) {
    return (
      <SectionState message="Não foi possível carregar os dados da prefeitura." onRetry={onRetry} />
    );
  }

  const currentOrganization = organization;
  const currentFormData = formData;
  const values = toOwnerOrganizationFormValues(organization);

  function handleChange(field: keyof OwnerOrganizationFormValues, value: string) {
    setFormData((previous) => (previous ? { ...previous, [field]: value } : previous));

    if (errors[field]) {
      setErrors((previous) => ({ ...previous, [field]: undefined }));
    }
  }

  function validate() {
    const newErrors: OrgFormErrors = {};
    const cnpjDigits = currentFormData.cnpj.replace(/\D/g, "");

    if (!currentFormData.nomeFantasia.trim()) {
      newErrors.nomeFantasia = "Nome fantasia é obrigatório";
    }

    if (!currentFormData.razaoSocial.trim()) {
      newErrors.razaoSocial = "Razão social é obrigatória";
    }

    if (cnpjDigits.length !== 14) {
      newErrors.cnpj = "CNPJ inválido (14 dígitos)";
    }

    if (!currentFormData.cidade.trim()) {
      newErrors.cidade = "Cidade é obrigatória";
    }

    if (!currentFormData.uf.trim() || currentFormData.uf.length !== 2) {
      newErrors.uf = "UF inválida";
    }

    if (!currentFormData.autoridadeMaxima.trim()) {
      newErrors.autoridadeMaxima = "Autoridade máxima é obrigatória";
    }

    if (!currentFormData.cargoAutoridadeMaxima.trim()) {
      newErrors.cargoAutoridadeMaxima = "Cargo é obrigatório";
    }

    setErrors(newErrors);

    return Object.keys(newErrors).length === 0;
  }

  async function handleSave() {
    if (!validate()) {
      return;
    }

    await updateOrganization.mutateAsync({
      organizationId: currentOrganization.id,
      data: toOwnerOrganizationUpdatePayload(currentFormData),
    });
    setEditing(false);
    setSavedAt(new Date().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" }));
  }

  function handleCancel() {
    setFormData(toOwnerOrganizationFormValues(currentOrganization));
    setErrors({});
    setEditing(false);
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="font-semibold text-base text-foreground">Dados da Prefeitura</h2>
          <p className="mt-0.5 text-muted-foreground text-sm">
            Informações institucionais usadas em documentos e processos gerados pelo sistema.
          </p>
        </div>
        {!editing ? (
          <button
            className="flex items-center gap-1.5 rounded-md border border-border bg-card px-3 py-1.5 font-medium text-foreground text-sm transition-colors hover:bg-muted"
            onClick={() => setEditing(true)}
            type="button"
          >
            <Pencil className="h-3.5 w-3.5" />
            Editar
          </button>
        ) : (
          <div className="flex items-center gap-2">
            <button
              className="flex items-center gap-1.5 rounded-md border border-border bg-card px-3 py-1.5 text-muted-foreground text-sm transition-colors hover:bg-muted"
              onClick={handleCancel}
              type="button"
            >
              <X className="h-3.5 w-3.5" />
              Cancelar
            </button>
            <button
              className="flex items-center gap-1.5 rounded-md bg-primary px-3 py-1.5 font-medium text-primary-foreground text-sm transition-colors hover:bg-accent disabled:opacity-60"
              disabled={updateOrganization.isPending}
              onClick={() => void handleSave()}
              type="button"
            >
              {updateOrganization.isPending ? (
                <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-primary-foreground border-t-transparent" />
              ) : (
                <Save className="h-3.5 w-3.5" />
              )}
              {updateOrganization.isPending ? "Salvando..." : "Salvar alterações"}
            </button>
          </div>
        )}
      </div>

      {updateOrganization.error ? (
        <InlineError
          message={getOwnerOrganizationErrorMessage(
            updateOrganization.error,
            "Não foi possível salvar os dados da prefeitura.",
          )}
        />
      ) : null}

      {savedAt && !editing ? (
        <div className="flex items-center gap-2 rounded-md border border-success/20 bg-success/8 px-3 py-2 text-success text-xs">
          <Check className="h-3.5 w-3.5" />
          Dados salvos às {savedAt}
        </div>
      ) : null}

      <section className="overflow-hidden rounded-lg border border-border">
        <div className="border-border border-b bg-muted/50 px-4 py-2.5">
          <h3 className="flex items-center gap-2 font-semibold text-muted-foreground text-xs uppercase tracking-wide">
            <Building2 className="h-3.5 w-3.5" />
            Identificação
          </h3>
        </div>
        <div className="grid grid-cols-1 gap-x-6 gap-y-4 p-4 md:grid-cols-2">
          <Field
            editing={editing}
            errors={errors}
            field="nomeFantasia"
            formData={currentFormData}
            icon={Building2}
            label="Nome fantasia"
            onChange={handleChange}
            placeholder="Ex.: Prefeitura de São Benedito"
            span
            value={values.nomeFantasia}
          />
          <Field
            editing={editing}
            errors={errors}
            field="razaoSocial"
            formData={currentFormData}
            icon={Building2}
            label="Razão social oficial"
            onChange={handleChange}
            placeholder="Ex.: Município de São Benedito do Rio Preto"
            span
            value={values.razaoSocial}
          />
          <Field
            editing={editing}
            errors={errors}
            field="cnpj"
            formData={currentFormData}
            formatter={formatCNPJ}
            hint="Usado no rodapé de documentos"
            icon={Hash}
            label="CNPJ"
            onChange={handleChange}
            placeholder="00.000.000/0001-00"
            value={values.cnpj}
          />
        </div>
      </section>

      <section className="overflow-hidden rounded-lg border border-border">
        <div className="border-border border-b bg-muted/50 px-4 py-2.5">
          <h3 className="flex items-center gap-2 font-semibold text-muted-foreground text-xs uppercase tracking-wide">
            <MapPin className="h-3.5 w-3.5" />
            Localização e Contato
          </h3>
        </div>
        <div className="grid grid-cols-1 gap-x-6 gap-y-4 p-4 md:grid-cols-2">
          <Field
            editing={editing}
            errors={errors}
            field="endereco"
            formData={currentFormData}
            icon={MapPin}
            label="Endereço"
            onChange={handleChange}
            placeholder="Rua, número, bairro"
            span
            value={values.endereco}
          />
          <div className="grid grid-cols-2 gap-4">
            <Field
              editing={editing}
              errors={errors}
              field="cidade"
              formData={currentFormData}
              icon={MapPin}
              label="Cidade"
              onChange={handleChange}
              placeholder="Cidade"
              value={values.cidade}
            />
            <Field
              editing={editing}
              errors={errors}
              field="uf"
              formData={currentFormData}
              icon={MapPin}
              label="UF"
              onChange={handleChange}
              placeholder="MA"
              value={values.uf}
            />
          </div>
          <Field
            editing={editing}
            errors={errors}
            field="cep"
            formData={currentFormData}
            formatter={formatCEP}
            icon={MapPin}
            label="CEP"
            onChange={handleChange}
            placeholder="00000-000"
            value={values.cep}
          />
          <Field
            editing={editing}
            errors={errors}
            field="telefone"
            formData={currentFormData}
            formatter={formatPhone}
            icon={Phone}
            label="Telefone"
            onChange={handleChange}
            placeholder="(00) 0000-0000"
            value={values.telefone}
          />
          <Field
            editing={editing}
            errors={errors}
            field="emailInstitucional"
            formData={currentFormData}
            icon={Mail}
            label="E-mail institucional"
            onChange={handleChange}
            placeholder="contato@prefeitura.gov.br"
            value={values.emailInstitucional}
          />
          <Field
            editing={editing}
            errors={errors}
            field="site"
            formData={currentFormData}
            icon={Globe}
            label="Site"
            onChange={handleChange}
            placeholder="www.prefeitura.gov.br"
            value={values.site}
          />
        </div>
      </section>

      <section className="overflow-hidden rounded-lg border border-border">
        <div className="border-border border-b bg-muted/50 px-4 py-2.5">
          <h3 className="flex items-center gap-2 font-semibold text-muted-foreground text-xs uppercase tracking-wide">
            <User className="h-3.5 w-3.5" />
            Autoridade Máxima
          </h3>
        </div>
        <div className="grid grid-cols-1 gap-x-6 gap-y-4 p-4 md:grid-cols-2">
          <Field
            editing={editing}
            errors={errors}
            field="autoridadeMaxima"
            formData={currentFormData}
            icon={User}
            label="Nome"
            onChange={handleChange}
            placeholder="Nome completo"
            value={values.autoridadeMaxima}
          />
          <Field
            editing={editing}
            errors={errors}
            field="cargoAutoridadeMaxima"
            formData={currentFormData}
            icon={Briefcase}
            label="Cargo"
            onChange={handleChange}
            placeholder="Ex.: Prefeito Municipal"
            value={values.cargoAutoridadeMaxima}
          />
        </div>
      </section>
    </div>
  );
}

function MemberStatus({ member }: { member: OwnerOrganizationMember }) {
  const active = isOwnerOrganizationActiveMember(member);

  return (
    <span
      className={cn(
        "flex items-center gap-1 font-medium text-xs",
        active ? "text-success" : "text-warning",
      )}
    >
      {active ? <CheckCircle2 className="h-3.5 w-3.5" /> : <Clock className="h-3.5 w-3.5" />}
      {active ? "Ativo" : "Pendente"}
    </span>
  );
}

function InviteStatusBadge({ invite }: { invite: OwnerOrganizationInvite }) {
  const status = getOwnerOrganizationInviteStatus(invite);

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded border px-2 py-0.5 font-medium text-xs",
        status === "pendente"
          ? "border-warning/20 bg-warning/10 text-warning"
          : "border-border bg-muted text-muted-foreground",
      )}
    >
      {status === "pendente" ? (
        <Clock className="h-3 w-3" />
      ) : (
        <AlertTriangle className="h-3 w-3" />
      )}
      {status === "pendente" ? "Pendente" : "Expirado"}
    </span>
  );
}

function InviteForm({ organizationId, onClose }: { organizationId?: string; onClose: () => void }) {
  const createInvite = useOwnerOrganizationCreateInvite();
  const [email, setEmail] = useState("");

  async function handleSend() {
    if (!email.trim()) {
      return;
    }

    await createInvite.mutateAsync({
      data: {
        email: email.trim(),
        organizationId,
      },
    });
    setEmail("");
    onClose();
  }

  return (
    <div className="space-y-3 rounded-lg border border-border bg-card p-4">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-foreground text-sm">Convidar membro</h3>
        <button
          className="text-muted-foreground hover:text-foreground"
          onClick={onClose}
          type="button"
        >
          <XCircle className="h-4 w-4" />
        </button>
      </div>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div className="space-y-1 sm:col-span-2">
          <label className="font-medium text-muted-foreground text-xs" htmlFor="invite-email">
            E-mail
          </label>
          <input
            className="w-full rounded-md border border-border bg-card px-3 py-2 text-foreground text-sm focus:border-ring focus:outline-none focus:ring-2 focus:ring-ring/30"
            id="invite-email"
            onChange={(event) => setEmail(event.target.value)}
            placeholder="servidor@prefeitura.gov.br"
            type="email"
            value={email}
          />
        </div>
      </div>

      {createInvite.error ? (
        <InlineError
          message={getOwnerOrganizationErrorMessage(
            createInvite.error,
            "Não foi possível enviar o convite.",
          )}
        />
      ) : null}

      <div className="flex justify-end gap-2 pt-1">
        <button
          className="rounded-md border border-border bg-card px-3 py-1.5 text-muted-foreground text-sm transition-colors hover:bg-muted"
          onClick={onClose}
          type="button"
        >
          Cancelar
        </button>
        <button
          className="flex items-center gap-1.5 rounded-md bg-primary px-3 py-1.5 font-medium text-primary-foreground text-sm transition-colors hover:bg-accent disabled:opacity-60"
          disabled={createInvite.isPending || !email.trim()}
          onClick={() => void handleSend()}
          type="button"
        >
          {createInvite.isPending ? (
            <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-primary-foreground border-t-transparent" />
          ) : null}
          Enviar convite
        </button>
      </div>
    </div>
  );
}

function TabMembros({
  organizationId,
  members,
  invites,
  isLoading,
  isError,
  onRetry,
}: {
  organizationId?: string;
  members: OwnerOrganizationMember[];
  invites: OwnerOrganizationInvite[];
  isLoading: boolean;
  isError: boolean;
  onRetry: () => void;
}) {
  const deleteMember = useOwnerOrganizationDeleteMember();
  const resendInvite = useOwnerOrganizationResendInvite();
  const revokeInvite = useOwnerOrganizationRevokeInvite();
  const [showInviteForm, setShowInviteForm] = useState(false);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState<OwnerOrganizationMemberRole | "all">("all");
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const visibleInvites = invites.filter(isOwnerOrganizationVisibleInvite);
  const filtered = members.filter((member) => {
    const query = search.toLowerCase();
    const matchSearch =
      member.name.toLowerCase().includes(query) || member.email.toLowerCase().includes(query);
    const matchRole = roleFilter === "all" || member.role === roleFilter;

    return matchSearch && matchRole;
  });
  const pendingInvites = visibleInvites.filter(isOwnerOrganizationPendingInvite).length;
  const activeMembers = members.filter(isOwnerOrganizationActiveMember).length;

  async function runAction(action: () => Promise<unknown>, fallback: string) {
    setActionError(null);

    try {
      await action();
    } catch (error) {
      setActionError(getOwnerOrganizationErrorMessage(error, fallback));
    }
  }

  if (isLoading && members.length === 0 && invites.length === 0) {
    return (
      <div className="space-y-6">
        <div className="flex items-start justify-between gap-3">
          <div>
            <LoadingLine className="h-5 w-44" />
            <LoadingLine className="mt-2 h-4 w-64" />
          </div>
          <LoadingLine className="h-8 w-24" />
        </div>
        <div className="overflow-hidden rounded-lg border border-border">
          <LoadingLine className="h-48 w-full rounded-none" />
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <SectionState message="Não foi possível carregar membros e convites." onRetry={onRetry} />
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="font-semibold text-base text-foreground">Membros e Convites</h2>
          <p className="mt-0.5 text-muted-foreground text-sm">
            {activeMembers} membros ativos · {pendingInvites} convites pendentes
          </p>
        </div>
        <button
          className="flex shrink-0 items-center gap-1.5 rounded-md bg-primary px-3 py-1.5 font-medium text-primary-foreground text-sm transition-colors hover:bg-accent"
          onClick={() => setShowInviteForm((current) => !current)}
          type="button"
        >
          <UserPlus className="h-3.5 w-3.5" />
          Convidar
        </button>
      </div>

      {showInviteForm ? (
        <InviteForm organizationId={organizationId} onClose={() => setShowInviteForm(false)} />
      ) : null}
      {actionError ? <InlineError message={actionError} /> : null}

      <div className="flex flex-col gap-2 sm:flex-row">
        <div className="relative flex-1">
          <Search className="-translate-y-1/2 pointer-events-none absolute top-1/2 left-2.5 h-3.5 w-3.5 text-muted-foreground" />
          <input
            aria-label="Buscar por nome ou e-mail"
            className="w-full rounded-md border border-border bg-card py-2 pr-3 pl-8 text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring/30"
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Buscar por nome ou e-mail..."
            value={search}
          />
        </div>
        <div className="relative">
          <Filter className="-translate-y-1/2 pointer-events-none absolute top-1/2 left-2.5 h-3.5 w-3.5 text-muted-foreground" />
          <select
            aria-label="Filtrar por papel"
            className="appearance-none rounded-md border border-border bg-card py-2 pr-8 pl-8 text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring/30"
            onChange={(event) =>
              setRoleFilter(event.target.value as OwnerOrganizationMemberRole | "all")
            }
            value={roleFilter}
          >
            <option value="all">Todos os papéis</option>
            {(Object.keys(OWNER_ORGANIZATION_ROLE_LABELS) as OwnerOrganizationMemberRole[]).map(
              (roleKey) => (
                <option key={roleKey} value={roleKey}>
                  {OWNER_ORGANIZATION_ROLE_LABELS[roleKey]}
                </option>
              ),
            )}
          </select>
          <ChevronDown className="-translate-y-1/2 pointer-events-none absolute top-1/2 right-2.5 h-3.5 w-3.5 text-muted-foreground" />
        </div>
      </div>

      <div className="overflow-hidden rounded-lg border border-border">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-border border-b bg-muted/50">
                <th className="px-4 py-2.5 text-left font-semibold text-muted-foreground text-xs uppercase tracking-wide">
                  Membro
                </th>
                <th className="hidden px-4 py-2.5 text-left font-semibold text-muted-foreground text-xs uppercase tracking-wide sm:table-cell">
                  Papel
                </th>
                <th className="hidden px-4 py-2.5 text-left font-semibold text-muted-foreground text-xs uppercase tracking-wide md:table-cell">
                  Cadastro
                </th>
                <th className="px-4 py-2.5 text-left font-semibold text-muted-foreground text-xs uppercase tracking-wide">
                  Status
                </th>
                <th className="w-10" />
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filtered.length === 0 ? (
                <tr>
                  <td className="px-4 py-8 text-center text-muted-foreground text-sm" colSpan={5}>
                    Nenhum membro encontrado.
                  </td>
                </tr>
              ) : (
                filtered.map((member) => (
                  <tr className="transition-colors hover:bg-muted/30" key={member.id}>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2.5">
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 font-semibold text-primary text-xs">
                          {getOwnerOrganizationUserInitials(member.name)}
                        </div>
                        <div>
                          <p className="font-medium text-foreground leading-tight">{member.name}</p>
                          <p className="text-muted-foreground text-xs">{member.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="hidden px-4 py-3 sm:table-cell">
                      <span
                        className={cn(
                          "inline-flex items-center gap-1 rounded border px-2 py-0.5 font-medium text-xs",
                          OWNER_ORGANIZATION_ROLE_COLORS[member.role],
                        )}
                      >
                        {member.role === "organization_owner" ? (
                          <Shield className="h-3 w-3" />
                        ) : null}
                        {OWNER_ORGANIZATION_ROLE_LABELS[member.role]}
                      </span>
                    </td>
                    <td className="hidden px-4 py-3 md:table-cell">
                      <span className="text-muted-foreground text-xs">
                        {formatDate(member.createdAt)}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <MemberStatus member={member} />
                    </td>
                    <td className="px-4 py-3">
                      {member.role === "member" ? (
                        <div className="relative">
                          <button
                            aria-label={`Abrir ações de ${member.name}`}
                            className="rounded p-1 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                            onClick={() =>
                              setActiveMenuId(activeMenuId === member.id ? null : member.id)
                            }
                            type="button"
                          >
                            <MoreHorizontal className="h-4 w-4" />
                          </button>
                          {activeMenuId === member.id ? (
                            <div className="absolute top-7 right-0 z-20 w-44 rounded-lg border border-border bg-card py-1 text-sm shadow-lg">
                              <button
                                className="flex w-full items-center gap-2 px-3 py-2 text-destructive hover:bg-destructive/5"
                                disabled={deleteMember.isPending}
                                onClick={() => {
                                  setActiveMenuId(null);
                                  void runAction(
                                    () => deleteMember.mutateAsync({ userId: member.id }),
                                    "Não foi possível remover o membro.",
                                  );
                                }}
                                type="button"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                                Remover membro
                              </button>
                            </div>
                          ) : null}
                        </div>
                      ) : null}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div>
        <div className="mb-3 flex items-center justify-between">
          <h3 className="flex items-center gap-2 font-semibold text-foreground text-sm">
            <Mail className="h-4 w-4 text-muted-foreground" />
            Convites
            <span className="rounded bg-muted px-1.5 py-0.5 font-normal text-muted-foreground text-xs">
              {visibleInvites.length}
            </span>
          </h3>
        </div>

        {visibleInvites.length === 0 ? (
          <div className="rounded-lg border border-border px-4 py-8 text-center text-muted-foreground text-sm">
            Nenhum convite pendente.
          </div>
        ) : (
          <div className="overflow-hidden rounded-lg border border-border divide-y divide-border">
            {visibleInvites.map((invite) => (
              <div
                className="flex items-center gap-3 px-4 py-3 transition-colors hover:bg-muted/30"
                key={invite.id}
              >
                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-muted">
                  <Mail className="h-3.5 w-3.5 text-muted-foreground" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium text-foreground text-sm">{invite.email}</p>
                  <p className="text-muted-foreground text-xs">
                    Membro · Enviado em {formatDate(invite.createdAt)}
                  </p>
                </div>
                <InviteStatusBadge invite={invite} />
                <div className="flex shrink-0 items-center gap-1.5">
                  <button
                    className="flex items-center gap-1 rounded border border-border bg-card px-2 py-1 text-muted-foreground text-xs transition-colors hover:bg-muted disabled:opacity-60"
                    disabled={resendInvite.isPending}
                    onClick={() =>
                      void runAction(
                        () => resendInvite.mutateAsync({ inviteId: invite.id }),
                        "Não foi possível reenviar o convite.",
                      )
                    }
                    title="Reenviar convite"
                    type="button"
                  >
                    <RefreshCw className="h-3 w-3" />
                    <span className="hidden sm:inline">Reenviar</span>
                  </button>
                  <button
                    className="flex items-center gap-1 rounded border border-border bg-card px-2 py-1 text-destructive text-xs transition-colors hover:bg-destructive/5 disabled:opacity-60"
                    disabled={revokeInvite.isPending}
                    onClick={() =>
                      void runAction(
                        () => revokeInvite.mutateAsync({ inviteId: invite.id }),
                        "Não foi possível cancelar o convite.",
                      )
                    }
                    title="Cancelar convite"
                    type="button"
                  >
                    <Trash2 className="h-3 w-3" />
                    <span className="hidden sm:inline">Cancelar</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function DeptForm({
  initialData,
  onSave,
  onCancel,
  editId,
  saving,
}: {
  initialData: OwnerOrganizationDepartmentFormValues;
  onSave: (data: OwnerOrganizationDepartmentFormValues) => Promise<void>;
  onCancel: () => void;
  editId?: string;
  saving: boolean;
}) {
  const [form, setForm] = useState<OwnerOrganizationDepartmentFormValues>(initialData);
  const [errors, setErrors] = useState<DeptFormErrors>({});
  const [autoSlug, setAutoSlug] = useState(!editId);

  function update(field: keyof OwnerOrganizationDepartmentFormValues, value: string) {
    setForm((previous) => {
      const next = { ...previous, [field]: value };

      if (field === "nome" && autoSlug) {
        next.slug = slugifyOrganizationValue(value);
      }

      if (field === "slug") {
        setAutoSlug(false);
      }

      return next;
    });

    if (errors[field]) {
      setErrors((previous) => ({ ...previous, [field]: undefined }));
    }
  }

  function validate() {
    const newErrors: DeptFormErrors = {};

    if (!form.nome.trim()) {
      newErrors.nome = "Nome é obrigatório";
    }

    if (!form.slug.trim()) {
      newErrors.slug = "Identificador é obrigatório";
    }

    if (!/^[a-z0-9-]+$/.test(form.slug)) {
      newErrors.slug = "Use apenas letras minúsculas, números e hífens";
    }

    if (!form.responsavelNome.trim()) {
      newErrors.responsavelNome = "O responsável é obrigatório ao criar o departamento";
    }

    if (!form.responsavelCargo.trim()) {
      newErrors.responsavelCargo = "Cargo do responsável é obrigatório";
    }

    setErrors(newErrors);

    return Object.keys(newErrors).length === 0;
  }

  async function handleSubmit() {
    if (!validate()) {
      return;
    }

    await onSave(form);
  }

  return (
    <div className="rounded-lg border border-primary/30 bg-card shadow-sm">
      <div className="flex items-center justify-between border-border border-b bg-primary/5 px-4 py-3">
        <h3 className="font-semibold text-foreground text-sm">
          {editId ? "Editar departamento" : "Novo departamento"}
        </h3>
        <button
          className="text-muted-foreground hover:text-foreground"
          onClick={onCancel}
          type="button"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      <div className="grid grid-cols-1 gap-4 p-4 md:grid-cols-2">
        <div className="space-y-1 md:col-span-2">
          <label
            className="flex items-center gap-1.5 font-medium text-muted-foreground text-xs"
            htmlFor="department-name"
          >
            <Building2 className="h-3.5 w-3.5" />
            Nome do departamento <span className="text-destructive">*</span>
          </label>
          <input
            className={cn(
              "w-full rounded-md border bg-card px-3 py-2 text-foreground text-sm focus:border-ring focus:outline-none focus:ring-2 focus:ring-ring/30",
              errors.nome ? "border-destructive" : "border-border",
            )}
            id="department-name"
            onChange={(event) => update("nome", event.target.value)}
            placeholder="Ex.: Secretaria de Administração"
            value={form.nome}
          />
          {errors.nome ? (
            <p className="flex items-center gap-1 text-[11px] text-destructive">
              <AlertCircle className="h-3 w-3" />
              {errors.nome}
            </p>
          ) : null}
        </div>

        <div className="space-y-1">
          <label
            className="flex items-center gap-1.5 font-medium text-muted-foreground text-xs"
            htmlFor="department-slug"
          >
            <Hash className="h-3.5 w-3.5" />
            Identificador (slug) <span className="text-destructive">*</span>
          </label>
          <input
            className={cn(
              "w-full rounded-md border bg-card px-3 py-2 font-mono text-foreground text-sm focus:border-ring focus:outline-none focus:ring-2 focus:ring-ring/30",
              errors.slug ? "border-destructive" : "border-border",
            )}
            id="department-slug"
            onChange={(event) => update("slug", event.target.value)}
            placeholder="secretaria-administracao"
            value={form.slug}
          />
          {errors.slug ? (
            <p className="flex items-center gap-1 text-[11px] text-destructive">
              <AlertCircle className="h-3 w-3" />
              {errors.slug}
            </p>
          ) : (
            <p className="text-[11px] text-muted-foreground">
              Gerado automaticamente a partir do nome
            </p>
          )}
        </div>

        <div className="space-y-1">
          <label
            className="flex items-center gap-1.5 font-medium text-muted-foreground text-xs"
            htmlFor="department-budget-unit"
          >
            <Hash className="h-3.5 w-3.5" />
            Unidade orçamentária
            <span className="font-normal text-[10px] text-muted-foreground">(opcional)</span>
          </label>
          <input
            className="w-full rounded-md border border-border bg-card px-3 py-2 font-mono text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring/30"
            id="department-budget-unit"
            onChange={(event) => update("unidadeOrcamentaria", event.target.value)}
            placeholder="Ex.: 02.001"
            value={form.unidadeOrcamentaria}
          />
        </div>

        <div className="space-y-1 md:col-span-2">
          <label
            className="flex items-center gap-1.5 font-medium text-muted-foreground text-xs"
            htmlFor="department-responsible-name"
          >
            <User className="h-3.5 w-3.5" />
            Responsável <span className="text-destructive">*</span>
          </label>
          <p className="flex items-center gap-1 text-[11px] text-warning">
            <AlertCircle className="h-3 w-3" />
            Todo departamento deve ter um responsável atribuído desde a criação.
          </p>
          <input
            className={cn(
              "w-full rounded-md border bg-card px-3 py-2 text-foreground text-sm focus:border-ring focus:outline-none focus:ring-2 focus:ring-ring/30",
              errors.responsavelNome ? "border-destructive" : "border-border",
            )}
            id="department-responsible-name"
            onChange={(event) => update("responsavelNome", event.target.value)}
            placeholder="Nome completo do responsável"
            value={form.responsavelNome}
          />
          {errors.responsavelNome ? (
            <p className="flex items-center gap-1 text-[11px] text-destructive">
              <AlertCircle className="h-3 w-3" />
              {errors.responsavelNome}
            </p>
          ) : null}
        </div>

        <div className="space-y-1 md:col-span-2">
          <label
            className="flex items-center gap-1.5 font-medium text-muted-foreground text-xs"
            htmlFor="department-responsible-role"
          >
            <Briefcase className="h-3.5 w-3.5" />
            Cargo do responsável <span className="text-destructive">*</span>
          </label>
          <input
            className={cn(
              "w-full rounded-md border bg-card px-3 py-2 text-foreground text-sm focus:border-ring focus:outline-none focus:ring-2 focus:ring-ring/30",
              errors.responsavelCargo ? "border-destructive" : "border-border",
            )}
            id="department-responsible-role"
            onChange={(event) => update("responsavelCargo", event.target.value)}
            placeholder="Ex.: Secretário Municipal de Administração"
            value={form.responsavelCargo}
          />
          {errors.responsavelCargo ? (
            <p className="flex items-center gap-1 text-[11px] text-destructive">
              <AlertCircle className="h-3 w-3" />
              {errors.responsavelCargo}
            </p>
          ) : null}
        </div>
      </div>

      <div className="flex justify-end gap-2 border-border border-t px-4 py-3">
        <button
          className="rounded-md border border-border bg-card px-3 py-1.5 text-muted-foreground text-sm transition-colors hover:bg-muted"
          onClick={onCancel}
          type="button"
        >
          Cancelar
        </button>
        <button
          className="flex items-center gap-1.5 rounded-md bg-primary px-3 py-1.5 font-medium text-primary-foreground text-sm transition-colors hover:bg-accent disabled:opacity-60"
          disabled={saving}
          onClick={() => void handleSubmit()}
          type="button"
        >
          {saving ? (
            <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-primary-foreground border-t-transparent" />
          ) : (
            <Save className="h-3.5 w-3.5" />
          )}
          {saving ? "Salvando..." : editId ? "Salvar alterações" : "Criar departamento"}
        </button>
      </div>
    </div>
  );
}

function TabDepartamentos({
  organizationId,
  departments,
  isLoading,
  isError,
  onRetry,
}: {
  organizationId?: string;
  departments: OwnerOrganizationDepartment[];
  isLoading: boolean;
  isError: boolean;
  onRetry: () => void;
}) {
  const createDepartment = useOwnerOrganizationCreateDepartment();
  const updateDepartment = useOwnerOrganizationUpdateDepartment();
  const deleteDepartment = useOwnerOrganizationDeleteDepartment();
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const saving = createDepartment.isPending || updateDepartment.isPending;

  async function runAction(action: () => Promise<unknown>, fallback: string) {
    setActionError(null);

    try {
      await action();
    } catch (error) {
      setActionError(getOwnerOrganizationErrorMessage(error, fallback));
    }
  }

  async function handleCreate(data: OwnerOrganizationDepartmentFormValues) {
    await runAction(async () => {
      await createDepartment.mutateAsync({
        data: toOwnerOrganizationDepartmentCreatePayload(data, organizationId),
      });
      setShowForm(false);
    }, "Não foi possível criar o departamento.");
  }

  async function handleEdit(data: OwnerOrganizationDepartmentFormValues) {
    if (!editingId) {
      return;
    }

    await runAction(async () => {
      await updateDepartment.mutateAsync({
        departmentId: editingId,
        data: toOwnerOrganizationDepartmentUpdatePayload(data),
      });
      setEditingId(null);
    }, "Não foi possível salvar o departamento.");
  }

  if (isLoading && departments.length === 0) {
    return (
      <div className="space-y-6">
        <div className="flex items-start justify-between gap-3">
          <div>
            <LoadingLine className="h-5 w-48" />
            <LoadingLine className="mt-2 h-4 w-72" />
          </div>
          <LoadingLine className="h-8 w-36" />
        </div>
        <LoadingLine className="h-20 w-full" />
        <LoadingLine className="h-20 w-full" />
      </div>
    );
  }

  if (isError) {
    return <SectionState message="Não foi possível carregar departamentos." onRetry={onRetry} />;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="font-semibold text-base text-foreground">Departamentos e Unidades</h2>
          <p className="mt-0.5 text-muted-foreground text-sm">
            {departments.length} {departments.length === 1 ? "departamento" : "departamentos"}{" "}
            cadastrados · Todo departamento exige um responsável.
          </p>
        </div>
        {!showForm ? (
          <button
            className="flex shrink-0 items-center gap-1.5 rounded-md bg-primary px-3 py-1.5 font-medium text-primary-foreground text-sm transition-colors hover:bg-accent"
            onClick={() => {
              setShowForm(true);
              setEditingId(null);
            }}
            type="button"
          >
            <Plus className="h-3.5 w-3.5" />
            Novo departamento
          </button>
        ) : null}
      </div>

      {actionError ? <InlineError message={actionError} /> : null}

      {showForm ? (
        <DeptForm
          initialData={getOwnerOrganizationEmptyDepartmentForm()}
          onCancel={() => setShowForm(false)}
          onSave={handleCreate}
          saving={saving}
        />
      ) : null}

      <div className="space-y-2.5">
        {departments.length === 0 ? (
          <div className="rounded-lg border border-border border-dashed px-4 py-12 text-center">
            <Building2 className="mx-auto mb-2 h-8 w-8 text-muted-foreground/40" />
            <p className="text-muted-foreground text-sm">Nenhum departamento cadastrado ainda.</p>
            <button
              className="mt-3 font-medium text-primary text-sm hover:underline"
              onClick={() => setShowForm(true)}
              type="button"
            >
              Criar primeiro departamento
            </button>
          </div>
        ) : (
          departments.map((department) => {
            if (editingId === department.id) {
              return (
                <DeptForm
                  editId={department.id}
                  initialData={toOwnerOrganizationDepartmentFormValues(department)}
                  key={department.id}
                  onCancel={() => setEditingId(null)}
                  onSave={handleEdit}
                  saving={saving}
                />
              );
            }

            return (
              <div
                className="rounded-lg border border-border bg-card transition-colors hover:border-border/80"
                key={department.id}
              >
                <div className="flex items-start gap-3 px-4 py-3.5">
                  <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-primary/8">
                    <Building2 className="h-4.5 w-4.5 text-primary" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-semibold text-foreground text-sm">
                        {department.name}
                      </span>
                      <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-[10px] text-muted-foreground">
                        {department.slug}
                      </code>
                      {department.budgetUnitCode ? (
                        <span className="rounded bg-muted px-1.5 py-0.5 text-[10px] text-muted-foreground">
                          UO {department.budgetUnitCode}
                        </span>
                      ) : null}
                    </div>
                    <div className="mt-1.5 flex flex-col gap-1 text-muted-foreground text-xs sm:flex-row sm:items-center sm:gap-4">
                      <span className="flex items-center gap-1">
                        <User className="h-3.5 w-3.5" />
                        <span className="font-medium text-foreground">
                          {department.responsibleName}
                        </span>
                        <span>· {department.responsibleRole}</span>
                      </span>
                    </div>
                  </div>
                  <div className="flex shrink-0 items-center gap-1.5">
                    <button
                      className="rounded p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                      onClick={() => {
                        setEditingId(department.id);
                        setShowForm(false);
                      }}
                      title="Editar departamento"
                      type="button"
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </button>
                    {deletingId === department.id ? (
                      <div className="flex items-center gap-1">
                        <span className="mr-1 hidden text-destructive text-xs sm:inline">
                          Confirmar?
                        </span>
                        <button
                          className="rounded bg-destructive/10 p-1.5 text-destructive transition-colors hover:bg-destructive/20"
                          disabled={deleteDepartment.isPending}
                          onClick={() =>
                            void runAction(async () => {
                              await deleteDepartment.mutateAsync({
                                departmentId: department.id,
                              });
                              setDeletingId(null);
                            }, "Não foi possível excluir o departamento.")
                          }
                          type="button"
                        >
                          <CheckCircle2 className="h-3.5 w-3.5" />
                        </button>
                        <button
                          className="rounded p-1.5 text-muted-foreground transition-colors hover:bg-muted"
                          onClick={() => setDeletingId(null)}
                          type="button"
                        >
                          <X className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    ) : (
                      <button
                        className="rounded p-1.5 text-muted-foreground transition-colors hover:bg-destructive/5 hover:text-destructive"
                        onClick={() => setDeletingId(department.id)}
                        title="Excluir departamento"
                        type="button"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

function UploadZone({
  label,
  hint,
  accept,
  maxMB,
  currentFile,
  onUpload,
  icon: Icon,
  previewType,
}: {
  label: string;
  hint: string;
  accept: string;
  maxMB: number;
  currentFile: UploadedFile | null;
  onUpload: (file: File) => Promise<void>;
  icon: ElementType;
  previewType: "image" | "document";
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  async function processFile(file: File) {
    setError(null);

    if (file.size > maxMB * 1024 * 1024) {
      setError(`Arquivo muito grande. Máximo permitido: ${maxMB} MB.`);
      return;
    }

    try {
      setUploading(true);
      await onUpload(file);
    } catch (uploadError) {
      setError(
        getOwnerOrganizationErrorMessage(uploadError, "Não foi possível enviar este arquivo."),
      );
    } finally {
      setUploading(false);
      if (inputRef.current) {
        inputRef.current.value = "";
      }
    }
  }

  function handleDrop(event: DragEvent<HTMLButtonElement>) {
    event.preventDefault();
    setDragging(false);
    const file = event.dataTransfer.files[0];

    if (file) {
      void processFile(file);
    }
  }

  function handleChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];

    if (file) {
      void processFile(file);
    }
  }

  const fileSize = formatBytes(currentFile?.size);

  return (
    <div className="flex h-full flex-col overflow-hidden rounded-lg border border-border">
      <div className="flex items-center gap-2 border-border border-b bg-muted/50 px-4 py-2.5">
        <Icon className="h-4 w-4 text-muted-foreground" />
        <h3 className="font-semibold text-foreground text-sm">{label}</h3>
      </div>
      <div className="flex flex-1 flex-col gap-3 p-4">
        <p className="text-muted-foreground text-xs">{hint}</p>

        {currentFile ? (
          <div className="mt-auto space-y-2">
            {previewType === "image" ? (
              <div
                className="mx-auto flex w-full max-w-xs items-center justify-center overflow-hidden rounded-md border border-border bg-muted/40"
                style={{ minHeight: 80 }}
              >
                <img
                  alt={currentFile.name}
                  className="max-h-32 max-w-full object-contain p-2"
                  src={currentFile.url}
                />
              </div>
            ) : null}
            {previewType === "document" ? (
              <div className="flex items-center gap-3 rounded-md border border-border bg-muted/40 px-3 py-2.5">
                <FileText className="h-8 w-8 shrink-0 text-primary" />
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium text-foreground text-sm">{currentFile.name}</p>
                  <p className="text-muted-foreground text-xs">
                    {fileSize ? `${fileSize} · ` : null}Enviado em {currentFile.uploadedAt}
                  </p>
                </div>
              </div>
            ) : null}
            {previewType === "image" ? (
              <div className="flex items-center gap-2 rounded-md bg-muted/40 px-3 py-2">
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium text-foreground text-xs">{currentFile.name}</p>
                  <p className="text-muted-foreground text-xs">
                    {fileSize ? `${fileSize} · ` : null}
                    {currentFile.uploadedAt}
                  </p>
                </div>
              </div>
            ) : null}
            <div className="flex gap-2">
              <button
                className="flex items-center gap-1.5 rounded-md border border-border bg-card px-2.5 py-1.5 text-muted-foreground text-xs transition-colors hover:bg-muted"
                onClick={() => inputRef.current?.click()}
                type="button"
              >
                <RefreshCw className="h-3 w-3" />
                Substituir
              </button>
              <a
                className="flex items-center gap-1.5 rounded-md border border-border bg-card px-2.5 py-1.5 text-muted-foreground text-xs transition-colors hover:bg-muted"
                download={currentFile.name}
                href={currentFile.url}
              >
                <Download className="h-3 w-3" />
                Baixar
              </a>
            </div>
          </div>
        ) : (
          <button
            className={cn(
              "mt-auto flex min-h-36 w-full cursor-pointer flex-col items-center justify-center gap-2 rounded-md border-2 border-dashed px-4 py-8 transition-colors",
              dragging
                ? "border-primary bg-primary/5"
                : "border-border hover:border-primary/50 hover:bg-muted/30",
              uploading && "pointer-events-none opacity-60",
            )}
            onClick={() => inputRef.current?.click()}
            onDragLeave={() => setDragging(false)}
            onDragOver={(event) => {
              event.preventDefault();
              setDragging(true);
            }}
            onDrop={handleDrop}
            type="button"
          >
            {uploading ? (
              <span className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
            ) : (
              <Upload className="h-6 w-6 text-muted-foreground" />
            )}
            <span className="text-center text-muted-foreground text-sm">
              {uploading ? (
                "Enviando..."
              ) : (
                <>
                  <span className="font-medium text-primary">Clique para enviar</span> ou arraste o
                  arquivo
                </>
              )}
            </span>
            <span className="text-muted-foreground text-xs">
              {accept.toUpperCase()} · Máx. {maxMB} MB
            </span>
          </button>
        )}

        {error ? (
          <p className="flex items-center gap-1 text-destructive text-xs">
            <AlertCircle className="h-3.5 w-3.5" />
            {error}
          </p>
        ) : null}
      </div>
      <input
        aria-label={label}
        accept={accept}
        className="hidden"
        onChange={handleChange}
        ref={inputRef}
        type="file"
      />
    </div>
  );
}

function createPersistedFile({
  name,
  type,
  url,
  updatedAt,
}: {
  name: string;
  type: string;
  url: string | null;
  updatedAt: string;
}): UploadedFile | null {
  if (!url) {
    return null;
  }

  const resolvedUrl = resolveOrganizationAssetUrl(url, updatedAt);

  if (!resolvedUrl) {
    return null;
  }

  return {
    name,
    type,
    url: resolvedUrl,
    uploadedAt: formatDateTime(updatedAt),
  };
}

function TabDocumentos({
  organization,
  isLoading,
  isError,
  onRetry,
}: {
  organization?: OwnerOrganizationProfile;
  isLoading: boolean;
  isError: boolean;
  onRetry: () => void;
}) {
  const uploadLogo = useOwnerOrganizationUploadLogo();
  const uploadCrest = useOwnerOrganizationUploadCrest();
  const uploadLetterhead = useOwnerOrganizationUploadLetterhead();
  const logo = organization
    ? createPersistedFile({
        name: "Logomarca da Prefeitura",
        type: "image/*",
        url: organization.logoUrl,
        updatedAt: organization.updatedAt,
      })
    : null;
  const brasao = organization
    ? createPersistedFile({
        name: "Brasão Municipal",
        type: "image/*",
        url: organization.crestUrl,
        updatedAt: organization.updatedAt,
      })
    : null;
  const papelTimbrado = organization
    ? createPersistedFile({
        name: "Papel timbrado",
        type: "image/*",
        url: organization.letterhead?.url ?? null,
        updatedAt: organization.updatedAt,
      })
    : null;

  if (isLoading && !organization) {
    return (
      <div className="space-y-6">
        <div>
          <LoadingLine className="h-5 w-56" />
          <LoadingLine className="mt-2 h-4 w-96 max-w-full" />
        </div>
        <LoadingLine className="h-20 w-full" />
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <LoadingLine className="h-64 w-full" />
          <LoadingLine className="h-64 w-full" />
        </div>
      </div>
    );
  }

  if (isError || !organization) {
    return (
      <SectionState
        message="Não foi possível carregar os documentos institucionais."
        onRetry={onRetry}
      />
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-semibold text-base text-foreground">Documentos Institucionais</h2>
        <p className="mt-0.5 text-muted-foreground text-sm">
          Identidade visual usada no cabeçalho e rodapé de documentos gerados pelo sistema.
        </p>
      </div>

      <div className="flex items-start gap-2.5 rounded-md border border-info/20 bg-info/8 px-3.5 py-3 text-info text-xs">
        <Info className="mt-0.5 h-4 w-4 shrink-0" />
        <div>
          <p className="font-semibold">Documentos gerados usam esses arquivos</p>
          <p className="mt-0.5 text-info/80">
            Certifique-se de enviar arquivos de alta qualidade. Formatos recomendados: PNG com fundo
            transparente para logomarca e brasão; imagem A4 ou DOCX para papel timbrado.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <UploadZone
          accept=".png,.jpg,.jpeg,.svg,.webp"
          currentFile={logo}
          hint="Usada no cabeçalho de documentos e no painel. PNG ou SVG com fundo transparente preferido."
          icon={ImageIcon}
          label="Logomarca da Prefeitura"
          maxMB={5}
          onUpload={async (file) => {
            await uploadLogo.mutateAsync({ organizationId: organization.id, data: { file } });
          }}
          previewType="image"
        />
        <UploadZone
          accept=".png,.jpg,.jpeg,.svg"
          currentFile={brasao}
          hint="Brasão oficial do município. Usado em documentos formais e editais."
          icon={ImageIcon}
          label="Brasão Municipal"
          maxMB={5}
          onUpload={async (file) => {
            await uploadCrest.mutateAsync({ organizationId: organization.id, data: { file } });
          }}
          previewType="image"
        />
      </div>

      <UploadZone
        accept=".png,.jpg,.jpeg,.webp,.docx"
        currentFile={papelTimbrado}
        hint="Imagem usada como fundo dos documentos oficiais. Envie PNG, JPEG, WebP ou DOCX; arquivos DOCX serão convertidos para imagem."
        icon={FileImage}
        label="Papel Timbrado"
        maxMB={20}
        onUpload={async (file) => {
          await uploadLetterhead.mutateAsync({
            organizationId: organization.id,
            data: { file },
          });
        }}
        previewType="image"
      />

      {logo || brasao || papelTimbrado ? (
        <div className="flex items-center gap-2 rounded-md border border-success/20 bg-success/8 px-3 py-2 text-success text-xs">
          <Check className="h-3.5 w-3.5" />
          {[logo && "Logomarca", brasao && "Brasão", papelTimbrado && "Papel timbrado"]
            .filter(Boolean)
            .join(", ")}{" "}
          {logo && brasao && papelTimbrado ? "cadastrados" : "cadastrado"}.
        </div>
      ) : null}
    </div>
  );
}

export function OwnerOrganizationWorkspace() {
  const [searchParams, setSearchParams] = useSearchParams();
  const requestedTab = getTabFromQuery(searchParams.get("tab"));
  const [activeTab, setActiveTab] = useState<Tab>(requestedTab);
  const organizationQuery = useOwnerOrganizationProfile();
  const membersQuery = useOwnerOrganizationMembers();
  const invitesQuery = useOwnerOrganizationInvites();
  const departmentsQuery = useOwnerOrganizationDepartments();
  const organization = organizationQuery.data;
  const members = membersQuery.data?.items ?? [];
  const invites = invitesQuery.data?.items ?? [];
  const departments = departmentsQuery.data?.items ?? [];
  const activeMembers = members.filter(isOwnerOrganizationActiveMember).length;
  const visibleInvites = invites.filter(isOwnerOrganizationVisibleInvite);
  const pendingInvites = visibleInvites.filter(isOwnerOrganizationPendingInvite).length;
  const workspaceLoading =
    organizationQuery.isLoading ||
    membersQuery.isLoading ||
    invitesQuery.isLoading ||
    departmentsQuery.isLoading;

  useEffect(() => {
    setActiveTab(requestedTab);
  }, [requestedTab]);

  function handleTabChange(tab: Tab) {
    setActiveTab(tab);
    setSearchParams(
      (current) => {
        const next = new URLSearchParams(current);
        next.set("tab", tab);
        return next;
      },
      { replace: true },
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <div className="bg-card">
        <div className="mx-auto w-full max-w-5xl px-6 pt-5 pb-3">
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-primary/10">
              <Building2 className="h-6 w-6 text-primary" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                {organization ? (
                  <h1 className="font-bold text-foreground text-lg leading-tight">
                    {organization.name}
                  </h1>
                ) : (
                  <LoadingLine className="h-6 w-80 max-w-full" />
                )}
                {organization ? (
                  <span
                    className={cn(
                      "rounded border px-2 py-0.5 font-medium text-xs",
                      organization.isActive
                        ? "border-success/20 bg-success/10 text-success"
                        : "border-border bg-muted text-muted-foreground",
                    )}
                  >
                    {organization.isActive ? "Ativo" : "Inativo"}
                  </span>
                ) : null}
              </div>
              {organization ? (
                <>
                  <p className="mt-0.5 text-muted-foreground text-xs">
                    {organization.officialName}
                  </p>
                  <div className="mt-2 hidden sm:block">
                    <OrgSummaryStrip organization={organization} />
                  </div>
                </>
              ) : (
                <LoadingLine className="mt-2 h-4 w-56" />
              )}
            </div>
          </div>

          {organizationQuery.isError ? (
            <div className="mt-4">
              <InlineError
                message={getOwnerOrganizationErrorMessage(
                  organizationQuery.error,
                  "Não foi possível carregar a organização.",
                )}
              />
            </div>
          ) : null}

          <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-3">
            <StatCard
              accent="primary"
              icon={Users}
              label="Membros ativos"
              loading={membersQuery.isLoading}
              sub={`${members.length} total`}
              value={activeMembers}
            />
            <StatCard
              accent={pendingInvites > 0 ? "warning" : undefined}
              icon={Mail}
              label="Convites pendentes"
              loading={invitesQuery.isLoading}
              sub={pendingInvites > 0 ? "Aguardando aceite" : "Nenhum pendente"}
              value={pendingInvites}
            />
            <StatCard
              accent="success"
              icon={FolderOpen}
              label="Departamentos"
              loading={departmentsQuery.isLoading}
              sub="Unidades cadastradas"
              value={departments.length}
            />
          </div>
        </div>
      </div>

      <div className="border-border border-b bg-card">
        <div className="mx-auto w-full max-w-5xl px-6">
          <div className="-mb-px flex gap-0 overflow-x-auto" role="tablist">
            {TABS.map((tab) => (
              <button
                aria-selected={activeTab === tab.id}
                className={cn(
                  "flex items-center gap-1.5 whitespace-nowrap border-b-2 px-4 py-2.5 font-medium text-sm transition-colors",
                  activeTab === tab.id
                    ? "border-primary text-primary"
                    : "border-transparent text-muted-foreground hover:border-border hover:text-foreground",
                )}
                key={tab.id}
                onClick={() => handleTabChange(tab.id)}
                role="tab"
                type="button"
              >
                <tab.icon className="h-4 w-4 shrink-0" />
                {tab.label}
                {tab.id === "membros" && pendingInvites > 0 ? (
                  <span
                    className={cn(
                      "rounded-md border px-1.5 py-0.5 font-semibold text-[10px] leading-none",
                      activeTab === tab.id
                        ? "border-primary/20 bg-primary/10 text-primary"
                        : "border-border bg-muted text-muted-foreground",
                    )}
                  >
                    {pendingInvites}
                  </span>
                ) : null}
              </button>
            ))}
          </div>
        </div>
      </div>

      <main aria-busy={workspaceLoading} className="mx-auto w-full max-w-5xl flex-1 px-6 py-6">
        {activeTab === "dados" ? (
          <TabDados
            isError={organizationQuery.isError}
            isLoading={organizationQuery.isLoading}
            onRetry={() => void organizationQuery.refetch()}
            organization={organization}
          />
        ) : null}
        {activeTab === "membros" ? (
          <TabMembros
            invites={visibleInvites}
            isError={membersQuery.isError || invitesQuery.isError}
            isLoading={membersQuery.isLoading || invitesQuery.isLoading}
            members={members}
            onRetry={() => {
              void membersQuery.refetch();
              void invitesQuery.refetch();
            }}
            organizationId={organization?.id}
          />
        ) : null}
        {activeTab === "departamentos" ? (
          <TabDepartamentos
            departments={departments}
            isError={departmentsQuery.isError}
            isLoading={departmentsQuery.isLoading}
            onRetry={() => void departmentsQuery.refetch()}
            organizationId={organization?.id}
          />
        ) : null}
        {activeTab === "documentos" ? (
          <TabDocumentos
            isError={organizationQuery.isError}
            isLoading={organizationQuery.isLoading}
            onRetry={() => void organizationQuery.refetch()}
            organization={organization}
          />
        ) : null}
      </main>
    </div>
  );
}

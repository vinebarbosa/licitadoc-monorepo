import {
  ArrowLeft,
  ArrowRight,
  Building2,
  Calendar,
  Check,
  CheckCircle2,
  FileText,
  Hash,
  Layers3,
  Package,
  Plus,
  Scale,
  Trash2,
  User,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { useAuthSession } from "@/modules/auth";
import { Alert, AlertDescription, AlertTitle } from "@/shared/ui/alert";
import { Badge } from "@/shared/ui/badge";
import { Button } from "@/shared/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/shared/ui/card";
import { Checkbox } from "@/shared/ui/checkbox";
import { Input } from "@/shared/ui/input";
import { Label } from "@/shared/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/shared/ui/select";
import { Separator } from "@/shared/ui/separator";
import { Textarea } from "@/shared/ui/textarea";
import {
  type ProcessCreateRequest,
  type ProcessDepartmentListItem,
  type ProcessOrganizationListItem,
  useProcessCreate,
  useProcessDepartmentsList,
  useProcessOrganizationsList,
} from "../api/processes";

type ProcessStep = "dados" | "vinculos" | "itens" | "revisao";

type ProcessItemComponent = {
  id: string;
  title: string;
  description: string;
  quantity: string;
  unit: string;
};

type ProcessItem = {
  id: string;
  kind: "simple" | "kit";
  code: string;
  title: string;
  description: string;
  quantity: string;
  unit: string;
  unitValue: string;
  totalValue: string;
  components: ProcessItemComponent[];
};

type FormValues = {
  formaContratacao: string;
  modalidade: string;
  processNumber: string;
  externalId: string;
  issuedAt: string;
  responsibleName: string;
  title: string;
  object: string;
  justification: string;
  organizationId: string;
  departmentIds: string[];
  items: ProcessItem[];
};

type ProcessCreateItemRequest = NonNullable<ProcessCreateRequest["items"]>[number];

const steps: Array<{ id: ProcessStep; label: string; description: string }> = [
  { id: "dados", label: "Dados do Processo", description: "Informações básicas" },
  { id: "vinculos", label: "Vínculos", description: "Unidades vinculadas" },
  { id: "itens", label: "Itens", description: "Produtos e serviços" },
  { id: "revisao", label: "Revisão", description: "Conferência final" },
];

const formasContratacao = [
  { value: "licitacao", label: "Licitação" },
  { value: "dispensa", label: "Dispensa" },
  { value: "inexigibilidade", label: "Inexigibilidade" },
];

const modalidadesLicitacao = [
  { value: "pregao", label: "Pregão" },
  { value: "concorrencia", label: "Concorrência" },
  { value: "concurso", label: "Concurso" },
  { value: "leilao", label: "Leilão" },
  { value: "dialogo_competitivo", label: "Diálogo Competitivo" },
];

function generateId() {
  return globalThis.crypto?.randomUUID?.() ?? Math.random().toString(36).slice(2, 9);
}

function trimOrNull(value: string) {
  const trimmed = value.trim();

  return trimmed.length > 0 ? trimmed : null;
}

function formatCurrency(value: string) {
  const num = Number.parseFloat(value.replace(/[^\d,.-]/g, "").replace(",", "."));

  if (Number.isNaN(num)) {
    return "";
  }

  return num.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function parseCurrencyToNumber(value: string) {
  const num = Number.parseFloat(value.replace(/[^\d,.-]/g, "").replace(",", "."));

  return Number.isNaN(num) ? 0 : num;
}

function calculateItemTotal(quantity: string, unitValue: string) {
  const qty = Number.parseFloat(quantity) || 0;
  const unit = parseCurrencyToNumber(unitValue);

  return (qty * unit).toFixed(2);
}

function formatDate(dateString: string) {
  if (!dateString) {
    return "";
  }

  const date = new Date(`${dateString}T00:00:00`);

  return date.toLocaleDateString("pt-BR");
}

function getDepartmentCode(department: ProcessDepartmentListItem) {
  return department.budgetUnitCode ?? department.id.slice(0, 8);
}

function getApiErrorMessage(error: unknown) {
  if (
    typeof error === "object" &&
    error !== null &&
    "data" in error &&
    typeof error.data === "object" &&
    error.data !== null &&
    "message" in error.data &&
    typeof error.data.message === "string" &&
    error.data.message.length > 0
  ) {
    return error.data.message;
  }

  if (
    typeof error === "object" &&
    error !== null &&
    "message" in error &&
    typeof error.message === "string" &&
    error.message.length > 0
  ) {
    return error.message;
  }

  return "Não foi possível criar o processo.";
}

function Stepper({
  currentStep,
  isMobile = false,
}: {
  currentStep: ProcessStep;
  isMobile?: boolean;
}) {
  const currentIndex = steps.findIndex((step) => step.id === currentStep);

  if (isMobile) {
    return (
      <div className="flex items-center justify-start gap-1 overflow-x-auto pb-2 md:hidden">
        {steps.map((step, index) => {
          const isActive = index === currentIndex;
          const isComplete = index < currentIndex;

          return (
            <div
              key={step.id}
              className={`flex shrink-0 items-center gap-2 whitespace-nowrap rounded-full px-3 py-1.5 text-sm transition-all ${
                isActive
                  ? "bg-primary text-primary-foreground"
                  : isComplete
                    ? "bg-primary/10 text-primary"
                    : "bg-muted text-muted-foreground"
              }`}
            >
              {isComplete ? (
                <Check className="h-3.5 w-3.5" />
              ) : (
                <span className="font-medium">{index + 1}</span>
              )}
              <span className="font-medium">{step.label}</span>
            </div>
          );
        })}
      </div>
    );
  }

  return (
    <ol
      aria-label="Etapas de criação do processo"
      className="hidden items-start justify-between px-6 py-8 md:flex"
      data-testid="process-creation-stepper"
    >
      {steps.map((step, index) => {
        const isActive = index === currentIndex;
        const isComplete = index < currentIndex;
        const isLast = index === steps.length - 1;

        return (
          <li
            key={step.id}
            aria-current={isActive ? "step" : undefined}
            className="relative flex flex-1 flex-col items-center"
            data-state={isActive ? "active" : isComplete ? "complete" : "pending"}
          >
            {!isLast && (
              <div
                className={`absolute left-[calc(50%+20px)] right-[calc(-50%+20px)] top-4 h-0.5 ${
                  isComplete ? "bg-primary" : "bg-muted"
                }`}
              />
            )}

            <div
              data-step-indicator
              className={`relative z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-medium transition-all ${
                isActive
                  ? "bg-primary text-primary-foreground shadow-md"
                  : isComplete
                    ? "border-2 border-primary/60 bg-primary/10 text-primary"
                    : "border-2 border-muted bg-background text-muted-foreground"
              }`}
            >
              {isComplete ? <Check className="h-4 w-4" /> : index + 1}
            </div>

            <div className="mt-3 max-w-40 text-center">
              <span
                className={`block text-sm font-medium ${
                  isActive || isComplete ? "text-foreground" : "text-muted-foreground"
                }`}
              >
                {step.label}
              </span>
              <span
                className={`mt-0.5 block text-xs ${
                  isActive || isComplete ? "text-muted-foreground" : "text-muted-foreground/70"
                }`}
              >
                {step.description}
              </span>
            </div>
          </li>
        );
      })}
    </ol>
  );
}

function SummaryPanel({
  departments,
  organizations,
  values,
}: {
  departments: ProcessDepartmentListItem[];
  organizations: ProcessOrganizationListItem[];
  values: FormValues;
}) {
  const selectedDepartments = departments.filter((department) =>
    values.departmentIds.includes(department.id),
  );
  const selectedOrg = organizations.find(
    (organization) => organization.id === values.organizationId,
  );
  const totalItems = values.items.length;
  const totalValue = values.items.reduce(
    (acc, item) => acc + parseCurrencyToNumber(item.totalValue),
    0,
  );

  return (
    <Card className="sticky top-6 hidden lg:block">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <FileText className="h-4 w-4 text-primary" />
          Resumo do Processo
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4 text-sm">
        {values.processNumber && (
          <div className="flex items-start gap-2">
            <Hash className="mt-0.5 h-4 w-4 text-muted-foreground" />
            <div>
              <p className="text-muted-foreground">Número</p>
              <p className="font-medium">{values.processNumber}</p>
            </div>
          </div>
        )}

        {values.formaContratacao && (
          <div className="flex items-start gap-2">
            <Scale className="mt-0.5 h-4 w-4 text-muted-foreground" />
            <div>
              <p className="text-muted-foreground">Forma de contratação</p>
              <p className="font-medium">
                {formasContratacao.find((item) => item.value === values.formaContratacao)?.label}
                {values.formaContratacao === "licitacao" && values.modalidade && (
                  <span className="text-muted-foreground">
                    {" "}
                    - {modalidadesLicitacao.find((item) => item.value === values.modalidade)?.label}
                  </span>
                )}
              </p>
            </div>
          </div>
        )}

        {values.responsibleName && (
          <div className="flex items-start gap-2">
            <User className="mt-0.5 h-4 w-4 text-muted-foreground" />
            <div>
              <p className="text-muted-foreground">Responsável</p>
              <p className="font-medium">{values.responsibleName}</p>
            </div>
          </div>
        )}

        {values.issuedAt && (
          <div className="flex items-start gap-2">
            <Calendar className="mt-0.5 h-4 w-4 text-muted-foreground" />
            <div>
              <p className="text-muted-foreground">Data de emissão</p>
              <p className="font-medium">{formatDate(values.issuedAt)}</p>
            </div>
          </div>
        )}

        {selectedOrg && (
          <div className="flex items-start gap-2">
            <Building2 className="mt-0.5 h-4 w-4 text-muted-foreground" />
            <div>
              <p className="text-muted-foreground">Organização</p>
              <p className="font-medium">{selectedOrg.name}</p>
            </div>
          </div>
        )}

        {selectedDepartments.length > 0 && (
          <>
            <Separator />
            <div>
              <p className="mb-2 text-muted-foreground">Unidades vinculadas</p>
              <div className="flex flex-wrap gap-1">
                {selectedDepartments.map((department) => (
                  <Badge key={department.id} variant="secondary" className="text-xs">
                    {getDepartmentCode(department)}
                  </Badge>
                ))}
              </div>
            </div>
          </>
        )}

        {totalItems > 0 && (
          <>
            <Separator />
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Total de itens</span>
                <Badge variant="secondary">{totalItems}</Badge>
              </div>
              {totalValue > 0 && (
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Valor estimado</span>
                  <span className="font-semibold text-primary">
                    {totalValue.toLocaleString("pt-BR", {
                      style: "currency",
                      currency: "BRL",
                    })}
                  </span>
                </div>
              )}
            </div>
          </>
        )}

        {!values.processNumber && !values.formaContratacao && totalItems === 0 && (
          <p className="text-muted-foreground italic">
            Preencha os campos para visualizar o resumo do processo.
          </p>
        )}
      </CardContent>
    </Card>
  );
}

function ItemCard({
  index,
  item,
  onAddComponent,
  onRemove,
  onRemoveComponent,
  onUpdate,
  onUpdateComponent,
}: {
  index: number;
  item: ProcessItem;
  onAddComponent: () => void;
  onRemove: () => void;
  onRemoveComponent: (componentId: string) => void;
  onUpdate: (field: keyof ProcessItem, value: string) => void;
  onUpdateComponent: (
    componentId: string,
    field: keyof ProcessItemComponent,
    value: string,
  ) => void;
}) {
  const isKit = item.kind === "kit";

  return (
    <div className="rounded-lg border bg-card p-4 shadow-sm">
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Badge variant={isKit ? "default" : "secondary"}>
            {isKit ? (
              <>
                <Package className="mr-1 h-3 w-3" />
                Kit {index + 1}
              </>
            ) : (
              <>Item {index + 1}</>
            )}
          </Badge>
          {item.title && (
            <span className="max-w-48 truncate text-sm text-muted-foreground">{item.title}</span>
          )}
        </div>
        <Button type="button" variant="ghost" size="sm" onClick={onRemove}>
          <span className="sr-only">Remover item {index + 1}</span>
          <Trash2 className="h-4 w-4 text-destructive" />
        </Button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <div className="space-y-2">
          <Label>Código</Label>
          <Input
            aria-label={`Código do item ${index + 1}`}
            value={item.code}
            onChange={(event) => onUpdate("code", event.target.value)}
            placeholder="Ex: 001.001"
          />
        </div>
        <div className="space-y-2 sm:col-span-2">
          <Label>Título</Label>
          <Input
            aria-label={`Título do item ${index + 1}`}
            value={item.title}
            onChange={(event) => onUpdate("title", event.target.value)}
            placeholder="Título do item"
          />
        </div>
        {!isKit && (
          <div className="space-y-2 sm:col-span-2 lg:col-span-3">
            <Label>Descrição</Label>
            <Textarea
              aria-label={`Descrição do item ${index + 1}`}
              value={item.description}
              onChange={(event) => onUpdate("description", event.target.value)}
              placeholder="Descrição detalhada do item ou serviço"
              className="min-h-20"
            />
          </div>
        )}
        <div className="space-y-2">
          <Label>Quantidade</Label>
          <Input
            aria-label={`Quantidade do item ${index + 1}`}
            type="number"
            value={item.quantity}
            onChange={(event) => {
              onUpdate("quantity", event.target.value);
              onUpdate("totalValue", calculateItemTotal(event.target.value, item.unitValue));
            }}
            placeholder="0"
          />
        </div>
        <div className="space-y-2">
          <Label>Unidade</Label>
          <Input
            aria-label={`Unidade do item ${index + 1}`}
            value={item.unit}
            onChange={(event) => onUpdate("unit", event.target.value)}
            placeholder="UN, KG, M..."
          />
        </div>
        <div className="space-y-2">
          <Label>Valor unitário</Label>
          <Input
            aria-label={`Valor unitário do item ${index + 1}`}
            value={item.unitValue}
            onChange={(event) => {
              onUpdate("unitValue", event.target.value);
              onUpdate("totalValue", calculateItemTotal(item.quantity, event.target.value));
            }}
            placeholder="R$ 0,00"
          />
        </div>
      </div>

      {item.totalValue && parseCurrencyToNumber(item.totalValue) > 0 && (
        <div className="mt-4 flex items-center justify-end gap-2 text-sm">
          <span className="text-muted-foreground">Valor total:</span>
          <span className="font-semibold">{formatCurrency(item.totalValue)}</span>
        </div>
      )}

      {isKit && (
        <div className="mt-4 border-t pt-4">
          <div className="mb-3 flex items-center justify-between">
            <h4 className="text-sm font-medium">Componentes do Kit</h4>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onAddComponent}
              aria-label={`Adicionar componente ao item ${index + 1}`}
            >
              <Plus className="mr-1 h-3 w-3" />
              Componente
            </Button>
          </div>

          {item.components.length === 0 ? (
            <p className="text-sm text-muted-foreground italic">Adicione componentes a este kit.</p>
          ) : (
            <div className="space-y-3">
              {item.components.map((component, componentIndex) => (
                <div key={component.id} className="rounded-md border border-dashed bg-muted/30 p-3">
                  <div className="mb-2 flex items-center justify-between">
                    <Badge variant="outline" className="text-xs">
                      Componente {componentIndex + 1}
                    </Badge>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => onRemoveComponent(component.id)}
                      aria-label={`Remover componente ${componentIndex + 1} do item ${index + 1}`}
                    >
                      <Trash2 className="h-3 w-3 text-destructive" />
                    </Button>
                  </div>
                  <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                    <div className="space-y-1">
                      <Label className="text-xs">Título</Label>
                      <Input
                        aria-label={`Título do componente ${componentIndex + 1} do item ${
                          index + 1
                        }`}
                        value={component.title}
                        onChange={(event) =>
                          onUpdateComponent(component.id, "title", event.target.value)
                        }
                        className="h-8 text-sm"
                      />
                    </div>
                    <div className="space-y-1 sm:col-span-2">
                      <Label className="text-xs">Descrição</Label>
                      <Input
                        aria-label={`Descrição do componente ${componentIndex + 1} do item ${
                          index + 1
                        }`}
                        value={component.description}
                        onChange={(event) =>
                          onUpdateComponent(component.id, "description", event.target.value)
                        }
                        className="h-8 text-sm"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div className="space-y-1">
                        <Label className="text-xs">Qtd.</Label>
                        <Input
                          aria-label={`Quantidade do componente ${componentIndex + 1} do item ${
                            index + 1
                          }`}
                          type="number"
                          value={component.quantity}
                          onChange={(event) =>
                            onUpdateComponent(component.id, "quantity", event.target.value)
                          }
                          className="h-8 text-sm"
                        />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs">Un.</Label>
                        <Input
                          aria-label={`Unidade do componente ${componentIndex + 1} do item ${
                            index + 1
                          }`}
                          value={component.unit}
                          onChange={(event) =>
                            onUpdateComponent(component.id, "unit", event.target.value)
                          }
                          className="h-8 text-sm"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function normalizeItemForRequest(
  item: ProcessItem,
  index: number,
): ProcessCreateItemRequest | null {
  const code = trimOrNull(item.code) ?? String(index + 1);
  const title = trimOrNull(item.title) ?? trimOrNull(item.description);
  const unit = trimOrNull(item.unit) ?? "UN";
  const hasMeaningfulValue = Boolean(
    title ||
      trimOrNull(item.code) ||
      trimOrNull(item.quantity) ||
      trimOrNull(item.unitValue) ||
      trimOrNull(item.totalValue) ||
      item.components.some((component) =>
        Boolean(
          trimOrNull(component.title) ||
            trimOrNull(component.description) ||
            trimOrNull(component.quantity) ||
            trimOrNull(component.unit),
        ),
      ),
  );

  if (!hasMeaningfulValue || !title) {
    return null;
  }

  if (item.kind === "kit") {
    return {
      kind: "kit",
      code,
      title,
      quantity: trimOrNull(item.quantity),
      unit,
      unitValue: trimOrNull(item.unitValue),
      totalValue: trimOrNull(item.totalValue),
      components: item.components
        .map((component) => {
          const componentTitle = trimOrNull(component.title) ?? trimOrNull(component.description);

          if (!componentTitle) {
            return null;
          }

          return {
            title: componentTitle,
            description: trimOrNull(component.description),
            quantity: trimOrNull(component.quantity),
            unit: trimOrNull(component.unit) ?? "UN",
          };
        })
        .filter((component): component is NonNullable<typeof component> => component !== null),
    };
  }

  return {
    kind: "simple",
    code,
    title,
    description: trimOrNull(item.description),
    quantity: trimOrNull(item.quantity),
    unit,
    unitValue: trimOrNull(item.unitValue),
    totalValue: trimOrNull(item.totalValue),
  };
}

function buildCreateRequest(values: FormValues, isAdmin: boolean): ProcessCreateRequest {
  return {
    procurementMethod: trimOrNull(values.formaContratacao),
    biddingModality: values.formaContratacao === "licitacao" ? trimOrNull(values.modalidade) : null,
    processNumber: values.processNumber.trim(),
    externalId: trimOrNull(values.externalId),
    issuedAt: new Date(`${values.issuedAt}T00:00:00`).toISOString(),
    title: trimOrNull(values.title),
    object: values.object.trim(),
    justification: values.justification.trim(),
    responsibleName: values.responsibleName.trim(),
    status: "draft",
    ...(isAdmin ? { organizationId: values.organizationId } : {}),
    departmentIds: values.departmentIds,
    items: values.items
      .map((item, index) => normalizeItemForRequest(item, index))
      .filter((item): item is NonNullable<typeof item> => item !== null),
  };
}

export function ProcessCreatePage() {
  const navigate = useNavigate();
  const { organizationId: actorOrganizationId, role } = useAuthSession();
  const isAdmin = role === "admin";
  const createProcess = useProcessCreate();
  const departmentsQuery = useProcessDepartmentsList();
  const organizationsQuery = useProcessOrganizationsList(isAdmin);
  const [currentStep, setCurrentStep] = useState<ProcessStep>("dados");
  const [values, setValues] = useState<FormValues>({
    formaContratacao: "licitacao",
    modalidade: "pregao",
    processNumber: "",
    externalId: "",
    issuedAt: "",
    responsibleName: "",
    title: "",
    object: "",
    justification: "",
    organizationId: actorOrganizationId ?? "",
    departmentIds: [],
    items: [],
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const organizations = organizationsQuery.data?.items ?? [];
  const departments = departmentsQuery.data?.items ?? [];
  const currentStepIndex = steps.findIndex((step) => step.id === currentStep);
  const isFirstStep = currentStepIndex === 0;
  const isLastStep = currentStepIndex === steps.length - 1;
  const visibleDepartments = departments.filter(
    (department) => department.organizationId === values.organizationId,
  );
  const selectedOrg = organizations.find(
    (organization) => organization.id === values.organizationId,
  );
  const selectedDepartments = departments.filter((department) =>
    values.departmentIds.includes(department.id),
  );
  const totalValue = values.items.reduce(
    (acc, item) => acc + parseCurrencyToNumber(item.totalValue),
    0,
  );
  const totalComponents = values.items.reduce((acc, item) => acc + item.components.length, 0);
  const hasReferenceError = departmentsQuery.isError || organizationsQuery.isError;

  const productionOrganizations = useMemo(() => {
    if (isAdmin) {
      return organizations;
    }

    if (!actorOrganizationId) {
      return [];
    }

    const fromApi = organizations.find((organization) => organization.id === actorOrganizationId);

    return (
      fromApi
        ? [fromApi]
        : [
            {
              id: actorOrganizationId,
              name: "Sua organização",
              cnpj: "",
              slug: "",
              officialName: "Sua organização",
              city: "",
              state: "",
              address: "",
              zipCode: "",
              phone: "",
              institutionalEmail: "",
              website: null,
              logoUrl: null,
              authorityName: "",
              authorityRole: "",
              isActive: true,
              createdByUserId: "",
              createdAt: "",
              updatedAt: "",
            },
          ]
    ) as ProcessOrganizationListItem[];
  }, [actorOrganizationId, isAdmin, organizations]);

  useEffect(() => {
    if (!isAdmin && actorOrganizationId && values.organizationId !== actorOrganizationId) {
      setValues((prev) => ({
        ...prev,
        organizationId: actorOrganizationId,
        departmentIds: [],
      }));
    }
  }, [actorOrganizationId, isAdmin, values.organizationId]);

  useEffect(() => {
    if (!isAdmin || values.organizationId || productionOrganizations.length === 0) {
      return;
    }

    setValues((prev) => ({
      ...prev,
      organizationId: productionOrganizations[0].id,
      departmentIds: [],
    }));
  }, [isAdmin, productionOrganizations, values.organizationId]);

  function updateField<K extends keyof FormValues>(field: K, value: FormValues[K]) {
    setValues((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => ({ ...prev, [field]: "" }));
  }

  function selectOrganization(organizationId: string) {
    setValues((prev) => ({
      ...prev,
      organizationId,
      departmentIds: [],
    }));
    setErrors((prev) => ({ ...prev, organizationId: "", departmentIds: "" }));
  }

  function toggleDepartment(departmentId: string) {
    setValues((prev) => ({
      ...prev,
      departmentIds: prev.departmentIds.includes(departmentId)
        ? prev.departmentIds.filter((id) => id !== departmentId)
        : [...prev.departmentIds, departmentId],
    }));
    setErrors((prev) => ({ ...prev, departmentIds: "" }));
  }

  function addItem(kind: "simple" | "kit") {
    const newItem: ProcessItem = {
      id: generateId(),
      kind,
      code: "",
      title: "",
      description: "",
      quantity: "",
      unit: "UN",
      unitValue: "",
      totalValue: "",
      components: [],
    };

    setValues((prev) => ({ ...prev, items: [...prev.items, newItem] }));
  }

  function updateItem(itemId: string, field: keyof ProcessItem, value: string) {
    setValues((prev) => ({
      ...prev,
      items: prev.items.map((item) => (item.id === itemId ? { ...item, [field]: value } : item)),
    }));
  }

  function removeItem(itemId: string) {
    setValues((prev) => ({
      ...prev,
      items: prev.items.filter((item) => item.id !== itemId),
    }));
  }

  function addComponent(itemId: string) {
    const newComponent: ProcessItemComponent = {
      id: generateId(),
      title: "",
      description: "",
      quantity: "",
      unit: "UN",
    };

    setValues((prev) => ({
      ...prev,
      items: prev.items.map((item) =>
        item.id === itemId ? { ...item, components: [...item.components, newComponent] } : item,
      ),
    }));
  }

  function updateComponent(
    itemId: string,
    componentId: string,
    field: keyof ProcessItemComponent,
    value: string,
  ) {
    setValues((prev) => ({
      ...prev,
      items: prev.items.map((item) =>
        item.id === itemId
          ? {
              ...item,
              components: item.components.map((component) =>
                component.id === componentId ? { ...component, [field]: value } : component,
              ),
            }
          : item,
      ),
    }));
  }

  function removeComponent(itemId: string, componentId: string) {
    setValues((prev) => ({
      ...prev,
      items: prev.items.map((item) =>
        item.id === itemId
          ? {
              ...item,
              components: item.components.filter((component) => component.id !== componentId),
            }
          : item,
      ),
    }));
  }

  function getValidationErrors(step: ProcessStep) {
    const newErrors: Record<string, string> = {};

    if (step === "dados") {
      if (!values.processNumber) {
        newErrors.processNumber = "Informe o número do processo";
      }

      if (!values.issuedAt) {
        newErrors.issuedAt = "Informe a data de emissão";
      }

      if (!values.responsibleName.trim()) {
        newErrors.responsibleName = "Informe o responsável";
      }

      if (!values.title) {
        newErrors.title = "Informe o título do processo";
      }

      if (!values.object) {
        newErrors.object = "Descreva o objeto da contratação";
      }

      if (!values.justification) {
        newErrors.justification = "Informe a justificativa";
      }
    }

    if (step === "vinculos") {
      if (!values.organizationId) {
        newErrors.organizationId = "Selecione a organização";
      }

      if (values.departmentIds.length === 0) {
        newErrors.departmentIds = "Selecione ao menos uma unidade";
      }
    }

    return newErrors;
  }

  function validateStep() {
    const newErrors = getValidationErrors(currentStep);

    setErrors(newErrors);

    return Object.keys(newErrors).length === 0;
  }

  function validateSubmission() {
    const newErrors = {
      ...getValidationErrors("dados"),
      ...getValidationErrors("vinculos"),
    };

    setErrors(newErrors);

    if (Object.keys(newErrors).length === 0) {
      return true;
    }

    setCurrentStep(
      newErrors.processNumber ||
        newErrors.issuedAt ||
        newErrors.responsibleName ||
        newErrors.title ||
        newErrors.object ||
        newErrors.justification
        ? "dados"
        : "vinculos",
    );

    return false;
  }

  function goToNextStep() {
    if (!validateStep()) {
      return;
    }

    const nextStep = steps[currentStepIndex + 1]?.id;

    if (nextStep) {
      setCurrentStep(nextStep);
    }
  }

  function goToPreviousStep() {
    const previousStep = steps[currentStepIndex - 1]?.id;

    if (previousStep) {
      setCurrentStep(previousStep);
    }
  }

  async function handleSubmit() {
    if (!validateSubmission()) {
      return;
    }

    try {
      const process = await createProcess.mutateAsync({
        data: buildCreateRequest(values, isAdmin),
      });

      toast.success("Processo criado com sucesso.");
      navigate(`/app/processo/${process.id}`);
    } catch (error) {
      setErrors((prev) => ({ ...prev, form: getApiErrorMessage(error) }));
    }
  }

  return (
    <main className="flex-1 overflow-auto bg-background">
      <div className="mx-auto max-w-7xl px-4 py-6 md:py-8">
        <div className="mb-5 space-y-1">
          <h1 className="text-2xl font-semibold tracking-tight md:text-3xl">Novo Processo</h1>
          <p className="text-muted-foreground">
            Cadastre os dados do processo e revise as informações antes de gerar os documentos.
          </p>
        </div>

        <div className="mb-4 md:hidden">
          <Stepper currentStep={currentStep} isMobile />
        </div>

        <div className="mb-6 md:mb-7">
          <Stepper currentStep={currentStep} />
        </div>

        {hasReferenceError && (
          <Alert variant="destructive" className="mb-6">
            <AlertTitle>Não foi possível carregar os dados de referência</AlertTitle>
            <AlertDescription>
              Recarregue a página ou tente novamente em instantes.
            </AlertDescription>
          </Alert>
        )}

        {errors.form && (
          <Alert variant="destructive" className="mb-6">
            <AlertTitle>Não foi possível criar o processo</AlertTitle>
            <AlertDescription>{errors.form}</AlertDescription>
          </Alert>
        )}

        <div className="grid gap-6 lg:grid-cols-[1fr_300px]">
          <div className="space-y-6">
            {currentStep === "dados" && (
              <Card>
                <CardHeader>
                  <CardTitle>Dados do Processo</CardTitle>
                  <CardDescription>
                    Preencha as informações básicas do processo de contratação.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-12">
                    <div className="space-y-2 lg:col-span-3">
                      <Label htmlFor="formaContratacao">Forma de contratação</Label>
                      <Select
                        value={values.formaContratacao}
                        onValueChange={(value) => {
                          updateField("formaContratacao", value);
                          if (value !== "licitacao") {
                            updateField("modalidade", "");
                          }
                        }}
                      >
                        <SelectTrigger id="formaContratacao" className="w-full">
                          <SelectValue placeholder="Selecione" />
                        </SelectTrigger>
                        <SelectContent>
                          {formasContratacao.map((item) => (
                            <SelectItem key={item.value} value={item.value}>
                              {item.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2 lg:col-span-3">
                      <Label htmlFor="modalidade">Modalidade</Label>
                      <Select
                        value={values.modalidade}
                        onValueChange={(value) => updateField("modalidade", value)}
                        disabled={values.formaContratacao !== "licitacao"}
                      >
                        <SelectTrigger id="modalidade" className="w-full">
                          <SelectValue
                            placeholder={
                              values.formaContratacao === "licitacao" ? "Selecione" : "N/A"
                            }
                          />
                        </SelectTrigger>
                        <SelectContent>
                          {modalidadesLicitacao.map((item) => (
                            <SelectItem key={item.value} value={item.value}>
                              {item.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2 lg:col-span-3">
                      <Label htmlFor="processNumber">
                        Número do processo <span className="text-destructive">*</span>
                      </Label>
                      <Input
                        id="processNumber"
                        value={values.processNumber}
                        onChange={(event) => updateField("processNumber", event.target.value)}
                        placeholder="Ex: PE-2024/0001"
                        aria-invalid={Boolean(errors.processNumber)}
                      />
                      {errors.processNumber && (
                        <p className="text-sm text-destructive">{errors.processNumber}</p>
                      )}
                    </div>

                    <div className="space-y-2 lg:col-span-3">
                      <Label htmlFor="externalId">ID externo</Label>
                      <Input
                        id="externalId"
                        value={values.externalId}
                        onChange={(event) => updateField("externalId", event.target.value)}
                        placeholder="Opcional"
                      />
                    </div>

                    <div className="space-y-2 lg:col-span-3">
                      <Label htmlFor="issuedAt">
                        Data de emissão <span className="text-destructive">*</span>
                      </Label>
                      <Input
                        id="issuedAt"
                        type="date"
                        value={values.issuedAt}
                        onChange={(event) => updateField("issuedAt", event.target.value)}
                        aria-invalid={Boolean(errors.issuedAt)}
                      />
                      {errors.issuedAt && (
                        <p className="text-sm text-destructive">{errors.issuedAt}</p>
                      )}
                    </div>

                    <div className="space-y-2 lg:col-span-6">
                      <Label htmlFor="responsibleName">
                        Responsável <span className="text-destructive">*</span>
                      </Label>
                      <Input
                        id="responsibleName"
                        value={values.responsibleName}
                        onChange={(event) => updateField("responsibleName", event.target.value)}
                        placeholder="Nome do responsável"
                        aria-invalid={Boolean(errors.responsibleName)}
                      />
                      {errors.responsibleName && (
                        <p className="text-sm text-destructive">{errors.responsibleName}</p>
                      )}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="title">
                      Título do processo <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      id="title"
                      value={values.title}
                      onChange={(event) => updateField("title", event.target.value)}
                      placeholder="Título descritivo do processo"
                      aria-invalid={Boolean(errors.title)}
                    />
                    {errors.title && <p className="text-sm text-destructive">{errors.title}</p>}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="object">
                      Objeto da contratação <span className="text-destructive">*</span>
                    </Label>
                    <Textarea
                      id="object"
                      value={values.object}
                      onChange={(event) => updateField("object", event.target.value)}
                      placeholder="Descreva o objeto da contratação de forma clara e objetiva"
                      className="min-h-28"
                      aria-invalid={Boolean(errors.object)}
                    />
                    {errors.object && <p className="text-sm text-destructive">{errors.object}</p>}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="justification">
                      Justificativa <span className="text-destructive">*</span>
                    </Label>
                    <Textarea
                      id="justification"
                      value={values.justification}
                      onChange={(event) => updateField("justification", event.target.value)}
                      placeholder="Justifique a necessidade da contratação"
                      className="min-h-32"
                      aria-invalid={Boolean(errors.justification)}
                    />
                    {errors.justification && (
                      <p className="text-sm text-destructive">{errors.justification}</p>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}

            {currentStep === "vinculos" && (
              <Card>
                <CardHeader>
                  <CardTitle>Vínculos Institucionais</CardTitle>
                  <CardDescription>
                    Selecione as unidades orçamentárias vinculadas ao processo.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {isAdmin && (
                    <div className="space-y-2">
                      <Label htmlFor="organizationId">
                        Organização <span className="text-destructive">*</span>
                      </Label>
                      <Select value={values.organizationId} onValueChange={selectOrganization}>
                        <SelectTrigger
                          id="organizationId"
                          className="w-full"
                          aria-invalid={Boolean(errors.organizationId)}
                        >
                          <SelectValue placeholder="Selecione a organização" />
                        </SelectTrigger>
                        <SelectContent>
                          {productionOrganizations.map((organization) => (
                            <SelectItem key={organization.id} value={organization.id}>
                              {organization.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {errors.organizationId && (
                        <p className="text-sm text-destructive">{errors.organizationId}</p>
                      )}
                    </div>
                  )}

                  <div className="space-y-3">
                    <Label>
                      Unidades orçamentárias <span className="text-destructive">*</span>
                    </Label>
                    <p className="text-sm text-muted-foreground">
                      Selecione as unidades vinculadas ao processo.
                    </p>

                    <div className="grid gap-2 sm:grid-cols-2">
                      {visibleDepartments.length === 0 ? (
                        <div className="rounded-lg border border-dashed p-4 text-sm text-muted-foreground sm:col-span-2">
                          Nenhuma unidade disponível para a organização selecionada.
                        </div>
                      ) : (
                        visibleDepartments.map((department) => {
                          const isSelected = values.departmentIds.includes(department.id);

                          return (
                            <div
                              key={department.id}
                              className={`flex items-start gap-3 rounded-lg border p-3 transition-all hover:bg-muted/50 ${
                                isSelected ? "border-primary bg-primary/5" : "border-border"
                              }`}
                            >
                              <Checkbox
                                checked={isSelected}
                                onCheckedChange={() => toggleDepartment(department.id)}
                                className="mt-0.5"
                              />
                              <div className="min-w-0 flex-1">
                                <p className="text-sm font-medium leading-tight">
                                  {department.name}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                  Código: {getDepartmentCode(department)}
                                </p>
                              </div>
                            </div>
                          );
                        })
                      )}
                    </div>

                    {errors.departmentIds && (
                      <p className="text-sm text-destructive">{errors.departmentIds}</p>
                    )}

                    {values.departmentIds.length > 0 && (
                      <div className="mt-4 rounded-lg bg-muted/50 p-3">
                        <p className="mb-2 text-sm font-medium">
                          Unidades selecionadas ({values.departmentIds.length})
                        </p>
                        <div className="flex flex-wrap gap-1.5">
                          {selectedDepartments.map((department) => (
                            <Badge key={department.id} variant="secondary">
                              {getDepartmentCode(department)} - {department.name}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}

            {currentStep === "itens" && (
              <Card>
                <CardHeader>
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <CardTitle>Itens do Processo</CardTitle>
                      <CardDescription>
                        Cadastre os itens simples ou kits que compõem o processo.
                      </CardDescription>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => addItem("simple")}
                      >
                        <Plus className="mr-1.5 h-4 w-4" />
                        Item simples
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => addItem("kit")}
                      >
                        <Layers3 className="mr-1.5 h-4 w-4" />
                        Kit
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  {values.items.length === 0 ? (
                    <div className="flex flex-col items-center justify-center rounded-lg border border-dashed py-12 text-center">
                      <Package className="mb-3 h-10 w-10 text-muted-foreground/50" />
                      <p className="text-sm text-muted-foreground">Nenhum item cadastrado.</p>
                      <p className="text-sm text-muted-foreground">
                        Adicione um item simples ou kit para continuar.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {values.items.map((item, index) => (
                        <ItemCard
                          key={item.id}
                          item={item}
                          index={index}
                          onUpdate={(field, value) => updateItem(item.id, field, value)}
                          onRemove={() => removeItem(item.id)}
                          onAddComponent={() => addComponent(item.id)}
                          onUpdateComponent={(componentId, field, value) =>
                            updateComponent(item.id, componentId, field, value)
                          }
                          onRemoveComponent={(componentId) => removeComponent(item.id, componentId)}
                        />
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {currentStep === "revisao" && (
              <div className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <CheckCircle2 className="h-5 w-5 text-success" />
                      Revisão Final
                    </CardTitle>
                    <CardDescription>
                      Confira todas as informações antes de criar o processo.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="space-y-4">
                      <h3 className="font-semibold">Dados do Processo</h3>
                      <div className="grid gap-4 rounded-lg bg-muted/30 p-4 sm:grid-cols-2 lg:grid-cols-3">
                        <div>
                          <p className="text-xs text-muted-foreground">Número</p>
                          <p className="font-medium">{values.processNumber}</p>
                        </div>
                        {values.formaContratacao && (
                          <div>
                            <p className="text-xs text-muted-foreground">Forma de contratação</p>
                            <p className="font-medium">
                              {
                                formasContratacao.find(
                                  (item) => item.value === values.formaContratacao,
                                )?.label
                              }
                              {values.formaContratacao === "licitacao" && values.modalidade && (
                                <span className="text-muted-foreground">
                                  {" "}
                                  -{" "}
                                  {
                                    modalidadesLicitacao.find(
                                      (item) => item.value === values.modalidade,
                                    )?.label
                                  }
                                </span>
                              )}
                            </p>
                          </div>
                        )}
                        <div>
                          <p className="text-xs text-muted-foreground">Responsável</p>
                          <p className="font-medium">{values.responsibleName}</p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">Data de emissão</p>
                          <p className="font-medium">{formatDate(values.issuedAt)}</p>
                        </div>
                        {values.externalId && (
                          <div>
                            <p className="text-xs text-muted-foreground">ID externo</p>
                            <p className="font-medium">{values.externalId}</p>
                          </div>
                        )}
                      </div>
                    </div>

                    <Separator />

                    <div className="space-y-4">
                      <div>
                        <p className="mb-1 text-xs text-muted-foreground">Título</p>
                        <p className="font-medium">{values.title}</p>
                      </div>
                      <div>
                        <p className="mb-1 text-xs text-muted-foreground">Objeto</p>
                        <p className="text-sm leading-relaxed">{values.object}</p>
                      </div>
                      <div>
                        <p className="mb-1 text-xs text-muted-foreground">Justificativa</p>
                        <p className="text-sm leading-relaxed">{values.justification}</p>
                      </div>
                    </div>

                    <Separator />

                    <div className="space-y-3">
                      <h3 className="font-semibold">Vínculos Institucionais</h3>
                      <div className="rounded-lg bg-muted/30 p-4">
                        <div className="mb-3">
                          <p className="text-xs text-muted-foreground">Organização</p>
                          <p className="font-medium">{selectedOrg?.name ?? "Sua organização"}</p>
                        </div>
                        <div>
                          <p className="mb-2 text-xs text-muted-foreground">
                            Unidades orçamentárias ({selectedDepartments.length})
                          </p>
                          <div className="flex flex-wrap gap-1.5">
                            {selectedDepartments.map((department) => (
                              <Badge key={department.id} variant="secondary">
                                {getDepartmentCode(department)} - {department.name}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>

                    <Separator />

                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <h3 className="font-semibold">Itens do Processo</h3>
                        <div className="flex items-center gap-3">
                          <Badge variant="secondary">
                            {values.items.length} item{values.items.length !== 1 && "s"}
                          </Badge>
                          {totalComponents > 0 && (
                            <Badge variant="outline">
                              {totalComponents} componente{totalComponents !== 1 && "s"}
                            </Badge>
                          )}
                        </div>
                      </div>

                      <div className="space-y-2">
                        {values.items.length === 0 ? (
                          <p className="rounded-lg bg-muted/30 p-3 text-sm text-muted-foreground">
                            Nenhum item informado.
                          </p>
                        ) : (
                          values.items.map((item, index) => (
                            <div
                              key={item.id}
                              className="flex items-start justify-between gap-4 rounded-lg bg-muted/30 p-3"
                            >
                              <div className="min-w-0 flex-1">
                                <div className="flex items-center gap-2">
                                  <Badge
                                    variant={item.kind === "kit" ? "default" : "secondary"}
                                    className="shrink-0"
                                  >
                                    {item.kind === "kit" ? "Kit" : "Item"} {index + 1}
                                  </Badge>
                                  <span className="truncate text-sm font-medium">
                                    {item.title || "Sem título"}
                                  </span>
                                </div>
                                <p className="mt-1 text-xs text-muted-foreground">
                                  {item.code && `${item.code} · `}
                                  {item.quantity} {item.unit}
                                  {item.kind === "kit" &&
                                    item.components.length > 0 &&
                                    ` · ${item.components.length} componente${
                                      item.components.length !== 1 ? "s" : ""
                                    }`}
                                </p>
                              </div>
                              {parseCurrencyToNumber(item.totalValue) > 0 && (
                                <span className="shrink-0 text-sm font-semibold">
                                  {formatCurrency(item.totalValue)}
                                </span>
                              )}
                            </div>
                          ))
                        )}
                      </div>

                      {totalValue > 0 && (
                        <div className="flex items-center justify-between rounded-lg border border-primary/20 bg-primary/5 p-4">
                          <span className="font-medium">Valor total estimado</span>
                          <span className="text-lg font-bold text-primary">
                            {totalValue.toLocaleString("pt-BR", {
                              style: "currency",
                              currency: "BRL",
                            })}
                          </span>
                        </div>
                      )}
                    </div>

                    <Separator />

                    <Alert>
                      <FileText className="h-4 w-4" />
                      <AlertTitle>Próximos passos</AlertTitle>
                      <AlertDescription>
                        Após criar o processo, você poderá gerar os documentos oficiais: DFD, ETP,
                        Termo de Referência e Minuta Contratual.
                      </AlertDescription>
                    </Alert>
                  </CardContent>
                </Card>
              </div>
            )}

            <div className="flex items-center justify-between gap-4 border-t pt-6">
              <Button
                type="button"
                variant="outline"
                onClick={goToPreviousStep}
                disabled={isFirstStep || createProcess.isPending}
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Voltar
              </Button>

              {isLastStep ? (
                <Button type="button" onClick={handleSubmit} disabled={createProcess.isPending}>
                  <CheckCircle2 className="mr-2 h-4 w-4" />
                  {createProcess.isPending ? "Criando..." : "Criar Processo"}
                </Button>
              ) : (
                <Button type="button" onClick={goToNextStep}>
                  Continuar
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              )}
            </div>
          </div>

          <SummaryPanel
            departments={departments}
            organizations={productionOrganizations}
            values={values}
          />
        </div>
      </div>
    </main>
  );
}

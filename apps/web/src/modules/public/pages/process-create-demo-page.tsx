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
import { useState } from "react";
import { Link } from "react-router-dom";
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

// Types
type ProcessStep = "dados" | "vinculos" | "itens" | "revisao";

interface ProcessItem {
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
}

interface ProcessItemComponent {
  id: string;
  title: string;
  description: string;
  quantity: string;
  unit: string;
}

interface Department {
  id: string;
  name: string;
  code: string;
  organizationId: string;
}

interface FormValues {
  formaContratacao: string;
  modalidade: string;
  processNumber: string;
  externalId: string;
  issuedAt: string;
  responsibleId: string;
  title: string;
  object: string;
  justification: string;
  organizationId: string;
  departmentIds: string[];
  items: ProcessItem[];
}

// Constants
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

const sampleUsers = [
  { id: "user-1", name: "Maria Silva Santos", role: "Pregoeira" },
  { id: "user-2", name: "João Carlos Oliveira", role: "Analista de Licitações" },
  { id: "user-3", name: "Ana Paula Ferreira", role: "Coordenadora de Compras" },
  { id: "user-4", name: "Pedro Henrique Costa", role: "Assessor Técnico" },
  { id: "user-5", name: "Carla Souza Lima", role: "Diretora Administrativa" },
];

const sampleOrganizations = [
  { id: "org-1", name: "Prefeitura Municipal de São Paulo", cnpj: "46.395.000/0001-39" },
  { id: "org-2", name: "Governo do Estado de Minas Gerais", cnpj: "18.715.615/0001-60" },
  { id: "org-3", name: "Ministério da Educação", cnpj: "00.394.445/0001-01" },
];

const sampleDepartments: Department[] = [
  { id: "dept-1", name: "Secretaria de Administração", code: "001.001", organizationId: "org-1" },
  { id: "dept-2", name: "Secretaria de Saúde", code: "001.002", organizationId: "org-1" },
  { id: "dept-3", name: "Secretaria de Educação", code: "001.003", organizationId: "org-1" },
  { id: "dept-4", name: "Secretaria de Obras", code: "001.004", organizationId: "org-1" },
  { id: "dept-5", name: "Diretoria de Compras", code: "002.001", organizationId: "org-2" },
  { id: "dept-6", name: "Diretoria de Licitações", code: "002.002", organizationId: "org-2" },
];

// Helper functions
function generateId() {
  return Math.random().toString(36).substring(2, 9);
}

function formatCurrency(value: string): string {
  const num = parseFloat(value.replace(/[^\d,.-]/g, "").replace(",", "."));
  if (Number.isNaN(num)) return "";
  return num.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function parseCurrencyToNumber(value: string): number {
  const num = parseFloat(value.replace(/[^\d,.-]/g, "").replace(",", "."));
  return Number.isNaN(num) ? 0 : num;
}

function calculateItemTotal(quantity: string, unitValue: string): string {
  const qty = parseFloat(quantity) || 0;
  const unit = parseCurrencyToNumber(unitValue);
  return (qty * unit).toFixed(2);
}

function formatDate(dateString: string): string {
  if (!dateString) return "";
  const date = new Date(`${dateString}T00:00:00`);
  return date.toLocaleDateString("pt-BR");
}

// Components
function Stepper({
  currentStep,
  isMobile = false,
}: {
  currentStep: ProcessStep;
  isMobile?: boolean;
}) {
  const currentIndex = steps.findIndex((s) => s.id === currentStep);

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
                  isActive
                    ? "text-foreground"
                    : isComplete
                      ? "text-foreground"
                      : "text-muted-foreground"
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

function SummaryPanel({ values }: { values: FormValues }) {
  const selectedDepartments = sampleDepartments.filter((d) => values.departmentIds.includes(d.id));
  const selectedOrg = sampleOrganizations.find((o) => o.id === values.organizationId);
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
                {formasContratacao.find((f) => f.value === values.formaContratacao)?.label}
                {values.formaContratacao === "licitacao" && values.modalidade && (
                  <span className="text-muted-foreground">
                    {" "}
                    - {modalidadesLicitacao.find((m) => m.value === values.modalidade)?.label}
                  </span>
                )}
              </p>
            </div>
          </div>
        )}

        {values.responsibleId && (
          <div className="flex items-start gap-2">
            <User className="mt-0.5 h-4 w-4 text-muted-foreground" />
            <div>
              <p className="text-muted-foreground">Responsável</p>
              <p className="font-medium">
                {sampleUsers.find((u) => u.id === values.responsibleId)?.name ||
                  values.responsibleId}
              </p>
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
                {selectedDepartments.map((dept) => (
                  <Badge key={dept.id} variant="secondary" className="text-xs">
                    {dept.code}
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
  item,
  index,
  onUpdate,
  onRemove,
  onAddComponent,
  onUpdateComponent,
  onRemoveComponent,
}: {
  item: ProcessItem;
  index: number;
  onUpdate: (field: keyof ProcessItem, value: string) => void;
  onRemove: () => void;
  onAddComponent: () => void;
  onUpdateComponent: (
    componentId: string,
    field: keyof ProcessItemComponent,
    value: string,
  ) => void;
  onRemoveComponent: (componentId: string) => void;
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
            <span className="text-sm text-muted-foreground truncate max-w-48">{item.title}</span>
          )}
        </div>
        <Button type="button" variant="ghost" size="sm" onClick={onRemove}>
          <Trash2 className="h-4 w-4 text-destructive" />
        </Button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <div className="space-y-2">
          <Label>Código</Label>
          <Input
            value={item.code}
            onChange={(e) => onUpdate("code", e.target.value)}
            placeholder="Ex: 001.001"
          />
        </div>
        <div className="space-y-2 sm:col-span-2">
          <Label>Título</Label>
          <Input
            value={item.title}
            onChange={(e) => onUpdate("title", e.target.value)}
            placeholder="Título do item"
          />
        </div>
        {!isKit && (
          <div className="space-y-2 sm:col-span-2 lg:col-span-3">
            <Label>Descrição</Label>
            <Textarea
              value={item.description}
              onChange={(e) => onUpdate("description", e.target.value)}
              placeholder="Descrição detalhada do item ou serviço"
              className="min-h-20"
            />
          </div>
        )}
        <div className="space-y-2">
          <Label>Quantidade</Label>
          <Input
            type="number"
            value={item.quantity}
            onChange={(e) => {
              onUpdate("quantity", e.target.value);
              onUpdate("totalValue", calculateItemTotal(e.target.value, item.unitValue));
            }}
            placeholder="0"
          />
        </div>
        <div className="space-y-2">
          <Label>Unidade</Label>
          <Input
            value={item.unit}
            onChange={(e) => onUpdate("unit", e.target.value)}
            placeholder="UN, KG, M..."
          />
        </div>
        <div className="space-y-2">
          <Label>Valor unitário</Label>
          <Input
            value={item.unitValue}
            onChange={(e) => {
              onUpdate("unitValue", e.target.value);
              onUpdate("totalValue", calculateItemTotal(item.quantity, e.target.value));
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
            <Button type="button" variant="outline" size="sm" onClick={onAddComponent}>
              <Plus className="mr-1 h-3 w-3" />
              Componente
            </Button>
          </div>

          {item.components.length === 0 ? (
            <p className="text-sm text-muted-foreground italic">Adicione componentes a este kit.</p>
          ) : (
            <div className="space-y-3">
              {item.components.map((comp, compIndex) => (
                <div key={comp.id} className="rounded-md border border-dashed bg-muted/30 p-3">
                  <div className="mb-2 flex items-center justify-between">
                    <Badge variant="outline" className="text-xs">
                      Componente {compIndex + 1}
                    </Badge>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => onRemoveComponent(comp.id)}
                    >
                      <Trash2 className="h-3 w-3 text-destructive" />
                    </Button>
                  </div>
                  <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                    <div className="space-y-1">
                      <Label className="text-xs">Título</Label>
                      <Input
                        value={comp.title}
                        onChange={(e) => onUpdateComponent(comp.id, "title", e.target.value)}
                        className="h-8 text-sm"
                      />
                    </div>
                    <div className="space-y-1 sm:col-span-2">
                      <Label className="text-xs">Descrição</Label>
                      <Input
                        value={comp.description}
                        onChange={(e) => onUpdateComponent(comp.id, "description", e.target.value)}
                        className="h-8 text-sm"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div className="space-y-1">
                        <Label className="text-xs">Qtd.</Label>
                        <Input
                          type="number"
                          value={comp.quantity}
                          onChange={(e) => onUpdateComponent(comp.id, "quantity", e.target.value)}
                          className="h-8 text-sm"
                        />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs">Un.</Label>
                        <Input
                          value={comp.unit}
                          onChange={(e) => onUpdateComponent(comp.id, "unit", e.target.value)}
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

// Main Component
export function ProcessCreateDemoPage() {
  const [currentStep, setCurrentStep] = useState<ProcessStep>("dados");
  const [values, setValues] = useState<FormValues>({
    formaContratacao: "licitacao",
    modalidade: "pregao",
    processNumber: "PE-2024/0142",
    externalId: "",
    issuedAt: "2024-11-15",
    responsibleId: "user-1",
    title: "Aquisição de equipamentos de informática para modernização da rede",
    object:
      "Aquisição de computadores, monitores e periféricos para atender às necessidades de modernização do parque tecnológico da Secretaria de Administração, visando a melhoria da eficiência operacional e atendimento ao público.",
    justification:
      "A modernização do parque tecnológico é essencial para garantir a continuidade dos serviços públicos com qualidade e eficiência. Os equipamentos atuais encontram-se obsoletos, com mais de 8 anos de uso, apresentando falhas constantes que comprometem o atendimento ao cidadão.",
    organizationId: "org-1",
    departmentIds: ["dept-1", "dept-3"],
    items: [
      {
        id: generateId(),
        kind: "simple",
        code: "001.001",
        title: "Computador Desktop",
        description:
          "Computador desktop com processador Intel Core i5 ou equivalente, 16GB RAM DDR4, SSD 512GB, Windows 11 Pro, garantia de 36 meses on-site.",
        quantity: "50",
        unit: "UN",
        unitValue: "4500.00",
        totalValue: "225000.00",
        components: [],
      },
      {
        id: generateId(),
        kind: "kit",
        code: "001.002",
        title: "Kit Estação de Trabalho",
        description: "",
        quantity: "25",
        unit: "KIT",
        unitValue: "1200.00",
        totalValue: "30000.00",
        components: [
          {
            id: generateId(),
            title: "Monitor LED 24 polegadas",
            description: "Monitor LED Full HD 24 polegadas, ajuste de altura",
            quantity: "1",
            unit: "UN",
          },
          {
            id: generateId(),
            title: "Teclado USB ABNT2",
            description: "Teclado USB padrão ABNT2 com fio",
            quantity: "1",
            unit: "UN",
          },
          {
            id: generateId(),
            title: "Mouse USB óptico",
            description: "Mouse USB óptico com fio, 1000 DPI",
            quantity: "1",
            unit: "UN",
          },
        ],
      },
    ],
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const currentStepIndex = steps.findIndex((s) => s.id === currentStep);
  const isFirstStep = currentStepIndex === 0;
  const isLastStep = currentStepIndex === steps.length - 1;

  const visibleDepartments = sampleDepartments.filter(
    (d) => d.organizationId === values.organizationId,
  );

  function updateField<K extends keyof FormValues>(field: K, value: FormValues[K]) {
    setValues((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => ({ ...prev, [field]: "" }));
  }

  function toggleDepartment(deptId: string) {
    setValues((prev) => ({
      ...prev,
      departmentIds: prev.departmentIds.includes(deptId)
        ? prev.departmentIds.filter((id) => id !== deptId)
        : [...prev.departmentIds, deptId],
    }));
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
              components: item.components.map((comp) =>
                comp.id === componentId ? { ...comp, [field]: value } : comp,
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
              components: item.components.filter((comp) => comp.id !== componentId),
            }
          : item,
      ),
    }));
  }

  function validateStep(): boolean {
    const newErrors: Record<string, string> = {};

    if (currentStep === "dados") {
      // formaContratacao e modalidade são opcionais
      if (!values.processNumber) newErrors.processNumber = "Informe o número do processo";
      if (!values.issuedAt) newErrors.issuedAt = "Informe a data de emissão";
      if (!values.responsibleId) newErrors.responsibleId = "Selecione o responsável";
      if (!values.title) newErrors.title = "Informe o título do processo";
      if (!values.object) newErrors.object = "Descreva o objeto da contratação";
      if (!values.justification) newErrors.justification = "Informe a justificativa";
    }

    if (currentStep === "vinculos") {
      if (values.departmentIds.length === 0)
        newErrors.departmentIds = "Selecione ao menos uma unidade";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }

  function goToNextStep() {
    if (!validateStep()) return;
    const nextIndex = currentStepIndex + 1;
    if (nextIndex < steps.length) {
      setCurrentStep(steps[nextIndex].id);
    }
  }

  function goToPreviousStep() {
    const prevIndex = currentStepIndex - 1;
    if (prevIndex >= 0) {
      setCurrentStep(steps[prevIndex].id);
    }
  }

  function handleSubmit() {
    if (!validateStep()) return;
    // Demo: just show success
    alert("Processo criado com sucesso! (Demo)");
  }

  // Computed values for review
  const selectedOrg = sampleOrganizations.find((o) => o.id === values.organizationId);
  const selectedDepartments = sampleDepartments.filter((d) => values.departmentIds.includes(d.id));
  const totalValue = values.items.reduce(
    (acc, item) => acc + parseCurrencyToNumber(item.totalValue),
    0,
  );
  const totalComponents = values.items.reduce((acc, item) => acc + item.components.length, 0);

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto flex h-14 max-w-7xl items-center justify-between px-4">
          <Link to="/" className="flex items-center gap-2">
            <div className="rounded-lg bg-primary/10 p-1.5">
              <Scale className="h-5 w-5 text-primary" />
            </div>
            <span className="text-lg font-semibold tracking-tight">LicitaDoc</span>
          </Link>
          <Badge variant="outline" className="text-xs">
            Modo Demo
          </Badge>
        </div>
      </header>

      <main className="container mx-auto max-w-7xl px-4 py-6 md:py-8">
        {/* Page Header */}
        <div className="mb-5 space-y-1">
          <Button asChild variant="ghost" size="sm" className="-ml-3">
            <Link to="/">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Voltar
            </Link>
          </Button>
          <h1 className="text-2xl font-semibold tracking-tight md:text-3xl">Novo Processo</h1>
          <p className="text-muted-foreground">
            Cadastre os dados do processo e revise as informações antes de gerar os documentos.
          </p>
        </div>

        {/* Mobile Stepper */}
        <div className="mb-4 md:hidden">
          <Stepper currentStep={currentStep} isMobile />
        </div>

        {/* Desktop Stepper */}
        <div className="mb-6 md:mb-7">
          <Stepper currentStep={currentStep} />
        </div>

        {/* Main Content */}
        <div className="grid gap-6 lg:grid-cols-[1fr_300px]">
          {/* Form Area */}
          <div className="space-y-6">
            {/* Step 1: Dados do Processo */}
            {currentStep === "dados" && (
              <Card>
                <CardHeader>
                  <CardTitle>Dados do Processo</CardTitle>
                  <CardDescription>
                    Preencha as informações básicas do processo de contratação.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Grid de 12 colunas no desktop para controle fino das proporções */}
                  <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-12">
                    {/* Forma de contratação - 2 cols */}
                    <div className="space-y-2 lg:col-span-3">
                      <Label htmlFor="formaContratacao">Forma de contratação</Label>
                      <Select
                        value={values.formaContratacao}
                        onValueChange={(v) => {
                          updateField("formaContratacao", v);
                          if (v !== "licitacao") {
                            updateField("modalidade", "");
                          }
                        }}
                      >
                        <SelectTrigger id="formaContratacao" className="w-full">
                          <SelectValue placeholder="Selecione" />
                        </SelectTrigger>
                        <SelectContent>
                          {formasContratacao.map((f) => (
                            <SelectItem key={f.value} value={f.value}>
                              {f.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Modalidade - 3 cols */}
                    <div className="space-y-2 lg:col-span-3">
                      <Label htmlFor="modalidade">Modalidade</Label>
                      <Select
                        value={values.modalidade}
                        onValueChange={(v) => updateField("modalidade", v)}
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
                          {modalidadesLicitacao.map((m) => (
                            <SelectItem key={m.value} value={m.value}>
                              {m.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Número do processo - 4 cols */}
                    <div className="space-y-2 lg:col-span-3">
                      <Label htmlFor="processNumber">
                        Número do processo <span className="text-destructive">*</span>
                      </Label>
                      <Input
                        id="processNumber"
                        value={values.processNumber}
                        onChange={(e) => updateField("processNumber", e.target.value)}
                        placeholder="Ex: PE-2024/0001"
                        aria-invalid={Boolean(errors.processNumber)}
                      />
                      {errors.processNumber && (
                        <p className="text-sm text-destructive">{errors.processNumber}</p>
                      )}
                    </div>

                    {/* ID externo - 3 cols */}
                    <div className="space-y-2 lg:col-span-3">
                      <Label htmlFor="externalId">ID externo</Label>
                      <Input
                        id="externalId"
                        value={values.externalId}
                        onChange={(e) => updateField("externalId", e.target.value)}
                        placeholder="Opcional"
                      />
                    </div>

                    {/* Data de emissão - 4 cols */}
                    <div className="space-y-2 lg:col-span-3">
                      <Label htmlFor="issuedAt">
                        Data de emissão <span className="text-destructive">*</span>
                      </Label>
                      <Input
                        id="issuedAt"
                        type="date"
                        value={values.issuedAt}
                        onChange={(e) => updateField("issuedAt", e.target.value)}
                        aria-invalid={Boolean(errors.issuedAt)}
                      />
                      {errors.issuedAt && (
                        <p className="text-sm text-destructive">{errors.issuedAt}</p>
                      )}
                    </div>

                    {/* Responsável - 6 cols */}
                    <div className="space-y-2 lg:col-span-6">
                      <Label htmlFor="responsibleId">
                        Responsável <span className="text-destructive">*</span>
                      </Label>
                      <Select
                        value={values.responsibleId}
                        onValueChange={(v) => updateField("responsibleId", v)}
                      >
                        <SelectTrigger
                          id="responsibleId"
                          className="w-full"
                          aria-invalid={Boolean(errors.responsibleId)}
                        >
                          <SelectValue placeholder="Selecione o responsável" />
                        </SelectTrigger>
                        <SelectContent>
                          {sampleUsers.map((user) => (
                            <SelectItem key={user.id} value={user.id}>
                              <span>{user.name}</span>
                              <span className="ml-2 text-muted-foreground">({user.role})</span>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {errors.responsibleId && (
                        <p className="text-sm text-destructive">{errors.responsibleId}</p>
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
                      onChange={(e) => updateField("title", e.target.value)}
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
                      onChange={(e) => updateField("object", e.target.value)}
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
                      onChange={(e) => updateField("justification", e.target.value)}
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

            {/* Step 2: Vínculos Institucionais */}
            {currentStep === "vinculos" && (
              <Card>
                <CardHeader>
                  <CardTitle>Vínculos Institucionais</CardTitle>
                  <CardDescription>
                    Selecione as unidades orçamentárias vinculadas ao processo.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-3">
                    <Label>
                      Unidades orçamentárias <span className="text-destructive">*</span>
                    </Label>
                    <p className="text-sm text-muted-foreground">
                      Selecione as unidades vinculadas ao processo.
                    </p>

                    <div className="grid gap-2 sm:grid-cols-2">
                      {visibleDepartments.map((dept) => {
                        const isSelected = values.departmentIds.includes(dept.id);
                        return (
                          <div
                            key={dept.id}
                            className={`flex items-start gap-3 rounded-lg border p-3 transition-all hover:bg-muted/50 ${
                              isSelected ? "border-primary bg-primary/5" : "border-border"
                            }`}
                          >
                            <Checkbox
                              checked={isSelected}
                              onCheckedChange={() => toggleDepartment(dept.id)}
                              className="mt-0.5"
                            />
                            <div className="min-w-0 flex-1">
                              <p className="text-sm font-medium leading-tight">{dept.name}</p>
                              <p className="text-xs text-muted-foreground">Código: {dept.code}</p>
                            </div>
                          </div>
                        );
                      })}
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
                          {selectedDepartments.map((dept) => (
                            <Badge key={dept.id} variant="secondary">
                              {dept.code} - {dept.name}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Step 3: Itens do Processo */}
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
                          onUpdateComponent={(compId, field, value) =>
                            updateComponent(item.id, compId, field, value)
                          }
                          onRemoveComponent={(compId) => removeComponent(item.id, compId)}
                        />
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Step 4: Revisão */}
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
                    {/* Process Info */}
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
                                formasContratacao.find((f) => f.value === values.formaContratacao)
                                  ?.label
                              }
                              {values.formaContratacao === "licitacao" && values.modalidade && (
                                <span className="text-muted-foreground">
                                  {" "}
                                  -{" "}
                                  {
                                    modalidadesLicitacao.find((m) => m.value === values.modalidade)
                                      ?.label
                                  }
                                </span>
                              )}
                            </p>
                          </div>
                        )}
                        <div>
                          <p className="text-xs text-muted-foreground">Responsável</p>
                          <p className="font-medium">
                            {sampleUsers.find((u) => u.id === values.responsibleId)?.name}
                          </p>
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

                    {/* Object and Justification */}
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

                    {/* Links */}
                    <div className="space-y-3">
                      <h3 className="font-semibold">Vínculos Institucionais</h3>
                      <div className="rounded-lg bg-muted/30 p-4">
                        <div className="mb-3">
                          <p className="text-xs text-muted-foreground">Organização</p>
                          <p className="font-medium">{selectedOrg?.name}</p>
                        </div>
                        <div>
                          <p className="mb-2 text-xs text-muted-foreground">
                            Unidades orçamentárias ({selectedDepartments.length})
                          </p>
                          <div className="flex flex-wrap gap-1.5">
                            {selectedDepartments.map((dept) => (
                              <Badge key={dept.id} variant="secondary">
                                {dept.code} - {dept.name}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>

                    <Separator />

                    {/* Items Summary */}
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
                        {values.items.map((item, index) => (
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
                                  ` · ${item.components.length} componente${item.components.length !== 1 ? "s" : ""}`}
                              </p>
                            </div>
                            {parseCurrencyToNumber(item.totalValue) > 0 && (
                              <span className="shrink-0 text-sm font-semibold">
                                {formatCurrency(item.totalValue)}
                              </span>
                            )}
                          </div>
                        ))}
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

                    {/* Next Steps Info */}
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

            {/* Navigation */}
            <div className="flex items-center justify-between gap-4 border-t pt-6">
              <Button
                type="button"
                variant="outline"
                onClick={goToPreviousStep}
                disabled={isFirstStep}
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Voltar
              </Button>

              {isLastStep ? (
                <Button type="button" onClick={handleSubmit}>
                  <CheckCircle2 className="mr-2 h-4 w-4" />
                  Criar Processo
                </Button>
              ) : (
                <Button type="button" onClick={goToNextStep}>
                  Continuar
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              )}
            </div>
          </div>

          {/* Summary Panel (Desktop) */}
          <SummaryPanel values={values} />
        </div>
      </main>
    </div>
  );
}

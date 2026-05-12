import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  FileText,
  Layers3,
  Loader2,
  PackagePlus,
  Plus,
  Trash2,
  Upload,
} from "lucide-react";
import type { ChangeEvent, FormEvent } from "react";
import { useMemo, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { useAuthSession } from "@/modules/auth";
import { Alert, AlertDescription, AlertTitle } from "@/shared/ui/alert";
import { Badge } from "@/shared/ui/badge";
import { Button } from "@/shared/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/shared/ui/card";
import { Checkbox } from "@/shared/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/shared/ui/dialog";
import { Input } from "@/shared/ui/input";
import { Label } from "@/shared/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/shared/ui/select";
import { Textarea } from "@/shared/ui/textarea";
import {
  useProcessCreate,
  useProcessDepartmentsList,
  useProcessOrganizationsList,
} from "../api/processes";
import { extractExpenseRequestFromPdf } from "../model/expense-request-pdf";
import {
  addExpenseRequestComponentToItem,
  applyExtractionToFormValues,
  buildProcessCreateRequest,
  calculateExpenseRequestItemTotalValue,
  createEmptyExpenseRequestFormItem,
  deriveProcessTitlePreview,
  type ExpenseRequestExtractionResult,
  type ExpenseRequestFormItem,
  type ExpenseRequestFormItemComponent,
  type ExpenseRequestFormItemKind,
  filterDepartmentsForOrganization,
  getDefaultProcessCreationFormValues,
  getExpenseRequestItemTotalPreview,
  getProcessCreateErrorMessage,
  hasProcessCreationErrors,
  mapDepartmentOptions,
  mapOrganizationOptions,
  type ProcessCreationFormErrors,
  type ProcessCreationFormValues,
  processCreationStatusOptions,
  processTypeOptions,
  removeExpenseRequestComponentFromItem,
  toExpenseRequestFormItems,
  updateExpenseRequestComponentField,
  updateExpenseRequestFormItemField,
  validateProcessCreationForm,
} from "../model/processes";

type FieldName = keyof ProcessCreationFormValues;
type ProcessCreationStep = "request" | "links" | "items" | "review";

const wizardSteps: Array<{
  id: ProcessCreationStep;
  label: string;
  description: string;
}> = [
  {
    id: "request",
    label: "Dados",
    description: "Processo",
  },
  {
    id: "links",
    label: "Vínculos",
    description: "Organização",
  },
  {
    id: "items",
    label: "Itens",
    description: "SD nativa",
  },
  {
    id: "review",
    label: "Revisão",
    description: "Conferência",
  },
];

const requestStepErrorFields: Array<keyof ProcessCreationFormErrors> = [
  "type",
  "processNumber",
  "issuedAt",
  "title",
  "object",
  "justification",
  "responsibleName",
];

const linksStepErrorFields: Array<keyof ProcessCreationFormErrors> = [
  "organizationId",
  "departmentIds",
];

const warningLabels: Record<string, string> = {
  organization_cnpj_missing: "CNPJ da organizacao nao foi encontrado no PDF.",
  budget_unit_code_missing: "Codigo da unidade orcamentaria nao foi encontrado.",
  budget_unit_name_missing: "Nome da unidade orcamentaria nao foi encontrado.",
  item_description_missing: "Descricao do item nao foi encontrada.",
  item_value_missing: "Valor do item nao foi encontrado.",
  item_rows_missing: "Itens da SD nao foram detectados com seguranca.",
  responsible_name_missing: "Responsavel nao foi encontrado.",
  required_field_missing: "Revise os campos obrigatorios extraidos do PDF.",
  organization_match_missing: "Organizacao extraida nao foi encontrada no cadastro.",
  department_match_missing: "Unidade orcamentaria extraida nao foi encontrada no cadastro.",
};

function FieldError({ message }: { message?: string }) {
  if (!message) {
    return null;
  }

  return <p className="text-critical text-sm">{message}</p>;
}

function getImportErrorMessage(error: unknown) {
  if (typeof error === "object" && error !== null && "reason" in error) {
    const reason = error.reason;

    if (reason === "invalid_file" || reason === "read_failed" || reason === "empty_text") {
      return {
        title: "PDF nao lido",
        description: getProcessCreateErrorMessage(error),
      };
    }

    if (reason === "unrecognized_sd") {
      return {
        title: "Solicitacao nao reconhecida",
        description: getProcessCreateErrorMessage(error),
      };
    }

    if (reason === "missing_required_fields") {
      return {
        title: "Dados obrigatorios ausentes",
        description: getProcessCreateErrorMessage(error),
      };
    }
  }

  return {
    title: "PDF nao importado",
    description: getProcessCreateErrorMessage(error),
  };
}

function getExtractionItems(extraction: ExpenseRequestExtractionResult | null) {
  if (!extraction) {
    return [];
  }

  if (extraction.suggestions.expenseRequestItems) {
    return extraction.suggestions.expenseRequestItems.map((item) => ({
      ...createEmptyExpenseRequestFormItem({
        kind: item.kind ?? "simple",
        source: item.source ?? "pdf",
      }),
      ...item,
      kind: item.kind ?? "simple",
      title: item.title ?? "",
      components: item.kind === "kit" ? (item.components ?? []) : [],
    }));
  }

  return toExpenseRequestFormItems(
    extraction.extractedFields.items && extraction.extractedFields.items.length > 0
      ? extraction.extractedFields.items
      : [extraction.extractedFields.item],
    "pdf",
  );
}

function getItemSummary(item: ExpenseRequestFormItem) {
  const parts = [
    item.code.trim(),
    item.quantity.trim() && item.unit.trim()
      ? `${item.quantity.trim()} ${item.unit.trim()}`
      : item.quantity.trim() || item.unit.trim(),
    getExpenseRequestItemTotalPreview(item)
      ? `Total ${getExpenseRequestItemTotalPreview(item)}`
      : "",
  ].filter(Boolean);

  return parts.join(" | ");
}

function getItemDisplayName(item: ExpenseRequestFormItem) {
  return item.title.trim() || item.description.trim() || "Item sem titulo";
}

function ProcessCreationStepper({ currentStep }: { currentStep: ProcessCreationStep }) {
  const currentStepIndex = wizardSteps.findIndex((step) => step.id === currentStep);

  return (
    <Card>
      <CardContent className="p-4">
        <ol className="grid gap-3 md:grid-cols-4">
          {wizardSteps.map((step, index) => {
            const isActive = step.id === currentStep;
            const isComplete = index < currentStepIndex;

            return (
              <li
                key={step.id}
                className="flex items-center gap-3 rounded-md border border-border/70 px-3 py-2"
              >
                <span
                  className={
                    isActive || isComplete
                      ? "flex size-7 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs font-medium"
                      : "flex size-7 shrink-0 items-center justify-center rounded-full bg-muted text-muted-foreground text-xs font-medium"
                  }
                >
                  {isComplete ? <CheckCircle2 className="h-4 w-4" /> : index + 1}
                </span>
                <span className="min-w-0">
                  <span className="block truncate text-sm font-medium">{step.label}</span>
                  <span className="block truncate text-xs text-muted-foreground">
                    {step.description}
                  </span>
                </span>
              </li>
            );
          })}
        </ol>
      </CardContent>
    </Card>
  );
}

export function ProcessCreatePage() {
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const { role, organizationId } = useAuthSession();
  const actor = { role, organizationId };
  const [values, setValues] = useState<ProcessCreationFormValues>(() =>
    getDefaultProcessCreationFormValues(actor),
  );
  const [dirtyFields, setDirtyFields] = useState<Partial<Record<FieldName, boolean>>>({});
  const [errors, setErrors] = useState<ProcessCreationFormErrors>({});
  const [extraction, setExtraction] = useState<ExpenseRequestExtractionResult | null>(null);
  const [pendingExtraction, setPendingExtraction] = useState<ExpenseRequestExtractionResult | null>(
    null,
  );
  const [importError, setImportError] = useState<{
    title: string;
    description: string;
  } | null>(null);
  const [currentStep, setCurrentStep] = useState<ProcessCreationStep>("request");
  const [isImportDialogOpen, setIsImportDialogOpen] = useState(false);
  const [isExtracting, setIsExtracting] = useState(false);

  const departmentsQuery = useProcessDepartmentsList();
  const organizationsQuery = useProcessOrganizationsList(role === "admin");
  const createProcess = useProcessCreate();
  const departmentOptions = useMemo(
    () => mapDepartmentOptions(departmentsQuery.data?.items ?? []),
    [departmentsQuery.data],
  );
  const organizationOptions = useMemo(
    () => mapOrganizationOptions(organizationsQuery.data?.items ?? []),
    [organizationsQuery.data],
  );
  const visibleDepartmentOptions = filterDepartmentsForOrganization(
    departmentOptions,
    role === "admin" ? values.organizationId : (organizationId ?? ""),
  );
  const referenceDataError =
    departmentsQuery.isError || (role === "admin" && organizationsQuery.isError);
  const isReferenceDataLoading =
    departmentsQuery.isLoading || (role === "admin" && organizationsQuery.isLoading);
  const isSubmitDisabled =
    isReferenceDataLoading || referenceDataError || isExtracting || createProcess.isPending;

  function updateField<Field extends FieldName>(
    field: Field,
    value: ProcessCreationFormValues[Field],
  ) {
    setValues((currentValues) => ({ ...currentValues, [field]: value }));
    setDirtyFields((currentFields) => ({ ...currentFields, [field]: true }));
    setErrors((currentErrors) => ({ ...currentErrors, [field]: undefined, form: undefined }));
  }

  function toggleDepartment(departmentId: string) {
    const nextDepartmentIds = values.departmentIds.includes(departmentId)
      ? values.departmentIds.filter((id) => id !== departmentId)
      : [...values.departmentIds, departmentId];

    updateField("departmentIds", nextDepartmentIds);
  }

  function addExpenseRequestItem(kind: ExpenseRequestFormItemKind = "simple") {
    setValues((currentValues) => ({
      ...currentValues,
      expenseRequestItems: [
        ...currentValues.expenseRequestItems,
        createEmptyExpenseRequestFormItem({ kind, source: "manual" }),
      ],
    }));
    setErrors((currentErrors) => ({ ...currentErrors, form: undefined }));
  }

  function updateExpenseRequestItem(
    itemId: string,
    field: keyof Omit<ExpenseRequestFormItem, "id" | "source" | "components">,
    value: string,
  ) {
    setValues((currentValues) => ({
      ...currentValues,
      expenseRequestItems: currentValues.expenseRequestItems.map((item) =>
        item.id === itemId ? updateExpenseRequestFormItemField(item, field, value as never) : item,
      ),
    }));
    setErrors((currentErrors) => ({ ...currentErrors, form: undefined }));
  }

  function removeExpenseRequestItem(itemId: string) {
    setValues((currentValues) => ({
      ...currentValues,
      expenseRequestItems: currentValues.expenseRequestItems.filter((item) => item.id !== itemId),
    }));
    setErrors((currentErrors) => ({ ...currentErrors, form: undefined }));
  }

  function addExpenseRequestComponent(itemId: string) {
    setValues((currentValues) => ({
      ...currentValues,
      expenseRequestItems: currentValues.expenseRequestItems.map((item) =>
        item.id === itemId ? addExpenseRequestComponentToItem(item) : item,
      ),
    }));
    setErrors((currentErrors) => ({ ...currentErrors, form: undefined }));
  }

  function updateExpenseRequestComponent(
    itemId: string,
    componentId: string,
    field: keyof Omit<ExpenseRequestFormItemComponent, "id">,
    value: string,
  ) {
    setValues((currentValues) => ({
      ...currentValues,
      expenseRequestItems: currentValues.expenseRequestItems.map((item) =>
        item.id === itemId
          ? updateExpenseRequestComponentField(item, componentId, field, value)
          : item,
      ),
    }));
    setErrors((currentErrors) => ({ ...currentErrors, form: undefined }));
  }

  function removeExpenseRequestComponent(itemId: string, componentId: string) {
    setValues((currentValues) => ({
      ...currentValues,
      expenseRequestItems: currentValues.expenseRequestItems.map((item) =>
        item.id === itemId ? removeExpenseRequestComponentFromItem(item, componentId) : item,
      ),
    }));
    setErrors((currentErrors) => ({ ...currentErrors, form: undefined }));
  }

  function handleObjectChange(object: string) {
    setValues((currentValues) => ({
      ...currentValues,
      object,
      ...(dirtyFields.title
        ? {}
        : {
            title: deriveProcessTitlePreview({
              object,
              processNumber: currentValues.processNumber,
            }),
          }),
    }));
    setDirtyFields((currentFields) => ({ ...currentFields, object: true }));
    setErrors((currentErrors) => ({
      ...currentErrors,
      object: undefined,
      ...(dirtyFields.title ? {} : { title: undefined }),
      form: undefined,
    }));
  }

  function addReferenceDataMatches(nextExtraction: ExpenseRequestExtractionResult) {
    const warnings = new Set(nextExtraction.warnings);
    const organizationMatch = organizationOptions.find(
      (organization) => organization.cnpj === nextExtraction.extractedFields.organizationCnpj,
    );
    const departmentMatch = departmentOptions.find(
      (department) =>
        department.budgetUnitCode === nextExtraction.extractedFields.budgetUnitCode &&
        (!organizationMatch || department.organizationId === organizationMatch.id),
    );

    if (role === "admin" && nextExtraction.extractedFields.organizationCnpj && !organizationMatch) {
      warnings.add("organization_match_missing");
    }

    if (nextExtraction.extractedFields.budgetUnitCode && !departmentMatch) {
      warnings.add("department_match_missing");
    }

    return {
      ...nextExtraction,
      warnings: Array.from(warnings),
      suggestions: {
        ...nextExtraction.suggestions,
        sourceMetadata: {
          ...(nextExtraction.suggestions.sourceMetadata ?? {}),
          warnings: Array.from(warnings),
        },
        ...(role === "admin" && organizationMatch ? { organizationId: organizationMatch.id } : {}),
        ...(departmentMatch ? { departmentIds: [departmentMatch.id] } : {}),
      },
    };
  }

  function handleImportDialogOpenChange(open: boolean) {
    setIsImportDialogOpen(open);

    if (open) {
      setPendingExtraction(extraction);
      setImportError(null);
      return;
    }

    setPendingExtraction(null);
    setImportError(null);
    setIsExtracting(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }

  async function handlePdfChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    setIsExtracting(true);
    setImportError(null);
    setPendingExtraction(null);

    try {
      setPendingExtraction(addReferenceDataMatches(await extractExpenseRequestFromPdf(file)));
    } catch (error) {
      setImportError(getImportErrorMessage(error));
    } finally {
      setIsExtracting(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  }

  function handleApplyPendingExtraction() {
    if (!pendingExtraction) {
      return;
    }

    setExtraction(pendingExtraction);
    setValues((currentValues) => ({
      ...applyExtractionToFormValues(currentValues, pendingExtraction, dirtyFields),
      expenseRequestItems: getExtractionItems(pendingExtraction),
    }));
    setIsImportDialogOpen(false);
    setImportError(null);
    setPendingExtraction(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }

  function getCurrentStepIndex() {
    return wizardSteps.findIndex((step) => step.id === currentStep);
  }

  function validateStep(step: ProcessCreationStep) {
    const nextErrors = validateProcessCreationForm(values, actor);

    if (step === "request") {
      const requestErrors = Object.fromEntries(
        requestStepErrorFields
          .filter((field) => nextErrors[field])
          .map((field) => [field, nextErrors[field]]),
      ) as ProcessCreationFormErrors;

      if (hasProcessCreationErrors(requestErrors)) {
        setErrors(requestErrors);
        return false;
      }
    }

    if (step === "links") {
      const linkErrors = Object.fromEntries(
        linksStepErrorFields
          .filter((field) => nextErrors[field])
          .map((field) => [field, nextErrors[field]]),
      ) as ProcessCreationFormErrors;

      if (hasProcessCreationErrors(linkErrors) || referenceDataError) {
        setErrors(
          hasProcessCreationErrors(linkErrors)
            ? linkErrors
            : { form: "Recarregue os dados de apoio antes de continuar." },
        );
        return false;
      }
    }

    if (step === "items") {
      const hasInvalidItem = values.expenseRequestItems.some(
        (item) =>
          !item.title.trim() &&
          !item.description.trim() &&
          item.components.every(
            (component) => !component.title.trim() && !component.description.trim(),
          ),
      );

      if (hasInvalidItem) {
        setErrors({ form: "Informe ao menos um titulo ou descricao para cada item." });
        return false;
      }
    }

    setErrors((currentErrors) => ({ ...currentErrors, form: undefined }));
    return true;
  }

  function goToPreviousStep() {
    const currentIndex = getCurrentStepIndex();
    const previousStep = wizardSteps[currentIndex - 1]?.id;

    if (previousStep) {
      setCurrentStep(previousStep);
    }
  }

  function goToNextStep() {
    if (!validateStep(currentStep)) {
      return;
    }

    const currentIndex = getCurrentStepIndex();
    const nextStep = wizardSteps[currentIndex + 1]?.id;

    if (nextStep) {
      setCurrentStep(nextStep);
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const nextErrors = validateProcessCreationForm(values, actor);

    if (hasProcessCreationErrors(nextErrors)) {
      setErrors(nextErrors);
      setCurrentStep(
        requestStepErrorFields.some((field) => nextErrors[field]) ? "request" : "links",
      );
      return;
    }

    try {
      const process = await createProcess.mutateAsync({
        data: buildProcessCreateRequest(values, actor),
      });

      toast.success("Processo criado com sucesso.");
      navigate(`/app/processo/${process.id}`);
    } catch (error) {
      setErrors({ form: getProcessCreateErrorMessage(error) });
    }
  }

  return (
    <main className="flex-1 overflow-auto p-6">
      <div className="mx-auto max-w-5xl space-y-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="space-y-1">
            <Button asChild variant="ghost" size="sm" className="-ml-3">
              <Link to="/app/processos">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Processos
              </Link>
            </Button>
            <h1 className="text-2xl font-semibold tracking-tight">Novo Processo</h1>
            <p className="text-muted-foreground">
              Crie manualmente ou importe uma Solicitacao de Despesa TopDown para revisar os dados.
            </p>
          </div>
          <Button
            type="button"
            variant="outline"
            onClick={() => handleImportDialogOpenChange(true)}
            className="w-full md:w-auto"
          >
            <Upload className="mr-2 h-4 w-4" />
            Importar SD
          </Button>
        </div>

        {referenceDataError ? (
          <Alert variant="destructive">
            <AlertCircle />
            <AlertTitle>Dados de apoio indisponiveis</AlertTitle>
            <AlertDescription>
              Nao foi possivel carregar departamentos ou organizacoes. Tente novamente antes de
              criar o processo.
              <div className="mt-3 flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => void departmentsQuery.refetch()}
                >
                  Recarregar departamentos
                </Button>
                {role === "admin" ? (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => void organizationsQuery.refetch()}
                  >
                    Recarregar organizacoes
                  </Button>
                ) : null}
              </div>
            </AlertDescription>
          </Alert>
        ) : null}

        <Dialog open={isImportDialogOpen} onOpenChange={handleImportDialogOpenChange}>
          <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
            <DialogHeader>
              <DialogTitle>Importar SD TopDown</DialogTitle>
              <DialogDescription>
                Selecione o PDF, confira os dados encontrados e aplique ao formulario.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="expense-request-pdf">Selecionar PDF TopDown</Label>
                <Input
                  ref={fileInputRef}
                  id="expense-request-pdf"
                  type="file"
                  accept="application/pdf,.pdf"
                  onChange={(event) => void handlePdfChange(event)}
                  disabled={isExtracting}
                />
              </div>

              {isExtracting ? (
                <Alert>
                  <Loader2 className="animate-spin" />
                  <AlertTitle>Lendo PDF</AlertTitle>
                  <AlertDescription>Extraindo o texto da Solicitacao de Despesa.</AlertDescription>
                </Alert>
              ) : null}

              {importError ? (
                <Alert variant="destructive">
                  <AlertCircle />
                  <AlertTitle>{importError.title}</AlertTitle>
                  <AlertDescription>{importError.description}</AlertDescription>
                </Alert>
              ) : null}

              {pendingExtraction ? (
                <div className="space-y-4 rounded-md border p-4">
                  <div className="flex items-start gap-3">
                    <FileText className="mt-0.5 h-5 w-5 shrink-0 text-muted-foreground" />
                    <div className="min-w-0 space-y-1">
                      <h3 className="font-medium">Preview de {pendingExtraction.fileName}</h3>
                      <p className="text-muted-foreground text-sm">
                        Estes dados serao aplicados somente ao confirmar.
                      </p>
                    </div>
                  </div>

                  <dl className="grid gap-3 text-sm sm:grid-cols-2">
                    <div className="sm:col-span-2">
                      <dt className="text-muted-foreground">Título</dt>
                      <dd className="font-medium">
                        {pendingExtraction.suggestions.title ?? "Não encontrado"}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-muted-foreground">Numero</dt>
                      <dd className="font-medium">
                        {pendingExtraction.suggestions.processNumber ?? "Nao encontrado"}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-muted-foreground">Data</dt>
                      <dd className="font-medium">
                        {pendingExtraction.suggestions.issuedAt ?? "Nao encontrada"}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-muted-foreground">Unidade</dt>
                      <dd className="font-medium">
                        {pendingExtraction.extractedFields.budgetUnitCode ?? "--"}
                        {pendingExtraction.extractedFields.budgetUnitName
                          ? ` - ${pendingExtraction.extractedFields.budgetUnitName}`
                          : ""}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-muted-foreground">Responsavel</dt>
                      <dd className="font-medium">
                        {pendingExtraction.suggestions.responsibleName ?? "Nao encontrado"}
                      </dd>
                    </div>
                    <div className="sm:col-span-2">
                      <dt className="text-muted-foreground">Objeto</dt>
                      <dd className="font-medium">
                        {pendingExtraction.suggestions.object ?? "Nao encontrado"}
                      </dd>
                    </div>
                  </dl>

                  <div className="space-y-3">
                    <div className="flex items-center justify-between gap-3">
                      <h4 className="font-medium text-sm">Itens encontrados</h4>
                      <Badge variant="secondary">
                        {getExtractionItems(pendingExtraction).length} item
                        {getExtractionItems(pendingExtraction).length === 1 ? "" : "s"}
                      </Badge>
                    </div>
                    {getExtractionItems(pendingExtraction).length > 0 ? (
                      <div className="space-y-2">
                        {getExtractionItems(pendingExtraction).map((item, index) => (
                          <div
                            key={item.id}
                            className="grid gap-2 rounded-md border bg-muted/30 p-3 text-sm"
                          >
                            <div className="flex items-start justify-between gap-3">
                              <p className="font-medium">
                                {index + 1}. {item.description || "Descricao nao encontrada"}
                              </p>
                            </div>
                            <p className="text-muted-foreground">{getItemSummary(item)}</p>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-muted-foreground text-sm">
                        Nenhum item estruturado foi detectado no PDF.
                      </p>
                    )}
                  </div>

                  {pendingExtraction.warnings.length > 0 ? (
                    <div className="space-y-2">
                      <p className="text-muted-foreground text-sm">
                        Alguns pontos precisam de revisao:
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {pendingExtraction.warnings.map((warning) => (
                          <Badge key={warning} variant="secondary">
                            {warningLabels[warning] ?? warning}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  ) : null}
                </div>
              ) : null}
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => handleImportDialogOpenChange(false)}
              >
                Cancelar
              </Button>
              <Button
                type="button"
                onClick={handleApplyPendingExtraction}
                disabled={!pendingExtraction || isExtracting}
              >
                Aplicar dados
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <form onSubmit={handleSubmit} className="space-y-6">
          <ProcessCreationStepper currentStep={currentStep} />

          {extraction ? (
            <Alert>
              <FileText />
              <AlertTitle>Dados importados de {extraction.fileName}</AlertTitle>
              <AlertDescription>
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <span>Revise os campos preenchidos antes de criar o processo.</span>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => handleImportDialogOpenChange(true)}
                    className="w-full sm:w-auto"
                  >
                    Substituir PDF
                  </Button>
                </div>
              </AlertDescription>
            </Alert>
          ) : null}

          {errors.form ? (
            <Alert variant="destructive">
              <AlertCircle />
              <AlertTitle>Nao foi possivel continuar</AlertTitle>
              <AlertDescription>{errors.form}</AlertDescription>
            </Alert>
          ) : null}

          {currentStep === "request" ? (
            <Card>
              <CardHeader>
                <CardTitle>Dados do Processo</CardTitle>
                <CardDescription>Campos obrigatorios para criacao do processo.</CardDescription>
              </CardHeader>
              <CardContent className="grid gap-5">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="process-type">Tipo</Label>
                    <Select value={values.type} onValueChange={(type) => updateField("type", type)}>
                      <SelectTrigger id="process-type" aria-invalid={Boolean(errors.type)}>
                        <SelectValue placeholder="Selecione o tipo" />
                      </SelectTrigger>
                      <SelectContent>
                        {processTypeOptions.map((type) => (
                          <SelectItem key={type.value} value={type.value}>
                            {type.label}
                          </SelectItem>
                        ))}
                        {values.type &&
                        !processTypeOptions.some((type) => type.value === values.type) ? (
                          <SelectItem value={values.type}>{values.type}</SelectItem>
                        ) : null}
                      </SelectContent>
                    </Select>
                    <FieldError message={errors.type} />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="process-number">Numero do processo</Label>
                    <Input
                      id="process-number"
                      value={values.processNumber}
                      onChange={(event) => updateField("processNumber", event.target.value)}
                      aria-invalid={Boolean(errors.processNumber)}
                    />
                    <FieldError message={errors.processNumber} />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="external-id">ID externo</Label>
                    <Input
                      id="external-id"
                      value={values.externalId}
                      onChange={(event) => updateField("externalId", event.target.value)}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="issued-at">Data de emissao</Label>
                    <Input
                      id="issued-at"
                      type="date"
                      value={values.issuedAt}
                      onChange={(event) => updateField("issuedAt", event.target.value)}
                      aria-invalid={Boolean(errors.issuedAt)}
                    />
                    <FieldError message={errors.issuedAt} />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="responsible-name">Responsavel</Label>
                    <Input
                      id="responsible-name"
                      value={values.responsibleName}
                      onChange={(event) => updateField("responsibleName", event.target.value)}
                      aria-invalid={Boolean(errors.responsibleName)}
                    />
                    <FieldError message={errors.responsibleName} />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="process-status">Status</Label>
                    <Select
                      value={values.status}
                      onValueChange={(status) =>
                        updateField("status", status as ProcessCreationFormValues["status"])
                      }
                    >
                      <SelectTrigger id="process-status">
                        <SelectValue placeholder="Selecione o status" />
                      </SelectTrigger>
                      <SelectContent>
                        {processCreationStatusOptions.map((status) => (
                          <SelectItem key={status.value} value={status.value}>
                            {status.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="process-title">Título</Label>
                  <Input
                    id="process-title"
                    value={values.title}
                    onChange={(event) => updateField("title", event.target.value)}
                    aria-invalid={Boolean(errors.title)}
                  />
                  <FieldError message={errors.title} />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="process-object">Objeto</Label>
                  <Textarea
                    id="process-object"
                    value={values.object}
                    onChange={(event) => handleObjectChange(event.target.value)}
                    aria-invalid={Boolean(errors.object)}
                    className="min-h-24"
                  />
                  <FieldError message={errors.object} />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="process-justification">Justificativa</Label>
                  <Textarea
                    id="process-justification"
                    value={values.justification}
                    onChange={(event) => updateField("justification", event.target.value)}
                    aria-invalid={Boolean(errors.justification)}
                    className="min-h-28"
                  />
                  <FieldError message={errors.justification} />
                </div>
              </CardContent>
            </Card>
          ) : null}

          {currentStep === "items" ? (
            <Card>
              <CardHeader>
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <CardTitle>Itens da Solicitação</CardTitle>
                    <CardDescription>
                      Cadastre itens simples ou kits com componentes separados.
                    </CardDescription>
                  </div>
                  <div className="flex flex-col gap-2 sm:flex-row">
                    <Button type="button" variant="outline" onClick={() => addExpenseRequestItem()}>
                      <Plus className="mr-2 h-4 w-4" />
                      Item simples
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => addExpenseRequestItem("kit")}
                    >
                      <PackagePlus className="mr-2 h-4 w-4" />
                      Kit
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {values.expenseRequestItems.length === 0 ? (
                  <div className="rounded-md border border-dashed p-4 text-muted-foreground text-sm">
                    Nenhum item vinculado ao processo. Adicione um item simples ou kit.
                  </div>
                ) : (
                  <div className="space-y-3">
                    {values.expenseRequestItems.map((item, index) => (
                      <div key={item.id} className="rounded-md border p-3">
                        <div className="mb-3 flex items-center justify-between gap-3">
                          <div className="flex items-center gap-2">
                            <Badge variant="secondary">Item {index + 1}</Badge>
                            <Badge variant="outline">
                              {item.source === "pdf" ? "PDF" : "Manual"}
                            </Badge>
                            <Badge variant={item.kind === "kit" ? "default" : "outline"}>
                              {item.kind === "kit" ? "Kit" : "Simples"}
                            </Badge>
                          </div>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            aria-label={`Remover item ${index + 1}`}
                            onClick={() => removeExpenseRequestItem(item.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>

                        <div className="grid gap-3 md:grid-cols-[minmax(7rem,0.8fr)_minmax(10rem,1.2fr)_minmax(12rem,2fr)_minmax(6rem,0.7fr)_minmax(6rem,0.7fr)_minmax(7rem,0.8fr)_minmax(7rem,0.8fr)]">
                          <div className="space-y-2">
                            <Label htmlFor={`item-code-${item.id}`}>Codigo</Label>
                            <Input
                              id={`item-code-${item.id}`}
                              aria-label={`Codigo do item ${index + 1}`}
                              value={item.code}
                              onChange={(event) =>
                                updateExpenseRequestItem(item.id, "code", event.target.value)
                              }
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor={`item-title-${item.id}`}>Título</Label>
                            <Input
                              id={`item-title-${item.id}`}
                              aria-label={`Título do item ${index + 1}`}
                              value={item.title}
                              onChange={(event) =>
                                updateExpenseRequestItem(item.id, "title", event.target.value)
                              }
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor={`item-description-${item.id}`}>Descricao</Label>
                            <Textarea
                              id={`item-description-${item.id}`}
                              aria-label={`Descricao do item ${index + 1}`}
                              value={item.description}
                              onChange={(event) =>
                                updateExpenseRequestItem(item.id, "description", event.target.value)
                              }
                              className="min-h-10 md:min-h-10"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor={`item-quantity-${item.id}`}>Qtd.</Label>
                            <Input
                              id={`item-quantity-${item.id}`}
                              aria-label={`Quantidade do item ${index + 1}`}
                              value={item.quantity}
                              onChange={(event) =>
                                updateExpenseRequestItem(item.id, "quantity", event.target.value)
                              }
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor={`item-unit-${item.id}`}>Und.</Label>
                            <Input
                              id={`item-unit-${item.id}`}
                              aria-label={`Unidade do item ${index + 1}`}
                              value={item.unit}
                              onChange={(event) =>
                                updateExpenseRequestItem(item.id, "unit", event.target.value)
                              }
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor={`item-unit-value-${item.id}`}>Vlr. unit.</Label>
                            <Input
                              id={`item-unit-value-${item.id}`}
                              aria-label={`Valor unitario do item ${index + 1}`}
                              value={item.unitValue}
                              onChange={(event) =>
                                updateExpenseRequestItem(item.id, "unitValue", event.target.value)
                              }
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor={`item-total-value-${item.id}`}>Vlr. total</Label>
                            <Input
                              id={`item-total-value-${item.id}`}
                              aria-label={`Valor total do item ${index + 1}`}
                              value={item.totalValue}
                              onChange={(event) =>
                                updateExpenseRequestItem(item.id, "totalValue", event.target.value)
                              }
                            />
                          </div>
                        </div>

                        {calculateExpenseRequestItemTotalValue(item.quantity, item.unitValue) ? (
                          <p className="mt-3 text-muted-foreground text-xs">
                            Total calculado:{" "}
                            <span className="font-medium text-foreground">
                              {calculateExpenseRequestItemTotalValue(item.quantity, item.unitValue)}
                            </span>
                          </p>
                        ) : null}

                        {item.kind === "kit" ? (
                          <div className="mt-4 space-y-3 border-l pl-4">
                            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                              <div>
                                <p className="font-medium text-sm">Componentes do kit</p>
                                <p className="text-muted-foreground text-xs">
                                  Separe cada componente para evitar descrições enormes.
                                </p>
                              </div>
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => addExpenseRequestComponent(item.id)}
                              >
                                <Layers3 className="mr-2 h-4 w-4" />
                                Adicionar componente
                              </Button>
                            </div>

                            {item.components.length === 0 ? (
                              <div className="rounded-md border border-dashed p-3 text-muted-foreground text-sm">
                                Nenhum componente cadastrado para este kit.
                              </div>
                            ) : (
                              <div className="space-y-3">
                                {item.components.map((component, componentIndex) => (
                                  <div key={component.id} className="rounded-md border p-3">
                                    <div className="mb-3 flex items-center justify-between gap-3">
                                      <Badge variant="secondary">
                                        Componente {componentIndex + 1}
                                      </Badge>
                                      <Button
                                        type="button"
                                        variant="ghost"
                                        size="icon"
                                        aria-label={`Remover componente ${componentIndex + 1} do item ${index + 1}`}
                                        onClick={() =>
                                          removeExpenseRequestComponent(item.id, component.id)
                                        }
                                      >
                                        <Trash2 className="h-4 w-4" />
                                      </Button>
                                    </div>

                                    <div className="grid gap-3 md:grid-cols-[minmax(10rem,1fr)_minmax(12rem,1.5fr)_minmax(6rem,0.7fr)_minmax(6rem,0.7fr)]">
                                      <div className="space-y-2">
                                        <Label htmlFor={`component-title-${component.id}`}>
                                          Título
                                        </Label>
                                        <Input
                                          id={`component-title-${component.id}`}
                                          aria-label={`Título do componente ${componentIndex + 1} do item ${index + 1}`}
                                          value={component.title}
                                          onChange={(event) =>
                                            updateExpenseRequestComponent(
                                              item.id,
                                              component.id,
                                              "title",
                                              event.target.value,
                                            )
                                          }
                                        />
                                      </div>
                                      <div className="space-y-2">
                                        <Label htmlFor={`component-description-${component.id}`}>
                                          Descricao
                                        </Label>
                                        <Textarea
                                          id={`component-description-${component.id}`}
                                          aria-label={`Descricao do componente ${componentIndex + 1} do item ${index + 1}`}
                                          value={component.description}
                                          onChange={(event) =>
                                            updateExpenseRequestComponent(
                                              item.id,
                                              component.id,
                                              "description",
                                              event.target.value,
                                            )
                                          }
                                          className="min-h-16"
                                        />
                                      </div>
                                      <div className="space-y-2">
                                        <Label htmlFor={`component-quantity-${component.id}`}>
                                          Qtd.
                                        </Label>
                                        <Input
                                          id={`component-quantity-${component.id}`}
                                          aria-label={`Quantidade do componente ${componentIndex + 1} do item ${index + 1}`}
                                          value={component.quantity}
                                          onChange={(event) =>
                                            updateExpenseRequestComponent(
                                              item.id,
                                              component.id,
                                              "quantity",
                                              event.target.value,
                                            )
                                          }
                                        />
                                      </div>
                                      <div className="space-y-2">
                                        <Label htmlFor={`component-unit-${component.id}`}>
                                          Und.
                                        </Label>
                                        <Input
                                          id={`component-unit-${component.id}`}
                                          aria-label={`Unidade do componente ${componentIndex + 1} do item ${index + 1}`}
                                          value={component.unit}
                                          onChange={(event) =>
                                            updateExpenseRequestComponent(
                                              item.id,
                                              component.id,
                                              "unit",
                                              event.target.value,
                                            )
                                          }
                                        />
                                      </div>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        ) : null}
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          ) : null}

          {currentStep === "links" ? (
            <Card>
              <CardHeader>
                <CardTitle>Vinculos</CardTitle>
                <CardDescription>
                  Defina a organizacao e os departamentos do processo.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-5">
                {role === "admin" ? (
                  <div className="space-y-2">
                    <Label htmlFor="organization">Organizacao</Label>
                    <Select
                      value={values.organizationId}
                      onValueChange={(organizationId) => {
                        updateField("organizationId", organizationId);
                        updateField("departmentIds", []);
                      }}
                      disabled={organizationsQuery.isLoading}
                    >
                      <SelectTrigger
                        id="organization"
                        aria-invalid={Boolean(errors.organizationId)}
                      >
                        <SelectValue placeholder="Selecione a organizacao" />
                      </SelectTrigger>
                      <SelectContent>
                        {organizationOptions.map((organization) => (
                          <SelectItem key={organization.id} value={organization.id}>
                            {organization.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FieldError message={errors.organizationId} />
                  </div>
                ) : null}

                <div className="space-y-2">
                  <Label>Departamentos</Label>
                  <div className="grid gap-2 rounded-md border p-3 md:grid-cols-2">
                    {isReferenceDataLoading ? (
                      <p className="text-muted-foreground text-sm">Carregando departamentos...</p>
                    ) : visibleDepartmentOptions.length === 0 ? (
                      <p className="text-muted-foreground text-sm">
                        Nenhum departamento disponivel para a organizacao selecionada.
                      </p>
                    ) : (
                      visibleDepartmentOptions.map((department) => (
                        <Label
                          key={department.id}
                          className="flex min-w-0 items-center gap-3 rounded-md border px-3 py-2"
                        >
                          <Checkbox
                            checked={values.departmentIds.includes(department.id)}
                            onCheckedChange={() => toggleDepartment(department.id)}
                          />
                          <span className="truncate">{department.label}</span>
                        </Label>
                      ))
                    )}
                  </div>
                  <FieldError message={errors.departmentIds} />
                </div>
              </CardContent>
            </Card>
          ) : null}

          {currentStep === "review" ? (
            <Card>
              <CardHeader>
                <CardTitle>Revisão da Solicitação</CardTitle>
                <CardDescription>
                  Confira os dados antes de criar o processo e liberar a geração dos documentos.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <p className="text-muted-foreground text-sm">Número</p>
                    <p className="font-medium">{values.processNumber || "Nao informado"}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground text-sm">Responsável</p>
                    <p className="font-medium">{values.responsibleName || "Nao informado"}</p>
                  </div>
                  <div className="md:col-span-2">
                    <p className="text-muted-foreground text-sm">Objeto</p>
                    <p className="font-medium">{values.object || "Nao informado"}</p>
                  </div>
                  <div className="md:col-span-2">
                    <p className="text-muted-foreground text-sm">Justificativa</p>
                    <p className="font-medium">{values.justification || "Nao informado"}</p>
                  </div>
                </div>

                <div className="space-y-2">
                  <p className="text-muted-foreground text-sm">Departamentos</p>
                  <div className="flex flex-wrap gap-2">
                    {values.departmentIds.length === 0 ? (
                      <Badge variant="secondary">Nenhum departamento</Badge>
                    ) : (
                      values.departmentIds.map((departmentId) => (
                        <Badge key={departmentId} variant="secondary">
                          {departmentOptions.find((department) => department.id === departmentId)
                            ?.label ?? departmentId}
                        </Badge>
                      ))
                    )}
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-muted-foreground text-sm">Itens</p>
                    <Badge variant="secondary">
                      {values.expenseRequestItems.length} item
                      {values.expenseRequestItems.length === 1 ? "" : "s"}
                    </Badge>
                  </div>
                  {values.expenseRequestItems.length === 0 ? (
                    <div className="rounded-md border border-dashed p-4 text-muted-foreground text-sm">
                      Nenhum item cadastrado.
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {values.expenseRequestItems.map((item, index) => (
                        <div key={item.id} className="rounded-md border p-4">
                          <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                            <div>
                              <div className="flex flex-wrap items-center gap-2">
                                <Badge variant={item.kind === "kit" ? "default" : "outline"}>
                                  {item.kind === "kit" ? "Kit" : "Item simples"}
                                </Badge>
                                <span className="font-medium">
                                  {index + 1}. {getItemDisplayName(item)}
                                </span>
                              </div>
                              {item.description ? (
                                <p className="mt-2 text-muted-foreground text-sm">
                                  {item.description}
                                </p>
                              ) : null}
                            </div>
                            <p className="text-sm">
                              {getItemSummary(item) || getExpenseRequestItemTotalPreview(item)}
                            </p>
                          </div>
                          {item.components.length > 0 ? (
                            <div className="mt-3 space-y-2 border-l pl-4">
                              <p className="text-muted-foreground text-xs">Componentes</p>
                              {item.components.map((component) => (
                                <div key={component.id} className="text-sm">
                                  <span className="font-medium">
                                    {component.title || component.description || "Componente"}
                                  </span>
                                  {component.quantity || component.unit ? (
                                    <span className="text-muted-foreground">
                                      {" "}
                                      —{" "}
                                      {[component.quantity, component.unit]
                                        .filter(Boolean)
                                        .join(" ")}
                                    </span>
                                  ) : null}
                                  {component.description && component.title ? (
                                    <p className="text-muted-foreground">{component.description}</p>
                                  ) : null}
                                </div>
                              ))}
                            </div>
                          ) : null}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ) : null}

          <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
            {currentStep === "request" ? (
              <Button asChild type="button" variant="outline">
                <Link to="/app/processos">Cancelar</Link>
              </Button>
            ) : (
              <Button type="button" variant="outline" onClick={goToPreviousStep}>
                <ArrowLeft className="mr-2 h-4 w-4" />
                Voltar
              </Button>
            )}
            {currentStep === "review" ? (
              <Button type="submit" disabled={isSubmitDisabled}>
                {createProcess.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                Criar Processo
              </Button>
            ) : (
              <Button
                type="button"
                onClick={goToNextStep}
                disabled={currentStep === "links" && isReferenceDataLoading}
              >
                Continuar
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            )}
          </div>
        </form>
      </div>
    </main>
  );
}

import { AlertCircle, ArrowLeft, FileText, Loader2, Upload } from "lucide-react";
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
  applyExtractionToFormValues,
  buildProcessCreateRequest,
  type ExpenseRequestExtractionResult,
  filterDepartmentsForOrganization,
  getDefaultProcessCreationFormValues,
  getProcessCreateErrorMessage,
  hasProcessCreationErrors,
  mapDepartmentOptions,
  mapOrganizationOptions,
  type ProcessCreationFormErrors,
  type ProcessCreationFormValues,
  processCreationStatusOptions,
  processTypeOptions,
  validateProcessCreationForm,
} from "../model/processes";

type FieldName = keyof ProcessCreationFormValues;

const warningLabels: Record<string, string> = {
  organization_cnpj_missing: "CNPJ da organizacao nao foi encontrado no PDF.",
  budget_unit_code_missing: "Codigo da unidade orcamentaria nao foi encontrado.",
  budget_unit_name_missing: "Nome da unidade orcamentaria nao foi encontrado.",
  item_description_missing: "Descricao do item nao foi encontrada.",
  item_value_missing: "Valor do item nao foi encontrado.",
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
    setValues((currentValues) =>
      applyExtractionToFormValues(currentValues, pendingExtraction, dirtyFields),
    );
    setIsImportDialogOpen(false);
    setImportError(null);
    setPendingExtraction(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const nextErrors = validateProcessCreationForm(values, actor);

    if (hasProcessCreationErrors(nextErrors)) {
      setErrors(nextErrors);
      return;
    }

    try {
      const process = await createProcess.mutateAsync({
        data: buildProcessCreateRequest(values, actor),
      });

      toast.success("Processo criado com sucesso.");
      navigate(`/app/processos?created=${process.id}`);
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

          <Card>
            <CardHeader>
              <CardTitle>Dados do Processo</CardTitle>
              <CardDescription>Campos obrigatorios para criacao do processo.</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-5">
              {errors.form ? (
                <Alert variant="destructive">
                  <AlertCircle />
                  <AlertTitle>Nao foi possivel criar o processo</AlertTitle>
                  <AlertDescription>{errors.form}</AlertDescription>
                </Alert>
              ) : null}

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
                <Label htmlFor="process-object">Objeto</Label>
                <Textarea
                  id="process-object"
                  value={values.object}
                  onChange={(event) => updateField("object", event.target.value)}
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
                    <SelectTrigger id="organization" aria-invalid={Boolean(errors.organizationId)}>
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

          <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
            <Button asChild type="button" variant="outline">
              <Link to="/app/processos">Cancelar</Link>
            </Button>
            <Button type="submit" disabled={isSubmitDisabled}>
              {createProcess.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Criar Processo
            </Button>
          </div>
        </form>
      </div>
    </main>
  );
}

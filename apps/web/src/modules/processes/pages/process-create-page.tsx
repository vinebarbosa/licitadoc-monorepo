import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { useAuthSession } from "@/modules/auth";
import {
  useCurrentProcessOrganization,
  useProcessCreate,
  useProcessDepartmentsList,
  useProcessOrganizationsList,
} from "../api/processes";
import {
  buildCreateRequest,
  getApiErrorMessage,
  ProcessFormWizard,
} from "../ui/process-form-wizard";

export function ProcessCreatePage() {
  const navigate = useNavigate();
  const { organizationId: actorOrganizationId, role } = useAuthSession();
  const isAdmin = role === "admin";
  const createProcess = useProcessCreate();
  const departmentsQuery = useProcessDepartmentsList();
  const organizationsQuery = useProcessOrganizationsList(isAdmin);
  const currentOrganizationQuery = useCurrentProcessOrganization(!isAdmin && Boolean(actorOrganizationId));
  const [submitErrorMessage, setSubmitErrorMessage] = useState<string>();

  const organizations = organizationsQuery.data?.items ?? [];
  const departments = departmentsQuery.data?.items ?? [];
  const productionOrganizations = useMemo(() => {
    if (isAdmin) {
      return organizations;
    }

    const organization = currentOrganizationQuery.data;

    return organization ? [organization] : [];
  }, [currentOrganizationQuery.data, isAdmin, organizations]);

  const hasReferenceError =
    departmentsQuery.isError || (isAdmin ? organizationsQuery.isError : currentOrganizationQuery.isError);

  async function handleSubmit(values: Parameters<typeof buildCreateRequest>[0]) {
    setSubmitErrorMessage(undefined);

    try {
      const process = await createProcess.mutateAsync({
        data: buildCreateRequest(values, isAdmin),
      });

      toast.success("Processo criado com sucesso.");
      navigate(`/app/processo/${process.id}`);
    } catch (error) {
      setSubmitErrorMessage(getApiErrorMessage(error, "Não foi possível criar o processo."));
    }
  }

  return (
    <ProcessFormWizard
      pageTitle="Novo Processo"
      pageDescription="Cadastre os dados do processo e revise as informações antes de gerar os documentos."
      submitLabel="Criar Processo"
      submitPendingLabel="Criando..."
      submitErrorTitle="Não foi possível criar o processo"
      submitErrorMessage={submitErrorMessage}
      isSubmitting={createProcess.isPending}
      isReferencesError={hasReferenceError}
      departments={departments}
      organizations={productionOrganizations}
      showOrganizationSelect={isAdmin}
      forcedOrganizationId={isAdmin ? undefined : actorOrganizationId}
      defaultOrganizationId={isAdmin ? productionOrganizations[0]?.id : undefined}
      onSubmit={handleSubmit}
    />
  );
}

import { AlertCircle, RefreshCw } from "lucide-react";
import { useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { toast } from "sonner";
import { useAuthSession } from "@/modules/auth";
import { Button } from "@/shared/ui/button";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/shared/ui/empty";
import { Skeleton } from "@/shared/ui/skeleton";
import {
  useCurrentProcessOrganization,
  useProcessDepartmentsList,
  useProcessDetail,
  useProcessOrganizationsList,
  useProcessUpdate,
} from "../api/processes";
import {
  buildUpdateRequest,
  getApiErrorMessage,
  mapProcessDetailToFormValues,
  ProcessFormWizard,
} from "../ui/process-form-wizard";

function ProcessEditLoadingState() {
  return (
    <main className="flex-1 overflow-auto bg-background">
      <div className="mx-auto max-w-7xl px-4 py-6 md:py-8">
        <div className="space-y-3">
          <Skeleton className="h-9 w-56 max-w-full" />
          <Skeleton className="h-5 w-[32rem] max-w-full" />
        </div>
        <div className="mt-8 grid gap-6 lg:grid-cols-[1fr_300px]">
          <Skeleton className="h-[48rem] w-full" />
          <Skeleton className="hidden h-80 w-full lg:block" />
        </div>
      </div>
    </main>
  );
}

function ProcessEditFailureState({
  title,
  description,
  canRetry,
  onRetry,
}: {
  title: string;
  description: string;
  canRetry: boolean;
  onRetry?: () => void;
}) {
  return (
    <main className="flex-1 overflow-auto p-6">
      <div className="mx-auto max-w-5xl">
        <Empty className="py-16">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <AlertCircle className="h-6 w-6" />
            </EmptyMedia>
            <EmptyTitle>{title}</EmptyTitle>
            <EmptyDescription>{description}</EmptyDescription>
          </EmptyHeader>
          <EmptyContent className="flex-row justify-center">
            {canRetry ? (
              <Button type="button" onClick={onRetry}>
                <RefreshCw className="mr-2 h-4 w-4" />
                Tentar novamente
              </Button>
            ) : null}
            <Button asChild variant="outline">
              <Link to="/app/processos">Voltar para Processos</Link>
            </Button>
          </EmptyContent>
        </Empty>
      </div>
    </main>
  );
}

export function ProcessEditPage() {
  const navigate = useNavigate();
  const { processId = "" } = useParams();
  const { organizationId: actorOrganizationId, role } = useAuthSession();
  const isAdmin = role === "admin";
  const processQuery = useProcessDetail(processId);
  const updateProcess = useProcessUpdate(processId);
  const departmentsQuery = useProcessDepartmentsList();
  const organizationsQuery = useProcessOrganizationsList(isAdmin);
  const currentOrganizationQuery = useCurrentProcessOrganization(!isAdmin && Boolean(actorOrganizationId));
  const [submitErrorMessage, setSubmitErrorMessage] = useState<string>();
  const process = processQuery.data;
  const departments = departmentsQuery.data?.items ?? [];
  const organizations = organizationsQuery.data?.items ?? [];
  const resolvedOrganizations = useMemo(() => {
    if (!process) {
      return [];
    }

    if (isAdmin) {
      return organizations.filter((organization) => organization.id === process.organizationId);
    }

    const currentOrganization = currentOrganizationQuery.data;

    return currentOrganization ? [currentOrganization] : [];
  }, [currentOrganizationQuery.data, isAdmin, organizations, process]);
  const hasReferenceError =
    Boolean(process) &&
    (departmentsQuery.isError || (isAdmin ? organizationsQuery.isError : currentOrganizationQuery.isError));

  if (!processId) {
    return (
      <ProcessEditFailureState
        title="Processo não encontrado"
        description="O identificador do processo não foi informado nesta rota."
        canRetry={false}
      />
    );
  }

  if (processQuery.isLoading) {
    return <ProcessEditLoadingState />;
  }

  if (processQuery.isError) {
    const errorStatus = processQuery.error?.status;

    if (errorStatus === 403 || errorStatus === 404) {
      return (
        <ProcessEditFailureState
          title="Processo não encontrado"
          description="Não foi possível localizar este processo na área visível da sua sessão."
          canRetry={false}
        />
      );
    }

    return (
      <ProcessEditFailureState
        title="Não foi possível carregar o processo"
        description={getApiErrorMessage(processQuery.error, "Falha ao carregar o processo.")}
        canRetry
        onRetry={() => void processQuery.refetch()}
      />
    );
  }

  if (!process) {
    return (
      <ProcessEditFailureState
        title="Processo não encontrado"
        description="Não foi possível localizar este processo na resposta da API."
        canRetry={false}
      />
    );
  }

  const loadedProcess = process;

  async function handleSubmit(values: ReturnType<typeof mapProcessDetailToFormValues>) {
    setSubmitErrorMessage(undefined);

    try {
      await updateProcess.mutateAsync({
        data: buildUpdateRequest(values),
      });

      toast.success("Processo atualizado com sucesso.");
      navigate(`/app/processo/${loadedProcess.id}`);
    } catch (error) {
      setSubmitErrorMessage(
        getApiErrorMessage(error, "Não foi possível atualizar o processo."),
      );
    }
  }

  return (
    <ProcessFormWizard
      pageTitle="Editar Processo"
      pageDescription="Atualize os dados do processo e revise as informações antes de salvar."
      submitLabel="Salvar alterações"
      submitPendingLabel="Salvando..."
      submitErrorTitle="Não foi possível atualizar o processo"
      submitErrorMessage={submitErrorMessage}
      isSubmitting={updateProcess.isPending}
      isReferencesError={hasReferenceError}
      departments={departments}
      organizations={resolvedOrganizations}
      showOrganizationSelect={false}
      forcedOrganizationId={loadedProcess.organizationId}
      initialValues={mapProcessDetailToFormValues(loadedProcess)}
      resetKey={loadedProcess.detailUpdatedAt}
      onSubmit={handleSubmit}
    />
  );
}

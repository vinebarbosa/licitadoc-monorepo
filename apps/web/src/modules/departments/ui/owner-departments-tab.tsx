import { Building2, Plus, RefreshCw } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Badge } from "@/shared/ui/badge";
import { Button } from "@/shared/ui/button";
import { Card } from "@/shared/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/shared/ui/dialog";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/shared/ui/empty";
import { Input } from "@/shared/ui/input";
import { Label } from "@/shared/ui/label";
import { Skeleton } from "@/shared/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/shared/ui/table";
import { useOwnerDepartmentCreate, useOwnerDepartmentsList } from "../api/owner-departments";
import {
  createDepartmentSlug,
  getDefaultOwnerDepartmentCreateFormValues,
  getDepartmentBudgetUnitLabel,
  getOwnerDepartmentErrorMessage,
  isOwnerDepartmentCreateFormSubmittable,
  isOwnerDepartmentCreateSuccessResponse,
  isOwnerDepartmentsListSuccessResponse,
  type OwnerDepartmentCreateFormValues,
  toOwnerDepartmentCreatePayload,
} from "../model/owner-departments";

function DepartmentsTableSkeleton() {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Departamento</TableHead>
          <TableHead>Unidade</TableHead>
          <TableHead>Responsável</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {["one", "two", "three"].map((rowKey) => (
          <TableRow key={rowKey}>
            <TableCell>
              <div className="space-y-1">
                <Skeleton className="h-4 w-48" />
                <Skeleton className="h-3 w-32" />
              </div>
            </TableCell>
            <TableCell>
              <Skeleton className="h-6 w-20" />
            </TableCell>
            <TableCell>
              <div className="space-y-1">
                <Skeleton className="h-4 w-36" />
                <Skeleton className="h-3 w-28" />
              </div>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

type CreateDepartmentDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  values: OwnerDepartmentCreateFormValues;
  onNameChange: (name: string) => void;
  onSlugChange: (slug: string) => void;
  onChange: (values: OwnerDepartmentCreateFormValues) => void;
  onSubmit: () => void;
  isSubmitting: boolean;
};

function CreateDepartmentDialog({
  open,
  onOpenChange,
  values,
  onNameChange,
  onSlugChange,
  onChange,
  onSubmit,
  isSubmitting,
}: CreateDepartmentDialogProps) {
  const canSubmit = isOwnerDepartmentCreateFormSubmittable(values);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-125">
        <DialogHeader>
          <DialogTitle>Criar departamento</DialogTitle>
          <DialogDescription>
            Cadastre uma unidade da sua organização para uso nos processos e documentos.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="department-name">Nome</Label>
            <Input
              id="department-name"
              value={values.name}
              placeholder="Secretaria de Educação"
              onChange={(event) => onNameChange(event.target.value)}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="department-slug">Identificador</Label>
            <Input
              id="department-slug"
              value={values.slug}
              placeholder="secretaria-de-educacao"
              onChange={(event) => onSlugChange(event.target.value)}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="department-budget-unit-code">Unidade orçamentária</Label>
            <Input
              id="department-budget-unit-code"
              value={values.budgetUnitCode}
              placeholder="06.001"
              onChange={(event) => onChange({ ...values, budgetUnitCode: event.target.value })}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="department-responsible-name">Responsável</Label>
            <Input
              id="department-responsible-name"
              value={values.responsibleName}
              placeholder="Maria Costa"
              onChange={(event) => onChange({ ...values, responsibleName: event.target.value })}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="department-responsible-role">Cargo do responsável</Label>
            <Input
              id="department-responsible-role"
              value={values.responsibleRole}
              placeholder="Secretária"
              onChange={(event) => onChange({ ...values, responsibleRole: event.target.value })}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={onSubmit} disabled={isSubmitting || !canSubmit}>
            {isSubmitting ? "Criando..." : "Criar departamento"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function OwnerDepartmentsTab() {
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [slugWasEdited, setSlugWasEdited] = useState(false);
  const [createForm, setCreateForm] = useState<OwnerDepartmentCreateFormValues>(
    getDefaultOwnerDepartmentCreateFormValues(),
  );

  const departmentsQuery = useOwnerDepartmentsList();
  const createDepartment = useOwnerDepartmentCreate();
  const departmentsData = departmentsQuery.data;
  const hasDepartmentsResponse = isOwnerDepartmentsListSuccessResponse(departmentsData);
  const departments = hasDepartmentsResponse ? departmentsData.items : [];
  const hasListError =
    departmentsQuery.isError || (departmentsQuery.isSuccess && !hasDepartmentsResponse);

  function resetCreateForm() {
    setCreateForm(getDefaultOwnerDepartmentCreateFormValues());
    setSlugWasEdited(false);
  }

  function handleDialogOpenChange(open: boolean) {
    setCreateDialogOpen(open);

    if (!open) {
      resetCreateForm();
    }
  }

  function handleNameChange(name: string) {
    setCreateForm((current) => ({
      ...current,
      name,
      slug: slugWasEdited ? current.slug : createDepartmentSlug(name),
    }));
  }

  function handleSlugChange(slug: string) {
    setSlugWasEdited(true);
    setCreateForm((current) => ({
      ...current,
      slug: createDepartmentSlug(slug),
    }));
  }

  async function handleCreateSubmit() {
    try {
      const response = await createDepartment.mutateAsync({
        data: toOwnerDepartmentCreatePayload(createForm),
      });

      if (!isOwnerDepartmentCreateSuccessResponse(response)) {
        toast.error(getOwnerDepartmentErrorMessage(response));
        return;
      }

      toast.success(`Departamento ${response.name} criado com sucesso.`);
      setCreateDialogOpen(false);
      resetCreateForm();
    } catch (error) {
      toast.error(getOwnerDepartmentErrorMessage(error));
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-lg font-medium">Departamentos</h2>
          <p className="text-muted-foreground text-sm">
            Cadastre as unidades que participam dos processos da organização.
          </p>
        </div>
        <Button onClick={() => setCreateDialogOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Criar departamento
        </Button>
      </div>

      <Card>
        {departmentsQuery.isLoading ? (
          <DepartmentsTableSkeleton />
        ) : hasListError ? (
          <Empty className="py-12">
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <Building2 className="h-6 w-6" />
              </EmptyMedia>
              <EmptyTitle>Erro ao carregar departamentos</EmptyTitle>
              <EmptyDescription>Tente recarregar a listagem.</EmptyDescription>
            </EmptyHeader>
            <EmptyContent>
              <Button variant="outline" onClick={() => void departmentsQuery.refetch()}>
                <RefreshCw className="mr-2 h-4 w-4" />
                Tentar novamente
              </Button>
            </EmptyContent>
          </Empty>
        ) : departments.length === 0 ? (
          <Empty className="py-12">
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <Building2 className="h-6 w-6" />
              </EmptyMedia>
              <EmptyTitle>Nenhum departamento cadastrado</EmptyTitle>
              <EmptyDescription>
                Crie o primeiro departamento para usar nos processos e documentos.
              </EmptyDescription>
            </EmptyHeader>
            <EmptyContent>
              <Button onClick={() => setCreateDialogOpen(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Criar departamento
              </Button>
            </EmptyContent>
          </Empty>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Departamento</TableHead>
                <TableHead>Unidade</TableHead>
                <TableHead>Responsável</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {departments.map((department) => (
                <TableRow key={department.id}>
                  <TableCell>
                    <div className="flex flex-col">
                      <span className="font-medium">{department.name}</span>
                      <span className="text-muted-foreground text-sm">{department.slug}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">{getDepartmentBudgetUnitLabel(department)}</Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col">
                      <span>{department.responsibleName}</span>
                      <span className="text-muted-foreground text-sm">
                        {department.responsibleRole}
                      </span>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </Card>

      <CreateDepartmentDialog
        open={createDialogOpen}
        onOpenChange={handleDialogOpenChange}
        values={createForm}
        onNameChange={handleNameChange}
        onSlugChange={handleSlugChange}
        onChange={setCreateForm}
        onSubmit={handleCreateSubmit}
        isSubmitting={createDepartment.isPending}
      />
    </div>
  );
}

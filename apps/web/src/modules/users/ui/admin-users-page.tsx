import {
  MoreHorizontal,
  Pencil,
  Plus,
  Search,
  Trash2,
  UserRound,
  UserRoundCheck,
  Users,
} from "lucide-react";
import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { toast } from "sonner";
import { cn } from "@/shared/lib/utils";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/shared/ui/alert-dialog";
import { Avatar, AvatarFallback } from "@/shared/ui/avatar";
import { Badge } from "@/shared/ui/badge";
import { Button } from "@/shared/ui/button";
import { Card, CardContent } from "@/shared/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/shared/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/shared/ui/dropdown-menu";
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
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/shared/ui/pagination";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/shared/ui/select";
import { Skeleton } from "@/shared/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/shared/ui/table";
import {
  useAdminOrganizationsList,
  useAdminUserDelete,
  useAdminUsersList,
  useAdminUserUpdate,
  useCreateOrganizationOwnerInvite,
} from "../api/admin-users";
import {
  type AdminUserFormValues,
  type AdminUsersFilters,
  type AdminUsersListItem,
  type CreateInviteFormValues,
  formatCreatedAt,
  getDefaultAdminUsersFilters,
  getFilterSearchParams,
  getInitials,
  getOrganizationName,
  getUserStats,
  getUsersQueryParams,
  roleConfig,
  roleOptions,
  statsCardConfig,
  toAdminUserFormValues,
  toInvitePayload,
  toUpdateUserPayload,
} from "../model/admin-users";

function TableSkeleton() {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Nome</TableHead>
          <TableHead>Organização</TableHead>
          <TableHead>Papel</TableHead>
          <TableHead>Data de Criação</TableHead>
          <TableHead className="w-12.5" />
        </TableRow>
      </TableHeader>
      <TableBody>
        {["one", "two", "three", "four", "five"].map((rowKey) => (
          <TableRow key={rowKey}>
            <TableCell>
              <div className="flex items-center gap-3">
                <Skeleton className="h-10 w-10 rounded-full" />
                <div className="space-y-1">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-3 w-40" />
                </div>
              </div>
            </TableCell>
            <TableCell>
              <Skeleton className="h-6 w-40" />
            </TableCell>
            <TableCell>
              <Skeleton className="h-6 w-24" />
            </TableCell>
            <TableCell>
              <Skeleton className="h-4 w-24" />
            </TableCell>
            <TableCell>
              <Skeleton className="h-8 w-8" />
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

type InviteDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  values: CreateInviteFormValues;
  onChange: (values: CreateInviteFormValues) => void;
  organizationOptions: Array<{ id: string; name: string }>;
  onSubmit: () => void;
  isSubmitting: boolean;
};

function InviteDialog({
  open,
  onOpenChange,
  values,
  onChange,
  organizationOptions,
  onSubmit,
  isSubmitting,
}: InviteDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-106.25">
        <DialogHeader>
          <DialogTitle>Criar Admin de Organização</DialogTitle>
          <DialogDescription>
            Convide um novo administrador para uma prefeitura usando o fluxo atual de convites.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="invite-email">E-mail</Label>
            <Input
              id="invite-email"
              type="email"
              value={values.email}
              placeholder="email@prefeitura.gov.br"
              onChange={(event) => onChange({ ...values, email: event.target.value })}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="invite-organization">Organização</Label>
            <Select
              value={values.organizationId}
              onValueChange={(organizationId) => onChange({ ...values, organizationId })}
            >
              <SelectTrigger id="invite-organization">
                <SelectValue placeholder="Selecione a prefeitura" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Sem organização</SelectItem>
                {organizationOptions.map((organization) => (
                  <SelectItem key={organization.id} value={organization.id}>
                    {organization.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={onSubmit} disabled={isSubmitting || values.email.trim().length === 0}>
            {isSubmitting ? "Criando..." : "Criar convite"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

type EditDialogProps = {
  user: AdminUsersListItem | null;
  values: AdminUserFormValues;
  onChange: (values: AdminUserFormValues) => void;
  organizationOptions: Array<{ id: string; name: string }>;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: () => void;
  isSubmitting: boolean;
};

function EditUserDialog({
  user,
  values,
  onChange,
  organizationOptions,
  open,
  onOpenChange,
  onSubmit,
  isSubmitting,
}: EditDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-106.25">
        <DialogHeader>
          <DialogTitle>Editar usuário</DialogTitle>
          <DialogDescription>
            Atualize os campos permitidos do usuário selecionado.
          </DialogDescription>
        </DialogHeader>
        {user ? (
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="edit-name">Nome completo</Label>
              <Input
                id="edit-name"
                value={values.name}
                onChange={(event) => onChange({ ...values, name: event.target.value })}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-role">Papel</Label>
              <Select
                value={values.role}
                onValueChange={(role) =>
                  onChange({ ...values, role: role as AdminUserFormValues["role"] })
                }
              >
                <SelectTrigger id="edit-role">
                  <SelectValue placeholder="Selecione o papel" />
                </SelectTrigger>
                <SelectContent>
                  {roleOptions.map((role) => (
                    <SelectItem key={role.value} value={role.value}>
                      {role.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-organization">Organização</Label>
              <Select
                value={values.organizationId}
                onValueChange={(organizationId) => onChange({ ...values, organizationId })}
              >
                <SelectTrigger id="edit-organization">
                  <SelectValue placeholder="Selecione a organização" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Sem organização</SelectItem>
                  {organizationOptions.map((organization) => (
                    <SelectItem key={organization.id} value={organization.id}>
                      {organization.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        ) : null}
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={onSubmit} disabled={isSubmitting || values.name.trim().length === 0}>
            {isSubmitting ? "Salvando..." : "Salvar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

type DetailsDialogProps = {
  user: AdminUsersListItem | null;
  organizationName: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

function UserDetailsDialog({ user, organizationName, open, onOpenChange }: DetailsDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-106.25">
        <DialogHeader>
          <DialogTitle>Detalhes do usuário</DialogTitle>
          <DialogDescription>
            Resumo dos dados visíveis para gerenciamento administrativo.
          </DialogDescription>
        </DialogHeader>
        {user ? (
          <div className="grid gap-3 py-4 text-sm">
            <div>
              <p className="text-muted-foreground">Nome</p>
              <p className="font-medium">{user.name}</p>
            </div>
            <div>
              <p className="text-muted-foreground">E-mail</p>
              <p className="font-medium">{user.email}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Papel</p>
              <p className="font-medium">{roleConfig[user.role].label}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Organização</p>
              <p className="font-medium">{organizationName}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Criado em</p>
              <p className="font-medium">{formatCreatedAt(user.createdAt)}</p>
            </div>
          </div>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}

type DeleteDialogProps = {
  user: AdminUsersListItem | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
  isSubmitting: boolean;
};

function DeleteUserDialog({
  user,
  open,
  onOpenChange,
  onConfirm,
  isSubmitting,
}: DeleteDialogProps) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Remover usuário</AlertDialogTitle>
          <AlertDialogDescription>
            {user
              ? `Esta ação removerá ${user.name} do sistema.`
              : "Esta ação removerá o usuário do sistema."}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancelar</AlertDialogCancel>
          <AlertDialogAction onClick={onConfirm} disabled={isSubmitting}>
            {isSubmitting ? "Removendo..." : "Remover usuário"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

export function AdminUsersPageContent() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [filters, setFilters] = useState<AdminUsersFilters>(() =>
    getDefaultAdminUsersFilters(searchParams),
  );
  const [inviteDialogOpen, setInviteDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<AdminUsersListItem | null>(null);
  const [inviteForm, setInviteForm] = useState<CreateInviteFormValues>({
    email: "",
    organizationId: "none",
  });
  const [editForm, setEditForm] = useState<AdminUserFormValues>({
    name: "",
    role: "member",
    organizationId: "none",
  });

  useEffect(() => {
    setFilters(getDefaultAdminUsersFilters(searchParams));
  }, [searchParams]);

  const usersQuery = useAdminUsersList(getUsersQueryParams(filters));
  const organizationsQuery = useAdminOrganizationsList();
  const createInvite = useCreateOrganizationOwnerInvite();
  const updateUser = useAdminUserUpdate();
  const deleteUser = useAdminUserDelete();

  const users = usersQuery.data?.items ?? [];
  const organizations = organizationsQuery.data?.items ?? [];
  const stats = getUserStats(users);
  const total = usersQuery.data?.total ?? users.length;
  const totalPages = usersQuery.data?.totalPages ?? 1;
  const organizationOptions = organizations.map((organization) => ({
    id: organization.id,
    name: organization.name,
  }));

  function updateRoute(nextFilters: AdminUsersFilters) {
    setSearchParams(getFilterSearchParams(nextFilters), { replace: true });
  }

  function handleFilterChange(nextFilters: Partial<AdminUsersFilters>) {
    updateRoute({ ...filters, ...nextFilters, page: nextFilters.page ?? 1 });
  }

  function openDetails(user: AdminUsersListItem) {
    setSelectedUser(user);
    setDetailsDialogOpen(true);
  }

  function openEdit(user: AdminUsersListItem) {
    setSelectedUser(user);
    setEditForm(toAdminUserFormValues(user));
    setEditDialogOpen(true);
  }

  function openDelete(user: AdminUsersListItem) {
    setSelectedUser(user);
    setDeleteDialogOpen(true);
  }

  async function handleInviteSubmit() {
    try {
      const response = await createInvite.mutateAsync({ data: toInvitePayload(inviteForm) });
      toast.success(`Convite criado para ${response.email}.`);
      setInviteDialogOpen(false);
      setInviteForm({ email: "", organizationId: "none" });
    } catch {
      toast.error("Não foi possível criar o convite.");
    }
  }

  async function handleEditSubmit() {
    if (!selectedUser) {
      return;
    }

    try {
      await updateUser.mutateAsync({
        userId: selectedUser.id,
        data: toUpdateUserPayload(editForm),
      });
      toast.success("Usuário atualizado com sucesso.");
      setEditDialogOpen(false);
      setSelectedUser(null);
    } catch {
      toast.error("Não foi possível atualizar o usuário.");
    }
  }

  async function handleDeleteConfirm() {
    if (!selectedUser) {
      return;
    }

    try {
      await deleteUser.mutateAsync({ userId: selectedUser.id });
      toast.success("Usuário removido com sucesso.");
      setDeleteDialogOpen(false);
      setSelectedUser(null);
    } catch {
      toast.error("Não foi possível remover o usuário.");
    }
  }

  const selectedUserOrganizationName = selectedUser
    ? getOrganizationName(selectedUser, organizations)
    : "";

  return (
    <main className="flex-1 overflow-auto p-6">
      <div className="mx-auto max-w-7xl space-y-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">Usuários do Sistema</h1>
            <p className="text-muted-foreground">
              Gerencie todos os usuários cadastrados nas prefeituras
            </p>
          </div>
          <Button onClick={() => setInviteDialogOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Criar Admin de Organização
          </Button>
        </div>

        <div className="grid gap-4 md:grid-cols-4">
          {statsCardConfig.map((card) => {
            const Icon = card.icon;
            const totalForCard = card.key === "total" ? total : stats[card.key];

            return (
              <Card key={card.key}>
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className={cn("rounded-lg p-2", card.iconClassName)}>
                      <Icon className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold">{totalForCard}</p>
                      <p className="text-xs text-muted-foreground">{card.label}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        <div className="flex flex-col gap-4 md:flex-row md:items-center">
          <div className="relative max-w-sm flex-1">
            <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              aria-label="Buscar usuarios"
              placeholder="Buscar por nome ou email..."
              className="pl-9"
              value={filters.search}
              onChange={(event) => handleFilterChange({ search: event.target.value })}
            />
          </div>
          <div className="flex gap-2">
            <Select
              value={filters.role}
              onValueChange={(role) =>
                handleFilterChange({ role: role as AdminUsersFilters["role"] })
              }
            >
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Papel" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os papéis</SelectItem>
                {roleOptions.map((role) => (
                  <SelectItem key={role.value} value={role.value}>
                    {role.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select
              value={filters.organizationId}
              onValueChange={(organizationId) => handleFilterChange({ organizationId })}
            >
              <SelectTrigger className="w-60">
                <SelectValue placeholder="Organização" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas as organizações</SelectItem>
                {organizationOptions.map((organization) => (
                  <SelectItem key={organization.id} value={organization.id}>
                    {organization.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <Card>
          {usersQuery.isLoading || organizationsQuery.isLoading ? (
            <TableSkeleton />
          ) : users.length === 0 ? (
            <Empty className="py-12">
              <EmptyHeader>
                <EmptyMedia variant="icon">
                  <Users className="h-6 w-6" />
                </EmptyMedia>
                <EmptyTitle>Nenhum usuário encontrado</EmptyTitle>
                <EmptyDescription>
                  Tente ajustar os filtros ou criar um novo usuário.
                </EmptyDescription>
              </EmptyHeader>
              <EmptyContent>
                <Button onClick={() => setInviteDialogOpen(true)}>
                  <Plus className="mr-2 h-4 w-4" />
                  Criar Admin de Organização
                </Button>
              </EmptyContent>
            </Empty>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>Organização</TableHead>
                  <TableHead>Papel</TableHead>
                  <TableHead>Data de Criação</TableHead>
                  <TableHead className="w-12.5" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.map((user) => {
                  const RoleIcon = roleConfig[user.role].icon;

                  return (
                    <TableRow
                      key={user.id}
                      className="cursor-pointer transition-colors hover:bg-accent/50"
                    >
                      <TableCell>
                        <button
                          type="button"
                          className="flex items-center gap-3 text-left"
                          onClick={() => openDetails(user)}
                        >
                          <Avatar className="h-10 w-10">
                            <AvatarFallback className="bg-primary/10 font-medium text-primary">
                              {getInitials(user.name)}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex flex-col">
                            <span className="font-medium">{user.name}</span>
                            <span className="text-sm text-muted-foreground">{user.email}</span>
                          </div>
                        </button>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2 text-sm">
                          <UserRoundCheck className="h-4 w-4 text-muted-foreground" />
                          <span>{getOrganizationName(user, organizations)}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className={cn("font-medium", roleConfig[user.role].className)}
                        >
                          <RoleIcon className="mr-1 h-3 w-3" />
                          {roleConfig[user.role].label}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {formatCreatedAt(user.createdAt)}
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => openDetails(user)}>
                              <UserRound className="mr-2 h-4 w-4" />
                              Ver detalhes
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => openEdit(user)}>
                              <Pencil className="mr-2 h-4 w-4" />
                              Editar usuário
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              className="text-critical"
                              onClick={() => openDelete(user)}
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              Remover usuário
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </Card>

        {!usersQuery.isLoading && users.length > 0 ? (
          <div className="flex flex-col gap-4 text-sm text-muted-foreground md:flex-row md:items-center md:justify-between">
            <p>
              Mostrando {users.length} de {total} usuários
            </p>
            <Pagination className="mx-0 w-auto justify-start md:justify-end">
              <PaginationContent>
                <PaginationItem>
                  <PaginationPrevious
                    href="#"
                    onClick={(event) => {
                      event.preventDefault();

                      if (filters.page > 1) {
                        updateRoute({ ...filters, page: filters.page - 1 });
                      }
                    }}
                    aria-disabled={filters.page <= 1}
                    className={cn(filters.page <= 1 && "pointer-events-none opacity-50")}
                  />
                </PaginationItem>
                {Array.from({ length: totalPages }).map((_, index) => {
                  const page = index + 1;

                  return (
                    <PaginationItem key={page}>
                      <PaginationLink
                        href="#"
                        isActive={page === filters.page}
                        onClick={(event) => {
                          event.preventDefault();
                          updateRoute({ ...filters, page });
                        }}
                      >
                        {page}
                      </PaginationLink>
                    </PaginationItem>
                  );
                })}
                <PaginationItem>
                  <PaginationNext
                    href="#"
                    onClick={(event) => {
                      event.preventDefault();

                      if (filters.page < totalPages) {
                        updateRoute({ ...filters, page: filters.page + 1 });
                      }
                    }}
                    aria-disabled={filters.page >= totalPages}
                    className={cn(filters.page >= totalPages && "pointer-events-none opacity-50")}
                  />
                </PaginationItem>
              </PaginationContent>
            </Pagination>
          </div>
        ) : null}

        <InviteDialog
          open={inviteDialogOpen}
          onOpenChange={setInviteDialogOpen}
          values={inviteForm}
          onChange={setInviteForm}
          organizationOptions={organizationOptions}
          onSubmit={handleInviteSubmit}
          isSubmitting={createInvite.isPending}
        />

        <EditUserDialog
          user={selectedUser}
          values={editForm}
          onChange={setEditForm}
          organizationOptions={organizationOptions}
          open={editDialogOpen}
          onOpenChange={setEditDialogOpen}
          onSubmit={handleEditSubmit}
          isSubmitting={updateUser.isPending}
        />

        <UserDetailsDialog
          user={selectedUser}
          organizationName={selectedUserOrganizationName}
          open={detailsDialogOpen}
          onOpenChange={setDetailsDialogOpen}
        />

        <DeleteUserDialog
          user={selectedUser}
          open={deleteDialogOpen}
          onOpenChange={setDeleteDialogOpen}
          onConfirm={handleDeleteConfirm}
          isSubmitting={deleteUser.isPending}
        />
      </div>
    </main>
  );
}

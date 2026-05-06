import { MoreHorizontal, Pencil, Plus, Trash2, Users } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { OwnerDepartmentsTab } from "@/modules/departments";
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
import { Skeleton } from "@/shared/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/shared/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/shared/ui/tabs";
import {
  useOwnerCreateMemberInvite,
  useOwnerMemberDelete,
  useOwnerMembersList,
  useOwnerMemberUpdate,
} from "../api/owner-members";
import {
  formatDate,
  getInitials,
  memberRoleConfig,
  type OwnerInviteItem,
  type OwnerMemberEditFormValues,
  type OwnerMemberInviteFormValues,
  type OwnerMembersListItem,
  toInvitePayload,
  toMemberUpdatePayload,
} from "../model/owner-members";

function TableSkeleton() {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Nome</TableHead>
          <TableHead>Papel</TableHead>
          <TableHead>Membro desde</TableHead>
          <TableHead className="w-12.5" />
        </TableRow>
      </TableHeader>
      <TableBody>
        {["one", "two", "three"].map((rowKey) => (
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
              <Skeleton className="h-6 w-20" />
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

type InviteMemberDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  values: OwnerMemberInviteFormValues;
  onChange: (values: OwnerMemberInviteFormValues) => void;
  onSubmit: () => void;
  isSubmitting: boolean;
};

function InviteMemberDialog({
  open,
  onOpenChange,
  values,
  onChange,
  onSubmit,
  isSubmitting,
}: InviteMemberDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-106.25">
        <DialogHeader>
          <DialogTitle>Convidar membro</DialogTitle>
          <DialogDescription>
            Envie um convite de acesso para um novo usuário da sua organização.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="invite-email">E-mail</Label>
            <Input
              id="invite-email"
              type="email"
              value={values.email}
              placeholder="usuario@prefeitura.gov.br"
              onChange={(event) => onChange({ ...values, email: event.target.value })}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={onSubmit} disabled={isSubmitting || values.email.trim().length === 0}>
            {isSubmitting ? "Enviando..." : "Enviar convite"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

type EditMemberDialogProps = {
  member: OwnerMembersListItem | null;
  values: OwnerMemberEditFormValues;
  onChange: (values: OwnerMemberEditFormValues) => void;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: () => void;
  isSubmitting: boolean;
};

function EditMemberDialog({
  member,
  values,
  onChange,
  open,
  onOpenChange,
  onSubmit,
  isSubmitting,
}: EditMemberDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-106.25">
        <DialogHeader>
          <DialogTitle>Editar membro</DialogTitle>
          <DialogDescription>Atualize o nome do membro selecionado.</DialogDescription>
        </DialogHeader>
        {member ? (
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="edit-name">Nome completo</Label>
              <Input
                id="edit-name"
                value={values.name}
                onChange={(event) => onChange({ ...values, name: event.target.value })}
              />
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

type DeleteMemberDialogProps = {
  member: OwnerMembersListItem | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
  isSubmitting: boolean;
};

function DeleteMemberDialog({
  member,
  open,
  onOpenChange,
  onConfirm,
  isSubmitting,
}: DeleteMemberDialogProps) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Remover membro</AlertDialogTitle>
          <AlertDialogDescription>
            {member
              ? `Esta ação removerá ${member.name} da organização.`
              : "Esta ação removerá o membro da organização."}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancelar</AlertDialogCancel>
          <AlertDialogAction onClick={onConfirm} disabled={isSubmitting}>
            {isSubmitting ? "Removendo..." : "Remover membro"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

function isInviteSuccessResponse(response: unknown): response is OwnerInviteItem {
  if (!response || typeof response !== "object") {
    return false;
  }

  const candidate = response as Partial<OwnerInviteItem>;

  return typeof candidate.id === "string" && typeof candidate.email === "string";
}

function getInviteErrorMessage(response: unknown) {
  if (response && typeof response === "object") {
    const message = (response as { message?: unknown }).message;

    if (typeof message === "string" && message.trim().length > 0) {
      return message;
    }
  }

  return "Não foi possível enviar o convite.";
}

export function OwnerMembersPageContent() {
  const [inviteDialogOpen, setInviteDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedMember, setSelectedMember] = useState<OwnerMembersListItem | null>(null);
  const [inviteForm, setInviteForm] = useState<OwnerMemberInviteFormValues>({ email: "" });
  const [editForm, setEditForm] = useState<OwnerMemberEditFormValues>({ name: "" });

  const membersQuery = useOwnerMembersList();
  const createInvite = useOwnerCreateMemberInvite();
  const updateMember = useOwnerMemberUpdate();
  const deleteMember = useOwnerMemberDelete();

  const members = membersQuery.data?.items ?? [];

  function openEdit(member: OwnerMembersListItem) {
    setSelectedMember(member);
    setEditForm({ name: member.name });
    setEditDialogOpen(true);
  }

  function openDelete(member: OwnerMembersListItem) {
    setSelectedMember(member);
    setDeleteDialogOpen(true);
  }

  async function handleInviteSubmit() {
    try {
      const response = await createInvite.mutateAsync({ data: toInvitePayload(inviteForm) });

      if (!isInviteSuccessResponse(response)) {
        toast.error(getInviteErrorMessage(response));
        return;
      }

      toast.success(`Convite enviado para ${response.email}.`);
      setInviteDialogOpen(false);
      setInviteForm({ email: "" });
    } catch (error) {
      toast.error(getInviteErrorMessage(error));
    }
  }

  async function handleEditSubmit() {
    if (!selectedMember) {
      return;
    }

    try {
      await updateMember.mutateAsync({
        userId: selectedMember.id,
        data: toMemberUpdatePayload(editForm),
      });
      toast.success("Membro atualizado com sucesso.");
      setEditDialogOpen(false);
      setSelectedMember(null);
    } catch {
      toast.error("Não foi possível atualizar o membro.");
    }
  }

  async function handleDeleteConfirm() {
    if (!selectedMember) {
      return;
    }

    try {
      await deleteMember.mutateAsync({ userId: selectedMember.id });
      toast.success("Membro removido com sucesso.");
      setDeleteDialogOpen(false);
      setSelectedMember(null);
    } catch {
      toast.error("Não foi possível remover o membro.");
    }
  }

  const RoleIcon = memberRoleConfig.icon;

  return (
    <main className="flex-1 overflow-auto p-6">
      <div className="mx-auto max-w-5xl space-y-6">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Administração da Organização</h1>
          <p className="text-muted-foreground">
            Gerencie os membros e departamentos da sua organização
          </p>
        </div>

        <Tabs defaultValue="members" className="space-y-4">
          <TabsList className="w-full justify-start sm:w-fit">
            <TabsTrigger value="members">Membros</TabsTrigger>
            <TabsTrigger value="departments">Departamentos</TabsTrigger>
          </TabsList>

          <TabsContent value="members" className="space-y-6">
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div>
                <h2 className="text-lg font-medium">Membros</h2>
                <p className="text-muted-foreground text-sm">
                  Gerencie o acesso dos usuários da sua organização.
                </p>
              </div>
              <Button onClick={() => setInviteDialogOpen(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Convidar membro
              </Button>
            </div>

            <Card>
              {membersQuery.isLoading ? (
                <TableSkeleton />
              ) : membersQuery.isError ? (
                <Empty className="py-12">
                  <EmptyHeader>
                    <EmptyMedia variant="icon">
                      <Users className="h-6 w-6" />
                    </EmptyMedia>
                    <EmptyTitle>Erro ao carregar membros</EmptyTitle>
                    <EmptyDescription>Tente recarregar a página.</EmptyDescription>
                  </EmptyHeader>
                </Empty>
              ) : members.length === 0 ? (
                <Empty className="py-12">
                  <EmptyHeader>
                    <EmptyMedia variant="icon">
                      <Users className="h-6 w-6" />
                    </EmptyMedia>
                    <EmptyTitle>Nenhum membro encontrado</EmptyTitle>
                    <EmptyDescription>
                      Convide membros para dar acesso à sua organização.
                    </EmptyDescription>
                  </EmptyHeader>
                  <EmptyContent>
                    <Button onClick={() => setInviteDialogOpen(true)}>
                      <Plus className="mr-2 h-4 w-4" />
                      Convidar membro
                    </Button>
                  </EmptyContent>
                </Empty>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nome</TableHead>
                      <TableHead>Papel</TableHead>
                      <TableHead>Membro desde</TableHead>
                      <TableHead className="w-12.5" />
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {members.map((member) => (
                      <TableRow
                        key={member.id}
                        className="cursor-pointer transition-colors hover:bg-accent/50"
                      >
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <Avatar className="h-10 w-10">
                              <AvatarFallback className="bg-primary/10 font-medium text-primary">
                                {getInitials(member.name)}
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex flex-col">
                              <span className="font-medium">{member.name}</span>
                              <span className="text-sm text-muted-foreground">{member.email}</span>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant="outline"
                            className={cn("font-medium", memberRoleConfig.className)}
                          >
                            <RoleIcon className="mr-1 h-3 w-3" />
                            {memberRoleConfig.label}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {formatDate(member.createdAt)}
                        </TableCell>
                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => openEdit(member)}>
                                <Pencil className="mr-2 h-4 w-4" />
                                Editar membro
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                className="text-critical"
                                onClick={() => openDelete(member)}
                              >
                                <Trash2 className="mr-2 h-4 w-4" />
                                Remover membro
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </Card>

          </TabsContent>

          <TabsContent value="departments" className="space-y-6">
            <OwnerDepartmentsTab />
          </TabsContent>
        </Tabs>

        <InviteMemberDialog
          open={inviteDialogOpen}
          onOpenChange={setInviteDialogOpen}
          values={inviteForm}
          onChange={setInviteForm}
          onSubmit={handleInviteSubmit}
          isSubmitting={createInvite.isPending}
        />

        <EditMemberDialog
          member={selectedMember}
          values={editForm}
          onChange={setEditForm}
          open={editDialogOpen}
          onOpenChange={setEditDialogOpen}
          onSubmit={handleEditSubmit}
          isSubmitting={updateMember.isPending}
        />

        <DeleteMemberDialog
          member={selectedMember}
          open={deleteDialogOpen}
          onOpenChange={setDeleteDialogOpen}
          onConfirm={handleDeleteConfirm}
          isSubmitting={deleteMember.isPending}
        />
      </div>
    </main>
  );
}

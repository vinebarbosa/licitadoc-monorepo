import {
  Bell,
  ChevronDown,
  ClipboardList,
  FileSearch,
  FileText,
  FolderKanban,
  Headphones,
  HelpCircle,
  LayoutGrid,
  LogOut,
  Plus,
  Scale,
  ScrollText,
  Settings,
  Users,
} from "lucide-react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuthSession, useSignOut } from "@/modules/auth";
import { Avatar, AvatarFallback } from "@/shared/ui/avatar";
import { Badge } from "@/shared/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/shared/ui/dropdown-menu";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarSeparator,
  useSidebar,
} from "@/shared/ui/sidebar";

const mainNavItems = [
  { title: "Central de Trabalho", url: "/app", icon: LayoutGrid },
  { title: "Processos", url: "/app/processos", icon: FolderKanban, badge: "5" },
  { title: "Documentos", url: "/app/documentos", icon: FileText },
];

const documentTypes = [
  {
    title: "DFD",
    description: "Formalização de Demanda",
    url: "/app/documentos?tipo=dfd",
    icon: ClipboardList,
  },
  {
    title: "ETP",
    description: "Estudo Técnico Preliminar",
    url: "/app/documentos?tipo=etp",
    icon: FileSearch,
  },
  {
    title: "TR",
    description: "Termo de Referência",
    url: "/app/documentos?tipo=tr",
    icon: ScrollText,
  },
  {
    title: "Minuta",
    description: "Minuta do Contrato",
    url: "/app/documentos?tipo=minuta",
    icon: Scale,
  },
];

const adminNavItems = [
  { title: "Usuários", url: "/admin/usuarios", icon: Users },
  { title: "Chamados", url: "/admin/chamados", icon: Headphones },
];

const ownerNavItems = [{ title: "Membros", url: "/app/membros", icon: Users }];

const secondaryNavItems = [
  { title: "Configurações", url: "/app/configuracoes", icon: Settings },
  { title: "Ajuda", url: "/app/ajuda", icon: HelpCircle },
];

function getUserInitials(name?: string | null) {
  if (!name) {
    return "LD";
  }

  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();
}

export function AppSidebar() {
  const { pathname, search } = useLocation();
  const navigate = useNavigate();
  const { state } = useSidebar();
  const { role, session } = useAuthSession();
  const signOut = useSignOut();
  const isCollapsed = state === "collapsed";
  const user = session?.user;

  async function handleSignOut() {
    if (signOut.isPending) {
      return;
    }

    await signOut.mutateAsync({ data: {} });
    navigate("/entrar", { replace: true });
  }

  return (
    <Sidebar collapsible="icon" className="overflow-hidden border-sidebar-border border-r">
      <SidebarHeader className="border-sidebar-border border-b">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild>
              <Link to="/app">
                <div className="flex aspect-square size-8 shrink-0 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
                  <Scale className="size-4" />
                </div>
                <div className="grid min-w-0 flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-semibold">LicitaDoc</span>
                  <span className="truncate text-sidebar-foreground/60 text-xs">Lei 14.133</span>
                </div>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>

        <SidebarMenu className="mt-3">
          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              tooltip="Novo Processo"
              className="bg-sidebar-primary text-sidebar-primary-foreground hover:bg-sidebar-primary/90"
            >
              <Link to="/app/processo/novo">
                <Plus className="size-4" />
                <span>Novo Processo</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent className="overflow-x-hidden">
        <SidebarGroup>
          <SidebarGroupLabel>Menu</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {mainNavItems.map((item) => {
                const isActive =
                  pathname === item.url ||
                  (item.url !== "/app" && pathname.startsWith(item.url)) ||
                  (item.url === "/app/processos" && pathname.startsWith("/app/processo/"));

                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton asChild isActive={isActive} tooltip={item.title}>
                      <Link to={item.url}>
                        <item.icon className="size-4" />
                        <span className="flex-1">{item.title}</span>
                        {item.badge && !isCollapsed && (
                          <Badge variant="secondary" className="ml-auto h-5 min-w-5 px-1.5">
                            {item.badge}
                          </Badge>
                        )}
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarSeparator />

        <SidebarGroup>
          <SidebarGroupLabel>Tipos de Documento</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {documentTypes.map((item) => {
                const [itemPath, itemQuery] = item.url.split("?");
                const isActive = pathname === itemPath && search.includes(itemQuery ?? "");

                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton
                      asChild
                      isActive={isActive}
                      tooltip={`${item.title} - ${item.description}`}
                    >
                      <Link to={item.url}>
                        <item.icon className="size-4" />
                        <span>{item.title}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarSeparator />

        {role === "admin" && (
          <>
            <SidebarGroup>
              <SidebarGroupLabel>Administração</SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {adminNavItems.map((item) => (
                    <SidebarMenuItem key={item.title}>
                      <SidebarMenuButton
                        asChild
                        isActive={pathname === item.url || pathname.startsWith(item.url)}
                        tooltip={item.title}
                      >
                        <Link to={item.url}>
                          <item.icon className="size-4" />
                          <span>{item.title}</span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>

            <SidebarSeparator />
          </>
        )}

        {role === "organization_owner" && (
          <>
            <SidebarGroup>
              <SidebarGroupLabel>Gestão</SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {ownerNavItems.map((item) => (
                    <SidebarMenuItem key={item.title}>
                      <SidebarMenuButton
                        asChild
                        isActive={pathname === item.url || pathname.startsWith(item.url)}
                        tooltip={item.title}
                      >
                        <Link to={item.url}>
                          <item.icon className="size-4" />
                          <span>{item.title}</span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>

            <SidebarSeparator />
          </>
        )}

        <SidebarGroup>
          <SidebarGroupLabel>Sistema</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {secondaryNavItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild isActive={pathname === item.url} tooltip={item.title}>
                    <Link to={item.url}>
                      <item.icon className="size-4" />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="overflow-hidden border-sidebar-border border-t p-2">
        <SidebarMenu>
          <SidebarMenuItem>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <SidebarMenuButton size="lg">
                  <Avatar className="h-8 w-8 shrink-0 rounded-lg">
                    <AvatarFallback className="rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
                      {getUserInitials(user?.name)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="grid min-w-0 flex-1 text-left text-sm leading-tight">
                    <span className="truncate font-semibold">{user?.name ?? "Usuário"}</span>
                    <span className="truncate text-sidebar-foreground/60 text-xs">
                      Analista de Licitações
                    </span>
                  </div>
                  <ChevronDown className="ml-auto size-4" />
                </SidebarMenuButton>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                className="w-(--radix-dropdown-menu-trigger-width) min-w-56 rounded-lg"
                side="bottom"
                align="end"
                sideOffset={4}
              >
                <DropdownMenuItem>
                  <Bell className="mr-2 size-4" />
                  Notificações
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <Settings className="mr-2 size-4" />
                  Configurações da Conta
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  className="text-critical"
                  disabled={signOut.isPending}
                  onSelect={(event) => {
                    event.preventDefault();
                    void handleSignOut();
                  }}
                >
                  <LogOut className="mr-2 size-4" />
                  {signOut.isPending ? "Saindo..." : "Sair"}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}

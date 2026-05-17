import { createContext, useContext, useEffect, useRef, useState } from "react";
import { Outlet, useLocation, useMatches } from "react-router-dom";
import { useAuthSession } from "@/modules/auth";
import { ContextualHelpWidget } from "@/modules/help";
import { SidebarInset, SidebarProvider } from "@/shared/ui/sidebar";
import { AppHeader } from "../components/app-header";
import { AppSidebar } from "../components/app-sidebar";

type AppShellHeaderHandle = {
  breadcrumbs?: Array<{ label: string; href?: string }>;
  title?: string;
};

const AppShellHeaderContext = createContext<React.Dispatch<
  React.SetStateAction<AppShellHeaderHandle | undefined>
> | null>(null);

export function useAppShellHeader(header: AppShellHeaderHandle | undefined) {
  const setHeaderOverride = useContext(AppShellHeaderContext);

  useEffect(() => {
    if (!setHeaderOverride) {
      return undefined;
    }

    setHeaderOverride(header);

    return () => {
      setHeaderOverride((currentHeader) => (currentHeader === header ? undefined : currentHeader));
    };
  }, [header, setHeaderOverride]);
}

export function AppShellLayout() {
  const { role } = useAuthSession();
  const { pathname } = useLocation();
  const matches = useMatches();
  const routeHeaderHandle = [...matches]
    .reverse()
    .map((match) => match.handle as AppShellHeaderHandle | undefined)
    .find((handle) => handle?.breadcrumbs || handle?.title);
  const [headerOverride, setHeaderOverride] = useState<AppShellHeaderHandle | undefined>();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const previousSidebarOpenRef = useRef(true);
  const wasDocumentEditorWorkspaceRef = useRef(false);
  const headerHandle = headerOverride ?? routeHeaderHandle;
  const isDocumentEditorWorkspace = /^\/app\/documento\/[^/]+$/.test(pathname);
  const shouldShowContextualHelp = role !== "admin";

  useEffect(() => {
    if (isDocumentEditorWorkspace && !wasDocumentEditorWorkspaceRef.current) {
      previousSidebarOpenRef.current = sidebarOpen;
      setSidebarOpen(false);
    }

    if (!isDocumentEditorWorkspace && wasDocumentEditorWorkspaceRef.current) {
      setSidebarOpen(previousSidebarOpenRef.current);
    }

    wasDocumentEditorWorkspaceRef.current = isDocumentEditorWorkspace;
  }, [isDocumentEditorWorkspace, sidebarOpen]);

  return (
    <AppShellHeaderContext.Provider value={setHeaderOverride}>
      <SidebarProvider open={sidebarOpen} onOpenChange={setSidebarOpen}>
        <AppSidebar />
        <SidebarInset className={isDocumentEditorWorkspace ? "bg-[#f6f7f9]" : undefined}>
          {isDocumentEditorWorkspace ? null : (
            <AppHeader
              breadcrumbs={headerHandle?.breadcrumbs ?? [{ label: "Central de Trabalho" }]}
              title={headerHandle?.title}
            />
          )}
          <Outlet />
          {shouldShowContextualHelp ? <ContextualHelpWidget /> : null}
        </SidebarInset>
      </SidebarProvider>
    </AppShellHeaderContext.Provider>
  );
}

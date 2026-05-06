import { createContext, useContext, useEffect, useState } from "react";
import { Outlet, useMatches } from "react-router-dom";
import { MemberOnboardingModal } from "@/modules/onboarding";
import { SidebarInset, SidebarProvider } from "@/shared/ui/sidebar";
import { AppHeader } from "../components/app-header";
import { AppSidebar } from "../components/app-sidebar";

type AppShellHeaderHandle = {
  breadcrumbs?: Array<{ label: string; href?: string }>;
  title?: string;
  showSearch?: boolean;
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
  const matches = useMatches();
  const routeHeaderHandle = [...matches]
    .reverse()
    .map((match) => match.handle as AppShellHeaderHandle | undefined)
    .find((handle) => handle?.breadcrumbs || handle?.title || handle?.showSearch !== undefined);
  const [headerOverride, setHeaderOverride] = useState<AppShellHeaderHandle | undefined>();
  const headerHandle = headerOverride ?? routeHeaderHandle;

  return (
    <AppShellHeaderContext.Provider value={setHeaderOverride}>
      <SidebarProvider>
        <AppSidebar />
        <SidebarInset>
          <AppHeader
            breadcrumbs={headerHandle?.breadcrumbs ?? [{ label: "Central de Trabalho" }]}
            title={headerHandle?.title}
            showSearch={headerHandle?.showSearch ?? true}
          />
          <Outlet />
        </SidebarInset>
        <MemberOnboardingModal />
      </SidebarProvider>
    </AppShellHeaderContext.Provider>
  );
}

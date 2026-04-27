import { QueryClientProvider } from "@tanstack/react-query";
import type { ReactNode } from "react";
import { Toaster } from "@/shared/ui/sonner";
import { queryClient } from "./query-client";
import { ThemeProvider, useTheme } from "./theme";

type AppProvidersProps = {
  children: ReactNode;
};

function ThemedToaster() {
  const { theme } = useTheme();

  return <Toaster theme={theme} />;
}

export function AppProviders({ children }: AppProvidersProps) {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        {children}
        <ThemedToaster />
      </ThemeProvider>
    </QueryClientProvider>
  );
}

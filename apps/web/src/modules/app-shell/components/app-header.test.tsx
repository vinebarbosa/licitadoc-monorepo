import { fireEvent, screen } from "@testing-library/react";
import type { ReactNode } from "react";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { THEME_STORAGE_KEY } from "@/app/theme";
import { SidebarProvider } from "@/shared/ui/sidebar";
import { renderWithProviders } from "@/test/render";
import { AppHeader } from "./app-header";

const storageState = new Map<string, string>();

function renderHeader(ui: ReactNode) {
  return renderWithProviders(
    <MemoryRouter>
      <SidebarProvider>{ui}</SidebarProvider>
    </MemoryRouter>,
  );
}

beforeEach(() => {
  storageState.clear();
  document.documentElement.classList.remove("dark");
  delete document.documentElement.dataset.theme;
  document.documentElement.style.colorScheme = "light";

  Object.defineProperty(window, "localStorage", {
    configurable: true,
    value: {
      getItem: vi.fn((key: string) => storageState.get(key) ?? null),
      setItem: vi.fn((key: string, value: string) => {
        storageState.set(key, value);
      }),
      removeItem: vi.fn((key: string) => {
        storageState.delete(key);
      }),
    },
  });

  window.matchMedia = vi.fn().mockImplementation((query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  }));
});

describe("AppHeader", () => {
  it("renders breadcrumbs, notifications, and no search textbox", () => {
    renderHeader(
      <AppHeader
        breadcrumbs={[{ label: "Central de Trabalho", href: "/app" }, { label: "Processos" }]}
      />,
    );

    expect(screen.getByRole("button", { name: "Toggle Sidebar" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Central de Trabalho" })).toHaveAttribute(
      "href",
      "/app",
    );
    expect(screen.getByText("Processos")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Notificações" })).toBeInTheDocument();
    expect(screen.getByText("2")).toBeInTheDocument();
    expect(screen.queryByRole("textbox")).not.toBeInTheDocument();
  });

  it("renders a title fallback and toggles the current theme", () => {
    renderHeader(<AppHeader title="Central de Trabalho" />);

    expect(screen.getByRole("heading", { name: "Central de Trabalho" })).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Alternar tema" }));

    expect(document.documentElement).toHaveClass("dark");
    expect(window.localStorage.getItem(THEME_STORAGE_KEY)).toBe("dark");
  });
});

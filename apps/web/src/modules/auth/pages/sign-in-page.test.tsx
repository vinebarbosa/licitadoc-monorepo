import { QueryClientProvider } from "@tanstack/react-query";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { HttpResponse, http } from "msw";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { createQueryClient } from "@/app/query-client";
import { ThemeProvider } from "@/app/theme";
import { server } from "@/test/msw/server";
import { SignInPage } from "./sign-in-page";

const navigateMock = vi.fn();

vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual<typeof import("react-router-dom")>("react-router-dom");

  return {
    ...actual,
    useNavigate: () => navigateMock,
  };
});

function renderSignInPage(initialEntry = "/entrar") {
  const queryClient = createQueryClient();

  return render(
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <MemoryRouter initialEntries={[initialEntry]}>
          <SignInPage />
        </MemoryRouter>
      </ThemeProvider>
    </QueryClientProvider>,
  );
}

function mockSuccessfulSignIn() {
  server.use(
    http.post("http://localhost:3333/api/auth/sign-in/email", () => {
      return HttpResponse.json({
        redirect: false,
        token: "session-token",
        user: {
          id: "user-1",
          name: "Maria Silva",
          email: "maria@licitadoc.test",
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          role: "member",
        },
      });
    }),
  );
}

function submitSignInForm() {
  fireEvent.change(screen.getByLabelText("E-mail"), {
    target: { value: "maria@licitadoc.test" },
  });
  fireEvent.change(screen.getByLabelText("Senha"), {
    target: { value: "senha-segura" },
  });
  fireEvent.click(screen.getByRole("button", { name: /Entrar/ }));
}

describe("SignInPage", () => {
  beforeEach(() => {
    navigateMock.mockReset();
  });

  it("renders the migrated sign-in route", () => {
    renderSignInPage();

    expect(screen.getByRole("heading", { name: "Acesse sua conta" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Entrar/ })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Esqueceu a senha?" })).toHaveAttribute(
      "href",
      "/recuperar-senha",
    );
  });

  it("navigates to the app shell after a successful direct sign-in", async () => {
    mockSuccessfulSignIn();

    renderSignInPage();

    submitSignInForm();

    await waitFor(() => {
      expect(navigateMock).toHaveBeenCalledWith("/app", { replace: true });
    });
  });

  it("navigates to the redirect target after a successful sign-in", async () => {
    mockSuccessfulSignIn();

    renderSignInPage("/entrar?redirectTo=%2Fapp%2Fprocessos%3Fstatus%3Daberto");

    submitSignInForm();

    await waitFor(() => {
      expect(navigateMock).toHaveBeenCalledWith("/app/processos?status=aberto", {
        replace: true,
      });
    });
  });

  it("falls back to the app shell after sign-in with an unsafe redirect target", async () => {
    mockSuccessfulSignIn();

    renderSignInPage("/entrar?redirectTo=https://example.test");

    submitSignInForm();

    await waitFor(() => {
      expect(navigateMock).toHaveBeenCalledWith("/app", { replace: true });
    });
  });

  it("shows an inline error when authentication fails", async () => {
    server.use(
      http.post("http://localhost:3333/api/auth/sign-in/email", () => {
        return HttpResponse.json({ message: "Credenciais inválidas." }, { status: 401 });
      }),
    );

    renderSignInPage();

    fireEvent.change(screen.getByLabelText("E-mail"), {
      target: { value: "maria@licitadoc.test" },
    });
    fireEvent.change(screen.getByLabelText("Senha"), {
      target: { value: "senha-incorreta" },
    });
    fireEvent.click(screen.getByRole("button", { name: /Entrar/ }));

    await waitFor(() => {
      expect(screen.getByRole("alert")).toHaveTextContent("Credenciais inválidas.");
    });
  });
});

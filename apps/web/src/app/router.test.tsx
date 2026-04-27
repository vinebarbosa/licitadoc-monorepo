import { act, fireEvent, screen, waitFor } from "@testing-library/react";
import { HttpResponse, http } from "msw";
import { createMemoryRouter, RouterProvider } from "react-router-dom";
import { describe, expect, it } from "vitest";
import { authenticatedSessionResponse } from "@/test/msw/fixtures";
import { server } from "@/test/msw/server";
import { renderWithProviders } from "@/test/render";
import { appRoutes } from "./router";

describe("appRoutes", () => {
  it("renders the unauthorized page from the centralized router", async () => {
    const router = createMemoryRouter(appRoutes as never, {
      initialEntries: ["/nao-autorizado"],
    });

    renderWithProviders(<RouterProvider router={router} />);

    await waitFor(() => {
      expect(
        screen.getByRole("heading", { name: "Você não tem permissão para esta área" }),
      ).toBeInTheDocument();
    });
  });

  it("renders the not-found page for unknown routes", async () => {
    const router = createMemoryRouter(appRoutes as never, {
      initialEntries: ["/rota-inexistente"],
    });

    renderWithProviders(<RouterProvider router={router} />);

    await waitFor(() => {
      expect(screen.getByRole("heading", { name: "Página não encontrada" })).toBeInTheDocument();
    });
  });

  it("redirects visitors away from the protected app shell route", async () => {
    const router = createMemoryRouter(appRoutes as never, {
      initialEntries: ["/app"],
    });

    renderWithProviders(<RouterProvider router={router} />);

    await waitFor(() => {
      expect(screen.getByRole("heading", { name: "Acesse sua conta" })).toBeInTheDocument();
    });
  });

  it("renders the app shell after signing in from a preserved app redirect", async () => {
    let isSignedIn = false;

    server.use(
      http.get("http://localhost:3333/api/auth/get-session", () => {
        return HttpResponse.json(isSignedIn ? authenticatedSessionResponse : null);
      }),
      http.post("http://localhost:3333/api/auth/sign-in/email", () => {
        isSignedIn = true;

        return HttpResponse.json({
          redirect: false,
          token: "session-token",
          user: authenticatedSessionResponse.user,
        });
      }),
    );

    const router = createMemoryRouter(appRoutes as never, {
      initialEntries: ["/app"],
    });

    renderWithProviders(<RouterProvider router={router} />);

    await waitFor(() => {
      expect(router.state.location.pathname).toBe("/entrar");
      expect(router.state.location.search).toBe("?redirectTo=%2Fapp");
      expect(screen.getByRole("heading", { name: "Acesse sua conta" })).toBeInTheDocument();
    });

    fireEvent.change(screen.getByLabelText("E-mail"), {
      target: { value: "maria@licitadoc.test" },
    });
    fireEvent.change(screen.getByLabelText("Senha"), {
      target: { value: "senha-segura" },
    });
    fireEvent.click(screen.getByRole("button", { name: /Entrar/ }));

    await waitFor(() => {
      expect(router.state.location.pathname).toBe("/app");
      expect(router.state.location.search).toBe("");
      expect(screen.getByLabelText("Área inicial do app")).toBeInTheDocument();
    });
  });

  it("renders the app shell and blank home route for authenticated users", async () => {
    server.use(
      http.get("http://localhost:3333/api/auth/get-session", () => {
        return HttpResponse.json(authenticatedSessionResponse);
      }),
    );

    const router = createMemoryRouter(appRoutes as never, {
      initialEntries: ["/app"],
    });

    renderWithProviders(<RouterProvider router={router} />);

    await waitFor(() => {
      expect(screen.getByRole("link", { name: /LicitaDoc/ })).toHaveAttribute("href", "/app");
    });

    expect(screen.getAllByRole("link", { name: /Central de Trabalho/ })[0]).toHaveAttribute(
      "href",
      "/app",
    );
    expect(screen.getByLabelText("Área inicial do app")).toBeInTheDocument();
    expect(screen.queryByText("Documento em Geração")).not.toBeInTheDocument();
  });

  it("renders the protected processes route for authenticated users", async () => {
    server.use(
      http.get("http://localhost:3333/api/auth/get-session", () => {
        return HttpResponse.json(authenticatedSessionResponse);
      }),
    );

    const router = createMemoryRouter(appRoutes as never, {
      initialEntries: ["/app/processos"],
    });

    renderWithProviders(<RouterProvider router={router} />);

    await waitFor(() => {
      expect(screen.getByRole("heading", { name: "Processos de Contratação" })).toBeInTheDocument();
    });

    expect(screen.getAllByRole("link", { name: /Processos/ })[0]).toHaveAttribute(
      "href",
      "/app/processos",
    );
  });

  it("renders the protected process creation route for authenticated users", async () => {
    server.use(
      http.get("http://localhost:3333/api/auth/get-session", () => {
        return HttpResponse.json(authenticatedSessionResponse);
      }),
    );

    const router = createMemoryRouter(appRoutes as never, {
      initialEntries: ["/app/processo/novo"],
    });

    renderWithProviders(<RouterProvider router={router} />);

    await waitFor(() => {
      expect(screen.getByRole("heading", { name: "Novo Processo" })).toBeInTheDocument();
    });

    expect(screen.getAllByRole("link", { name: /Processos/ })[0]).toHaveAttribute(
      "href",
      "/app/processos",
    );
  });

  it("renders the protected process detail route for authenticated users", async () => {
    server.use(
      http.get("http://localhost:3333/api/auth/get-session", () => {
        return HttpResponse.json(authenticatedSessionResponse);
      }),
    );

    const router = createMemoryRouter(appRoutes as never, {
      initialEntries: ["/app/processo/process-1"],
    });

    renderWithProviders(<RouterProvider router={router} />);

    await waitFor(() => {
      expect(
        screen.getByRole("heading", { name: "Contratação de Serviços de TI" }),
      ).toBeInTheDocument();
    });

    expect(screen.getAllByRole("link", { name: /Processos/ })[0]).toHaveAttribute(
      "href",
      "/app/processos",
    );
    expect(screen.getByText("Documentos do Processo")).toBeInTheDocument();
  });

  it("renders the protected document preview route for authenticated users", async () => {
    server.use(
      http.get("http://localhost:3333/api/auth/get-session", () => {
        return HttpResponse.json(authenticatedSessionResponse);
      }),
    );

    const router = createMemoryRouter(appRoutes as never, {
      initialEntries: ["/app/documento/document-1/preview"],
    });

    renderWithProviders(<RouterProvider router={router} />);

    await waitFor(() => {
      expect(screen.getByRole("heading", { name: "DFD - PE-2024-045" })).toBeInTheDocument();
    });

    expect(screen.getAllByRole("link", { name: /Documentos/ })[0]).toHaveAttribute(
      "href",
      "/app/documentos",
    );
    expect(screen.getByText("Preview do Documento")).toBeInTheDocument();
  });

  it("redirects visitors away from the protected document preview route", async () => {
    const router = createMemoryRouter(appRoutes as never, {
      initialEntries: ["/app/documento/document-1/preview"],
    });

    renderWithProviders(<RouterProvider router={router} />);

    await waitFor(() => {
      expect(router.state.location.pathname).toBe("/entrar");
      expect(router.state.location.search).toBe(
        "?redirectTo=%2Fapp%2Fdocumento%2Fdocument-1%2Fpreview",
      );
    });
  });

  it("redirects visitors away from the protected process creation route", async () => {
    const router = createMemoryRouter(appRoutes as never, {
      initialEntries: ["/app/processo/novo"],
    });

    renderWithProviders(<RouterProvider router={router} />);

    await waitFor(() => {
      expect(router.state.location.pathname).toBe("/entrar");
      expect(router.state.location.search).toBe("?redirectTo=%2Fapp%2Fprocesso%2Fnovo");
    });
  });

  it("redirects visitors away from the protected process detail route", async () => {
    const router = createMemoryRouter(appRoutes as never, {
      initialEntries: ["/app/processo/process-1"],
    });

    renderWithProviders(<RouterProvider router={router} />);

    await waitFor(() => {
      expect(router.state.location.pathname).toBe("/entrar");
      expect(router.state.location.search).toBe("?redirectTo=%2Fapp%2Fprocesso%2Fprocess-1");
    });
  });

  it("redirects non-admin users away from the admin users route", async () => {
    server.use(
      http.get("http://localhost:3333/api/auth/get-session", () => {
        return HttpResponse.json(authenticatedSessionResponse);
      }),
    );

    const router = createMemoryRouter(appRoutes as never, {
      initialEntries: ["/admin/usuarios"],
    });

    renderWithProviders(<RouterProvider router={router} />);

    await waitFor(() => {
      expect(router.state.location.pathname).toBe("/nao-autorizado");
      expect(
        screen.getByRole("heading", { name: "Você não tem permissão para esta área" }),
      ).toBeInTheDocument();
    });
  });

  it("renders the admin users route for admin sessions", async () => {
    server.use(
      http.get("http://localhost:3333/api/auth/get-session", () => {
        return HttpResponse.json({
          ...authenticatedSessionResponse,
          user: {
            ...authenticatedSessionResponse.user,
            role: "admin",
            organizationId: null,
          },
        });
      }),
    );

    const router = createMemoryRouter(appRoutes as never, {
      initialEntries: ["/admin/usuarios"],
    });

    renderWithProviders(<RouterProvider router={router} />);

    await waitFor(() => {
      expect(screen.getByRole("heading", { name: "Usuários do Sistema" })).toBeInTheDocument();
    });
  });

  it("redirects the deprecated app-scoped admin users route to the canonical route", async () => {
    server.use(
      http.get("http://localhost:3333/api/auth/get-session", () => {
        return HttpResponse.json({
          ...authenticatedSessionResponse,
          user: {
            ...authenticatedSessionResponse.user,
            role: "admin",
            organizationId: null,
          },
        });
      }),
    );

    const router = createMemoryRouter(appRoutes as never, {
      initialEntries: ["/app/admin/usuarios"],
    });

    renderWithProviders(<RouterProvider router={router} />);

    await waitFor(() => {
      expect(router.state.location.pathname).toBe("/admin/usuarios");
      expect(screen.getByRole("heading", { name: "Usuários do Sistema" })).toBeInTheDocument();
    });
  });

  it("signs out from the app shell and protects app access afterward", async () => {
    let isSignedIn = true;
    let signOutRequests = 0;

    server.use(
      http.get("http://localhost:3333/api/auth/get-session", () => {
        return HttpResponse.json(isSignedIn ? authenticatedSessionResponse : null);
      }),
      http.post("http://localhost:3333/api/auth/sign-out", () => {
        signOutRequests += 1;
        isSignedIn = false;

        return HttpResponse.json({ success: true });
      }),
    );

    const router = createMemoryRouter(appRoutes as never, {
      initialEntries: ["/app"],
    });

    renderWithProviders(<RouterProvider router={router} />);

    await waitFor(() => {
      expect(screen.getByRole("link", { name: /LicitaDoc/ })).toHaveAttribute("href", "/app");
    });

    fireEvent.pointerDown(screen.getByRole("button", { name: /Maria Silva/ }));
    fireEvent.click(await screen.findByRole("menuitem", { name: "Sair" }));

    await waitFor(() => {
      expect(signOutRequests).toBe(1);
      expect(router.state.location.pathname).toBe("/entrar");
      expect(screen.getByRole("heading", { name: "Acesse sua conta" })).toBeInTheDocument();
    });

    await act(async () => {
      await router.navigate("/app");
    });

    await waitFor(() => {
      expect(router.state.location.pathname).toBe("/entrar");
      expect(router.state.location.search).toBe("?redirectTo=%2Fapp");
    });
  });
});

import { fireEvent, screen, waitFor, within } from "@testing-library/react";
import { HttpResponse, http } from "msw";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { describe, expect, it } from "vitest";
import { authenticatedSessionResponse } from "@/test/msw/fixtures";
import { server } from "@/test/msw/server";
import { renderWithProviders } from "@/test/render";
import { AdminSupportTicketsPage } from "./admin-support-tickets-page";

function renderPage() {
  server.use(
    http.get("http://localhost:3333/api/auth/get-session", () =>
      HttpResponse.json({
        ...authenticatedSessionResponse,
        user: {
          ...authenticatedSessionResponse.user,
          role: "admin",
          name: "Maria Silva",
          organizationId: null,
        },
      }),
    ),
  );

  renderWithProviders(
    <MemoryRouter initialEntries={["/admin/chamados"]}>
      <Routes>
        <Route path="/admin/chamados" element={<AdminSupportTicketsPage />} />
      </Routes>
    </MemoryRouter>,
  );
}

describe("AdminSupportTicketsPage", () => {
  it("renders metrics, queue, selected detail, context, and image attachment preview", async () => {
    renderPage();

    expect(screen.getByRole("heading", { name: "Chamados de suporte" })).toBeInTheDocument();
    await waitFor(() => {
      expect(screen.getAllByText("LD-SUP-1918").length).toBeGreaterThan(0);
    });
    expect(
      screen.getAllByText("Nao consigo concluir a geracao do documento").length,
    ).toBeGreaterThan(0);
    expect(screen.getAllByText("Abertos").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Atenção").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Detalhe do processo").length).toBeGreaterThan(0);
    expect(
      screen.getByLabelText("Ultima atividade há 12 min, 16/05/2026 às 12:18"),
    ).toBeInTheDocument();
    expect(
      screen.getByLabelText("Ultima atividade ontem, 15/05/2026 às 16:22"),
    ).toBeInTheDocument();
    expect(screen.getByText("Hoje")).toBeInTheDocument();
    expect(screen.getAllByText("12:08").length).toBeGreaterThan(0);
    expect(
      screen.getByRole("img", { name: "Preview do anexo captura-detalhe-processo.png" }),
    ).toBeInTheDocument();
    expect(screen.getByRole("img", { name: "captura-detalhe-processo.png" })).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText("Maria Silva atendendo agora")).toBeInTheDocument();
    });
  });

  it("keeps status counts scoped when a status tab is selected", async () => {
    renderPage();

    await waitFor(() => {
      expect(screen.getByRole("button", { name: /Todos\s+4/ })).toBeInTheDocument();
    });
    expect(screen.getByRole("button", { name: /Abertos\s+2/ })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Aguardando\s+1/ })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Resolvidos\s+1/ })).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /Resolvidos\s+1/ }));

    await waitFor(() => {
      expect(screen.getByText("1 de 4 chamados")).toBeInTheDocument();
    });
    expect(screen.getByRole("button", { name: /Abertos\s+2/ })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Aguardando\s+1/ })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Resolvidos\s+1/ })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /LD-SUP-1918/ })).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /Abertos\s+2/ }));

    await waitFor(() => {
      expect(screen.getByText("2 de 4 chamados")).toBeInTheDocument();
    });
    expect(screen.getByRole("button", { name: /Resolvidos\s+1/ })).toBeInTheDocument();
  });

  it("scopes counts by non-status filters without collapsing other status tabs", async () => {
    renderPage();

    await waitFor(() => {
      expect(screen.getByRole("button", { name: /LD-SUP-1918/ })).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole("combobox", { name: "Origem" }));
    fireEvent.click(within(screen.getByRole("listbox")).getByText("Documentos"));

    await waitFor(() => {
      expect(screen.getByText("1 de 1 chamados")).toBeInTheDocument();
    });
    expect(screen.getByRole("button", { name: /Todos\s+1/ })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Abertos\s+1/ })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Resolvidos\s+0/ })).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /Resolvidos\s+0/ }));

    await waitFor(() => {
      expect(screen.getByText("0 de 1 chamados")).toBeInTheDocument();
    });
    expect(screen.getByText("Nenhum chamado encontrado")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Abertos\s+1/ })).toBeInTheDocument();
  });

  it("filters tickets and shows an empty state without stale details", async () => {
    renderPage();

    await waitFor(() => {
      expect(screen.getAllByText("LD-SUP-1918").length).toBeGreaterThan(0);
    });

    fireEvent.change(screen.getByLabelText("Buscar"), { target: { value: "sem resultado" } });

    expect(screen.getByText("Nenhum chamado encontrado")).toBeInTheDocument();
    expect(screen.getByText("Nenhum chamado selecionado")).toBeInTheDocument();
    expect(screen.queryByText("Detalhe do processo")).not.toBeInTheDocument();
  });

  it("assigns, replies, resolves, and reopens a ticket locally", async () => {
    renderPage();

    await waitFor(() => {
      expect(screen.getByRole("button", { name: /Assumir/ })).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole("button", { name: /Assumir/ }));
    await waitFor(() => {
      expect(screen.getByText((text) => text.includes("por Maria Silva"))).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole("combobox", { name: "Alterar prioridade" }));
    fireEvent.click(within(screen.getByRole("listbox")).getByText("Baixa"));
    await waitFor(() => {
      expect(screen.getAllByText("Baixa").length).toBeGreaterThan(0);
    });

    const replyInput = screen.getByLabelText("Resposta ao usuario");
    expect(screen.getByRole("button", { name: "Enviar resposta" })).toBeDisabled();
    fireEvent.change(replyInput, { target: { value: "Vou revisar a geracao agora." } });
    fireEvent.click(screen.getByRole("button", { name: "Enviar resposta" }));

    await waitFor(() => {
      expect(screen.getAllByText("Vou revisar a geracao agora.").length).toBeGreaterThan(0);
    });
    expect(screen.getByRole("button", { name: "Resolver" })).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Resolver" }));
    await waitFor(() => {
      expect(
        screen.getByText("Este chamado foi resolvido. Reabra para responder novamente."),
      ).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole("button", { name: "Reabrir" }));
    await waitFor(() => {
      expect(screen.getByLabelText("Resposta ao usuario")).toBeInTheDocument();
    });
  });

  it("selects tickets without screenshot evidence without reserving the preview", async () => {
    renderPage();

    await waitFor(() => {
      expect(screen.getByRole("button", { name: /LD-SUP-1907/ })).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole("button", { name: /LD-SUP-1907/ }));

    expect(screen.getAllByText("Preview do documento nao abre").length).toBeGreaterThan(0);
    expect(
      screen.queryByRole("img", { name: /Preview do anexo/ }),
    ).not.toBeInTheDocument();
  });
});

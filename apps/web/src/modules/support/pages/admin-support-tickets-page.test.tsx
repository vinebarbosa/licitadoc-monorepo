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
  it("renders metrics, queue, selected detail, context, and screenshot preview", async () => {
    renderPage();

    expect(screen.getByRole("heading", { name: "Chamados de suporte" })).toBeInTheDocument();
    expect(screen.getAllByText("LD-SUP-1918").length).toBeGreaterThan(0);
    expect(
      screen.getAllByText("Nao consigo concluir a geracao do documento").length,
    ).toBeGreaterThan(0);
    expect(screen.getAllByText("Abertos").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Atencao").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Detalhe do processo").length).toBeGreaterThan(0);
    expect(
      screen.getByRole("img", { name: "Preview da captura enviada pelo usuario" }),
    ).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText("Maria Silva atendendo agora")).toBeInTheDocument();
    });
  });

  it("filters tickets and shows an empty state without stale details", () => {
    renderPage();

    fireEvent.change(screen.getByLabelText("Buscar"), { target: { value: "sem resultado" } });

    expect(screen.getByText("Nenhum chamado encontrado")).toBeInTheDocument();
    expect(screen.getByText("Nenhum chamado selecionado")).toBeInTheDocument();
    expect(screen.queryByText("Detalhe do processo")).not.toBeInTheDocument();
  });

  it("assigns, replies, resolves, and reopens a ticket locally", async () => {
    renderPage();

    await waitFor(() => {
      expect(screen.getByText("Maria Silva atendendo agora")).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole("button", { name: /Assumir/ }));
    expect(screen.getByText((text) => text.includes("por Maria Silva"))).toBeInTheDocument();

    fireEvent.click(screen.getByRole("combobox", { name: "Alterar prioridade" }));
    fireEvent.click(within(screen.getByRole("listbox")).getByText("Baixa"));
    expect(screen.getAllByText("Baixa").length).toBeGreaterThan(0);

    const replyInput = screen.getByLabelText("Resposta ao usuario");
    expect(screen.getByRole("button", { name: "Enviar resposta" })).toBeDisabled();
    fireEvent.change(replyInput, { target: { value: "Vou revisar a geracao agora." } });
    fireEvent.click(screen.getByRole("button", { name: "Enviar resposta" }));

    expect(screen.getAllByText("Vou revisar a geracao agora.").length).toBeGreaterThan(0);
    expect(screen.getByRole("button", { name: "Resolver" })).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Resolver" }));
    expect(
      screen.getByText("Este chamado foi resolvido. Reabra para responder novamente."),
    ).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Reabrir" }));
    expect(screen.getByLabelText("Resposta ao usuario")).toBeInTheDocument();
  });

  it("selects tickets without screenshot evidence without reserving the preview", () => {
    renderPage();

    fireEvent.click(screen.getByRole("button", { name: /LD-SUP-1907/ }));

    expect(screen.getAllByText("Preview do documento nao abre").length).toBeGreaterThan(0);
    expect(
      screen.queryByRole("img", { name: "Preview da captura enviada pelo usuario" }),
    ).not.toBeInTheDocument();
  });
});

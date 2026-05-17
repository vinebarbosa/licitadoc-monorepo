import { act, fireEvent, screen, waitFor } from "@testing-library/react";
import { HttpResponse, http } from "msw";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { afterEach, describe, expect, it, vi } from "vitest";
import { server } from "@/test/msw/server";
import { renderWithProviders } from "@/test/render";
import { ContextualHelpWidget } from "./contextual-help-widget";

function renderWidget(pathname = "/app") {
  return renderWithProviders(
    <MemoryRouter initialEntries={[pathname]}>
      <Routes>
        <Route path="*" element={<ContextualHelpWidget />} />
      </Routes>
    </MemoryRouter>,
  );
}

afterEach(() => {
  vi.useRealTimers();
});

describe("ContextualHelpWidget", () => {
  it("renders a collapsed accessible trigger with availability and opens contextual help", () => {
    renderWidget("/app/processo/novo");

    const trigger = screen.getByRole("button", { name: "Abrir ajuda" });
    expect(trigger).toBeInTheDocument();
    expect(trigger).toHaveAttribute("aria-expanded", "false");

    fireEvent.click(trigger);

    expect(screen.getByRole("region", { name: "Ajuda do LicitaDoc" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Ajuda no novo processo" })).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Como importar uma solicitação de despesa em PDF?" }),
    ).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Sugestões" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Ações rápidas" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Falar com suporte" })).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Sugestões" }));

    expect(
      screen.getByRole("button", { name: "Como importar uma solicitação de despesa em PDF?" }),
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Minimizar ajuda" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Fechar ajuda" })).toBeInTheDocument();
  });

  it("minimizes, expands, and closes the panel", () => {
    renderWidget("/app/documentos");

    fireEvent.click(screen.getByRole("button", { name: "Abrir ajuda" }));
    expect(screen.getByRole("heading", { name: "Ajuda em documentos" })).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Minimizar ajuda" }));
    expect(screen.queryByRole("textbox", { name: "Mensagem para ajuda" })).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Expandir ajuda" })).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Expandir ajuda" }));
    expect(screen.getByRole("textbox", { name: "Mensagem para ajuda" })).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Fechar ajuda" }));
    expect(screen.queryByRole("region", { name: "Ajuda do LicitaDoc" })).not.toBeInTheDocument();
  });

  it("records quick actions and shows deterministic local guidance", async () => {
    vi.useFakeTimers();
    renderWidget("/app");

    fireEvent.click(screen.getByRole("button", { name: "Abrir ajuda" }));
    fireEvent.click(screen.getByRole("button", { name: "Ações rápidas" }));
    fireEvent.click(screen.getByRole("button", { name: /Importar PDF/ }));

    expect(screen.getByText("Ação: Importar PDF")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Importar PDF" })).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Ações rápidas" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Falar com suporte" })).toBeInTheDocument();
    expect(screen.getByText("Preparando orientação segura...")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Ações rápidas" }));
    expect(screen.getByRole("button", { name: "Importar PDF" })).toBeInTheDocument();
    expect(screen.getAllByRole("button", { name: "Falar com suporte" })).toHaveLength(1);
    fireEvent.click(screen.getByRole("button", { name: "Ocultar" }));
    expect(screen.queryByRole("button", { name: "Importar PDF" })).not.toBeInTheDocument();
    expect(screen.getAllByRole("button", { name: "Falar com suporte" })).toHaveLength(1);

    await act(async () => {
      vi.advanceTimersByTime(250);
    });

    expect(screen.getByText(/Para importar um PDF/)).toBeInTheDocument();
  });

  it("opens support intake from quick actions and returns to the assistant", () => {
    renderWidget("/app/documentos");

    fireEvent.click(screen.getByRole("button", { name: "Abrir ajuda" }));
    fireEvent.click(screen.getByRole("button", { name: "Falar com suporte" }));

    expect(screen.getByRole("button", { name: "Anexar captura de tela" })).toBeInTheDocument();
    expect(screen.queryByText("Rota")).not.toBeInTheDocument();
    expect(screen.getByRole("textbox", { name: "Descrição para o suporte" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Iniciar chat" })).toBeDisabled();

    fireEvent.change(screen.getByLabelText("Selecionar captura de tela"), {
      target: {
        files: [new File(["texto"], "erro.txt", { type: "text/plain" })],
      },
    });
    expect(screen.getByText("Envie uma imagem PNG, JPEG ou WebP.")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Voltar ao assistente" }));

    expect(screen.getByRole("textbox", { name: "Mensagem para ajuda" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Ações rápidas" })).toBeInTheDocument();
  });

  it("shows a retryable support history error", async () => {
    server.use(
      http.get("http://localhost:3333/api/support-tickets/me", () =>
        HttpResponse.json({ error: "forbidden", message: "Forbidden", details: null }, { status: 403 }),
      ),
    );
    renderWidget("/app");

    fireEvent.click(screen.getByRole("button", { name: "Abrir ajuda" }));
    fireEvent.click(screen.getByRole("button", { name: "Falar com suporte" }));
    fireEvent.click(screen.getByRole("button", { name: "Meus atendimentos" }));

    await waitFor(() => {
      expect(screen.getByText("Não foi possível carregar")).toBeInTheDocument();
    });
    expect(screen.getByRole("button", { name: "Tentar novamente" })).toBeInTheDocument();
  });

  it("shows API-backed support history and opens a previous conversation", async () => {
    renderWidget("/app");

    fireEvent.click(screen.getByRole("button", { name: "Abrir ajuda" }));
    fireEvent.click(screen.getByRole("button", { name: "Falar com suporte" }));
    fireEvent.click(screen.getByRole("button", { name: "Meus atendimentos" }));

    expect(screen.getByText("Meus atendimentos")).toBeInTheDocument();
    await waitFor(() => {
      expect(
        screen.getByRole("button", { name: /Não consigo revisar o documento/ }),
      ).toBeInTheDocument();
    });
    expect(screen.getByText("Em atendimento")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /Não consigo revisar o documento/ }));

    expect(screen.getByText(/LD-SUP-2001/)).toBeInTheDocument();
    expect(screen.getByText("Não consigo revisar o documento")).toBeInTheDocument();
    expect(screen.getByRole("textbox", { name: "Mensagem para o suporte" })).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Histórico" }));
    fireEvent.click(screen.getByRole("button", { name: "Novo" }));
    expect(screen.getByRole("textbox", { name: "Descrição para o suporte" })).toBeInTheDocument();
  });

  it("submits support intake and sends support chat messages through the API", async () => {
    renderWidget("/app/documento/document-1/preview");

    fireEvent.click(screen.getByRole("button", { name: "Abrir ajuda" }));
    fireEvent.click(screen.getByRole("button", { name: "Falar com suporte" }));
    fireEvent.change(screen.getByLabelText("Selecionar captura de tela"), {
      target: {
        files: [new File(["imagem"], "captura-de-tela.png", { type: "image/png" })],
      },
    });
    await waitFor(() => {
      expect(screen.getByText("captura-de-tela.png")).toBeInTheDocument();
    });
    fireEvent.click(screen.getByRole("button", { name: "Remover captura-de-tela.png" }));
    expect(screen.queryByText("captura-de-tela.png")).not.toBeInTheDocument();
    fireEvent.change(screen.getByLabelText("Selecionar captura de tela"), {
      target: {
        files: [new File(["imagem"], "captura-de-tela.png", { type: "image/png" })],
      },
    });
    await waitFor(() => {
      expect(screen.getByText("captura-de-tela.png")).toBeInTheDocument();
    });
    fireEvent.change(screen.getByRole("textbox", { name: "Descrição para o suporte" }), {
      target: { value: "Não consigo revisar o documento" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Iniciar chat" }));

    await waitFor(() => {
      expect(screen.getByText(/LD-SUP-2001/)).toBeInTheDocument();
    });
    expect(screen.getByRole("img", { name: "captura-de-tela.png" })).toBeInTheDocument();
    expect(screen.getByText("captura-de-tela.png")).toBeInTheDocument();
    expect(screen.getAllByText("Não consigo revisar o documento").length).toBeGreaterThan(0);
    expect(screen.getByRole("textbox", { name: "Mensagem para o suporte" })).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText("Selecionar imagem para o suporte"), {
      target: {
        files: [new File(["imagem"], "tela-atual.png", { type: "image/png" })],
      },
    });
    await waitFor(() => {
      expect(screen.getAllByText("captura-de-tela.png").length).toBeGreaterThan(0);
    });
    fireEvent.click(screen.getByRole("button", { name: "Enviar mensagem para o suporte" }));

    await waitFor(() => {
      expect(screen.getByText("Imagem anexada")).toBeInTheDocument();
    });

    fireEvent.change(screen.getByRole("textbox", { name: "Mensagem para o suporte" }), {
      target: { value: "Aparece erro na prévia" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Enviar mensagem para o suporte" }));

    await waitFor(() => {
      expect(screen.getByText("Aparece erro na prévia")).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole("button", { name: "Voltar ao assistente" }));
    expect(screen.getByRole("textbox", { name: "Mensagem para ajuda" })).toBeInTheDocument();
  });

  it("keeps the support intake draft when ticket creation fails", async () => {
    server.use(
      http.post("http://localhost:3333/api/support-tickets/", () =>
        HttpResponse.json(
          { error: "internal_server_error", message: "Internal server error" },
          { status: 500 },
        ),
      ),
    );
    renderWidget("/app/processos");

    fireEvent.click(screen.getByRole("button", { name: "Abrir ajuda" }));
    fireEvent.click(screen.getByRole("button", { name: "Falar com suporte" }));
    fireEvent.change(screen.getByRole("textbox", { name: "Descrição para o suporte" }), {
      target: { value: "Falhou ao salvar o processo" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Iniciar chat" }));

    await waitFor(() => {
      expect(
        screen.getByText("Não foi possível iniciar o atendimento. Tente novamente."),
      ).toBeInTheDocument();
    });
    expect(screen.getByDisplayValue("Falhou ao salvar o processo")).toBeInTheDocument();
  });

  it("adds current-session support requests to API-backed history cache", async () => {
    renderWidget("/app/processo/process-1");

    fireEvent.click(screen.getByRole("button", { name: "Abrir ajuda" }));
    fireEvent.click(screen.getByRole("button", { name: "Falar com suporte" }));
    fireEvent.change(screen.getByRole("textbox", { name: "Descrição para o suporte" }), {
      target: { value: "Quero rever o que enviei antes" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Iniciar chat" }));

    await waitFor(() => {
      expect(screen.getByText(/LD-SUP-2001/)).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole("button", { name: "Histórico" }));
    expect(screen.getByText("Meus atendimentos")).toBeInTheDocument();
    await waitFor(() => {
      expect(
        screen.getByRole("button", { name: /Quero rever o que enviei antes/ }),
      ).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole("button", { name: /Quero rever o que enviei antes/ }));
    expect(screen.getAllByText("Quero rever o que enviei antes").length).toBeGreaterThan(0);
    expect(screen.getByRole("textbox", { name: "Mensagem para o suporte" })).toBeInTheDocument();
  });

  it("sends typed messages with a local assistant response", async () => {
    vi.useFakeTimers();
    renderWidget("/app/membros");

    fireEvent.click(screen.getByRole("button", { name: "Abrir ajuda" }));
    fireEvent.change(screen.getByRole("textbox", { name: "Mensagem para ajuda" }), {
      target: { value: "Como convido um membro?" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Enviar mensagem de ajuda" }));

    expect(screen.getByText("Como convido um membro?")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Ações rápidas" })).toBeInTheDocument();

    await act(async () => {
      vi.advanceTimersByTime(250);
    });

    expect(screen.getByText(/Para convidar um membro/)).toBeInTheDocument();
  });
});

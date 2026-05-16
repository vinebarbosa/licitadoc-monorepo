import { act, fireEvent, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { afterEach, describe, expect, it, vi } from "vitest";
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

    fireEvent.click(screen.getByRole("button", { name: "Voltar ao assistente" }));

    expect(screen.getByRole("textbox", { name: "Mensagem para ajuda" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Ações rápidas" })).toBeInTheDocument();
  });

  it("shows support history and opens a previous resolved conversation", () => {
    renderWidget("/app");

    fireEvent.click(screen.getByRole("button", { name: "Abrir ajuda" }));
    fireEvent.click(screen.getByRole("button", { name: "Falar com suporte" }));
    fireEvent.click(screen.getByRole("button", { name: "Meus atendimentos" }));

    expect(screen.getByText("Meus atendimentos")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /Dúvida sobre documento em geração/ }),
    ).toBeInTheDocument();
    expect(screen.getByText("Resolvido")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /Dúvida sobre documento em geração/ }));

    expect(screen.getByText(/Atendimento LD-DOCUMENTOS-1233/)).toBeInTheDocument();
    expect(screen.getByText("O documento ficou em geração por muito tempo.")).toBeInTheDocument();
    expect(screen.getByText("Este atendimento foi resolvido.")).toBeInTheDocument();
    expect(
      screen.queryByRole("textbox", { name: "Mensagem para o suporte" }),
    ).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Novo atendimento" }));
    expect(screen.getByRole("textbox", { name: "Descrição para o suporte" })).toBeInTheDocument();
  });

  it("submits support intake, sends support chat messages, and receives local replies", async () => {
    vi.useFakeTimers();
    renderWidget("/app/documento/document-1/preview");

    fireEvent.click(screen.getByRole("button", { name: "Abrir ajuda" }));
    fireEvent.click(screen.getByRole("button", { name: "Falar com suporte" }));
    fireEvent.click(screen.getByRole("button", { name: "Anexar captura de tela" }));
    expect(screen.getByRole("button", { name: "Remover captura de tela" })).toBeInTheDocument();
    fireEvent.change(screen.getByRole("textbox", { name: "Descrição para o suporte" }), {
      target: { value: "Não consigo revisar o documento" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Iniciar chat" }));

    expect(screen.getByText(/Atendimento LD-DOCUMENT-PREVIEW/)).toBeInTheDocument();
    expect(
      screen.getByRole("img", { name: "Prévia da captura de tela anexada" }),
    ).toBeInTheDocument();
    expect(screen.getByText("Captura de tela")).toBeInTheDocument();
    expect(screen.getByText("Não consigo revisar o documento")).toBeInTheDocument();
    expect(screen.getByText(/Recebi sua solicitação/)).toBeInTheDocument();
    expect(screen.getByRole("textbox", { name: "Mensagem para o suporte" })).toBeInTheDocument();

    fireEvent.change(screen.getByRole("textbox", { name: "Mensagem para o suporte" }), {
      target: { value: "Aparece erro na prévia" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Enviar mensagem para o suporte" }));

    expect(screen.getByText("Aparece erro na prévia")).toBeInTheDocument();
    expect(screen.getByText("Suporte preparando resposta...")).toBeInTheDocument();

    await act(async () => {
      vi.advanceTimersByTime(450);
    });

    expect(screen.getByText(/Entendi o erro/)).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Voltar ao assistente" }));
    expect(screen.getByRole("textbox", { name: "Mensagem para ajuda" })).toBeInTheDocument();
  });

  it("adds current-session support requests to history", () => {
    renderWidget("/app/processo/process-1");

    fireEvent.click(screen.getByRole("button", { name: "Abrir ajuda" }));
    fireEvent.click(screen.getByRole("button", { name: "Falar com suporte" }));
    fireEvent.change(screen.getByRole("textbox", { name: "Descrição para o suporte" }), {
      target: { value: "Quero rever o que enviei antes" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Iniciar chat" }));
    fireEvent.click(screen.getByRole("button", { name: "Histórico" }));

    expect(screen.getByText("Meus atendimentos")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /Quero rever o que enviei antes/ }),
    ).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /Quero rever o que enviei antes/ }));
    expect(screen.getByText("Quero rever o que enviei antes")).toBeInTheDocument();
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

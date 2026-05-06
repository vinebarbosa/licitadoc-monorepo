import { fireEvent, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it } from "vitest";
import { renderWithProviders } from "@/test/render";
import { RequestAccessPage } from "./request-access-page";

describe("RequestAccessPage", () => {
  it("renders the migrated public request access route", () => {
    renderWithProviders(
      <MemoryRouter>
        <RequestAccessPage />
      </MemoryRouter>,
    );

    expect(screen.getByRole("heading", { name: "Solicite seu acesso" })).toBeInTheDocument();
    expect(screen.getByLabelText("Nome completo")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Solicitar acesso/ })).toBeDisabled();
  });

  it("shows the acknowledgement state after submission", async () => {
    renderWithProviders(
      <MemoryRouter>
        <RequestAccessPage />
      </MemoryRouter>,
    );

    fireEvent.change(screen.getByLabelText("Nome completo"), {
      target: { value: "Maria Silva" },
    });
    fireEvent.change(screen.getByLabelText("E-mail institucional"), {
      target: { value: "maria@licitadoc.test" },
    });
    fireEvent.change(screen.getByLabelText("Telefone"), {
      target: { value: "11999999999" },
    });
    fireEvent.change(screen.getByLabelText("Órgão ou entidade"), {
      target: { value: "Secretaria de Administração" },
    });
    fireEvent.change(screen.getByLabelText("Senha"), {
      target: { value: "senha-segura" },
    });
    fireEvent.change(screen.getByLabelText("Confirmar senha"), {
      target: { value: "senha-segura" },
    });
    fireEvent.click(screen.getByLabelText(/Li e concordo/));
    fireEvent.click(screen.getByRole("button", { name: /Solicitar acesso/ }));

    await waitFor(() => {
      expect(screen.getByRole("heading", { name: "Solicitação enviada" })).toBeInTheDocument();
    });

    expect(screen.getByRole("link", { name: /Voltar para o login/ })).toHaveAttribute(
      "href",
      "/entrar",
    );
  });
});

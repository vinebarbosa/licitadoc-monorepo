import { screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it } from "vitest";
import { renderWithProviders } from "@/test/render";
import { LandingPage } from "./landing-page";

describe("LandingPage", () => {
  it("renders the migrated public landing page content", () => {
    renderWithProviders(
      <MemoryRouter>
        <LandingPage />
      </MemoryRouter>,
    );

    expect(
      screen.getByRole("heading", { name: "Documentos para Contratações Públicas" }),
    ).toBeInTheDocument();
    expect(screen.getByText("Conforme a Lei 14.133/2021")).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "Tudo que você precisa para suas contratações" }),
    ).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Como funciona" })).toBeInTheDocument();
    expect(screen.getByText("Desenvolvido para o setor público brasileiro")).toBeInTheDocument();
  });

  it("keeps public navigation and CTAs without a theme switch", () => {
    renderWithProviders(
      <MemoryRouter>
        <LandingPage />
      </MemoryRouter>,
    );

    expect(screen.getAllByRole("link", { name: "Funcionalidades" })[0]).toHaveAttribute(
      "href",
      "#funcionalidades",
    );
    expect(screen.getByRole("link", { name: "Entrar" })).toHaveAttribute("href", "/entrar");
    expect(screen.getAllByRole("link", { name: /Solicitar Acesso/ })[0]).toHaveAttribute(
      "href",
      "/cadastro",
    );
    expect(screen.queryByRole("switch", { name: "Alternar modo escuro" })).not.toBeInTheDocument();
    expect(screen.queryByText("Claro")).not.toBeInTheDocument();
    expect(screen.queryByText("Escuro")).not.toBeInTheDocument();
  });
});

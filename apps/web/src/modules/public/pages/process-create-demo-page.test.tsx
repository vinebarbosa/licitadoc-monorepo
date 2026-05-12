import { fireEvent, screen, within } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it } from "vitest";
import { renderWithProviders } from "@/test/render";
import { ProcessCreateDemoPage } from "./process-create-demo-page";

function renderDemoPage() {
  return renderWithProviders(
    <MemoryRouter>
      <ProcessCreateDemoPage />
    </MemoryRouter>,
  );
}

describe("ProcessCreateDemoPage", () => {
  it("renders the desktop stepper as an unframed horizontal timeline", () => {
    renderDemoPage();

    const stepper = screen.getByTestId("process-creation-stepper");

    expect(stepper.tagName).toBe("OL");
    expect(stepper).not.toHaveClass("border");
    expect(stepper).not.toHaveClass("shadow");
    expect(stepper).not.toHaveClass("rounded-lg");
    expect(within(stepper).getByText("Dados do Processo")).toBeInTheDocument();
    expect(within(stepper).getByText("Vínculos")).toBeInTheDocument();
    expect(within(stepper).getByText("Itens")).toBeInTheDocument();
    expect(within(stepper).getByText("Revisão")).toBeInTheDocument();
    expect(stepper.querySelector('[aria-current="step"]')).toHaveTextContent("Dados do Processo");
  });

  it("does not allow choosing an organization in the links step", () => {
    renderDemoPage();

    fireEvent.click(screen.getByRole("button", { name: "Continuar" }));

    expect(screen.getByText("Vínculos Institucionais")).toBeInTheDocument();
    expect(screen.queryByRole("combobox", { name: "Organização" })).not.toBeInTheDocument();
    expect(screen.getByText("Unidades orçamentárias")).toBeInTheDocument();
  });

  it("does not show a description field for kits", () => {
    renderDemoPage();

    fireEvent.click(screen.getByRole("button", { name: "Continuar" }));
    fireEvent.click(screen.getByRole("button", { name: "Continuar" }));

    expect(screen.getByText("Kit Estação de Trabalho")).toBeInTheDocument();
    expect(screen.getAllByPlaceholderText("Descrição detalhada do item ou serviço")).toHaveLength(
      1,
    );
    expect(
      screen.queryByText("Kit completo para estação de trabalho com periféricos"),
    ).not.toBeInTheDocument();
  });
});

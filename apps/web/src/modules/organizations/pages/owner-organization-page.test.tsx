import { fireEvent, screen, waitFor } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { renderWithProviders } from "@/test/render";
import { OwnerOrganizationPage } from "./owner-organization-page";

async function openTab(name: RegExp | string) {
  const tab = await screen.findByRole("tab", { name });

  fireEvent.click(tab);
}

describe("OwnerOrganizationPage", () => {
  it("renders the v0 organization workspace with institutional overview and tabs", async () => {
    renderWithProviders(<OwnerOrganizationPage />);

    expect(
      await screen.findByRole("heading", {
        name: "Prefeitura de São Benedito do Rio Preto",
      }),
    ).toBeInTheDocument();
    expect(screen.getAllByText("Município de São Benedito do Rio Preto").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Membros ativos").length).toBeGreaterThan(0);
    expect(screen.getByText("Convites pendentes")).toBeInTheDocument();
    expect(screen.getByText("Prefeito: João Carlos Pereira Sousa")).toBeInTheDocument();
    expect(screen.queryByText("Autoridade máxima")).not.toBeInTheDocument();
    expect(screen.getByRole("tab", { name: "Dados da Prefeitura" })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: /Membros & Convites/ })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: "Departamentos" })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: "Documentos" })).toBeInTheDocument();
  });

  it("persists prefeitura profile data through the API", async () => {
    renderWithProviders(<OwnerOrganizationPage />);

    await screen.findByRole("heading", { name: "Prefeitura de São Benedito do Rio Preto" });
    fireEvent.click(screen.getByRole("button", { name: "Editar" }));
    fireEvent.change(screen.getByLabelText("Nome fantasia"), {
      target: { value: "Prefeitura de Fortaleza" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Cancelar" }));

    expect(screen.queryByDisplayValue("Prefeitura de Fortaleza")).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Editar" }));
    fireEvent.change(screen.getByLabelText("Nome fantasia"), {
      target: { value: "Prefeitura de Fortaleza" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Salvar alterações" }));

    await waitFor(() => {
      expect(screen.getByText(/Dados salvos às/)).toBeInTheDocument();
    });
    expect(screen.getByRole("heading", { name: "Prefeitura de Fortaleza" })).toBeInTheDocument();
  });

  it("shows the v0 members and invites workflow with local filtering and invite actions", async () => {
    renderWithProviders(<OwnerOrganizationPage />);

    await openTab(/Membros & Convites/);

    expect(screen.getByText("luciana.porto@saobeneditoriopreto.ma.gov.br")).toBeInTheDocument();
    expect(screen.getAllByText("Pendente").length).toBeGreaterThan(0);

    fireEvent.change(screen.getByLabelText("Buscar por nome ou e-mail"), {
      target: { value: "Patrícia" },
    });
    expect(screen.getByText("Patrícia Mendes Lima")).toBeInTheDocument();
    expect(screen.queryByText("Marcos Aurélio Ribeiro")).not.toBeInTheDocument();

    fireEvent.change(screen.getByLabelText("Buscar por nome ou e-mail"), {
      target: { value: "" },
    });
    fireEvent.click(screen.getAllByRole("button", { name: "Cancelar" })[0]);

    await waitFor(() => {
      expect(
        screen.queryByText("luciana.porto@saobeneditoriopreto.ma.gov.br"),
      ).not.toBeInTheDocument();
    });
  });

  it("creates departments through the API with required responsible data", async () => {
    renderWithProviders(<OwnerOrganizationPage />);

    await openTab("Departamentos");
    fireEvent.click(screen.getByRole("button", { name: "Novo departamento" }));
    fireEvent.click(screen.getByRole("button", { name: "Criar departamento" }));

    expect(screen.getByText("Nome é obrigatório")).toBeInTheDocument();
    expect(
      screen.getByText("O responsável é obrigatório ao criar o departamento"),
    ).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText(/Nome do departamento/), {
      target: { value: "Secretaria de Saúde" },
    });
    fireEvent.change(screen.getByLabelText(/^Responsável/), {
      target: { value: "Ana Souza" },
    });
    fireEvent.change(screen.getByLabelText(/Cargo do responsável/), {
      target: { value: "Secretária Municipal de Saúde" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Criar departamento" }));

    await waitFor(() => {
      expect(screen.getByText("Secretaria de Saúde")).toBeInTheDocument();
    });
    expect(screen.getByText("secretaria-de-saude")).toBeInTheDocument();
    expect(screen.getByText("Ana Souza")).toBeInTheDocument();
    expect(screen.getByText(/Secretária Municipal de Saúde/)).toBeInTheDocument();
  });

  it("uploads institutional document assets through the API", async () => {
    renderWithProviders(<OwnerOrganizationPage />);

    await openTab("Documentos");
    const file = new File(["papel"], "papel.docx", {
      type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    });

    fireEvent.change(screen.getByLabelText("Papel Timbrado"), {
      target: { files: [file] },
    });

    await waitFor(() => {
      expect(screen.getByText("Papel Timbrado")).toBeInTheDocument();
    });
    expect(screen.getByText(/Papel timbrado cadastrado/)).toBeInTheDocument();
  });
});

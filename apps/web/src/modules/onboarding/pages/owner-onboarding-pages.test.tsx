import { QueryClientProvider } from "@tanstack/react-query";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { HttpResponse, http } from "msw";
import type { ReactElement } from "react";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { createQueryClient } from "@/app/query-client";
import { ThemeProvider } from "@/app/theme";
import { server } from "@/test/msw/server";
import { OwnerOrganizationOnboardingPage } from "./owner-organization-onboarding-page";
import { OwnerProfileOnboardingPage } from "./owner-profile-onboarding-page";

const navigateMock = vi.fn();

vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual<typeof import("react-router-dom")>("react-router-dom");

  return {
    ...actual,
    useNavigate: () => navigateMock,
  };
});

function renderOnboardingPage(ui: ReactElement) {
  const queryClient = createQueryClient();

  return render(
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <MemoryRouter>{ui}</MemoryRouter>
      </ThemeProvider>
    </QueryClientProvider>,
  );
}

describe("owner onboarding pages", () => {
  beforeEach(() => {
    navigateMock.mockReset();
  });

  it("submits profile onboarding and navigates to organization setup", async () => {
    server.use(
      http.post("http://localhost:3333/api/users/me/onboarding/profile", async ({ request }) => {
        const body = (await request.json()) as { name: string };

        return HttpResponse.json({
          id: "owner-1",
          name: body.name,
          email: "owner@licitadoc.test",
          emailVerified: false,
          image: null,
          role: "organization_owner",
          organizationId: null,
          onboardingStatus: "pending_organization",
          createdAt: "2026-04-25T00:00:00.000Z",
          updatedAt: "2026-04-25T00:00:00.000Z",
        });
      }),
    );

    renderOnboardingPage(<OwnerProfileOnboardingPage />);

    fireEvent.change(screen.getByLabelText("Nome"), {
      target: { value: "Maria Silva" },
    });
    fireEvent.change(screen.getByLabelText("Nova senha"), {
      target: { value: "senha-segura" },
    });
    fireEvent.click(screen.getByRole("button", { name: /Continuar/ }));

    await waitFor(() => {
      expect(navigateMock).toHaveBeenCalledWith("/onboarding/organizacao", { replace: true });
    });
  });

  it("submits organization onboarding and navigates to the app", async () => {
    server.use(
      http.post("http://localhost:3333/api/organizations/", () => {
        return HttpResponse.json(
          {
            id: "organization-1",
            name: "Prefeitura de Exemplo",
            slug: "prefeitura-de-exemplo",
            officialName: "Prefeitura Municipal de Exemplo",
            cnpj: "12.345.678/0001-99",
            city: "Exemplo",
            state: "CE",
            address: "Rua Principal, 100",
            zipCode: "60000-000",
            phone: "(85) 3333-0000",
            institutionalEmail: "contato@exemplo.ce.gov.br",
            website: null,
            logoUrl: null,
            authorityName: "Maria Silva",
            authorityRole: "Prefeita",
            isActive: true,
            createdByUserId: "owner-1",
            createdAt: "2026-04-25T00:00:00.000Z",
            updatedAt: "2026-04-25T00:00:00.000Z",
          },
          { status: 201 },
        );
      }),
    );

    renderOnboardingPage(<OwnerOrganizationOnboardingPage />);

    fireEvent.change(screen.getByLabelText("Nome"), {
      target: { value: "Prefeitura de Exemplo" },
    });
    fireEvent.change(screen.getByLabelText("Nome oficial"), {
      target: { value: "Prefeitura Municipal de Exemplo" },
    });
    fireEvent.change(screen.getByLabelText("CNPJ"), {
      target: { value: "12.345.678/0001-99" },
    });
    fireEvent.change(screen.getByLabelText("Cidade"), {
      target: { value: "Exemplo" },
    });
    fireEvent.change(screen.getByLabelText("UF"), {
      target: { value: "ce" },
    });
    fireEvent.change(screen.getByLabelText("Endereço"), {
      target: { value: "Rua Principal, 100" },
    });
    fireEvent.change(screen.getByLabelText("CEP"), {
      target: { value: "60000-000" },
    });
    fireEvent.change(screen.getByLabelText("Telefone"), {
      target: { value: "(85) 3333-0000" },
    });
    fireEvent.change(screen.getByLabelText("E-mail institucional"), {
      target: { value: "contato@exemplo.ce.gov.br" },
    });
    fireEvent.change(screen.getByLabelText("Autoridade responsável"), {
      target: { value: "Maria Silva" },
    });
    fireEvent.change(screen.getByLabelText("Cargo"), {
      target: { value: "Prefeita" },
    });
    fireEvent.click(screen.getByRole("button", { name: /Concluir onboarding/ }));

    await waitFor(() => {
      expect(navigateMock).toHaveBeenCalledWith("/app", { replace: true });
    });
  });
});

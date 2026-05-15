import { fireEvent, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { renderWithProviders } from "@/test/render";
import { OwnerOrganizationOnboardingPage } from "./owner-organization-onboarding-page";
import { OwnerProfileOnboardingPage } from "./owner-profile-onboarding-page";

const navigateMock = vi.fn();
const profileMutateAsyncMock = vi.fn();
const organizationMutateAsyncMock = vi.fn();
const invalidateSessionMock = vi.fn();
const updateSessionUserAfterProfileMock = vi.fn();
const updateSessionUserAfterOrganizationMock = vi.fn();

vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual<typeof import("react-router-dom")>("react-router-dom");

  return {
    ...actual,
    useNavigate: () => navigateMock,
  };
});

vi.mock("@/modules/auth", async () => {
  const actual = await vi.importActual<typeof import("@/modules/auth")>("@/modules/auth");

  return {
    ...actual,
    useAuthSession: () => ({
      session: {
        session: {
          id: "session-1",
          token: "token",
          userId: "owner-1",
          expiresAt: new Date().toISOString(),
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
        user: {
          id: "owner-1",
          name: "Maria Gestora",
          email: "gestora@licitadoc.test",
          role: "organization_owner",
          organizationId: null,
          onboardingStatus: "pending_profile",
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      },
      role: "organization_owner",
      onboardingStatus: "pending_profile",
      isAuthenticated: true,
    }),
  };
});

vi.mock("../api/use-owner-onboarding", () => ({
  invalidateSession: (...args: unknown[]) => invalidateSessionMock(...args),
  updateSessionUserAfterProfile: (...args: unknown[]) => updateSessionUserAfterProfileMock(...args),
  updateSessionUserAfterOrganization: (...args: unknown[]) =>
    updateSessionUserAfterOrganizationMock(...args),
  useCompleteOwnerProfile: () => ({
    isPending: false,
    mutateAsync: (...args: unknown[]) => profileMutateAsyncMock(...args),
  }),
  useCompleteOwnerOrganization: () => ({
    isPending: false,
    mutateAsync: (...args: unknown[]) => organizationMutateAsyncMock(...args),
  }),
}));

describe("Owner onboarding pages", () => {
  beforeEach(() => {
    navigateMock.mockReset();
    profileMutateAsyncMock.mockReset();
    organizationMutateAsyncMock.mockReset();
    invalidateSessionMock.mockReset();
    updateSessionUserAfterProfileMock.mockReset();
    updateSessionUserAfterOrganizationMock.mockReset();
    invalidateSessionMock.mockResolvedValue(undefined);
  });

  it("submits the owner profile step and navigates to organization onboarding", async () => {
    profileMutateAsyncMock.mockResolvedValue({
      id: "owner-1",
      name: "Maria Gestora",
      email: "gestora@licitadoc.test",
      role: "organization_owner",
      organizationId: null,
      onboardingStatus: "pending_organization",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    renderWithProviders(
      <MemoryRouter>
        <OwnerProfileOnboardingPage />
      </MemoryRouter>,
    );

    fireEvent.change(screen.getByLabelText("Nome completo"), {
      target: { value: "Maria Gestora" },
    });
    fireEvent.change(screen.getByLabelText("Nova senha"), {
      target: { value: "SenhaSegura123!" },
    });
    fireEvent.change(screen.getByLabelText("Confirmar nova senha"), {
      target: { value: "SenhaSegura123!" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Continuar" }));

    await waitFor(() => {
      expect(profileMutateAsyncMock).toHaveBeenCalledWith({
        data: {
          name: "Maria Gestora",
          password: "SenhaSegura123!",
        },
      });
      expect(navigateMock).toHaveBeenCalledWith("/onboarding/organizacao", { replace: true });
    });
  });

  it("submits the owner organization step and navigates to completion", async () => {
    organizationMutateAsyncMock.mockResolvedValue({
      id: "organization-1",
      name: "Prefeitura de Fortaleza",
    });

    renderWithProviders(
      <MemoryRouter>
        <OwnerOrganizationOnboardingPage />
      </MemoryRouter>,
    );

    fireEvent.change(screen.getByLabelText("Nome da organização *"), {
      target: { value: "Prefeitura de Fortaleza" },
    });
    fireEvent.change(screen.getByLabelText("Identificador (slug)"), {
      target: { value: "prefeitura-de-fortaleza" },
    });
    fireEvent.change(screen.getByLabelText("Nome oficial *"), {
      target: { value: "Município de Fortaleza" },
    });
    fireEvent.change(screen.getByLabelText("CNPJ *"), {
      target: { value: "12.345.678/0001-90" },
    });
    fireEvent.change(screen.getByLabelText("Cidade *"), {
      target: { value: "Fortaleza" },
    });
    fireEvent.click(screen.getByRole("combobox", { name: "UF *" }));
    fireEvent.click(screen.getByRole("option", { name: "CE" }));
    fireEvent.change(screen.getByLabelText("Endereço *"), {
      target: { value: "Rua Exemplo, 123" },
    });
    fireEvent.change(screen.getByLabelText("CEP *"), {
      target: { value: "60000-000" },
    });
    fireEvent.change(screen.getByLabelText("Telefone *"), {
      target: { value: "(85) 3333-0000" },
    });
    fireEvent.change(screen.getByLabelText("E-mail institucional *"), {
      target: { value: "contato@fortaleza.ce.gov.br" },
    });
    fireEvent.change(screen.getByLabelText("Nome da autoridade *"), {
      target: { value: "Maria Gestora" },
    });
    fireEvent.change(screen.getByLabelText("Cargo *"), {
      target: { value: "Prefeita" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Finalizar configuração" }));

    await waitFor(() => {
      expect(organizationMutateAsyncMock).toHaveBeenCalledWith({
        data: {
          name: "Prefeitura de Fortaleza",
          slug: "prefeitura-de-fortaleza",
          officialName: "Município de Fortaleza",
          cnpj: "12.345.678/0001-90",
          city: "Fortaleza",
          state: "CE",
          address: "Rua Exemplo, 123",
          zipCode: "60000-000",
          phone: "(85) 3333-0000",
          institutionalEmail: "contato@fortaleza.ce.gov.br",
          website: null,
          logoUrl: null,
          authorityName: "Maria Gestora",
          authorityRole: "Prefeita",
        },
      });
      expect(navigateMock).toHaveBeenCalledWith("/onboarding/concluido", {
        replace: true,
        state: { organizationName: "Prefeitura de Fortaleza" },
      });
    });
  });
});

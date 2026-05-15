import { fireEvent, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { renderWithProviders } from "@/test/render";
import { MemberProfileOnboardingPage } from "./member-profile-onboarding-page";

const navigateMock = vi.fn();
const mutateAsyncMock = vi.fn();
const invalidateSessionMock = vi.fn();
const updateSessionUserAfterProfileMock = vi.fn();

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
          userId: "member-1",
          expiresAt: new Date().toISOString(),
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
        user: {
          id: "member-1",
          name: "Maria Convidada",
          email: "maria@licitadoc.test",
          role: "member",
          organizationId: "organization-1",
          onboardingStatus: "pending_profile",
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      },
      role: "member",
      onboardingStatus: "pending_profile",
      isAuthenticated: true,
    }),
  };
});

vi.mock("../api/use-owner-onboarding", () => ({
  invalidateSession: (...args: unknown[]) => invalidateSessionMock(...args),
  updateSessionUserAfterProfile: (...args: unknown[]) => updateSessionUserAfterProfileMock(...args),
  useCompleteOwnerProfile: () => ({
    isPending: false,
    mutateAsync: (...args: unknown[]) => mutateAsyncMock(...args),
  }),
}));

describe("Member onboarding pages", () => {
  beforeEach(() => {
    navigateMock.mockReset();
    mutateAsyncMock.mockReset();
    invalidateSessionMock.mockReset();
    updateSessionUserAfterProfileMock.mockReset();
    invalidateSessionMock.mockResolvedValue(undefined);
  });

  it("submits the member profile step and navigates to completion", async () => {
    mutateAsyncMock.mockResolvedValue({
      id: "member-1",
      name: "Maria da Silva",
      email: "maria@licitadoc.test",
      role: "member",
      organizationId: "organization-1",
      onboardingStatus: "complete",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    renderWithProviders(
      <MemoryRouter>
        <MemberProfileOnboardingPage />
      </MemoryRouter>,
    );

    fireEvent.change(screen.getByLabelText("Nome completo"), {
      target: { value: "Maria da Silva" },
    });
    fireEvent.change(screen.getByLabelText("Nova senha"), {
      target: { value: "SenhaSegura123!" },
    });
    fireEvent.change(screen.getByLabelText("Confirmar nova senha"), {
      target: { value: "SenhaSegura123!" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Continuar" }));

    await waitFor(() => {
      expect(mutateAsyncMock).toHaveBeenCalledWith({
        data: {
          name: "Maria da Silva",
          password: "SenhaSegura123!",
        },
      });
      expect(navigateMock).toHaveBeenCalledWith("/onboarding/concluido", { replace: true });
    });
  });
});

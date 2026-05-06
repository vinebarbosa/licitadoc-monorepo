import { QueryClientProvider } from "@tanstack/react-query";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { HttpResponse, http } from "msw";
import type { ReactElement } from "react";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { createQueryClient } from "@/app/query-client";
import { ThemeProvider } from "@/app/theme";
import { server } from "@/test/msw/server";
import { MemberProfileOnboardingPage } from "./member-profile-onboarding-page";

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

describe("member onboarding pages", () => {
  beforeEach(() => {
    navigateMock.mockReset();
  });

  it("renders the profile completion form", () => {
    renderOnboardingPage(<MemberProfileOnboardingPage />);

    expect(screen.getByText("Bem-vindo ao LicitaDoc")).toBeInTheDocument();
    expect(screen.getByLabelText("Nome")).toBeInTheDocument();
    expect(screen.getByLabelText("Nova senha")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Acessar o sistema/ })).toBeInTheDocument();
  });

  it("submits profile onboarding and navigates to app", async () => {
    server.use(
      http.post("http://localhost:3333/api/users/me/onboarding/profile", async ({ request }) => {
        const body = (await request.json()) as { name: string };

        return HttpResponse.json({
          id: "member-1",
          name: body.name,
          email: "member@licitadoc.test",
          emailVerified: false,
          image: null,
          role: "member",
          organizationId: "org-1",
          onboardingStatus: "complete",
          createdAt: "2026-04-25T00:00:00.000Z",
          updatedAt: "2026-04-25T00:00:00.000Z",
        });
      }),
    );

    renderOnboardingPage(<MemberProfileOnboardingPage />);

    fireEvent.change(screen.getByLabelText("Nome"), {
      target: { value: "João Membro" },
    });
    fireEvent.change(screen.getByLabelText("Nova senha"), {
      target: { value: "nova-senha-segura" },
    });
    fireEvent.click(screen.getByRole("button", { name: /Acessar o sistema/ }));

    await waitFor(() => {
      expect(navigateMock).toHaveBeenCalledWith("/app", { replace: true });
    });
  });

  it("shows an error message when profile completion fails due to a network error", async () => {
    server.use(
      http.post("http://localhost:3333/api/users/me/onboarding/profile", () => {
        return HttpResponse.error();
      }),
    );

    renderOnboardingPage(<MemberProfileOnboardingPage />);

    fireEvent.change(screen.getByLabelText("Nome"), {
      target: { value: "João Membro" },
    });
    fireEvent.change(screen.getByLabelText("Nova senha"), {
      target: { value: "nova-senha-segura" },
    });
    fireEvent.click(screen.getByRole("button", { name: /Acessar o sistema/ }));

    await waitFor(() => {
      expect(screen.getByRole("alert")).toBeInTheDocument();
    });

    expect(navigateMock).not.toHaveBeenCalled();
  });
});

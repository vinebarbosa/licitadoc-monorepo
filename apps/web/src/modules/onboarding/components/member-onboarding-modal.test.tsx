import { QueryClientProvider } from "@tanstack/react-query";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { HttpResponse, http } from "msw";
import { describe, expect, it } from "vitest";
import { createQueryClient } from "@/app/query-client";
import { ThemeProvider } from "@/app/theme";
import { authenticatedSessionResponse } from "@/test/msw/fixtures";
import { server } from "@/test/msw/server";
import { MemberOnboardingModal } from "./member-onboarding-modal";

function renderModal() {
  const queryClient = createQueryClient();

  return render(
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <MemberOnboardingModal />
      </ThemeProvider>
    </QueryClientProvider>,
  );
}

function pendingMemberSession() {
  return {
    ...authenticatedSessionResponse,
    user: {
      ...authenticatedSessionResponse.user,
      role: "member",
      onboardingStatus: "pending_profile",
    },
  };
}

describe("MemberOnboardingModal", () => {
  it("renders for pending members and has no close action", async () => {
    server.use(
      http.get("http://localhost:3333/api/auth/get-session", () => {
        return HttpResponse.json(pendingMemberSession());
      }),
    );

    renderModal();

    expect(await screen.findByRole("dialog")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Complete seu cadastro" })).toBeInTheDocument();
    expect(screen.getByLabelText("Nome")).toBeInTheDocument();
    expect(screen.getByLabelText("Nova senha")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Close" })).not.toBeInTheDocument();
  });

  it("keeps the modal open when Escape is pressed", async () => {
    server.use(
      http.get("http://localhost:3333/api/auth/get-session", () => {
        return HttpResponse.json(pendingMemberSession());
      }),
    );

    renderModal();

    const dialog = await screen.findByRole("dialog");

    fireEvent.keyDown(dialog, { key: "Escape", code: "Escape" });

    expect(screen.getByRole("dialog")).toBeInTheDocument();
  });

  it("submits profile onboarding and closes after session state is complete", async () => {
    let completed = false;

    server.use(
      http.get("http://localhost:3333/api/auth/get-session", () => {
        return HttpResponse.json(
          completed
            ? {
                ...pendingMemberSession(),
                user: {
                  ...pendingMemberSession().user,
                  name: "João Membro",
                  onboardingStatus: "complete",
                },
              }
            : pendingMemberSession(),
        );
      }),
      http.post("http://localhost:3333/api/users/me/onboarding/profile", async ({ request }) => {
        const body = (await request.json()) as { name: string };

        completed = true;

        return HttpResponse.json({
          ...pendingMemberSession().user,
          name: body.name,
          image: null,
          emailVerified: false,
          onboardingStatus: "complete",
          createdAt: "2026-04-25T00:00:00.000Z",
          updatedAt: "2026-04-25T00:00:00.000Z",
        });
      }),
    );

    renderModal();

    fireEvent.change(await screen.findByLabelText("Nome"), {
      target: { value: "João Membro" },
    });
    fireEvent.change(screen.getByLabelText("Nova senha"), {
      target: { value: "nova-senha-segura" },
    });
    fireEvent.click(screen.getByRole("button", { name: /Concluir cadastro/ }));

    await waitFor(() => {
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    });
  });

  it("keeps the modal open and shows API errors", async () => {
    server.use(
      http.get("http://localhost:3333/api/auth/get-session", () => {
        return HttpResponse.json(pendingMemberSession());
      }),
      http.post("http://localhost:3333/api/users/me/onboarding/profile", () => {
        return HttpResponse.json(
          {
            error: "bad_request",
            message: "Temporary password has expired.",
            details: null,
          },
          { status: 400 },
        );
      }),
    );

    renderModal();

    fireEvent.change(await screen.findByLabelText("Nome"), {
      target: { value: "João Membro" },
    });
    fireEvent.change(screen.getByLabelText("Nova senha"), {
      target: { value: "nova-senha-segura" },
    });
    fireEvent.click(screen.getByRole("button", { name: /Concluir cadastro/ }));

    await waitFor(() => {
      expect(screen.getByRole("alert")).toHaveTextContent("Temporary password has expired.");
    });

    expect(screen.getByRole("dialog")).toBeInTheDocument();
  });

  it("does not render for completed members", async () => {
    server.use(
      http.get("http://localhost:3333/api/auth/get-session", () => {
        return HttpResponse.json(authenticatedSessionResponse);
      }),
    );

    renderModal();

    await waitFor(() => {
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    });
  });
});

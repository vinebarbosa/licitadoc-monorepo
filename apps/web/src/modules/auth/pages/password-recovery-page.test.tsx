import { fireEvent, screen, waitFor } from "@testing-library/react";
import { HttpResponse, http } from "msw";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it } from "vitest";
import { server } from "@/test/msw/server";
import { renderWithProviders } from "@/test/render";
import { PasswordRecoveryPage } from "./password-recovery-page";

describe("PasswordRecoveryPage", () => {
  it("renders the password recovery route", () => {
    renderWithProviders(
      <MemoryRouter>
        <PasswordRecoveryPage />
      </MemoryRouter>,
    );

    expect(screen.getByRole("heading", { name: "Recuperar senha" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Enviar instruções/ })).toBeInTheDocument();
  });

  it("shows a neutral confirmation after submitting the form", async () => {
    server.use(
      http.post("http://localhost:3333/api/auth/request-password-reset", () => {
        return HttpResponse.json({ status: true });
      }),
    );

    renderWithProviders(
      <MemoryRouter>
        <PasswordRecoveryPage />
      </MemoryRouter>,
    );

    fireEvent.change(screen.getByLabelText("E-mail"), {
      target: { value: "maria@licitadoc.test" },
    });
    fireEvent.click(screen.getByRole("button", { name: /Enviar instruções/ }));

    await waitFor(() => {
      expect(screen.getByRole("heading", { name: "E-mail enviado" })).toBeInTheDocument();
    });

    expect(screen.getByText(/Se o e-mail/)).toHaveTextContent("maria@licitadoc.test");
  });
});

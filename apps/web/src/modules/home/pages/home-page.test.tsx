import { screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { renderWithProviders } from "@/test/render";
import { HomePage } from "./home-page";

describe("HomePage", () => {
  it("renders current API and auth smoke state from mocked backend responses", async () => {
    renderWithProviders(<HomePage />);

    expect(screen.getByRole("heading", { name: "Licitadoc" })).toBeInTheDocument();
    expect(await screen.findByText("Health: ok")).toBeInTheDocument();
    expect(await screen.findByText("Session: sem sessao ativa")).toBeInTheDocument();
  });
});

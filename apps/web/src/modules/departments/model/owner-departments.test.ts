import { describe, expect, it } from "vitest";
import {
  createDepartmentSlug,
  getOwnerDepartmentErrorMessage,
  toOwnerDepartmentCreatePayload,
} from "./owner-departments";

describe("owner departments model", () => {
  it("generates stable slugs from department names", () => {
    expect(createDepartmentSlug(" Secretaria Municipal de Educação ")).toBe(
      "secretaria-municipal-de-educacao",
    );
    expect(createDepartmentSlug("Compras & Licitações 2026")).toBe("compras-licitacoes-2026");
  });

  it("maps create form values into API payloads", () => {
    expect(
      toOwnerDepartmentCreatePayload({
        name: " Secretaria de Saúde ",
        slug: " secretaria-de-saude ",
        budgetUnitCode: " 07.001 ",
        responsibleName: " Ana Souza ",
        responsibleRole: " Secretária ",
      }),
    ).toEqual({
      name: "Secretaria de Saúde",
      slug: "secretaria-de-saude",
      budgetUnitCode: "07.001",
      responsibleName: "Ana Souza",
      responsibleRole: "Secretária",
    });

    expect(
      toOwnerDepartmentCreatePayload({
        name: " Secretaria de Cultura ",
        slug: "secretaria-de-cultura",
        budgetUnitCode: " ",
        responsibleName: " Lucas Silva ",
        responsibleRole: " Secretário ",
      }).budgetUnitCode,
    ).toBeNull();
  });

  it("extracts API error messages from direct and wrapped responses", () => {
    expect(getOwnerDepartmentErrorMessage({ message: "Slug já usado." })).toBe("Slug já usado.");
    expect(getOwnerDepartmentErrorMessage({ data: { message: "Código já usado." } })).toBe(
      "Código já usado.",
    );
    expect(getOwnerDepartmentErrorMessage(null)).toBe("Não foi possível criar o departamento.");
  });
});

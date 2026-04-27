import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import type { GeneratedDocumentType } from "../../shared/text-generation/types";

export type DocumentGenerationRecipe = {
  documentType: GeneratedDocumentType;
  instructions: string;
  template: string;
};

function readRecipeAsset(fileName: string) {
  const candidatePaths = [
    resolve(process.cwd(), "src/modules/documents/recipes", fileName),
    resolve(process.cwd(), "apps/api/src/modules/documents/recipes", fileName),
  ];

  for (const assetPath of candidatePaths) {
    if (existsSync(assetPath)) {
      return readFileSync(assetPath, "utf8").trim();
    }
  }

  throw new Error(`Document generation recipe asset not found: ${fileName}.`);
}

const dfdRecipe: DocumentGenerationRecipe = Object.freeze({
  documentType: "dfd",
  instructions: readRecipeAsset("dfd-instructions.md"),
  template: readRecipeAsset("dfd-template.md"),
});

const etpRecipe: DocumentGenerationRecipe = Object.freeze({
  documentType: "etp",
  instructions: readRecipeAsset("etp.instructions.md"),
  template: readRecipeAsset("etp.template.md"),
});

const trRecipe: DocumentGenerationRecipe = Object.freeze({
  documentType: "tr",
  instructions: readRecipeAsset("tr.instructions.md"),
  template: readRecipeAsset("tr.template.md"),
});

const minutaRecipe: DocumentGenerationRecipe = Object.freeze({
  documentType: "minuta",
  instructions: readRecipeAsset("minuta.instructions.md"),
  template: readRecipeAsset("minuta.template.md"),
});

export function resolveDocumentGenerationRecipe(
  documentType: GeneratedDocumentType,
): DocumentGenerationRecipe | null {
  if (documentType === "dfd") {
    return dfdRecipe;
  }

  if (documentType === "etp") {
    return etpRecipe;
  }

  if (documentType === "tr") {
    return trRecipe;
  }

  if (documentType === "minuta") {
    return minutaRecipe;
  }

  return null;
}

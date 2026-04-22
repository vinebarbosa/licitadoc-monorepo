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

export function resolveDocumentGenerationRecipe(
  documentType: GeneratedDocumentType,
): DocumentGenerationRecipe | null {
  if (documentType === "dfd") {
    return dfdRecipe;
  }

  return null;
}

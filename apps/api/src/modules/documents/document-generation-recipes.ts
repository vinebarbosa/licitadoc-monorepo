import { existsSync, readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import type { GeneratedDocumentType } from "../../shared/text-generation/types";

export type DocumentGenerationRecipe = {
  baseInstructions: string;
  documentInstructions: string;
  documentType: GeneratedDocumentType;
  instructions: string;
  template: string;
};

function readRecipeAsset(fileName: string) {
  const moduleDirectory = dirname(fileURLToPath(import.meta.url));
  const candidatePaths = [
    resolve(moduleDirectory, "recipes", fileName),
    resolve(process.cwd(), "dist/modules/documents/recipes", fileName),
    resolve(process.cwd(), "src/modules/documents/recipes", fileName),
    resolve(process.cwd(), "apps/api/dist/modules/documents/recipes", fileName),
    resolve(process.cwd(), "apps/api/src/modules/documents/recipes", fileName),
  ];

  for (const assetPath of candidatePaths) {
    if (existsSync(assetPath)) {
      return readFileSync(assetPath, "utf8").trim();
    }
  }

  throw new Error(`Document generation recipe asset not found: ${fileName}.`);
}

const baseWriterInstructions = readRecipeAsset("base-writer.instructions.md");

function createRecipe({
  documentType,
  instructionsFile,
  templateFile,
}: {
  documentType: GeneratedDocumentType;
  instructionsFile: string;
  templateFile: string;
}): DocumentGenerationRecipe {
  const documentInstructions = readRecipeAsset(instructionsFile);

  return Object.freeze({
    baseInstructions: baseWriterInstructions,
    documentInstructions,
    documentType,
    instructions: [baseWriterInstructions, documentInstructions].join("\n\n"),
    template: readRecipeAsset(templateFile),
  });
}

const dfdRecipe = createRecipe({
  documentType: "dfd",
  instructionsFile: "dfd-instructions.md",
  templateFile: "dfd-template.md",
});

const etpRecipe = createRecipe({
  documentType: "etp",
  instructionsFile: "etp.instructions.md",
  templateFile: "etp.template.md",
});

const trRecipe = createRecipe({
  documentType: "tr",
  instructionsFile: "tr.instructions.md",
  templateFile: "tr.template.md",
});

const minutaRecipe = createRecipe({
  documentType: "minuta",
  instructionsFile: "minuta.instructions.md",
  templateFile: "minuta.template.md",
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

import { cpSync, existsSync, mkdirSync } from "node:fs";
import path from "node:path";
import { defineConfig } from "tsup";

function copyRuntimeAssets() {
  const recipeSourceDir = path.resolve("src/modules/documents/recipes");
  const recipeTargetDir = path.resolve("dist/modules/documents/recipes");

  if (!existsSync(recipeSourceDir)) {
    return;
  }

  mkdirSync(path.dirname(recipeTargetDir), { recursive: true });
  cpSync(recipeSourceDir, recipeTargetDir, { recursive: true });
}

export default defineConfig({
  bundle: true,
  clean: true,
  dts: false,
  entry: ["src/app/server.ts"],
  format: ["esm"],
  minify: false,
  onSuccess: async () => {
    copyRuntimeAssets();
  },
  outDir: "dist",
  platform: "node",
  shims: true,
  skipNodeModulesBundle: true,
  sourcemap: true,
  splitting: false,
  target: "node24",
});

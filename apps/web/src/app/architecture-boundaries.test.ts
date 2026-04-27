import { describe, expect, it } from "vitest";

const sourceModules = import.meta.glob("../**/*.{ts,tsx}", {
  eager: true,
  import: "default",
  query: "?raw",
});

const runtimeSources = Object.entries(sourceModules).filter(
  ([path]) => !path.endsWith(".test.tsx"),
);

describe("frontend architecture boundaries", () => {
  it("does not import runtime code from temporary migration sources or legacy UI aliases", () => {
    const forbiddenImportPattern =
      /from\s+["'](?:tmp|tmp\/web|@\/components(?:\/ui)?)(?:\/[^"']*)?["']|import\(\s*["'](?:tmp|tmp\/web|@\/components(?:\/ui)?)(?:\/[^"']*)?["']\s*\)/;

    const offenders = runtimeSources
      .filter(([, source]) => forbiddenImportPattern.test(String(source)))
      .map(([path]) => path);

    expect(offenders).toEqual([]);
  });

  it("keeps generated API client imports inside module api boundaries", () => {
    const offenders = runtimeSources
      .filter(([path, source]) => {
        if (!String(source).includes("@licitadoc/api-client")) {
          return false;
        }

        return !path.includes("/modules/") || !path.includes("/api/");
      })
      .map(([path]) => path);

    expect(offenders).toEqual([]);
  });

  it("does not import another module private folder through the app alias", () => {
    const privateModuleImportPattern = /@\/modules\/[^"']+\/(?:api|model|ui|pages)(?:\/[^"']*)?/;

    const offenders = runtimeSources
      .filter(([, source]) => privateModuleImportPattern.test(String(source)))
      .map(([path]) => path);

    expect(offenders).toEqual([]);
  });
});

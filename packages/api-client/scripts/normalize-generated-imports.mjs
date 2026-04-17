import { readdir, readFile, stat, writeFile } from "node:fs/promises";
import path from "node:path";

const rootDir = path.resolve(process.cwd(), "src/gen");

async function collectTsFiles(dir) {
  const entries = await readdir(dir, { withFileTypes: true });
  const files = [];

  for (const entry of entries) {
    const entryPath = path.join(dir, entry.name);

    if (entry.isDirectory()) {
      files.push(...(await collectTsFiles(entryPath)));
      continue;
    }

    if (entry.isFile() && entry.name.endsWith(".ts")) {
      files.push(entryPath);
    }
  }

  return files;
}

async function normalizeFile(filePath) {
  const current = await readFile(filePath, "utf8");
  const next = current
    .replace(/\.ts"/g, '"')
    .replace(/\.ts'/g, "'")
    .replace(/return ([A-Za-z0-9_]+)\(\s*\{\s*data\s*\}, config\);/gs, "return $1(data, config);")
    .replace(
      /return ([A-Za-z0-9_]+)\(\s*\{\s*([^{}]+?)\s*,\s*data\s*\}, config\);/gs,
      "return $1({ $2 }, data, config);",
    )
    .replace(
      /return ([A-Za-z0-9_]+)\(\s*\{\s*params:\s*params\s*\},\s*\{\s*\.\.\.config,\s*signal:\s*config\.signal\s*\?\?\s*signal\s*\},\s*\);/gs,
      "return $1(params, { ...config, signal: config.signal ?? signal });",
    )
    .replace(
      /return ([A-Za-z0-9_]+)\(\s*\{\s*([^{}]+?)\s*,\s*params:\s*params\s*\},\s*\{\s*\.\.\.config,\s*signal:\s*config\.signal\s*\?\?\s*signal\s*\},\s*\);/gs,
      "return $1({ $2 }, params, { ...config, signal: config.signal ?? signal });",
    );

  if (next !== current) {
    await writeFile(filePath, next, "utf8");
  }
}

async function main() {
  const stats = await stat(rootDir);

  if (!stats.isDirectory()) {
    throw new Error(`Expected generated directory at ${rootDir}`);
  }

  const files = await collectTsFiles(rootDir);
  await Promise.all(files.map(normalizeFile));
}

await main();

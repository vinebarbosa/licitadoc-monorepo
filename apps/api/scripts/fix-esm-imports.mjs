import { existsSync, readdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import path from "node:path";

const distDir = path.resolve("dist");

function listJavaScriptFiles(directory) {
  return readdirSync(directory).flatMap((entry) => {
    const entryPath = path.join(directory, entry);
    const stats = statSync(entryPath);

    if (stats.isDirectory()) {
      return listJavaScriptFiles(entryPath);
    }

    return entryPath.endsWith(".js") ? [entryPath] : [];
  });
}

function hasRuntimeExtension(specifier) {
  return /\.(cjs|mjs|js|json|node)$/.test(specifier);
}

function resolveRuntimeSpecifier(filePath, specifier) {
  if (!specifier.startsWith(".") || hasRuntimeExtension(specifier)) {
    return specifier;
  }

  const absoluteTarget = path.resolve(path.dirname(filePath), specifier);

  if (existsSync(`${absoluteTarget}.js`)) {
    return `${specifier}.js`;
  }

  if (existsSync(path.join(absoluteTarget, "index.js"))) {
    return `${specifier.replace(/\/$/, "")}/index.js`;
  }

  return specifier;
}

function rewriteSpecifiers(filePath, source) {
  const rewrite = (match, prefix, specifier, suffix) => {
    return `${prefix}${resolveRuntimeSpecifier(filePath, specifier)}${suffix}`;
  };

  return source
    .replace(/(from\s+["'])(\.[^"']+)(["'])/g, rewrite)
    .replace(/(import\s+["'])(\.[^"']+)(["'])/g, rewrite)
    .replace(/(import\s*\(\s*["'])(\.[^"']+)(["']\s*\))/g, rewrite);
}

for (const filePath of listJavaScriptFiles(distDir)) {
  const source = readFileSync(filePath, "utf8");
  const rewritten = rewriteSpecifiers(filePath, source);

  if (rewritten !== source) {
    writeFileSync(filePath, rewritten);
  }
}

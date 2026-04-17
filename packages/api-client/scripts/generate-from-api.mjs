import { spawn } from "node:child_process";
import path from "node:path";
import process from "node:process";

const apiDir = path.resolve(process.cwd(), "../../apps/api");
const apiUrl = "http://127.0.0.1:3333/openapi.json";

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function isApiReady() {
  try {
    const response = await fetch(apiUrl);
    return response.ok;
  } catch {
    return false;
  }
}

async function waitForApiReady(timeoutMs = 15000) {
  const startedAt = Date.now();

  while (Date.now() - startedAt < timeoutMs) {
    if (await isApiReady()) {
      return;
    }

    await sleep(300);
  }

  throw new Error(`Timed out waiting for API OpenAPI endpoint at ${apiUrl}`);
}

function runCommand(command, args, options = {}) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      stdio: "inherit",
      shell: false,
      ...options,
    });

    child.on("exit", (code) => {
      if (code === 0) {
        resolve();
        return;
      }

      reject(new Error(`${command} ${args.join(" ")} exited with code ${code}`));
    });

    child.on("error", reject);
  });
}

async function main() {
  let apiProcess;
  let startedLocally = false;

  try {
    if (!(await isApiReady())) {
      startedLocally = true;
      apiProcess = spawn("node", ["--import", "tsx", "src/app/server.ts"], {
        cwd: apiDir,
        stdio: "inherit",
      });

      await waitForApiReady();
    }

    await runCommand("pnpm", ["exec", "kubb", "generate", "--config", "kubb.config.ts"], {
      cwd: process.cwd(),
    });

    await runCommand("node", ["./scripts/normalize-generated-imports.mjs"], {
      cwd: process.cwd(),
    });
  } finally {
    if (startedLocally && apiProcess && !apiProcess.killed) {
      apiProcess.kill("SIGTERM");
    }
  }
}

await main();

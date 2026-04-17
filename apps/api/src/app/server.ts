import { buildApp } from "./build-app";

async function start() {
  const app = await buildApp();
  const host = app.config.HOST;
  const port = app.config.PORT;

  try {
    await app.listen({ host, port });
    app.log.info(`API listening on http://${host}:${port}`);
  } catch (error) {
    app.log.error(error);
    process.exit(1);
  }
}

void start();

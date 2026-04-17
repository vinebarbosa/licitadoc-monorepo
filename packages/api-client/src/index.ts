export type {
  Client,
  RequestConfig,
  ResponseConfig,
  ResponseErrorConfig,
} from "./client";
export { client } from "./client";
export * from "./gen";

/**
 * Arquivos gerados pelo Kubb serão escritos em `src/gen`.
 * Hooks TanStack Query serão gerados em `src/gen/hooks`.
 * Depois de instalar as dependências, rode `pnpm --filter @licitadoc/api-client generate`.
 */

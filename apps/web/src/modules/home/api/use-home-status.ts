import { useGetHealth, useGetSession } from "@licitadoc/api-client";

export function useHomeStatus() {
  const health = useGetHealth();
  const session = useGetSession();

  return {
    health,
    session,
  };
}

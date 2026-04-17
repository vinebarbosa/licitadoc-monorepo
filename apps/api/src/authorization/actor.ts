import type { Role } from "./roles";

export type Actor = {
  id: string;
  role: Role;
  organizationId: string | null;
};

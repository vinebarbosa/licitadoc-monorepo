import { eq } from "drizzle-orm";
import type { FastifyInstance } from "fastify";
import type { Actor } from "../../authorization/actor";
import { users } from "../../db";

export async function getSupportActorName({
  actor,
  db,
}: {
  actor: Actor;
  db: FastifyInstance["db"];
}) {
  const user = await db.query.users.findFirst({
    columns: {
      id: true,
      name: true,
    },
    where: eq(users.id, actor.id),
  });

  return user?.name ?? (actor.role === "admin" ? "Suporte LicitaDoc" : "Usuario");
}

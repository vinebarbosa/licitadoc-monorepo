import type { FastifyInstance } from "fastify";
import type { Actor } from "../../authorization/actor";

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
    where: (table, { eq }) => eq(table.id, actor.id),
  });

  return user?.name ?? (actor.role === "admin" ? "Suporte LicitaDoc" : "Usuario");
}

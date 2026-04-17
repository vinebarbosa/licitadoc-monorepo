import fp from "fastify-plugin";

export const registerSecurityPlugin = fp(async (app) => {
  app.addHook("onSend", async (_, reply, payload) => {
    reply.header("x-content-type-options", "nosniff");
    reply.header("x-frame-options", "DENY");
    reply.header("referrer-policy", "no-referrer");

    return payload;
  });
});

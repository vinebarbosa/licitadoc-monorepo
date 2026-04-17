import { useGetHealth, useGetSession } from "@licitadoc/api-client";

export function HomePage() {
  const health = useGetHealth();
  const session = useGetSession();

  return (
    <section className="grid gap-6">
      <div className="w-fit rounded-full border border-[rgba(29,36,51,0.12)] bg-white/60 px-3.5 py-2 text-sm backdrop-blur-sm">
        Monorepo conectado ao api-client
      </div>
      <h1 className="m-0 text-[clamp(3rem,9vw,6rem)] leading-[0.95] tracking-[-0.06em] text-[#1d2433]">
        Licitadoc
      </h1>
      <p className="m-0 max-w-[640px] text-[1.05rem] text-[#6d7688]">
        Frontend em Vite com React Router consumindo hooks gerados pelo Kubb.
      </p>
      <div className="mt-2 grid grid-cols-[repeat(auto-fit,minmax(220px,1fr))] gap-4">
        <article className="rounded-[24px] border border-[rgba(29,36,51,0.12)] bg-white/72 p-5 backdrop-blur-xl">
          <h2 className="mb-2 text-lg font-semibold text-[#1d2433]">Web</h2>
          <p className="m-0 text-[1.05rem] text-[#6d7688]">
            QueryClientProvider configurado e app pronto para usar TanStack Query.
          </p>
        </article>
        <article className="rounded-[24px] border border-[rgba(29,36,51,0.12)] bg-white/72 p-5 backdrop-blur-xl">
          <h2 className="mb-2 text-lg font-semibold text-[#1d2433]">API</h2>
          <p className="m-0 text-[1.05rem] text-[#6d7688]">
            {" "}
            Health: {health.isLoading ? "carregando" : (health.data?.status ?? "indisponivel")}
          </p>
        </article>
        <article className="rounded-[24px] border border-[rgba(29,36,51,0.12)] bg-white/72 p-5 backdrop-blur-xl">
          <h2 className="mb-2 text-lg font-semibold text-[#1d2433]">Auth</h2>
          <p className="m-0 text-[1.05rem] text-[#6d7688]">
            Session:{" "}
            {session.isLoading
              ? "carregando"
              : session.data?.user
                ? `autenticado como ${session.data.user.email}`
                : "sem sessão ativa"}
          </p>
        </article>
      </div>
    </section>
  );
}

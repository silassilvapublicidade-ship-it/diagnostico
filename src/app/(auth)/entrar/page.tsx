import Link from "next/link";

import { signInAction } from "@/modules/auth/actions";

type PageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

function value(
  params: Record<string, string | string[] | undefined>,
  key: string,
) {
  const item = params[key];
  return Array.isArray(item) ? item[0] : item;
}

export default async function SignInPage({ searchParams }: PageProps) {
  const params = (await searchParams) ?? {};
  const error = value(params, "erro");
  const next = value(params, "next") ?? "/app";

  return (
    <section>
      <p className="mb-3 font-mono text-xs uppercase tracking-[0.2em] text-accent">
        Entrar
      </p>
      <h2 className="text-4xl font-semibold leading-none">
        Continue seu diagnostico.
      </h2>
      <p className="mt-4 leading-7 text-graphite/68">
        A area privada guarda briefings, evidencias e resultados iniciais do
        Diagnostico Estrategico de Perfil.
      </p>

      {error ? (
        <p className="mt-6 border-l-2 border-red-700 bg-white/50 px-4 py-3 text-sm text-red-900">
          {error}
        </p>
      ) : null}

      <form action={signInAction} className="mt-8 space-y-4">
        <input name="next" type="hidden" value={next} />
        <label className="block">
          <span className="text-sm text-graphite/70">Email</span>
          <input
            className="mt-2 w-full border border-graphite/14 bg-white/70 px-4 py-3 outline-none transition focus:border-accent"
            name="email"
            required
            type="email"
          />
        </label>
        <label className="block">
          <span className="text-sm text-graphite/70">Senha</span>
          <input
            className="mt-2 w-full border border-graphite/14 bg-white/70 px-4 py-3 outline-none transition focus:border-accent"
            minLength={6}
            name="password"
            required
            type="password"
          />
        </label>
        <button className="w-full bg-graphite px-5 py-3 text-sm font-semibold text-paper transition hover:bg-accent">
          Entrar
        </button>
      </form>

      <div className="mt-6 flex items-center justify-between text-sm text-graphite/64">
        <Link className="hover:text-accent" href="/cadastro">
          Criar conta
        </Link>
        <Link className="hover:text-accent" href="/recuperar-acesso">
          Recuperar acesso
        </Link>
      </div>
    </section>
  );
}

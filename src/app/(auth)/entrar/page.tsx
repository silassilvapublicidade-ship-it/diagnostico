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
      <p className="kicker mb-3 text-accent">Entrar</p>
      <h2 className="display-title text-4xl leading-[0.92]">
        Continue seu diagnostico.
      </h2>
      <p className="mt-4 leading-7 text-graphite/68">
        A area privada guarda briefings, evidencias e resultados iniciais do
        Diagnostico Estrategico de Perfil.
      </p>

      {error ? (
        <p className="mt-6 rounded-lg border border-accent/40 bg-accent/10 px-4 py-3 text-sm font-semibold text-cream">
          {error}
        </p>
      ) : null}

      <form action={signInAction} className="mt-8 space-y-4">
        <input name="next" type="hidden" value={next} />
        <label className="block">
          <span className="text-sm font-semibold text-graphite/70">Email</span>
          <input
            className="form-control mt-2"
            name="email"
            required
            type="email"
          />
        </label>
        <label className="block">
          <span className="text-sm font-semibold text-graphite/70">Senha</span>
          <input
            className="form-control mt-2"
            minLength={6}
            name="password"
            required
            type="password"
          />
        </label>
        <button className="action-primary w-full">Entrar</button>
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

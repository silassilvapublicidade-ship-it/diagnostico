import Link from "next/link";

import { signUpAction } from "@/modules/auth/actions";

type PageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

export default async function SignUpPage({ searchParams }: PageProps) {
  const params = (await searchParams) ?? {};
  const error = params.erro;
  const errorText = Array.isArray(error) ? error[0] : error;

  return (
    <section>
      <p className="mb-3 font-mono text-xs uppercase tracking-[0.2em] text-accent">
        Cadastro
      </p>
      <h2 className="text-4xl font-semibold leading-none">
        Comece pela leitura certa.
      </h2>
      <p className="mt-4 leading-7 text-graphite/68">
        Crie sua area privada para enviar contexto, evidencias e acompanhar o
        status do diagnostico.
      </p>

      {errorText ? (
        <p className="mt-6 border-l-2 border-red-700 bg-white/50 px-4 py-3 text-sm text-red-900">
          {errorText}
        </p>
      ) : null}

      <form action={signUpAction} className="mt-8 space-y-4">
        <label className="block">
          <span className="text-sm text-graphite/70">Nome</span>
          <input
            className="mt-2 w-full border border-graphite/14 bg-white/70 px-4 py-3 outline-none transition focus:border-accent"
            name="fullName"
            required
          />
        </label>
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
          Criar conta
        </button>
      </form>

      <p className="mt-6 text-sm text-graphite/64">
        Ja tem conta?{" "}
        <Link className="font-semibold text-accent" href="/entrar">
          Entrar
        </Link>
      </p>
    </section>
  );
}

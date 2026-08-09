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
      <p className="kicker mb-3 text-accent">Cadastro</p>
      <h2 className="display-title text-4xl leading-[0.92]">
        Comece pela leitura certa.
      </h2>
      <p className="mt-4 leading-7 text-graphite/68">
        Crie sua area privada para enviar contexto, evidencias e acompanhar o
        status do diagnostico.
      </p>

      {errorText ? (
        <p className="mt-6 border-l-4 border-accent bg-white/70 px-4 py-3 text-sm font-semibold text-graphite">
          {errorText}
        </p>
      ) : null}

      <form action={signUpAction} className="mt-8 space-y-4">
        <label className="block">
          <span className="text-sm font-semibold text-graphite/70">Nome</span>
          <input className="form-control mt-2" name="fullName" required />
        </label>
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
        <button className="action-primary w-full">Criar conta</button>
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

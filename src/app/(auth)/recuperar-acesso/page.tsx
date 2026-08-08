import Link from "next/link";

import { requestPasswordResetAction } from "@/modules/auth/actions";

type PageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

export default async function RecoverAccessPage({ searchParams }: PageProps) {
  const params = (await searchParams) ?? {};
  const error = Array.isArray(params.erro) ? params.erro[0] : params.erro;
  const sent = params.enviado === "1";

  return (
    <section>
      <p className="mb-3 font-mono text-xs uppercase tracking-[0.2em] text-accent">
        Recuperar acesso
      </p>
      <h2 className="text-4xl font-semibold leading-none">
        Reabra sua area privada.
      </h2>
      <p className="mt-4 leading-7 text-graphite/68">
        Enviaremos um link para redefinir sua senha quando o email estiver
        habilitado no Supabase Auth.
      </p>

      {error ? (
        <p className="mt-6 border-l-2 border-red-700 bg-white/50 px-4 py-3 text-sm text-red-900">
          {error}
        </p>
      ) : null}
      {sent ? (
        <p className="mt-6 border-l-2 border-accent bg-white/50 px-4 py-3 text-sm text-graphite/72">
          Se o email existir, o link de recuperacao sera enviado.
        </p>
      ) : null}

      <form action={requestPasswordResetAction} className="mt-8 space-y-4">
        <label className="block">
          <span className="text-sm text-graphite/70">Email</span>
          <input
            className="mt-2 w-full border border-graphite/14 bg-white/70 px-4 py-3 outline-none transition focus:border-accent"
            name="email"
            required
            type="email"
          />
        </label>
        <button className="w-full bg-graphite px-5 py-3 text-sm font-semibold text-paper transition hover:bg-accent">
          Enviar link
        </button>
      </form>

      <p className="mt-6 text-sm text-graphite/64">
        Lembrou a senha?{" "}
        <Link className="font-semibold text-accent" href="/entrar">
          Entrar
        </Link>
      </p>
    </section>
  );
}

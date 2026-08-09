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
      <p className="kicker mb-3 text-accent">Recuperar acesso</p>
      <h2 className="display-title text-4xl leading-[0.92]">
        Reabra sua area privada.
      </h2>
      <p className="mt-4 leading-7 text-graphite/68">
        Enviaremos um link para redefinir sua senha quando o email estiver
        habilitado no Supabase Auth.
      </p>

      {error ? (
        <p className="mt-6 rounded-lg border border-accent/40 bg-accent/10 px-4 py-3 text-sm font-semibold text-cream">
          {error}
        </p>
      ) : null}
      {sent ? (
        <p className="mt-6 rounded-lg border border-accent/40 bg-accent/10 px-4 py-3 text-sm font-semibold text-cream">
          Se o email existir, o link de recuperacao sera enviado.
        </p>
      ) : null}

      <form action={requestPasswordResetAction} className="mt-8 space-y-4">
        <label className="block">
          <span className="text-sm font-semibold text-graphite/70">Email</span>
          <input
            className="form-control mt-2"
            name="email"
            required
            type="email"
          />
        </label>
        <button className="action-primary w-full">Enviar link</button>
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

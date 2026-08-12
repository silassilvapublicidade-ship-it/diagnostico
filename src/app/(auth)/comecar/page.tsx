import { signInWithMagicLinkAction } from "@/modules/auth/actions";

type PageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

export default async function StartDiagnosisPage({ searchParams }: PageProps) {
  const params = (await searchParams) ?? {};
  const error = Array.isArray(params.erro) ? params.erro[0] : params.erro;
  const sent = params.enviado === "1";

  if (sent) {
    return (
      <section>
        <p className="kicker mb-3 text-accent">Verifique seu e-mail</p>
        <h2 className="display-title text-4xl leading-[0.92]">
          Enviamos seu acesso.
        </h2>
        <p className="mt-4 leading-7 text-graphite/68">
          Abra sua caixa de entrada e clique no link para continuar. Se não
          aparecer em alguns minutos, olhe também o spam.
        </p>
      </section>
    );
  }

  return (
    <section>
      <p className="kicker mb-3 text-accent">Comece seu diagnóstico</p>
      <h2 className="display-title text-4xl leading-[0.92]">
        Vamos começar seu diagnóstico.
      </h2>
      <p className="mt-4 leading-7 text-graphite/68">
        Vamos enviar um acesso seguro para você continuar seu diagnóstico.
        Sem senha.
      </p>

      {error ? (
        <p className="mt-6 rounded-lg border border-accent/40 bg-accent/10 px-4 py-3 text-sm font-semibold text-cream">
          {error}
        </p>
      ) : null}

      <form action={signInWithMagicLinkAction} className="mt-8 space-y-4">
        <input name="next" type="hidden" value="/app/diagnosticos/novo" />
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
        <button className="action-primary w-full">Continuar</button>
      </form>
    </section>
  );
}

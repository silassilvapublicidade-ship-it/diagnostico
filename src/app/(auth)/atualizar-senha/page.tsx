import { updatePasswordAction } from "@/modules/auth/actions";

type PageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

export default async function UpdatePasswordPage({ searchParams }: PageProps) {
  const params = (await searchParams) ?? {};
  const error = Array.isArray(params.erro) ? params.erro[0] : params.erro;

  return (
    <section>
      <p className="mb-3 font-mono text-xs uppercase tracking-[0.2em] text-accent">
        Nova senha
      </p>
      <h2 className="text-4xl font-semibold leading-none">
        Defina um novo acesso.
      </h2>
      <p className="mt-4 leading-7 text-graphite/68">
        Use uma senha com pelo menos seis caracteres para voltar ao fluxo do
        diagnostico.
      </p>

      {error ? (
        <p className="mt-6 border-l-2 border-red-700 bg-white/50 px-4 py-3 text-sm text-red-900">
          {error}
        </p>
      ) : null}

      <form action={updatePasswordAction} className="mt-8 space-y-4">
        <label className="block">
          <span className="text-sm text-graphite/70">Nova senha</span>
          <input
            className="mt-2 w-full border border-graphite/14 bg-white/70 px-4 py-3 outline-none transition focus:border-accent"
            minLength={6}
            name="password"
            required
            type="password"
          />
        </label>
        <button className="w-full bg-graphite px-5 py-3 text-sm font-semibold text-paper transition hover:bg-accent">
          Atualizar senha
        </button>
      </form>
    </section>
  );
}

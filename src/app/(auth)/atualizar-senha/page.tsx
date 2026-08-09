import { updatePasswordAction } from "@/modules/auth/actions";

type PageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

export default async function UpdatePasswordPage({ searchParams }: PageProps) {
  const params = (await searchParams) ?? {};
  const error = Array.isArray(params.erro) ? params.erro[0] : params.erro;

  return (
    <section>
      <p className="kicker mb-3 text-accent">Nova senha</p>
      <h2 className="display-title text-4xl leading-[0.92]">
        Defina um novo acesso.
      </h2>
      <p className="mt-4 leading-7 text-graphite/68">
        Use uma senha com pelo menos seis caracteres para voltar ao fluxo do
        diagnostico.
      </p>

      {error ? (
        <p className="mt-6 border-l-4 border-accent bg-white/70 px-4 py-3 text-sm font-semibold text-graphite">
          {error}
        </p>
      ) : null}

      <form action={updatePasswordAction} className="mt-8 space-y-4">
        <label className="block">
          <span className="text-sm font-semibold text-graphite/70">
            Nova senha
          </span>
          <input
            className="form-control mt-2"
            minLength={6}
            name="password"
            required
            type="password"
          />
        </label>
        <button className="action-primary w-full">Atualizar senha</button>
      </form>
    </section>
  );
}

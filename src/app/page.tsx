import Image from "next/image";
import Link from "next/link";

import { FullResultPreview, HeroResultPreview } from "./landing-result-preview";

const PAIN_TAGS = [
  "Posicionamento confuso",
  "1ª impressão fraca",
  "Pouca autoridade",
  "Conteúdo sem direção",
  "Identidade inconsistente",
  "Conversão fraca",
  "Relacionamento raso",
  "Oportunidades perdidas",
] as const;

const RECEIVE_TAGS = [
  "Score real do perfil",
  "Pontos críticos",
  "Prioridades",
  "Solução pronta pra aplicar",
  "Plano de ação",
] as const;

const HOW_IT_WORKS = [
  { title: "Conte sobre seu perfil", hint: "Perguntas rápidas" },
  { title: "Envie as evidências", hint: "Prints do perfil" },
  { title: "Receba sua leitura", hint: "Análise em profundidade" },
  { title: "Veja o que mudar", hint: "Diagnóstico e plano" },
] as const;

const DIMENSIONS = [
  { code: "POS", label: "Posicionamento" },
  { code: "IMP", label: "Primeira Impressão" },
  { code: "AUT", label: "Autoridade" },
  { code: "CON", label: "Conteúdo" },
  { code: "IDE", label: "Identidade" },
  { code: "CVR", label: "Conversão" },
  { code: "REL", label: "Relacionamento" },
  { code: "OPR", label: "Oportunidades" },
] as const;

const PROFILE_TYPES = [
  {
    code: "BUSINESS",
    title: "Perfil comercial",
    keywords: "Posicionamento · Autoridade · Conversão",
  },
  {
    code: "CREATOR",
    title: "Imagem pessoal e conteúdo",
    keywords: "Conteúdo · Identidade · Relacionamento",
  },
] as const;

const COMPARISON_ROWS = [
  { without: "Vou mudar a bio e ver.", with: "Sei o que mudar e por quê." },
  { without: "Preciso postar mais.", with: "O problema é conversão, não volume." },
  { without: "Feed mais bonito.", with: "Identidade forte, gargalo é outro." },
] as const;

const TRUST_POINTS = [
  { title: "Evidências privadas", hint: "Nunca publicadas ou compartilhadas" },
  { title: "Sem inventar dado", hint: "Falta de evidência fica clara" },
  { title: "Você decide", hint: "A aplicação é sua escolha" },
] as const;

const NAV_LINKS = [
  { href: "#o-que-voce-recebe", label: "O que você recebe" },
  { href: "#como-funciona", label: "Como funciona" },
  { href: "#dimensoes", label: "8 Dimensões" },
] as const;

function SectionHeading({ kicker, title }: { kicker: string; title: string }) {
  return (
    <div>
      <p className="kicker text-accent">{kicker}</p>
      <h2 className="mt-2 text-xl font-semibold text-cream sm:text-2xl">
        {title}
      </h2>
    </div>
  );
}

export default function Home() {
  return (
    <main className="min-h-screen bg-ink text-cream">
      <header className="sticky top-0 z-40 border-b border-white/10 bg-ink/85 backdrop-blur">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-4 px-6 py-4 sm:px-10 lg:px-12">
          <Link className="flex items-center gap-3" href="/">
            <span className="relative flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-accent/40 bg-black/40">
              <Image
                alt="Metodologia Silas Silva"
                className="object-contain"
                fill
                priority
                sizes="36px"
                src="/logo-mark.png"
              />
            </span>
            <span className="kicker hidden text-cream/60 sm:inline">
              Diagnóstico Estratégico de Perfil
            </span>
          </Link>

          <nav className="hidden items-center gap-6 lg:flex">
            {NAV_LINKS.map((link) => (
              <a
                className="text-xs font-semibold uppercase tracking-[0.1em] text-cream/60 transition hover:text-accent"
                href={link.href}
                key={link.href}
              >
                {link.label}
              </a>
            ))}
          </nav>

          <div className="flex items-center gap-4">
            <Link
              className="hidden text-xs font-semibold uppercase tracking-[0.12em] text-cream/60 transition hover:text-accent sm:inline"
              href="/entrar"
            >
              Entrar
            </Link>
            <Link
              className="action-primary action-accent px-4 py-2.5 text-xs"
              href="/cadastro"
            >
              Analisar meu perfil
            </Link>
          </div>
        </div>
      </header>

      <div className="mx-auto w-full max-w-6xl px-6 sm:px-10 lg:px-12">
        <section className="grid gap-10 py-20 sm:py-28 lg:grid-cols-[1.05fr_0.95fr] lg:items-center lg:gap-12">
          <div>
            <h1 className="display-title max-w-lg text-balance text-4xl leading-[1.08] text-cream sm:text-5xl lg:text-6xl">
              Descubra o que está travando seu Instagram.
            </h1>
            <p className="mt-6 max-w-md text-lg leading-8 text-cream/70">
              Análise estratégica do seu perfil, com prioridades e um plano
              claro do que mudar.
            </p>
            <div className="mt-8">
              <Link className="action-primary action-accent" href="/cadastro">
                Analisar meu perfil
              </Link>
            </div>
          </div>

          <HeroResultPreview />
        </section>

        <section className="border-t border-white/12 py-16 sm:py-24">
          <SectionHeading
            kicker="Antes de mudar mais alguma coisa"
            title="Talvez o problema não seja postar pouco."
          />

          <div className="mt-8 flex flex-wrap gap-2">
            {PAIN_TAGS.map((tag) => (
              <span
                className="rounded-full border border-cream/15 bg-white/[0.03] px-3.5 py-2 text-xs font-medium text-cream/70"
                key={tag}
              >
                {tag}
              </span>
            ))}
          </div>

          <p className="mt-8 text-sm font-semibold text-cream/85">
            É isso que a análise identifica.
          </p>
        </section>

        <section
          className="border-t border-white/12 py-16 sm:py-24"
          id="o-que-voce-recebe"
        >
          <SectionHeading kicker="O que você recebe" title="Clareza sobre o que fazer." />

          <div className="mt-8 flex flex-wrap gap-2.5">
            {RECEIVE_TAGS.map((tag) => (
              <span
                className="rounded-full border border-accent/30 bg-accent/8 px-4 py-2.5 text-sm font-semibold text-cream/85"
                key={tag}
              >
                {tag}
              </span>
            ))}
          </div>
        </section>

        <section className="border-t border-white/12 py-16 sm:py-24">
          <SectionHeading
            kicker="Prova, não promessa"
            title="Você não recebe apenas uma nota."
          />

          <div className="mt-8">
            <FullResultPreview />
          </div>
        </section>

        <section
          className="border-t border-white/12 py-16 sm:py-24"
          id="como-funciona"
        >
          <SectionHeading
            kicker="Como funciona"
            title="Simples de enviar, profundo de receber."
          />

          <div className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {HOW_IT_WORKS.map((step, index) => (
              <div className="dark-panel p-4" key={step.title}>
                <p className="font-mono text-[10px] text-accent">
                  {String(index + 1).padStart(2, "0")}
                </p>
                <p className="mt-2 text-sm font-black text-cream">
                  {step.title}
                </p>
                <p className="mt-1 text-xs text-cream/50">{step.hint}</p>
              </div>
            ))}
          </div>
        </section>

        <section
          className="border-t border-white/12 py-16 sm:py-24"
          id="dimensoes"
        >
          <SectionHeading
            kicker="8 Dimensões Estratégicas"
            title="Um perfil, vários ângulos."
          />

          <div className="mt-8 grid grid-cols-2 gap-2.5 sm:grid-cols-4">
            {DIMENSIONS.map((dimension) => (
              <div
                className="rounded-lg border border-cream/10 bg-white/[0.03] px-3 py-3.5 text-center"
                key={dimension.code}
              >
                <p className="font-mono text-[9px] font-black text-cream/30">
                  {dimension.code}
                </p>
                <p className="mt-1 text-sm font-semibold text-cream">
                  {dimension.label}
                </p>
              </div>
            ))}
          </div>
        </section>

        <section className="border-t border-white/12 py-16 sm:py-24">
          <SectionHeading
            kicker="Leitura personalizada"
            title="Empresa ou criador. Pesos diferentes."
          />

          <div className="mt-8 grid gap-3 sm:grid-cols-2">
            {PROFILE_TYPES.map((profile) => (
              <div className="dark-panel p-5" key={profile.code}>
                <p className="font-mono text-[10px] font-black text-accent">
                  {profile.code}
                </p>
                <p className="mt-2 text-base font-semibold text-cream">
                  {profile.title}
                </p>
                <p className="mt-1.5 text-xs font-medium text-cream/50">
                  {profile.keywords}
                </p>
              </div>
            ))}
          </div>
        </section>

        <section className="border-t border-white/12 py-16 sm:py-24">
          <SectionHeading
            kicker="Achismo x direção"
            title="Pare de tentar adivinhar. Comece a saber."
          />

          <div className="mt-8 overflow-hidden rounded-lg border border-cream/10">
            <div className="grid grid-cols-2 border-b border-cream/10 bg-white/[0.03]">
              <p className="kicker px-4 py-3 text-cream/45 sm:px-6">
                Sem diagnóstico
              </p>
              <p className="kicker border-l border-cream/10 px-4 py-3 text-accent sm:px-6">
                Com o diagnóstico
              </p>
            </div>
            {COMPARISON_ROWS.map((row) => (
              <div
                className="grid grid-cols-2 border-b border-cream/10 last:border-b-0"
                key={row.without}
              >
                <p className="px-4 py-4 text-sm leading-6 text-cream/50 sm:px-6">
                  {row.without}
                </p>
                <p className="border-l border-cream/10 px-4 py-4 text-sm font-medium leading-6 text-cream/90 sm:px-6">
                  {row.with}
                </p>
              </div>
            ))}
          </div>
        </section>

        <section className="border-t border-white/12 py-16 sm:py-24">
          <SectionHeading kicker="Privacidade" title="Privado, do seu jeito." />

          <div className="mt-8 grid gap-4 sm:grid-cols-3">
            {TRUST_POINTS.map((point) => (
              <div key={point.title}>
                <div className="hairline mb-3" />
                <p className="text-sm font-semibold text-cream">
                  {point.title}
                </p>
                <p className="mt-1 text-xs text-cream/50">{point.hint}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="lux-panel my-10 flex flex-col items-center gap-7 p-10 text-center sm:p-16">
          <div className="max-w-xl">
            <h2 className="display-title text-balance text-3xl leading-[1.1] text-cream sm:text-5xl">
              Seu perfil pode estar perdendo oportunidades.
            </h2>
            <p className="mt-4 text-base text-cream/60">
              Descubra onde e saiba o que fazer.
            </p>
          </div>
          <Link className="action-primary action-accent" href="/cadastro">
            Analisar meu perfil
          </Link>
        </section>

        <footer className="flex flex-col items-start gap-4 border-t border-white/12 pt-8 pb-10 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <span className="relative flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-accent/40 bg-black/40">
              <Image
                alt="Metodologia Silas Silva"
                className="object-contain"
                fill
                sizes="32px"
                src="/logo-mark.png"
              />
            </span>
            <p className="text-xs leading-5 text-cream/50">
              Metodologia Silas Silva de Diagnóstico Estratégico
            </p>
          </div>
          <Link
            className="font-mono text-xs uppercase tracking-[0.16em] text-cream/50 transition hover:text-accent"
            href="/entrar"
          >
            Área privada
          </Link>
        </footer>
      </div>
    </main>
  );
}

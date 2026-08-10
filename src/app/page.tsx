import Image from "next/image";
import Link from "next/link";

import { FullResultPreview, HeroResultPreview } from "./landing-result-preview";

const DIMENSIONS = [
  {
    code: "POS",
    label: "Posicionamento",
    question:
      "Fica claro quem você é, para quem fala e por que deveriam escolher você?",
  },
  {
    code: "IMP",
    label: "Primeira Impressão",
    question: "O que alguém entende sobre você nos primeiros segundos?",
  },
  {
    code: "AUT",
    label: "Autoridade",
    question: "Seu perfil demonstra motivos reais para confiar em você?",
  },
  {
    code: "CON",
    label: "Conteúdo",
    question: "O que você publica possui direção ou apenas ocupa o feed?",
  },
  {
    code: "IDE",
    label: "Identidade",
    question: "Seu perfil possui reconhecimento e coerência?",
  },
  {
    code: "CVR",
    label: "Conversão",
    question: "Existe um caminho claro entre atenção e ação?",
  },
  {
    code: "REL",
    label: "Relacionamento",
    question:
      "Você está construindo audiência ou apenas acumulando visualizações?",
  },
  {
    code: "OPR",
    label: "Oportunidades",
    question: "O que seu perfil já possui, mas ainda não está aproveitando?",
  },
] as const;

const RECEIVE_ITEMS = [
  {
    title: "Descubra onde seu perfil está perdendo força",
    description:
      "As 8 Dimensões Estratégicas mostram exatamente onde estão os gargalos, sem misturar tudo em uma nota genérica.",
  },
  {
    title: "Veja o nível real do seu perfil, não um número solto",
    description:
      "O Score Estratégico mostra a maturidade atual, dimensão por dimensão.",
  },
  {
    title: "Pare de tentar adivinhar o que está travando resultado",
    description:
      "Os pontos críticos mostram, com evidência, o que está limitando crescimento, autoridade ou conversão agora.",
  },
  {
    title: "Saiba o que resolver primeiro",
    description:
      "As prioridades evitam que você tente mudar tudo ao mesmo tempo e perca o foco.",
  },
  {
    title: "Receba a solução, não só o problema",
    description:
      "Cada recomendação vem com exemplo prático e aplicação, não apenas o diagnóstico.",
  },
  {
    title: "Tenha um plano, não uma lista de ideias soltas",
    description:
      "Ações organizadas para começar hoje e evoluir nas próximas semanas.",
  },
  {
    title: "Saiba o que postar a partir de agora",
    description:
      "Sugestões de conteúdo conectadas diretamente aos problemas e oportunidades encontrados.",
  },
] as const;

const PAIN_POINTS = [
  "Posicionamento confuso — não fica claro quem você é nem por que escolher você.",
  "Primeira impressão fraca — quem chega não entende o perfil em poucos segundos.",
  "Autoridade pouco demonstrada — parece competente, mas não prova por quê.",
  "Conteúdo sem direção — publica, mas sem um fio condutor.",
  "Identidade inconsistente — cada parte do perfil parece de um perfil diferente.",
  "Caminho de conversão ruim — quem gosta não sabe o que fazer depois.",
  "Relacionamento superficial — números de alcance sem construção de audiência.",
  "Oportunidades ignoradas — recursos que o próprio perfil já tem e nunca foram usados.",
] as const;

const HOW_IT_WORKS = [
  {
    title: "Conte sobre seu perfil",
    description:
      "Responda perguntas rápidas sobre você, seu perfil e o que você quer alcançar.",
  },
  {
    title: "Envie as evidências",
    description:
      "Adicione prints do perfil, do feed, dos destaques e das métricas disponíveis.",
  },
  {
    title: "Receba sua leitura",
    description:
      "Cruzamos o que você contou com as evidências enviadas e analisamos o perfil em profundidade.",
  },
  {
    title: "Veja o que precisa mudar",
    description:
      "Diagnóstico, prioridades, recomendações com exemplos e um plano de ação.",
  },
] as const;

const PROFILE_TYPES = [
  {
    code: "BUSINESS",
    title: "Perfil comercial",
    description:
      "Mais peso para posicionamento, autoridade e conversão — o que mais pesa na decisão de compra.",
  },
  {
    code: "CREATOR",
    title: "Imagem pessoal e conteúdo",
    description:
      "Mais peso para conteúdo, identidade e relacionamento — o que mais pesa na construção de audiência.",
  },
] as const;

const COMPARISON_ROWS = [
  {
    without: "Vou mudar minha bio e ver se melhora.",
    with: "Minha proposta está genérica — preciso torná-la mais específica.",
  },
  {
    without: "Preciso postar mais.",
    with: "O problema está na conversão do alcance que eu já tenho.",
  },
  {
    without: "Meu feed precisa ficar mais bonito.",
    with: "Minha identidade está forte — o gargalo está em outro ponto.",
  },
] as const;

const TRUST_POINTS = [
  {
    title: "Suas evidências ficam privadas",
    description:
      "Os prints enviados servem só para a análise. Nada é publicado nem compartilhado.",
  },
  {
    title: "Sem inventar o que não foi enviado",
    description:
      "Quando falta evidência para uma leitura confiável, isso fica claro em vez de virar um número aleatório.",
  },
  {
    title: "Você decide o que muda",
    description:
      "O diagnóstico mostra o caminho. A decisão de aplicar continua sendo sua.",
  },
] as const;

const NAV_LINKS = [
  { href: "#o-que-voce-recebe", label: "O que você recebe" },
  { href: "#como-funciona", label: "Como funciona" },
  { href: "#dimensoes", label: "8 Dimensões" },
] as const;

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
        <section className="grid gap-10 py-14 sm:py-20 lg:grid-cols-[1.05fr_0.95fr] lg:items-start lg:gap-12">
          <div>
            <p className="kicker mb-5 text-accent">Metodologia Silas Silva</p>
            <h1 className="display-title max-w-2xl text-4xl leading-[1.05] text-cream sm:text-6xl lg:text-[4.4rem] lg:leading-[1.04]">
              Pare de adivinhar o que precisa mudar no seu Instagram.
            </h1>
            <p className="mt-6 max-w-lg text-lg leading-8 text-cream/72">
              Envie seu perfil, conte o que você quer alcançar e receba uma
              análise completa mostrando o que está funcionando, o que está
              limitando seus resultados e exatamente o que fazer a partir de
              agora.
            </p>
            <div className="mt-8 flex flex-col items-start gap-3">
              <Link className="action-primary action-accent" href="/cadastro">
                Quero meu diagnóstico
              </Link>
              <p className="text-xs text-cream/45">
                Leitura privada. Você decide o que muda.
              </p>
            </div>
          </div>

          <HeroResultPreview />
        </section>

        <section className="border-t border-white/12 py-16 sm:py-20">
          <p className="kicker text-accent">Antes de mudar mais alguma coisa</p>
          <h2 className="display-title mt-3 max-w-2xl text-3xl leading-[1.05] text-cream sm:text-5xl">
            Talvez o problema não seja postar pouco.
          </h2>
          <p className="mt-5 max-w-2xl text-base leading-7 text-cream/68">
            Às vezes o perfil já publica, já aparece, já tem alcance — e mesmo
            assim não cresce, não converte, não parece diferente da
            concorrência. Isso quase nunca é falta de esforço. Geralmente é um
            problema estrutural que não aparece só de olhar.
          </p>

          <div className="mt-10 grid gap-x-8 gap-y-5 sm:grid-cols-2">
            {PAIN_POINTS.map((point) => (
              <div className="flex gap-3" key={point}>
                <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-accent" />
                <p className="text-sm leading-6 text-cream/68">{point}</p>
              </div>
            ))}
          </div>

          <p className="mt-10 text-lg font-semibold text-cream">
            É exatamente isso que esta análise procura.
          </p>
        </section>

        <section className="border-t border-white/12 py-16 sm:py-20" id="o-que-voce-recebe">
          <p className="kicker text-accent">O que você recebe</p>
          <h2 className="display-title mt-3 max-w-2xl text-3xl leading-[1.05] text-cream sm:text-5xl">
            Clareza, direção e o que fazer com ela.
          </h2>

          <div className="mt-10 grid gap-4 sm:grid-cols-2">
            {RECEIVE_ITEMS.map((item) => (
              <div className="lux-panel p-5" key={item.title}>
                <p className="text-base font-semibold text-cream">
                  {item.title}
                </p>
                <p className="mt-2 text-sm leading-6 text-cream/64">
                  {item.description}
                </p>
              </div>
            ))}
          </div>
        </section>

        <section className="border-t border-white/12 py-16 sm:py-20">
          <p className="kicker text-accent">Você não recebe apenas uma nota</p>
          <h2 className="display-title mt-3 max-w-2xl text-3xl leading-[1.05] text-cream sm:text-5xl">
            Problema, evidência e o que fazer a respeito.
          </h2>
          <p className="mt-5 max-w-2xl text-base leading-7 text-cream/68">
            Cada dimensão traz o diagnóstico, a evidência que sustenta,
            por que isso prejudica o perfil, a correção, um exemplo pronto
            para aplicar e o próximo passo.
          </p>

          <div className="mt-10">
            <FullResultPreview />
          </div>
        </section>

        <section className="border-t border-white/12 py-16 sm:py-20" id="como-funciona">
          <p className="kicker text-accent">Como funciona</p>
          <h2 className="display-title mt-3 max-w-xl text-2xl leading-[1.05] text-cream sm:text-4xl">
            Simples de enviar, profundo de receber.
          </h2>

          <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {HOW_IT_WORKS.map((step, index) => (
              <div className="dark-panel p-5" key={step.title}>
                <p className="font-mono text-[10px] text-accent">
                  {String(index + 1).padStart(2, "0")}
                </p>
                <p className="mt-3 text-sm font-black uppercase tracking-[0.1em] text-cream/85">
                  {step.title}
                </p>
                <p className="mt-3 text-xs leading-5 text-cream/60">
                  {step.description}
                </p>
              </div>
            ))}
          </div>
        </section>

        <section className="border-t border-white/12 py-16 sm:py-20" id="dimensoes">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="kicker text-accent">8 Dimensões Estratégicas</p>
              <h2 className="display-title mt-3 max-w-xl text-2xl leading-[1.05] text-cream sm:text-4xl">
                Seu perfil não tem um único problema.
              </h2>
            </div>
            <p className="max-w-sm text-sm leading-6 text-cream/60">
              Um perfil pode ter bom conteúdo e converter mal, ter boa
              identidade e posicionamento fraco, ter alcance e pouca
              autoridade. Por isso a leitura é dividida em 8 dimensões.
            </p>
          </div>

          <div className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {DIMENSIONS.map((dimension) => (
              <div
                className="rounded-lg border border-cream/10 bg-white/[0.03] p-4"
                key={dimension.code}
              >
                <p className="font-mono text-[10px] font-black text-cream/34">
                  {dimension.code}
                </p>
                <p className="mt-2 text-sm font-semibold text-cream">
                  {dimension.label}
                </p>
                <p className="mt-2 text-xs leading-5 text-cream/58">
                  {dimension.question}
                </p>
              </div>
            ))}
          </div>
        </section>

        <section className="border-t border-white/12 py-16 sm:py-20">
          <p className="kicker text-accent">Leitura personalizada</p>
          <h2 className="display-title mt-3 max-w-xl text-2xl leading-[1.05] text-cream sm:text-4xl">
            A mesma régua não serve para todo perfil.
          </h2>
          <p className="mt-4 max-w-2xl text-sm leading-6 text-cream/64">
            Empresas e criadores têm objetivos e sinais estratégicos
            diferentes. A leitura ajusta o peso de cada dimensão conforme o
            tipo de perfil.
          </p>

          <div className="mt-8 grid gap-4 sm:grid-cols-2">
            {PROFILE_TYPES.map((profile) => (
              <div className="dark-panel p-6" key={profile.code}>
                <p className="font-mono text-[10px] font-black text-accent">
                  {profile.code}
                </p>
                <p className="mt-2 text-lg font-semibold text-cream">
                  {profile.title}
                </p>
                <p className="mt-2 text-sm leading-6 text-cream/64">
                  {profile.description}
                </p>
              </div>
            ))}
          </div>
        </section>

        <section className="border-t border-white/12 py-16 sm:py-20">
          <p className="kicker text-accent">Achismo x direção</p>
          <h2 className="display-title mt-3 max-w-xl text-2xl leading-[1.05] text-cream sm:text-4xl">
            Pare de tentar adivinhar. Comece a saber.
          </h2>

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

        <section className="border-t border-white/12 py-16 sm:py-20">
          <p className="kicker text-accent">Privacidade e confiança</p>
          <h2 className="display-title mt-3 max-w-xl text-2xl leading-[1.05] text-cream sm:text-4xl">
            Uma leitura privada, do seu jeito.
          </h2>

          <div className="mt-8 grid gap-4 sm:grid-cols-3">
            {TRUST_POINTS.map((point) => (
              <div key={point.title}>
                <div className="hairline mb-4" />
                <p className="text-sm font-semibold text-cream">
                  {point.title}
                </p>
                <p className="mt-2 text-sm leading-6 text-cream/60">
                  {point.description}
                </p>
              </div>
            ))}
          </div>
        </section>

        <section className="lux-panel my-8 flex flex-col gap-6 p-8 sm:p-10">
          <div className="max-w-2xl">
            <p className="kicker text-accent">Chega de tentativa e erro</p>
            <p className="display-title mt-3 text-2xl leading-[1.1] text-cream sm:text-4xl">
              Você pode continuar publicando e esperando descobrir o que
              funciona. Ou pode descobrir agora o que o seu perfil realmente
              precisa.
            </p>
          </div>
          <div className="flex flex-col items-start gap-3">
            <Link className="action-primary action-accent" href="/cadastro">
              Quero analisar meu perfil
            </Link>
            <p className="text-xs text-cream/50">
              Leva poucos minutos para enviar as informações.
            </p>
          </div>
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

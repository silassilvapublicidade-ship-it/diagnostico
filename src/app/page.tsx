import {
  BadgeCheck,
  CalendarCheck,
  CheckCircle2,
  ClipboardList,
  Compass,
  Eye,
  FileCheck,
  Gauge,
  Handshake,
  Layers,
  Lightbulb,
  ListChecks,
  Lock,
  MousePointerClick,
  PenLine,
  ScanSearch,
  Sparkles,
  Target,
  Upload,
  Wrench,
} from "lucide-react";
import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";

import {
  formatPriceDisplay,
  formatPriceMachine,
  INITIAL_PRICE_AMOUNT_CENTS,
} from "@/modules/billing";

import { AmbientBackground, Reveal } from "./landing-motion";
import { FullResultPreview } from "./landing-result-preview";
import { StepCarousel } from "./landing-step-carousel";
import { SITE_NAME, SITE_URL } from "./site-config";

const PAGE_TITLE =
  "Diagnóstico Estratégico de Perfil no Instagram | Projeto 8D";
const PAGE_DESCRIPTION = `Descubra o que trava seu Instagram: score estratégico, pontos críticos com evidência e plano de ação em 24h, 7 e 30 dias. Diagnóstico completo por R$ ${formatPriceDisplay(INITIAL_PRICE_AMOUNT_CENTS)}.`;

export const metadata: Metadata = {
  title: PAGE_TITLE,
  description: PAGE_DESCRIPTION,
  alternates: {
    canonical: SITE_URL,
  },
  openGraph: {
    title: PAGE_TITLE,
    description: PAGE_DESCRIPTION,
    url: SITE_URL,
    siteName: SITE_NAME,
    locale: "pt_BR",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: PAGE_TITLE,
    description: PAGE_DESCRIPTION,
  },
};

const PRICE_DISPLAY = formatPriceDisplay(INITIAL_PRICE_AMOUNT_CENTS);
const PRICE_MACHINE = formatPriceMachine(INITIAL_PRICE_AMOUNT_CENTS);

const HERO_BADGES = [
  { icon: Gauge, label: "Score por evidência" },
  { icon: FileCheck, label: "Nada inventado" },
  { icon: Lock, label: "Evidências privadas" },
] as const;

const OFFER_INCLUDES = [
  "Score Estratégico por dimensão",
  "Pontos críticos com evidência",
  "Prioridades e plano de ação",
  "Leitura ajustada ao seu tipo de perfil",
] as const;

const RECEIVE_ITEMS = [
  {
    icon: Gauge,
    title: "Score real do perfil",
    hint: "Não é uma nota solta, é por dimensão",
  },
  {
    icon: Target,
    title: "Pontos críticos",
    hint: "O que trava resultado, com evidência",
  },
  {
    icon: ListChecks,
    title: "Prioridades",
    hint: "O que resolver primeiro, não 20 itens",
  },
  {
    icon: Wrench,
    title: "Solução pronta pra aplicar",
    hint: "Não só o problema, o exemplo de correção",
  },
  {
    icon: CalendarCheck,
    title: "Plano de ação",
    hint: "24h, 7 dias e 30 dias",
  },
  {
    icon: Sparkles,
    title: "Oportunidades de conteúdo",
    hint: "Ideias que nascem do seu diagnóstico",
  },
] as const;

const HOW_IT_WORKS = [
  {
    icon: ClipboardList,
    title: "Conte sobre seu perfil",
    description:
      "Perguntas rápidas sobre objetivo, tipo de perfil e principal desafio. Leva menos de 2 minutos.",
    details: [
      "Objetivo do perfil: vender, atrair clientes, construir autoridade ou outro foco",
      "Tipo de perfil: comercial (Business) ou criador de conteúdo (Creator), o que muda os pesos da análise",
      "Principal desafio que você já percebe hoje",
      "Sem letra miúda: só o que é usado no diagnóstico",
    ],
  },
  {
    icon: Upload,
    title: "Envie as evidências",
    description:
      "Prints do perfil: topo, feed, destaques e insights. Cada print vira evidência real analisada, nunca acesso automático à sua conta.",
    details: [
      "Topo do perfil: foto, bio e destaques",
      "Feed: a grade de posts",
      "Destaques (Highlights) abertos",
      "Insights, se você tiver acesso (não é obrigatório)",
    ],
  },
  {
    icon: ScanSearch,
    title: "Receba sua leitura",
    description:
      "Análise em profundidade pelas 8 Dimensões Estratégicas, cruzando o que você contou com o que as evidências mostram.",
    details: [
      "As 8 Dimensões avaliadas uma a uma, não uma nota solta",
      "Cruzamento entre o briefing e o que as evidências mostram",
      "Falta de evidência vira limitação registrada, nunca é inventada",
      "Leitura ajustada ao seu tipo de perfil (Business ou Creator)",
    ],
  },
  {
    icon: CheckCircle2,
    title: "Veja o que mudar",
    description:
      "Diagnóstico, prioridades e plano de ação em 24h, 7 dias e 30 dias, sem achismo e com evidência.",
    details: [
      "Diagnóstico e evidência por dimensão",
      "Prioridades: o que resolver primeiro, não 20 itens soltos",
      "Plano de ação em 24h, 7 dias e 30 dias",
      "Sugestões de conteúdo que nascem do seu diagnóstico",
    ],
  },
] as const;

const DIMENSIONS = [
  {
    code: "POS",
    icon: Compass,
    label: "Posicionamento",
    description: "Quem você é, para quem fala e por que escolher você.",
    whyItMatters:
      "É a base de tudo: se não fica claro quem você é e para quem fala, nenhuma outra dimensão consegue compensar. Perfis com posicionamento confuso atraem o público errado, mesmo com bom conteúdo.",
    evaluates: [
      "Proposta de valor clara na bio",
      "Público e nicho bem definidos",
      "Diferencial frente a quem faz algo parecido",
    ],
  },
  {
    code: "IMP",
    icon: Eye,
    label: "Primeira Impressão",
    description: "O que fica claro nos primeiros segundos de visita.",
    whyItMatters:
      "Você tem poucos segundos para reter quem chega. Se o topo do perfil não comunica de forma imediata, a pessoa sai antes de conhecer o resto, por melhor que seja o conteúdo mais abaixo.",
    evaluates: [
      "Clareza visual do topo do perfil",
      "Bio, destaques e post fixado alinhados entre si",
      "Tempo que leva pra entender do que se trata o perfil",
    ],
  },
  {
    code: "AUT",
    icon: BadgeCheck,
    label: "Autoridade",
    description: "Sinais de confiança, credibilidade e prova social.",
    whyItMatters:
      "Confiança precede decisão. Sem sinais claros de credibilidade, mesmo um bom produto ou serviço enfrenta resistência antes de qualquer conversa de venda.",
    evaluates: [
      "Provas de resultado, experiência ou especialização",
      "Depoimentos, cases ou credenciais visíveis",
      "Consistência entre o que se diz e o que se entrega",
    ],
  },
  {
    code: "CON",
    icon: PenLine,
    label: "Conteúdo",
    description: "Direção, consistência e utilidade do que é publicado.",
    whyItMatters:
      "Não é sobre postar mais, é sobre postar com direção. Conteúdo sem linha editorial dispersa a audiência e dilui a mensagem central do perfil.",
    evaluates: [
      "Linha editorial e frequência de publicação",
      "Utilidade real para quem consome",
      "Equilíbrio entre atrair, educar e vender",
    ],
  },
  {
    code: "IDE",
    icon: Layers,
    label: "Identidade",
    description: "Reconhecimento visual e de linguagem do perfil.",
    whyItMatters:
      "É o que torna o perfil reconhecível fora do feed, num story compartilhado ou numa captura de tela. Identidade fraca faz o perfil se misturar com a concorrência.",
    evaluates: [
      "Padrão visual: cores, tipografia, composição",
      "Tom de voz consistente entre bio, posts e stories",
      "Reconhecimento do perfil mesmo sem ver o nome",
    ],
  },
  {
    code: "CVR",
    icon: MousePointerClick,
    label: "Conversão",
    description: "Se a atenção vira próxima ação: seguir, comprar, agendar.",
    whyItMatters:
      "Atenção sem conversão é oportunidade perdida. Um perfil pode ter ótimo alcance e ainda assim não gerar resultado, se não houver um caminho claro até a próxima ação.",
    evaluates: [
      "Chamadas para ação claras e presentes",
      "Caminho até a próxima etapa: link, DM, agendamento",
      "Atrito entre interesse e decisão",
    ],
  },
  {
    code: "REL",
    icon: Handshake,
    label: "Relacionamento",
    description: "Proximidade, interação e vínculo com a audiência.",
    whyItMatters:
      "Audiência não é comunidade. Perfis que interagem de verdade criam proximidade que sustenta decisão de compra a médio prazo, não apenas engajamento passageiro.",
    evaluates: [
      "Uso de stories, enquetes e respostas",
      "Frequência real de interação com quem acompanha",
      "Senso de comunidade, não só de audiência",
    ],
  },
  {
    code: "OPR",
    icon: Lightbulb,
    label: "Oportunidades",
    description: "Ativos e potenciais ainda pouco explorados.",
    whyItMatters:
      "Todo perfil tem ativos subaproveitados: formatos, canais ou conteúdos que já funcionaram e podem ser escalados. Essa dimensão mapeia o que já existe e ainda não foi explorado.",
    evaluates: [
      "Formatos e canais ainda não testados",
      "Ativos existentes e subaproveitados",
      "Potencial que o que já funciona ainda não capturou",
    ],
  },
] as const;

const COMPARISON_ROWS = [
  { without: "Vou mudar a bio e ver.", with: "Sei o que mudar e por quê." },
  {
    without: "Preciso postar mais.",
    with: "O problema é conversão, não volume.",
  },
  { without: "Feed mais bonito.", with: "Identidade forte, gargalo é outro." },
  {
    without: "Uma IA genérica já faz isso.",
    with: "Nada é inventado. É evidência cruzada entre as dimensões.",
  },
] as const;

const FAQ_ITEMS = [
  {
    question: "Por que meu Instagram não converte mesmo com bom alcance?",
    answer:
      "Alcance e conversão são dimensões diferentes. Muitas vezes o problema não é quem vê o perfil, e sim o que acontece depois: bio sem proposta clara, destaques sem caminho, nenhuma chamada para ação. O diagnóstico aponta exatamente onde esse caminho quebra.",
  },
  {
    question: "Como saber se minha bio está ruim?",
    answer:
      "Uma bio funciona quando quem chega entende, em segundos, quem você é, para quem fala e o que fazer a seguir. Se falta um desses três pontos, isso aparece na leitura de Posicionamento e Conversão, com a correção específica para o seu caso.",
  },
  {
    question: "O diagnóstico funciona para perfil pequeno?",
    answer:
      "Sim. A leitura avalia posicionamento, identidade, conteúdo e os outros pontos estratégicos do perfil. Não depende do número de seguidores.",
  },
  {
    question: "Preciso enviar métricas do Instagram (Insights)?",
    answer:
      "Não é obrigatório. Você envia prints do perfil como evidência; quando uma métrica não é enviada, esse ponto específico fica registrado como limitação em vez de ser inventado.",
  },
  {
    question: "Isso substitui uma consultoria completa?",
    answer:
      "Não. É um guia inicial direto: mostra o que está funcionando, o que está travando e como corrigir. Para uma consultoria contínua e aprofundada, o caminho é outro.",
  },
] as const;

const NAV_LINKS = [
  { href: "#dimensoes", label: "8 Dimensões" },
  { href: "#como-funciona", label: "Como funciona" },
  { href: "#o-que-voce-recebe", label: "O que você recebe" },
] as const;

function SectionHeading({ kicker, title }: { kicker: string; title: string }) {
  return (
    <div className="mx-auto max-w-2xl text-center">
      <p className="kicker text-accent">{kicker}</p>
      <h2 className="display-title mt-3 text-2xl leading-[1.1] text-cream sm:text-3xl">
        {title}
      </h2>
    </div>
  );
}

function PricingCard() {
  return (
    <div className="pricing-card">
      <span className="pricing-badge">DIAGNÓSTICO COMPLETO</span>
      <div className="pricing-value">
        <span className="pricing-currency">R$</span>
        <span className="pricing-number">{PRICE_DISPLAY}</span>
      </div>
      <p className="pricing-sub">pagamento único · sem assinatura</p>
      <ul className="pricing-list">
        {OFFER_INCLUDES.map((item) => (
          <li className="text-sm text-cream/75" key={item}>
            <span className="text-accent">✓</span> {item}
          </li>
        ))}
      </ul>
      <Link
        className="action-primary action-accent btn-pulse pricing-cta"
        href="/comecar"
      >
        Analisar meu perfil
      </Link>
    </div>
  );
}

export default function Home() {
  // "Service" is valid schema.org but not among Google's supported rich
  // result types, so it never surfaces in the Rich Results Test regardless
  // of correctness -- "Product" is supported, and Google's own requirement
  // is name + one of {review, aggregateRating, offers}, so offers alone
  // (no fabricated rating) is sufficient here.
  const productJsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: SITE_NAME,
    description: PAGE_DESCRIPTION,
    image: `${SITE_URL}/opengraph-image`,
    brand: {
      "@type": "Brand",
      name: SITE_NAME,
    },
    offers: {
      "@type": "Offer",
      price: PRICE_MACHINE,
      priceCurrency: "BRL",
      url: SITE_URL,
      availability: "https://schema.org/InStock",
    },
  };

  const personJsonLd = {
    "@context": "https://schema.org",
    "@type": "Person",
    name: "Silas Silva",
    jobTitle: "Criador da Metodologia 8D",
    description:
      "Técnico em Marketing pelo SENAC, atua com estratégia de conteúdo, posicionamento digital e produção audiovisual.",
    knowsAbout: [
      "Marketing",
      "Mídias Digitais",
      "Branding & Growth",
      "Audiovisual",
      "Fotografia",
    ],
    image: `${SITE_URL}/silassilva.png`,
    url: SITE_URL,
  };

  const faqJsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: FAQ_ITEMS.map((item) => ({
      "@type": "Question",
      name: item.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: item.answer,
      },
    })),
  };

  return (
    <main className="min-h-screen bg-ink text-cream">
      <script
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(productJsonLd).replace(/</g, "\\u003c"),
        }}
        type="application/ld+json"
      />
      <script
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(personJsonLd).replace(/</g, "\\u003c"),
        }}
        type="application/ld+json"
      />
      <script
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(faqJsonLd).replace(/</g, "\\u003c"),
        }}
        type="application/ld+json"
      />
      <AmbientBackground />
      <header className="sticky top-0 z-40 border-b border-white/10 bg-ink/85 backdrop-blur-md">
        <div className="mx-auto flex w-full max-w-[1440px] items-center justify-between gap-4 px-6 py-3 sm:px-10 lg:px-16 xl:px-20">
          <Link className="flex items-center gap-3" href="/">
            <span className="relative h-12 w-12 shrink-0 sm:h-14 sm:w-14">
              <Image
                alt="Projeto 8D"
                className="object-contain"
                fill
                priority
                sizes="56px"
                src="/logo-mark.png"
              />
            </span>
            <span className="kicker hidden text-cream/60 sm:inline">
              Projeto 8D
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
              href="/comecar"
            >
              Analisar meu perfil
            </Link>
          </div>
        </div>
      </header>

      <div className="mx-auto w-full max-w-[1440px] px-6 sm:px-10 lg:px-16 xl:px-20">
        <section className="mx-auto max-w-3xl py-16 text-center sm:py-24">
          <h1 className="display-title gradient-text text-balance text-5xl leading-[1.05] sm:text-6xl lg:text-7xl">
            Descubra o que está travando seu&nbsp;Instagram.
          </h1>
          <p className="mx-auto mt-6 max-w-xl text-lg leading-8 text-cream/70 sm:text-xl">
            Não mostra só o que está errado. Mostra o que mudar, por que mudar
            e como começar.
          </p>

          <div className="mt-10 flex justify-center">
            <Link
              className="action-primary action-accent btn-pulse px-8 py-4 text-sm"
              href="/comecar"
            >
              Analisar meu perfil
            </Link>
          </div>

          <div className="mt-12 flex flex-wrap items-center justify-center gap-x-8 gap-y-4">
            {HERO_BADGES.map(({ icon: Icon, label }) => (
              <div
                className="flex items-center gap-2 text-cream/55"
                key={label}
              >
                <Icon aria-hidden className="h-4 w-4 text-accent" />
                <span className="text-xs font-semibold uppercase tracking-[0.08em]">
                  {label}
                </span>
              </div>
            ))}
          </div>
        </section>

        <section className="py-16 sm:py-24" id="dimensoes">
          <div className="hairline" />
          <Reveal className="mt-10 sm:mt-14">
            <SectionHeading
              kicker="8 Dimensões Estratégicas"
              title="Um perfil, vários ângulos."
            />

            <p className="mx-auto mt-4 max-w-2xl text-center text-sm leading-6 text-cream/60">
              A Metodologia 8D nasceu da prática, analisando perfis reais.
              Cada dimensão isola uma causa específica de resultado travado,
              nunca um sintoma isolado.
            </p>

            <div className="mt-8 grid gap-4">
              {DIMENSIONS.map((dimension) => (
                <div
                  className="card flex flex-col items-center rounded-lg border border-white/10 bg-white/[0.03] p-6 text-center backdrop-blur-md sm:p-8"
                  key={dimension.code}
                >
                  <span className="flex h-12 w-12 items-center justify-center rounded-full border border-accent/30 bg-accent/10 text-accent">
                    <dimension.icon aria-hidden className="h-5 w-5" />
                  </span>
                  <p className="mt-3 font-mono text-[10px] font-black text-cream/30">
                    {dimension.code}
                  </p>
                  <p className="mt-1 text-xl font-semibold text-cream">
                    {dimension.label}
                  </p>
                  <p className="mt-1.5 text-sm font-medium text-accent/80">
                    {dimension.description}
                  </p>

                  <p className="mx-auto mt-4 max-w-xl text-sm leading-6 text-cream/65">
                    {dimension.whyItMatters}
                  </p>

                  <ul className="mx-auto mt-5 grid w-full max-w-xl gap-2 text-left sm:grid-cols-3">
                    {dimension.evaluates.map((item) => (
                      <li
                        className="flex gap-2 rounded-lg border border-white/10 bg-black/20 px-3 py-2.5 text-xs leading-5 text-cream/70"
                        key={item}
                      >
                        <span className="mt-0.5 shrink-0 text-accent">
                          &rarr;
                        </span>
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>

            <div className="mt-6 rounded-lg border border-accent/20 bg-accent/5 p-5">
              <p className="kicker text-[10px] text-accent">Leitura cruzada</p>
              <p className="mt-2 text-sm leading-6 text-cream/70">
                As 8 dimensões não são analisadas isoladamente. Um perfil com
                Identidade forte, boa Primeira Impressão e Conteúdo relevante,
                mas Conversão baixa, não tem oito notas soltas. Tem um
                diagnóstico: o problema não é chamar atenção, é transformar essa
                atenção em ação.
              </p>
            </div>
          </Reveal>
        </section>

        <section className="py-16 sm:py-24">
          <div className="hairline" />
          <Reveal className="mt-10 sm:mt-14">
            <div className="mx-auto flex max-w-2xl flex-col items-center text-center">
              <Image
                alt="Silas Silva, criador da Metodologia 8D"
                className="h-36 w-36 rounded-full border border-white/10 object-cover sm:h-44 sm:w-44"
                height={627}
                src="/silassilva.png"
                width={627}
              />

              <div className="mt-8">
                <SectionHeading
                  kicker="Metodologia 8D"
                  title="Criada por quem já viveu esse problema na prática."
                />
              </div>

              <p className="mt-4 text-sm leading-6 text-cream/65">
                Silas Silva é Técnico em Marketing pelo SENAC e atua com
                estratégia de conteúdo, posicionamento digital e produção
                audiovisual.
              </p>
              <p className="mt-4 text-sm leading-6 text-cream/65">
                A Metodologia 8D surgiu da prática, analisando perfis que
                produzem conteúdo, mas nem sempre conseguem enxergar o que
                funciona, o que está limitando seus resultados e o que deveria
                mudar primeiro.
              </p>
              <p className="mt-4 text-sm leading-6 text-cream/65">
                Essa experiência foi transformada em uma leitura estruturada
                por 8 Dimensões Estratégicas, hoje potencializada por
                inteligência artificial.
              </p>
              <p className="mt-4 text-xs font-medium text-cream/40">
                Marketing · Mídias Digitais · Branding &amp; Growth ·
                Audiovisual · Fotografia
              </p>
            </div>
          </Reveal>
        </section>

        <section className="py-16 sm:py-24" id="como-funciona">
          <div className="hairline" />
          <Reveal className="mt-10 sm:mt-14">
            <SectionHeading
              kicker="Como funciona"
              title="Simples de enviar, profundo de receber."
            />

            <div className="mt-10">
              <StepCarousel
                steps={HOW_IT_WORKS.map((step) => ({
                  ...step,
                  icon: (
                    <step.icon
                      aria-hidden
                      className="h-10 w-10"
                      strokeWidth={1.8}
                    />
                  ),
                }))}
              />
            </div>
          </Reveal>
        </section>

        <section className="py-16 sm:py-24" id="o-que-voce-recebe">
          <div className="hairline" />
          <Reveal className="mt-10 sm:mt-14">
            <SectionHeading
              kicker="O que você recebe"
              title="Clareza sobre o que fazer."
            />

            <div className="mt-8 grid gap-3.5 sm:grid-cols-2">
              {RECEIVE_ITEMS.map((item) => (
                <div
                  className="card flex flex-col items-center gap-3 rounded-lg border border-white/10 bg-white/[0.03] p-5 text-center backdrop-blur-md"
                  key={item.title}
                >
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-accent/30 bg-accent/10 text-accent">
                    <item.icon aria-hidden className="h-[18px] w-[18px]" />
                  </span>
                  <div>
                    <p className="text-base font-semibold text-cream">
                      {item.title}
                    </p>
                    <p className="mt-0.5 text-xs text-cream/50">{item.hint}</p>
                  </div>
                </div>
              ))}
            </div>
          </Reveal>
        </section>

        <section className="py-16 sm:py-24">
          <div className="hairline" />
          <Reveal className="mt-10 sm:mt-14">
            <SectionHeading
              kicker="Achismo x direção"
              title="Pare de tentar adivinhar. Comece a saber."
            />

            <div className="mt-8 overflow-hidden rounded-lg border border-white/10 bg-white/[0.03] backdrop-blur-md">
              <div className="grid grid-cols-2 border-b border-cream/10 bg-white/[0.03]">
                <p className="kicker px-4 py-3 text-center text-cream/45 sm:px-6">
                  Sem diagnóstico
                </p>
                <p className="kicker border-l border-cream/10 px-4 py-3 text-center text-accent sm:px-6">
                  Com o diagnóstico
                </p>
              </div>
              {COMPARISON_ROWS.map((row) => (
                <div
                  className="grid grid-cols-2 border-b border-cream/10 last:border-b-0"
                  key={row.without}
                >
                  <p className="px-4 py-5 text-center text-base leading-6 text-cream/50 sm:px-6">
                    {row.without}
                  </p>
                  <p className="border-l border-cream/10 px-4 py-5 text-center text-base font-medium leading-6 text-cream/90 sm:px-6">
                    {row.with}
                  </p>
                </div>
              ))}
            </div>
          </Reveal>
        </section>

        <section className="py-20 sm:py-28">
          <div className="hairline" />
          <Reveal className="mt-10 sm:mt-14">
            <div className="dark-panel flex flex-col items-center px-6 py-14 text-center sm:px-12 sm:py-20">
              <p className="kicker text-accent">A oferta</p>
              <h2 className="display-title mt-3 text-2xl leading-[1.1] text-cream sm:text-3xl">
                Isso é o que você recebe.
              </h2>
              <p className="mt-4 max-w-2xl text-sm leading-6 text-cream/60">
                Depois de ver como a leitura funciona, aqui está exatamente o
                que está incluso.
              </p>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-cream/60">
                Você não paga para saber uma nota. O score é só o ponto de
                partida. Você paga para entender por que ele é esse, o que está
                causando isso e como corrigir.
              </p>
              <div className="mt-8">
                <PricingCard />
              </div>
            </div>
          </Reveal>
        </section>

        <section className="py-16 sm:py-24">
          <div className="hairline" />
          <Reveal className="mt-10 sm:mt-14">
            <SectionHeading
              kicker="Prova, não promessa"
              title="Você não recebe apenas uma nota."
            />

            <div className="mt-8">
              <FullResultPreview />
            </div>
          </Reveal>
        </section>

        <section className="py-16 sm:py-24">
          <div className="hairline" />
          <Reveal className="mt-10 sm:mt-14">
            <SectionHeading
              kicker="Perguntas frequentes"
              title="Antes de perguntar, leia aqui."
            />

            <div className="mt-8 grid gap-3">
              {FAQ_ITEMS.map((item) => (
                <details
                  className="card group rounded-lg border border-white/10 bg-white/[0.03] backdrop-blur-md"
                  key={item.question}
                >
                  <summary className="flex cursor-pointer list-none items-center justify-between gap-4 p-5 text-sm font-semibold text-cream">
                    {item.question}
                    <span className="shrink-0 font-mono text-lg leading-none text-accent transition-transform group-open:rotate-45">
                      +
                    </span>
                  </summary>
                  <p className="px-5 pb-5 text-sm leading-6 text-cream/65">
                    {item.answer}
                  </p>
                </details>
              ))}
            </div>
          </Reveal>
        </section>

        <section className="py-20 text-center sm:py-32">
          <div className="hairline" />
          <Reveal className="mt-16 sm:mt-24">
            <h2 className="display-title text-2xl leading-[1.15] text-cream sm:text-4xl lg:text-5xl">
              <span className="block whitespace-nowrap">
                Seu perfil pode estar
              </span>
              <span className="block whitespace-nowrap">
                perdendo oportunidades.
              </span>
            </h2>
            <div className="mt-10">
              <Link className="action-primary action-accent" href="/comecar">
                Analisar meu perfil
              </Link>
            </div>
          </Reveal>
        </section>

        <footer className="flex flex-col items-start gap-4 border-t border-white/12 pt-8 pb-10 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <span className="relative h-9 w-9 shrink-0">
              <Image
                alt="Projeto 8D"
                className="object-contain"
                fill
                sizes="36px"
                src="/logo-mark.png"
              />
            </span>
            <p className="text-xs leading-5 text-cream/50">
              Projeto 8D · Metodologia 8D · Desenvolvida por Silas Silva
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

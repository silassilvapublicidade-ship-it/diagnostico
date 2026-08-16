"use client";

import { useCountUp, useGrowIn, useInView } from "./landing-motion";

function ExampleScoreRing({ score }: { score: number }) {
  const [ref, inView] = useInView<HTMLDivElement>(0.4);
  const animated = useCountUp(score, inView);
  const percentage = Math.max(0, Math.min(100, animated));

  return (
    <div
      className="relative flex h-24 w-24 shrink-0 items-center justify-center rounded-full sm:h-28 sm:w-28"
      ref={ref}
      style={{
        background: `conic-gradient(var(--accent) ${percentage * 3.6}deg, color-mix(in srgb, var(--graphite) 12%, transparent) 0deg)`,
      }}
    >
      <div className="flex h-[calc(100%-11px)] w-[calc(100%-11px)] flex-col items-center justify-center rounded-full bg-panel">
        <span className="display-title text-3xl leading-none">
          {animated}
        </span>
        <span className="mt-1 font-mono text-[8px] uppercase tracking-[0.14em] text-graphite/46">
          de 100
        </span>
      </div>
    </div>
  );
}

function ExampleScoreBar({ score }: { score: number }) {
  const [ref, inView] = useInView<HTMLDivElement>(0.6);
  const grown = useGrowIn(score, inView);
  const width = Math.max(0, Math.min(100, grown));

  return (
    <div
      className="h-1.5 w-full overflow-hidden rounded-full bg-cream/10"
      ref={ref}
    >
      <div
        className="h-full rounded-full bg-accent transition-[width] duration-[800ms] ease-out"
        style={{ width: `${width}%` }}
      />
    </div>
  );
}

function MiniStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-cream/10 bg-black/20 px-4 py-3">
      <p className="kicker text-[10px] text-accent">{label}</p>
      <p className="mt-2 text-base font-black text-cream">{value}</p>
    </div>
  );
}

function ExampleDimensionCard({
  label,
  score,
  priority,
  problem,
  evidence,
  consequence,
  correction,
  example,
  nextStep,
  defaultOpen,
}: {
  label: string;
  score: number;
  priority: "Alta" | "Média";
  problem: string;
  evidence: string;
  consequence: string;
  correction: string;
  example: string;
  nextStep: string;
  defaultOpen?: boolean;
}) {
  return (
    <details
      className="group rounded-lg border border-cream/10 bg-panel/84 backdrop-blur-sm transition-shadow duration-300 open:border-accent/35 open:bg-panel-soft open:shadow-[0_20px_60px_-20px_rgba(255,90,0,0.35)]"
      open={defaultOpen}
    >
      <summary className="flex cursor-pointer list-none items-center gap-4 p-5 transition hover:bg-accent/8">
        <div className="flex-1">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <p className="text-lg font-black text-cream">{label}</p>
              <span className="rounded-full border border-accent/30 bg-accent/10 px-2 py-0.5 font-mono text-[9px] uppercase tracking-[0.08em] text-accent">
                Prioridade {priority}
              </span>
            </div>
            <p className="shrink-0 text-sm text-cream/56">{score} pontos</p>
          </div>
          <div className="mt-3">
            <ExampleScoreBar score={score} />
          </div>
        </div>
        <span className="shrink-0 font-mono text-xl leading-none text-accent transition-transform group-open:rotate-45">
          +
        </span>
      </summary>
      <div className="grid gap-3 border-t border-cream/10 px-5 pb-5 pt-4 text-sm leading-6 text-cream/70 sm:grid-cols-2">
        <InsightBlock label="Diagnóstico" value={problem} />
        <InsightBlock label="Evidência" value={evidence} />
        <InsightBlock label="Consequência" value={consequence} />
        <InsightBlock label="Correção" value={correction} />
        <InsightBlock label="Exemplo prático" value={example} />
        <InsightBlock label="Próximo passo" value={nextStep} />
      </div>
    </details>
  );
}

function InsightBlock({ label, value }: { label: string; value: string }) {
  return (
    <div className="card rounded-lg border border-white/10 bg-black/18 p-3.5 shadow-[inset_3px_0_0_rgba(255,90,0,0.45)]">
      <p className="kicker text-[9px] text-accent">{label}</p>
      <p className="mt-1.5 text-sm leading-5 text-cream/72">{value}</p>
    </div>
  );
}

function ExampleList({
  title,
  caption,
  items,
}: {
  title: string;
  caption?: string;
  items: string[];
}) {
  return (
    <div className="lux-panel p-5">
      <div className="flex items-baseline justify-between gap-3">
        <p className="kicker text-accent">{title}</p>
        {caption ? (
          <p className="text-[11px] text-cream/45">{caption}</p>
        ) : null}
      </div>
      <ul className="mt-4 space-y-2.5 text-sm text-cream/75">
        {items.map((item) => (
          <li className="flex gap-2.5" key={item}>
            <span className="shrink-0 text-accent">&rarr;</span>
            <span>{item}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function ExamplePlan({
  timeframe,
  items,
}: {
  timeframe: string;
  items: string[];
}) {
  return (
    <div className="lux-panel p-5">
      <span className="inline-block rounded-md bg-accent px-2.5 py-1 font-mono text-[10px] uppercase tracking-[0.14em] text-ink">
        {timeframe}
      </span>
      <ul className="mt-4 space-y-2.5 text-sm text-cream/75">
        {items.map((item, index) => (
          <li className="flex gap-2" key={item}>
            <span className="shrink-0 font-semibold text-accent">
              {index + 1}.
            </span>
            <span>{item}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function FullResultPreview() {
  return (
    <div className="space-y-5">
      <div className="flex items-center gap-2">
        <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-accent" />
        <p className="kicker text-cream/50">Exemplo ilustrativo</p>
      </div>

      <div className="dark-panel grid gap-6 p-6 sm:p-8 lg:grid-cols-[auto_1fr] lg:items-center">
        <div className="flex items-center gap-5">
          <ExampleScoreRing score={65} />
          <div>
            <p className="text-2xl font-black text-cream">Consistente</p>
            <p className="mt-1 text-xs text-cream/45">Score estratégico</p>
          </div>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <MiniStat label="Classificação" value="Consistente" />
          <MiniStat label="Maior força" value="Identidade · 82" />
          <MiniStat label="Maior gargalo" value="Conversão · 38" />
          <MiniStat label="Maior oportunidade" value="Prova social" />
        </div>
      </div>

      <div className="lux-panel p-5">
        <p className="kicker text-accent">Resumo executivo</p>
        <p className="mt-2.5 text-sm leading-6 text-cream/75">
          Identidade e Primeira Impressão já sustentam o perfil. O gargalo real
          está na Conversão: quem chega entende e confia, mas não sabe qual é o
          próximo passo.
        </p>
      </div>

      <ExampleList
        caption="Nunca mais de 2-3 por vez"
        items={[
          "Bio com proposta clara",
          "Prova de autoridade",
          "Uma chamada por post",
        ]}
        title="Prioridades"
      />

      <div className="grid gap-4 sm:grid-cols-3">
        <ExamplePlan
          items={[
            "Reescrever a bio",
            "Fixar prova de autoridade",
            "Definir a chamada principal",
          ]}
          timeframe="24 horas"
        />
        <ExamplePlan
          items={[
            "Testar 3 variações de CTA nos posts",
            "Publicar 1 story de bastidores",
            "Revisar destaques com o novo direcionamento",
          ]}
          timeframe="7 dias"
        />
        <ExamplePlan
          items={[
            "Medir a resposta ao novo CTA",
            "Fixar a prova de autoridade em destaque",
            "Reavaliar prioridades com base no resultado",
          ]}
          timeframe="30 dias"
        />
      </div>

      <div className="grid gap-3">
        <ExampleDimensionCard
          consequence="Cada visita se perde em silêncio."
          correction="Uma única chamada, repetida em todo lugar."
          defaultOpen
          evidence="Bio e destaques sem nenhuma chamada clara."
          example="Bio: 'Ajudo [X] a [Y]. Comece aqui ↓'"
          label="Conversão"
          nextStep="Reescrever a bio hoje."
          priority="Alta"
          problem="Atenção não vira ação."
          score={38}
        />
        <ExampleDimensionCard
          consequence="Competência sem contexto esfria a decisão."
          correction="Mostrar processo e trajetória, mesmo que breve."
          evidence="Nenhuma credencial ou bastidor no perfil."
          example="Destaque 'Quem sou' com 3-4 stories."
          label="Autoridade"
          nextStep="Gravar um story sobre sua trajetória."
          priority="Média"
          problem="Mostra resultado, não mostra por que confiar."
          score={54}
        />
      </div>

      <ExampleList
        items={[
          "Carrossel 'antes x depois' do posicionamento, fechando com o link da bio.",
          "Story fixo respondendo a dúvida mais comum de quem chega no perfil.",
          "Post mostrando o processo de trabalho, com uma prova real de resultado.",
        ]}
        title="Oportunidades de conteúdo prontas"
      />
    </div>
  );
}

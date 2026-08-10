const EXAMPLE_DISCLAIMER =
  "Exemplo ilustrativo — não é o resultado médio de clientes nem um perfil real.";

function ExampleScoreRing({ score }: { score: number }) {
  const percentage = Math.max(0, Math.min(100, score));

  return (
    <div
      className="relative flex h-28 w-28 shrink-0 items-center justify-center rounded-full sm:h-32 sm:w-32"
      style={{
        background: `conic-gradient(var(--accent) ${percentage * 3.6}deg, color-mix(in srgb, var(--graphite) 12%, transparent) 0deg)`,
      }}
    >
      <div className="flex h-[calc(100%-12px)] w-[calc(100%-12px)] flex-col items-center justify-center rounded-full bg-panel">
        <span className="display-title text-4xl leading-none">{score}</span>
        <span className="mt-1 font-mono text-[9px] uppercase tracking-[0.14em] text-graphite/46">
          de 100
        </span>
      </div>
    </div>
  );
}

function ExampleScoreBar({ score }: { score: number }) {
  return (
    <div className="h-1.5 w-full overflow-hidden rounded-full bg-cream/10">
      <div
        className="h-full rounded-full bg-accent"
        style={{ width: `${Math.max(0, Math.min(100, score))}%` }}
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

export function HeroResultPreview() {
  return (
    <div className="dark-panel relative overflow-hidden p-5 sm:p-6">
      <div className="flex items-center justify-between gap-3">
        <p className="kicker text-accent">Exemplo ilustrativo</p>
        <span className="shrink-0 rounded-full border border-cream/15 bg-black/30 px-2.5 py-1 font-mono text-[9px] uppercase tracking-[0.12em] text-cream/50">
          Pré-visualização
        </span>
      </div>

      <div className="mt-5 flex items-center gap-5">
        <ExampleScoreRing score={65} />
        <div>
          <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-cream/45">
            Score estratégico
          </p>
          <p className="mt-1 text-lg font-black text-cream">
            Em desenvolvimento
          </p>
          <p className="mt-1 text-xs text-cream/50">
            8 Dimensões Estratégicas avaliadas
          </p>
        </div>
      </div>

      <div className="mt-6 space-y-3">
        {(
          [
            { label: "Conversão", score: 38 },
            { label: "Identidade", score: 82 },
            { label: "Posicionamento", score: 70 },
          ] as const
        ).map((row) => (
          <div key={row.label}>
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-cream/80">{row.label}</span>
              <span className="text-cream/50">{row.score}</span>
            </div>
            <div className="mt-1.5">
              <ExampleScoreBar score={row.score} />
            </div>
          </div>
        ))}
      </div>

      <div className="mt-6 rounded-lg border border-accent/30 bg-accent/10 p-4">
        <p className="kicker text-[10px] text-accent">Ponto crítico</p>
        <p className="mt-2 text-sm leading-6 text-cream/85">
          Conversão (38/100) — o perfil recebe visitas, mas não direciona
          para nenhuma ação clara.
        </p>
      </div>

      <div className="mt-4 rounded-lg border border-cream/10 bg-black/20 p-4">
        <p className="kicker text-[10px] text-accent">Próximo passo</p>
        <p className="mt-2 text-sm leading-6 text-cream/72">
          Fixar um destaque &ldquo;Comece aqui&rdquo; com o link principal e
          trocar a bio por uma proposta específica.
        </p>
      </div>
    </div>
  );
}

function ExampleDimensionCard({
  label,
  score,
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
      className="group rounded-lg border border-cream/10 bg-panel/84 open:border-accent/35 open:bg-panel-soft"
      open={defaultOpen}
    >
      <summary className="flex cursor-pointer list-none items-center gap-4 p-5 transition hover:bg-accent/8">
        <div className="flex-1">
          <div className="flex items-center justify-between gap-3">
            <p className="text-xl font-black text-cream">{label}</p>
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
      <div className="grid gap-3 border-t border-cream/10 px-5 pb-5 pt-4 text-sm leading-6 text-cream/70 lg:grid-cols-2">
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
    <div className="rounded-lg border border-cream/10 bg-black/18 p-4 shadow-[inset_3px_0_0_rgba(255,90,0,0.45)]">
      <p className="kicker text-[10px] text-accent">{label}</p>
      <p className="mt-2 text-sm leading-6 text-cream/72">{value}</p>
    </div>
  );
}

function ExampleList({ title, items }: { title: string; items: string[] }) {
  return (
    <div className="lux-panel p-5">
      <p className="kicker text-accent">{title}</p>
      <ul className="mt-4 space-y-3 text-sm leading-6 text-cream/72">
        {items.map((item) => (
          <li className="flex gap-3" key={item}>
            <span className="mt-0.5 shrink-0 text-accent">&rarr;</span>
            <span>{item}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function ExamplePlan({ timeframe, items }: { timeframe: string; items: string[] }) {
  return (
    <div className="lux-panel p-5">
      <span className="inline-block rounded-md bg-accent px-2.5 py-1 font-mono text-[10px] uppercase tracking-[0.14em] text-ink">
        {timeframe}
      </span>
      <ul className="mt-4 space-y-3 text-sm leading-6 text-cream/72">
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
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-accent" />
        <p className="kicker text-cream/50">{EXAMPLE_DISCLAIMER}</p>
      </div>

      <div className="dark-panel grid gap-6 p-6 sm:p-8 lg:grid-cols-[auto_1fr] lg:items-center">
        <div className="flex items-center gap-5">
          <ExampleScoreRing score={65} />
          <div>
            <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-cream/45">
              Score estratégico
            </p>
            <p className="mt-1 text-2xl font-black text-cream">
              Em desenvolvimento
            </p>
          </div>
        </div>
        <div className="grid gap-3 sm:grid-cols-3">
          <MiniStat label="Classificação" value="Em desenvolvimento" />
          <MiniStat label="Dimensões avaliadas" value="8 de 8" />
          <MiniStat label="Método" value="Metodologia Silas Silva" />
        </div>
      </div>

      <div className="grid gap-3">
        <ExampleDimensionCard
          consequence="Quem chega pela primeira vez vê competência sem contexto — e sem contexto, a decisão de seguir ou contratar fica mais fria."
          correction="Adicionar um destaque de bastidores ou processo e citar, mesmo que brevemente, tempo de atuação ou formação na bio ou em um post fixado."
          defaultOpen
          evidence="Nos destaques e no feed enviados não aparece nenhuma credencial, bastidor de processo ou prova de quem está por trás do trabalho."
          example="Destaque 'Quem sou' com 3 a 5 stories: 1 sobre a trajetória, 2 sobre o processo de trabalho, 1 com um resultado real explicado."
          label="Autoridade"
          nextStep="Gravar hoje um story simples explicando há quanto tempo atua e para quem trabalha."
          problem="O perfil mostra resultados, mas não mostra por que confiar em quem os entrega."
          score={54}
        />
        <ExampleDimensionCard
          consequence="Cada visita é uma oportunidade perdida em silêncio, porque a pessoa não sabe qual é o próximo passo depois de gostar do que viu."
          correction="Definir uma única ação prioritária (chamar no direct, clicar no link da bio) e repetir esse caminho na bio, no destaque e no encerramento dos posts."
          evidence="A bio não tem uma chamada para ação, os destaques não incluem um caminho de contato e as publicações recentes não pedem nenhuma ação específica."
          example="Bio: 'Ajudo [público] a [resultado]. Comece aqui.' + destaque fixo 'Comece aqui' com o link. Nos posts, encerrar com uma chamada direta."
          label="Conversão"
          nextStep="Reescrever a bio ainda hoje com uma única chamada clara."
          problem="O perfil recebe atenção, mas não direciona essa atenção para nenhuma ação clara."
          score={38}
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <ExampleList
          items={[
            "Definir uma proposta clara na bio.",
            "Criar um destaque com prova de autoridade.",
            "Padronizar uma única chamada para ação nos próximos posts.",
          ]}
          title="Prioridades"
        />
        <ExamplePlan
          items={[
            "Reescrever a bio com proposta e chamada para ação.",
            "Fixar um destaque ou post com prova de autoridade.",
            "Escolher a ação prioritária que vai aparecer em todo post daqui pra frente.",
          ]}
          timeframe="24 horas"
        />
      </div>
    </div>
  );
}

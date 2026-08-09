"use client";

import { useMemo, useState } from "react";

import { submitDiagnosisAction } from "@/modules/analysis/actions";

type ProfileType = "business" | "creator";

const steps = [
  {
    label: "Objetivo",
    detail: "O que precisa mudar primeiro.",
  },
  {
    label: "Perfil",
    detail: "O tipo de leitura estrategica.",
  },
  {
    label: "Apresentacao",
    detail: "Como voce se posiciona hoje.",
  },
  {
    label: "Desafio",
    detail: "O gargalo percebido.",
  },
  {
    label: "Instagram",
    detail: "Onde a leitura acontece.",
  },
  {
    label: "Evidencias",
    detail: "As provas visuais da analise.",
  },
];

const MAIN_OBJECTIVE_OPTIONS = [
  {
    marker: "CLI",
    label: "Atrair mais clientes",
    description: "Transformar visita em conversa comercial.",
  },
  {
    marker: "REF",
    label: "Ser visto como referencia",
    description: "Aumentar percepcao de autoridade.",
  },
  {
    marker: "ALC",
    label: "Crescer nas redes sociais",
    description: "Criar mais clareza para ampliar alcance.",
  },
  {
    marker: "OPR",
    label: "Conseguir novas oportunidades",
    description: "Preparar o perfil para convites e parcerias.",
  },
  {
    marker: "PRO",
    label: "Deixar meu perfil mais profissional",
    description: "Organizar presenca, mensagem e prova.",
  },
  {
    marker: "CON",
    label: "Criar conteudos melhores",
    description: "Encontrar temas com funcao estrategica.",
  },
];

const PROFILE_CARDS: {
  id: string;
  value: ProfileType;
  marker: string;
  label: string;
  description: string;
}[] = [
  {
    id: "business",
    value: "business",
    marker: "NEG",
    label: "Tenho uma empresa ou negocio",
    description: "Leitura orientada para oferta, prova e conversao.",
  },
  {
    id: "personal",
    value: "creator",
    marker: "IMG",
    label: "Trabalho com minha imagem pessoal",
    description:
      "Leitura orientada para autoridade, identidade e oportunidades.",
  },
  {
    id: "content",
    value: "creator",
    marker: "MID",
    label: "Produzo conteudo para internet",
    description: "Leitura orientada para narrativa, conteudo e crescimento.",
  },
];

const MAIN_DIFFICULTY_OPTIONS = [
  "Meu perfil nao mostra meu valor",
  "Nao sei que conteudo criar",
  "Tenho seguidores, mas poucos resultados",
  "Minha comunicacao esta confusa",
  "Quero me destacar dos concorrentes",
  "Nao sei por onde comecar",
];

const EVIDENCE_FIELDS = [
  { assetType: "profile_top", marker: "TOPO", label: "Tela inicial do perfil" },
  { assetType: "feed", marker: "FEED", label: "Feed" },
  { assetType: "highlights", marker: "DEST", label: "Destaques" },
  { assetType: "insights", marker: "DADO", label: "Insights (opcional)" },
];

export function NewDiagnosisForm() {
  const [step, setStep] = useState(0);
  const [selectedProfileCardId, setSelectedProfileCardId] =
    useState<string>("business");
  const profileType =
    PROFILE_CARDS.find((card) => card.id === selectedProfileCardId)?.value ??
    "business";
  const progress = useMemo(
    () => Math.round(((step + 1) / steps.length) * 100),
    [step],
  );
  const currentStep = steps[step]!;

  return (
    <form
      action={submitDiagnosisAction}
      className="grid w-full min-w-0 max-w-full gap-5 lg:grid-cols-[18rem_1fr]"
      noValidate
    >
      <input name="profileType" type="hidden" value={profileType} />

      <aside className="diagnostic-rail w-full min-w-0 max-w-full p-5 lg:sticky lg:top-8 lg:self-start">
        <p className="kicker text-accent">Trilha de decisao</p>
        <div className="mt-8">
          <p className="display-title text-5xl leading-none">{progress}%</p>
          <p className="mt-2 text-sm leading-6 text-cream/58">
            {currentStep.detail}
          </p>
        </div>
        <div className="mt-6 h-1.5 overflow-hidden rounded-full bg-cream/10">
          <div
            className="h-full rounded-full bg-accent transition-all"
            style={{ width: `${progress}%` }}
          />
        </div>

        <div className="mt-8 grid gap-3">
          {steps.map((item, index) => {
            const isCurrent = index === step;
            const isDone = index < step;

            return (
              <div
                className={`grid grid-cols-[2.25rem_1fr] gap-3 rounded-lg border p-3 transition ${
                  isCurrent
                    ? "border-accent bg-accent/12 text-cream"
                    : "border-cream/10 bg-black/10 text-cream/56"
                }`}
                key={item.label}
              >
                <span
                  className={`flex h-7 w-7 items-center justify-center rounded-md font-mono text-[10px] font-black ${
                    isCurrent || isDone
                      ? "bg-accent text-ink"
                      : "border border-cream/12 text-accent"
                  }`}
                >
                  {String(index + 1).padStart(2, "0")}
                </span>
                <span>
                  <span className="block text-xs font-black uppercase tracking-[0.14em]">
                    {item.label}
                  </span>
                  <span className="mt-1 block text-xs leading-5 text-cream/46">
                    {item.detail}
                  </span>
                </span>
              </div>
            );
          })}
        </div>
      </aside>

      <section className="diagnostic-shell w-full min-w-0 max-w-full overflow-hidden">
        <div className="h-1 bg-cream/8">
          <div
            className="h-full bg-accent transition-all"
            style={{ width: `${progress}%` }}
          />
        </div>

        <div className="min-w-0 p-5 sm:p-7 lg:p-9">
          <div className={step === 0 ? "space-y-7" : "hidden"}>
            <StepHeading
              eyebrow="Primeira decisao"
              title="O que voce quer destravar no seu perfil?"
              subtitle="Escolha uma ou mais prioridades. O diagnostico usa isso para separar desejo, gargalo e evidencias."
            />
            <MarkerCheckboxGroup
              name="mainObjective"
              options={MAIN_OBJECTIVE_OPTIONS}
            />
          </div>

          <div className={step === 1 ? "space-y-7" : "hidden"}>
            <StepHeading
              eyebrow="Tipo de leitura"
              title="Qual e o seu perfil?"
              subtitle="Essa escolha define os pesos da Metodologia Silas Silva: negocio e criador nao sao avaliados do mesmo jeito."
            />
            <div className="grid gap-4 sm:grid-cols-3">
              {PROFILE_CARDS.map((card) => (
                <button
                  className={`min-h-44 rounded-lg border p-5 text-left transition ${
                    selectedProfileCardId === card.id
                      ? "border-accent bg-accent/15 text-cream shadow-[inset_3px_0_0_var(--accent)]"
                      : "border-cream/10 bg-panel-soft/80 text-cream hover:border-accent/70 hover:bg-accent/10"
                  }`}
                  key={card.id}
                  onClick={() => setSelectedProfileCardId(card.id)}
                  type="button"
                >
                  <span
                    className={`choice-marker ${
                      selectedProfileCardId === card.id
                        ? "border-accent bg-accent text-ink"
                        : ""
                    }`}
                  >
                    {card.marker}
                  </span>
                  <span className="mt-5 block text-base font-black leading-6">
                    {card.label}
                  </span>
                  <span className="mt-3 block text-sm leading-6 text-cream/56">
                    {card.description}
                  </span>
                </button>
              ))}
            </div>
          </div>

          <div className={step === 2 ? "space-y-7" : "hidden"}>
            <StepHeading
              eyebrow="Posicionamento atual"
              title="Como voce se apresenta hoje?"
              subtitle="Escreva como voce explicaria sua oferta para alguem que acabou de chegar no perfil."
            />
            <TextArea
              label="Fale com suas palavras"
              name="niche"
              placeholder="Exemplo: sou personal trainer, ajudo pessoas a emagrecer e ganhar massa muscular."
              required
              rows={5}
            />
          </div>

          <div className={step === 3 ? "space-y-7" : "hidden"}>
            <StepHeading
              eyebrow="Gargalo percebido"
              title="Qual e o seu maior desafio hoje?"
              subtitle="Aqui voce aponta o que sente. Depois as evidencias mostram se o perfil confirma ou contradiz essa percepcao."
            />
            <CheckboxGroup
              name="mainDifficulty"
              options={MAIN_DIFFICULTY_OPTIONS}
            />
          </div>

          <div className={step === 4 ? "space-y-7" : "hidden"}>
            <StepHeading
              eyebrow="Origem da leitura"
              title="Envie seu perfil."
              subtitle="Use o link principal do Instagram que deve ser analisado."
            />
            <TextField
              label="Instagram"
              name="instagramUrl"
              placeholder="https://instagram.com/seuperfil"
              required
              type="url"
            />
          </div>

          <div className={step === 5 ? "space-y-7" : "hidden"}>
            <StepHeading
              eyebrow="Provas visuais"
              title="Agora envie as evidencias para analise."
              subtitle="As imagens sustentam a leitura. Sem evidencia, a metodologia deve assumir limite e reduzir confianca."
            />

            <div className="grid gap-4 sm:grid-cols-2">
              {EVIDENCE_FIELDS.map((field) => (
                <label className="choice-card block p-5" key={field.assetType}>
                  <span className="flex items-center gap-3 text-sm font-black">
                    <span className="choice-marker">{field.marker}</span>
                    {field.label}
                  </span>
                  <input
                    accept="image/png,image/jpeg,image/webp,application/pdf"
                    className="mt-5 block w-full text-sm text-cream/60 file:mr-3 file:rounded-md file:border-0 file:bg-accent file:px-3 file:py-2 file:text-ink file:transition hover:file:bg-accent-soft"
                    multiple
                    name={`asset_${field.assetType}`}
                    type="file"
                  />
                </label>
              ))}
            </div>

            <label className="choice-card flex gap-4 p-5 text-sm leading-6 text-cream/72">
              <input
                className="mt-1 accent-accent"
                name="processingConsent"
                required
                type="checkbox"
              />
              <span>
                Autorizo o processamento dos dados e evidencias enviados para
                produzir o Diagnostico Estrategico de Perfil, incluindo a
                leitura por inteligencia artificial, com retencao inicial de 90
                dias.
              </span>
            </label>

            <button className="action-primary action-accent w-full sm:w-auto">
              Enviar diagnostico
            </button>
          </div>
        </div>

        <div className="flex items-center justify-between border-t border-cream/10 bg-black/12 px-5 py-4 sm:px-7 lg:px-9">
          <button
            className="action-secondary disabled:cursor-not-allowed disabled:opacity-30"
            disabled={step === 0}
            onClick={() => setStep((current) => Math.max(0, current - 1))}
            type="button"
          >
            Voltar
          </button>
          {step < steps.length - 1 ? (
            <button
              className="action-primary action-accent"
              onClick={() =>
                setStep((current) => Math.min(steps.length - 1, current + 1))
              }
              type="button"
            >
              Continuar
            </button>
          ) : null}
        </div>
      </section>
    </form>
  );
}

function StepHeading({
  eyebrow,
  title,
  subtitle,
}: {
  eyebrow: string;
  title: string;
  subtitle?: string;
}) {
  return (
    <div>
      <p className="kicker text-accent">{eyebrow}</p>
      <h2 className="mt-3 max-w-3xl text-3xl font-black leading-tight sm:text-4xl">
        {title}
      </h2>
      {subtitle ? (
        <p className="mt-3 max-w-2xl text-sm leading-6 text-cream/58">
          {subtitle}
        </p>
      ) : null}
    </div>
  );
}

function TextField({
  label,
  name,
  placeholder,
  required,
  type = "text",
}: {
  label: string;
  name: string;
  placeholder?: string;
  required?: boolean;
  type?: string;
}) {
  return (
    <label className="block">
      <span className="text-sm font-semibold text-cream/70">{label}</span>
      <input
        className="form-control mt-2"
        name={name}
        placeholder={placeholder}
        required={required}
        type={type}
      />
    </label>
  );
}

function TextArea({
  label,
  name,
  placeholder,
  required,
  rows = 3,
}: {
  label: string;
  name: string;
  placeholder?: string;
  required?: boolean;
  rows?: number;
}) {
  return (
    <label className="block">
      <span className="text-sm font-semibold text-cream/70">{label}</span>
      <textarea
        className="form-control mt-2 resize-y"
        name={name}
        placeholder={placeholder}
        required={required}
        rows={rows}
      />
    </label>
  );
}

function CheckboxGroup({ name, options }: { name: string; options: string[] }) {
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {options.map((option, index) => (
        <label className="choice-card flex items-start gap-4 p-4" key={option}>
          <input
            className="sr-only"
            name={name}
            type="checkbox"
            value={option}
          />
          <span className="choice-marker">
            {String(index + 1).padStart(2, "0")}
          </span>
          <span className="text-sm font-semibold leading-6 text-cream/82">
            {option}
          </span>
        </label>
      ))}
    </div>
  );
}

function MarkerCheckboxGroup({
  name,
  options,
}: {
  name: string;
  options: { marker: string; label: string; description: string }[];
}) {
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {options.map((option) => (
        <label
          className="choice-card grid min-h-28 grid-cols-[2.2rem_1fr] gap-4 p-4"
          key={option.label}
        >
          <input
            className="sr-only"
            name={name}
            type="checkbox"
            value={option.label}
          />
          <span className="choice-marker">{option.marker}</span>
          <span>
            <span className="block text-sm font-black leading-6">
              {option.label}
            </span>
            <span className="mt-1 block text-xs leading-5 text-cream/50">
              {option.description}
            </span>
          </span>
        </label>
      ))}
    </div>
  );
}

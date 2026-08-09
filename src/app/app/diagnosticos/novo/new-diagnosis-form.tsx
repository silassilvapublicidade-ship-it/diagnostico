"use client";

import { useMemo, useState } from "react";

import { submitDiagnosisAction } from "@/modules/analysis/actions";

type ProfileType = "business" | "creator";

const steps = [
  "Objetivo",
  "Seu perfil",
  "Apresentacao",
  "Desafio",
  "Instagram",
  "Evidencias",
];

const MAIN_OBJECTIVE_OPTIONS = [
  { marker: "CLI", label: "Atrair mais clientes" },
  { marker: "REF", label: "Ser visto como referencia" },
  { marker: "ALC", label: "Crescer nas redes sociais" },
  { marker: "OPR", label: "Conseguir novas oportunidades" },
  { marker: "PRO", label: "Deixar meu perfil mais profissional" },
  { marker: "CON", label: "Criar conteudos melhores" },
];

const PROFILE_CARDS: {
  id: string;
  value: ProfileType;
  marker: string;
  label: string;
}[] = [
  {
    id: "business",
    value: "business",
    marker: "NEG",
    label: "Tenho uma empresa ou negocio",
  },
  {
    id: "personal",
    value: "creator",
    marker: "IMG",
    label: "Trabalho com minha imagem pessoal",
  },
  {
    id: "content",
    value: "creator",
    marker: "MID",
    label: "Produzo conteudo para internet",
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

  return (
    <form action={submitDiagnosisAction} className="space-y-8" noValidate>
      <input name="profileType" type="hidden" value={profileType} />

      <div className="border border-graphite/10 bg-white/44 p-4">
        <div className="h-2 bg-graphite/10">
          <div
            className="h-2 bg-accent transition-all"
            style={{ width: `${progress}%` }}
          />
        </div>
        <div className="mt-4 flex items-center justify-between gap-4">
          <p className="kicker text-accent">{steps[step]}</p>
          <p className="font-mono text-sm font-black text-graphite">
            {progress}%
          </p>
        </div>
      </div>

      <section className={step === 0 ? "space-y-6" : "hidden"}>
        <StepHeading
          eyebrow="Primeira decisao"
          title="O que voce quer destravar no seu perfil?"
        />
        <MarkerCheckboxGroup
          name="mainObjective"
          options={MAIN_OBJECTIVE_OPTIONS}
        />
      </section>

      <section className={step === 1 ? "space-y-6" : "hidden"}>
        <StepHeading eyebrow="Tipo de leitura" title="Qual e o seu perfil?" />
        <div className="grid gap-3 sm:grid-cols-3">
          {PROFILE_CARDS.map((card) => (
            <button
              className={`min-h-36 border p-5 text-left transition ${
                selectedProfileCardId === card.id
                  ? "border-accent bg-graphite text-paper"
                  : "border-graphite/12 bg-white/46 text-graphite hover:border-accent/70 hover:bg-white/82"
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
            </button>
          ))}
        </div>
      </section>

      <section className={step === 2 ? "space-y-6" : "hidden"}>
        <StepHeading
          eyebrow="Posicionamento atual"
          title="Como voce se apresenta hoje?"
        />
        <TextArea
          label="Fale com suas palavras"
          name="niche"
          placeholder="Exemplo: sou personal trainer, ajudo pessoas a emagrecer e ganhar massa muscular."
          required
          rows={4}
        />
      </section>

      <section className={step === 3 ? "space-y-6" : "hidden"}>
        <StepHeading
          eyebrow="Gargalo percebido"
          title="Qual e o seu maior desafio hoje?"
        />
        <CheckboxGroup
          name="mainDifficulty"
          options={MAIN_DIFFICULTY_OPTIONS}
        />
      </section>

      <section className={step === 4 ? "space-y-6" : "hidden"}>
        <StepHeading eyebrow="Origem da leitura" title="Envie seu perfil." />
        <TextField
          label="Instagram"
          name="instagramUrl"
          placeholder="https://instagram.com/seuperfil"
          required
          type="url"
        />
      </section>

      <section className={step === 5 ? "space-y-6" : "hidden"}>
        <div>
          <StepHeading
            eyebrow="Provas visuais"
            title="Agora envie as evidencias para analise."
          />
          <p className="mt-3 max-w-2xl text-sm leading-6 text-graphite/64">
            Nossa inteligencia analisa seu perfil a partir das informacoes e
            materiais enviados. Os arquivos ficam em bucket privado, com prazo
            inicial de retencao de 90 dias.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          {EVIDENCE_FIELDS.map((field) => (
            <label className="lux-panel block p-4" key={field.assetType}>
              <span className="flex items-center gap-3 text-sm font-black">
                <span className="choice-marker">{field.marker}</span>
                {field.label}
              </span>
              <input
                accept="image/png,image/jpeg,image/webp,application/pdf"
                className="mt-4 block w-full text-sm text-graphite/60 file:mr-3 file:border-0 file:bg-graphite file:px-3 file:py-2 file:text-paper file:transition hover:file:bg-accent hover:file:text-ink"
                multiple
                name={`asset_${field.assetType}`}
                type="file"
              />
            </label>
          ))}
        </div>

        <label className="choice-card flex gap-3 p-5 text-sm leading-6 text-graphite/72">
          <input
            className="mt-1 accent-accent"
            name="processingConsent"
            required
            type="checkbox"
          />
          <span>
            Autorizo o processamento dos dados e evidencias enviados para
            produzir o Diagnostico Estrategico de Perfil, incluindo a leitura
            por inteligencia artificial, com retencao inicial de 90 dias.
          </span>
        </label>

        <button className="action-primary w-full sm:w-auto">
          Enviar diagnostico
        </button>
      </section>

      <div className="flex items-center justify-between border-t border-graphite/12 pt-5">
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
            className="action-primary"
            onClick={() =>
              setStep((current) => Math.min(steps.length - 1, current + 1))
            }
            type="button"
          >
            Continuar
          </button>
        ) : null}
      </div>
    </form>
  );
}

function StepHeading({ eyebrow, title }: { eyebrow: string; title: string }) {
  return (
    <div>
      <p className="kicker text-graphite/42">{eyebrow}</p>
      <h2 className="mt-3 text-3xl font-black leading-tight sm:text-4xl">
        {title}
      </h2>
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
      <span className="text-sm font-semibold text-graphite/70">{label}</span>
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
      <span className="text-sm font-semibold text-graphite/70">{label}</span>
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
        <label className="choice-card flex items-start gap-3 p-4" key={option}>
          <input
            className="mt-1 accent-accent"
            name={name}
            type="checkbox"
            value={option}
          />
          <span className="choice-marker">
            {String(index + 1).padStart(2, "0")}
          </span>
          <span className="text-sm font-semibold leading-6">{option}</span>
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
  options: { marker: string; label: string }[];
}) {
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {options.map((option) => (
        <label
          className="choice-card flex min-h-20 items-center gap-4 p-4"
          key={option.label}
        >
          <input
            className="accent-accent"
            name={name}
            type="checkbox"
            value={option.label}
          />
          <span className="choice-marker">{option.marker}</span>
          <span className="text-sm font-black leading-6">{option.label}</span>
        </label>
      ))}
    </div>
  );
}

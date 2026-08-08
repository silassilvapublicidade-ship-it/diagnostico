"use client";

import { useMemo, useState } from "react";

import { ASSET_TYPES } from "@/modules/assets/validation";
import { submitDiagnosisAction } from "@/modules/analysis/actions";

const steps = [
  "Sobre voce",
  "Seu segmento",
  "Objetivo",
  "Dificuldade",
  "Seu perfil",
  "Evidencias",
];

const assetLabels = {
  profile_top: "Topo do perfil",
  feed: "Feed",
  highlights: "Destaques",
  insights: "Insights",
  stories: "Stories",
  comments: "Comentarios",
  other: "Outros",
} as const;

const MAIN_OBJECTIVE_OPTIONS = [
  "Atrair mais clientes",
  "Vender mais produtos ou servicos",
  "Ser reconhecido como autoridade",
  "Melhorar meu posicionamento profissional",
  "Crescer como criador de conteudo",
  "Conseguir parcerias e oportunidades",
  "Organizar melhor minha comunicacao",
  "Outro",
];

const MAIN_DIFFICULTY_OPTIONS = [
  "Nao sei se meu perfil passa confianca",
  "Tenho dificuldade de criar conteudo",
  "Meu perfil nao deixa claro o que faco",
  "Tenho poucos resultados atraves do Instagram",
  "Sinto que meu conteudo nao representa meu valor",
  "Tenho dificuldade de me diferenciar",
  "Nao sei como transformar seguidores em oportunidades",
  "Outro",
];

export function NewDiagnosisForm() {
  const [step, setStep] = useState(0);
  const [profileType, setProfileType] = useState<"business" | "creator">(
    "business",
  );
  const progress = useMemo(
    () => Math.round(((step + 1) / steps.length) * 100),
    [step],
  );

  return (
    <form action={submitDiagnosisAction} className="space-y-8" noValidate>
      <input name="profileType" type="hidden" value={profileType} />

      <div>
        <div className="h-1 bg-graphite/10">
          <div
            className="h-1 bg-accent transition-all"
            style={{ width: `${progress}%` }}
          />
        </div>
        <div className="mt-4 flex items-center justify-between gap-4">
          <p className="font-mono text-xs uppercase tracking-[0.18em] text-accent">
            {steps[step]}
          </p>
          <p className="text-sm text-graphite/54">{progress}%</p>
        </div>
      </div>

      <section className={step === 0 ? "space-y-5" : "hidden"}>
        <div>
          <h2 className="text-3xl font-semibold">Voce e...</h2>
          <p className="mt-3 max-w-xl text-sm leading-6 text-graphite/64">
            A escolha ajusta a leitura para o seu tipo de perfil.
          </p>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          {[
            ["business", "Negocio", "Perfil comercial, servico ou marca."],
            [
              "creator",
              "Criador",
              "Perfil autoral, especialista ou influencia.",
            ],
          ].map(([value, title, body]) => (
            <button
              className={`border p-5 text-left transition ${
                profileType === value
                  ? "border-accent bg-white/70"
                  : "border-graphite/10 bg-white/35 hover:border-accent/40"
              }`}
              key={value}
              onClick={() => setProfileType(value as "business" | "creator")}
              type="button"
            >
              <span className="text-xl font-semibold">{title}</span>
              <span className="mt-2 block text-sm leading-6 text-graphite/62">
                {body}
              </span>
            </button>
          ))}
        </div>
      </section>

      <section className={step === 1 ? "space-y-5" : "hidden"}>
        <h2 className="text-3xl font-semibold">
          Conte rapidamente o que voce faz.
        </h2>
        <TextArea
          label="Nicho ou segmento"
          name="niche"
          placeholder="Exemplo: personal trainer especializado em emagrecimento e hipertrofia."
          required
          rows={3}
        />
      </section>

      <section className={step === 2 ? "space-y-5" : "hidden"}>
        <h2 className="text-3xl font-semibold">
          Qual seu principal objetivo hoje?
        </h2>
        <CheckboxGroup
          label="Selecione uma ou mais opcoes"
          name="mainObjective"
          options={MAIN_OBJECTIVE_OPTIONS}
        />
      </section>

      <section className={step === 3 ? "space-y-5" : "hidden"}>
        <h2 className="text-3xl font-semibold">Qual sua maior dificuldade?</h2>
        <CheckboxGroup
          label="Selecione uma ou mais opcoes"
          name="mainDifficulty"
          options={MAIN_DIFFICULTY_OPTIONS}
        />
      </section>

      <section className={step === 4 ? "space-y-5" : "hidden"}>
        <h2 className="text-3xl font-semibold">Seu perfil.</h2>
        <TextField
          label="Link do Instagram"
          name="instagramUrl"
          placeholder="https://instagram.com/seuperfil"
          required
          type="url"
        />
        <TextArea
          label="Observacao (opcional)"
          name="additionalNotes"
          placeholder="Se quiser, conte algo que considera importante sobre seu momento atual."
        />
      </section>

      <section className={step === 5 ? "space-y-5" : "hidden"}>
        <div>
          <h2 className="text-3xl font-semibold">Evidencias do seu perfil.</h2>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-graphite/64">
            O topo do perfil e obrigatorio. Feed, destaques e insights ajudam a
            leitura a ficar mais completa. Os arquivos ficam em bucket privado,
            com prazo inicial de retencao de 90 dias.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          {ASSET_TYPES.map((assetType) => (
            <label
              className="border border-graphite/10 bg-white/40 p-4"
              key={assetType}
            >
              <span className="text-sm font-semibold">
                {assetLabels[assetType]}
              </span>
              <input
                accept="image/png,image/jpeg,image/webp,application/pdf"
                className="mt-3 block w-full text-sm text-graphite/60 file:mr-3 file:border-0 file:bg-graphite file:px-3 file:py-2 file:text-paper"
                multiple
                name={`asset_${assetType}`}
                type="file"
              />
            </label>
          ))}
        </div>

        <label className="flex gap-3 border border-graphite/10 bg-white/45 p-5 text-sm leading-6 text-graphite/72">
          <input
            className="mt-1"
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

        <button className="bg-graphite px-6 py-3 text-sm font-semibold text-paper transition hover:bg-accent">
          Enviar diagnostico
        </button>
      </section>

      <div className="flex items-center justify-between border-t border-graphite/10 pt-5">
        <button
          className="text-sm text-graphite/60 transition hover:text-accent disabled:opacity-30"
          disabled={step === 0}
          onClick={() => setStep((current) => Math.max(0, current - 1))}
          type="button"
        >
          Voltar
        </button>
        {step < steps.length - 1 ? (
          <button
            className="bg-graphite px-5 py-3 text-sm font-semibold text-paper transition hover:bg-accent"
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
      <span className="text-sm text-graphite/70">{label}</span>
      <input
        className="mt-2 w-full border border-graphite/14 bg-white/70 px-4 py-3 outline-none transition focus:border-accent"
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
      <span className="text-sm text-graphite/70">{label}</span>
      <textarea
        className="mt-2 w-full resize-y border border-graphite/14 bg-white/70 px-4 py-3 outline-none transition focus:border-accent"
        name={name}
        placeholder={placeholder}
        required={required}
        rows={rows}
      />
    </label>
  );
}

function CheckboxGroup({
  label,
  name,
  options,
}: {
  label: string;
  name: string;
  options: string[];
}) {
  return (
    <fieldset className="space-y-3">
      <legend className="text-sm text-graphite/70">{label}</legend>
      <div className="grid gap-2 sm:grid-cols-2">
        {options.map((option) => (
          <label
            className="flex items-start gap-3 border border-graphite/10 bg-white/40 p-3 text-sm leading-6 text-graphite/72"
            key={option}
          >
            <input
              className="mt-1"
              name={name}
              type="checkbox"
              value={option}
            />
            <span>{option}</span>
          </label>
        ))}
      </div>
    </fieldset>
  );
}

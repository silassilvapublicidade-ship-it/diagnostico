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
  { emoji: "🚀", label: "Atrair mais clientes" },
  { emoji: "⭐", label: "Ser visto como referencia" },
  { emoji: "📈", label: "Crescer nas redes sociais" },
  { emoji: "🤝", label: "Conseguir novas oportunidades" },
  { emoji: "🎯", label: "Deixar meu perfil mais profissional" },
  { emoji: "💡", label: "Criar conteudos melhores" },
];

const PROFILE_CARDS: {
  id: string;
  value: ProfileType;
  emoji: string;
  label: string;
}[] = [
  {
    id: "business",
    value: "business",
    emoji: "🏢",
    label: "Tenho uma empresa ou negocio",
  },
  {
    id: "personal",
    value: "creator",
    emoji: "👤",
    label: "Trabalho com minha imagem pessoal",
  },
  {
    id: "content",
    value: "creator",
    emoji: "🎥",
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
  { assetType: "profile_top", emoji: "📱", label: "Tela inicial do perfil" },
  { assetType: "feed", emoji: "📸", label: "Feed" },
  { assetType: "highlights", emoji: "⭐", label: "Destaques" },
  { assetType: "insights", emoji: "📊", label: "Insights (opcional)" },
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
        <h2 className="text-3xl font-semibold">
          O que voce quer melhorar no seu perfil?
        </h2>
        <EmojiCheckboxGroup
          name="mainObjective"
          options={MAIN_OBJECTIVE_OPTIONS}
        />
      </section>

      <section className={step === 1 ? "space-y-5" : "hidden"}>
        <h2 className="text-3xl font-semibold">Qual e o seu perfil?</h2>
        <div className="grid gap-3 sm:grid-cols-3">
          {PROFILE_CARDS.map((card) => (
            <button
              className={`border p-5 text-left transition ${
                selectedProfileCardId === card.id
                  ? "border-accent bg-white/70"
                  : "border-graphite/10 bg-white/35 hover:border-accent/40"
              }`}
              key={card.id}
              onClick={() => setSelectedProfileCardId(card.id)}
              type="button"
            >
              <span className="text-2xl">{card.emoji}</span>
              <span className="mt-3 block text-sm font-medium leading-6 text-graphite/76">
                {card.label}
              </span>
            </button>
          ))}
        </div>
      </section>

      <section className={step === 2 ? "space-y-5" : "hidden"}>
        <h2 className="text-3xl font-semibold">Como voce se apresenta hoje?</h2>
        <TextArea
          label="Fale com suas palavras"
          name="niche"
          placeholder="Exemplo: sou personal trainer, ajudo pessoas a emagrecer e ganhar massa muscular."
          required
          rows={3}
        />
      </section>

      <section className={step === 3 ? "space-y-5" : "hidden"}>
        <h2 className="text-3xl font-semibold">
          Qual e o seu maior desafio hoje?
        </h2>
        <CheckboxGroup
          name="mainDifficulty"
          options={MAIN_DIFFICULTY_OPTIONS}
        />
      </section>

      <section className={step === 4 ? "space-y-5" : "hidden"}>
        <h2 className="text-3xl font-semibold">Envie seu perfil.</h2>
        <TextField
          label="Instagram"
          name="instagramUrl"
          placeholder="https://instagram.com/seuperfil"
          required
          type="url"
        />
      </section>

      <section className={step === 5 ? "space-y-5" : "hidden"}>
        <div>
          <h2 className="text-3xl font-semibold">
            Agora envie algumas imagens para nossa analise.
          </h2>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-graphite/64">
            Nossa inteligencia analisa seu perfil a partir das informacoes e
            materiais enviados. Os arquivos ficam em bucket privado, com prazo
            inicial de retencao de 90 dias.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          {EVIDENCE_FIELDS.map((field) => (
            <label
              className="border border-graphite/10 bg-white/40 p-4"
              key={field.assetType}
            >
              <span className="text-sm font-semibold">
                {field.emoji} {field.label}
              </span>
              <input
                accept="image/png,image/jpeg,image/webp,application/pdf"
                className="mt-3 block w-full text-sm text-graphite/60 file:mr-3 file:border-0 file:bg-graphite file:px-3 file:py-2 file:text-paper"
                multiple
                name={`asset_${field.assetType}`}
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

function CheckboxGroup({ name, options }: { name: string; options: string[] }) {
  return (
    <div className="grid gap-2 sm:grid-cols-2">
      {options.map((option) => (
        <label
          className="flex items-start gap-3 border border-graphite/10 bg-white/40 p-3 text-sm leading-6 text-graphite/72"
          key={option}
        >
          <input className="mt-1" name={name} type="checkbox" value={option} />
          <span>{option}</span>
        </label>
      ))}
    </div>
  );
}

function EmojiCheckboxGroup({
  name,
  options,
}: {
  name: string;
  options: { emoji: string; label: string }[];
}) {
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {options.map((option) => (
        <label
          className="flex items-center gap-3 border border-graphite/10 bg-white/40 p-4 text-sm font-medium leading-6 text-graphite/76 transition has-[:checked]:border-accent has-[:checked]:bg-white/70"
          key={option.label}
        >
          <input name={name} type="checkbox" value={option.label} />
          <span className="text-xl">{option.emoji}</span>
          <span>{option.label}</span>
        </label>
      ))}
    </div>
  );
}

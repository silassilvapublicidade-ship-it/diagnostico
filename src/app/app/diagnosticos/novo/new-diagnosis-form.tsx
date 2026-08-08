"use client";

import { useMemo, useState } from "react";

import { ASSET_TYPES } from "@/modules/assets/validation";
import { submitDiagnosisAction } from "@/modules/analysis/actions";

const steps = [
  "Sobre o perfil",
  "Objetivo",
  "Contexto e dificuldades",
  "Evidencias",
  "Revisao e consentimento",
  "Envio",
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
          <h2 className="text-3xl font-semibold">Qual perfil vamos ler?</h2>
          <p className="mt-3 max-w-xl text-sm leading-6 text-graphite/64">
            A escolha muda pesos e perguntas. O engine deterministico nao
            interpreta conteudo; ele estrutura o resultado quando houver
            evidencias avaliadas pela camada certa.
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

        <label className="block">
          <span className="text-sm text-graphite/70">URL do Instagram</span>
          <input
            className="mt-2 w-full border border-graphite/14 bg-white/70 px-4 py-3 outline-none transition focus:border-accent"
            name="instagramUrl"
            placeholder="https://instagram.com/seuperfil"
            required
            type="url"
          />
        </label>

        {profileType === "business" ? (
          <div className="grid gap-4 sm:grid-cols-2">
            <TextField label="Segmento" name="segment" required />
            <TextField label="Oferta principal" name="mainOffer" required />
            <TextField label="Publico" name="targetAudience" required />
            <TextField label="Diferenciais" name="differentiators" required />
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            <TextField label="Nicho" name="niche" required />
            <TextField
              label="Territorio de conteudo"
              name="contentTerritory"
              required
            />
            <TextField
              label="Publico desejado"
              name="desiredAudience"
              required
            />
            <TextField label="Formatos principais" name="formats" required />
          </div>
        )}
      </section>

      <section className={step === 1 ? "space-y-5" : "hidden"}>
        <h2 className="text-3xl font-semibold">O que precisa mudar?</h2>
        <TextArea
          label="Objetivo principal"
          name="mainObjective"
          required
          rows={4}
        />
        <TextField label="CTA desejado" name="desiredCta" required />
        {profileType === "creator" ? (
          <TextArea
            label="Marcas ou parcerias desejadas"
            name="desiredPartnerships"
            required
          />
        ) : null}
      </section>

      <section className={step === 2 ? "space-y-5" : "hidden"}>
        <h2 className="text-3xl font-semibold">Contexto antes da leitura.</h2>
        <TextArea
          label="Principal dificuldade"
          name="mainDifficulty"
          required
          rows={4}
        />
        {profileType === "business" ? (
          <>
            <TextArea
              label="Provas ou autoridade existentes"
              name="authorityProofs"
              required
            />
            <TextArea label="Contexto atual" name="currentContext" required />
          </>
        ) : (
          <>
            <TextArea
              label="Identidade percebida"
              name="perceivedIdentity"
              required
            />
            <TextArea label="Limites de exposicao" name="exposureLimits" />
          </>
        )}
        <TextArea
          label="Restricoes reputacionais"
          name="reputationRestrictions"
        />
      </section>

      <section className={step === 3 ? "space-y-5" : "hidden"}>
        <div>
          <h2 className="text-3xl font-semibold">Evidencias privadas.</h2>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-graphite/64">
            Envie screenshots ou PDFs que ajudem a futura camada de analise. Os
            arquivos ficam em bucket privado, com prazo inicial de retencao de
            90 dias.
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
      </section>

      <section className={step === 4 ? "space-y-5" : "hidden"}>
        <h2 className="text-3xl font-semibold">Revisao e consentimento.</h2>
        <TextArea
          label="Links relevantes"
          name="links"
          placeholder="Um por linha ou separados por virgula"
        />
        <TextArea label="Observacoes adicionais" name="additionalNotes" />
        <label className="flex gap-3 border border-graphite/10 bg-white/45 p-5 text-sm leading-6 text-graphite/72">
          <input
            className="mt-1"
            name="processingConsent"
            required
            type="checkbox"
          />
          <span>
            Autorizo o processamento dos dados e arquivos enviados para produzir
            o Diagnostico Estrategico de Perfil. Entendo que, em fases futuras,
            essas evidencias poderao ser processadas por inteligencia artificial
            mediante consentimento e que a retencao inicial prevista e de 90
            dias.
          </span>
        </label>
      </section>

      <section className={step === 5 ? "space-y-5" : "hidden"}>
        <h2 className="text-3xl font-semibold">Enviar diagnostico.</h2>
        <p className="max-w-2xl text-sm leading-6 text-graphite/64">
          Ao enviar, criaremos a requisicao, os registros de briefing, os assets
          privados e um job de analise. Nao ha chamada de OpenAI ou pagamento
          nesta fase.
        </p>
        <button className="bg-graphite px-6 py-3 text-sm font-semibold text-paper transition hover:bg-accent">
          Finalizar envio
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
  required,
}: {
  label: string;
  name: string;
  required?: boolean;
}) {
  return (
    <label className="block">
      <span className="text-sm text-graphite/70">{label}</span>
      <input
        className="mt-2 w-full border border-graphite/14 bg-white/70 px-4 py-3 outline-none transition focus:border-accent"
        name={name}
        required={required}
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

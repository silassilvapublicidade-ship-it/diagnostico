"use client";

import {
  BadgeCheck,
  BarChart3,
  Building2,
  CircleDollarSign,
  Compass,
  EyeOff,
  Handshake,
  Images,
  LayoutGrid,
  Lightbulb,
  MessageCircleQuestion,
  MousePointerClick,
  PenLine,
  Smartphone,
  Target,
  TrendingUp,
  Trophy,
  UserRound,
  Video,
  type LucideIcon,
} from "lucide-react";
import { useMemo, useRef, useState, type FormEvent } from "react";

import { createSupabaseBrowserClient } from "@/lib/supabase/browser";
import {
  completeDiagnosisUploadAction,
  markDiagnosisUploadFailedAction,
  prepareDiagnosisUploadAction,
} from "@/modules/analysis/actions";
import {
  collectUploadCandidates,
  getFileAssetType,
  validateUploadCandidates,
} from "@/modules/assets/validation";

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
    icon: Target,
    label: "Atrair mais clientes",
    description: "Transformar visita em conversa comercial.",
  },
  {
    icon: Trophy,
    label: "Ser visto como referencia",
    description: "Aumentar percepcao de autoridade.",
  },
  {
    icon: TrendingUp,
    label: "Crescer nas redes sociais",
    description: "Criar mais clareza para ampliar alcance.",
  },
  {
    icon: Handshake,
    label: "Conseguir novas oportunidades",
    description: "Preparar o perfil para convites e parcerias.",
  },
  {
    icon: BadgeCheck,
    label: "Deixar meu perfil mais profissional",
    description: "Organizar presenca, mensagem e prova.",
  },
  {
    icon: Lightbulb,
    label: "Criar conteudos melhores",
    description: "Encontrar temas com funcao estrategica.",
  },
] as const satisfies readonly IconOption[];

const PROFILE_CARDS: {
  id: string;
  value: ProfileType;
  icon: LucideIcon;
  label: string;
  description: string;
}[] = [
  {
    id: "business",
    value: "business",
    icon: Building2,
    label: "Tenho uma empresa ou negocio",
    description: "Leitura orientada para oferta, prova e conversao.",
  },
  {
    id: "personal",
    value: "creator",
    icon: UserRound,
    label: "Trabalho com minha imagem pessoal",
    description:
      "Leitura orientada para autoridade, identidade e oportunidades.",
  },
  {
    id: "content",
    value: "creator",
    icon: Video,
    label: "Produzo conteudo para internet",
    description: "Leitura orientada para narrativa, conteudo e crescimento.",
  },
];

const MAIN_DIFFICULTY_OPTIONS = [
  {
    icon: EyeOff,
    label: "Meu perfil nao mostra meu valor",
    description: "A percepcao de autoridade nao aparece com clareza.",
  },
  {
    icon: PenLine,
    label: "Nao sei que conteudo criar",
    description: "Falta um caminho editorial para decidir pautas.",
  },
  {
    icon: CircleDollarSign,
    label: "Tenho seguidores, mas poucos resultados",
    description: "A audiencia existe, mas a conversao nao acompanha.",
  },
  {
    icon: MessageCircleQuestion,
    label: "Minha comunicacao esta confusa",
    description: "Oferta, narrativa ou promessa parecem dispersas.",
  },
  {
    icon: Compass,
    label: "Quero me destacar dos concorrentes",
    description: "A diferenciacao ainda nao esta evidente no perfil.",
  },
  {
    icon: MousePointerClick,
    label: "Nao sei por onde comecar",
    description: "Precisa de prioridade clara para agir primeiro.",
  },
] as const satisfies readonly IconOption[];

const EVIDENCE_FIELDS = [
  {
    assetType: "profile_top",
    icon: Smartphone,
    label: "Tela inicial do perfil",
  },
  { assetType: "feed", icon: LayoutGrid, label: "Feed" },
  { assetType: "highlights", icon: Images, label: "Destaques" },
  { assetType: "insights", icon: BarChart3, label: "Insights (opcional)" },
] as const;

type IconOption = {
  icon: LucideIcon;
  label: string;
  description: string;
};

export function NewDiagnosisForm() {
  const formRef = useRef<HTMLFormElement>(null);
  const [step, setStep] = useState(0);
  const [selectedProfileCardId, setSelectedProfileCardId] = useState<
    string | null
  >(null);
  const [stepError, setStepError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submissionError, setSubmissionError] = useState<string | null>(null);
  const [submissionStatus, setSubmissionStatus] = useState<string | null>(null);
  const selectedProfile = PROFILE_CARDS.find(
    (card) => card.id === selectedProfileCardId,
  );
  const profileType = selectedProfile?.value ?? "";
  const progress = useMemo(
    () => Math.round(((step + 1) / steps.length) * 100),
    [step],
  );
  const currentStep = steps[step]!;

  function validateStep(stepToValidate: number, formData: FormData) {
    if (stepToValidate === 0 && formData.getAll("mainObjective").length === 0) {
      return "Escolha pelo menos uma prioridade para continuar.";
    }

    if (stepToValidate === 1 && !selectedProfileCardId) {
      return "Escolha o tipo de perfil para continuar.";
    }

    if (
      stepToValidate === 2 &&
      String(formData.get("niche") ?? "").trim().length < 8
    ) {
      return "Descreva brevemente como voce se apresenta hoje.";
    }

    if (
      stepToValidate === 3 &&
      formData.getAll("mainDifficulty").length === 0
    ) {
      return "Escolha pelo menos um desafio principal.";
    }

    if (stepToValidate === 4) {
      const url = String(formData.get("instagramUrl") ?? "").trim();

      try {
        const parsedUrl = new URL(url);
        const isHttpUrl =
          parsedUrl.protocol === "https:" || parsedUrl.protocol === "http:";

        if (!isHttpUrl || !parsedUrl.hostname) {
          return "Informe um link valido do Instagram.";
        }
      } catch {
        return "Informe um link valido do Instagram.";
      }
    }

    if (stepToValidate === 5) {
      if (formData.get("processingConsent") !== "on") {
        return "Autorize o processamento para enviar o diagnostico.";
      }

      try {
        const files = collectUploadCandidates(formData);
        validateUploadCandidates(
          files.map((file) => ({
            assetType: getFileAssetType(file),
            name: file.name,
            type: file.type,
            size: file.size,
          })),
        );
      } catch (error) {
        return error instanceof Error
          ? error.message
          : "Envie pelo menos uma evidencia do perfil.";
      }
    }

    return null;
  }

  function handleContinue() {
    const form = formRef.current;

    if (!form) {
      return;
    }

    const error = validateStep(step, new FormData(form));

    if (error) {
      setStepError(error);
      return;
    }

    setStepError(null);
    setStep((current) => Math.min(steps.length - 1, current + 1));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (isSubmitting) {
      return;
    }

    if (step < steps.length - 1) {
      handleContinue();
      return;
    }

    const validationError = validateStep(5, new FormData(event.currentTarget));

    if (validationError) {
      setStepError(validationError);
      setStep(5);
      return;
    }

    let preparedRequestId: string | undefined;
    setStepError(null);
    setIsSubmitting(true);
    setSubmissionError(null);
    setSubmissionStatus("Preparando envio seguro das evidencias...");

    try {
      const form = event.currentTarget;
      const rawFormData = new FormData(form);
      const files = collectUploadCandidates(rawFormData);
      const uploadCandidates = validateUploadCandidates(
        files.map((file) => ({
          assetType: getFileAssetType(file),
          name: file.name,
          type: file.type,
          size: file.size,
        })),
      );
      const metadataFormData = new FormData();

      rawFormData.forEach((value, key) => {
        if (!(value instanceof File)) {
          metadataFormData.append(key, value);
        }
      });

      const prepared = await prepareDiagnosisUploadAction(
        metadataFormData,
        uploadCandidates,
      );

      if (!prepared.ok) {
        throw new Error(prepared.error);
      }

      preparedRequestId = prepared.data.requestId;

      if (prepared.data.uploads.length !== files.length) {
        throw new Error("Nao foi possivel preparar todos os arquivos.");
      }

      const supabase = createSupabaseBrowserClient();

      for (const [index, file] of files.entries()) {
        const upload = prepared.data.uploads[index]!;
        setSubmissionStatus(
          `Enviando evidencia ${index + 1} de ${files.length}...`,
        );

        const { error: uploadError } = await supabase.storage
          .from(upload.storageBucket)
          .uploadToSignedUrl(upload.storagePath, upload.token, file, {
            contentType: file.type,
            upsert: false,
          });

        if (uploadError) {
          throw uploadError;
        }
      }

      setSubmissionStatus("Finalizando diagnostico...");

      const completed = await completeDiagnosisUploadAction({
        requestId: prepared.data.requestId,
        assets: prepared.data.uploads.map((upload) => ({
          assetType: upload.assetType,
          storageBucket: upload.storageBucket,
          storagePath: upload.storagePath,
          originalFilename: upload.originalFilename,
          mimeType: upload.mimeType,
          fileSizeBytes: upload.fileSizeBytes,
        })),
      });

      if (!completed.ok) {
        throw new Error(completed.error);
      }

      window.location.assign(completed.data.redirectTo);
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Nao foi possivel enviar as evidencias.";

      if (preparedRequestId) {
        await markDiagnosisUploadFailedAction({
          requestId: preparedRequestId,
          errorMessage: message,
        });
      }

      setSubmissionStatus(null);
      setSubmissionError(message);
      setIsSubmitting(false);
    }
  }

  return (
    <form
      ref={formRef}
      className="grid w-full min-w-0 max-w-full gap-5 lg:grid-cols-[18rem_1fr]"
      noValidate
      onChange={() => {
        setStepError(null);
        setSubmissionError(null);
      }}
      onSubmit={handleSubmit}
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
              subtitle="Essa escolha define os pesos da Metodologia 8D: negócio e criador não são avaliados do mesmo jeito."
            />
            <div className="grid gap-4 sm:grid-cols-3">
              {PROFILE_CARDS.map((card) => (
                <button
                  aria-pressed={selectedProfileCardId === card.id}
                  className={`min-h-44 rounded-lg border p-5 text-left transition ${
                    selectedProfileCardId === card.id
                      ? "border-accent bg-accent/15 text-cream shadow-[inset_3px_0_0_var(--accent)]"
                      : "border-cream/10 bg-panel-soft/80 text-cream hover:border-accent/70 hover:bg-accent/10"
                  }`}
                  key={card.id}
                  onClick={() => {
                    setSelectedProfileCardId(card.id);
                    setStepError(null);
                  }}
                  type="button"
                >
                  <card.icon
                    aria-hidden="true"
                    className={`h-7 w-7 ${
                      selectedProfileCardId === card.id
                        ? "text-accent"
                        : "text-cream/58"
                    }`}
                    strokeWidth={1.8}
                  />
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
                    <span className="flex h-9 w-9 items-center justify-center rounded-lg border border-accent/35 bg-accent/10 text-accent">
                      <field.icon
                        aria-hidden="true"
                        className="h-4 w-4"
                        strokeWidth={1.9}
                      />
                    </span>
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

            <button
              className="action-primary action-accent w-full disabled:cursor-not-allowed disabled:opacity-55 sm:w-auto"
              disabled={isSubmitting}
            >
              {isSubmitting ? "Enviando..." : "Enviar diagnostico"}
            </button>

            {submissionStatus ? (
              <p className="rounded-lg border border-accent/30 bg-accent/10 px-4 py-3 text-sm font-semibold text-cream">
                {submissionStatus}
              </p>
            ) : null}

            {submissionError ? (
              <p className="rounded-lg border border-red-400/40 bg-red-500/10 px-4 py-3 text-sm font-semibold text-cream">
                {submissionError}
              </p>
            ) : null}
          </div>
        </div>

        <div className="flex flex-col gap-4 border-t border-cream/10 bg-black/12 px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-7 lg:px-9">
          <button
            className="action-secondary disabled:cursor-not-allowed disabled:opacity-30"
            disabled={step === 0 || isSubmitting}
            onClick={() => setStep((current) => Math.max(0, current - 1))}
            type="button"
          >
            Voltar
          </button>
          {stepError ? (
            <p className="max-w-md text-sm font-semibold leading-6 text-accent sm:text-center">
              {stepError}
            </p>
          ) : (
            <span className="hidden sm:block" />
          )}
          {step < steps.length - 1 ? (
            <button
              className="action-primary action-accent"
              disabled={isSubmitting}
              onClick={handleContinue}
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

function CheckboxGroup({
  name,
  options,
}: {
  name: string;
  options: readonly IconOption[];
}) {
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {options.map((option) => (
        <label
          className="choice-card grid min-h-28 grid-cols-[2.4rem_1fr] gap-4 p-4"
          key={option.label}
        >
          <input
            className="sr-only"
            name={name}
            type="checkbox"
            value={option.label}
          />
          <span className="flex h-9 w-9 items-center justify-center rounded-lg border border-accent/35 bg-accent/10 text-accent">
            <option.icon
              aria-hidden="true"
              className="h-4 w-4"
              strokeWidth={1.9}
            />
          </span>
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

function MarkerCheckboxGroup({
  name,
  options,
}: {
  name: string;
  options: readonly IconOption[];
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
          <span className="flex h-9 w-9 items-center justify-center rounded-lg border border-accent/35 bg-accent/10 text-accent">
            <option.icon
              aria-hidden="true"
              className="h-4 w-4"
              strokeWidth={1.9}
            />
          </span>
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

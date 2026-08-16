"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { useState, type ReactNode } from "react";

// icon is a pre-rendered element (not a component reference): a component
// function crossing the server/client boundary as a plain prop value can't
// be serialized by React -- only already-rendered JSX can. Render it at the
// call site (a Server Component) and pass the element down.
export type StepCarouselItem = {
  icon: ReactNode;
  title: string;
  description: string;
};

export function StepCarousel({
  steps,
}: {
  steps: readonly StepCarouselItem[];
}) {
  const [index, setIndex] = useState(0);
  const total = steps.length;
  const current = steps[index]!;
  const next = steps[(index + 1) % total]!;

  function goTo(nextIndex: number) {
    setIndex(((nextIndex % total) + total) % total);
  }

  return (
    <div className="card rounded-2xl border border-white/10 bg-white/[0.03] p-6 backdrop-blur-md sm:p-10">
      <div className="grid gap-8 sm:grid-cols-[1fr_auto] sm:items-center">
        <div>
          <span className="inline-flex items-center rounded-full border border-accent/35 bg-accent/10 px-3 py-1 font-mono text-[11px] font-black uppercase tracking-[0.12em] text-accent">
            Passo {String(index + 1).padStart(2, "0")}
          </span>
          <h3 className="display-title mt-4 text-2xl leading-[1.05] text-cream sm:text-3xl">
            {current.title}
          </h3>
          <p className="mt-3 max-w-md text-sm leading-6 text-cream/65 sm:text-base">
            {current.description}
          </p>
        </div>

        <div className="relative mx-auto flex h-24 w-24 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-accent-soft to-accent text-ink shadow-[0_0_50px_rgba(255,90,0,0.35)] sm:h-28 sm:w-28">
          {current.icon}
        </div>
      </div>

      <div className="mt-8 flex items-center justify-center gap-4">
        <button
          aria-label="Passo anterior"
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-white/15 text-cream/70 transition hover:border-accent hover:text-accent"
          onClick={() => goTo(index - 1)}
          type="button"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>

        <div className="flex items-center gap-2">
          {steps.map((step, dotIndex) => (
            <button
              aria-current={dotIndex === index}
              aria-label={`Ir para o passo ${dotIndex + 1}: ${step.title}`}
              className={`h-2 rounded-full transition-all duration-300 ${
                dotIndex === index
                  ? "w-7 bg-gradient-to-r from-accent-soft to-accent"
                  : "w-2 bg-white/20 hover:bg-white/35"
              }`}
              key={step.title}
              onClick={() => goTo(dotIndex)}
              type="button"
            />
          ))}
        </div>

        <button
          aria-label="Próximo passo"
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-white/15 text-cream/70 transition hover:border-accent hover:text-accent"
          onClick={() => goTo(index + 1)}
          type="button"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>

      <p className="mt-6 text-center font-mono text-[11px] uppercase tracking-[0.14em] text-cream/40">
        Próximo: {next.title}
      </p>
    </div>
  );
}

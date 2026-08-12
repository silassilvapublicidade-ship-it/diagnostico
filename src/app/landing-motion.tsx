"use client";

import {
  useEffect,
  useRef,
  useState,
  type ReactNode,
  type RefObject,
} from "react";

export function useInView<T extends HTMLElement>(
  threshold = 0.25,
): [RefObject<T | null>, boolean] {
  const ref = useRef<T | null>(null);
  const [inView, setInView] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) {
          setInView(true);
          observer.disconnect();
        }
      },
      { threshold },
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [threshold]);

  return [ref, inView];
}

export function useCountUp(target: number, active: boolean, duration = 900) {
  // Starts at the real target, never 0: the count-up-from-zero motion only
  // ever happens client-side inside the effect below, so SSR output, a
  // pre-hydration paint, or a no-JS visitor always sees the correct number.
  const [value, setValue] = useState(target);
  const startedRef = useRef(false);

  useEffect(() => {
    if (!active || startedRef.current) return;
    startedRef.current = true;

    const reduceMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    const effectiveDuration = reduceMotion ? 0 : duration;
    const start = performance.now();
    let raf: number;

    const tick = (now: number) => {
      const progress =
        effectiveDuration === 0
          ? 1
          : Math.min(1, (now - start) / effectiveDuration);
      const eased = 1 - (1 - progress) ** 3;
      setValue(Math.round(target * eased));
      if (progress < 1) {
        raf = requestAnimationFrame(tick);
      }
    };

    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [active, target, duration]);

  return value;
}

// For the score bars: unlike the counter (which re-renders every frame),
// a progress bar should animate via a single CSS `transition: width`, not
// a JS-driven per-frame width update (that fights the transition and lags
// behind). Starts at the real target (SSR-safe), then briefly drops to 0
// and back up once in view so the CSS transition plays the "grow in"
// motion - both state changes happen inside rAF callbacks, never
// synchronously in the effect body.
export function useGrowIn(target: number, active: boolean) {
  const [value, setValue] = useState(target);
  const startedRef = useRef(false);

  useEffect(() => {
    if (!active || startedRef.current) return;
    startedRef.current = true;

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      return;
    }

    let raf2: number;
    const raf1 = requestAnimationFrame(() => {
      setValue(0);
      raf2 = requestAnimationFrame(() => {
        setValue(target);
      });
    });

    return () => {
      cancelAnimationFrame(raf1);
      cancelAnimationFrame(raf2);
    };
  }, [active, target]);

  return value;
}

export function Reveal({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  const [ref, inView] = useInView<HTMLDivElement>(0.12);

  return (
    <div
      className={`transition-all duration-700 ease-out motion-reduce:transition-none motion-reduce:opacity-100 motion-reduce:translate-y-0 ${
        inView ? "translate-y-0 opacity-100" : "translate-y-6 opacity-0"
      } ${className ?? ""}`}
      ref={ref}
    >
      {children}
    </div>
  );
}

export function AmbientBackground() {
  return (
    <div aria-hidden className="bg-scene pointer-events-none">
      <div className="bg-orb bg-orb--1" />
      <div className="bg-orb bg-orb--2" />
      <div className="bg-orb bg-orb--3" />
      <div className="bg-noise" />
    </div>
  );
}

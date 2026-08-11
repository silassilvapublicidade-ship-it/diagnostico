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
  const [value, setValue] = useState(0);
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

const NOISE_BACKGROUND =
  "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='200' height='200'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='2' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")";

// Warm accent + accent-soft blend, kept well below full opacity so the
// blur reads as a soft glow instead of muddying into brown over the
// near-black background.
const GLOW_ORBS = [
  { className: "top-[-8%] right-[6%] h-[30rem] w-[30rem]" },
  { className: "top-[42%] left-[-6%] h-[26rem] w-[26rem]" },
  { className: "bottom-[-6%] right-[18%] h-[28rem] w-[28rem]" },
] as const;

export function AmbientBackground() {
  return (
    <div
      aria-hidden
      className="pointer-events-none fixed inset-0 -z-10 overflow-hidden"
    >
      {GLOW_ORBS.map((orb) => (
        <div
          className={`absolute rounded-full blur-[130px] ${orb.className}`}
          key={orb.className}
          style={{
            background:
              "radial-gradient(circle, color-mix(in srgb, var(--accent) 55%, var(--accent-soft) 45%) 0%, transparent 70%)",
            opacity: 0.16,
          }}
        />
      ))}
      <div
        className="absolute inset-0 opacity-[0.045]"
        style={{ backgroundImage: NOISE_BACKGROUND }}
      />
    </div>
  );
}

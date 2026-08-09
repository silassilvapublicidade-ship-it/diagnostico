"use client";

import { useFormStatus } from "react-dom";

export function AnalyzeButton({ hasResult }: { hasResult: boolean }) {
  const { pending } = useFormStatus();

  return (
    <button
      className="action-primary gap-3 disabled:cursor-not-allowed disabled:opacity-60"
      disabled={pending}
      type="submit"
    >
      {pending ? (
        <>
          <span className="h-3 w-3 animate-spin rounded-full border-2 border-paper/40 border-t-paper" />
          Analisando...
        </>
      ) : hasResult ? (
        "Reprocessar analise"
      ) : (
        "Analisar agora"
      )}
    </button>
  );
}

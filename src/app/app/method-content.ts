export const diagnosticDimensions = [
  { code: "POS", label: "Posicionamento" },
  { code: "IMP", label: "Primeira Impressão" },
  { code: "AUT", label: "Autoridade" },
  { code: "CON", label: "Conteúdo" },
  { code: "IDE", label: "Identidade" },
  { code: "CVR", label: "Conversão" },
  { code: "REL", label: "Relacionamento" },
  { code: "OPR", label: "Oportunidades" },
] as const;

export const deliverySteps = [
  "Entender",
  "Priorizar",
  "Corrigir",
  "Construir",
  "Medir",
] as const;

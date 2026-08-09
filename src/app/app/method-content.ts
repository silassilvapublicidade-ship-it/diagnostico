export const diagnosticDimensions = [
  { code: "POS", label: "Posicionamento" },
  { code: "IMP", label: "Primeira Impressao" },
  { code: "AUT", label: "Autoridade" },
  { code: "CON", label: "Conteudo" },
  { code: "IDE", label: "Identidade" },
  { code: "CVR", label: "Conversao" },
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

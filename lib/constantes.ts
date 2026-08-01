export const CATEGORIAS = [
  "Alimentação",
  "Comer Fora",
  "Lazer",
  "Saúde",
  "Transporte",
  "Casa",
  "Outros",
] as const;

export const ROTULOS_CATEGORIAS: Record<string, string> = {
  Alimentação: "Alimentação (Mercados)",
  "Comer Fora": "Comer Fora (Restaurantes)",
};

export const FORMAS_PAGAMENTO = [
  "Débito",
  "Crédito",
  "Pix",
  "Dinheiro",
  "Vale Alimentação",
  "Vale Refeição",
] as const;

export const CORES_CATEGORIAS = [
  "#059669", "#0284c7", "#d97706", "#dc2626", "#7c3aed",
  "#db2777", "#0d9488", "#ea580c", "#0891b2", "#4f46e5",
  "#65a30d", "#c026d3",
];

export const CORES_PAGAMENTOS = [
  "#0d9488", "#4f46e5", "#d97706", "#7c3aed", "#0284c7",
  "#94a3b8", "#e11d48", "#059669", "#65a30d", "#0ea5e9",
  "#c026d3", "#ea580c",
];

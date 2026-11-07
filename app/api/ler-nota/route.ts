import { NextResponse } from "next/server";

// Primário: Qwen3-VL no Hugging Face (barato e preciso em OCR/documentos).
const HF_MODEL = "Qwen/Qwen3-VL-30B-A3B-Instruct:cheapest";
// Fallback gratuito (OpenRouter): modelo open de leitura de notas/documentos.
const FREE_FALLBACK_MODELS = [
  "dots-studio/dots-3-note-preview:free",
  "google/gemma-4-26b-a4b-it:free",
  "nvidia/nemotron-3.5-super-vl:free",
];

const SYSTEM_PROMPT = `Você é um assistente financeiro especializado em ler notas fiscais e extrair dados em formato JSON.
          
CATEGORIAS PERMITIDAS (Escolha apenas uma):
- Alimentação
- Comer Fora
- Lazer
- Saúde
- Transporte
- Casa
- Outros

REGRAS CRÍTICAS DE CLASSIFICAÇÃO (PRIORIDADE MÁXIMA AO CONTEXTO DO USUÁRIO):
O usuário enviará um "Contexto do usuário". O texto do usuário é a verdade absoluta e deve SEMPRE substituir o que estiver impresso na nota.

1. FORMA DE PAGAMENTO (BENEFÍCIOS FLEXÍVEIS: Alelo, Flash, Caju, VR, VA):
   Se o usuário mencionar que pagou com "Alelo", "Flash", "Caju", "Vale", "VR" ou "VA", você DEVE analisar o contexto da compra ou o estabelecimento para definir a forma de pagamento final:
   - Retorne "Vale Alimentação" se a compra foi de mantimentos para casa, compras de mercado, feira, padaria, ou qualquer tipo de estabelecimento que NÃO seja focado em refeições prontas para consumo imediato.
   - Retorne "Vale Refeição" se a compra for de comida pronta, delivery (pediu pizza, lanches, iFood, comer em casa) ou comer fora (restaurantes, bares, lanchonetes).
   
2. OUTRAS FORMAS DE PAGAMENTO:
   Se o usuário não citar os cartões de benefício acima, mas disser que foi Pix, Crédito, Débito ou Dinheiro, retorne exatamente o que ele disse, ignorando o que está na foto da nota.

Retorne APENAS um objeto JSON válido, sem markdown, neste formato exato:
{
  "estabelecimento": "Nome do local",
  "valor": 10.50,
  "data_compra": "YYYY-MM-DD",
  "categoria": "Comer Fora",
  "forma_pagamento": "Vale Refeição"
}`;

type ChatPayload = {
  model: string;
  response_format: { type: "json_object" };
  messages: Array<{
    role: "system" | "user";
    content:
      | string
      | Array<
          | { type: "text"; text: string }
          | { type: "image_url"; image_url: { url: string } }
        >;
  }>;
};

function buildPayload(model: string, imagemBase64: string, contexto?: string): ChatPayload {
  return {
    model,
    response_format: { type: "json_object" },
    messages: [
      { role: "system", content: SYSTEM_PROMPT },
      {
        role: "user",
        content: [
          {
            type: "text",
            text: `Extraia os dados desta nota fiscal. Contexto adicional passado pelo usuário: ${contexto || "Nenhum"}`,
          },
          {
            type: "image_url",
            image_url: { url: `data:image/jpeg;base64,${imagemBase64}` },
          },
        ],
      },
    ],
  };
}

function needsCreditFallback(status: number, body: unknown): boolean {
  if (status === 402) return true;
  const raw = JSON.stringify(body ?? "").toLowerCase();
  return (
    raw.includes("pre-paid credits") ||
    raw.includes("monthly included credits") ||
    raw.includes("payment required") ||
    raw.includes("insufficient") ||
    raw.includes("quota")
  );
}

function extractErrorMessage(data: unknown, fallback: string): string {
  if (!data || typeof data !== "object") {
    return typeof data === "string" && data ? data : fallback;
  }
  const err = data as { error?: { message?: string } | string; message?: string };
  if (typeof err.error === "string") return err.error;
  if (err.error && typeof err.error === "object" && err.error.message) return err.error.message;
  if (err.message) return err.message;
  return fallback;
}

function parseModelJson(conteudoIA: string) {
  const jsonLimpo = conteudoIA.replace(/```json/gi, "").replace(/```/g, "").trim();
  return JSON.parse(jsonLimpo);
}

async function callOpenAICompatible(
  url: string,
  apiKey: string,
  payload: ChatPayload
): Promise<{ ok: boolean; status: number; data: unknown }> {
  const response = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });
  const data = await response.json().catch(() => null);
  const bodyHasError =
    !!data &&
    typeof data === "object" &&
    "error" in data &&
    Boolean((data as { error?: unknown }).error);
  return { ok: response.ok && !bodyHasError, status: response.status, data };
}

async function callFreeFallbacks(
  apiKey: string,
  imagemBase64: string,
  contexto?: string
): Promise<{ ok: boolean; status: number; data: unknown }> {
  let last: { ok: boolean; status: number; data: unknown } = {
    ok: false,
    status: 500,
    data: { error: "Nenhum modelo gratuito disponível no momento." },
  };

  for (const model of FREE_FALLBACK_MODELS) {
    last = await callOpenAICompatible(
      "https://openrouter.ai/api/v1/chat/completions",
      apiKey,
      buildPayload(model, imagemBase64, contexto)
    );
    if (last.ok) return last;
  }

  return last;
}

export async function POST(req: Request) {
  try {
    const { imagemBase64, contexto } = await req.json();

    if (!imagemBase64) {
      return NextResponse.json({ error: "Nenhuma imagem foi enviada pelo aplicativo." }, { status: 400 });
    }

    const hfToken = process.env.HF_TOKEN;
    const openRouterKey = process.env.OPENROUTER_API_KEY;

    let result: { ok: boolean; status: number; data: unknown } | null = null;
    let usedFallback = false;

    if (hfToken) {
      result = await callOpenAICompatible(
        "https://router.huggingface.co/v1/chat/completions",
        hfToken,
        buildPayload(HF_MODEL, imagemBase64, contexto)
      );

      if (!result.ok && needsCreditFallback(result.status, result.data) && openRouterKey) {
        usedFallback = true;
        result = await callFreeFallbacks(openRouterKey, imagemBase64, contexto);
      }
    } else if (openRouterKey) {
      usedFallback = true;
      result = await callFreeFallbacks(openRouterKey, imagemBase64, contexto);
    } else {
      return NextResponse.json(
        {
          error:
            "Nenhuma chave configurada. Defina HF_TOKEN (Hugging Face) ou OPENROUTER_API_KEY no .env.local.",
        },
        { status: 500 }
      );
    }

    if (!result.ok) {
      throw new Error(
        extractErrorMessage(
          result.data,
          usedFallback
            ? "Falha no modelo gratuito de fallback."
            : "Falha na comunicação com o Hugging Face."
        )
      );
    }

    const data = result.data as {
      choices?: Array<{ message?: { content?: string } }>;
    };
    const conteudoIA = data.choices?.[0]?.message?.content;
    if (!conteudoIA) {
      throw new Error("A IA não retornou conteúdo utilizável.");
    }

    const resultadoJSON = parseModelJson(conteudoIA);
    return NextResponse.json(resultadoJSON);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Erro desconhecido";
    console.error("Erro na leitura da nota (Hugging Face):", error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

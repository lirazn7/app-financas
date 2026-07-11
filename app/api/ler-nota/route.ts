import { NextResponse } from "next/server";
import Groq from "groq-sdk";

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

export async function POST(req: Request) {
  try {
    const { imagemBase64, contexto } = await req.json();

    const chatCompletion = await groq.chat.completions.create({
      messages: [
        {
          role: "system",
          content: `Você é um assistente financeiro especializado em ler notas fiscais e extrair dados em formato JSON.
          
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
          }`
        },
        {
          role: "user",
          content: [
            { type: "text", text: `Contexto do usuário: ${contexto || 'Nenhum contexto fornecido.'}` },
            { type: "image_url", image_url: { url: `data:image/jpeg;base64,${imagemBase64}` } }
          ]
        }
      ],
      model: "llama-3.2-11b-vision-preview",
      temperature: 0.1,
      response_format: { type: "json_object" }
    });

    const resposta = chatCompletion.choices[0]?.message?.content || "{}";
    return NextResponse.json(JSON.parse(resposta));
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}
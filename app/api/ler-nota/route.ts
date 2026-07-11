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
          - Alimentação (Mercados, Açougues, Feiras, Padarias)
          - Comer Fora (Restaurantes, Delivery, iFood, Fast-food, Bares)
          - Lazer
          - Saúde
          - Transporte
          - Casa
          - Outros

          REGRA CRÍTICA - FORMA DE PAGAMENTO (PRIORIDADE MÁXIMA):
          O usuário enviará um "Contexto do usuário". Se nesse contexto ele citar a forma de pagamento (ex: "VR", "Vale Refeição", "Pix", "VA"), você DEVE IGNORAR a forma de pagamento impressa na foto da nota (ex: Crédito, Débito) e retornar EXATAMENTE o que o usuário digitou no contexto. O texto do usuário é a verdade absoluta.

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
      model: "llama-3.2-11b-vision-preview", // ou o modelo Llama 4 Vision que você estava utilizando
      temperature: 0.1,
      response_format: { type: "json_object" }
    });

    const resposta = chatCompletion.choices[0]?.message?.content || "{}";
    return NextResponse.json(JSON.parse(resposta));
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}
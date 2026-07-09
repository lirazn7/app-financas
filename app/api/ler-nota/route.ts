import { NextResponse } from 'next/server';
import { groq } from '@/lib/groq'; // O conector que criaste antes

export async function POST(request: Request) {
  try {
    // 1. Pega os dados enviados pelo Front-end (a foto e o contexto)
    const { imagemBase64, contexto } = await request.json();

    if (!imagemBase64) {
      return NextResponse.json({ error: 'Nenhuma imagem foi enviada.' }, { status: 400 });
    }

    // 2. Envia a imagem e o prompt para a IA da Groq
    const response = await groq.chat.completions.create({
      // Usamos um modelo de visão open-source de alta performance
      model: "meta-llama/llama-4-scout-17b-16e-instruct", 
      messages: [
        {
          role: "user",
          content: [
            {
              type: "text",
              text: `És um assistente financeiro especializado em ler recibos e notas fiscais. 
              Analisa a imagem desta nota fiscal, identifique os dados e extraia estritamente as seguintes informações:
              - estabelecimento (Nome do local/loja)
              - valor (O valor total da compra como um número, ex: 154.50)
              - data_compra (A data no formato AAAA-MM-DD)
              - categoria (Escolhe APENAS uma destas: Alimentação, Lazer, Saúde, Transporte, Casa, Outros)
              - forma_pagamento (Analise a forma de pagamento na nota e classifique OBRIGATORIAMENTE em uma destas opções: 'Débito', 'Crédito', 'Vale Alimentação', 'Vale Refeição', 'Pix' ou 'Dinheiro'. Se não conseguir identificar, use 'Não identificado')

              Leva em consideração este contexto adicional fornecido pelo utilizador: "${contexto || 'Sem contexto adicional'}". Use-o para ajudar a definir a categoria correta se a nota for ambígua.

              Responde OBRIGATORIAMENTE apenas com um objeto JSON válido, sem qualquer texto explicativo antes ou depois, seguindo esta estrutura exata:
              {
                "estabelecimento": "Nome",
                "valor": 0.00,
                "data_compra": "2026-01-01",
                "categoria": "Categoria",
                "forma_pagamento": "Forma de Pagamento"
              }`
            },
            {
              type: "image_url",
              image_url: {
                // Formato padrão para enviar imagem em base64 via API
                url: `data:image/jpeg;base64,${imagemBase64}`
              }
            }
          ]
        }
      ],
      // Força o modelo a responder estritamente em formato JSON
      response_format: { type: "json_object" },
      temperature: 0.1, // Temperatura baixa para a IA ser mais precisa e não inventar dados
    });

    // 3. Pega o texto da resposta e transforma em JSON para enviar de volta ao front-end
    const textoResultado = response.choices[0]?.message?.content || '{}';
    const dadosExtraidos = JSON.parse(textoResultado);

    return NextResponse.json(dadosExtraidos);

  } catch (error: any) {
    console.error('Erro ao processar a nota:', error);
    
    return NextResponse.json(
      { error: error.message || 'Erro desconhecido na IA' }, 
      { status: 500 }
    );
  }
}
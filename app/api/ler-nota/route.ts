import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    // 1. Recebe os dados enviados pelo Front-end (a foto da nota e o texto opcional)
    const { imagemBase64, contexto } = await req.json();

    // 2. Trava de segurança: Se a câmera falhou e não mandou imagem, barramos aqui.
    if (!imagemBase64) {
      return NextResponse.json({ error: "Nenhuma imagem foi enviada pelo aplicativo." }, { status: 400 });
    }

    // 3. Chamada nativa para o OpenRouter (O "Correio" que leva a foto até o Qwen)
    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.OPENROUTER_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        // Aqui definimos o cérebro que vai processar a imagem: Qwen 2.5 Vision
        model: "qwen/qwen-2.5-vl-72b-instruct", 
        
        // Força a IA a devolver estritamente um objeto JSON válido, evitando textos inúteis
        response_format: { type: "json_object" }, 
        
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
              { type: "text", text: `Extraia os dados desta nota fiscal. Contexto adicional passado pelo usuário: ${contexto || 'Nenhum'}` },
              // Envia a imagem em formato base64 que foi comprimida lá no front-end
              { type: "image_url", image_url: { url: `data:image/jpeg;base64,${imagemBase64}` } }
            ]
          }
        ]
      })
    });

    const data = await response.json();

    // 4. Tratativa de erro da API: Se o OpenRouter cair ou a chave for inválida
    if (!response.ok) {
      throw new Error(data.error?.message || "Falha na comunicação com o servidor de IA.");
    }

    // 5. Extração da Resposta
    const conteudoIA = data.choices[0].message.content;
    
    // 6. Limpeza (Sanitização): Às vezes a IA devolve o JSON dentro de blocos de markdown (```json ... ```). 
    // Nós removemos isso para o comando JSON.parse não quebrar.
    const jsonLimpo = conteudoIA.replace(/```json/gi, "").replace(/```/g, "").trim();
    
    // 7. Converte o texto purificado em um Objeto JavaScript real
    const resultadoJSON = JSON.parse(jsonLimpo);

    // 8. Devolve o objeto perfeitamente formatado para o Front-end mostrar na tela
    return NextResponse.json(resultadoJSON);

  } catch (error: any) {
    console.error("Erro na leitura da nota (OpenRouter):", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
"use client";

import { useState } from "react";
import { Camera, Upload, Loader2, CheckCircle, Save, BarChart3, Image as ImageIcon } from "lucide-react";
import { supabase } from "../lib/supabase"; 
import Link from "next/link"; 

export default function Home() {
  const [imagem, setImagem] = useState<File | null>(null);
  const [contexto, setContexto] = useState("");
  const [loading, setLoading] = useState(false);
  const [salvando, setSalvando] = useState(false);
  const [resultado, setResultado] = useState<any>(null);

  const converterParaBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => {
        const base64String = reader.result?.toString().split(",")[1] || "";
        resolve(base64String);
      };
      reader.onerror = (error) => reject(error);
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!imagem) return alert("Por favor, selecione uma imagem primeiro!");

    setLoading(true);
    try {
      const base64 = await converterParaBase64(imagem);
      
      const res = await fetch("/api/ler-nota", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ imagemBase64: base64, contexto }),
      });

      const dados = await res.json();
      
      if (res.ok) {
        setResultado(dados);
      } else {
        alert("Erro na IA: " + (dados.error || "Erro desconhecido"));
      }
    } catch (error) {
      alert("Erro ao enviar a imagem.");
    } finally {
      setLoading(false);
    }
  };

  const salvarNoBanco = async () => {
    setSalvando(true);
    try {
      const dataValida = resultado.data_compra && resultado.data_compra !== "Não disponível" 
        ? resultado.data_compra 
        : null;

      const { error } = await supabase
        .from('gastos')
        .insert([
          {
            estabelecimento: resultado.estabelecimento,
            valor: parseFloat(resultado.valor),
            data_compra: dataValida,
            categoria: resultado.categoria,
            forma_pagamento: resultado.forma_pagamento, 
            contexto: contexto
          }
        ]);

      if (error) throw error;

      alert("🎉 Gasto salvo com sucesso!");
      
      setResultado(null);
      setImagem(null);
      setContexto("");
      
    } catch (error: any) {
      console.error(error);
      alert("Erro ao salvar no banco: " + error.message);
    } finally {
      setSalvando(false);
    }
  };

  return (
    <main className="min-h-screen bg-gray-50 p-4 font-sans text-gray-900">
      <div className="max-w-md mx-auto bg-white rounded-2xl shadow-sm p-6 mt-8">
        <h1 className="text-2xl font-bold text-center mb-2 text-blue-600">
          Assistente Financeiro
        </h1>

        <div className="text-center mb-6">
          <Link 
            href="/dashboard" 
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-blue-600 hover:text-blue-700 hover:underline transition-all"
          >
            <BarChart3 className="w-4 h-4" /> Ver Gráficos e Relatórios
          </Link>
        </div>

        {!resultado ? (
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium mb-2">O que foi essa compra?</label>
              <input
                type="text"
                placeholder="Ex: Compras para o almoço de domingo"
                className="w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                value={contexto}
                onChange={(e) => setContexto(e.target.value)}
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Foto ou Arquivo da Nota Fiscal</label>
              <div className="flex items-center justify-center w-full">
                <label className="flex flex-col items-center justify-center w-full h-36 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100 p-4 transition-colors">
                  <div className="flex flex-col items-center justify-center text-center">
                    <div className="flex gap-3 mb-2 text-gray-400">
                      <Camera className="w-6 h-6 text-blue-500" />
                      <ImageIcon className="w-6 h-6 text-emerald-500" />
                    </div>
                    <p className="text-sm font-medium text-gray-600">
                      {imagem ? imagem.name : "Tire uma foto ou escolha da galeria"}
                    </p>
                    {!imagem && (
                      <p className="text-xs text-gray-400 mt-1">
                        Aceita fotos da câmera ou prints armazenados
                      </p>
                    )}
                  </div>
                  {/* 👇 REMOVIDO: O atributo capture="environment" foi retirado daqui 👇 */}
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => setImagem(e.target.files?.[0] || null)}
                  />
                </label>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 text-white rounded-lg p-4 font-bold flex justify-center items-center gap-2 hover:bg-blue-700 disabled:opacity-70 cursor-pointer"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" /> Analisando IA...
                </>
              ) : (
                <>
                  <Upload className="w-5 h-5" /> Analisar Nota
                </>
              )}
            </button>
          </form>
        ) : (
          <div className="space-y-4 animate-in fade-in duration-500">
            <div className="flex items-center gap-2 text-green-600 mb-4 font-bold text-lg">
              <CheckCircle className="w-6 h-6" /> Leitura Concluída!
            </div>
            
            <div className="bg-gray-50 p-4 rounded-lg space-y-2 border">
              <p><strong>Estabelecimento:</strong> {resultado.estabelecimento}</p>
              <p><strong>Valor:</strong> R$ {Number(resultado.valor).toFixed(2)}</p>
              <p><strong>Data:</strong> {resultado.data_compra}</p>
              <p><strong>Categoria:</strong> <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-sm">{resultado.categoria}</span></p>
              <p><strong>Pagamento:</strong> <span className="bg-green-100 text-green-800 px-2 py-1 rounded text-sm">{resultado.forma_pagamento || 'Não identificado'}</span></p>
            </div>

            <div className="flex gap-2 mt-6">
              <button
                onClick={() => setResultado(null)}
                disabled={salvando}
                className="flex-1 bg-gray-200 text-gray-800 p-3 rounded-lg font-bold disabled:opacity-70"
              >
                Cancelar
              </button>
              <button
                onClick={salvarNoBanco}
                disabled={salvando}
                className="flex-1 bg-green-600 text-white p-3 rounded-lg font-bold flex justify-center items-center gap-2 disabled:opacity-70"
              >
                {salvando ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
                Confirmar
              </button>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
"use client";

// Garante que a Vercel não tente conectar ao banco de dados no momento do deploy
export const dynamic = "force-dynamic";

import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";
import { Bar, Pie, Doughnut } from "react-chartjs-2";
import { Loader2, ArrowLeft, TrendingUp, Calendar, CreditCard, Lock, ChevronDown } from "lucide-react";
import Link from "next/link";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
} from "chart.js";

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
);

// Paletas de cores infinitas que suportam novas categorias
const CORES_CATEGORIAS = [
  "#3B82F6", "#10B981", "#F59E0B", "#EF4444", "#8B5CF6", "#EC4899",
  "#14B8A6", "#F97316", "#06B6D4", "#6366F1", "#84CC16", "#D946EF"
];

const CORES_PAGAMENTOS = [
  "#10B981", "#6366F1", "#F59E0B", "#8B5CF6", "#3B82F6", "#9CA3AF",
  "#F43F5E", "#14B8A6", "#84CC16", "#0EA5E9", "#D946EF", "#F97316"
];

export default function Dashboard() {
  const [autenticado, setAutenticado] = useState<boolean | null>(null);
  const [senhaInput, setSenhaInput] = useState("");

  const [loading, setLoading] = useState(true);
  const [todosGastos, setTodosGastos] = useState<any[]>([]);
  const [gastosFiltrados, setGastosFiltrados] = useState<any[]>([]);
  const [mesesDisponiveis, setMesesDisponiveis] = useState<string[]>([]);
  const [mesSelecionado, setMesSelecionado] = useState<string>("todos");
  
  const [totalGasto, setTotalGasto] = useState(0);
  const [dadosCategorias, setDadosCategorias] = useState<{ [key: string]: number }>({});
  const [dadosDias, setDadosDias] = useState<{ [key: string]: number }>({});
  const [dadosPagamentos, setDadosPagamentos] = useState<{ [key: string]: number }>({});

  async function buscarGastos() {
    try {
      const { data, error } = await supabase
        .from("gastos")
        .select("*")
        .order("data_compra", { ascending: true });

      if (error) throw error;

      if (data) {
        setTodosGastos(data);
        
        const meses = Array.from(
          new Set(
            data
              .map((item) => item.data_compra ? item.data_compra.substring(0, 7) : null)
              .filter(Boolean)
          )
        ) as string[];
        
        setMesesDisponiveis(meses);
        setGastosFiltrados(data);
      }
    } catch (error) {
      console.error("Erro ao carregar dados do dashboard:", error);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    const tokenSalvo = localStorage.getItem("app_financas_token");
    const tokenCorreto = process.env.NEXT_PUBLIC_ACESSO_TOKEN;

    if (tokenSalvo && tokenCorreto && tokenSalvo === tokenCorreto) {
      setAutenticado(true);
      buscarGastos();
    } else {
      setAutenticado(false);
      setLoading(false);
    }
  }, []);

  const lidarComAutenticacao = (e: React.FormEvent) => {
    e.preventDefault();
    const tokenCorreto = process.env.NEXT_PUBLIC_ACESSO_TOKEN;

    if (tokenCorreto && senhaInput === tokenCorreto) {
      localStorage.setItem("app_financas_token", senhaInput);
      setAutenticado(true);
      setLoading(true);
      buscarGastos();
    } else {
      alert("⚠️ Senha incorreta! Acesso negado.");
    }
  };

  useEffect(() => {
    if (!autenticado) return;

    let filtrados = todosGastos;

    if (mesSelecionado !== "todos") {
      filtrados = todosGastos.filter(
        (item) => item.data_compra && item.data_compra.startsWith(mesSelecionado)
      );
    }

    setGastosFiltrados(filtrados);

    const total = filtrados.reduce((acc, item) => acc + (item.valor || 0), 0);
    setTotalGasto(total);

    const categories: { [key: string]: number } = {};
    const days: { [key: string]: number } = {};
    const payments: { [key: string]: number } = {};

    filtrados.forEach((item) => {
      const cat = item.categoria || "Outros";
      categories[cat] = (categories[cat] || 0) + (item.valor || 0);

      const pag = item.forma_pagamento || "Não identificado";
      payments[pag] = (payments[pag] || 0) + (item.valor || 0);

      if (item.data_compra) {
        const [ano, mes, dia] = item.data_compra.split("-");
        const diaFormatado = `${dia}/${mes}`;
        days[diaFormatado] = (days[diaFormatado] || 0) + (item.valor || 0);
      } else {
        days["Sem data"] = (days["Sem data"] || 0) + (item.valor || 0);
      }
    });

    // Ordenar do maior gasto para o menor para melhorar a UX
    const categoriasOrdenadas = Object.fromEntries(
      Object.entries(categories).sort(([, a], [, b]) => b - a)
    );
    const pagamentosOrdenados = Object.fromEntries(
      Object.entries(payments).sort(([, a], [, b]) => b - a)
    );

    setDadosCategorias(categoriasOrdenadas);
    setDadosPagamentos(pagamentosOrdenados);
    setDadosDias(days);
  }, [mesSelecionado, todosGastos, autenticado]);

  const formatarMesAno = (mesAno: string) => {
    const [ano, mes] = mesAno.split("-");
    const mesesNome = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"];
    return `${mesesNome[parseInt(mes) - 1]} / ${ano}`;
  };

  const dataPizza = {
    labels: Object.keys(dadosCategorias),
    datasets: [{
      data: Object.values(dadosCategorias),
      backgroundColor: Object.keys(dadosCategorias).map((_, i) => CORES_CATEGORIAS[i % CORES_CATEGORIAS.length]),
      borderWidth: 1,
    }],
  };

  const dataPagamentos = {
    labels: Object.keys(dadosPagamentos),
    datasets: [{
      data: Object.values(dadosPagamentos),
      backgroundColor: Object.keys(dadosPagamentos).map((_, i) => CORES_PAGAMENTOS[i % CORES_PAGAMENTOS.length]),
      borderWidth: 1,
    }],
  };

  const dataBarras = {
    labels: Object.keys(dadosDias),
    datasets: [{
      label: "Gastos no Dia (R$)",
      data: Object.values(dadosDias),
      backgroundColor: "#3B82F6",
      borderRadius: 6,
    }],
  };

  if (autenticado === null || loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (!autenticado) {
    return (
      <main className="min-h-screen bg-gray-100 flex items-center justify-center p-4 font-sans text-gray-900">
        <div className="max-w-sm w-full bg-white rounded-2xl shadow-md p-6 border text-center space-y-4">
          <div className="mx-auto w-12 h-12 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center">
            <Lock className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-800">Sistema Privado</h1>
            <p className="text-sm text-gray-500 mt-1">Insira a chave de acesso da família para visualizar os relatórios.</p>
          </div>
          <form onSubmit={lidarComAutenticacao} className="space-y-3">
            <input
              type="password"
              placeholder="Digite a senha de acesso"
              value={senhaInput}
              onChange={(e) => setSenhaInput(e.target.value)}
              className="w-full bg-gray-50 border border-gray-300 rounded-xl px-4 py-3 text-sm text-center focus:ring-2 focus:ring-blue-500 focus:outline-none"
            />
            <button type="submit" className="w-full bg-blue-600 text-white rounded-xl py-3 font-bold text-sm hover:bg-blue-700 active:scale-98 transition-all">
              Confirmar Chave
            </button>
          </form>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gray-50 px-4 py-6 font-sans text-gray-900 antialiased">
      <div className="max-w-md mx-auto space-y-5">
        
        <Link href="/" className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-gray-500 hover:text-blue-600 transition-colors">
          <ArrowLeft className="w-4 h-4" /> Voltar ao Scanner
        </Link>

        <div className="bg-white rounded-2xl border border-gray-200/80 p-4 shadow-sm flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-gray-500">
            <Calendar className="w-5 h-5 text-blue-500" />
            <span className="text-sm font-medium">Período:</span>
          </div>
          <select
            value={mesSelecionado}
            onChange={(e) => setMesSelecionado(e.target.value)}
            className="flex-1 bg-gray-50 border border-gray-300 rounded-xl p-2.5 text-sm font-medium text-gray-800 focus:ring-2 focus:ring-blue-500 focus:outline-none cursor-pointer"
          >
            <option value="todos">Todos os meses</option>
            {mesesDisponiveis.map((mes) => (
              <option key={mes} value={mes}>
                {formatarMesAno(mes)}
              </option>
            ))}
          </select>
        </div>

        <div className="bg-gradient-to-br from-blue-600 to-indigo-700 text-white rounded-2xl p-5 shadow-md flex items-center justify-between">
          <div>
            <p className="text-blue-100 text-xs font-semibold uppercase tracking-wider">Total no período</p>
            <h2 className="text-3xl font-extrabold mt-1 tracking-tight">R$ {totalGasto.toFixed(2)}</h2>
          </div>
          <div className="bg-white/15 p-3 rounded-xl backdrop-blur-md">
            <TrendingUp className="w-6 h-6 text-white" />
          </div>
        </div>

        {/* Card 1: Gráfico de Pizza (Categorias) */}
        <div className="bg-white rounded-2xl shadow-sm p-5 border border-gray-200/80">
          <h3 className="text-base font-bold text-gray-800 mb-4">Divisão por Categorias</h3>
          {Object.keys(dadosCategorias).length > 0 ? (
            <>
              {/* Gráfico limpo sem legenda */}
              <div className="w-full h-48 flex justify-center items-center">
                <Pie data={dataPizza} options={{ responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } } }} />
              </div>
              
              {/* Dropdown Customizado de Detalhamento e Porcentagem */}
              <details className="mt-5 group bg-gray-50 rounded-xl border border-gray-200 overflow-hidden">
                <summary className="cursor-pointer p-3.5 font-semibold text-sm text-gray-700 flex justify-between items-center list-none [&::-webkit-details-marker]:hidden bg-gray-50 hover:bg-gray-100 transition-colors">
                  Ver detalhamento e %
                  <ChevronDown className="w-4 h-4 transition-transform duration-300 group-open:rotate-180 text-gray-500" />
                </summary>
                <div className="p-4 border-t border-gray-200 space-y-3.5 bg-white">
                  {Object.entries(dadosCategorias).map(([nome, valor], index) => {
                    const cor = CORES_CATEGORIAS[index % CORES_CATEGORIAS.length];
                    const porcentagem = totalGasto > 0 ? ((valor / totalGasto) * 100).toFixed(1) : "0.0";
                    return (
                      <div key={nome} className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-2.5">
                          <span className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: cor }}></span>
                          <span className="text-gray-700 font-medium truncate max-w-[120px]">{nome}</span>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="text-gray-900 font-semibold">R$ {valor.toFixed(2)}</span>
                          <span className="text-gray-500 text-xs bg-gray-100 px-1.5 py-0.5 rounded min-w-[3.5rem] text-center font-medium">
                            {porcentagem}%
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </details>
            </>
          ) : (
            <p className="text-gray-400 text-xs text-center py-12">Sem gastos neste período.</p>
          )}
        </div>

        {/* Card 2: Gráfico de Formas de Pagamento */}
        <div className="bg-white rounded-2xl shadow-sm p-5 border border-gray-200/80">
          <h3 className="text-base font-bold text-gray-800 mb-4 flex items-center gap-2">
            <CreditCard className="w-5 h-5 text-green-500" /> Formas de Pagamento
          </h3>
          {Object.keys(dadosPagamentos).length > 0 ? (
            <>
              {/* Gráfico limpo sem legenda */}
              <div className="w-full h-48 flex justify-center items-center">
                <Doughnut data={dataPagamentos} options={{ responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } } }} />
              </div>

              {/* Dropdown Customizado de Detalhamento e Porcentagem */}
              <details className="mt-5 group bg-gray-50 rounded-xl border border-gray-200 overflow-hidden">
                <summary className="cursor-pointer p-3.5 font-semibold text-sm text-gray-700 flex justify-between items-center list-none [&::-webkit-details-marker]:hidden bg-gray-50 hover:bg-gray-100 transition-colors">
                  Ver detalhamento e %
                  <ChevronDown className="w-4 h-4 transition-transform duration-300 group-open:rotate-180 text-gray-500" />
                </summary>
                <div className="p-4 border-t border-gray-200 space-y-3.5 bg-white">
                  {Object.entries(dadosPagamentos).map(([nome, valor], index) => {
                    const cor = CORES_PAGAMENTOS[index % CORES_PAGAMENTOS.length];
                    const porcentagem = totalGasto > 0 ? ((valor / totalGasto) * 100).toFixed(1) : "0.0";
                    return (
                      <div key={nome} className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-2.5">
                          <span className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: cor }}></span>
                          <span className="text-gray-700 font-medium truncate max-w-[120px]">{nome}</span>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="text-gray-900 font-semibold">R$ {valor.toFixed(2)}</span>
                          <span className="text-gray-500 text-xs bg-gray-100 px-1.5 py-0.5 rounded min-w-[3.5rem] text-center font-medium">
                            {porcentagem}%
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </details>
            </>
          ) : (
            <p className="text-gray-400 text-xs text-center py-12">Sem dados de pagamento.</p>
          )}
        </div>

        {/* Card 3: Gráfico de Barras (Histórico por Dia) */}
        <div className="bg-white rounded-2xl shadow-sm p-5 border border-gray-200/80">
          <h3 className="text-base font-bold text-gray-800 mb-3">Histórico de Gastos por Dia</h3>
          {Object.keys(dadosDias).length > 0 ? (
            <div className="w-full h-52">
              <Bar data={dataBarras} options={{ responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } }, scales: { y: { ticks: { font: { size: 10 } }, grid: { color: '#f3f4f6' } }, x: { ticks: { font: { size: 10 } }, grid: { display: false } } } }} />
            </div>
          ) : (
            <p className="text-gray-400 text-xs text-center py-12">Sem histórico neste período.</p>
          )}
        </div>

      </div>
    </main>
  );
}
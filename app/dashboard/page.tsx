"use client";

export const dynamic = "force-dynamic";

import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";
import { Bar, Pie, Doughnut } from "react-chartjs-2";
import { Loader2, ArrowLeft, TrendingUp, Calendar, CreditCard } from "lucide-react";
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

export default function Dashboard() {
  const [loading, setLoading] = useState(true);
  const [todosGastos, setTodosGastos] = useState<any[]>([]);
  const [gastosFiltrados, setGastosFiltrados] = useState<any[]>([]);
  const [mesesDisponiveis, setMesesDisponiveis] = useState<string[]>([]);
  const [mesSelecionado, setMesSelecionado] = useState<string>("todos");
  
  const [totalGasto, setTotalGasto] = useState(0);
  const [dadosCategorias, setDadosCategorias] = useState<{ [key: string]: number }>({});
  const [dadosDias, setDadosDias] = useState<{ [key: string]: number }>({});
  const [dadosPagamentos, setDadosPagamentos] = useState<{ [key: string]: number }>({}); // 👈 Nova state para pagamentos

  useEffect(() => {
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
    buscarGastos();
  }, []);

  useEffect(() => {
    let filtrados = todosGastos;

    if (mesSelecionado !== "todos") {
      filtrados = todosGastos.filter(
        (item) => item.data_compra && item.data_compra.startsWith(mesSelecionado)
      );
    }

    setGastosFiltrados(filtrados);

    const total = filtrados.reduce((acc, item) => acc + (item.valor || 0), 0);
    setTotalGasto(total);

    const categorias: { [key: string]: number } = {};
    const dias: { [key: string]: number } = {};
    const pagamentos: { [key: string]: number } = {}; // 👈 Objeto temporário para agrupar

    filtrados.forEach((item) => {
      // Agrupar Categorias
      const cat = item.categoria || "Outros";
      categorias[cat] = (categorias[cat] || 0) + (item.valor || 0);

      // Agrupar Formas de Pagamento
      const pag = item.forma_pagamento || "Não identificado";
      pagamentos[pag] = (pagamentos[pag] || 0) + (item.valor || 0);

      // Agrupar Dias
      if (item.data_compra) {
        const [ano, mes, dia] = item.data_compra.split("-");
        const diaFormatado = `${dia}/${mes}`;
        dias[diaFormatado] = (dias[diaFormatado] || 0) + (item.valor || 0);
      } else {
        dias["Sem data"] = (dias["Sem data"] || 0) + (item.valor || 0);
      }
    });

    setDadosCategorias(categorias);
    setDadosDias(dias);
    setDadosPagamentos(pagamentos); // 👈 Salva no state
  }, [mesSelecionado, todosGastos]);

  const formatarMesAno = (mesAno: string) => {
    const [ano, mes] = mesAno.split("-");
    const mesesNome = [
      "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
      "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"
    ];
    return `${mesesNome[parseInt(mes) - 1]} / ${ano}`;
  };

  const dataPizza = {
    labels: Object.keys(dadosCategorias),
    datasets: [
      {
        data: Object.values(dadosCategorias),
        backgroundColor: ["#3B82F6", "#10B981", "#F59E0B", "#EF4444", "#8B5CF6", "#EC4899"],
        borderWidth: 1,
      },
    ],
  };

  // 👈 Configuração do novo Gráfico de Formas de Pagamento (Formato Rosca/Doughnut)
  const dataPagamentos = {
    labels: Object.keys(dadosPagamentos),
    datasets: [
      {
        data: Object.values(dadosPagamentos),
        backgroundColor: ["#10B981", "#6366F1", "#F59E0B", "#8B5CF6", "#3B82F6", "#9CA3AF"],
        borderWidth: 1,
      },
    ],
  };

  const dataBarras = {
    labels: Object.keys(dadosDias),
    datasets: [
      {
        label: "Gastos no Dia (R$)",
        data: Object.values(dadosDias),
        backgroundColor: "#3B82F6",
        borderRadius: 6,
      },
    ],
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
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
          <h3 className="text-base font-bold text-gray-800 mb-3">Divisão por Categorias</h3>
          {Object.keys(dadosCategorias).length > 0 ? (
            <div className="w-full h-56 flex justify-center items-center">
              <Pie data={dataPizza} options={{ responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'bottom', labels: { boxWidth: 12, font: { size: 11 } } } } }} />
            </div>
          ) : (
            <p className="text-gray-400 text-xs text-center py-12">Sem gastos neste período.</p>
          )}
        </div>

        {/* 👇 NOVO CARD ADICIONADO: Gráfico de Formas de Pagamento 👇 */}
        <div className="bg-white rounded-2xl shadow-sm p-5 border border-gray-200/80">
          <h3 className="text-base font-bold text-gray-800 mb-3 flex items-center gap-2">
            <CreditCard className="w-5 h-5 text-green-500" /> Formas de Pagamento
          </h3>
          {Object.keys(dadosPagamentos).length > 0 ? (
            <div className="w-full h-56 flex justify-center items-center">
              <Doughnut data={dataPagamentos} options={{ responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'bottom', labels: { boxWidth: 12, font: { size: 11 } } } } }} />
            </div>
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
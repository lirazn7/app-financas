"use client";

import { Bar, Pie, Doughnut, Line } from "react-chartjs-2";
import { TrendingUp, CreditCard, ChevronDown, Filter } from "lucide-react";
import { CORES_CATEGORIAS, CORES_PAGAMENTOS } from "@/lib/constantes";

interface GraficosTabProps {
  dadosCategorias: { [key: string]: number };
  totalGasto: number;
  dataPizza: any;
  dadosPagamentos: { [key: string]: number };
  dataPagamentos: any;
  dropdownPagamentosAberto: boolean;
  setDropdownPagamentosAberto: (v: boolean) => void;
  pagamentosSelecionados: string[];
  setPagamentosSelecionados: React.Dispatch<React.SetStateAction<string[]>>;
  dataLinhaPagamentos: any;
  chartTextColor: string;
  chartGridColor: string;
  visaoHistorico: "diario" | "mensal";
  setVisaoHistorico: (v: "diario" | "mensal") => void;
  dadosDias: { [key: string]: number };
  dataBarras: any;
  dadosMeses: { [key: string]: number };
  dataLinha: any;
}

export default function GraficosTab({
  dadosCategorias,
  totalGasto,
  dataPizza,
  dadosPagamentos,
  dataPagamentos,
  dropdownPagamentosAberto,
  setDropdownPagamentosAberto,
  pagamentosSelecionados,
  setPagamentosSelecionados,
  dataLinhaPagamentos,
  chartTextColor,
  chartGridColor,
  visaoHistorico,
  setVisaoHistorico,
  dadosDias,
  dataBarras,
  dadosMeses,
  dataLinha,
}: GraficosTabProps) {
  return (
    <div className="grid gap-5 lg:grid-cols-2 w-full">
      <div className="rounded-2xl border border-edge dark:border-slate-800 bg-surface dark:bg-slate-900 p-5 shadow-sm min-w-0 transition-colors">
        <h3 className="mb-4 text-base font-bold text-ink dark:text-white">Divisão por Categorias</h3>
        {Object.keys(dadosCategorias).length > 0 ? (
          <>
            <div className="flex h-48 w-full items-center justify-center lg:h-56 relative min-w-0"><Pie data={dataPizza} options={{ responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } } }} /></div>
            <details className="group mt-5 overflow-hidden rounded-xl border border-edge dark:border-slate-800 bg-canvas dark:bg-slate-950 transition-colors">
              <summary className="flex cursor-pointer list-none items-center justify-between p-3.5 text-sm font-semibold text-ink dark:text-slate-200 transition-colors hover:bg-edge/40 dark:hover:bg-slate-800/50 [&::-webkit-details-marker]:hidden">
                Ver detalhamento e % <ChevronDown className="h-4 w-4 text-ink-faint dark:text-slate-500 transition-transform duration-300 group-open:rotate-180" />
              </summary>
              <div className="space-y-3.5 border-t border-edge dark:border-slate-800 bg-surface dark:bg-slate-900 p-4 transition-colors">
                {Object.entries(dadosCategorias).map(([nome, valor], index) => {
                  const cor = CORES_CATEGORIAS[index % CORES_CATEGORIAS.length];
                  const porcentagem = totalGasto > 0 ? ((valor / totalGasto) * 100).toFixed(1) : "0.0";
                  return (
                    <div key={nome} className="flex items-center justify-between text-sm min-w-0">
                      <div className="flex items-center gap-2.5 min-w-0"><span className="h-3 w-3 shrink-0 rounded-full" style={{ backgroundColor: cor }}></span><span className="max-w-[140px] truncate font-medium text-ink dark:text-slate-300">{nome}</span></div>
                      <div className="flex items-center gap-3 shrink-0"><span className="font-semibold text-ink dark:text-slate-200">R$ {valor.toFixed(2)}</span><span className="min-w-[3.5rem] rounded bg-canvas dark:bg-slate-800 px-1.5 py-0.5 text-center text-xs font-medium text-ink-muted dark:text-slate-400">{porcentagem}%</span></div>
                    </div>
                  );
                })}
              </div>
            </details>
          </>
        ) : (<p className="py-12 text-center text-xs text-ink-faint dark:text-slate-500">Sem gastos neste período.</p>)}
      </div>

      <div className="rounded-2xl border border-edge dark:border-slate-800 bg-surface dark:bg-slate-900 p-5 shadow-sm min-w-0 transition-colors">
        <h3 className="mb-4 flex items-center gap-2 text-base font-bold text-ink dark:text-white"><CreditCard className="h-5 w-5 text-brand-600 dark:text-brand-500" /> Formas de Pagamento</h3>
        {Object.keys(dadosPagamentos).length > 0 ? (
          <>
            <div className="flex h-48 w-full items-center justify-center lg:h-56 relative min-w-0"><Doughnut data={dataPagamentos} options={{ responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } } }} /></div>
            <details className="group mt-5 overflow-hidden rounded-xl border border-edge dark:border-slate-800 bg-canvas dark:bg-slate-950 transition-colors">
              <summary className="flex cursor-pointer list-none items-center justify-between p-3.5 text-sm font-semibold text-ink dark:text-slate-200 transition-colors hover:bg-edge/40 dark:hover:bg-slate-800/50 [&::-webkit-details-marker]:hidden">
                Ver detalhamento e % <ChevronDown className="h-4 w-4 text-ink-faint dark:text-slate-500 transition-transform duration-300 group-open:rotate-180" />
              </summary>
              <div className="space-y-3.5 border-t border-edge dark:border-slate-800 bg-surface dark:bg-slate-900 p-4 transition-colors">
                {Object.entries(dadosPagamentos).map(([nome, valor], index) => {
                  const cor = CORES_PAGAMENTOS[index % CORES_PAGAMENTOS.length];
                  const porcentagem = totalGasto > 0 ? ((valor / totalGasto) * 100).toFixed(1) : "0.0";
                  return (
                    <div key={nome} className="flex items-center justify-between text-sm min-w-0">
                      <div className="flex items-center gap-2.5 min-w-0"><span className="h-3 w-3 shrink-0 rounded-full" style={{ backgroundColor: cor }}></span><span className="max-w-[140px] truncate font-medium text-ink dark:text-slate-300">{nome}</span></div>
                      <div className="flex items-center gap-3 shrink-0"><span className="font-semibold text-ink dark:text-slate-200">R$ {valor.toFixed(2)}</span><span className="min-w-[3.5rem] rounded bg-canvas dark:bg-slate-800 px-1.5 py-0.5 text-center text-xs font-medium text-ink-muted dark:text-slate-400">{porcentagem}%</span></div>
                    </div>
                  );
                })}
              </div>
            </details>
          </>
        ) : (<p className="py-12 text-center text-xs text-ink-faint dark:text-slate-500">Sem dados de pagamento.</p>)}
      </div>

      <div className="rounded-2xl border border-edge dark:border-slate-800 bg-surface dark:bg-slate-900 p-5 shadow-sm lg:col-span-2 min-w-0 transition-colors">
        <div className="flex justify-between items-center mb-4 min-w-0">
          <h3 className="text-base font-bold text-ink dark:text-white flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-brand-600 dark:text-brand-500" /> Tendência de Pagamentos
          </h3>
          <div className="relative shrink-0 ml-2">
            <button onClick={() => setDropdownPagamentosAberto(!dropdownPagamentosAberto)} className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-wider bg-canvas dark:bg-slate-800 border border-edge dark:border-slate-700 rounded-lg px-3 py-2 text-ink-muted dark:text-slate-400 hover:bg-edge/50 dark:hover:bg-slate-700 transition-colors">
              Filtrar <ChevronDown className={`w-3 h-3 transition-transform ${dropdownPagamentosAberto ? 'rotate-180' : ''}`} />
            </button>
            {dropdownPagamentosAberto && (
              <div className="absolute right-0 mt-2 w-52 bg-surface dark:bg-slate-900 border border-edge dark:border-slate-700 shadow-xl rounded-xl z-20 p-2 space-y-1 animate-in fade-in zoom-in-95 duration-200">
                <p className="text-[10px] font-bold text-ink-faint dark:text-slate-500 uppercase tracking-wider px-2 pb-1 mb-1 border-b border-edge/50 dark:border-slate-700/50">Exibir no gráfico:</p>
                {["Crédito", "Débito", "Pix", "Dinheiro", "Vale Alimentação", "Vale Refeição"].map(pag => (
                  <label key={pag} className="flex items-center gap-2.5 p-2 hover:bg-canvas dark:hover:bg-slate-800 rounded-lg cursor-pointer text-sm font-medium text-ink dark:text-slate-300 transition-colors">
                    <input type="checkbox" checked={pagamentosSelecionados.includes(pag)} onChange={() => { if (pagamentosSelecionados.includes(pag)) { setPagamentosSelecionados(prev => prev.filter(p => p !== pag)); } else { setPagamentosSelecionados(prev => [...prev, pag]); } }} className="w-4 h-4 rounded border-edge dark:border-slate-600 bg-white dark:bg-slate-900 text-brand-600 focus:ring-brand-500 cursor-pointer" />
                    {pag}
                  </label>
                ))}
              </div>
            )}
          </div>
        </div>
        {pagamentosSelecionados.length === 0 ? (
          <div className="w-full h-52 flex flex-col items-center justify-center bg-canvas/70 dark:bg-slate-950/50 border-2 border-dashed border-edge dark:border-slate-700 rounded-xl">
            <Filter className="w-8 h-8 text-ink-faint dark:text-slate-600 mb-2" />
            <p className="text-xs text-ink-muted dark:text-slate-400 font-medium text-center leading-relaxed">Nenhum método selecionado.<br /><span className="text-brand-600 dark:text-brand-400 font-semibold cursor-pointer hover:underline" onClick={() => setDropdownPagamentosAberto(true)}>Abra o filtro</span> e escolha os pagamentos.</p>
          </div>
        ) : (
          <div className="relative w-full h-52 animate-in fade-in duration-500 lg:h-64 min-w-0">
            <Line data={dataLinhaPagamentos} options={{ responsive: true, maintainAspectRatio: false, plugins: { legend: { display: true, position: 'bottom', labels: { color: chartTextColor, boxWidth: 12, usePointStyle: true, font: { size: 11, family: 'sans-serif' } } } }, scales: { y: { beginAtZero: true, ticks: { color: chartTextColor, font: { size: 10 } }, grid: { color: chartGridColor } }, x: { ticks: { color: chartTextColor, font: { size: 10 } }, grid: { display: false } } } }} />
          </div>
        )}
      </div>

      <div className="rounded-2xl border border-edge dark:border-slate-800 bg-surface dark:bg-slate-900 p-5 shadow-sm lg:col-span-2 min-w-0 transition-colors">
        <div className="mb-4 flex items-center justify-between min-w-0">
          <h3 className="text-base font-bold text-ink dark:text-white">Histórico de Gastos</h3>
          <div className="flex rounded-lg border border-edge dark:border-slate-700 bg-canvas dark:bg-slate-950 p-1 shrink-0 ml-2">
            <button onClick={() => setVisaoHistorico("diario")} className={`rounded-md px-3 py-1 text-[11px] font-semibold transition-colors ${visaoHistorico === "diario" ? "bg-surface dark:bg-slate-800 text-brand-700 dark:text-brand-400 shadow-sm" : "text-ink-muted dark:text-slate-400 hover:text-ink dark:hover:text-slate-200"}`}>Diário</button>
            <button onClick={() => setVisaoHistorico("mensal")} className={`rounded-md px-3 py-1 text-[11px] font-semibold transition-colors ${visaoHistorico === "mensal" ? "bg-surface dark:bg-slate-800 text-brand-700 dark:text-brand-400 shadow-sm" : "text-ink-muted dark:text-slate-400 hover:text-ink dark:hover:text-slate-200"}`}>Mensal</button>
          </div>
        </div>

        {visaoHistorico === "diario" ? (
          Object.keys(dadosDias).length > 0 ? (
            <div className="relative h-52 w-full lg:h-72 min-w-0"><Bar data={dataBarras} options={{ responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } }, scales: { y: { ticks: { color: chartTextColor, font: { size: 10 } }, grid: { color: chartGridColor } }, x: { ticks: { color: chartTextColor, font: { size: 10 } }, grid: { display: false } } } }} /></div>
          ) : (<p className="py-12 text-center text-xs text-ink-faint dark:text-slate-500">Sem histórico neste período.</p>)
        ) : (
          Object.keys(dadosMeses).length > 0 ? (
            <div className="relative h-52 w-full lg:h-72 min-w-0"><Line data={dataLinha} options={{ responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } }, scales: { y: { ticks: { color: chartTextColor, font: { size: 10 } }, grid: { color: chartGridColor } }, x: { ticks: { color: chartTextColor, font: { size: 10 } }, grid: { display: false } } } }} /></div>
          ) : (<p className="py-12 text-center text-xs text-ink-faint dark:text-slate-500">Sem histórico mensal.</p>)
        )}
      </div>
    </div>
  );
}

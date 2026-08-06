"use client";

import { Filter, Pencil, Trash2 } from "lucide-react";
import { CATEGORIAS, ROTULOS_CATEGORIAS, FORMAS_PAGAMENTO } from "@/lib/constantes";

interface HistoricoTabProps {
  inputFiltro: string;
  filtroTabelaData: string;
  setFiltroTabelaData: (v: string) => void;
  filtroTabelaCategoria: string;
  setFiltroTabelaCategoria: (v: string) => void;
  filtroTabelaPagamento: string;
  setFiltroTabelaPagamento: (v: string) => void;
  tabelaFiltrada: any[];
  setGastoEditando: (g: any) => void;
  deletarGasto: (g: any) => void;
  setGastoDetalhe: (g: any) => void;
}

export default function HistoricoTab({
  inputFiltro,
  filtroTabelaData,
  setFiltroTabelaData,
  filtroTabelaCategoria,
  setFiltroTabelaCategoria,
  filtroTabelaPagamento,
  setFiltroTabelaPagamento,
  tabelaFiltrada,
  setGastoEditando,
  deletarGasto,
  setGastoDetalhe,
}: HistoricoTabProps) {
  return (
    <div className="space-y-4 w-full min-w-0">
      <div className="space-y-3 rounded-2xl border border-edge dark:border-slate-800 bg-surface dark:bg-slate-900 p-4 shadow-sm sm:p-5 w-full transition-colors">
        <h3 className="flex items-center gap-2 text-sm font-bold text-ink dark:text-white"><Filter className="h-4 w-4 text-brand-600 dark:text-brand-500 shrink-0" /> Filtros da Tabela</h3>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3 w-full">
          <input type="date" value={filtroTabelaData} onChange={e => setFiltroTabelaData(e.target.value)} className={inputFiltro} />
          <select value={filtroTabelaCategoria} onChange={e => setFiltroTabelaCategoria(e.target.value)} className={`${inputFiltro} truncate`}>
            <option value="todas">Todas Categorias</option>
            {CATEGORIAS.map((cat) => (
              <option key={cat} value={cat}>{ROTULOS_CATEGORIAS[cat] || cat}</option>
            ))}
          </select>
          <select value={filtroTabelaPagamento} onChange={e => setFiltroTabelaPagamento(e.target.value)} className={`${inputFiltro} truncate`}>
            <option value="todas">Todos Pagamentos</option>
            {FORMAS_PAGAMENTO.map((fp) => (
              <option key={fp} value={fp}>{fp}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="mb-8 overflow-hidden rounded-2xl border border-edge dark:border-slate-800 bg-surface dark:bg-slate-900 shadow-sm w-full transition-colors">
        <div className="overflow-x-auto w-full">
          <table className="w-full text-left text-sm text-ink-muted dark:text-slate-400 whitespace-nowrap">
            <thead className="border-b border-edge dark:border-slate-800 bg-canvas dark:bg-slate-950/80 text-xs uppercase text-ink-faint dark:text-slate-500">
              <tr>
                <th className="px-4 py-3">Data</th>
                <th className="px-4 py-3">Estabelecimento</th>
                <th className="px-4 py-3">Detalhes</th>
                <th className="px-4 py-3 text-right">Valor e Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-edge/60 dark:divide-slate-800/80">
              {tabelaFiltrada.length > 0 ? (
                tabelaFiltrada.map(g => (
                  <tr key={g.id} onClick={() => setGastoDetalhe(g)} className="cursor-pointer transition-colors hover:bg-canvas/60 dark:hover:bg-slate-800/50">
                    <td className="px-4 py-3.5 font-medium text-ink dark:text-slate-200">{g.data_compra ? g.data_compra.split('-').reverse().join('/') : 'S/ Data'}</td>
                    <td className="max-w-[150px] truncate px-4 py-3.5 sm:max-w-[240px] text-ink dark:text-slate-300" title={g.estabelecimento}>{g.estabelecimento}</td>
                    <td className="space-y-1.5 px-4 py-3.5 sm:space-y-0 sm:space-x-1.5">
                      <span className="inline-block max-w-max truncate rounded-full bg-brand-50 dark:bg-brand-900/30 px-2 py-0.5 text-[10px] font-semibold text-brand-700 dark:text-brand-300">{g.categoria}</span>
                      <span className="inline-block max-w-max truncate rounded-full bg-sky-50 dark:bg-sky-900/30 px-2 py-0.5 text-[10px] font-semibold text-sky-700 dark:text-sky-300">{g.forma_pagamento}</span>
                    </td>
                    <td className="px-4 py-3.5 text-right">
                      <span className="mb-1.5 block font-bold text-ink dark:text-slate-100">R$ {g.valor.toFixed(2)}</span>
                      <div className="flex justify-end gap-1.5">
                        <button onClick={(e) => { e.stopPropagation(); setGastoEditando(g); }} title="Editar gasto" aria-label="Editar gasto" className="min-h-9 min-w-9 inline-flex items-center justify-center rounded text-brand-600 dark:text-brand-400 transition-colors hover:bg-brand-50 dark:hover:bg-brand-900/30"><Pencil className="h-4 w-4" /></button>
                        <button onClick={(e) => { e.stopPropagation(); deletarGasto(g); }} title="Excluir gasto" aria-label="Excluir gasto" className="min-h-9 min-w-9 inline-flex items-center justify-center rounded text-red-500 dark:text-red-400 transition-colors hover:bg-red-50 dark:hover:bg-red-900/30"><Trash2 className="h-4 w-4" /></button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr><td colSpan={4} className="px-4 py-12 text-center text-ink-faint dark:text-slate-500">Nenhum gasto encontrado.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

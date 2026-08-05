"use client";

import { Loader2, Save, X, Trash2, Pencil } from "lucide-react";
import { CATEGORIAS } from "@/lib/constantes";

interface OrcamentoTabProps {
  tipoOrcamento: "mensal" | "anual";
  setTipoOrcamento: (v: "mensal" | "anual") => void;
  dadosCategorias: { [key: string]: number };
  limites: { [key: string]: number };
  categoriaEditandoLimite: string | null;
  setCategoriaEditandoLimite: (v: string | null) => void;
  valorNovoLimite: string;
  setValorNovoLimite: (v: string) => void;
  salvandoLimite: boolean;
  salvarLimiteCategoria: (e: React.FormEvent, categoria: string) => void;
  deletarLimiteCategoria: (categoria: string) => void;
}

export default function OrcamentoTab({
  tipoOrcamento,
  setTipoOrcamento,
  dadosCategorias,
  limites,
  categoriaEditandoLimite,
  setCategoriaEditandoLimite,
  valorNovoLimite,
  setValorNovoLimite,
  salvandoLimite,
  salvarLimiteCategoria,
  deletarLimiteCategoria,
}: OrcamentoTabProps) {
  return (
    <div className="rounded-2xl border border-edge dark:border-slate-800 bg-surface dark:bg-slate-900 p-5 shadow-sm sm:p-6 w-full min-w-0 transition-colors">
      <div className="mb-5 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between w-full">
        <div>
          <h3 className="text-base font-bold text-ink dark:text-white">Limites de Gasto</h3>
          <p className="mt-0.5 text-xs text-ink-muted dark:text-slate-400 sm:text-sm">Controle seu teto de gastos por categoria.</p>
        </div>
        <div className="flex rounded-lg border border-edge dark:border-slate-700 bg-canvas dark:bg-slate-950 p-1 self-start sm:self-auto">
          <button onClick={() => setTipoOrcamento("mensal")} className={`rounded-md px-4 py-1.5 text-xs font-semibold transition-colors ${tipoOrcamento === "mensal" ? "bg-surface dark:bg-slate-800 text-brand-700 dark:text-brand-400 shadow-sm" : "text-ink-muted dark:text-slate-400 hover:text-ink dark:hover:text-slate-200"}`}>Mensal</button>
          <button onClick={() => setTipoOrcamento("anual")} className={`rounded-md px-4 py-1.5 text-xs font-semibold transition-colors ${tipoOrcamento === "anual" ? "bg-surface dark:bg-slate-800 text-brand-700 dark:text-brand-400 shadow-sm" : "text-ink-muted dark:text-slate-400 hover:text-ink dark:hover:text-slate-200"}`}>Anual</button>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-2 w-full">
        {CATEGORIAS.map((cat) => {
          const multiplicador = tipoOrcamento === "anual" ? 12 : 1;
          const jaGasto = (dadosCategorias[cat] || 0) * (tipoOrcamento === "anual" ? 1 : 1);
          const limiteBase = limites[cat] || null;
          const limiteDefinido = limiteBase ? limiteBase * multiplicador : null;
          const porcentagemUso = limiteDefinido ? (jaGasto / limiteDefinido) * 100 : 0;

          let corDaBarra = "bg-brand-500";
          if (porcentagemUso >= 70 && porcentagemUso < 90) corDaBarra = "bg-amber-500";
          if (porcentagemUso >= 90) corDaBarra = "bg-red-500";

          return (
            <div key={cat} className="space-y-2 rounded-xl border border-edge dark:border-slate-700 bg-canvas dark:bg-slate-950/50 p-4 min-w-0 transition-colors">
              <div className="flex items-center justify-between text-sm font-medium w-full min-w-0">
                <span className="text-ink dark:text-slate-200 truncate max-w-[40%] sm:max-w-[50%]">{cat}</span>

                {categoriaEditandoLimite === cat ? (
                  <form onSubmit={(e) => salvarLimiteCategoria(e, cat)} className="flex items-center gap-1.5 shrink-0">
                    <input
                      required
                      type="number"
                      placeholder="R$"
                      value={valorNovoLimite}
                      onChange={(e) => setValorNovoLimite(e.target.value)}
                      className="w-16 sm:w-20 rounded-md border border-edge dark:border-slate-700 bg-surface dark:bg-slate-900 px-1.5 py-1 text-xs text-ink dark:text-slate-200 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
                    />
                    <button type="submit" disabled={salvandoLimite} aria-label={`Salvar limite de ${cat}`} className="min-h-9 min-w-9 inline-flex items-center justify-center rounded-md bg-brand-600 text-white hover:bg-brand-700 dark:hover:bg-brand-500">
                      {salvandoLimite ? <Loader2 className="h-3 w-3 animate-spin" /> : <Save className="h-3 w-3" />}
                    </button>
                    <button type="button" onClick={() => setCategoriaEditandoLimite(null)} aria-label="Cancelar edição do limite" className="min-h-9 min-w-9 inline-flex items-center justify-center rounded-md bg-edge dark:bg-slate-800 text-ink-muted dark:text-slate-400 hover:bg-edge/70 dark:hover:bg-slate-700">
                      <X className="h-3 w-3" />
                    </button>

                    {limiteBase && (
                      <button type="button" onClick={() => deletarLimiteCategoria(cat)} aria-label={`Remover orçamento de ${cat}`} className="ml-1 sm:ml-2 min-h-9 min-w-9 inline-flex items-center justify-center rounded-md bg-red-100 dark:bg-red-950/40 text-red-600 dark:text-red-400 hover:bg-red-200 dark:hover:bg-red-950/60">
                        <Trash2 className="h-3 w-3" />
                      </button>
                    )}
                  </form>
                ) : (
                  <div className="flex items-center gap-1.5 text-xs shrink-0">
                    {limiteDefinido ? (
                      <>
                        <span className="font-bold text-ink dark:text-white">Limite: R$ {limiteDefinido.toFixed(0)}</span>
                        <button onClick={() => { setCategoriaEditandoLimite(cat); setValorNovoLimite(limiteBase?.toString() || ""); }} aria-label={`Editar limite de ${cat}`} className="min-h-9 min-w-9 inline-flex items-center justify-center text-ink-faint dark:text-slate-500 hover:text-brand-600 dark:hover:text-brand-400">
                          <Pencil className="h-3 w-3" />
                        </button>
                      </>
                    ) : (
                      <button onClick={() => setCategoriaEditandoLimite(cat)} className="font-semibold text-brand-700 dark:text-brand-400 hover:underline">
                        + Definir Teto
                      </button>
                    )}
                  </div>
                )}
              </div>

              {limiteDefinido && (
                <div className="space-y-1 w-full">
                  <div className="h-2.5 w-full overflow-hidden rounded-full bg-edge dark:bg-slate-800">
                    <div className={`h-2.5 rounded-full ${corDaBarra} transition-all duration-500`} style={{ width: `${Math.min(porcentagemUso, 100)}%` }}></div>
                  </div>
                  <div className="flex justify-between text-[11px] font-medium text-ink-muted dark:text-slate-400">
                    <span className="truncate">Gasto: R$ {jaGasto.toFixed(2)}</span>
                    <span className={porcentagemUso >= 100 ? "font-bold text-red-600 dark:text-red-400 shrink-0" : "shrink-0"}>{porcentagemUso.toFixed(1)}%</span>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

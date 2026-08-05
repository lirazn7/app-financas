"use client";

import { Bar } from "react-chartjs-2";
import { Loader2, Calendar, CreditCard, Trash2, Pencil, Wallet, ShoppingCart, BarChart3, Plus } from "lucide-react";

interface CartaoTabProps {
  cartoes: any[];
  cartaoSelecionado: number | null;
  setCartaoSelecionado: (id: number) => void;
  setModalCartaoAberto: (v: boolean) => void;
  cartaoAtivo: any;
  diasFaltamFechar: number;
  deletarCartaoAtual: () => void;
  faturaAtualValor: number;
  limiteDisponivelCartao: number;
  rotuloVencimento: string;
  labelsProjecaoCartao: string[];
  valoresProjecaoCartao: number[];
  isDark: boolean;
  chartTextColor: string;
  lancarCompraCartao: (e: React.FormEvent) => void;
  cartaoEstabelecimento: string;
  setCartaoEstabelecimento: (v: string) => void;
  cartaoValor: string;
  setCartaoValor: (v: string) => void;
  cartaoParcelas: string;
  setCartaoParcelas: (v: string) => void;
  isFixo: boolean;
  setIsFixo: (v: boolean) => void;
  cartaoMesInicio: string;
  setCartaoMesInicio: (v: string) => void;
  salvandoCartao: boolean;
  filtroParcelas: "todos" | "fixos";
  setFiltroParcelas: (v: "todos" | "fixos") => void;
  parcelasExibidas: any[];
  parcelasFuturas: any[];
  mostrarTodasParcelas: boolean;
  setMostrarTodasParcelas: (v: boolean) => void;
  setGastoEditando: (g: any) => void;
  deletarGasto: (g: any) => void;
}

export default function CartaoTab({
  cartoes,
  cartaoSelecionado,
  setCartaoSelecionado,
  setModalCartaoAberto,
  cartaoAtivo,
  diasFaltamFechar,
  deletarCartaoAtual,
  faturaAtualValor,
  limiteDisponivelCartao,
  rotuloVencimento,
  labelsProjecaoCartao,
  valoresProjecaoCartao,
  isDark,
  chartTextColor,
  lancarCompraCartao,
  cartaoEstabelecimento,
  setCartaoEstabelecimento,
  cartaoValor,
  setCartaoValor,
  cartaoParcelas,
  setCartaoParcelas,
  isFixo,
  setIsFixo,
  cartaoMesInicio,
  setCartaoMesInicio,
  salvandoCartao,
  filtroParcelas,
  setFiltroParcelas,
  parcelasExibidas,
  parcelasFuturas,
  mostrarTodasParcelas,
  setMostrarTodasParcelas,
  setGastoEditando,
  deletarGasto,
}: CartaoTabProps) {
  return (
    <div className="space-y-6 w-full min-w-0">

      <div className="flex w-full items-center gap-3 overflow-x-auto pb-2 scrollbar-hide">
        {cartoes.map(c => (
          <button
            key={c.id}
            onClick={() => setCartaoSelecionado(c.id)}
            className={`flex shrink-0 items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold transition-all border ${cartaoSelecionado === c.id ? 'border-brand-600 bg-brand-50 dark:bg-brand-900/30 text-brand-700 dark:text-brand-300 shadow-sm' : 'border-edge dark:border-slate-800 bg-surface dark:bg-slate-900 text-ink dark:text-slate-300 hover:bg-canvas dark:hover:bg-slate-800'}`}
          >
            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: c.cor }}></div>
            {c.nome}
          </button>
        ))}
        <button onClick={() => setModalCartaoAberto(true)} className="flex shrink-0 items-center gap-1 px-4 py-2.5 rounded-xl border border-dashed border-ink-faint dark:border-slate-700 bg-transparent text-sm font-semibold text-ink-muted dark:text-slate-400 hover:text-ink dark:hover:text-slate-200 hover:border-edge dark:hover:border-slate-500 transition-colors">
          <Plus className="w-4 h-4" /> Novo Cartão
        </button>
      </div>

      {cartoes.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 sm:py-20 px-4 border-2 border-dashed border-edge dark:border-slate-800 rounded-3xl bg-surface/50 dark:bg-slate-900/50 w-full min-w-0 transition-colors">
          <CreditCard className="w-12 h-12 sm:w-16 sm:h-16 text-ink-faint dark:text-slate-600 mb-4" />
          <h3 className="text-lg sm:text-xl font-bold text-ink dark:text-slate-200 mb-2 text-center">Nenhum cartão cadastrado</h3>
          <p className="text-xs sm:text-sm text-ink-muted dark:text-slate-400 text-center max-w-md mb-6">Cadastre seu primeiro cartão de crédito para acompanhar faturas, projetar limites e centralizar todas as suas compras parceladas.</p>
          <button onClick={() => setModalCartaoAberto(true)} className="bg-brand-600 hover:bg-brand-700 text-white px-5 sm:px-6 py-2.5 sm:py-3 rounded-xl text-sm sm:text-base font-bold transition-colors">
            + Cadastrar Cartão
          </button>
        </div>
      ) : (
        <div className="grid w-full gap-6 lg:grid-cols-2">
          <div className="space-y-6 w-full min-w-0">

            {/* CARD PRINCIPAL */}
            <div className="rounded-3xl p-5 sm:p-7 text-white shadow-xl relative overflow-hidden transition-all duration-500 w-full min-w-0" style={{ backgroundColor: cartaoAtivo?.cor || '#0e5c3e' }}>
              <div className="flex justify-between items-start mb-6 sm:mb-8 min-w-0 w-full">
                <div className="flex items-center gap-1.5 sm:gap-2 text-[10px] sm:text-[11px] font-bold tracking-wider text-white/80 uppercase truncate">
                  <CreditCard className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" /> Fatura Atual • {diasFaltamFechar === 0 ? "Fecha Hoje" : `Fecha em ${diasFaltamFechar} dias`}
                </div>
                <button onClick={deletarCartaoAtual} title="Excluir Cartão" aria-label="Excluir Cartão" className="text-white/60 hover:text-red-300 transition-colors min-h-11 min-w-11 inline-flex items-center justify-center rounded-full hover:bg-white/10 -mt-1 sm:-mt-2 -mr-1 sm:-mr-2 shrink-0 ml-2">
                  <Trash2 className="w-4 h-4 sm:w-5 sm:h-5" />
                </button>
              </div>
              <div className="mb-6 sm:mb-10 w-full min-w-0">
                <p className="text-xs sm:text-sm text-white/80 mb-1">Total a Pagar</p>
                <h3 className="text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight truncate w-full min-w-0">R$ {faturaAtualValor.toFixed(2)}</h3>
              </div>
              <div className="flex justify-between items-end border-t border-white/20 pt-4 sm:pt-5 min-w-0 w-full">
                <div className="min-w-0 flex-1">
                  <p className="text-[10px] sm:text-xs text-white/80 mb-0.5">Limite Disponível</p>
                  <p className="text-sm sm:text-lg font-semibold text-white truncate w-full pr-2">R$ {limiteDisponivelCartao.toFixed(2)}</p>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-[10px] sm:text-xs text-white/80 mb-0.5">Vencimento</p>
                  <p className="text-sm sm:text-lg font-semibold text-white">{rotuloVencimento}</p>
                </div>
              </div>
            </div>

            <div className="bg-surface dark:bg-slate-900 rounded-2xl p-4 sm:p-6 border border-edge dark:border-slate-800 shadow-sm w-full min-w-0 transition-colors">
              <div className="flex justify-between items-center mb-6">
                <h4 className="text-base sm:text-lg font-bold text-ink dark:text-white">Projeção 6 Meses</h4>
                <BarChart3 className="w-4 h-4 sm:w-5 sm:h-5 text-ink-faint dark:text-slate-500 shrink-0" />
              </div>
              <div className="relative h-40 w-full min-w-0">
                <Bar
                  data={{
                    labels: labelsProjecaoCartao,
                    datasets: [{
                      data: valoresProjecaoCartao,
                      backgroundColor: isDark ? '#334155' : '#e5e7eb',
                      hoverBackgroundColor: cartaoAtivo?.cor || '#047857',
                      borderRadius: 4
                    }]
                  }}
                  options={{
                    responsive: true, maintainAspectRatio: false,
                    plugins: { legend: { display: false }, tooltip: { enabled: true, callbacks: { label: (context) => `R$ ${(context.parsed.y || 0).toFixed(2)}` } } },
                    scales: { x: { grid: { display: false }, border: { display: false }, ticks: { color: chartTextColor, font: { size: 10 } } }, y: { display: false } }
                  }}
                />
              </div>
            </div>
          </div>

          <div className="space-y-6 w-full min-w-0">

            {/* FORMULÁRIO DE LANÇAMENTO */}
            <form onSubmit={lancarCompraCartao} className="bg-surface dark:bg-slate-900 rounded-2xl p-4 sm:p-6 border border-edge dark:border-slate-800 shadow-sm w-full min-w-0 transition-colors">
              <h4 className="text-sm sm:text-base font-bold text-ink dark:text-white flex items-center gap-2 mb-4">
                <ShoppingCart className="w-4 h-4 sm:w-5 sm:h-5 text-brand-600 dark:text-brand-500 shrink-0" /> Lançar Compra
              </h4>
              <div className="border-t border-edge dark:border-slate-800 pt-4 space-y-4 w-full">
                <div className="w-full">
                  <label className="block text-xs font-semibold text-ink dark:text-slate-300 mb-1.5">Estabelecimento</label>
                  <input required value={cartaoEstabelecimento} onChange={e => setCartaoEstabelecimento(e.target.value)} type="text" placeholder="✍️ Digite aqui o nome do local..." className="w-full rounded-xl border border-edge dark:border-slate-700 bg-canvas dark:bg-slate-950 p-2.5 text-sm text-ink dark:text-slate-200 placeholder-ink-faint dark:placeholder-slate-500 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500 transition-colors" />
                </div>

                <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 w-full">
                  <div className="w-full sm:flex-1 min-w-0">
                    <label className="block text-xs font-semibold text-ink dark:text-slate-300 mb-1.5">Valor Total (R$)</label>
                    <input required value={cartaoValor} onChange={e => setCartaoValor(e.target.value)} type="number" step="0.01" placeholder="0,00" className="w-full rounded-xl border border-edge dark:border-slate-700 bg-canvas dark:bg-slate-950 p-2.5 text-sm text-ink dark:text-slate-200 placeholder-ink-faint dark:placeholder-slate-500 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500 transition-colors" />
                  </div>

                  <div className="flex gap-3 w-full sm:w-auto min-w-0">
                    <div className="flex-1 sm:w-24 min-w-0">
                      <label className="block text-xs font-semibold text-ink dark:text-slate-300 mb-1.5">Parcelas</label>
                      <input
                        required
                        disabled={isFixo}
                        value={cartaoParcelas}
                        onChange={e => setCartaoParcelas(e.target.value)}
                        type="number"
                        min="1"
                        className="w-full rounded-xl border border-edge dark:border-slate-700 bg-canvas dark:bg-slate-950 p-2.5 text-sm text-ink dark:text-slate-200 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500 disabled:opacity-50 transition-colors"
                      />
                    </div>
                    <div className="flex-1 sm:w-36 min-w-0">
                      <label className="block text-xs font-semibold text-ink dark:text-slate-300 mb-1.5">Mês Inicial</label>
                      <input
                        required
                        value={cartaoMesInicio}
                        onChange={e => setCartaoMesInicio(e.target.value)}
                        type="month"
                        className="w-full rounded-xl border border-edge dark:border-slate-700 bg-canvas dark:bg-slate-950 p-2.5 text-sm text-ink dark:text-slate-200 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500 transition-colors"
                      />
                    </div>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-canvas dark:bg-slate-950/50 p-3 rounded-xl border border-edge dark:border-slate-800 w-full transition-colors">
                  <label className="flex items-center gap-2 text-sm text-ink dark:text-slate-300 font-medium cursor-pointer shrink-0">
                    <input
                      type="checkbox"
                      checked={isFixo}
                      onChange={e => setIsFixo(e.target.checked)}
                      className="w-4 h-4 rounded border-edge dark:border-slate-600 bg-white dark:bg-slate-900 text-brand-600 focus:ring-brand-500"
                    />
                    Compra Fixa Mensal
                  </label>
                  {cartaoValor && (
                    <span className="text-xs font-bold text-brand-700 dark:text-brand-300 bg-brand-50 dark:bg-brand-900/30 px-2.5 py-1.5 rounded-lg border border-brand-100 dark:border-brand-800/50 text-center truncate">
                      Será cobrado: R$ {(isFixo ? parseFloat(cartaoValor) : (parseFloat(cartaoValor) / (parseInt(cartaoParcelas) || 1))).toFixed(2)} / mês
                    </span>
                  )}
                </div>

                <button type="submit" disabled={salvandoCartao} className="w-full bg-brand-600 dark:bg-brand-500 hover:bg-brand-700 dark:hover:bg-brand-600 disabled:opacity-50 text-white font-bold text-sm py-3 rounded-xl transition-colors flex justify-center items-center gap-2 mt-2">
                  {salvandoCartao ? <Loader2 className="w-4 h-4 animate-spin" /> : "✓ Adicionar à Fatura"}
                </button>
              </div>
            </form>

            {/* TABELA DE PRÓXIMAS PARCELAS */}
            <div className="bg-surface dark:bg-slate-900 rounded-2xl p-0 border border-edge dark:border-slate-800 shadow-sm overflow-hidden w-full min-w-0 transition-colors">
              <div className="p-4 sm:p-5 flex justify-between items-center border-b border-edge dark:border-slate-800 bg-canvas/30 dark:bg-slate-950/30 w-full min-w-0">
                <h4 className="text-sm sm:text-base font-bold text-ink dark:text-white flex items-center gap-2 shrink-0">
                  <Calendar className="w-4 h-4 sm:w-5 sm:h-5 text-ink-muted dark:text-slate-400" /> Próximas Parcelas
                </h4>
                <div className="flex rounded-lg border border-brand-200 dark:border-brand-800/50 bg-brand-50 dark:bg-brand-900/20 p-1 shrink-0 ml-2">
                  <button onClick={() => setFiltroParcelas("todos")} className={`px-2 sm:px-3 py-1 text-[10px] sm:text-xs font-bold rounded-md shadow-sm transition-colors ${filtroParcelas === "todos" ? "bg-white dark:bg-brand-600 text-brand-700 dark:text-white" : "text-brand-600/70 dark:text-brand-400/70 hover:text-brand-700 dark:hover:text-brand-300"}`}>Todos</button>
                  <button onClick={() => setFiltroParcelas("fixos")} className={`px-2 sm:px-3 py-1 text-[10px] sm:text-xs font-bold rounded-md shadow-sm transition-colors ${filtroParcelas === "fixos" ? "bg-white dark:bg-brand-600 text-brand-700 dark:text-white" : "text-brand-600/70 dark:text-brand-400/70 hover:text-brand-700 dark:hover:text-brand-300"}`}>Fixos</button>
                </div>
              </div>

              <div className="overflow-x-auto w-full">
                <table className="w-full text-left text-sm whitespace-nowrap">
                  <thead className="bg-canvas dark:bg-slate-950/80 border-b border-edge dark:border-slate-800 text-[10px] sm:text-xs font-semibold text-ink-faint dark:text-slate-500">
                    <tr>
                      <th className="px-4 sm:px-5 py-3">Estabelecimento</th>
                      <th className="px-4 sm:px-5 py-3 text-right">Valor</th>
                      <th className="px-4 sm:px-5 py-3 text-center">Mês</th>
                      <th className="px-4 sm:px-5 py-3 text-right">Ações</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-edge/50 dark:divide-slate-800/80 text-xs sm:text-sm">
                    {parcelasExibidas.length > 0 ? (
                      parcelasExibidas.map((parcela) => {
                        const [ano, mes] = parcela.data_compra.split("-");
                        return (
                          <tr key={parcela.id} className="hover:bg-canvas/50 dark:hover:bg-slate-800/50 transition-colors">
                            <td className="px-4 sm:px-5 py-3 sm:py-4 flex items-center gap-2.5 sm:gap-3 font-medium text-ink dark:text-slate-200">
                              <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-brand-50 dark:bg-brand-900/30 text-brand-600 dark:text-brand-400 flex shrink-0 items-center justify-center"><ShoppingCart className="w-3.5 h-3.5 sm:w-4 sm:h-4" /></div>
                              <span className="truncate max-w-[120px] sm:max-w-[150px] block" title={parcela.estabelecimento}>{parcela.estabelecimento}</span>
                            </td>
                            <td className="px-4 sm:px-5 py-3 sm:py-4 text-right font-bold text-ink dark:text-slate-100">R$ {parcela.valor.toFixed(2)}</td>
                            <td className="px-4 sm:px-5 py-3 sm:py-4 text-center text-ink-muted dark:text-slate-400">{mes}/{ano.slice(-2)}</td>

                            <td className="px-4 sm:px-5 py-3 sm:py-4 text-right">
                              <div className="flex justify-end gap-1 sm:gap-1.5">
                                <button type="button" onClick={() => setGastoEditando(parcela)} className="min-h-9 min-w-9 inline-flex items-center justify-center rounded text-brand-600 dark:text-brand-400 transition-colors hover:bg-brand-50 dark:hover:bg-brand-900/30" title="Editar valor da parcela" aria-label="Editar valor da parcela">
                                  <Pencil className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                                </button>
                                <button type="button" onClick={() => deletarGasto(parcela)} className="min-h-9 min-w-9 inline-flex items-center justify-center rounded text-red-500 dark:text-red-400 transition-colors hover:bg-red-50 dark:hover:bg-red-900/30" title="Excluir compra da fatura" aria-label="Excluir compra da fatura">
                                  <Trash2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })
                    ) : (
                      <tr><td colSpan={4} className="px-5 py-8 text-center text-ink-muted dark:text-slate-500">Nenhuma fatura encontrada.</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
              {parcelasFuturas.length > 4 && (
                <div className="bg-canvas dark:bg-slate-950/80 border-t border-edge dark:border-slate-800 p-3 text-center w-full transition-colors">
                  <button onClick={() => setMostrarTodasParcelas(!mostrarTodasParcelas)} className="text-xs font-bold text-brand-700 dark:text-brand-400 hover:underline">
                    {mostrarTodasParcelas ? "Ocultar parcelas" : `Ver todas as ${parcelasFuturas.length} parcelas futuras`}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

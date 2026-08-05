"use client";

export const dynamic = "force-dynamic";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase";
import { Loader2, TrendingUp, Calendar, CreditCard, Table as TableIcon, LayoutDashboard, X, Save, Wallet } from "lucide-react";
import { useTheme } from "next-themes";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
} from "chart.js";
import { CATEGORIAS, FORMAS_PAGAMENTO, CORES_CATEGORIAS, CORES_PAGAMENTOS } from "@/lib/constantes";
import AppHeader from "@/components/AppHeader";
import AuthCard from "@/components/AuthCard";
import GraficosTab from "@/components/dashboard/GraficosTab";
import OrcamentoTab from "@/components/dashboard/OrcamentoTab";
import CartaoTab from "@/components/dashboard/CartaoTab";
import HistoricoTab from "@/components/dashboard/HistoricoTab";

ChartJS.register(CategoryScale, LinearScale, BarElement, LineElement, PointElement, ArcElement, Title, Tooltip, Legend);

const CORES_PAGAMENTOS_FIXO: { [key: string]: string } = { "Crédito": "#8B5CF6", "Débito": "#3B82F6", "Pix": "#10B981", "Dinheiro": "#F59E0B", "Vale Alimentação": "#F43F5E", "Vale Refeição": "#F97316" };

export default function Dashboard() {
  // 🌟 Hook de Tema para adaptar os gráficos
  const { theme } = useTheme();
  const isDark = theme === "dark";

  // Configurações de cores dinâmicas para os gráficos (Grid e Textos)
  const chartGridColor = isDark ? "#334155" : "#eef1f4";
  const chartTextColor = isDark ? "#94a3b8" : "#6b7280";

  // --- ESTADOS DA ABA CARTÃO ---
  const [cartoes, setCartoes] = useState<any[]>([]);
  const [cartaoSelecionado, setCartaoSelecionado] = useState<number | null>(null);
  const [modalCartaoAberto, setModalCartaoAberto] = useState(false);
  const [novoCartao, setNovoCartao] = useState({ nome: "", limite: "", diaVencimento: "", diaFechamento: "", cor: "#0e5c3e" });
  
  const [cartaoEstabelecimento, setCartaoEstabelecimento] = useState("");
  const [cartaoValor, setCartaoValor] = useState("");
  const [cartaoParcelas, setCartaoParcelas] = useState("1");
  const [isFixo, setIsFixo] = useState(false);
  const [salvandoCartao, setSalvandoCartao] = useState(false);
  const [mostrarTodasParcelas, setMostrarTodasParcelas] = useState(false);
  const [filtroParcelas, setFiltroParcelas] = useState<"todos" | "fixos">("todos");
  
  const hojeLocal = new Date();
  const mesAtualDefault = `${hojeLocal.getFullYear()}-${String(hojeLocal.getMonth() + 1).padStart(2, '0')}`;
  const [cartaoMesInicio, setCartaoMesInicio] = useState(mesAtualDefault);

  // --- ESTADOS DE AUTENTICAÇÃO E DADOS GERAIS ---
  const [autenticado, setAutenticado] = useState<boolean | null>(null);
  const [usuarioAtual, setUsuarioAtual] = useState<any>(null);
  const [emailInput, setEmailInput] = useState("");
  const [senhaInput, setSenhaInput] = useState("");
  const [modoCadastro, setModoCadastro] = useState(false);

  const [loading, setLoading] = useState(true);
  const [todosGastos, setTodosGastos] = useState<any[]>([]);
  const [gastosFiltrados, setGastosFiltrados] = useState<any[]>([]);
  const [mesesDisponiveis, setMesesDisponiveis] = useState<string[]>([]);
  const [mesSelecionado, setMesSelecionado] = useState<string>("todos");

  const [abaAtual, setAbaAtual] = useState<"graficos" | "orcamento" | "tabela" | "cartao">("graficos");
  const [pagamentosSelecionados, setPagamentosSelecionados] = useState<string[]>([]);
  const [dropdownPagamentosAberto, setDropdownPagamentosAberto] = useState(false);
  const [visaoHistorico, setVisaoHistorico] = useState<"diario" | "mensal">("diario");

  const [filtroTabelaData, setFiltroTabelaData] = useState("");
  const [filtroTabelaCategoria, setFiltroTabelaCategoria] = useState("todas");
  const [filtroTabelaPagamento, setFiltroTabelaPagamento] = useState("todas");

  const [gastoEditando, setGastoEditando] = useState<any>(null);
  const [loadingEdit, setLoadingEdit] = useState(false);

  const [limites, setLimites] = useState<{ [key: string]: number }>({});
  const [categoriaEditandoLimite, setCategoriaEditandoLimite] = useState<string | null>(null);
  const [valorNovoLimite, setValorNovoLimite] = useState("");
  const [salvandoLimite, setSalvandoLimite] = useState(false);
  const [tipoOrcamento, setTipoOrcamento] = useState<"mensal" | "anual">("mensal");

  const [totalGasto, setTotalGasto] = useState(0);
  const [dadosCategorias, setDadosCategorias] = useState<{ [key: string]: number }>({});
  const [dadosDias, setDadosDias] = useState<{ [key: string]: number }>({});
  const [dadosMeses, setDadosMeses] = useState<{ [key: string]: number }>({});
  const [dadosPagamentos, setDadosPagamentos] = useState<{ [key: string]: number }>({});

  async function buscarGastos() {
    try {
      const { data, error } = await supabase.from("gastos").select("*").order("data_compra", { ascending: false });
      if (error) throw error;
      if (data) {
        setTodosGastos(data);
        const meses = Array.from(new Set(data.map((item) => item.data_compra ? item.data_compra.substring(0, 7) : null).filter(Boolean))) as string[];
        setMesesDisponiveis(meses);
        setGastosFiltrados(data);
      }
    } catch (error) {
      console.error("Erro ao carregar dados:", error);
    } finally {
      setLoading(false);
    }
  }

  async function buscarCartoes() {
    try {
      const { data, error } = await supabase.from("cartoes").select("*").order("id", { ascending: true });
      if (error) throw error;
      if (data) {
        setCartoes(data);
        if (data.length > 0 && cartaoSelecionado === null) {
          setCartaoSelecionado(data[0].id);
        }
      }
    } catch (error: any) {
      console.error("Erro ao carregar cartões:", error.message);
    }
  }

  async function buscarLimites() {
    try {
      const { data, error } = await supabase.from("limites_categorias").select("categoria, valor_limite");
      if (data) {
        const mapaLimites = data.reduce((acc: any, item: any) => {
          acc[item.categoria] = item.valor_limite;
          return acc;
        }, {});
        setLimites(mapaLimites);
      }
    } catch (error: any) {}
  }

  const cadastrarCartao = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const { error } = await supabase.from("cartoes").insert({
        user_id: usuarioAtual.id,
        nome: novoCartao.nome,
        limite: parseFloat(novoCartao.limite),
        dia_vencimento: parseInt(novoCartao.diaVencimento),
        dia_fechamento: parseInt(novoCartao.diaFechamento),
        cor: novoCartao.cor
      });
      if (error) throw error;
      
      alert("Cartão adicionado com sucesso!");
      setModalCartaoAberto(false);
      setNovoCartao({ nome: "", limite: "", diaVencimento: "", diaFechamento: "", cor: "#0e5c3e" });
      buscarCartoes();
    } catch (error: any) {
      alert("Erro ao salvar cartão: " + error.message);
    }
  };

  const deletarCartaoAtual = async () => {
    if (!cartaoSelecionado) return;
    if (!window.confirm("ATENÇÃO: Excluir este cartão apagará permanentemente todo o histórico de compras e faturas atreladas a ele. Deseja realmente excluir?")) return;

    try {
      const { error } = await supabase.from("cartoes").delete().eq("id", cartaoSelecionado);
      if (error) throw error;
      
      alert("Cartão e faturas excluídos com sucesso!");
      const novaLista = cartoes.filter(c => c.id !== cartaoSelecionado);
      setCartoes(novaLista);
      setCartaoSelecionado(novaLista.length > 0 ? novaLista[0].id : null);
      buscarGastos(); 
    } catch (error: any) {
      alert("Erro ao excluir cartão: " + error.message);
    }
  };

  useEffect(() => {
    const verificarSessao = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        setUsuarioAtual(session.user);
        setAutenticado(true);
        buscarGastos();
        buscarLimites();
        buscarCartoes();
      } else {
        setAutenticado(false);
        setLoading(false);
      }
    };
    verificarSessao();

    const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        setUsuarioAtual(session.user);
        setAutenticado(true);
        buscarGastos();
        buscarLimites();
        buscarCartoes();
      } else {
        setUsuarioAtual(null);
        setAutenticado(false);
        setTodosGastos([]);
        setLimites({});
        setCartoes([]);
      }
    });

    return () => authListener.subscription.unsubscribe();
  }, []);

  const lidarComAutenticacao = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (modoCadastro) {
        const { error } = await supabase.auth.signUp({ email: emailInput, password: senhaInput });
        if (error) throw error;
        alert("Conta criada com sucesso! Você já pode entrar.");
        setModoCadastro(false);
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email: emailInput, password: senhaInput });
        if (error) throw error;
      }
    } catch (error: any) {
      alert("⚠️ Erro: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  const fazerLogout = async () => {
    await supabase.auth.signOut();
  };

  useEffect(() => {
    if (!autenticado) return;
    let filtrados = todosGastos;
    if (mesSelecionado !== "todos") {
      filtrados = todosGastos.filter((item) => item.data_compra && item.data_compra.startsWith(mesSelecionado));
    }
    setGastosFiltrados(filtrados);

    const total = filtrados.reduce((acc, item) => acc + (item.valor || 0), 0);
    setTotalGasto(total);

    const categories: { [key: string]: number } = {};
    const days: { [key: string]: number } = {};
    const monthsRaw: { [key: string]: number } = {};
    const payments: { [key: string]: number } = {};

    filtrados.forEach((item) => {
      const cat = item.categoria || "Outros";
      categories[cat] = (categories[cat] || 0) + (item.valor || 0);

      const pag = item.forma_pagamento || "Não identificado";
      payments[pag] = (payments[pag] || 0) + (item.valor || 0);

      if (item.data_compra) {
        const [ano, mes, dia] = item.data_compra.split("-");
        days[`${dia}/${mes}`] = (days[`${dia}/${mes}`] || 0) + (item.valor || 0);
        const anoMes = item.data_compra.substring(0, 7);
        monthsRaw[anoMes] = (monthsRaw[anoMes] || 0) + (item.valor || 0);
      }
    });

    const mesesOrdenados = Object.keys(monthsRaw).sort();
    const monthsProcessed: { [key: string]: number } = {};
    const nomesDosMeses = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];

    mesesOrdenados.forEach(key => {
      const [ano, mes] = key.split("-");
      const labelFormatada = `${nomesDosMeses[parseInt(mes) - 1]}/${ano.slice(-2)}`;
      monthsProcessed[labelFormatada] = monthsRaw[key];
    });

    const categoriasOrdenadas = Object.fromEntries(Object.entries(categories).sort(([, a], [, b]) => b - a));
    const pagamentosOrdenados = Object.fromEntries(Object.entries(payments).sort(([, a], [, b]) => b - a));

    setDadosCategorias(categoriasOrdenadas);
    setDadosPagamentos(pagamentosOrdenados);
    setDadosDias(days);
    setDadosMeses(monthsProcessed);
  }, [mesSelecionado, todosGastos, autenticado]);

  const salvarLimiteCategoria = async (e: React.FormEvent, categoria: string) => {
    e.preventDefault();
    if (!valorNovoLimite || parseFloat(valorNovoLimite) <= 0) return alert("Insira um valor válido!");

    setSalvandoLimite(true);
    try {
      const valorNumerico = parseFloat(valorNovoLimite);
      const { error } = await supabase.from("limites_categorias").upsert({
        user_id: usuarioAtual.id,
        categoria: categoria,
        valor_limite: valorNumerico
      }, { onConflict: "user_id,categoria" });
      if (error) throw error;
      setLimites(prev => ({ ...prev, [categoria]: valorNumerico }));
      setCategoriaEditandoLimite(null);
      setValorNovoLimite("");
    } catch (error: any) {} finally { setSalvandoLimite(false); }
  };

  const deletarLimiteCategoria = async (categoria: string) => {
    if (!window.confirm(`Remover o orçamento de ${categoria}?`)) return;
    try {
      const { error } = await supabase.from("limites_categorias").delete().eq("user_id", usuarioAtual.id).eq("categoria", categoria);
      if (error) throw error;
      const novosLimites = { ...limites };
      delete novosLimites[categoria];
      setLimites(novosLimites);
      setCategoriaEditandoLimite(null);
    } catch (error: any) {}
  };

  const salvarEdicao = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoadingEdit(true);
    try {
      const valorNumerico = parseFloat(gastoEditando.valor);
      const { error } = await supabase.from("gastos").update({
        estabelecimento: gastoEditando.estabelecimento,
        valor: valorNumerico,
        data_compra: gastoEditando.data_compra,
        categoria: gastoEditando.categoria,
        forma_pagamento: gastoEditando.forma_pagamento
      }).eq("id", gastoEditando.id);
      if (error) throw error;
      const novaLista = todosGastos.map(g => g.id === gastoEditando.id ? { ...g, ...gastoEditando, valor: valorNumerico } : g);
      setTodosGastos(novaLista);
      setGastoEditando(null);
    } catch (error: any) {} finally { setLoadingEdit(false); }
  };

  const deletarGasto = async (gasto: any) => {
    const nomeBase = gasto.estabelecimento.replace(/\s*\(\d+\/\d+\)$|\s*\(Fixo\)$/, "").trim();
    
    const parcelasRelacionadas = todosGastos.filter(g => 
      g.cartao_id === gasto.cartao_id && 
      g.estabelecimento.replace(/\s*\(\d+\/\d+\)$|\s*\(Fixo\)$/, "").trim() === nomeBase
    );

    let idsParaDeletar = [gasto.id];

    if (parcelasRelacionadas.length > 1) {
      const confirmacao = window.confirm(
        `Esta compra possui ${parcelasRelacionadas.length} parcelas registradas.\n\n` +
        `• Clique em [OK] para APAGAR A COMPRA INTEIRA (${parcelasRelacionadas.length} parcelas).\n` +
        `• Clique em [Cancelar] para apagar APENAS esta parcela.`
      );

      if (confirmacao) {
        idsParaDeletar = parcelasRelacionadas.map(p => p.id);
      } else {
        if (!window.confirm("Deseja apagar APENAS esta parcela selecionada?")) return;
      }
    } else {
      if (!window.confirm("Deseja realmente excluir esta compra da fatura?")) return;
    }

    try {
      const { error } = await supabase.from("gastos").delete().in("id", idsParaDeletar);
      if (error) throw error;

      setTodosGastos(prev => prev.filter(g => !idsParaDeletar.includes(g.id)));
      alert(idsParaDeletar.length > 1 ? "Todas as parcelas da compra foram apagadas!" : "Parcela excluída com sucesso!");
    } catch (error: any) {
      alert("Erro ao excluir: " + error.message);
    }
  };

  const formatarMesAno = (mesAno: string) => {
    const [ano, mes] = mesAno.split("-");
    const mesesNome = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"];
    return `${mesesNome[parseInt(mes) - 1]} / ${ano}`;
  };

  // 💳 LÓGICA MESTRE DOS CARTÕES DE CRÉDITO
  const cartaoAtivo = cartoes.find(c => c.id === cartaoSelecionado);
  
  let faturaAtualValor = 0;
  let limiteDisponivelCartao = 0;
  let diasFaltamFechar = 0;
  let rotuloVencimento = "";
  let mesFechamentoRef = "";

  if (cartaoAtivo) {
    const hoje = new Date();
    const diaHoje = hoje.getDate();
    let mesFatura = hoje.getMonth();
    let anoFatura = hoje.getFullYear();

    if (diaHoje > cartaoAtivo.dia_fechamento) {
      mesFatura++;
      if (mesFatura > 11) {
        mesFatura = 0;
        anoFatura++;
      }
    }

    const mesStr = String(mesFatura + 1).padStart(2, '0');
    mesFechamentoRef = `${anoFatura}-${mesStr}`; 

    faturaAtualValor = todosGastos
      .filter(g => g.cartao_id === cartaoAtivo.id && g.data_compra?.startsWith(mesFechamentoRef))
      .reduce((acc, g) => acc + (g.valor || 0), 0);

    limiteDisponivelCartao = cartaoAtivo.limite - faturaAtualValor;

    if (diaHoje <= cartaoAtivo.dia_fechamento) {
      diasFaltamFechar = cartaoAtivo.dia_fechamento - diaHoje;
    } else {
      const diasNesteMes = new Date(hoje.getFullYear(), hoje.getMonth() + 1, 0).getDate();
      diasFaltamFechar = (diasNesteMes - diaHoje) + cartaoAtivo.dia_fechamento;
    }

    const mesesNomesAbrev = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];
    rotuloVencimento = `${cartaoAtivo.dia_vencimento} de ${mesesNomesAbrev[mesFatura]}`;
  }

  const lancarCompraCartao = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const estabelecimentoDigitado = cartaoEstabelecimento.trim();
    
    if (!cartaoSelecionado) return alert("❌ Selecione ou cadastre um cartão primeiro (ex: clique no botão azul do cartão).");
    if (!estabelecimentoDigitado) return alert("❌ O campo 'Estabelecimento' está VAZIO! \n\nAquele texto 'Ex: Mercado Livre' é apenas uma sugestão apagada. Você precisa digitar o nome do local.");
    if (!cartaoValor || parseFloat(cartaoValor) <= 0) return alert("❌ Preencha um 'Valor Total' válido maior que zero.");
    if (!isFixo && (!cartaoParcelas || parseInt(cartaoParcelas) <= 0)) return alert("❌ Preencha a quantidade de 'Parcelas'.");
    if (!cartaoMesInicio) return alert("❌ O campo 'Mês Inicial' precisa estar preenchido.");

    setSalvandoCartao(true);
    try {
      const valorTotal = parseFloat(cartaoValor);
      const qtdParcelas = isFixo ? 1 : parseInt(cartaoParcelas);
      const valorParcela = isFixo ? valorTotal : (valorTotal / (qtdParcelas > 0 ? qtdParcelas : 1)); 

      const novasParcelas = [];
      const [anoInicio, mesInicio] = cartaoMesInicio.split('-');
      const dataBaseInicio = new Date(parseInt(anoInicio), parseInt(mesInicio) - 1, 15);
      
      const mesesProjetados = isFixo ? 12 : (qtdParcelas > 0 ? qtdParcelas : 1);

      for (let i = 0; i < mesesProjetados; i++) {
        const mesCompra = new Date(dataBaseInicio.getFullYear(), dataBaseInicio.getMonth() + i, 15);
        const dataFormatada = mesCompra.toISOString().split('T')[0];
        
        let nomeEstabelecimento = estabelecimentoDigitado;
        if (!isFixo && qtdParcelas > 1) {
          nomeEstabelecimento = `${estabelecimentoDigitado} (${i + 1}/${qtdParcelas})`;
        } else if (isFixo) {
          nomeEstabelecimento = `${estabelecimentoDigitado} (Fixo)`;
        }

        novasParcelas.push({
          user_id: usuarioAtual.id,
          cartao_id: cartaoSelecionado,
          estabelecimento: nomeEstabelecimento,
          valor: valorParcela,
          data_compra: dataFormatada,
          categoria: "Outros",
          forma_pagamento: "Crédito"
        });
      }

      const { error } = await supabase.from("gastos").insert(novasParcelas);
      if (error) throw error;

      alert("🎉 Compra lançada na fatura com sucesso!");
      setCartaoEstabelecimento(""); setCartaoValor(""); setCartaoParcelas("1"); setIsFixo(false);
      setCartaoMesInicio(mesAtualDefault);
      buscarGastos(); 
    } catch (error: any) { 
      alert("⚠️ Erro fatal no servidor: " + error.message); 
    } finally { 
      setSalvandoCartao(false); 
    }
  };

  const parcelasFuturas = useMemo(() => todosGastos.filter(g => {
    if (g.cartao_id !== cartaoSelecionado) return false;
    if (filtroParcelas === "fixos" && !g.estabelecimento.includes("(Fixo)")) return false;
    return true;
  }).sort((a, b) => new Date(a.data_compra).getTime() - new Date(b.data_compra).getTime()), [todosGastos, cartaoSelecionado, filtroParcelas]);

  const parcelasExibidas = mostrarTodasParcelas ? parcelasFuturas : parcelasFuturas.slice(0, 4);

  const { labelsProjecaoCartao, valoresProjecaoCartao } = useMemo(() => {
    const labels: string[] = [];
    const valores: number[] = [];
    const hojeProjecao = new Date();
    const mesesAbreviados = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];

    for (let i = 0; i < 6; i++) {
      const dataProjecao = new Date(hojeProjecao.getFullYear(), hojeProjecao.getMonth() + i, 1);
      const prefixoAnoMes = `${dataProjecao.getFullYear()}-${String(dataProjecao.getMonth() + 1).padStart(2, '0')}`;

      labels.push(mesesAbreviados[dataProjecao.getMonth()]);

      const somaDoMes = todosGastos
        .filter(g => g.cartao_id === cartaoSelecionado && g.data_compra?.startsWith(prefixoAnoMes))
        .reduce((acc, g) => acc + (g.valor || 0), 0);

      valores.push(somaDoMes);
    }

    return { labelsProjecaoCartao: labels, valoresProjecaoCartao: valores };
  }, [todosGastos, cartaoSelecionado]);

  const inputFiltro = "w-full rounded-xl border border-edge dark:border-slate-700 bg-canvas dark:bg-slate-950/50 p-2.5 text-sm text-ink dark:text-slate-200 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/25 transition-colors";
  const tabelaFiltrada = useMemo(
    () => gastosFiltrados.filter(g => (!filtroTabelaData || g.data_compra === filtroTabelaData) && (filtroTabelaCategoria === "todas" || g.categoria === filtroTabelaCategoria) && (filtroTabelaPagamento === "todas" || g.forma_pagamento === filtroTabelaPagamento)),
    [gastosFiltrados, filtroTabelaData, filtroTabelaCategoria, filtroTabelaPagamento]
  );

  const todosOsMesesParaLinha = useMemo(
    () => Array.from(new Set(todosGastos.map(g => g.data_compra ? g.data_compra.substring(0, 7) : null).filter(Boolean))).sort() as string[],
    [todosGastos]
  );
  const labelsEixoX = useMemo(() => todosOsMesesParaLinha.map(mes => formatarMesAno(mes)), [todosOsMesesParaLinha]);

  const dataLinhaPagamentos = useMemo(() => ({
    labels: labelsEixoX,
    datasets: pagamentosSelecionados.map((pagamento) => {
      const somaMensal = todosOsMesesParaLinha.map(mes => todosGastos.filter(g => g.forma_pagamento === pagamento && g.data_compra?.startsWith(mes)).reduce((acc, g) => acc + (g.valor || 0), 0));
      const cor = CORES_PAGAMENTOS_FIXO[pagamento] || "#9CA3AF";
      return { label: pagamento, data: somaMensal, borderColor: cor, backgroundColor: cor, borderWidth: 2, tension: 0.4, pointBackgroundColor: cor, fill: false };
    })
  }), [labelsEixoX, pagamentosSelecionados, todosOsMesesParaLinha, todosGastos]);

  const dataPizza = useMemo(() => ({
    labels: Object.keys(dadosCategorias),
    datasets: [{ data: Object.values(dadosCategorias), backgroundColor: Object.keys(dadosCategorias).map((_, i) => CORES_CATEGORIAS[i % CORES_CATEGORIAS.length]), borderWidth: 1, borderColor: isDark ? '#1e293b' : '#ffffff' }],
  }), [dadosCategorias, isDark]);

  const dataPagamentos = useMemo(() => ({
    labels: Object.keys(dadosPagamentos),
    datasets: [{ data: Object.values(dadosPagamentos), backgroundColor: Object.keys(dadosPagamentos).map((_, i) => CORES_PAGAMENTOS[i % CORES_PAGAMENTOS.length]), borderWidth: 1, borderColor: isDark ? '#1e293b' : '#ffffff' }],
  }), [dadosPagamentos, isDark]);

  const dataBarras = useMemo(() => ({
    labels: Object.keys(dadosDias),
    datasets: [{ label: "Gastos no Dia (R$)", data: Object.values(dadosDias), backgroundColor: "#059669", borderRadius: 6 }],
  }), [dadosDias]);

  const dataLinha = useMemo(() => ({
    labels: Object.keys(dadosMeses),
    datasets: [{
      label: "Gastos no Mês (R$)",
      data: Object.values(dadosMeses),
      borderColor: "#047857",
      backgroundColor: "#04785740",
      borderWidth: 2,
      tension: 0.4,
      pointBackgroundColor: "#047857",
      fill: true,
    }],
  }), [dadosMeses]);

  if (autenticado === null || loading) {
    return <div className="flex min-h-screen items-center justify-center bg-canvas dark:bg-slate-950"><Loader2 className="h-8 w-8 animate-spin text-brand-600" /></div>;
  }
  if (!autenticado) {
    return <AuthCard modoCadastro={modoCadastro} setModoCadastro={setModoCadastro} email={emailInput} setEmail={setEmailInput} senha={senhaInput} setSenha={setSenhaInput} loading={false} onSubmit={lidarComAutenticacao} />;
  }

  return (
    <div className="min-h-screen bg-canvas dark:bg-slate-950 overflow-x-hidden w-full transition-colors duration-300">
      <AppHeader email={usuarioAtual?.email} paginaAtiva="dashboard" onLogout={fazerLogout} />

      <main className="mx-auto w-full max-w-6xl px-4 py-6 sm:px-6 lg:py-10">
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between w-full">
          <div>
            <h1 className="text-xl font-bold tracking-tight text-ink dark:text-white lg:text-3xl">Painel Financeiro</h1>
            <p className="mt-1 text-sm text-ink-muted dark:text-slate-400">Acompanhe seus gastos, orçamentos e histórico.</p>
          </div>
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 shrink-0 text-brand-600 dark:text-brand-500" />
            <select value={mesSelecionado} onChange={(e) => setMesSelecionado(e.target.value)} className="w-full cursor-pointer rounded-xl border border-edge dark:border-slate-700 bg-surface dark:bg-slate-900 px-3 py-2.5 text-sm font-medium text-ink dark:text-slate-200 shadow-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/25 sm:w-52 transition-colors">
              <option value="todos">Todos os meses</option>
              {mesesDisponiveis.map((mes) => <option key={mes} value={mes}>{formatarMesAno(mes)}</option>)}
            </select>
          </div>
        </div>

        <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 w-full">
          <div className="flex items-center justify-between rounded-2xl bg-gradient-to-br from-brand-700 to-brand-900 dark:from-brand-800 dark:to-slate-900 p-5 text-white shadow-md sm:col-span-2 lg:col-span-1 min-w-0">
            <div className="min-w-0">
              <p className="text-xs font-semibold uppercase tracking-wider text-brand-200 dark:text-brand-300/80">Total no período</p>
              <h2 className="mt-1 text-3xl font-extrabold tracking-tight truncate">R$ {totalGasto.toFixed(2)}</h2>
            </div>
            <div className="rounded-xl bg-white/15 dark:bg-white/10 p-3 shrink-0"><TrendingUp className="h-6 w-6" /></div>
          </div>
          <div className="hidden items-center justify-between rounded-2xl border border-edge dark:border-slate-800 bg-surface dark:bg-slate-900 p-5 shadow-sm sm:flex min-w-0 transition-colors">
            <div className="min-w-0">
              <p className="text-xs font-semibold uppercase tracking-wider text-ink-faint dark:text-slate-500">Registros</p>
              <h2 className="mt-1 text-3xl font-extrabold tracking-tight text-ink dark:text-white truncate">{gastosFiltrados.length}</h2>
            </div>
            <div className="rounded-xl bg-canvas dark:bg-slate-950 p-3 text-ink-muted dark:text-slate-400 shrink-0"><TableIcon className="h-6 w-6" /></div>
          </div>
          <div className="hidden items-center justify-between rounded-2xl border border-edge dark:border-slate-800 bg-surface dark:bg-slate-900 p-5 shadow-sm sm:flex min-w-0 transition-colors">
            <div className="min-w-0">
              <p className="text-xs font-semibold uppercase tracking-wider text-ink-faint dark:text-slate-500">Maior categoria</p>
              <h2 className="mt-1 truncate text-2xl font-extrabold tracking-tight text-ink dark:text-white">{Object.keys(dadosCategorias)[0] || "—"}</h2>
            </div>
            <div className="rounded-xl bg-canvas dark:bg-slate-950 p-3 text-ink-muted dark:text-slate-400 shrink-0"><Wallet className="h-6 w-6" /></div>
          </div>
        </div>

        <div className="mb-6 flex w-full gap-1 overflow-x-auto scrollbar-hide rounded-xl border border-edge dark:border-slate-800 bg-surface dark:bg-slate-900 p-1.5 shadow-sm sm:max-w-[34rem] transition-colors">
          <button onClick={() => setAbaAtual("graficos")} className={`flex min-w-[105px] flex-1 items-center justify-center gap-1.5 rounded-lg py-2.5 text-xs font-semibold transition-all sm:text-sm ${abaAtual === 'graficos' ? 'bg-brand-50 dark:bg-brand-500/10 text-brand-700 dark:text-brand-400' : 'text-ink-muted dark:text-slate-400 hover:text-ink dark:hover:text-slate-200'}`}><LayoutDashboard className="h-4 w-4 shrink-0" /> Gráficos</button>
          <button onClick={() => setAbaAtual("orcamento")} className={`flex min-w-[105px] flex-1 items-center justify-center gap-1.5 rounded-lg py-2.5 text-xs font-semibold transition-all sm:text-sm ${abaAtual === 'orcamento' ? 'bg-brand-50 dark:bg-brand-500/10 text-brand-700 dark:text-brand-400' : 'text-ink-muted dark:text-slate-400 hover:text-ink dark:hover:text-slate-200'}`}><Wallet className="h-4 w-4 shrink-0" /> Orçamento</button>
          <button onClick={() => setAbaAtual("cartao")} className={`flex min-w-[105px] flex-1 items-center justify-center gap-1.5 rounded-lg py-2.5 text-xs font-semibold transition-all sm:text-sm ${abaAtual === 'cartao' ? 'bg-brand-50 dark:bg-brand-500/10 text-brand-700 dark:text-brand-400' : 'text-ink-muted dark:text-slate-400 hover:text-ink dark:hover:text-slate-200'}`}><CreditCard className="h-4 w-4 shrink-0" /> Cartões</button>
          <button onClick={() => setAbaAtual("tabela")} className={`flex min-w-[105px] flex-1 items-center justify-center gap-1.5 rounded-lg py-2.5 text-xs font-semibold transition-all sm:text-sm ${abaAtual === 'tabela' ? 'bg-brand-50 dark:bg-brand-500/10 text-brand-700 dark:text-brand-400' : 'text-ink-muted dark:text-slate-400 hover:text-ink dark:hover:text-slate-200'}`}><TableIcon className="h-4 w-4 shrink-0" /> Histórico</button>
        </div>

        {/* ABA GRÁFICOS */}
        {abaAtual === "graficos" && (
          <GraficosTab
            dadosCategorias={dadosCategorias}
            totalGasto={totalGasto}
            dataPizza={dataPizza}
            dadosPagamentos={dadosPagamentos}
            dataPagamentos={dataPagamentos}
            dropdownPagamentosAberto={dropdownPagamentosAberto}
            setDropdownPagamentosAberto={setDropdownPagamentosAberto}
            pagamentosSelecionados={pagamentosSelecionados}
            setPagamentosSelecionados={setPagamentosSelecionados}
            dataLinhaPagamentos={dataLinhaPagamentos}
            chartTextColor={chartTextColor}
            chartGridColor={chartGridColor}
            visaoHistorico={visaoHistorico}
            setVisaoHistorico={setVisaoHistorico}
            dadosDias={dadosDias}
            dataBarras={dataBarras}
            dadosMeses={dadosMeses}
            dataLinha={dataLinha}
          />
        )}

        {/* ABA ORÇAMENTO */}
        {abaAtual === "orcamento" && (
          <OrcamentoTab
            tipoOrcamento={tipoOrcamento}
            setTipoOrcamento={setTipoOrcamento}
            dadosCategorias={dadosCategorias}
            limites={limites}
            categoriaEditandoLimite={categoriaEditandoLimite}
            setCategoriaEditandoLimite={setCategoriaEditandoLimite}
            valorNovoLimite={valorNovoLimite}
            setValorNovoLimite={setValorNovoLimite}
            salvandoLimite={salvandoLimite}
            salvarLimiteCategoria={salvarLimiteCategoria}
            deletarLimiteCategoria={deletarLimiteCategoria}
          />
        )}

        {/* ABA GESTÃO DE CARTÕES */}
        {abaAtual === "cartao" && (
          <CartaoTab
            cartoes={cartoes}
            cartaoSelecionado={cartaoSelecionado}
            setCartaoSelecionado={setCartaoSelecionado}
            setModalCartaoAberto={setModalCartaoAberto}
            cartaoAtivo={cartaoAtivo}
            diasFaltamFechar={diasFaltamFechar}
            deletarCartaoAtual={deletarCartaoAtual}
            faturaAtualValor={faturaAtualValor}
            limiteDisponivelCartao={limiteDisponivelCartao}
            rotuloVencimento={rotuloVencimento}
            labelsProjecaoCartao={labelsProjecaoCartao}
            valoresProjecaoCartao={valoresProjecaoCartao}
            isDark={isDark}
            chartTextColor={chartTextColor}
            lancarCompraCartao={lancarCompraCartao}
            cartaoEstabelecimento={cartaoEstabelecimento}
            setCartaoEstabelecimento={setCartaoEstabelecimento}
            cartaoValor={cartaoValor}
            setCartaoValor={setCartaoValor}
            cartaoParcelas={cartaoParcelas}
            setCartaoParcelas={setCartaoParcelas}
            isFixo={isFixo}
            setIsFixo={setIsFixo}
            cartaoMesInicio={cartaoMesInicio}
            setCartaoMesInicio={setCartaoMesInicio}
            salvandoCartao={salvandoCartao}
            filtroParcelas={filtroParcelas}
            setFiltroParcelas={setFiltroParcelas}
            parcelasExibidas={parcelasExibidas}
            parcelasFuturas={parcelasFuturas}
            mostrarTodasParcelas={mostrarTodasParcelas}
            setMostrarTodasParcelas={setMostrarTodasParcelas}
            setGastoEditando={setGastoEditando}
            deletarGasto={deletarGasto}
          />
        )}

        {/* ABA HISTÓRICO */}
        {abaAtual === "tabela" && (
          <HistoricoTab
            inputFiltro={inputFiltro}
            filtroTabelaData={filtroTabelaData}
            setFiltroTabelaData={setFiltroTabelaData}
            filtroTabelaCategoria={filtroTabelaCategoria}
            setFiltroTabelaCategoria={setFiltroTabelaCategoria}
            filtroTabelaPagamento={filtroTabelaPagamento}
            setFiltroTabelaPagamento={setFiltroTabelaPagamento}
            tabelaFiltrada={tabelaFiltrada}
            setGastoEditando={setGastoEditando}
            deletarGasto={deletarGasto}
          />
        )}

      </main>

      {/* MODAL DE EDIÇÃO DE GASTO */}
      {gastoEditando && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 dark:bg-black/80 p-4 backdrop-blur-sm transition-colors">
          <div className="w-full max-w-md overflow-hidden rounded-2xl bg-surface dark:bg-slate-900 shadow-xl border border-edge dark:border-slate-800">
            <div className="flex items-center justify-between border-b border-edge dark:border-slate-800 bg-canvas dark:bg-slate-950 p-4">
              <h3 className="text-lg font-bold text-ink dark:text-white">Editar Gasto</h3>
              <button onClick={() => setGastoEditando(null)} aria-label="Fechar" className="min-h-11 min-w-11 inline-flex items-center justify-center rounded-full bg-edge dark:bg-slate-800 text-ink-muted dark:text-slate-400 transition-colors hover:bg-edge/70 dark:hover:bg-slate-700 hover:text-ink dark:hover:text-white"><X className="h-5 w-5" /></button>
            </div>
            <form onSubmit={salvarEdicao} className="space-y-4 p-5">
              <div>
                <label className="mb-1 block text-sm font-medium text-ink dark:text-slate-300">Estabelecimento</label>
                <input required value={gastoEditando.estabelecimento} onChange={e => setGastoEditando({ ...gastoEditando, estabelecimento: e.target.value })} type="text" className="w-full rounded-xl border border-edge dark:border-slate-700 bg-surface dark:bg-slate-950 p-2.5 text-sm text-ink dark:text-slate-200 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/25 transition-colors" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="mb-1 block text-sm font-medium text-ink dark:text-slate-300">Valor (R$)</label>
                  <input required value={gastoEditando.valor} onChange={e => setGastoEditando({ ...gastoEditando, valor: e.target.value })} type="number" step="0.01" className="w-full rounded-xl border border-edge dark:border-slate-700 bg-surface dark:bg-slate-950 p-2.5 text-sm text-ink dark:text-slate-200 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/25 transition-colors" />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-ink dark:text-slate-300">Data</label>
                  <input required value={gastoEditando.data_compra || ""} onChange={e => setGastoEditando({ ...gastoEditando, data_compra: e.target.value })} type="date" className="w-full rounded-xl border border-edge dark:border-slate-700 bg-surface dark:bg-slate-950 p-2.5 text-sm text-ink dark:text-slate-200 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/25 transition-colors" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="mb-1 block text-sm font-medium text-ink dark:text-slate-300">Categoria</label>
                  <select value={gastoEditando.categoria} onChange={e => setGastoEditando({ ...gastoEditando, categoria: e.target.value })} className="w-full rounded-xl border border-edge dark:border-slate-700 bg-surface dark:bg-slate-950 p-2.5 text-sm text-ink dark:text-slate-200 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/25 transition-colors">
                    {CATEGORIAS.map((cat) => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-ink dark:text-slate-300">Pagamento</label>
                  <select value={gastoEditando.forma_pagamento} onChange={e => setGastoEditando({ ...gastoEditando, forma_pagamento: e.target.value })} className="w-full rounded-xl border border-edge dark:border-slate-700 bg-surface dark:bg-slate-950 p-2.5 text-sm text-ink dark:text-slate-200 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/25 transition-colors">
                    {FORMAS_PAGAMENTO.map((fp) => (
                      <option key={fp} value={fp}>{fp}</option>
                    ))}
                  </select>
                </div>
              </div>
              <button type="submit" disabled={loadingEdit} className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-brand-600 dark:bg-brand-500 p-3 text-sm font-semibold text-white transition-colors hover:bg-brand-700 dark:hover:bg-brand-600 disabled:opacity-60">
                {loadingEdit ? <Loader2 className="h-5 w-5 animate-spin" /> : <Save className="h-5 w-5" />} Salvar Alterações
              </button>
            </form>
          </div>
        </div>
      )}

      {/* MODAL CADASTRO DE CARTÃO */}
      {modalCartaoAberto && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 dark:bg-black/80 p-4 backdrop-blur-sm transition-colors">
          <div className="w-full max-w-sm overflow-hidden rounded-2xl bg-surface dark:bg-slate-900 shadow-xl border border-edge dark:border-slate-800">
            <div className="flex items-center justify-between border-b border-edge dark:border-slate-800 bg-canvas dark:bg-slate-950 p-4">
              <h3 className="text-lg font-bold text-ink dark:text-white flex items-center gap-2"><CreditCard className="w-5 h-5 text-brand-600 dark:text-brand-500" /> Cadastrar Cartão</h3>
              <button onClick={() => setModalCartaoAberto(false)} aria-label="Fechar" className="min-h-11 min-w-11 inline-flex items-center justify-center rounded-full bg-edge dark:bg-slate-800 text-ink-muted dark:text-slate-400 hover:bg-edge/70 dark:hover:bg-slate-700 hover:text-ink dark:hover:text-white transition-colors"><X className="h-5 w-5" /></button>
            </div>
            <form onSubmit={cadastrarCartao} className="space-y-4 p-5">
              <div>
                <label className="mb-1 block text-xs font-semibold text-ink dark:text-slate-300">Nome do Cartão (Ex: Nubank, Itaú)</label>
                <input required value={novoCartao.nome} onChange={e => setNovoCartao({...novoCartao, nome: e.target.value})} type="text" className="w-full rounded-xl border border-edge dark:border-slate-700 bg-surface dark:bg-slate-950 p-2.5 text-sm text-ink dark:text-slate-200 focus:border-brand-500 focus:ring-1 focus:ring-brand-500 transition-colors" />
              </div>
              <div>
                <label className="mb-1 block text-xs font-semibold text-ink dark:text-slate-300">Limite Total (R$)</label>
                <input required value={novoCartao.limite} onChange={e => setNovoCartao({...novoCartao, limite: e.target.value})} type="number" step="0.01" className="w-full rounded-xl border border-edge dark:border-slate-700 bg-surface dark:bg-slate-950 p-2.5 text-sm text-ink dark:text-slate-200 focus:border-brand-500 focus:ring-1 focus:ring-brand-500 transition-colors" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="mb-1 block text-xs font-semibold text-ink dark:text-slate-300">Dia do Fechamento</label>
                  <input required value={novoCartao.diaFechamento} onChange={e => setNovoCartao({...novoCartao, diaFechamento: e.target.value})} type="number" min="1" max="31" placeholder="Ex: 5" className="w-full rounded-xl border border-edge dark:border-slate-700 bg-surface dark:bg-slate-950 p-2.5 text-sm text-ink dark:text-slate-200 focus:border-brand-500 focus:ring-1 focus:ring-brand-500 transition-colors" />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-semibold text-ink dark:text-slate-300">Dia do Vencimento</label>
                  <input required value={novoCartao.diaVencimento} onChange={e => setNovoCartao({...novoCartao, diaVencimento: e.target.value})} type="number" min="1" max="31" placeholder="Ex: 12" className="w-full rounded-xl border border-edge dark:border-slate-700 bg-surface dark:bg-slate-950 p-2.5 text-sm text-ink dark:text-slate-200 focus:border-brand-500 focus:ring-1 focus:ring-brand-500 transition-colors" />
                </div>
              </div>
              <div>
                <label className="mb-2 block text-xs font-semibold text-ink dark:text-slate-300">Cor do Cartão</label>
                <div className="flex gap-3">
                  {['#8B5CF6', '#3B82F6', '#10B981', '#F59E0B', '#F43F5E', '#1F2937'].map(color => (
                    <button key={color} type="button" onClick={() => setNovoCartao({...novoCartao, cor: color})} aria-label={`Selecionar cor ${color}`} aria-pressed={novoCartao.cor === color} className={`min-h-11 min-w-11 rounded-full border-2 ${novoCartao.cor === color ? 'border-brand-600 dark:border-brand-400 scale-110' : 'border-transparent hover:scale-105'} transition-transform flex items-center justify-center`}>
                      <span className="w-8 h-8 rounded-full" style={{ backgroundColor: color }} />
                    </button>
                  ))}
                </div>
              </div>
              <button type="submit" className="mt-4 w-full bg-brand-600 dark:bg-brand-500 hover:bg-brand-700 dark:hover:bg-brand-600 text-white font-bold py-3 rounded-xl transition-colors">
                Salvar Cartão
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
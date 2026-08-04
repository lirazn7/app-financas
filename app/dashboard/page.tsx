"use client";

export const dynamic = "force-dynamic";

import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";
import { Bar, Pie, Doughnut, Line } from "react-chartjs-2";
import { Loader2, TrendingUp, Calendar, CreditCard, ChevronDown, Table as TableIcon, LayoutDashboard, Filter, Trash2, Pencil, X, Save, Wallet, MoreHorizontal, ShoppingCart, BarChart3, Plus } from "lucide-react";
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
import { CATEGORIAS, ROTULOS_CATEGORIAS, FORMAS_PAGAMENTO, CORES_CATEGORIAS, CORES_PAGAMENTOS } from "../../lib/constantes";
import AppHeader from "../../components/AppHeader";
import AuthCard from "../../components/AuthCard";

ChartJS.register(CategoryScale, LinearScale, BarElement, LineElement, PointElement, ArcElement, Title, Tooltip, Legend);

export default function Dashboard() {

  // --- ESTADOS DA ABA CARTÃO ---
  const [cartoes, setCartoes] = useState<any[]>([]);
  const [cartaoSelecionado, setCartaoSelecionado] = useState<number | null>(null);
  const [modalCartaoAberto, setModalCartaoAberto] = useState(false);
  const [novoCartao, setNovoCartao] = useState({ nome: "", limite: "", diaVencimento: "", diaFechamento: "", cor: "#0e5c3e" });

  const [cartaoEstabelecimento, setCartaoEstabelecimento] = useState("");
  const [cartaoValor, setCartaoValor] = useState("");
  const [cartaoParcelas, setCartaoParcelas] = useState("1");
  const [isFixo, setIsFixo] = useState(false); // NOVO: Controle de compra fixa
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
    } catch (error: any) { }
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

  // NOVA FUNÇÃO: Deletar Cartão Inteiro
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
    } catch (error: any) { } finally { setSalvandoLimite(false); }
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
    } catch (error: any) { }
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
    } catch (error: any) { } finally { setLoadingEdit(false); }
  };

  // 🗑️ FUNÇÃO DELETAR GASTO (Com opção de apagar compra parcelada inteira)
  const deletarGasto = async (gasto: any) => {
    // Extrai o nome base do estabelecimento removendo o sufixo de parcela (ex: "Mercado Livre (1/12)" -> "Mercado Livre")
    const nomeBase = gasto.estabelecimento.replace(/\s*\(\d+\/\d+\)$|\s*\(Fixo\)$/, "").trim();

    // Procura se existem outras parcelas com esse mesmo nome base e no mesmo cartão
    const parcelasRelacionadas = todosGastos.filter(g =>
      g.cartao_id === gasto.cartao_id &&
      g.estabelecimento.replace(/\s*\(\d+\/\d+\)$|\s*\(Fixo\)$/, "").trim() === nomeBase
    );

    let idsParaDeletar = [gasto.id];

    if (parcelasRelacionadas.length > 1) {
      const confirmacao = window.confirm(
        `Esta compra possui ${parcelasRelacionadas.length} parcelas registradas.\n\n` +
        `• Clique em [OK] para APAGAR A COMPRA INTEIRA (${parcelasRelacionadas.length} parcelas de uma vez).\n` +
        `• Clique em [Cancelar] se quiser apagar apenas esta parcela específica.`
      );

      if (confirmacao) {
        idsParaDeletar = parcelasRelacionadas.map(p => p.id);
      } else {
        // Se o usuário não quis apagar tudo, confirma se quer apagar só a atual
        if (!window.confirm("Deseja apagar apenas esta parcela selecionada?")) return;
      }
    } else {
      if (!window.confirm("Deseja realmente excluir esta compra da fatura?")) return;
    }

    try {
      const { error } = await supabase.from("gastos").delete().in("id", idsParaDeletar);
      if (error) throw error;

      // Remove do estado local para a tela atualizar na hora
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

    const mesAtualString = `${hoje.getFullYear()}-${String(hoje.getMonth() + 1).padStart(2, '0')}`;
    const valorComprometidoTotal = todosGastos
      .filter(g => g.cartao_id === cartaoAtivo.id && g.data_compra >= `${mesAtualString}-01`)
      .reduce((acc, g) => acc + (g.valor || 0), 0);

    limiteDisponivelCartao = cartaoAtivo.limite - valorComprometidoTotal;

    if (diaHoje <= cartaoAtivo.dia_fechamento) {
      diasFaltamFechar = cartaoAtivo.dia_fechamento - diaHoje;
    } else {
      const diasNesteMes = new Date(hoje.getFullYear(), hoje.getMonth() + 1, 0).getDate();
      diasFaltamFechar = (diasNesteMes - diaHoje) + cartaoAtivo.dia_fechamento;
    }

    const mesesNomesAbrev = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];
    rotuloVencimento = `${cartaoAtivo.dia_vencimento} de ${mesesNomesAbrev[mesFatura]}`;
  }

  // 💳 Lançar compra conectada ao cartão
  const lancarCompraCartao = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!cartaoSelecionado) return alert("Selecione ou cadastre um cartão primeiro.");
    if (!cartaoEstabelecimento || !cartaoValor || !cartaoMesInicio) return alert("Preencha todos os campos!");

    setSalvandoCartao(true);
    try {
      const valorTotal = parseFloat(cartaoValor);
      const qtdParcelas = isFixo ? 1 : parseInt(cartaoParcelas);
      const valorParcela = isFixo ? valorTotal : (valorTotal / (qtdParcelas > 0 ? qtdParcelas : 1));

      const novasParcelas = [];

      // 🌟 NOVA LÓGICA: Iniciar a contagem a partir do mês selecionado
      const [anoInicio, mesInicio] = cartaoMesInicio.split('-');
      const dataBaseInicio = new Date(parseInt(anoInicio), parseInt(mesInicio) - 1, 15);

      const mesesProjetados = isFixo ? 12 : (qtdParcelas > 0 ? qtdParcelas : 1);

      for (let i = 0; i < mesesProjetados; i++) {
        const mesCompra = new Date(dataBaseInicio.getFullYear(), dataBaseInicio.getMonth() + i, 15);
        const dataFormatada = mesCompra.toISOString().split('T')[0];

        let nomeEstabelecimento = cartaoEstabelecimento;
        if (!isFixo && qtdParcelas > 1) {
          nomeEstabelecimento = `${cartaoEstabelecimento} (${i + 1}/${qtdParcelas})`;
        } else if (isFixo) {
          nomeEstabelecimento = `${cartaoEstabelecimento} (Fixo)`;
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

      alert("Compra lançada na fatura com sucesso!");
      setCartaoEstabelecimento(""); setCartaoValor(""); setCartaoParcelas("1"); setIsFixo(false);
      setCartaoMesInicio(mesAtualDefault); // Reseta para o mês atual
      buscarGastos();
    } catch (error: any) { alert("Erro ao lançar compra: " + error.message); } finally { setSalvandoCartao(false); }
  };

  // 🔍 Tabela e Projeção filtradas pelo Cartão
  const parcelasFuturas = todosGastos.filter(g => {
    if (g.cartao_id !== cartaoSelecionado) return false;
    if (filtroParcelas === "fixos" && !g.estabelecimento.includes("(Fixo)")) return false;
    return true;
  }).sort((a, b) => new Date(a.data_compra).getTime() - new Date(b.data_compra).getTime());

  const parcelasExibidas = mostrarTodasParcelas ? parcelasFuturas : parcelasFuturas.slice(0, 4);

  const labelsProjecaoCartao: string[] = [];
  const valoresProjecaoCartao: number[] = [];
  const hojeProjecao = new Date();
  const mesesAbreviados = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];

  for (let i = 0; i < 6; i++) {
    const dataProjecao = new Date(hojeProjecao.getFullYear(), hojeProjecao.getMonth() + i, 1);
    const prefixoAnoMes = `${dataProjecao.getFullYear()}-${String(dataProjecao.getMonth() + 1).padStart(2, '0')}`;

    labelsProjecaoCartao.push(mesesAbreviados[dataProjecao.getMonth()]);

    const somaDoMes = todosGastos
      .filter(g => g.cartao_id === cartaoSelecionado && g.data_compra?.startsWith(prefixoAnoMes))
      .reduce((acc, g) => acc + (g.valor || 0), 0);

    valoresProjecaoCartao.push(somaDoMes);
  }

  // ----------------------------------------------------
  // RENDERIZAÇÃO
  // ----------------------------------------------------
  if (autenticado === null || loading) {
    return <div className="flex min-h-screen items-center justify-center bg-canvas"><Loader2 className="h-8 w-8 animate-spin text-brand-600" /></div>;
  }
  if (!autenticado) {
    return <AuthCard modoCadastro={modoCadastro} setModoCadastro={setModoCadastro} email={emailInput} setEmail={setEmailInput} senha={senhaInput} setSenha={setSenhaInput} loading={false} onSubmit={lidarComAutenticacao} />;
  }

  const inputFiltro = "w-full rounded-xl border border-edge bg-canvas p-2.5 text-sm text-ink focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/25";
  const tabelaFiltrada = gastosFiltrados.filter(g => (!filtroTabelaData || g.data_compra === filtroTabelaData) && (filtroTabelaCategoria === "todas" || g.categoria === filtroTabelaCategoria) && (filtroTabelaPagamento === "todas" || g.forma_pagamento === filtroTabelaPagamento));

  const todosOsMesesParaLinha = Array.from(new Set(todosGastos.map(g => g.data_compra ? g.data_compra.substring(0, 7) : null).filter(Boolean))).sort() as string[];
  const labelsEixoX = todosOsMesesParaLinha.map(mes => formatarMesAno(mes));
  const coresPagamentosFixo: { [key: string]: string } = { "Crédito": "#8B5CF6", "Débito": "#3B82F6", "Pix": "#10B981", "Dinheiro": "#F59E0B", "Vale Alimentação": "#F43F5E", "Vale Refeição": "#F97316" };

  const dataLinhaPagamentos = {
    labels: labelsEixoX,
    datasets: pagamentosSelecionados.map((pagamento) => {
      const somaMensal = todosOsMesesParaLinha.map(mes => todosGastos.filter(g => g.forma_pagamento === pagamento && g.data_compra?.startsWith(mes)).reduce((acc, g) => acc + (g.valor || 0), 0));
      const cor = coresPagamentosFixo[pagamento] || "#9CA3AF";
      return { label: pagamento, data: somaMensal, borderColor: cor, backgroundColor: cor, borderWidth: 2, tension: 0.4, pointBackgroundColor: cor, fill: false };
    })
  };

  const dataPizza = {
    labels: Object.keys(dadosCategorias),
    datasets: [{ data: Object.values(dadosCategorias), backgroundColor: Object.keys(dadosCategorias).map((_, i) => CORES_CATEGORIAS[i % CORES_CATEGORIAS.length]), borderWidth: 1 }],
  };

  const dataPagamentos = {
    labels: Object.keys(dadosPagamentos),
    datasets: [{ data: Object.values(dadosPagamentos), backgroundColor: Object.keys(dadosPagamentos).map((_, i) => CORES_PAGAMENTOS[i % CORES_PAGAMENTOS.length]), borderWidth: 1 }],
  };

  const dataBarras = {
    labels: Object.keys(dadosDias),
    datasets: [{ label: "Gastos no Dia (R$)", data: Object.values(dadosDias), backgroundColor: "#059669", borderRadius: 6 }],
  };

  const dataLinha = {
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
  };

  return (
    <div className="min-h-screen bg-canvas">
      <AppHeader email={usuarioAtual?.email} paginaAtiva="dashboard" onLogout={fazerLogout} />

      <main className="mx-auto max-w-6xl px-4 py-6 sm:px-6 lg:py-10">
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-xl font-bold tracking-tight text-ink lg:text-3xl">Painel Financeiro</h1>
            <p className="mt-1 text-sm text-ink-muted">Acompanhe seus gastos, orçamentos e histórico.</p>
          </div>
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 shrink-0 text-brand-600" />
            <select value={mesSelecionado} onChange={(e) => setMesSelecionado(e.target.value)} className="w-full cursor-pointer rounded-xl border border-edge bg-surface px-3 py-2.5 text-sm font-medium text-ink shadow-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/25 sm:w-52">
              <option value="todos">Todos os meses</option>
              {mesesDisponiveis.map((mes) => <option key={mes} value={mes}>{formatarMesAno(mes)}</option>)}
            </select>
          </div>
        </div>

        <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <div className="flex items-center justify-between rounded-2xl bg-gradient-to-br from-brand-700 to-brand-900 p-5 text-white shadow-md sm:col-span-2 lg:col-span-1">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-brand-200">Total no período</p>
              <h2 className="mt-1 text-3xl font-extrabold tracking-tight">R$ {totalGasto.toFixed(2)}</h2>
            </div>
            <div className="rounded-xl bg-white/15 p-3"><TrendingUp className="h-6 w-6" /></div>
          </div>
          <div className="hidden items-center justify-between rounded-2xl border border-edge bg-surface p-5 shadow-sm sm:flex">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-ink-faint">Registros</p>
              <h2 className="mt-1 text-3xl font-extrabold tracking-tight text-ink">{gastosFiltrados.length}</h2>
            </div>
            <div className="rounded-xl bg-canvas p-3 text-ink-muted"><TableIcon className="h-6 w-6" /></div>
          </div>
          <div className="hidden items-center justify-between rounded-2xl border border-edge bg-surface p-5 shadow-sm sm:flex">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-ink-faint">Maior categoria</p>
              <h2 className="mt-1 truncate text-2xl font-extrabold tracking-tight text-ink">{Object.keys(dadosCategorias)[0] || "—"}</h2>
            </div>
            <div className="rounded-xl bg-canvas p-3 text-ink-muted"><Wallet className="h-6 w-6" /></div>
          </div>
        </div>

        <div className="mb-6 flex gap-1 rounded-xl border border-edge bg-surface p-1.5 shadow-sm sm:max-w-[34rem]">
          <button onClick={() => setAbaAtual("graficos")} className={`flex flex-1 items-center justify-center gap-1.5 rounded-lg py-2.5 text-xs font-semibold transition-all sm:text-sm ${abaAtual === 'graficos' ? 'bg-brand-50 text-brand-700' : 'text-ink-muted hover:text-ink'}`}><LayoutDashboard className="h-4 w-4" /> Gráficos</button>
          <button onClick={() => setAbaAtual("orcamento")} className={`flex flex-1 items-center justify-center gap-1.5 rounded-lg py-2.5 text-xs font-semibold transition-all sm:text-sm ${abaAtual === 'orcamento' ? 'bg-brand-50 text-brand-700' : 'text-ink-muted hover:text-ink'}`}><Wallet className="h-4 w-4" /> Orçamento</button>
          <button onClick={() => setAbaAtual("cartao")} className={`flex flex-1 items-center justify-center gap-1.5 rounded-lg py-2.5 text-xs font-semibold transition-all sm:text-sm ${abaAtual === 'cartao' ? 'bg-brand-50 text-brand-700' : 'text-ink-muted hover:text-ink'}`}><CreditCard className="h-4 w-4" /> Cartões</button>
          <button onClick={() => setAbaAtual("tabela")} className={`flex flex-1 items-center justify-center gap-1.5 rounded-lg py-2.5 text-xs font-semibold transition-all sm:text-sm ${abaAtual === 'tabela' ? 'bg-brand-50 text-brand-700' : 'text-ink-muted hover:text-ink'}`}><TableIcon className="h-4 w-4" /> Histórico</button>
        </div>

        {/* ABA GRÁFICOS */}
        {abaAtual === "graficos" && (
          <div className="grid gap-5 lg:grid-cols-2">
            <div className="rounded-2xl border border-edge bg-surface p-5 shadow-sm">
              <h3 className="mb-4 text-base font-bold text-ink">Divisão por Categorias</h3>
              {Object.keys(dadosCategorias).length > 0 ? (
                <>
                  <div className="flex h-48 w-full items-center justify-center lg:h-56"><Pie data={dataPizza} options={{ responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } } }} /></div>
                  <details className="group mt-5 overflow-hidden rounded-xl border border-edge bg-canvas">
                    <summary className="flex cursor-pointer list-none items-center justify-between p-3.5 text-sm font-semibold text-ink transition-colors hover:bg-edge/40 [&::-webkit-details-marker]:hidden">
                      Ver detalhamento e % <ChevronDown className="h-4 w-4 text-ink-faint transition-transform duration-300 group-open:rotate-180" />
                    </summary>
                    <div className="space-y-3.5 border-t border-edge bg-surface p-4">
                      {Object.entries(dadosCategorias).map(([nome, valor], index) => {
                        const cor = CORES_CATEGORIAS[index % CORES_CATEGORIAS.length];
                        const porcentagem = totalGasto > 0 ? ((valor / totalGasto) * 100).toFixed(1) : "0.0";
                        return (
                          <div key={nome} className="flex items-center justify-between text-sm">
                            <div className="flex items-center gap-2.5"><span className="h-3 w-3 shrink-0 rounded-full" style={{ backgroundColor: cor }}></span><span className="max-w-[140px] truncate font-medium text-ink">{nome}</span></div>
                            <div className="flex items-center gap-3"><span className="font-semibold text-ink">R$ {valor.toFixed(2)}</span><span className="min-w-[3.5rem] rounded bg-canvas px-1.5 py-0.5 text-center text-xs font-medium text-ink-muted">{porcentagem}%</span></div>
                          </div>
                        );
                      })}
                    </div>
                  </details>
                </>
              ) : (<p className="py-12 text-center text-xs text-ink-faint">Sem gastos neste período.</p>)}
            </div>

            <div className="rounded-2xl border border-edge bg-surface p-5 shadow-sm">
              <h3 className="mb-4 flex items-center gap-2 text-base font-bold text-ink"><CreditCard className="h-5 w-5 text-brand-600" /> Formas de Pagamento</h3>
              {Object.keys(dadosPagamentos).length > 0 ? (
                <>
                  <div className="flex h-48 w-full items-center justify-center lg:h-56"><Doughnut data={dataPagamentos} options={{ responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } } }} /></div>
                  <details className="group mt-5 overflow-hidden rounded-xl border border-edge bg-canvas">
                    <summary className="flex cursor-pointer list-none items-center justify-between p-3.5 text-sm font-semibold text-ink transition-colors hover:bg-edge/40 [&::-webkit-details-marker]:hidden">
                      Ver detalhamento e % <ChevronDown className="h-4 w-4 text-ink-faint transition-transform duration-300 group-open:rotate-180" />
                    </summary>
                    <div className="space-y-3.5 border-t border-edge bg-surface p-4">
                      {Object.entries(dadosPagamentos).map(([nome, valor], index) => {
                        const cor = CORES_PAGAMENTOS[index % CORES_PAGAMENTOS.length];
                        const porcentagem = totalGasto > 0 ? ((valor / totalGasto) * 100).toFixed(1) : "0.0";
                        return (
                          <div key={nome} className="flex items-center justify-between text-sm">
                            <div className="flex items-center gap-2.5"><span className="h-3 w-3 shrink-0 rounded-full" style={{ backgroundColor: cor }}></span><span className="max-w-[140px] truncate font-medium text-ink">{nome}</span></div>
                            <div className="flex items-center gap-3"><span className="font-semibold text-ink">R$ {valor.toFixed(2)}</span><span className="min-w-[3.5rem] rounded bg-canvas px-1.5 py-0.5 text-center text-xs font-medium text-ink-muted">{porcentagem}%</span></div>
                          </div>
                        );
                      })}
                    </div>
                  </details>
                </>
              ) : (<p className="py-12 text-center text-xs text-ink-faint">Sem dados de pagamento.</p>)}
            </div>

            <div className="rounded-2xl border border-edge bg-surface p-5 shadow-sm lg:col-span-2">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-base font-bold text-ink flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-brand-600" /> Tendência de Pagamentos
                </h3>
                <div className="relative">
                  <button onClick={() => setDropdownPagamentosAberto(!dropdownPagamentosAberto)} className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-wider bg-canvas border border-edge rounded-lg px-3 py-2 text-ink-muted hover:bg-edge/50 transition-colors">
                    Filtrar Meios <ChevronDown className={`w-3 h-3 transition-transform ${dropdownPagamentosAberto ? 'rotate-180' : ''}`} />
                  </button>
                  {dropdownPagamentosAberto && (
                    <div className="absolute right-0 mt-2 w-52 bg-surface border border-edge shadow-xl rounded-xl z-20 p-2 space-y-1 animate-in fade-in zoom-in-95 duration-200">
                      <p className="text-[10px] font-bold text-ink-faint uppercase tracking-wider px-2 pb-1 mb-1 border-b border-edge/50">Exibir no gráfico:</p>
                      {["Crédito", "Débito", "Pix", "Dinheiro", "Vale Alimentação", "Vale Refeição"].map(pag => (
                        <label key={pag} className="flex items-center gap-2.5 p-2 hover:bg-canvas rounded-lg cursor-pointer text-sm font-medium text-ink transition-colors">
                          <input type="checkbox" checked={pagamentosSelecionados.includes(pag)} onChange={() => { if (pagamentosSelecionados.includes(pag)) { setPagamentosSelecionados(prev => prev.filter(p => p !== pag)); } else { setPagamentosSelecionados(prev => [...prev, pag]); } }} className="w-4 h-4 rounded border-edge text-brand-600 focus:ring-brand-500 cursor-pointer" />
                          {pag}
                        </label>
                      ))}
                    </div>
                  )}
                </div>
              </div>
              {pagamentosSelecionados.length === 0 ? (
                <div className="w-full h-52 flex flex-col items-center justify-center bg-canvas/70 border-2 border-dashed border-edge rounded-xl">
                  <Filter className="w-8 h-8 text-ink-faint mb-2" />
                  <p className="text-xs text-ink-muted font-medium text-center leading-relaxed">Nenhum método selecionado.<br /><span className="text-brand-600 font-semibold cursor-pointer hover:underline" onClick={() => setDropdownPagamentosAberto(true)}>Abra o filtro</span> e escolha os pagamentos.</p>
                </div>
              ) : (
                <div className="w-full h-52 animate-in fade-in duration-500 lg:h-64">
                  <Line data={dataLinhaPagamentos} options={{ responsive: true, maintainAspectRatio: false, plugins: { legend: { display: true, position: 'bottom', labels: { boxWidth: 12, usePointStyle: true, font: { size: 11, family: 'sans-serif' } } } }, scales: { y: { beginAtZero: true, ticks: { font: { size: 10 } }, grid: { color: '#eef1f4' } }, x: { ticks: { font: { size: 10 } }, grid: { display: false } } } }} />
                </div>
              )}
            </div>

            <div className="rounded-2xl border border-edge bg-surface p-5 shadow-sm lg:col-span-2">
              <div className="mb-4 flex items-center justify-between">
                <h3 className="text-base font-bold text-ink">Histórico de Gastos</h3>
                <div className="flex rounded-lg border border-edge bg-canvas p-1">
                  <button onClick={() => setVisaoHistorico("diario")} className={`rounded-md px-3 py-1 text-[11px] font-semibold transition-colors ${visaoHistorico === "diario" ? "bg-surface text-brand-700 shadow-sm" : "text-ink-muted hover:text-ink"}`}>Diário</button>
                  <button onClick={() => setVisaoHistorico("mensal")} className={`rounded-md px-3 py-1 text-[11px] font-semibold transition-colors ${visaoHistorico === "mensal" ? "bg-surface text-brand-700 shadow-sm" : "text-ink-muted hover:text-ink"}`}>Mensal</button>
                </div>
              </div>

              {visaoHistorico === "diario" ? (
                Object.keys(dadosDias).length > 0 ? (
                  <div className="h-52 w-full lg:h-72"><Bar data={dataBarras} options={{ responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } }, scales: { y: { ticks: { font: { size: 10 } }, grid: { color: '#eef1f4' } }, x: { ticks: { font: { size: 10 } }, grid: { display: false } } } }} /></div>
                ) : (<p className="py-12 text-center text-xs text-ink-faint">Sem histórico neste período.</p>)
              ) : (
                Object.keys(dadosMeses).length > 0 ? (
                  <div className="h-52 w-full lg:h-72"><Line data={dataLinha} options={{ responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } }, scales: { y: { ticks: { font: { size: 10 } }, grid: { color: '#eef1f4' } }, x: { ticks: { font: { size: 10 } }, grid: { display: false } } } }} /></div>
                ) : (<p className="py-12 text-center text-xs text-ink-faint">Sem histórico mensal.</p>)
              )}
            </div>
          </div>
        )}

        {/* ABA ORÇAMENTO */}
        {abaAtual === "orcamento" && (
          <div className="rounded-2xl border border-edge bg-surface p-5 shadow-sm sm:p-6">
            <div className="mb-5 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h3 className="text-base font-bold text-ink">Limites de Gasto</h3>
                <p className="mt-0.5 text-xs text-ink-muted sm:text-sm">Controle seu teto de gastos por categoria.</p>
              </div>
              <div className="flex rounded-lg border border-edge bg-canvas p-1">
                <button onClick={() => setTipoOrcamento("mensal")} className={`rounded-md px-4 py-1.5 text-xs font-semibold transition-colors ${tipoOrcamento === "mensal" ? "bg-surface text-brand-700 shadow-sm" : "text-ink-muted hover:text-ink"}`}>Mensal</button>
                <button onClick={() => setTipoOrcamento("anual")} className={`rounded-md px-4 py-1.5 text-xs font-semibold transition-colors ${tipoOrcamento === "anual" ? "bg-surface text-brand-700 shadow-sm" : "text-ink-muted hover:text-ink"}`}>Anual</button>
              </div>
            </div>

            <div className="grid gap-4 lg:grid-cols-2">
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
                  <div key={cat} className="space-y-2 rounded-xl border border-edge bg-canvas p-4">
                    <div className="flex items-center justify-between text-sm font-medium">
                      <span className="text-ink">{cat}</span>

                      {categoriaEditandoLimite === cat ? (
                        <form onSubmit={(e) => salvarLimiteCategoria(e, cat)} className="flex items-center gap-1.5">
                          <input
                            required
                            type="number"
                            placeholder="R$"
                            value={valorNovoLimite}
                            onChange={(e) => setValorNovoLimite(e.target.value)}
                            className="w-20 rounded-md border border-edge bg-surface px-1.5 py-1 text-xs focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
                          />
                          <button type="submit" disabled={salvandoLimite} className="rounded-md bg-brand-600 p-1.5 text-white hover:bg-brand-700">
                            {salvandoLimite ? <Loader2 className="h-3 w-3 animate-spin" /> : <Save className="h-3 w-3" />}
                          </button>
                          <button type="button" onClick={() => setCategoriaEditandoLimite(null)} className="rounded-md bg-edge p-1.5 text-ink-muted hover:bg-edge/70">
                            <X className="h-3 w-3" />
                          </button>

                          {limiteBase && (
                            <button type="button" onClick={() => deletarLimiteCategoria(cat)} className="ml-2 rounded-md bg-red-100 p-1.5 text-red-600 hover:bg-red-200">
                              <Trash2 className="h-3 w-3" />
                            </button>
                          )}
                        </form>
                      ) : (
                        <div className="flex items-center gap-1.5 text-xs">
                          {limiteDefinido ? (
                            <>
                              <span className="font-bold text-ink">Limite: R$ {limiteDefinido.toFixed(0)}</span>
                              <button onClick={() => { setCategoriaEditandoLimite(cat); setValorNovoLimite(limiteBase?.toString() || ""); }} className="text-ink-faint hover:text-brand-600">
                                <Pencil className="h-3 w-3" />
                              </button>
                            </>
                          ) : (
                            <button onClick={() => setCategoriaEditandoLimite(cat)} className="font-semibold text-brand-700 hover:underline">
                              + Definir Teto
                            </button>
                          )}
                        </div>
                      )}
                    </div>

                    {limiteDefinido && (
                      <div className="space-y-1">
                        <div className="h-2.5 w-full overflow-hidden rounded-full bg-edge">
                          <div className={`h-2.5 rounded-full ${corDaBarra} transition-all duration-500`} style={{ width: `${Math.min(porcentagemUso, 100)}%` }}></div>
                        </div>
                        <div className="flex justify-between text-[11px] font-medium text-ink-muted">
                          <span>Gasto: R$ {jaGasto.toFixed(2)}</span>
                          <span className={porcentagemUso >= 100 ? "font-bold text-red-600" : ""}>{porcentagemUso.toFixed(1)}%</span>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ABA GESTÃO DE CARTÕES */}
        {abaAtual === "cartao" && (
          <div className="space-y-6">

            <div className="flex items-center gap-3 overflow-x-auto pb-2 scrollbar-hide">
              {cartoes.map(c => (
                <button
                  key={c.id}
                  onClick={() => setCartaoSelecionado(c.id)}
                  className={`flex shrink-0 items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold transition-all border ${cartaoSelecionado === c.id ? 'border-brand-600 bg-brand-50 text-brand-700 shadow-sm' : 'border-edge bg-surface text-ink hover:bg-canvas'}`}
                >
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: c.cor }}></div>
                  {c.nome}
                </button>
              ))}
              <button onClick={() => setModalCartaoAberto(true)} className="flex shrink-0 items-center gap-1 px-4 py-2.5 rounded-xl border border-dashed border-ink-faint bg-transparent text-sm font-semibold text-ink-muted hover:text-ink hover:border-edge transition-colors">
                <Plus className="w-4 h-4" /> Novo Cartão
              </button>
            </div>

            {cartoes.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 px-4 border-2 border-dashed border-edge rounded-3xl bg-surface/50">
                <CreditCard className="w-16 h-16 text-ink-faint mb-4" />
                <h3 className="text-xl font-bold text-ink mb-2">Nenhum cartão cadastrado</h3>
                <p className="text-sm text-ink-muted text-center max-w-md mb-6">Cadastre seu primeiro cartão de crédito para acompanhar faturas, projetar limites e centralizar todas as suas compras parceladas.</p>
                <button onClick={() => setModalCartaoAberto(true)} className="bg-brand-600 hover:bg-brand-700 text-white px-6 py-3 rounded-xl font-bold transition-colors">
                  + Cadastrar Cartão
                </button>
              </div>
            ) : (
              <div className="grid gap-6 lg:grid-cols-2">
                <div className="space-y-6">

                  <div className="rounded-3xl p-7 text-white shadow-xl relative overflow-hidden transition-all duration-500" style={{ backgroundColor: cartaoAtivo?.cor || '#0e5c3e' }}>
                    <div className="flex justify-between items-center mb-8">
                      <div className="flex items-center gap-2 text-[11px] font-bold tracking-wider text-white/80 uppercase">
                        <CreditCard className="w-4 h-4" /> Fatura Atual • {diasFaltamFechar === 0 ? "Fecha Hoje" : `Fecha em ${diasFaltamFechar} dias`}
                      </div>
                      <button onClick={deletarCartaoAtual} title="Excluir Cartão" className="text-white/60 hover:text-red-300 transition-colors p-2 rounded-full hover:bg-white/10">
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>
                    <div className="mb-10">
                      <p className="text-sm text-white/80 mb-1">Total a Pagar</p>
                      <h3 className="text-4xl sm:text-5xl font-extrabold tracking-tight">R$ {faturaAtualValor.toFixed(2)}</h3>
                    </div>
                    <div className="flex justify-between items-end border-t border-white/20 pt-5">
                      <div>
                        <p className="text-xs text-white/80 mb-0.5">Limite Disponível</p>
                        <p className="text-lg font-semibold text-white">R$ {limiteDisponivelCartao.toFixed(2)}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-white/80 mb-0.5">Vencimento</p>
                        <p className="text-lg font-semibold text-white">{rotuloVencimento}</p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-surface rounded-2xl p-6 border border-edge shadow-sm">
                    <div className="flex justify-between items-center mb-6">
                      <h4 className="text-lg font-bold text-ink">Projeção 6 Meses</h4>
                      <BarChart3 className="w-5 h-5 text-ink-faint" />
                    </div>
                    <div className="h-40 w-full">
                      <Bar
                        data={{
                          labels: labelsProjecaoCartao,
                          datasets: [{
                            data: valoresProjecaoCartao,
                            backgroundColor: '#e5e7eb',
                            hoverBackgroundColor: cartaoAtivo?.cor || '#047857',
                            borderRadius: 4
                          }]
                        }}
                        options={{
                          responsive: true, maintainAspectRatio: false,
                          plugins: { legend: { display: false }, tooltip: { enabled: true, callbacks: { label: (context) => `R$ ${(context.parsed.y || 0).toFixed(2)}` } } },
                          scales: { x: { grid: { display: false }, border: { display: false }, ticks: { font: { size: 11 }, color: '#6b7280' } }, y: { display: false } }
                        }}
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-6">

                  <form onSubmit={lancarCompraCartao} className="bg-surface rounded-2xl p-6 border border-edge shadow-sm">
                    <h4 className="text-base font-bold text-ink flex items-center gap-2 mb-4">
                      <ShoppingCart className="w-5 h-5 text-brand-600" /> Lançar Compra
                    </h4>
                    <div className="border-t border-edge pt-4 space-y-4">
                      <div className="flex flex-wrap sm:flex-nowrap gap-3">
                        <div className="w-full sm:flex-1">
                          <label className="block text-xs font-semibold text-ink mb-1.5">Valor Total (R$)</label>
                          <input required value={cartaoValor} onChange={e => setCartaoValor(e.target.value)} type="number" step="0.01" placeholder="0,00" className="w-full rounded-xl border border-edge bg-canvas p-2.5 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500" />
                        </div>
                        <div className="w-[30%] sm:w-24">
                          <label className="block text-xs font-semibold text-ink mb-1.5">Parcelas</label>
                          <input
                            required
                            disabled={isFixo}
                            value={cartaoParcelas}
                            onChange={e => setCartaoParcelas(e.target.value)}
                            type="number"
                            min="1"
                            className="w-full rounded-xl border border-edge bg-canvas p-2.5 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500 disabled:opacity-50"
                          />
                        </div>
                        <div className="flex-1 sm:w-36">
                          <label className="block text-xs font-semibold text-ink mb-1.5">Mês Inicial</label>
                          <input
                            required
                            value={cartaoMesInicio}
                            onChange={e => setCartaoMesInicio(e.target.value)}
                            type="month"
                            className="w-full rounded-xl border border-edge bg-canvas p-2.5 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
                          />
                        </div>
                      </div>

                      {/* Checkbox Fixa e Preview de Valor */}
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-canvas p-3 rounded-xl border border-edge">
                        <label className="flex items-center gap-2 text-sm text-ink font-medium cursor-pointer">
                          <input
                            type="checkbox"
                            checked={isFixo}
                            onChange={e => setIsFixo(e.target.checked)}
                            className="w-4 h-4 rounded border-edge text-brand-600 focus:ring-brand-500"
                          />
                          Compra Fixa Mensal
                        </label>
                        {cartaoValor && (
                          <span className="text-xs font-bold text-brand-700 bg-brand-50 px-2.5 py-1.5 rounded-lg border border-brand-100">
                            Será cobrado: R$ {(isFixo ? parseFloat(cartaoValor) : (parseFloat(cartaoValor) / (parseInt(cartaoParcelas) || 1))).toFixed(2)} / mês
                          </span>
                        )}
                      </div>

                      <button type="submit" disabled={salvandoCartao} className="w-full bg-brand-600 hover:bg-brand-700 disabled:opacity-50 text-white font-bold text-sm py-3 rounded-xl transition-colors flex justify-center items-center gap-2 mt-2">
                        {salvandoCartao ? <Loader2 className="w-4 h-4 animate-spin" /> : "✓ Adicionar à Fatura"}
                      </button>
                    </div>
                  </form>

                  <div className="bg-surface rounded-2xl p-0 border border-edge shadow-sm overflow-hidden">
                    <div className="p-5 flex justify-between items-center border-b border-edge bg-canvas/30">
                      <h4 className="text-base font-bold text-ink flex items-center gap-2">
                        <Calendar className="w-5 h-5 text-ink-muted" /> Próximas Parcelas
                      </h4>
                      <div className="flex rounded-lg border border-brand-200 bg-brand-50 p-1">
                        <button onClick={() => setFiltroParcelas("todos")} className={`px-3 py-1 text-xs font-bold rounded-md shadow-sm transition-colors ${filtroParcelas === "todos" ? "bg-white text-brand-700" : "text-brand-600/70 hover:text-brand-700"}`}>Todos</button>
                        <button onClick={() => setFiltroParcelas("fixos")} className={`px-3 py-1 text-xs font-bold rounded-md shadow-sm transition-colors ${filtroParcelas === "fixos" ? "bg-white text-brand-700" : "text-brand-600/70 hover:text-brand-700"}`}>Apenas Fixos</button>
                      </div>
                    </div>
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-sm">
                        <thead className="bg-canvas border-b border-edge text-xs font-semibold text-ink-faint">
                          <tr>
                            <th className="px-5 py-3">Estabelecimento</th>
                            <th className="px-5 py-3 text-right">Valor</th>
                            <th className="px-5 py-3 text-center">Mês</th>
                            <th className="px-5 py-3 text-right">Ações</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-edge/50">
                          {parcelasExibidas.length > 0 ? (
                            parcelasExibidas.map((parcela) => {
                              const [ano, mes] = parcela.data_compra.split("-");
                              return (
                                <tr key={parcela.id} className="hover:bg-canvas/50">
                                  <td className="px-5 py-4 flex items-center gap-3 font-medium text-ink">
                                    <div className="w-8 h-8 rounded-full bg-brand-50 text-brand-600 flex shrink-0 items-center justify-center"><ShoppingCart className="w-4 h-4" /></div>
                                    <span className="truncate max-w-[100px] sm:max-w-[150px] block" title={parcela.estabelecimento}>{parcela.estabelecimento}</span>
                                  </td>
                                  <td className="px-5 py-4 text-right font-bold text-ink">R$ {parcela.valor.toFixed(2)}</td>
                                  <td className="px-5 py-4 text-center text-xs text-ink-muted">{mes}/{ano.slice(-2)}</td>

                                  {/* Botões de Ação Específicos para a Parcela (Edita Fatura) */}
                                  <td className="px-5 py-4 text-right">
                                    <div className="flex justify-end gap-1.5">
                                      <button type="button" onClick={() => setGastoEditando(parcela)} className="rounded p-1.5 text-brand-600 transition-colors hover:bg-brand-50" title="Editar valor da parcela">
                                        <Pencil className="h-4 w-4" />
                                      </button>
                                      <button type="button" onClick={() => deletarGasto(parcela)} className="rounded p-1.5 text-red-500 transition-colors hover:bg-red-50" title="Excluir compra da fatura">
                                        <Trash2 className="h-4 w-4" />
                                      </button>
                                    </div>
                                  </td>
                                </tr>
                              );
                            })
                          ) : (
                            <tr><td colSpan={4} className="px-5 py-8 text-center text-ink-muted">Nenhuma fatura encontrada.</td></tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                    {parcelasFuturas.length > 4 && (
                      <div className="bg-canvas border-t border-edge p-3 text-center">
                        <button onClick={() => setMostrarTodasParcelas(!mostrarTodasParcelas)} className="text-xs font-bold text-brand-700 hover:underline">
                          {mostrarTodasParcelas ? "Ocultar parcelas" : `Ver todas as ${parcelasFuturas.length} parcelas futuras`}
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ABA HISTÓRICO */}
        {abaAtual === "tabela" && (
          <div className="space-y-4">
            <div className="space-y-3 rounded-2xl border border-edge bg-surface p-4 shadow-sm sm:p-5">
              <h3 className="flex items-center gap-2 text-sm font-bold text-ink"><Filter className="h-4 w-4 text-brand-600" /> Filtros da Tabela</h3>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
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

            <div className="mb-8 overflow-hidden rounded-2xl border border-edge bg-surface shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm text-ink-muted">
                  <thead className="border-b border-edge bg-canvas text-xs uppercase text-ink-faint">
                    <tr>
                      <th className="whitespace-nowrap px-4 py-3">Data</th>
                      <th className="whitespace-nowrap px-4 py-3">Estabelecimento</th>
                      <th className="whitespace-nowrap px-4 py-3">Detalhes</th>
                      <th className="whitespace-nowrap px-4 py-3 text-right">Valor e Ações</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-edge/60">
                    {tabelaFiltrada.length > 0 ? (
                      tabelaFiltrada.map(g => (
                        <tr key={g.id} className="transition-colors hover:bg-canvas/60">
                          <td className="whitespace-nowrap px-4 py-3.5 font-medium text-ink">{g.data_compra ? g.data_compra.split('-').reverse().join('/') : 'S/ Data'}</td>
                          <td className="max-w-[120px] truncate px-4 py-3.5 sm:max-w-[240px]" title={g.estabelecimento}>{g.estabelecimento}</td>
                          <td className="space-y-1.5 px-4 py-3.5 sm:space-y-0 sm:space-x-1.5">
                            <span className="inline-block max-w-max truncate rounded-full bg-brand-50 px-2 py-0.5 text-[10px] font-semibold text-brand-700">{g.categoria}</span>
                            <span className="inline-block max-w-max truncate rounded-full bg-sky-50 px-2 py-0.5 text-[10px] font-semibold text-sky-700">{g.forma_pagamento}</span>
                          </td>
                          <td className="whitespace-nowrap px-4 py-3.5 text-right">
                            <span className="mb-1.5 block font-bold text-ink">R$ {g.valor.toFixed(2)}</span>
                            <div className="flex justify-end gap-1.5">
                              <button onClick={() => setGastoEditando(g)} className="rounded p-1.5 text-brand-600 transition-colors hover:bg-brand-50"><Pencil className="h-4 w-4" /></button>
                              <button onClick={() => deletarGasto(g.id)} className="rounded p-1.5 text-red-500 transition-colors hover:bg-red-50"><Trash2 className="h-4 w-4" /></button>
                            </div>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr><td colSpan={4} className="px-4 py-12 text-center text-ink-faint">Nenhum gasto encontrado.</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

      </main>

      {/* MODAL DE EDIÇÃO DE GASTO */}
      {gastoEditando && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md overflow-hidden rounded-2xl bg-surface shadow-xl">
            <div className="flex items-center justify-between border-b border-edge bg-canvas p-4">
              <h3 className="text-lg font-bold text-ink">Editar Gasto</h3>
              <button onClick={() => setGastoEditando(null)} className="rounded-full bg-edge p-1.5 text-ink-muted transition-colors hover:bg-edge/70 hover:text-ink"><X className="h-5 w-5" /></button>
            </div>
            <form onSubmit={salvarEdicao} className="space-y-4 p-5">
              <div>
                <label className="mb-1 block text-sm font-medium text-ink">Estabelecimento</label>
                <input required value={gastoEditando.estabelecimento} onChange={e => setGastoEditando({ ...gastoEditando, estabelecimento: e.target.value })} type="text" className="w-full rounded-xl border border-edge bg-surface p-2.5 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/25" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="mb-1 block text-sm font-medium text-ink">Valor (R$)</label>
                  <input required value={gastoEditando.valor} onChange={e => setGastoEditando({ ...gastoEditando, valor: e.target.value })} type="number" step="0.01" className="w-full rounded-xl border border-edge bg-surface p-2.5 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/25" />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-ink">Data</label>
                  <input required value={gastoEditando.data_compra || ""} onChange={e => setGastoEditando({ ...gastoEditando, data_compra: e.target.value })} type="date" className="w-full rounded-xl border border-edge bg-surface p-2.5 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/25" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="mb-1 block text-sm font-medium text-ink">Categoria</label>
                  <select value={gastoEditando.categoria} onChange={e => setGastoEditando({ ...gastoEditando, categoria: e.target.value })} className="w-full rounded-xl border border-edge bg-surface p-2.5 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/25">
                    {CATEGORIAS.map((cat) => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-ink">Pagamento</label>
                  <select value={gastoEditando.forma_pagamento} onChange={e => setGastoEditando({ ...gastoEditando, forma_pagamento: e.target.value })} className="w-full rounded-xl border border-edge bg-surface p-2.5 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/25">
                    {FORMAS_PAGAMENTO.map((fp) => (
                      <option key={fp} value={fp}>{fp}</option>
                    ))}
                  </select>
                </div>
              </div>
              <button type="submit" disabled={loadingEdit} className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-brand-600 p-3 text-sm font-semibold text-white transition-colors hover:bg-brand-700 disabled:opacity-60">
                {loadingEdit ? <Loader2 className="h-5 w-5 animate-spin" /> : <Save className="h-5 w-5" />} Salvar Alterações
              </button>
            </form>
          </div>
        </div>
      )}

      {/* MODAL CADASTRO DE CARTÃO */}
      {modalCartaoAberto && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
          <div className="w-full max-w-sm overflow-hidden rounded-2xl bg-surface shadow-xl">
            <div className="flex items-center justify-between border-b border-edge bg-canvas p-4">
              <h3 className="text-lg font-bold text-ink flex items-center gap-2"><CreditCard className="w-5 h-5 text-brand-600" /> Cadastrar Cartão</h3>
              <button onClick={() => setModalCartaoAberto(false)} className="rounded-full bg-edge p-1.5 text-ink-muted hover:bg-edge/70 hover:text-ink"><X className="h-5 w-5" /></button>
            </div>
            <form onSubmit={cadastrarCartao} className="space-y-4 p-5">
              <div>
                <label className="mb-1 block text-xs font-semibold text-ink">Nome do Cartão (Ex: Nubank, Itaú)</label>
                <input required value={novoCartao.nome} onChange={e => setNovoCartao({ ...novoCartao, nome: e.target.value })} type="text" className="w-full rounded-xl border border-edge bg-surface p-2.5 text-sm focus:border-brand-500 focus:ring-1 focus:ring-brand-500" />
              </div>
              <div>
                <label className="mb-1 block text-xs font-semibold text-ink">Limite Total (R$)</label>
                <input required value={novoCartao.limite} onChange={e => setNovoCartao({ ...novoCartao, limite: e.target.value })} type="number" step="0.01" className="w-full rounded-xl border border-edge bg-surface p-2.5 text-sm focus:border-brand-500 focus:ring-1 focus:ring-brand-500" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="mb-1 block text-xs font-semibold text-ink">Dia do Fechamento</label>
                  <input required value={novoCartao.diaFechamento} onChange={e => setNovoCartao({ ...novoCartao, diaFechamento: e.target.value })} type="number" min="1" max="31" placeholder="Ex: 5" className="w-full rounded-xl border border-edge bg-surface p-2.5 text-sm focus:border-brand-500 focus:ring-1 focus:ring-brand-500" />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-semibold text-ink">Dia do Vencimento</label>
                  <input required value={novoCartao.diaVencimento} onChange={e => setNovoCartao({ ...novoCartao, diaVencimento: e.target.value })} type="number" min="1" max="31" placeholder="Ex: 12" className="w-full rounded-xl border border-edge bg-surface p-2.5 text-sm focus:border-brand-500 focus:ring-1 focus:ring-brand-500" />
                </div>
              </div>
              <div>
                <label className="mb-2 block text-xs font-semibold text-ink">Cor do Cartão</label>
                <div className="flex gap-3">
                  {['#8B5CF6', '#3B82F6', '#10B981', '#F59E0B', '#F43F5E', '#1F2937'].map(color => (
                    <button key={color} type="button" onClick={() => setNovoCartao({ ...novoCartao, cor: color })} className={`w-8 h-8 rounded-full border-2 ${novoCartao.cor === color ? 'border-brand-600 scale-110' : 'border-transparent hover:scale-105'} transition-transform`} style={{ backgroundColor: color }} />
                  ))}
                </div>
              </div>
              <button type="submit" className="mt-4 w-full bg-brand-600 hover:bg-brand-700 text-white font-bold py-3 rounded-xl transition-colors">
                Salvar Cartão
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
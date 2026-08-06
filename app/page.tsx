"use client";

import { useState, useEffect } from "react";
import { Camera, Upload, Loader2, CheckCircle, Save, Image as ImageIcon, Pencil, ScanLine, Sparkles, ShieldCheck, PieChart, AlertTriangle, X } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { CATEGORIAS, FORMAS_PAGAMENTO, ROTULOS_CATEGORIAS } from "@/lib/constantes";
import AppHeader from "@/components/AppHeader";
import AuthCard from "@/components/AuthCard";

export default function Home() {
  const [autenticado, setAutenticado] = useState<boolean | null>(null);
  const [usuarioAtual, setUsuarioAtual] = useState<any>(null);

  // Campos de login e cadastro
  const [emailInput, setEmailInput] = useState("");
  const [senhaInput, setSenhaInput] = useState("");
  const [modoCadastro, setModoCadastro] = useState(false);

  const [modoManual, setModoManual] = useState(false);

  const [imagem, setImagem] = useState<File | null>(null);
  const [contexto, setContexto] = useState("");

  const [formManual, setFormManual] = useState({
    estabelecimento: "",
    valor: "",
    data_compra: new Date().toISOString().split("T")[0],
    categoria: "Alimentação",
    forma_pagamento: "Débito"
  });

  const [loading, setLoading] = useState(false);
  const [salvando, setSalvando] = useState(false);
  const [resultado, setResultado] = useState<any>(null);

  // Aviso customizado de compra duplicada
  const [modalDuplicataAberto, setModalDuplicataAberto] = useState(false);
  const [verificandoDuplicata, setVerificandoDuplicata] = useState(false);

  // Escuta e gerencia a sessão de login ativa do usuário
  useEffect(() => {
    const verificarSessao = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        setUsuarioAtual(session.user);
        setAutenticado(true);
      } else {
        setAutenticado(false);
      }
    };
    verificarSessao();

    const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        setUsuarioAtual(session.user);
        setAutenticado(true);
      } else {
        setUsuarioAtual(null);
        setAutenticado(false);
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
        alert("Conta criada com sucesso! Você já pode fazer login.");
        setModoCadastro(false);
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email: emailInput, password: senhaInput });
        if (error) throw error;
      }
    } catch (error: any) {
      alert("⚠️ Erro na autenticação: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  const fazerLogout = async () => {
    await supabase.auth.signOut();
  };

  const comprimirImagem = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      if (file.size === 0) {
        return reject(new Error("A câmera retornou uma imagem vazia. Tente afastar um pouco a câmera ou usar uma foto da galeria."));
      }

      const img = new Image();
      const objectUrl = URL.createObjectURL(file);
      img.src = objectUrl;

      img.onload = () => {
        URL.revokeObjectURL(objectUrl);

        const canvas = document.createElement("canvas");
        const MAX_WIDTH = 1200;
        const MAX_HEIGHT = 1200;
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > MAX_WIDTH) {
            height *= MAX_WIDTH / width;
            width = MAX_WIDTH;
          }
        } else {
          if (height > MAX_HEIGHT) {
            width *= MAX_HEIGHT / height;
            height = MAX_HEIGHT;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");

        if (!ctx) {
          return reject(new Error("O navegador não suportou o processamento da imagem."));
        }

        ctx.drawImage(img, 0, 0, width, height);

        const dataUrl = canvas.toDataURL("image/jpeg", 0.7);
        const base64String = dataUrl.split(",")[1];

        if (!base64String || base64String === "") {
          reject(new Error("Falha na conversão da imagem no dispositivo."));
        } else {
          resolve(base64String);
        }
      };

      img.onerror = () => reject(new Error("Não foi possível carregar a imagem no navegador. Verifique se não é um formato HEIC não suportado."));
    });
  };

  const handleSubmitIA = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!imagem) return alert("Por favor, selecione uma imagem primeiro!");

    setLoading(true);
    try {
      const base64 = await comprimirImagem(imagem);

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
    } catch (error: any) {
      alert("⚠️ Erro no celular: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitManual = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formManual.estabelecimento || !formManual.valor) {
      return alert("Preencha pelo menos o estabelecimento e o valor!");
    }

    setResultado({
      estabelecimento: formManual.estabelecimento,
      valor: parseFloat(formManual.valor),
      data_compra: formManual.data_compra,
      categoria: formManual.categoria,
      forma_pagamento: formManual.forma_pagamento
    });
  };

  const lidarComMudancaManual = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormManual(prev => ({ ...prev, [name]: value }));
  };

  const executarSalvamento = async () => {
    if (!usuarioAtual) return alert("Erro: Usuário não identificado para salvar o registro.");

    setSalvando(true);
    try {
      const dataValida = resultado.data_compra && resultado.data_compra !== "Não disponível"
        ? resultado.data_compra
        : null;

      // Injeta obrigatoriamente o UID do usuário ativo no user_id da tabela
      const { error } = await supabase
        .from('gastos')
        .insert([
          {
            estabelecimento: resultado.estabelecimento,
            valor: parseFloat(resultado.valor),
            data_compra: dataValida,
            categoria: resultado.categoria,
            forma_pagamento: resultado.forma_pagamento,
            contexto: contexto || "Inserção Manual",
            user_id: usuarioAtual.id
          }
        ]);

      if (error) throw error;

      alert("🎉 Gasto salvo com sucesso!");

      setModalDuplicataAberto(false);
      setResultado(null);
      setImagem(null);
      setContexto("");
      setFormManual({
        estabelecimento: "",
        valor: "",
        data_compra: new Date().toISOString().split("T")[0],
        categoria: "Alimentação",
        forma_pagamento: "Débito"
      });

    } catch (error: any) {
      alert("Erro ao salvar no banco: " + error.message);
    } finally {
      setSalvando(false);
    }
  };

  // 🔍 Verifica se já existe um gasto idêntico (mesma descrição, estabelecimento, data e valor)
  // antes de salvar. Se encontrar, exibe um aviso customizado pedindo confirmação.
  const confirmarSalvamento = async () => {
    if (!usuarioAtual) return alert("Erro: Usuário não identificado para salvar o registro.");

    setVerificandoDuplicata(true);
    try {
      const dataValida = resultado.data_compra && resultado.data_compra !== "Não disponível"
        ? resultado.data_compra
        : null;
      const descricaoAtual = (contexto || "Inserção Manual").trim();
      const estabelecimentoAtual = (resultado.estabelecimento || "").trim();
      const valorAtual = parseFloat(resultado.valor);

      let query = supabase
        .from("gastos")
        .select("id")
        .eq("user_id", usuarioAtual.id)
        .eq("estabelecimento", estabelecimentoAtual)
        .eq("valor", valorAtual)
        .eq("contexto", descricaoAtual);

      query = dataValida ? query.eq("data_compra", dataValida) : query.is("data_compra", null);

      const { data, error } = await query.limit(1);
      if (error) throw error;

      if (data && data.length > 0) {
        setModalDuplicataAberto(true);
      } else {
        await executarSalvamento();
      }
    } catch (error: any) {
      alert("Erro ao verificar duplicidade: " + error.message);
    } finally {
      setVerificandoDuplicata(false);
    }
  };

  const inputClasses = "w-full rounded-xl border border-edge dark:border-slate-700 bg-surface dark:bg-slate-900 px-4 py-3 text-sm text-ink dark:text-slate-200 placeholder:text-ink-faint dark:placeholder:text-slate-500 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/25";
  const labelClasses = "mb-1.5 block text-sm font-medium text-ink dark:text-slate-300";

  if (autenticado === null) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-canvas dark:bg-slate-950">
        <Loader2 className="h-8 w-8 animate-spin text-brand-600" />
      </div>
    );
  }

  if (!autenticado) {
    return (
      <AuthCard
        modoCadastro={modoCadastro}
        setModoCadastro={setModoCadastro}
        email={emailInput}
        setEmail={setEmailInput}
        senha={senhaInput}
        setSenha={setSenhaInput}
        loading={loading}
        onSubmit={lidarComAutenticacao}
      />
    );
  }

  return (
    <div className="min-h-screen bg-canvas dark:bg-slate-950">
      <AppHeader email={usuarioAtual?.email} paginaAtiva="scanner" onLogout={fazerLogout} />

      <main className="mx-auto max-w-6xl px-4 py-6 sm:px-6 lg:py-10">
        <div className="grid gap-8 lg:grid-cols-5 lg:gap-12">

          {/* Painel lateral informativo — visível apenas no desktop */}
          <aside className="hidden lg:col-span-2 lg:block">
            <div className="sticky top-24 space-y-8">
              <div>
                <h1 className="text-3xl font-bold tracking-tight text-ink dark:text-white">
                  Registre um gasto
                </h1>
                <p className="mt-2 text-[15px] leading-relaxed text-ink-muted dark:text-slate-400">
                  Fotografe a nota fiscal e deixe a inteligência artificial extrair os
                  dados, ou digite as informações manualmente.
                </p>
              </div>

              <ul className="space-y-5">
                <li className="flex gap-3.5">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-50 dark:bg-brand-900/40 text-brand-700 dark:text-brand-400">
                    <ScanLine className="h-5 w-5" />
                  </span>
                  <div>
                    <p className="text-sm font-semibold text-ink dark:text-white">Leitura automática</p>
                    <p className="mt-0.5 text-sm text-ink-muted dark:text-slate-400">Estabelecimento, valor, data e categoria extraídos da foto da nota.</p>
                  </div>
                </li>
                <li className="flex gap-3.5">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-50 dark:bg-brand-900/40 text-brand-700 dark:text-brand-400">
                    <PieChart className="h-5 w-5" />
                  </span>
                  <div>
                    <p className="text-sm font-semibold text-ink dark:text-white">Painel completo</p>
                    <p className="mt-0.5 text-sm text-ink-muted dark:text-slate-400">Gráficos por categoria, forma de pagamento e evolução mensal.</p>
                  </div>
                </li>
                <li className="flex gap-3.5">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-50 dark:bg-brand-900/40 text-brand-700 dark:text-brand-400">
                    <ShieldCheck className="h-5 w-5" />
                  </span>
                  <div>
                    <p className="text-sm font-semibold text-ink dark:text-white">Dados protegidos</p>
                    <p className="mt-0.5 text-sm text-ink-muted dark:text-slate-400">Cada conta enxerga somente os próprios gastos e orçamentos.</p>
                  </div>
                </li>
              </ul>
            </div>
          </aside>

          {/* Cartão principal de registro */}
          <div className="lg:col-span-3">
            <div className="mb-5 lg:hidden">
              <h1 className="text-xl font-bold tracking-tight text-ink dark:text-white">Registre um gasto</h1>
              <p className="mt-1 text-sm text-ink-muted dark:text-slate-400">Escaneie a nota fiscal ou digite os dados.</p>
            </div>

            <div className="rounded-2xl border border-edge dark:border-slate-800 bg-surface dark:bg-slate-900 p-5 shadow-sm sm:p-7">
              {!resultado ? (
                <>
                  <div className="mb-6 flex rounded-xl bg-canvas dark:bg-slate-950 p-1.5">
                    <button
                      onClick={() => setModoManual(false)}
                      className={`flex flex-1 items-center justify-center gap-2 rounded-lg py-2.5 text-sm font-semibold transition-all ${!modoManual ? 'bg-surface dark:bg-slate-800 text-brand-700 dark:text-brand-400 shadow-sm' : 'text-ink-muted dark:text-slate-400 hover:text-ink dark:hover:text-slate-200'}`}
                    >
                      <Camera className="h-4 w-4" /> Escanear
                    </button>
                    <button
                      onClick={() => setModoManual(true)}
                      className={`flex flex-1 items-center justify-center gap-2 rounded-lg py-2.5 text-sm font-semibold transition-all ${modoManual ? 'bg-surface dark:bg-slate-800 text-brand-700 dark:text-brand-400 shadow-sm' : 'text-ink-muted dark:text-slate-400 hover:text-ink dark:hover:text-slate-200'}`}
                    >
                      <Pencil className="h-4 w-4" /> Digitar
                    </button>
                  </div>

                  {!modoManual ? (
                    <form onSubmit={handleSubmitIA} className="space-y-6">
                      <div>
                        <label className={labelClasses}>O que foi essa compra? (Opcional)</label>
                        <input
                          type="text"
                          placeholder="Ex: Almoço de domingo"
                          className={inputClasses}
                          value={contexto}
                          onChange={(e) => setContexto(e.target.value)}
                        />
                      </div>

                      <div>
                        <label className={labelClasses}>Anexar Nota Fiscal</label>
                        {imagem ? (
                          <div className="flex items-center justify-center gap-2 rounded-xl border border-brand-200 dark:border-brand-800 bg-brand-50 dark:bg-brand-900/30 p-4 text-sm font-medium text-brand-800 dark:text-brand-300">
                            <CheckCircle className="h-5 w-5 shrink-0 text-brand-600 dark:text-brand-400" />
                            <span className="max-w-[200px] truncate sm:max-w-xs">{imagem.name}</span>
                            <button type="button" onClick={() => setImagem(null)} className="ml-2 text-xs font-semibold text-red-500 underline">Alterar</button>
                          </div>
                        ) : (
                          <div className="grid grid-cols-2 gap-3">
                            <label className="flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-edge dark:border-slate-700 bg-canvas dark:bg-slate-950 py-7 transition-colors hover:border-brand-300 dark:hover:border-brand-700 hover:bg-brand-50/50 dark:hover:bg-brand-900/20 sm:py-9">
                              <Camera className="mb-2 h-6 w-6 text-brand-600 dark:text-brand-400" />
                              <span className="text-xs font-semibold text-ink dark:text-slate-200">Tirar Foto</span>
                              <input type="file" accept="image/jpeg, image/png, image/jpg" capture="environment" className="hidden" onChange={(e) => setImagem(e.target.files?.[0] || null)} />
                            </label>
                            <label className="flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-edge dark:border-slate-700 bg-canvas dark:bg-slate-950 py-7 transition-colors hover:border-brand-300 dark:hover:border-brand-700 hover:bg-brand-50/50 dark:hover:bg-brand-900/20 sm:py-9">
                              <ImageIcon className="mb-2 h-6 w-6 text-brand-600 dark:text-brand-400" />
                              <span className="text-xs font-semibold text-ink dark:text-slate-200">Abrir Galeria</span>
                              <input type="file" accept="image/jpeg, image/png, image/jpg" className="hidden" onChange={(e) => setImagem(e.target.files?.[0] || null)} />
                            </label>
                          </div>
                        )}
                      </div>

                      <button type="submit" disabled={loading || !imagem} className="flex w-full items-center justify-center gap-2 rounded-xl bg-brand-600 p-4 text-sm font-semibold text-white transition-colors hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-50">
                        {loading ? <><Loader2 className="h-5 w-5 animate-spin" /> Analisando nota...</> : <><Upload className="h-5 w-5" /> Analisar Nota</>}
                      </button>
                    </form>
                  ) : (
                    <form onSubmit={handleSubmitManual} className="space-y-4">
                      <div>
                        <label className={labelClasses}>Estabelecimento *</label>
                        <input required name="estabelecimento" value={formManual.estabelecimento} onChange={lidarComMudancaManual} type="text" placeholder="Ex: Supermercado Extra" className={inputClasses} />
                      </div>

                      <div>
                        <label className={labelClasses}>Descrição (opcional)</label>
                        <input
                          type="text"
                          placeholder="Ex: Almoço de domingo"
                          className={inputClasses}
                          value={contexto}
                          onChange={(e) => setContexto(e.target.value)}
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className={labelClasses}>Valor (R$) *</label>
                          <input required name="valor" value={formManual.valor} onChange={lidarComMudancaManual} type="number" step="0.01" placeholder="0.00" className={inputClasses} />
                        </div>
                        <div>
                          <label className={labelClasses}>Data</label>
                          <input required name="data_compra" value={formManual.data_compra} onChange={lidarComMudancaManual} type="date" className={inputClasses} />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className={labelClasses}>Categoria</label>
                          <select name="categoria" value={formManual.categoria} onChange={lidarComMudancaManual} className={inputClasses}>
                            {CATEGORIAS.map((cat) => (
                              <option key={cat} value={cat}>{ROTULOS_CATEGORIAS[cat] || cat}</option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <label className={labelClasses}>Pagamento</label>
                          <select name="forma_pagamento" value={formManual.forma_pagamento} onChange={lidarComMudancaManual} className={inputClasses}>
                            {FORMAS_PAGAMENTO.map((fp) => (
                              <option key={fp} value={fp}>{fp}</option>
                            ))}
                          </select>
                        </div>
                      </div>

                      <button type="submit" className="mt-2 flex w-full items-center justify-center gap-2 rounded-xl bg-brand-600 p-4 text-sm font-semibold text-white transition-colors hover:bg-brand-700">
                        Avançar
                      </button>
                    </form>
                  )}
                </>
              ) : (
                <div className="space-y-5">
                  <div className="flex items-center gap-2.5">
                    <span className="flex h-9 w-9 items-center justify-center rounded-full bg-brand-50 dark:bg-brand-900/40 text-brand-600 dark:text-brand-400">
                      <CheckCircle className="h-5 w-5" />
                    </span>
                    <h2 className="text-lg font-bold text-ink dark:text-white">Resumo do Gasto</h2>
                  </div>

                  <dl className="divide-y divide-edge dark:divide-slate-800 rounded-xl border border-edge dark:border-slate-800 bg-canvas dark:bg-slate-950">
                    <div className="flex items-center justify-between gap-4 px-4 py-3">
                      <dt className="text-sm text-ink-muted dark:text-slate-400">Estabelecimento</dt>
                      <dd className="text-sm font-semibold text-ink dark:text-slate-200 text-right">{resultado.estabelecimento}</dd>
                    </div>
                    <div className="flex items-center justify-between gap-4 px-4 py-3">
                      <dt className="text-sm text-ink-muted dark:text-slate-400">Valor</dt>
                      <dd className="text-sm font-bold text-ink dark:text-white">R$ {Number(resultado.valor).toFixed(2)}</dd>
                    </div>
                    <div className="flex items-center justify-between gap-4 px-4 py-3">
                      <dt className="text-sm text-ink-muted dark:text-slate-400">Data</dt>
                      <dd className="text-sm font-semibold text-ink dark:text-slate-200">{resultado.data_compra}</dd>
                    </div>
                    <div className="flex items-center justify-between gap-4 px-4 py-3">
                      <dt className="text-sm text-ink-muted dark:text-slate-400">Categoria</dt>
                      <dd><span className="rounded-full bg-brand-50 dark:bg-brand-900/40 px-2.5 py-1 text-xs font-semibold text-brand-700 dark:text-brand-400">{resultado.categoria}</span></dd>
                    </div>
                    <div className="flex items-center justify-between gap-4 px-4 py-3">
                      <dt className="text-sm text-ink-muted dark:text-slate-400">Pagamento</dt>
                      <dd><span className="rounded-full bg-sky-50 dark:bg-sky-950/40 px-2.5 py-1 text-xs font-semibold text-sky-700 dark:text-sky-400">{resultado.forma_pagamento || 'Não identificado'}</span></dd>
                    </div>
                    {contexto && (
                      <div className="flex items-start justify-between gap-4 px-4 py-3">
                        <dt className="text-sm text-ink-muted dark:text-slate-400 shrink-0">Descrição</dt>
                        <dd className="text-sm font-semibold text-ink dark:text-slate-200 text-right">{contexto}</dd>
                      </div>
                    )}
                  </dl>

                  <div className="flex gap-3">
                    <button onClick={() => setResultado(null)} disabled={salvando || verificandoDuplicata} className="flex-1 rounded-xl border border-edge dark:border-slate-700 bg-surface dark:bg-slate-900 p-3.5 text-sm font-semibold text-ink dark:text-slate-200 transition-colors hover:bg-canvas dark:hover:bg-slate-800">
                      Cancelar
                    </button>
                    <button onClick={confirmarSalvamento} disabled={salvando || verificandoDuplicata} className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-brand-600 p-3.5 text-sm font-semibold text-white transition-colors hover:bg-brand-700 disabled:opacity-60">
                      {(salvando || verificandoDuplicata) ? <Loader2 className="h-5 w-5 animate-spin" /> : <Save className="h-5 w-5" />} Confirmar
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Nota sobre a IA — apenas mobile */}
            <p className="mt-4 flex items-center justify-center gap-1.5 text-xs text-ink-faint dark:text-slate-500 lg:hidden">
              <Sparkles className="h-3.5 w-3.5" /> Leitura de notas fiscais com IA
            </p>
          </div>
        </div>
      </main>

      {/* AVISO CUSTOMIZADO DE COMPRA DUPLICADA */}
      {modalDuplicataAberto && resultado && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 dark:bg-black/80 p-4 backdrop-blur-sm transition-colors">
          <div className="w-full max-w-md overflow-hidden rounded-2xl bg-surface dark:bg-slate-900 shadow-xl border border-edge dark:border-slate-800">
            <div className="flex items-center justify-between border-b border-edge dark:border-slate-800 bg-canvas dark:bg-slate-950 p-4">
              <h3 className="flex items-center gap-2 text-lg font-bold text-ink dark:text-white">
                <AlertTriangle className="h-5 w-5 text-amber-500 shrink-0" /> Possível duplicata
              </h3>
              <button onClick={() => setModalDuplicataAberto(false)} aria-label="Fechar" className="min-h-11 min-w-11 inline-flex items-center justify-center rounded-full bg-edge dark:bg-slate-800 text-ink-muted dark:text-slate-400 transition-colors hover:bg-edge/70 dark:hover:bg-slate-700 hover:text-ink dark:hover:text-white"><X className="h-5 w-5" /></button>
            </div>
            <div className="space-y-4 p-5">
              <p className="text-sm text-ink dark:text-slate-300">
                Já existe um gasto salvo com a <strong>mesma descrição, estabelecimento, data e valor</strong>. Isso pode ser um lançamento duplicado.
              </p>
              <dl className="divide-y divide-edge dark:divide-slate-800 rounded-xl border border-edge dark:border-slate-800 bg-canvas dark:bg-slate-950">
                <div className="flex items-center justify-between gap-4 px-4 py-2.5">
                  <dt className="text-sm text-ink-muted dark:text-slate-400">Estabelecimento</dt>
                  <dd className="text-sm font-semibold text-ink dark:text-slate-200 text-right">{resultado.estabelecimento}</dd>
                </div>
                <div className="flex items-center justify-between gap-4 px-4 py-2.5">
                  <dt className="text-sm text-ink-muted dark:text-slate-400">Valor</dt>
                  <dd className="text-sm font-bold text-ink dark:text-white">R$ {Number(resultado.valor).toFixed(2)}</dd>
                </div>
                <div className="flex items-center justify-between gap-4 px-4 py-2.5">
                  <dt className="text-sm text-ink-muted dark:text-slate-400">Data</dt>
                  <dd className="text-sm font-semibold text-ink dark:text-slate-200">{resultado.data_compra}</dd>
                </div>
                <div className="flex items-center justify-between gap-4 px-4 py-2.5">
                  <dt className="text-sm text-ink-muted dark:text-slate-400">Descrição</dt>
                  <dd className="text-sm font-semibold text-ink dark:text-slate-200 text-right">{contexto || "Inserção Manual"}</dd>
                </div>
              </dl>
              <div className="flex gap-3">
                <button onClick={() => setModalDuplicataAberto(false)} disabled={salvando} className="flex-1 rounded-xl border border-edge dark:border-slate-700 bg-surface dark:bg-slate-900 p-3.5 text-sm font-semibold text-ink dark:text-slate-200 transition-colors hover:bg-canvas dark:hover:bg-slate-800">
                  Cancelar
                </button>
                <button onClick={executarSalvamento} disabled={salvando} className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-amber-500 p-3.5 text-sm font-semibold text-white transition-colors hover:bg-amber-600 disabled:opacity-60">
                  {salvando ? <Loader2 className="h-5 w-5 animate-spin" /> : <Save className="h-5 w-5" />} Salvar mesmo assim
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

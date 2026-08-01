"use client";

import { useState, useEffect } from "react";
import { Camera, Upload, Loader2, CheckCircle, Save, Image as ImageIcon, Pencil, ScanLine, Sparkles, ShieldCheck, PieChart } from "lucide-react";
import { supabase } from "../lib/supabase";
import { CATEGORIAS, FORMAS_PAGAMENTO, ROTULOS_CATEGORIAS } from "../lib/constantes";
import AppHeader from "../components/AppHeader";
import AuthCard from "../components/AuthCard";

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

  const salvarNoBanco = async () => {
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

  const inputClasses = "w-full rounded-xl border border-edge bg-surface px-4 py-3 text-sm text-ink placeholder:text-ink-faint focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/25";
  const labelClasses = "mb-1.5 block text-sm font-medium text-ink";

  if (autenticado === null) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-canvas">
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
    <div className="min-h-screen bg-canvas">
      <AppHeader email={usuarioAtual?.email} paginaAtiva="scanner" onLogout={fazerLogout} />

      <main className="mx-auto max-w-6xl px-4 py-6 sm:px-6 lg:py-10">
        <div className="grid gap-8 lg:grid-cols-5 lg:gap-12">

          {/* Painel lateral informativo — visível apenas no desktop */}
          <aside className="hidden lg:col-span-2 lg:block">
            <div className="sticky top-24 space-y-8">
              <div>
                <h1 className="text-3xl font-bold tracking-tight text-ink">
                  Registre um gasto
                </h1>
                <p className="mt-2 text-[15px] leading-relaxed text-ink-muted">
                  Fotografe a nota fiscal e deixe a inteligência artificial extrair os
                  dados, ou digite as informações manualmente.
                </p>
              </div>

              <ul className="space-y-5">
                <li className="flex gap-3.5">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand-700">
                    <ScanLine className="h-5 w-5" />
                  </span>
                  <div>
                    <p className="text-sm font-semibold text-ink">Leitura automática</p>
                    <p className="mt-0.5 text-sm text-ink-muted">Estabelecimento, valor, data e categoria extraídos da foto da nota.</p>
                  </div>
                </li>
                <li className="flex gap-3.5">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand-700">
                    <PieChart className="h-5 w-5" />
                  </span>
                  <div>
                    <p className="text-sm font-semibold text-ink">Painel completo</p>
                    <p className="mt-0.5 text-sm text-ink-muted">Gráficos por categoria, forma de pagamento e evolução mensal.</p>
                  </div>
                </li>
                <li className="flex gap-3.5">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand-700">
                    <ShieldCheck className="h-5 w-5" />
                  </span>
                  <div>
                    <p className="text-sm font-semibold text-ink">Dados protegidos</p>
                    <p className="mt-0.5 text-sm text-ink-muted">Cada conta enxerga somente os próprios gastos e orçamentos.</p>
                  </div>
                </li>
              </ul>
            </div>
          </aside>

          {/* Cartão principal de registro */}
          <div className="lg:col-span-3">
            <div className="mb-5 lg:hidden">
              <h1 className="text-xl font-bold tracking-tight text-ink">Registre um gasto</h1>
              <p className="mt-1 text-sm text-ink-muted">Escaneie a nota fiscal ou digite os dados.</p>
            </div>

            <div className="rounded-2xl border border-edge bg-surface p-5 shadow-sm sm:p-7">
              {!resultado ? (
                <>
                  <div className="mb-6 flex rounded-xl bg-canvas p-1.5">
                    <button
                      onClick={() => setModoManual(false)}
                      className={`flex flex-1 items-center justify-center gap-2 rounded-lg py-2.5 text-sm font-semibold transition-all ${!modoManual ? 'bg-surface text-brand-700 shadow-sm' : 'text-ink-muted hover:text-ink'}`}
                    >
                      <Camera className="h-4 w-4" /> Escanear
                    </button>
                    <button
                      onClick={() => setModoManual(true)}
                      className={`flex flex-1 items-center justify-center gap-2 rounded-lg py-2.5 text-sm font-semibold transition-all ${modoManual ? 'bg-surface text-brand-700 shadow-sm' : 'text-ink-muted hover:text-ink'}`}
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
                          <div className="flex items-center justify-center gap-2 rounded-xl border border-brand-200 bg-brand-50 p-4 text-sm font-medium text-brand-800">
                            <CheckCircle className="h-5 w-5 shrink-0 text-brand-600" />
                            <span className="max-w-[200px] truncate sm:max-w-xs">{imagem.name}</span>
                            <button type="button" onClick={() => setImagem(null)} className="ml-2 text-xs font-semibold text-red-500 underline">Alterar</button>
                          </div>
                        ) : (
                          <div className="grid grid-cols-2 gap-3">
                            <label className="flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-edge bg-canvas py-7 transition-colors hover:border-brand-300 hover:bg-brand-50/50 sm:py-9">
                              <Camera className="mb-2 h-6 w-6 text-brand-600" />
                              <span className="text-xs font-semibold text-ink">Tirar Foto</span>
                              <input type="file" accept="image/jpeg, image/png, image/jpg" capture="environment" className="hidden" onChange={(e) => setImagem(e.target.files?.[0] || null)} />
                            </label>
                            <label className="flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-edge bg-canvas py-7 transition-colors hover:border-brand-300 hover:bg-brand-50/50 sm:py-9">
                              <ImageIcon className="mb-2 h-6 w-6 text-brand-600" />
                              <span className="text-xs font-semibold text-ink">Abrir Galeria</span>
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
                    <span className="flex h-9 w-9 items-center justify-center rounded-full bg-brand-50 text-brand-600">
                      <CheckCircle className="h-5 w-5" />
                    </span>
                    <h2 className="text-lg font-bold text-ink">Resumo do Gasto</h2>
                  </div>

                  <dl className="divide-y divide-edge rounded-xl border border-edge bg-canvas">
                    <div className="flex items-center justify-between gap-4 px-4 py-3">
                      <dt className="text-sm text-ink-muted">Estabelecimento</dt>
                      <dd className="text-sm font-semibold text-ink text-right">{resultado.estabelecimento}</dd>
                    </div>
                    <div className="flex items-center justify-between gap-4 px-4 py-3">
                      <dt className="text-sm text-ink-muted">Valor</dt>
                      <dd className="text-sm font-bold text-ink">R$ {Number(resultado.valor).toFixed(2)}</dd>
                    </div>
                    <div className="flex items-center justify-between gap-4 px-4 py-3">
                      <dt className="text-sm text-ink-muted">Data</dt>
                      <dd className="text-sm font-semibold text-ink">{resultado.data_compra}</dd>
                    </div>
                    <div className="flex items-center justify-between gap-4 px-4 py-3">
                      <dt className="text-sm text-ink-muted">Categoria</dt>
                      <dd><span className="rounded-full bg-brand-50 px-2.5 py-1 text-xs font-semibold text-brand-700">{resultado.categoria}</span></dd>
                    </div>
                    <div className="flex items-center justify-between gap-4 px-4 py-3">
                      <dt className="text-sm text-ink-muted">Pagamento</dt>
                      <dd><span className="rounded-full bg-sky-50 px-2.5 py-1 text-xs font-semibold text-sky-700">{resultado.forma_pagamento || 'Não identificado'}</span></dd>
                    </div>
                  </dl>

                  <div className="flex gap-3">
                    <button onClick={() => setResultado(null)} disabled={salvando} className="flex-1 rounded-xl border border-edge bg-surface p-3.5 text-sm font-semibold text-ink transition-colors hover:bg-canvas">
                      Cancelar
                    </button>
                    <button onClick={salvarNoBanco} disabled={salvando} className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-brand-600 p-3.5 text-sm font-semibold text-white transition-colors hover:bg-brand-700 disabled:opacity-60">
                      {salvando ? <Loader2 className="h-5 w-5 animate-spin" /> : <Save className="h-5 w-5" />} Confirmar
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Nota sobre a IA — apenas mobile */}
            <p className="mt-4 flex items-center justify-center gap-1.5 text-xs text-ink-faint lg:hidden">
              <Sparkles className="h-3.5 w-3.5" /> Leitura de notas fiscais com IA
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}

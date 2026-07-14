"use client";

import { useState, useEffect } from "react";
import { Camera, Upload, Loader2, CheckCircle, Save, BarChart3, Image as ImageIcon, Lock, Pencil, LogOut } from "lucide-react";
import { supabase } from "../lib/supabase"; 
import Link from "next/link"; 

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

  if (autenticado === null) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  // FORMULÁRIO DE LOGIN / CADASTRO REAL
  if (!autenticado) {
    return (
      <main className="min-h-screen bg-gray-100 flex items-center justify-center p-4 font-sans text-gray-900">
        <div className="max-w-sm w-full bg-white rounded-2xl shadow-md p-6 border text-center space-y-4">
          <div className="mx-auto w-12 h-12 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center">
            <Lock className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-800">{modoCadastro ? "Criar Nova Conta" : "Acessar Sistema"}</h1>
            <p className="text-sm text-gray-500 mt-1">{modoCadastro ? "Registre seu e-mail para começar a organizar suas finanças." : "Insira seu e-mail e senha cadastrados."}</p>
          </div>
          <form onSubmit={lidarComAutenticacao} className="space-y-3">
            <input required type="email" placeholder="E-mail" value={emailInput} onChange={(e) => setEmailInput(e.target.value)} className="w-full bg-gray-50 border border-gray-300 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none" />
            <input required type="password" placeholder="Senha" value={senhaInput} onChange={(e) => setSenhaInput(e.target.value)} className="w-full bg-gray-50 border border-gray-300 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none" />
            <button type="submit" disabled={loading} className="w-full bg-blue-600 text-white rounded-xl py-3 font-bold text-sm hover:bg-blue-700 active:scale-98 transition-all flex justify-center items-center gap-2">
              {loading && <Loader2 className="w-4 h-4 animate-spin" />} {modoCadastro ? "Cadastrar Conta" : "Entrar"}
            </button>
          </form>
          <button type="button" onClick={() => setModoCadastro(!modoCadastro)} className="text-sm text-blue-600 hover:underline block mx-auto mt-2">
            {modoCadastro ? "Já possui conta? Faça Login" : "Não possui conta? Cadastre-se"}
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gray-50 p-4 font-sans text-gray-900">
      <div className="max-w-md mx-auto bg-white rounded-2xl shadow-sm p-6 mt-8">
        
        {/* Topbar com Botão de Desconectar */}
        <div className="flex justify-between items-center mb-4">
          <span className="text-[11px] bg-gray-100 text-gray-600 px-2 py-0.5 rounded-md truncate max-w-[180px] font-medium" title={usuarioAtual?.email}>
            👤 {usuarioAtual?.email}
          </span>
          <button onClick={fazerLogout} className="text-xs font-semibold uppercase tracking-wider text-red-500 hover:text-red-700 flex items-center gap-1 transition-colors">
            <LogOut className="w-4 h-4" /> Sair
          </button>
        </div>

        <h1 className="text-2xl font-bold text-center mb-2 text-blue-600">
          Assistente Financeiro
        </h1>

        <div className="text-center mb-6">
          <Link 
            href="/dashboard" 
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-blue-600 hover:text-blue-700 hover:underline transition-all"
          >
            <BarChart3 className="w-4 h-4" /> Ver Gráficos e Relatórios
          </Link>
        </div>

        {!resultado ? (
          <>
            <div className="flex bg-gray-100 p-1.5 rounded-xl mb-6">
              <button 
                onClick={() => setModoManual(false)} 
                className={`flex-1 py-2 rounded-lg text-sm font-bold flex items-center justify-center gap-2 transition-all ${!modoManual ? 'bg-white shadow text-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
              >
                <Camera className="w-4 h-4" /> Escanear
              </button>
              <button 
                onClick={() => setModoManual(true)} 
                className={`flex-1 py-2 rounded-lg text-sm font-bold flex items-center justify-center gap-2 transition-all ${modoManual ? 'bg-white shadow text-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
              >
                <Pencil className="w-4 h-4" /> Digitar
              </button>
            </div>

            {!modoManual ? (
              <form onSubmit={handleSubmitIA} className="space-y-6 animate-in fade-in duration-300">
                <div>
                  <label className="block text-sm font-medium mb-2">O que foi essa compra? (Opcional)</label>
                  <input
                    type="text"
                    placeholder="Ex: Almoço de domingo"
                    className="w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    value={contexto}
                    onChange={(e) => setContexto(e.target.value)}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-3">Anexar Nota Fiscal</label>
                  {imagem ? (
                    <div className="bg-blue-50 border border-blue-200 text-blue-800 rounded-xl p-4 text-center text-sm font-medium flex items-center justify-center gap-2">
                      <CheckCircle className="w-5 h-5 text-blue-600 flex-shrink-0" />
                      <span className="truncate max-w-[200px]">{imagem.name}</span>
                      <button type="button" onClick={() => setImagem(null)} className="text-xs text-red-500 ml-2 underline font-semibold">Alterar</button>
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 gap-3">
                      <label className="flex flex-col items-center justify-center border-2 border-dashed border-gray-300 rounded-xl py-6 bg-gray-50 hover:bg-gray-100 cursor-pointer transition-all active:scale-98">
                        <Camera className="w-6 h-6 text-blue-500 mb-2" />
                        <span className="text-xs font-bold text-gray-700">Tirar Foto</span>
                        <input type="file" accept="image/jpeg, image/png, image/jpg" capture="environment" className="hidden" onChange={(e) => setImagem(e.target.files?.[0] || null)} />
                      </label>
                      <label className="flex flex-col items-center justify-center border-2 border-dashed border-gray-300 rounded-xl py-6 bg-gray-50 hover:bg-gray-100 cursor-pointer transition-all active:scale-98">
                        <ImageIcon className="w-6 h-6 text-emerald-500 mb-2" />
                        <span className="text-xs font-bold text-gray-700">Abrir Galeria</span>
                        <input type="file" accept="image/jpeg, image/png, image/jpg" className="hidden" onChange={(e) => setImagem(e.target.files?.[0] || null)} />
                      </label>
                    </div>
                  )}
                </div>

                <button type="submit" disabled={loading || !imagem} className="w-full bg-blue-600 text-white rounded-lg p-4 font-bold flex justify-center items-center gap-2 hover:bg-blue-700 disabled:opacity-50 cursor-pointer">
                  {loading ? <><Loader2 className="w-5 h-5 animate-spin" /> Analisando IA...</> : <><Upload className="w-5 h-5" /> Analisar Nota</>}
                </button>
              </form>
            ) : (
              <form onSubmit={handleSubmitManual} className="space-y-4 animate-in fade-in duration-300">
                <div>
                  <label className="block text-sm font-medium mb-1">Estabelecimento *</label>
                  <input required name="estabelecimento" value={formManual.estabelecimento} onChange={lidarComMudancaManual} type="text" placeholder="Ex: Supermercado Extra" className="w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-blue-500 focus:outline-none" />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Valor (R$) *</label>
                    <input required name="valor" value={formManual.valor} onChange={lidarComMudancaManual} type="number" step="0.01" placeholder="0.00" className="w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-blue-500 focus:outline-none" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Data</label>
                    <input required name="data_compra" value={formManual.data_compra} onChange={lidarComMudancaManual} type="date" className="w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-blue-500 focus:outline-none" />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Categoria</label>
                    <select name="categoria" value={formManual.categoria} onChange={lidarComMudancaManual} className="w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-blue-500 focus:outline-none bg-white">
                      <option value="Alimentação">Alimentação (Mercados)</option>
                      <option value="Comer Fora">Comer Fora (Restaurantes)</option>
                      <option value="Lazer">Lazer</option>
                      <option value="Saúde">Saúde</option>
                      <option value="Transporte">Transporte</option>
                      <option value="Casa">Casa</option>
                      <option value="Outros">Outros</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Pagamento</label>
                    <select name="forma_pagamento" value={formManual.forma_pagamento} onChange={lidarComMudancaManual} className="w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-blue-500 focus:outline-none bg-white">
                      <option value="Débito">Débito</option>
                      <option value="Crédito">Crédito</option>
                      <option value="Pix">Pix</option>
                      <option value="Dinheiro">Dinheiro</option>
                      <option value="Vale Alimentação">Vale Alimentação</option>
                      <option value="Vale Refeição">Vale Refeição</option>
                    </select>
                  </div>
                </div>

                <button type="submit" className="w-full bg-blue-600 text-white rounded-lg p-4 font-bold flex justify-center items-center gap-2 hover:bg-blue-700 mt-2">
                  Avançar
                </button>
              </form>
            )}
          </>
        ) : (
          <div className="space-y-4 animate-in fade-in duration-500">
            <div className="flex items-center gap-2 text-green-600 mb-4 font-bold text-lg">
              <CheckCircle className="w-6 h-6" /> Resumo do Gasto
            </div>
            
            <div className="bg-gray-50 p-4 rounded-lg space-y-2 border">
              <p><strong>Estabelecimento:</strong> {resultado.estabelecimento}</p>
              <p><strong>Valor:</strong> R$ {Number(resultado.valor).toFixed(2)}</p>
              <p><strong>Data:</strong> {resultado.data_compra}</p>
              <p><strong>Categoria:</strong> <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-sm">{resultado.categoria}</span></p>
              <p><strong>Pagamento:</strong> <span className="bg-green-100 text-green-800 px-2 py-1 rounded text-sm">{resultado.forma_pagamento || 'Não identificado'}</span></p>
            </div>

            <div className="flex gap-2 mt-6">
              <button onClick={() => setResultado(null)} disabled={salvando} className="flex-1 bg-gray-200 text-gray-800 p-3 rounded-lg font-bold">Cancelar</button>
              <button onClick={salvarNoBanco} disabled={salvando} className="flex-1 bg-green-600 text-white p-3 rounded-lg font-bold flex justify-center items-center gap-2">
                {salvando ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />} Confirmar
              </button>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
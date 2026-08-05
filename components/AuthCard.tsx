"use client";

import { useState } from "react";
import { Loader2, Mail, Lock, LayoutDashboard, ArrowRight } from "lucide-react";

interface AuthCardProps {
  modoCadastro: boolean;
  setModoCadastro: (modo: boolean) => void;
  email: string;
  setEmail: (email: string) => void;
  senha: string;
  setSenha: (senha: string) => void;
  loading: boolean;
  onSubmit: (e: React.FormEvent) => void;
}

export default function AuthCard({
  modoCadastro,
  setModoCadastro,
  email,
  setEmail,
  senha,
  setSenha,
  loading,
  onSubmit,
}: AuthCardProps) {
  return (
    // 🌟 Fundo geral escuro (slate-950)
    <div className="flex min-h-screen items-center justify-center bg-canvas dark:bg-slate-950 p-4 transition-colors duration-300 w-full">
      
      {/* 🌟 Card do formulário escuro (slate-900) com borda escura (slate-800) */}
      <div className="w-full max-w-md overflow-hidden rounded-3xl bg-surface dark:bg-slate-900 shadow-2xl border border-edge dark:border-slate-800 transition-colors duration-300">
        
        {/* Cabeçalho do Card */}
        <div className="bg-brand-600 dark:bg-brand-700 p-8 text-center sm:p-10 transition-colors duration-300">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-white/20 shadow-inner backdrop-blur-md">
            <LayoutDashboard className="h-8 w-8 text-white" />
          </div>
          <h2 className="text-2xl font-extrabold tracking-tight text-white sm:text-3xl">
            Finanças<span className="text-brand-200">AI</span>
          </h2>
          <p className="mt-2 text-sm font-medium text-brand-100">
            {modoCadastro
              ? "Crie sua conta e assuma o controle."
              : "Bem-vindo de volta! Acesse sua conta."}
          </p>
        </div>

        {/* Corpo do Formulário */}
        <div className="p-8 sm:p-10">
          <form onSubmit={onSubmit} className="space-y-5">
            <div>
              <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-ink-muted dark:text-slate-400">
                E-mail
              </label>
              <div className="relative">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5">
                  <Mail className="h-4 w-4 text-ink-faint dark:text-slate-500" />
                </div>
                {/* 🌟 Inputs adaptados para modo escuro */}
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="block w-full rounded-xl border border-edge dark:border-slate-700 bg-canvas dark:bg-slate-950/50 py-3 pl-10 pr-4 text-sm text-ink dark:text-slate-200 placeholder-ink-faint dark:placeholder-slate-500 transition-all focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
                  placeholder="voce@email.com"
                />
              </div>
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-ink-muted dark:text-slate-400">
                Senha
              </label>
              <div className="relative">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5">
                  <Lock className="h-4 w-4 text-ink-faint dark:text-slate-500" />
                </div>
                {/* 🌟 Inputs adaptados para modo escuro */}
                <input
                  type="password"
                  required
                  value={senha}
                  onChange={(e) => setSenha(e.target.value)}
                  className="block w-full rounded-xl border border-edge dark:border-slate-700 bg-canvas dark:bg-slate-950/50 py-3 pl-10 pr-4 text-sm text-ink dark:text-slate-200 placeholder-ink-faint dark:placeholder-slate-500 transition-all focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
                  placeholder="••••••••"
                  minLength={6}
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="group mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-brand-600 dark:bg-brand-500 py-3.5 text-sm font-bold text-white transition-all hover:bg-brand-700 dark:hover:bg-brand-600 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-2 dark:focus:ring-offset-slate-900 disabled:opacity-70"
            >
              {loading ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <>
                  {modoCadastro ? "Criar Conta" : "Entrar na Plataforma"}
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                </>
              )}
            </button>
          </form>

          {/* 🌟 Textos de rodapé adaptados */}
          <div className="mt-8 text-center">
            <p className="text-sm text-ink-muted dark:text-slate-400">
              {modoCadastro ? "Já possui uma conta?" : "Ainda não tem acesso?"}{" "}
              <button
                type="button"
                onClick={() => setModoCadastro(!modoCadastro)}
                className="font-bold text-brand-600 dark:text-brand-400 hover:text-brand-700 dark:hover:text-brand-300 hover:underline focus:outline-none"
              >
                {modoCadastro ? "Faça login" : "Cadastre-se grátis"}
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
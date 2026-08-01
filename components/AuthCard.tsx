"use client";

import { Loader2, Wallet } from "lucide-react";

type Props = {
  modoCadastro: boolean;
  setModoCadastro: (v: boolean) => void;
  email: string;
  setEmail: (v: string) => void;
  senha: string;
  setSenha: (v: string) => void;
  loading: boolean;
  onSubmit: (e: React.FormEvent) => void;
};

export default function AuthCard({
  modoCadastro,
  setModoCadastro,
  email,
  setEmail,
  senha,
  setSenha,
  loading,
  onSubmit,
}: Props) {
  return (
    <main className="flex min-h-screen items-center justify-center bg-canvas p-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex flex-col items-center text-center">
          <span className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-600 text-white shadow-lg shadow-brand-600/20">
            <Wallet className="h-7 w-7" />
          </span>
          <h1 className="text-2xl font-bold tracking-tight text-ink">
            Assistente Financeiro
          </h1>
          <p className="mt-1.5 text-sm text-ink-muted">
            {modoCadastro
              ? "Crie sua conta para começar a organizar suas finanças."
              : "Entre com seu e-mail e senha para continuar."}
          </p>
        </div>

        <div className="rounded-2xl border border-edge bg-surface p-6 shadow-sm">
          <form onSubmit={onSubmit} className="space-y-4">
            <div>
              <label htmlFor="auth-email" className="mb-1.5 block text-sm font-medium text-ink">
                E-mail
              </label>
              <input
                id="auth-email"
                required
                type="email"
                autoComplete="email"
                placeholder="voce@exemplo.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-xl border border-edge bg-canvas px-4 py-3 text-sm text-ink placeholder:text-ink-faint focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/25"
              />
            </div>
            <div>
              <label htmlFor="auth-senha" className="mb-1.5 block text-sm font-medium text-ink">
                Senha
              </label>
              <input
                id="auth-senha"
                required
                type="password"
                autoComplete={modoCadastro ? "new-password" : "current-password"}
                placeholder="••••••••"
                value={senha}
                onChange={(e) => setSenha(e.target.value)}
                className="w-full rounded-xl border border-edge bg-canvas px-4 py-3 text-sm text-ink placeholder:text-ink-faint focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/25"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-brand-600 py-3 text-sm font-semibold text-white transition-colors hover:bg-brand-700 disabled:opacity-60"
            >
              {loading && <Loader2 className="h-4 w-4 animate-spin" />}
              {modoCadastro ? "Criar conta" : "Entrar"}
            </button>
          </form>
        </div>

        <button
          type="button"
          onClick={() => setModoCadastro(!modoCadastro)}
          className="mx-auto mt-5 block text-sm font-medium text-brand-700 hover:underline"
        >
          {modoCadastro ? "Já possui conta? Faça login" : "Não possui conta? Cadastre-se"}
        </button>
      </div>
    </main>
  );
}

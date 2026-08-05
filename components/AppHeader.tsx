"use client";

import Link from "next/link";
import { ScanLine, BarChart3, LogOut, Wallet, Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";

interface AppHeaderProps {
  email?: string | null;
  paginaAtiva: "scanner" | "dashboard";
  onLogout?: () => void;
}

export default function AppHeader({ email, paginaAtiva, onLogout }: AppHeaderProps) {
  const { theme, setTheme } = useTheme();
  const [montado, setMontado] = useState(false);

  // Evita erro de hidratação: o ícone do tema só renderiza no cliente
  useEffect(() => setMontado(true), []);

  const linkBase =
    "inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold transition-colors";
  const linkAtivo = "bg-brand-50 text-brand-700 dark:bg-brand-900/40 dark:text-brand-400";
  const linkInativo =
    "text-ink-muted hover:text-ink hover:bg-canvas dark:text-slate-400 dark:hover:text-slate-200 dark:hover:bg-slate-800";

  return (
    <header className="sticky top-0 z-40 w-full border-b border-edge dark:border-slate-800 bg-surface/95 dark:bg-slate-950/80 backdrop-blur-md">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between gap-3 px-4 sm:h-16 sm:px-6">
        {/* Logo */}
        <Link href="/" className="flex shrink-0 items-center gap-2.5">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-600 text-white shadow-sm sm:h-9 sm:w-9">
            <Wallet className="h-4 w-4 sm:h-5 sm:w-5" />
          </span>
          <span className="hidden text-[15px] font-bold tracking-tight text-ink dark:text-white lg:block">
            Assistente Financeiro
          </span>
        </Link>

        {/* Navegação entre telas */}
        <nav className="flex items-center gap-1">
          <Link
            href="/"
            className={`${linkBase} ${paginaAtiva === "scanner" ? linkAtivo : linkInativo}`}
          >
            <ScanLine className="h-4 w-4" />
            <span>Registrar</span>
          </Link>
          <Link
            href="/dashboard"
            className={`${linkBase} ${paginaAtiva === "dashboard" ? linkAtivo : linkInativo}`}
          >
            <BarChart3 className="h-4 w-4" />
            <span>Painel</span>
          </Link>
        </nav>

        {/* Email, tema e logout */}
        <div className="flex min-w-0 items-center gap-2 sm:gap-3">
          {email && (
            <span
              className="hidden max-w-[200px] truncate rounded-full border border-edge dark:border-slate-700 bg-canvas dark:bg-slate-900 px-3 py-1 text-xs font-medium text-ink-muted dark:text-slate-400 md:block"
              title={email}
            >
              {email}
            </span>
          )}

          {montado && (
            <button
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
              className="flex h-9 w-9 items-center justify-center rounded-lg bg-canvas dark:bg-slate-800 text-ink-muted dark:text-slate-300 transition-colors hover:bg-edge dark:hover:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-brand-500/50"
              aria-label="Alternar tema"
              title="Alternar tema"
            >
              {theme === "dark" ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
            </button>
          )}

          {onLogout && (
            <button
              onClick={onLogout}
              className="inline-flex items-center gap-1.5 rounded-lg bg-red-50 dark:bg-red-950/30 px-2.5 py-2 text-xs font-semibold text-red-600 dark:text-red-400 transition-colors hover:bg-red-100 dark:hover:bg-red-950/50"
              title="Sair da conta"
            >
              <LogOut className="h-4 w-4" />
              <span className="hidden sm:inline">Sair</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
}

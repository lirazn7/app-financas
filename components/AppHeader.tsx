"use client";

import { LogOut, LayoutDashboard, Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";

interface AppHeaderProps {
  email?: string;
  paginaAtiva?: "dashboard" | "perfil";
  onLogout?: () => void;
}

export default function AppHeader({ email, paginaAtiva = "dashboard", onLogout }: AppHeaderProps) {
  const { theme, setTheme } = useTheme();
  const [montado, setMontado] = useState(false);

  // Evita o erro de hidratação garantindo que o ícone só renderize no cliente
  useEffect(() => setMontado(true), []);

  return (
    // 🌟 Nota: Adicionei bg-white dark:bg-surface-dark (ou slate-900) e bordas escuras
    <header className="sticky top-0 z-40 w-full border-b border-edge dark:border-slate-800 bg-white/80 dark:bg-slate-950/80 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
        
        {/* Lado Esquerdo: Logo */}
        <div className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-600 text-white shadow-sm">
            <LayoutDashboard className="h-5 w-5" />
          </div>
          <span className="text-lg font-bold tracking-tight text-ink dark:text-white hidden sm:block">
            Finanças<span className="text-brand-600 dark:text-brand-500">AI</span>
          </span>
        </div>

        {/* Lado Direito: Infos, Tema e Logout */}
        <div className="flex items-center gap-3 sm:gap-4">
          
          {email && (
            <div className="hidden items-center gap-2 sm:flex pr-4 border-r border-edge dark:border-slate-800">
              <div className="h-7 w-7 overflow-hidden rounded-full bg-brand-100 dark:bg-brand-900/50 flex items-center justify-center border border-brand-200 dark:border-brand-800">
                <span className="text-xs font-bold text-brand-700 dark:text-brand-400">
                  {email.charAt(0).toUpperCase()}
                </span>
              </div>
              <span className="text-sm font-medium text-ink-muted dark:text-slate-400">
                {email}
              </span>
            </div>
          )}

          {/* 🌟 BOTÃO DE DARK MODE */}
          {montado && (
            <button
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
              className="flex h-9 w-9 items-center justify-center rounded-lg bg-canvas dark:bg-slate-800 text-ink-muted dark:text-slate-300 transition-colors hover:bg-edge dark:hover:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-brand-500/50"
              aria-label="Alternar tema"
              title="Alternar tema"
            >
              {theme === "dark" ? (
                <Sun className="h-5 w-5" />
              ) : (
                <Moon className="h-5 w-5" />
              )}
            </button>
          )}

          {onLogout && (
            <button
              onClick={onLogout}
              className="flex items-center gap-2 rounded-lg bg-red-50 dark:bg-red-950/30 px-3 py-2 text-sm font-semibold text-red-600 dark:text-red-400 transition-colors hover:bg-red-100 dark:hover:bg-red-950/50"
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
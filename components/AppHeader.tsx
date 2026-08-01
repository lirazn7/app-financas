"use client";

import Link from "next/link";
import { ScanLine, BarChart3, LogOut, Wallet } from "lucide-react";

type Props = {
  email?: string | null;
  paginaAtiva: "scanner" | "dashboard";
  onLogout: () => void;
};

export default function AppHeader({ email, paginaAtiva, onLogout }: Props) {
  const linkBase =
    "inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold transition-colors";
  const linkAtivo = "bg-brand-50 text-brand-700";
  const linkInativo = "text-ink-muted hover:text-ink hover:bg-canvas";

  return (
    <header className="sticky top-0 z-40 border-b border-edge bg-surface/95 backdrop-blur">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between gap-3 px-4 sm:h-16 sm:px-6">
        <Link href="/" className="flex items-center gap-2.5 shrink-0">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-600 text-white sm:h-9 sm:w-9">
            <Wallet className="h-4 w-4 sm:h-5 sm:w-5" />
          </span>
          <span className="hidden text-[15px] font-bold tracking-tight text-ink sm:block">
            Assistente Financeiro
          </span>
        </Link>

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

        <div className="flex items-center gap-2 min-w-0">
          {email && (
            <span
              className="hidden max-w-[200px] truncate rounded-full border border-edge bg-canvas px-3 py-1 text-xs font-medium text-ink-muted md:block"
              title={email}
            >
              {email}
            </span>
          )}
          <button
            onClick={onLogout}
            className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-2 text-xs font-semibold text-ink-muted transition-colors hover:bg-red-50 hover:text-red-600"
            title="Sair da conta"
          >
            <LogOut className="h-4 w-4" />
            <span className="hidden sm:inline">Sair</span>
          </button>
        </div>
      </div>
    </header>
  );
}

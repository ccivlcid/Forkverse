import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';

interface AuthLayoutProps {
  children: ReactNode;
}

export default function AuthLayout({ children }: AuthLayoutProps) {
  return (
    <div className="flex flex-col h-screen bg-[var(--bg-void)]">
      <header className="h-10 bg-[var(--bg-void)] border-b border-[var(--border)] flex items-center px-4 shrink-0">
        <Link to="/" className="text-[var(--text)] font-mono font-bold hover:text-white">
          terminal.social
        </Link>
      </header>
      <main className="flex-1 flex items-center justify-center p-4">{children}</main>
    </div>
  );
}

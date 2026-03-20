import type { ReactNode } from 'react';

interface AuthLayoutProps {
  children: ReactNode;
}

export default function AuthLayout({ children }: AuthLayoutProps) {
  return (
    <div className="flex flex-col h-screen bg-[var(--bg-void)]">
      <main className="flex-1 flex items-center justify-center p-6">{children}</main>
    </div>
  );
}

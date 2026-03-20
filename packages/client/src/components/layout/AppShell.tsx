import { useState, useCallback, useEffect, type ReactNode } from 'react';
import HeaderBar from './HeaderBar.js';
import Sidebar from './Sidebar.js';
import KeyboardHelpModal from './KeyboardHelpModal.js';
import ToastContainer from './ToastContainer.js';
import { useKeyboardShortcuts } from '../../hooks/useKeyboardShortcuts.js';
import { useAuthStore } from '../../stores/authStore.js';

interface AppShellProps {
  children: ReactNode;
  breadcrumb?: string;
}

function KeyboardShortcutsProvider({ onToggleHelp }: { onToggleHelp: () => void }) {
  useKeyboardShortcuts(onToggleHelp);
  return null;
}

export default function AppShell({ children }: AppShellProps) {
  const [showHelp, setShowHelp] = useState(false);
  const toggleHelp = useCallback(() => setShowHelp((v) => !v), []);
  const { checkSession, isAuthenticated, isLoading } = useAuthStore();

  useEffect(() => {
    if (!isAuthenticated && !isLoading) {
      checkSession();
    }
  }, []);

  return (
    <div className="flex flex-col h-screen bg-[var(--bg-void)]">
      <KeyboardShortcutsProvider onToggleHelp={toggleHelp} />
      <HeaderBar />
      <div className="flex flex-1 overflow-hidden">
        <Sidebar />
        <main className="flex-1 overflow-y-auto">
          <div className="max-w-3xl mx-auto">{children}</div>
        </main>
      </div>
      <ToastContainer />
      {showHelp && <KeyboardHelpModal onClose={() => setShowHelp(false)} />}
    </div>
  );
}

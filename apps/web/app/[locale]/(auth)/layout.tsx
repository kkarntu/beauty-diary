import type { ReactNode } from 'react';
import { LanguageSwitcher } from '@/components/language-switcher';
import { ThemeToggle } from '@/components/theme-toggle';
import { Link } from '@/i18n/navigation';

/**
 * Minimal chrome for /login, /register, /forgot-password.
 * Each page renders <AuthShell> internally to provide the split layout.
 */
export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="flex items-center justify-between px-6 py-4 border-b border-border">
        <Link href="/">
          <span
            style={{ fontFamily: 'var(--font-display)' }}
            className="text-xl font-semibold text-foreground hover:text-primary transition-colors"
          >
            Beauty Diary
          </span>
        </Link>
        <div className="flex items-center gap-2">
          <LanguageSwitcher />
          <ThemeToggle />
        </div>
      </header>

      <main id="main-content" className="flex-1">
        {children}
      </main>
    </div>
  );
}

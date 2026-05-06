import type { ReactNode } from 'react';

interface Props {
  title: string;
  subtitle: string;
  illustrationTitle: string;
  illustrationBody: string;
  children: ReactNode;
}

/**
 * Two-column split for /login, /register, /forgot-password.
 * Left: heading + form (centered on a max-w-md column).
 * Right: decorative concentric circles + tagline (hidden on mobile).
 */
export function AuthShell({
  title,
  subtitle,
  illustrationTitle,
  illustrationBody,
  children,
}: Props) {
  return (
    <div className="grid min-h-[calc(100vh-65px)] lg:grid-cols-2">
      {/* Form */}
      <div className="flex items-center justify-center p-8">
        <div className="w-full max-w-md space-y-8">
          <div className="space-y-2">
            <h1
              style={{ fontFamily: 'var(--font-display)' }}
              className="text-foreground text-3xl font-medium"
            >
              {title}
            </h1>
            <p className="text-foreground-muted">{subtitle}</p>
          </div>
          {children}
        </div>
      </div>

      {/* Illustration */}
      <div className="bg-surface-muted hidden items-center justify-center p-16 lg:flex">
        <div className="max-w-md text-center">
          <div
            className="bg-primary/10 mx-auto mb-8 flex h-64 w-64 items-center justify-center rounded-full"
            aria-hidden="true"
          >
            <div className="bg-primary/20 flex h-48 w-48 items-center justify-center rounded-full">
              <div className="bg-primary/30 h-32 w-32 rounded-full" />
            </div>
          </div>
          <h2
            style={{ fontFamily: 'var(--font-display)' }}
            className="text-foreground mb-3 text-2xl font-medium"
          >
            {illustrationTitle}
          </h2>
          <p className="text-foreground-muted leading-relaxed">{illustrationBody}</p>
        </div>
      </div>
    </div>
  );
}

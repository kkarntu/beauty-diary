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
export function AuthShell({ title, subtitle, illustrationTitle, illustrationBody, children }: Props) {
  return (
    <div className="grid lg:grid-cols-2 min-h-[calc(100vh-65px)]">
      {/* Form */}
      <div className="flex items-center justify-center p-8">
        <div className="w-full max-w-md space-y-8">
          <div className="space-y-2">
            <h1
              style={{ fontFamily: 'var(--font-display)' }}
              className="text-3xl font-medium text-foreground"
            >
              {title}
            </h1>
            <p className="text-foreground-muted">{subtitle}</p>
          </div>
          {children}
        </div>
      </div>

      {/* Illustration */}
      <div className="hidden lg:flex items-center justify-center bg-surface-muted p-16">
        <div className="max-w-md text-center">
          <div
            className="w-64 h-64 mx-auto mb-8 rounded-full bg-primary/10 flex items-center justify-center"
            aria-hidden="true"
          >
            <div className="w-48 h-48 rounded-full bg-primary/20 flex items-center justify-center">
              <div className="w-32 h-32 rounded-full bg-primary/30" />
            </div>
          </div>
          <h2
            style={{ fontFamily: 'var(--font-display)' }}
            className="text-2xl font-medium text-foreground mb-3"
          >
            {illustrationTitle}
          </h2>
          <p className="text-foreground-muted leading-relaxed">{illustrationBody}</p>
        </div>
      </div>
    </div>
  );
}

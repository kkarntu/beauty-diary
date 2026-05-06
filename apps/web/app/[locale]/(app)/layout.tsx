import type { ReactNode } from 'react';
import { SiteHeader } from '@/components/site-header';

/**
 * Shared shell for the authenticated-flavored app surface (feed, post
 * detail, profiles, search, my content, admin). Anonymous users see the
 * same layout but the SiteHeader's user menu shows a "Sign in" button
 * instead of the dropdown.
 */
export default function AppLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <SiteHeader />
      <main id="main-content" className="bg-background min-h-screen">
        {children}
      </main>
    </>
  );
}

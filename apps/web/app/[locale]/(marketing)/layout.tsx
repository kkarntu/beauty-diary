import type { ReactNode } from 'react';
import { MarketingNav } from '@/components/marketing-nav';
import { SiteFooter } from '@/components/site-footer';

export default function MarketingLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <MarketingNav />
      <main id="main-content">{children}</main>
      <SiteFooter />
    </>
  );
}

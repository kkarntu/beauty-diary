import { createNavigation } from 'next-intl/navigation';
import { routing } from './routing';

/**
 * Locale-aware Link / useRouter / usePathname / redirect.
 * Use these instead of `next/link` and `next/navigation` so route
 * pushes/replaces preserve the active locale automatically.
 */
export const { Link, redirect, usePathname, useRouter, getPathname } =
  createNavigation(routing);

"use client";

import { SessionProvider } from "next-auth/react";

// Separate client component wrapper for SessionProvider.
// Required in Next.js 15 (App Router) — Server Components cannot directly
// render client-side context providers without this boundary.
export default function Providers({ children }) {
  return <SessionProvider>{children}</SessionProvider>;
}

import type { Metadata } from "next";
import type { ReactNode } from "react";
import "./globals.css";

import { SITE_NAME, SITE_URL } from "./site-config";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: `${SITE_NAME} | Diagnóstico Estratégico de Perfil`,
  description:
    "Diagnóstico Estratégico de Perfil pela Metodologia 8D, desenvolvida por Silas Silva.",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="pt-BR" className="h-full antialiased">
      <body className="min-h-full">{children}</body>
    </html>
  );
}

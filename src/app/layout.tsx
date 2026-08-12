import type { Metadata } from "next";
import type { ReactNode } from "react";
import "./globals.css";

import { SITE_URL } from "./site-config";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: "Diagnostico Estrategico de Perfil",
  description:
    "Diagnostico privado pela Metodologia Silas Silva de Diagnostico Estrategico.",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="pt-BR" className="h-full antialiased">
      <body className="min-h-full">{children}</body>
    </html>
  );
}

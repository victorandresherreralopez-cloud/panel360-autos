import type { Metadata } from "next";
import "./globals.css";
import { AppShell } from "@/components/app-shell";
import { getCurrentUser } from "@/lib/auth";

export const metadata: Metadata = {
  title: "Panel360 Autos | Asistente Comercial Automotriz",
  description: "Modulo automotriz de Panel360 para ventas, cotizaciones, rentabilidad y clientes en Chile.",
  icons: {
    icon: "/icons/icon-192.png",
    apple: "/icons/icon-192.png"
  }
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();

  return (
    <html lang="es-CL">
      <body>
        <AppShell user={user}>{children}</AppShell>
      </body>
    </html>
  );
}

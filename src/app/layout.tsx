import type { Metadata, Viewport } from "next";
import { ServiceWorkerRegistrar } from "@/components/pwa/ServiceWorkerRegistrar";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "South Studio",
    template: "%s | South Studio",
  },
  description: "Plataforma de ferramentas para produção audiovisual",
  applicationName: "South Studio",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    title: "South Studio",
    statusBarStyle: "black-translucent",
  },
  icons: {
    icon: [
      { url: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [{ url: "/icons/apple-touch-icon.png", sizes: "180x180", type: "image/png" }],
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#111111",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR" data-scroll-behavior="smooth">
      <body>
        {children}
        <ServiceWorkerRegistrar />
      </body>
    </html>
  );
}

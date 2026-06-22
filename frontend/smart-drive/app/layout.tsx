import type { Metadata, Viewport } from "next";
import { Archivo, Space_Grotesk, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import "maplibre-gl/dist/maplibre-gl.css";
import { ThemeProvider } from '@/features/shared/theme/ThemeProvider';
import { ServiceWorkerRegister } from '@/features/shared/pwa/ServiceWorkerRegister';

const archivo = Archivo({
  variable: "--font-archivo",
  subsets: ["latin"],
  weight: ["400", "600", "700", "800", "900"],
});

const spaceGrotesk = Space_Grotesk({
  variable: "--font-space-grotesk",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains-mono",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "SmartDrive — Telemetria",
  description: "Dashboard de telemetria veicular",
  applicationName: "SmartDrive",
  // PWA: instalável em iOS com tela cheia e nome curto na home screen.
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "SmartDrive",
  },
};

export const viewport: Viewport = {
  themeColor: "#0A0A0F",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="pt-BR"
      className={`${archivo.variable} ${spaceGrotesk.variable} ${jetbrainsMono.variable} h-full`}
    >
      <head>
        {/* Aplica o tema ANTES da primeira pintura para não piscar (JOA-RF-06).
            try/catch cobre localStorage indisponível (modo privado) → fallback dark. */}
        <script
          dangerouslySetInnerHTML={{
            __html:
              "(function(){try{var t=localStorage.getItem('sd-theme');" +
              "document.documentElement.dataset.theme=(t==='light')?'light':'dark';}" +
              "catch(e){document.documentElement.dataset.theme='dark';}})();",
          }}
        />
      </head>
      <body className="min-h-full flex flex-col">
        <ServiceWorkerRegister />
        <ThemeProvider>{children}</ThemeProvider>
      </body>
    </html>
  );
}

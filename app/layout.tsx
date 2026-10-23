import type { Metadata, Viewport } from "next";
import "./globals.css";
import AppUpdates from "./components/app-updates";
import { LanguageProvider } from "./components/language-provider";

const base = process.env.GITHUB_REPOSITORY ? `/${process.env.GITHUB_REPOSITORY.split("/")[1]}` : "";
export const viewport: Viewport = { themeColor: "#6546d7" };

export const metadata: Metadata = {
  title: "Finly — kalkulator wynagrodzeń",
  description: "Porównaj wynagrodzenie netto na umowie o pracę i B2B. Oblicz raty kredytu hipotecznego.",
  icons: { apple: `${base}/icon-180.png`, icon: `${base}/icon-192.png` },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="pl">
      <body>
        <LanguageProvider>
          {children}
          <AppUpdates base={base} />
        </LanguageProvider>
      </body>
    </html>
  );
}

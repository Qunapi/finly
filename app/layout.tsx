import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Finly — kalkulator wynagrodzeń",
  description: "Porównaj wynagrodzenie netto na umowie o pracę i B2B.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="pl">
      <body>{children}</body>
    </html>
  );
}

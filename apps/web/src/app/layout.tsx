import "./globals.css";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "AI-дневник",
  description: "Интервью, поддержка и оцифровка жизни"
};

export default function RootLayout({
  children
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ru">
      <body className="min-h-screen bg-cloud text-ink">
        {children}
      </body>
    </html>
  );
}

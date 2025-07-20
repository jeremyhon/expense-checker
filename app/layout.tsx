import type { Metadata } from "next";
import { Inter } from "next/font/google";
import type React from "react";
import { Temporal } from "temporal-polyfill";

import { ThemeProvider } from "@/components/theme-provider";
import "./globals.css";
import { AuthGuard } from "@/components/auth-guard";
import { AuthProvider } from "@/components/auth-provider";
import { TopNavigation } from "@/components/top-navigation";
import { Toaster } from "@/components/ui/sonner";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Spendro",
  description: "AI-powered expense tracking made simple.",
  generator: "v0.dev",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // Ensure Temporal polyfill is available globally
  if (typeof globalThis !== "undefined") {
    (globalThis as typeof globalThis & { Temporal: typeof Temporal }).Temporal =
      Temporal;
  }

  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <AuthProvider>
            <AuthGuard>
              <div className="min-h-screen w-full bg-muted/40">
                <TopNavigation />
                <main className="flex flex-1 flex-col">{children}</main>
              </div>
            </AuthGuard>
          </AuthProvider>
        </ThemeProvider>
        <Toaster richColors closeButton />
      </body>
    </html>
  );
}

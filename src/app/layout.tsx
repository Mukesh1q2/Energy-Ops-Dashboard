import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import "./leaflet.css";
import { Toaster } from "@/components/ui/toaster";
import { ToastProvider } from "@/contexts/toast-context";
import { ErrorBoundary } from "@/components/error-boundary";
import { SessionProvider } from "@/providers/session-provider";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Energy-Ops-Dashboard",
  description: "A web application for the analysis and visualization of power market data in India.",
  keywords: ["Energy", "Dashboard", "Power Market", "Data Visualization", "Next.js", "React"],
  authors: [{ name: "Energy-Ops Team" }],
  openGraph: {
    title: "Energy-Ops-Dashboard",
    description: "A web application for the analysis and visualization of power market data in India.",
    url: "/",
    siteName: "Energy-Ops-Dashboard",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Energy-Ops-Dashboard",
    description: "A web application for the analysis and visualization of power market data in India.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background text-foreground`}
      >
        <ErrorBoundary>
          <SessionProvider>
            <ToastProvider>
              {children}
              <Toaster />
              {/* <Sonner position="top-right" richColors /> */}
            </ToastProvider>
          </SessionProvider>
        </ErrorBoundary>
      </body>
    </html>
  );
}

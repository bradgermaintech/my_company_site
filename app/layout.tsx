import type { Metadata } from "next";
import { Inter } from "next/font/google";
import Script from "next/script";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap"
});

export const metadata: Metadata = {
  title: "AlignOps | Agency Pipeline Management",
  description:
    "A role-based operating system for software development agencies to manage bids, interviews, delivery, releases, and payments.",
  manifest: "/site.webmanifest",
  icons: {
    icon: [
      { url: "/favicon-32x32.png", sizes: "32x32", type: "image/png" },
      { url: "/favicon-48x48.png", sizes: "48x48", type: "image/png" },
      { url: "/favicon-96x96.png", sizes: "96x96", type: "image/png" },
      { url: "/favicon-16x16.png", sizes: "16x16", type: "image/png" },
      { url: "/favicon.ico" }
    ],
    apple: [{ url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" }]
  }
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <Script id="pipelineos-theme" strategy="beforeInteractive">
          {`
            (function () {
              try {
                var storedTheme = window.localStorage.getItem("pipelineos-theme");
                var prefersNight = window.matchMedia("(prefers-color-scheme: dark)").matches;
                var theme = storedTheme || (prefersNight ? "night" : "day");
                document.documentElement.classList.toggle("dark", theme === "night");
              } catch (error) {
                document.documentElement.classList.remove("dark");
              }
            })();
          `}
        </Script>
      </head>
      <body className={inter.className}>{children}</body>
    </html>
  );
}

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
  title: "PipelineOS | Agency Pipeline Management",
  description:
    "A role-based operating system for software development agencies to manage bids, interviews, delivery, releases, and payments."
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

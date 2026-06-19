import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

import Navbar from "@/components/Navbar";
import ChatbotWidget from "@/components/ChatbotWidget";

export const metadata: Metadata = {
  title: "AuraCart | AI-Powered Premium Store",
  description: "Experience the future of shopping with our custom catalog and intelligent AI sales assistant.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased dark`}
    >
      <body className="min-h-full flex flex-col bg-slate-950 text-white">
        <Navbar />
        <div className="flex-grow">{children}</div>
        <ChatbotWidget />
      </body>
    </html>
  );
}

import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/context/AuthContext";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "NexChat – Real-Time Chat",
  description:
    "A real-time one-to-one chat application built with Next.js, TypeScript, Tailwind CSS, and Appwrite.",
  keywords: ["chat", "real-time", "messaging", "nextjs", "appwrite"],
  authors: [{ name: "NexChat" }],
  openGraph: {
    title: "NexChat – Real-Time Chat",
    description: "Instant, secure one-to-one messaging powered by Appwrite.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}

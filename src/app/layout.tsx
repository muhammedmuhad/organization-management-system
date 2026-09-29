import "./globals.css";

import type { Metadata } from "next";

import AuthProvider from "@/components/providers/SessionProvider";

export const metadata: Metadata = {
  title: "Pandarakkandy Mahallu Management",
  description: "Mahallu Committee Management System",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
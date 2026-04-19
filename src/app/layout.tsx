import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import "./globals.css";

export async function generateMetadata(): Promise<Metadata> {
  const [nameRow, logoRow] = await Promise.all([
    prisma.settings.findUnique({ where: { key: "businessName" } }),
    prisma.settings.findUnique({ where: { key: "logoUrl" } }),
  ]);

  const businessName = nameRow?.value || "Garaj Cafe";
  const logoUrl = logoRow?.value;

  return {
    title: `${businessName} - QR Menü`,
    description: `${businessName} dijital menü`,
    ...(logoUrl && {
      icons: {
        icon: [{ url: logoUrl }],
        apple: [{ url: logoUrl }],
      },
    }),
  };
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="tr" className="h-full">
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}

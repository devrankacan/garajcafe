import { prisma } from "@/lib/prisma";
import "./globals.css";

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const [nameRow, logoRow] = await Promise.all([
    prisma.settings.findUnique({ where: { key: "businessName" } }),
    prisma.settings.findUnique({ where: { key: "logoUrl" } }),
  ]);

  const businessName = nameRow?.value || "Garaj Cafe";
  const logoUrl = logoRow?.value || "/favicon.ico";

  return (
    <html lang="tr" className="h-full">
      <head>
        <title>{businessName} - QR Menü</title>
        <link rel="icon" href={logoUrl} />
        <link rel="apple-touch-icon" href={logoUrl} />
      </head>
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}

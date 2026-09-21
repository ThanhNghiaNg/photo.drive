import type { Metadata } from "next";
import "./globals.css";

const siteName = process.env.NEXT_PUBLIC_SITE_NAME || "BIBPIX";

export const metadata: Metadata = {
  title: { default: siteName, template: `%s | ${siteName}` },
  description: "Thư viện ảnh giải chạy",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="vi">
      <body>{children}</body>
    </html>
  );
}

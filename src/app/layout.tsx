import type { Metadata } from "next";
import "./globals.css";
import { SiteHeader } from "@/components/site-header";

export const metadata: Metadata = {
  metadataBase: new URL((process.env.APP_BASE_URL ?? "http://localhost:3000").replace(/\/+$/, "")),
  applicationName: "Subsplit",
  title: {
    default: "Subsplit — Cheaper AI credits",
    template: "%s · Subsplit",
  },
  description:
    "Buy, loan, and track tokenized AI credits with model selection and low-balance notifications.",
  alternates: {
    canonical: "/",
  },
  icons: {
    icon: [{ url: "/favicon.svg", type: "image/svg+xml" }],
    apple: [{ url: "/apple-icon.svg", type: "image/svg+xml" }],
  },
  openGraph: {
    type: "website",
    siteName: "Subsplit",
    title: "Subsplit — Cheaper AI credits",
    description:
      "Buy, loan, and track tokenized AI credits with model selection and low-balance notifications.",
    url: "/",
  },
  twitter: {
    card: "summary_large_image",
    title: "Subsplit — Cheaper AI credits",
    description:
      "Buy, loan, and track tokenized AI credits with model selection and low-balance notifications.",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className="min-h-dvh bg-white text-zinc-950 antialiased"
      >
        <SiteHeader />
        {children}
      </body>
    </html>
  );
}

import type { Metadata } from "next";
import Script from "next/script";
import "./globals.css";
import { SiteHeader } from "@/components/site-header";
import { getSessionUser } from "@/server/auth";

export const metadata: Metadata = {
  metadataBase: new URL((process.env.APP_BASE_URL ?? "http://subsplit.co").replace(/\/+$/, "")),
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

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const user = await getSessionUser();

  return (
    <html lang="en">
      <body
        className="min-h-dvh bg-white text-zinc-950 antialiased"
      >
        <Script id="ms-clarity" strategy="afterInteractive">
          {`
            (function(c,l,a,r,i,t,y){
                c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};
                t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;
                y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);
            })(window, document, "clarity", "script", "w2cfg1k7gf");
          `}
        </Script>
        <SiteHeader user={user} />
        {children}
      </body>
    </html>
  );
}

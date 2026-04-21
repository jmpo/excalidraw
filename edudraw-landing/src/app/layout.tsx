import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "EduDraw — Pizarra y Mapas Mentales con IA",
  description: "EduDraw es tu herramienta de pizarra colaborativa y mapas mentales con IA. Transforma ideas en clases claras y visuales en minutos.",
  metadataBase: new URL("https://edudraw.chatea.click"),
  alternates: { canonical: "https://edudraw.chatea.click" },
  openGraph: {
    type: "website",
    url: "https://edudraw.chatea.click",
    title: "EduDraw — Pizarra y Mapas Mentales con IA",
    description: "Pizarra colaborativa y mapas mentales con IA para educadores.",
    images: [{ url: "/og-image.png", alt: "EduDraw" }],
    siteName: "EduDraw",
  },
  twitter: {
    card: "summary_large_image",
    title: "EduDraw — Pizarra y Mapas Mentales con IA",
    description: "Pizarra colaborativa y mapas mentales con IA para educadores.",
    images: ["/og-image.png"],
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <head>
        <link rel="preload" href="/fonts/Assistant-Regular.woff2" as="font" type="font/woff2" crossOrigin="anonymous" />
        <link rel="preload" href="/fonts/Assistant-Bold.woff2" as="font" type="font/woff2" crossOrigin="anonymous" />
        <link rel="preload" href="/fonts/excalifont.woff2" as="font" type="font/woff2" crossOrigin="anonymous" />
        <link rel="dns-prefetch" href="https://res.cloudinary.com" />
        <link rel="preconnect" href="https://res.cloudinary.com" crossOrigin="anonymous" />
        <link rel="dns-prefetch" href="https://budelidqeceqphdqelfc.supabase.co" />
        <link rel="preconnect" href="https://budelidqeceqphdqelfc.supabase.co" crossOrigin="anonymous" />
        {/* Meta Pixel — non-blocking, loads after idle */}
        <script dangerouslySetInnerHTML={{ __html: `(function(f){if(f.fbq)return;var n=f.fbq=function(){n.callMethod?n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];})(window);(window.requestIdleCallback||function(c){setTimeout(c,1)})(function(){var t=document.createElement('script');t.async=true;t.src='https://connect.facebook.net/en_US/fbevents.js';document.head.appendChild(t);fbq('init','1317317330261362');fbq('track','PageView');});` }} />
      </head>
      <body>
        {children}
        <noscript>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img height="1" width="1" style={{ display: "none" }} src="https://www.facebook.com/tr?id=1317317330261362&ev=PageView&noscript=1" alt="" />
        </noscript>
      </body>
    </html>
  );
}

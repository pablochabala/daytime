import type { Metadata, Viewport } from "next";
import "./globals.css";
import { Providers } from "@/components/providers";
import { Footer, Header } from "@/components/site-chrome";
import { Toaster } from "@/components/ui";


export const metadata: Metadata = {
  title: { default: "Daytime: hotels, lodges and apartments by the hour", template: "%s · Daytime" },
  description: "Great stays, by the hour, for a fraction of the price. Book hotels, lodges and apartments in Zambia for daytime use: hourly or day pass, up to 70% off the overnight rate.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#fffbf5" },
    { media: "(prefers-color-scheme: dark)", color: "#0b1220" },
  ],
};

// Apply the saved theme before first paint to avoid a flash.
const themeScript = `try{var t=JSON.parse(localStorage.getItem('dt.theme')||'"system"');if(t!=='system')document.documentElement.setAttribute('data-theme',t)}catch(e){}`;

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en-GB" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link rel="preconnect" href="https://cf.bstatic.com" />
        {/* eslint-disable-next-line @next/next/no-page-custom-font -- loaded via <link> because the dev machine's Node can't reach Google Fonts */}
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Outfit:wght@500;600;700&family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap"
        />
      </head>
      <body className="min-h-dvh antialiased">
        <Providers>
          <Header />
          <main id="main" tabIndex={-1} className="outline-none">
            {children}
          </main>
          <Footer />
          <Toaster />
        </Providers>
      </body>
    </html>
  );
}

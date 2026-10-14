import { Html, Head, Main, NextScript } from "next/document";

export default function Document() {
  return (
    <Html lang="en-NG">
      <Head>
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=Averia+Sans+Libre:ital,wght@0,300;0,400;0,700;1,300;1,400;1,700&display=swap"
          rel="stylesheet"
        />
        <link rel="icon" href="/assets/LOGO.svg" />

        {/* ── PWA / installable ─────────────────────────────────────────── */}
        {/* The app had no manifest, so it could not be installed to a home
            screen and had no re-engagement path. This is the minimum needed
            for Chrome/Safari install prompts. */}
        <link rel="manifest" href="/manifest.webmanifest" />
        <meta name="theme-color" content="#151413" />

        {/* iOS standalone behaviour */}
        <link rel="apple-touch-icon" href="/assets/LOGO.svg" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta
          name="apple-mobile-web-app-status-bar-style"
          content="black-translucent"
        />
        <meta name="apple-mobile-web-app-title" content="Jungles" />

        {/* Tell crawlers where the sitemap lives */}
        <link rel="sitemap" type="application/xml" href="/sitemap.xml" />
      </Head>
      <body>
        <Main />
        <NextScript />
      </body>
    </Html>
  );
}


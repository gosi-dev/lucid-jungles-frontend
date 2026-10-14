// components/NotFoundScreen.jsx — the shared not-found surface.
//
// Extracted from pages/404.js so that the dynamic /[username] route can show the
// same screen when a base doesn't exist, instead of rendering a fabricated
// profile. Extracting it (rather than importing the page from another page)
// keeps one copy of the markup and lets each caller tailor the copy.
//
// The canonical app had no 404 page at all, so every bad URL fell through to
// Next's default white-on-white error screen — a hard break in an app whose
// whole premise is a dark, immersive world. This keeps the design language
// (#151413 charcoal / #ABD49E sage) so a wrong turn still feels in-world.
//
// Adapted from CONSOLIDATED/client/pages/404.js, restyled to the canonical
// tokens and given the app's voice plus a way back that isn't just "/".

import Head from "next/head";
import Link from "next/link";
import { useRouter } from "next/router";
import { ArrowLeft, Compass, Home } from "lucide-react";

export default function NotFoundScreen({
  documentTitle = "Lost in the jungle — Lucid Jungles",
  eyebrow = "Error 404",
  title = "You wandered off the path",
  message = "This part of the jungle hasn't grown yet — or the trail you followed has closed. Either way, you're not lost. You've just found somewhere new.",
}) {
  const router = useRouter();

  return (
    <main className="min-h-[100dvh] bg-[#151413] text-[#ABD49E] flex flex-col items-center justify-center px-6">
      <Head>
        <title>{documentTitle}</title>
        <meta name="robots" content="noindex" />
      </Head>

      <div className="w-full max-w-md flex flex-col items-center text-center">
        <Compass
          className="w-10 h-10 mb-8 opacity-60"
          strokeWidth={1.25}
          aria-hidden="true"
        />

        <p className="font-mono text-xs tracking-[0.35em] uppercase opacity-50 mb-4">
          {eyebrow}
        </p>

        <h1 className="text-4xl sm:text-5xl font-bold tracking-tight mb-4">
          {title}
        </h1>

        <p className="text-sm sm:text-base opacity-70 leading-relaxed mb-10">
          {message}
        </p>

        <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
          <button
            type="button"
            onClick={() => router.back()}
            className="h-[46px] px-6 inline-flex items-center justify-center gap-2 border border-[#ABD49E]/30 text-[#ABD49E] text-sm font-semibold uppercase tracking-wider hover:border-[#ABD49E]/70 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" aria-hidden="true" />
            Go back
          </button>

          <Link
            href="/"
            className="h-[46px] px-6 inline-flex items-center justify-center gap-2 bg-[#ABD49E] text-[#151413] text-sm font-semibold uppercase tracking-wider hover:opacity-90 transition-opacity"
          >
            <Home className="w-4 h-4" aria-hidden="true" />
            Back to base
          </Link>
        </div>
      </div>
    </main>
  );
}

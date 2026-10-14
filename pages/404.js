// pages/404.js — Not Found
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

export default function NotFound() {
  const router = useRouter();

  return (
    <>
      <Head>
        <title>Lost in the jungle — Lucid Jungles</title>
        <meta name="robots" content="noindex" />
      </Head>

      <main className="min-h-[100dvh] bg-[#151413] text-[#ABD49E] flex flex-col items-center justify-center px-6">
        <div className="w-full max-w-md flex flex-col items-center text-center">
          <Compass
            className="w-10 h-10 mb-8 opacity-60"
            strokeWidth={1.25}
            aria-hidden="true"
          />

          <p className="font-mono text-xs tracking-[0.35em] uppercase opacity-50 mb-4">
            Error 404
          </p>

          <h1 className="text-4xl sm:text-5xl font-bold tracking-tight mb-4">
            You wandered off the path
          </h1>

          <p className="text-sm sm:text-base opacity-70 leading-relaxed mb-10">
            This part of the jungle hasn&apos;t grown yet — or the trail you
            followed has closed. Either way, you&apos;re not lost. You&apos;ve
            just found somewhere new.
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
    </>
  );
}

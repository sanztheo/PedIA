"use client";

import { useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { useSSE } from "@/hooks/useSSE";
import { GenerationProgress } from "@/components/generation/GenerationProgress";
import { Loader2, ArrowRight, Sparkles, CheckCircle2 } from "lucide-react";

function SearchContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const query = searchParams.get("q");

  const {
    status,
    currentStep,
    completedSteps,
    content,
    entities,
    error,
    page,
    generate,
    reset,
  } = useSSE();

  useEffect(() => {
    if (query && status === "idle") {
      generate(query);
    }
  }, [query, status, generate]);

  useEffect(() => {
    if (status === "complete" && page) {
      const timer = setTimeout(() => {
        router.push(`/wiki/${page.slug}`);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [status, page, router]);

  if (!query) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <Header />
        <main className="flex-1 flex items-center justify-center px-6">
          <div className="text-center space-y-4">
            <h1 className="text-xl font-medium">Aucune recherche</h1>
            <p className="text-sm text-muted-foreground">
              Veuillez effectuer une recherche depuis la page d&apos;accueil.
            </p>
            <button
              onClick={() => router.push("/")}
              className="text-sm text-muted-foreground hover:text-foreground underline underline-offset-4 transition-colors"
            >
              Retour à l&apos;accueil
            </button>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />

      <main className="flex-1 px-6 py-8">
        <div className="max-w-2xl mx-auto space-y-8">
          <div className="space-y-1">
            <p className="text-sm text-muted-foreground">
              {status === "complete" ? "Génération terminée" : "Génération en cours"}
            </p>
            <h1 className="text-2xl font-semibold tracking-tight">{query}</h1>
          </div>

          {/* Progress */}
          <GenerationProgress
            currentStep={currentStep}
            completedSteps={completedSteps}
            content={content}
            entities={entities}
            error={error}
          />

          {status === "complete" && page && (
            <div className="relative overflow-hidden rounded-2xl border border-green-500/30 bg-gradient-to-br from-green-500/10 via-emerald-500/5 to-transparent p-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="absolute top-0 right-0 size-32 bg-green-500/10 blur-3xl rounded-full -translate-y-1/2 translate-x-1/2" />
              <div className="absolute bottom-0 left-0 size-24 bg-emerald-500/10 blur-2xl rounded-full translate-y-1/2 -translate-x-1/2" />
              
              <div className="relative space-y-6">
                <div className="flex items-center gap-3">
                  <div className="flex items-center justify-center size-10 rounded-full bg-green-500/20 text-green-500">
                    <CheckCircle2 className="size-5" />
                  </div>
                  <div>
                    <p className="text-sm text-green-500 font-medium flex items-center gap-2">
                      <Sparkles className="size-3" />
                      Article généré avec succès
                    </p>
                    <h3 className="text-lg font-semibold text-foreground">{page.title}</h3>
                  </div>
                </div>

                <button
                  onClick={() => router.push(`/wiki/${page.slug}`)}
                  className="group w-full flex items-center justify-center gap-3 h-14 px-8 rounded-xl bg-gradient-to-r from-green-500 to-emerald-500 text-white font-semibold text-lg shadow-lg shadow-green-500/25 hover:shadow-xl hover:shadow-green-500/30 hover:scale-[1.02] active:scale-[0.98] transition-all duration-200"
                >
                  <span>Voir l&apos;article</span>
                  <ArrowRight className="size-5 group-hover:translate-x-1 transition-transform" />
                </button>

                <p className="text-center text-xs text-muted-foreground">
                  Redirection automatique dans quelques secondes...
                </p>
              </div>
            </div>
          )}

          {/* Error state */}
          {status === "error" && (
            <div className="flex items-center justify-between p-4 border border-destructive/50 rounded-lg">
              <span className="text-sm text-destructive">
                Une erreur est survenue
              </span>
              <button
                onClick={() => {
                  reset();
                  generate(query);
                }}
                className="text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                Réessayer
              </button>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

function Header() {
  return (
    <header className="border-b border-border">
      <div className="max-w-screen-lg mx-auto px-6 h-14 flex items-center justify-between">
        <Link href="/" className="hover:opacity-70 transition-opacity">
          <Image
            src="/logo/logo_no_bg.svg"
            alt="PedIA"
            width={28}
            height={28}
            className="opacity-90"
          />
        </Link>
        <nav className="flex items-center gap-6">
          <Link
            href="/explore"
            className="text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            Explorer
          </Link>
        </nav>
      </div>
    </header>
  );
}

export default function SearchPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-background flex items-center justify-center">
          <Loader2 className="size-5 text-muted-foreground animate-spin" />
        </div>
      }
    >
      <SearchContent />
    </Suspense>
  );
}

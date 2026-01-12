"use client";

import { useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { useSSE } from "@/hooks/useSSE";
import { GenerationProgress } from "@/components/generation/GenerationProgress";
import { SuccessCard } from "@/components/generation/SuccessCard";
import { Loader2 } from "lucide-react";

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
      }, 2500); // Time to see the success animation
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

          {status === "complete" && page && <SuccessCard page={page} />}

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

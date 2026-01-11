"use client";

import { useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useSSE } from "@/hooks/useSSE";
import { GenerationProgress } from "@/components/generation/GenerationProgress";

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
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [status, page, router]);

  if (!query) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
            Aucune recherche
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            Veuillez effectuer une recherche depuis la page d&apos;accueil.
          </p>
          <button
            onClick={() => router.push("/")}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Retour à l&apos;accueil
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        <header className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            {query}
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            {status === "loading" && "Génération en cours..."}
            {status === "complete" && "Article généré avec succès !"}
            {status === "error" && "Une erreur est survenue"}
          </p>
        </header>

        <GenerationProgress
          currentStep={currentStep}
          completedSteps={completedSteps}
          content={content}
          entities={entities}
          error={error}
        />

        {status === "complete" && page && (
          <div className="mt-8 text-center">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300 rounded-lg">
              <span>✓</span>
              <span>Redirection vers l&apos;article...</span>
            </div>
            <p className="mt-4">
              <button
                onClick={() => router.push(`/wiki/${page.slug}`)}
                className="text-blue-600 dark:text-blue-400 hover:underline"
              >
                Cliquez ici si vous n&apos;êtes pas redirigé
              </button>
            </p>
          </div>
        )}

        {status === "error" && (
          <div className="mt-8 text-center">
            <button
              onClick={() => {
                reset();
                generate(query);
              }}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Réessayer
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default function SearchPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" />
        </div>
      }
    >
      <SearchContent />
    </Suspense>
  );
}

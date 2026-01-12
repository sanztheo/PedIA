"use client";

import { useEffect, useRef } from "react";
import type { GenerationStep } from "@/types";

interface GenerationProgressProps {
  currentStep: GenerationStep | null;
  completedSteps: GenerationStep[];
  content: string;
  entities: { name: string; type: string }[];
  error: string | null;
}

const STEPS: { id: GenerationStep; label: string; icon: string }[] = [
  { id: "search", label: "Recherche web", icon: "🔍" },
  { id: "analyze", label: "Analyse des sources", icon: "📊" },
  { id: "generate", label: "Génération", icon: "✨" },
  { id: "extract", label: "Extraction entités", icon: "🏷️" },
  { id: "save", label: "Sauvegarde", icon: "💾" },
];

const ENTITY_COLORS: Record<string, string> = {
  PERSON: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
  ORGANIZATION:
    "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
  LOCATION: "bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200",
  EVENT:
    "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200",
  CONCEPT: "bg-pink-100 text-pink-800 dark:bg-pink-900 dark:text-pink-200",
  WORK: "bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200",
  OTHER: "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200",
};

export function GenerationProgress({
  currentStep,
  completedSteps,
  content,
  entities,
  error,
}: GenerationProgressProps) {
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (contentRef.current) {
      contentRef.current.scrollTop = contentRef.current.scrollHeight;
    }
  }, [content]);

  const getStepStatus = (stepId: GenerationStep) => {
    if (completedSteps.includes(stepId)) return "complete";
    if (currentStep === stepId) return "current";
    return "pending";
  };

  return (
    <div className="w-full max-w-4xl mx-auto space-y-6">
      {error && (
        <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
          <p className="text-red-700 dark:text-red-300">{error}</p>
        </div>
      )}

      <div className="bg-card rounded-lg shadow-sm border border-border p-4">
        <h3 className="text-sm font-medium text-muted-foreground mb-4">
          Progression
        </h3>
        <div className="space-y-3">
          {STEPS.map((step) => {
            const status = getStepStatus(step.id);
            return (
              <div key={step.id} className="flex items-center gap-3">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-sm ${
                    status === "complete"
                      ? "bg-green-100 dark:bg-green-900"
                      : status === "current"
                        ? "bg-blue-100 dark:bg-blue-900 animate-pulse"
                        : "bg-muted"
                  }`}
                >
                  {status === "complete" ? (
                    <span className="text-green-600 dark:text-green-400">
                      ✓
                    </span>
                  ) : status === "current" ? (
                    <span className="animate-spin">⏳</span>
                  ) : (
                    <span className="text-gray-400">{step.icon}</span>
                  )}
                </div>
                <span
                  className={`text-sm ${
                    status === "complete"
                      ? "text-green-700 dark:text-green-300"
                      : status === "current"
                        ? "text-blue-700 dark:text-blue-300 font-medium"
                        : "text-gray-400 dark:text-gray-500"
                  }`}
                >
                  {step.label}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {content && (
        <div className="bg-card rounded-lg shadow-sm border border-border p-4">
          <h3 className="text-sm font-medium text-muted-foreground mb-4">
            Contenu généré
          </h3>
          <div
            ref={contentRef}
            className="prose prose-sm dark:prose-invert max-h-96 overflow-y-auto"
          >
            <div className="whitespace-pre-wrap font-mono text-xs">
              {content}
              {currentStep === "generate" && (
                <span className="inline-block w-2 h-4 bg-blue-500 animate-pulse ml-1" />
              )}
            </div>
          </div>
        </div>
      )}

      {entities.length > 0 && (
        <div className="bg-card rounded-lg shadow-sm border border-border p-4">
          <h3 className="text-sm font-medium text-muted-foreground mb-4">
            Entités détectées ({entities.length})
          </h3>
          <div className="flex flex-wrap gap-2">
            {entities.map((entity, index) => (
              <span
                key={`${entity.name}-${index}`}
                className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                  ENTITY_COLORS[entity.type] || ENTITY_COLORS.OTHER
                }`}
              >
                {entity.name}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default GenerationProgress;

"use client";

import { useEffect, useRef } from "react";
import { Check, Loader2 } from "lucide-react";
import type { GenerationStep } from "@/types";

interface GenerationProgressProps {
  currentStep: GenerationStep | null;
  completedSteps: GenerationStep[];
  content: string;
  entities: { name: string; type: string }[];
  error: string | null;
}

const STEPS: { id: GenerationStep; label: string }[] = [
  { id: "search", label: "Recherche web" },
  { id: "analyze", label: "Analyse des sources" },
  { id: "generate", label: "Génération" },
  { id: "extract", label: "Extraction entités" },
  { id: "save", label: "Sauvegarde" },
];

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
    <div className="space-y-6">
      {/* Error */}
      {error && (
        <div className="p-4 border border-destructive/50 rounded-lg">
          <p className="text-sm text-destructive">{error}</p>
        </div>
      )}

      {/* Steps */}
      <div className="border border-border rounded-lg divide-y divide-border">
        {STEPS.map((step) => {
          const status = getStepStatus(step.id);
          return (
            <div
              key={step.id}
              className="flex items-center justify-between px-4 py-3"
            >
              <span
                className={`text-sm ${
                  status === "pending"
                    ? "text-muted-foreground"
                    : "text-foreground"
                }`}
              >
                {step.label}
              </span>
              <div className="flex items-center">
                {status === "complete" && (
                  <Check className="size-4 text-foreground" />
                )}
                {status === "current" && (
                  <Loader2 className="size-4 text-muted-foreground animate-spin" />
                )}
                {status === "pending" && <div className="size-4" />}
              </div>
            </div>
          );
        })}
      </div>

      {/* Content preview */}
      {content && (
        <div className="border border-border rounded-lg">
          <div className="px-4 py-3 border-b border-border">
            <span className="text-sm text-muted-foreground">Aperçu</span>
          </div>
          <div ref={contentRef} className="p-4 max-h-64 overflow-y-auto">
            <div className="text-sm text-muted-foreground font-mono whitespace-pre-wrap">
              {content}
              {currentStep === "generate" && (
                <span className="inline-block w-1.5 h-4 bg-foreground ml-0.5 animate-pulse" />
              )}
            </div>
          </div>
        </div>
      )}

      {/* Entities */}
      {entities.length > 0 && (
        <div className="border border-border rounded-lg">
          <div className="px-4 py-3 border-b border-border">
            <span className="text-sm text-muted-foreground">
              Entités ({entities.length})
            </span>
          </div>
          <div className="p-4 flex flex-wrap gap-2">
            {entities.map((entity, index) => (
              <span
                key={`${entity.name}-${index}`}
                className="inline-flex items-center px-2 py-1 rounded border border-border text-xs"
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

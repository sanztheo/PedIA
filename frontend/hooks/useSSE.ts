"use client";

import { useState, useCallback, useRef } from "react";
import type { SSEEvent, GenerationStep } from "@/types";
import { createSSEConnection, createMockSSE } from "@/lib/sse";
import { api } from "@/lib/api";

export type GenerationStatus = "idle" | "loading" | "complete" | "error";

export interface UseSSEState {
  status: GenerationStatus;
  currentStep: GenerationStep | null;
  completedSteps: GenerationStep[];
  content: string;
  entities: { name: string; type: string }[];
  error: string | null;
  page: { id: string; slug: string; title: string } | null;
}

export interface UseSSEReturn extends UseSSEState {
  generate: (query: string) => void;
  reset: () => void;
}

const USE_MOCK = process.env.NEXT_PUBLIC_USE_MOCK_SSE === "true";

const initialState: UseSSEState = {
  status: "idle",
  currentStep: null,
  completedSteps: [],
  content: "",
  entities: [],
  error: null,
  page: null,
};

export function useSSE(): UseSSEReturn {
  const [state, setState] = useState<UseSSEState>(initialState);
  const closeRef = useRef<(() => void) | null>(null);

  const handleEvent = useCallback((event: SSEEvent) => {
    switch (event.type) {
      case "step_start":
        setState((prev) => ({
          ...prev,
          currentStep: event.step || null,
        }));
        break;

      case "step_complete":
        setState((prev) => ({
          ...prev,
          completedSteps: event.step
            ? [...prev.completedSteps, event.step]
            : prev.completedSteps,
          currentStep: null,
        }));
        break;

      case "content_chunk":
        setState((prev) => ({
          ...prev,
          content:
            prev.content +
            ((event.data as { content?: string })?.content || ""),
        }));
        break;

      case "entity_found":
        setState((prev) => ({
          ...prev,
          entities: [
            ...prev.entities,
            (event.data as { entity: { name: string; type: string } })?.entity,
          ].filter(Boolean),
        }));
        break;

      case "complete":
        setState((prev) => ({
          ...prev,
          status: "complete",
          page:
            (
              event.data as {
                page: { id: string; slug: string; title: string };
              }
            )?.page || null,
        }));
        break;

      case "error":
        setState((prev) => ({
          ...prev,
          status: "error",
          error: event.message || "Une erreur est survenue",
        }));
        break;
    }
  }, []);

  const generate = useCallback(
    (query: string) => {
      if (closeRef.current) {
        closeRef.current();
      }

      setState({ ...initialState, status: "loading" });

      if (USE_MOCK) {
        closeRef.current = createMockSSE(query, handleEvent);
      } else {
        const url = api.generate.url(query);
        closeRef.current = createSSEConnection(url, handleEvent, (error) => {
          setState((prev) => ({
            ...prev,
            status: "error",
            error: error.message,
          }));
        });
      }
    },
    [handleEvent],
  );

  const reset = useCallback(() => {
    if (closeRef.current) {
      closeRef.current();
      closeRef.current = null;
    }
    setState(initialState);
  }, []);

  return {
    ...state,
    generate,
    reset,
  };
}

export default useSSE;

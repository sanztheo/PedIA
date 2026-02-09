"use client";

import { useState, useCallback, useRef } from "react";
import type { SSEEvent, GenerationStep } from "@/types";
import { createSSEConnection, createMockSSE } from "@/lib/sse";
import { api } from "@/lib/api";

export type GenerationStatus = "idle" | "loading" | "complete" | "error" | "existing";

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
          content: prev.content + (event.content || ""),
        }));
        break;

      case "entity_found":
        if (event.entity) {
          setState((prev) => ({
            ...prev,
            entities: [...prev.entities, event.entity!],
          }));
        }
        break;

      case "complete":
        setState((prev) => ({
          ...prev,
          status: "complete",
          page: event.page || null,
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
    async (query: string) => {
      if (closeRef.current) {
        closeRef.current();
      }

      setState({ ...initialState, status: "loading" });

      if (USE_MOCK) {
        closeRef.current = createMockSSE(query, handleEvent);
        return;
      }

      // First, check if page exists via a fetch request
      try {
        const checkUrl = api.generate.url(query);
        const response = await fetch(checkUrl, {
          method: 'GET',
          headers: { 'Accept': 'application/json' },
        });
        
        const contentType = response.headers.get('content-type') || '';
        
        // If response is JSON, it means the page exists
        if (contentType.includes('application/json')) {
          const data = await response.json();
          
          if (data.type === 'existing' && data.page) {
            setState((prev) => ({
              ...prev,
              status: "existing",
              page: data.page,
            }));
            return;
          }
        }
        
        // Otherwise, open SSE connection for generation
        // We need to make a new request since the first one already consumed the response
        closeRef.current = createSSEConnection(checkUrl, handleEvent, (error) => {
          setState((prev) => ({
            ...prev,
            status: "error",
            error: error.message,
          }));
        });
      } catch (error) {
        setState((prev) => ({
          ...prev,
          status: "error",
          error: error instanceof Error ? error.message : "Une erreur est survenue",
        }));
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

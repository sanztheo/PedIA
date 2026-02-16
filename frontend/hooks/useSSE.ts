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
  const isGeneratingRef = useRef(false);

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
      if (isGeneratingRef.current) {
        return;
      }
      isGeneratingRef.current = true;

      if (closeRef.current) {
        closeRef.current();
      }

      setState({ ...initialState, status: "loading" });

      if (USE_MOCK) {
        closeRef.current = createMockSSE(query, handleEvent);
        return;
      }

      // Create a controller for the pre-check fetch
      const controller = new AbortController();
      closeRef.current = () => controller.abort();

      const url = api.generate.url(query);

      // Pre-check if page exists to handle JSON response
      try {
        const response = await fetch(url, { 
          cache: "no-store",
          signal: controller.signal 
        });
        const contentType = response.headers.get('content-type');
        
        // If it's JSON, it means the page already exists
        if (contentType?.includes('application/json')) {
          const data = await response.json();
          if (data.type === 'existing' && data.page) {
            setState({
              ...initialState,
              status: "existing",
              page: data.page,
            });
            isGeneratingRef.current = false;
            return;
          }
        }
      } catch (error) {
        if (error instanceof Error && error.name === 'AbortError') {
          return;
        }
        console.error("Pre-check failed, proceeding with SSE:", error);
      }

      // If we're here, we need to start SSE
      // Only start if not aborted
      if (controller.signal.aborted) return;

      closeRef.current = createSSEConnection(
        url,
        (event) => {
          handleEvent(event);
          if (event.type === "complete" || event.type === "error") {
            isGeneratingRef.current = false;
          }
        },
        (error) => {
          setState((prev) => ({
            ...prev,
            status: "error",
            error: error.message,
          }));
          isGeneratingRef.current = false;
        }
      );
    },
    [handleEvent],
  );

  const reset = useCallback(() => {
    if (closeRef.current) {
      closeRef.current();
      closeRef.current = null;
    }
    isGeneratingRef.current = false;
    setState(initialState);
  }, []);

  return {
    ...state,
    generate,
    reset,
  };
}

export default useSSE;

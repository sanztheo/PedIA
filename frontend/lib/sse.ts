import type { SSEEvent, GenerationStep } from "@/types";

export type SSECallback = (event: SSEEvent) => void;

export function createSSEConnection(
  url: string,
  onEvent: SSECallback,
  onError?: (error: Error) => void,
): () => void {
  const eventSource = new EventSource(url);

  // Handle generic messages (fallback)
  eventSource.onmessage = (event) => {
    try {
      const data = JSON.parse(event.data) as SSEEvent;
      onEvent(data);
    } catch {
      console.error("Failed to parse SSE event:", event.data);
    }
  };

  // Handle named events from server
  eventSource.addEventListener("step", (event) => {
    try {
      const data = JSON.parse((event as MessageEvent).data) as SSEEvent;
      onEvent(data);
    } catch {
      console.error("Failed to parse step event");
    }
  });

  eventSource.addEventListener("content", (event) => {
    try {
      const data = JSON.parse((event as MessageEvent).data) as SSEEvent;
      onEvent(data);
    } catch {
      console.error("Failed to parse content event");
    }
  });

  eventSource.addEventListener("entity", (event) => {
    try {
      const data = JSON.parse((event as MessageEvent).data) as SSEEvent;
      onEvent(data);
    } catch {
      console.error("Failed to parse entity event");
    }
  });

  eventSource.addEventListener("complete", (event) => {
    try {
      const data = JSON.parse((event as MessageEvent).data) as SSEEvent;
      onEvent(data);
      eventSource.close();
    } catch {
      console.error("Failed to parse complete event");
    }
  });

  // Handle server-sent error events (named "error" events from server)
  // This is different from connection errors (handled by onerror)
  eventSource.addEventListener("error", (event) => {
    // Check if this is a MessageEvent with data (server-sent error)
    const messageEvent = event as MessageEvent;
    if (messageEvent.data) {
      try {
        const data = JSON.parse(messageEvent.data) as SSEEvent;
        onEvent(data);
      } catch {
        console.error("Failed to parse server error event");
      }
      // Only close on server-sent errors (with data)
      // Browser-internal errors (no data) are handled by onerror
      eventSource.close();
    }
  });

  // Handle connection errors (network issues, server unavailable, etc.)
  eventSource.onerror = () => {
    // Only trigger error callback if connection is truly failed
    // EventSource.CLOSED = 2, EventSource.CONNECTING = 0
    if (eventSource.readyState === EventSource.CLOSED) {
      onError?.(new Error("SSE connection failed"));
    } else if (eventSource.readyState === EventSource.CONNECTING) {
      // Connection is attempting to reconnect, don't error yet
      console.warn("SSE connection interrupted, attempting to reconnect...");
    }
  };

  return () => eventSource.close();
}

const MOCK_DELAYS: Record<GenerationStep, number> = {
  search: 1500,
  analyze: 2000,
  generate: 3000,
  extract: 1000,
  save: 500,
};

export function createMockSSE(
  _query: string,
  onEvent: SSECallback,
): () => void {
  let cancelled = false;
  const steps: GenerationStep[] = [
    "search",
    "analyze",
    "generate",
    "extract",
    "save",
  ];

  async function runMock() {
    for (const step of steps) {
      if (cancelled) return;

      onEvent({
        type: "step_start",
        step,
        message: getStepMessage(step),
      });

      await delay(MOCK_DELAYS[step]);
      if (cancelled) return;

      if (step === "generate") {
        const chunks = [
          "# Tesla\n\n",
          "Tesla, Inc. est une entreprise américaine ",
          "spécialisée dans les véhicules électriques, ",
          "le stockage d'énergie et les panneaux solaires.\n\n",
          "## Histoire\n\n",
          "Fondée en 2003 par Martin Eberhard et Marc Tarpenning, ",
          "l'entreprise a été rejointe par Elon Musk en 2004.\n\n",
        ];

        for (const chunk of chunks) {
          if (cancelled) return;
          onEvent({ type: "content_chunk", content: chunk });
          await delay(200);
        }
      }

      if (step === "extract") {
        const entities = [
          { name: "Elon Musk", type: "PERSON" as const },
          { name: "SpaceX", type: "ORGANIZATION" as const },
          { name: "Palo Alto", type: "LOCATION" as const },
        ];

        for (const entity of entities) {
          if (cancelled) return;
          onEvent({ type: "entity_found", entity });
          await delay(300);
        }
      }

      onEvent({ type: "step_complete", step });
    }

    if (!cancelled) {
      onEvent({
        type: "complete",
        page: {
          id: "mock-id",
          slug: "tesla",
          title: "Tesla",
        },
      });
    }
  }

  runMock();

  return () => {
    cancelled = true;
  };
}

function getStepMessage(step: GenerationStep): string {
  const messages: Record<GenerationStep, string> = {
    search: "Recherche web en cours...",
    analyze: "Analyse des sources...",
    generate: "Génération du contenu...",
    extract: "Extraction des entités...",
    save: "Sauvegarde...",
  };
  return messages[step];
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

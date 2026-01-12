"use client";

import { useState, useEffect, useCallback } from "react";
import { api } from "@/lib/api";
import type { GraphData } from "@/types";

interface UseGraphOptions {
  pageId?: string;
  depth?: number;
  limit?: number;
}

interface UseGraphReturn {
  data: GraphData | null;
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

export function useGraph(options: UseGraphOptions = {}): UseGraphReturn {
  const { pageId, depth = 2, limit = 100 } = options;

  const [data, setData] = useState<GraphData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchGraph = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const result = pageId
        ? await api.graph.local(pageId, depth)
        : await api.graph.full({ limit });

      if (result.error) {
        setError(result.error);
        setData(null);
      } else if (result.data) {
        setData(result.data);
      }
    } catch {
      setError("Erreur lors du chargement du graph");
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [pageId, depth, limit]);

  useEffect(() => {
    fetchGraph();
  }, [fetchGraph]);

  return {
    data,
    loading,
    error,
    refetch: fetchGraph,
  };
}

export default useGraph;

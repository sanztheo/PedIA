import type {
  Page,
  PageVersion,
  GraphData,
  SearchResult,
  APIResponse,
  PaginatedResponse,
} from "@/types";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

async function fetchAPI<T>(
  endpoint: string,
  options?: RequestInit,
): Promise<APIResponse<T>> {
  try {
    const res = await fetch(`${API_URL}${endpoint}`, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        ...options?.headers,
      },
    });

    if (!res.ok) {
      const error = await res.json().catch(() => ({ error: "Request failed" }));
      return { error: error.error || `HTTP ${res.status}` };
    }

    const data = await res.json();
    return { data };
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Network error" };
  }
}

export const api = {
  pages: {
    list: (params?: { page?: number; limit?: number }) =>
      fetchAPI<PaginatedResponse<Page>>(
        `/api/pages?page=${params?.page || 1}&limit=${params?.limit || 20}`,
      ),

    get: (slug: string) => fetchAPI<Page>(`/api/pages/${slug}?entities=true`),

    search: (query: string) =>
      fetchAPI<{ results: SearchResult[]; total: number }>(
        `/api/search?q=${encodeURIComponent(query)}`,
      ),
  },

  versions: {
    list: (pageId: string) =>
      fetchAPI<PageVersion[]>(`/api/pages/${pageId}/versions`),

    get: (pageId: string, version: number) =>
      fetchAPI<PageVersion>(`/api/pages/${pageId}/versions/${version}`),

    rollback: (pageId: string, version: number) =>
      fetchAPI<{ page: Page; newVersion: PageVersion }>(
        `/api/pages/${pageId}/versions/${version}/rollback`,
        { method: "POST" },
      ),
  },

  graph: {
    full: (params?: { limit?: number; offset?: number }) =>
      fetchAPI<GraphData>(
        `/api/graph?limit=${params?.limit || 100}&offset=${params?.offset || 0}`,
      ),

    local: (pageId: string, depth = 2) =>
      fetchAPI<GraphData>(`/api/graph/local/${pageId}?depth=${depth}`),

    entity: (entityId: string) =>
      fetchAPI<{ entity: unknown; relations: unknown[] }>(
        `/api/graph/entity/${entityId}`,
      ),
  },

  generate: {
    url: (query: string) =>
      `${API_URL}/api/generate?q=${encodeURIComponent(query)}`,
  },
};

export default api;

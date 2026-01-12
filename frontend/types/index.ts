export type SSEEventType =
  | "step_start"
  | "step_complete"
  | "step_error"
  | "content_chunk"
  | "entity_found"
  | "complete"
  | "error";

export type GenerationStep =
  | "search"
  | "analyze"
  | "generate"
  | "extract"
  | "save";

export type EntityType =
  | "PERSON"
  | "ORGANIZATION"
  | "LOCATION"
  | "EVENT"
  | "CONCEPT"
  | "WORK"
  | "OTHER";

export type PageStatus = "DRAFT" | "GENERATING" | "PUBLISHED" | "ERROR";

export interface SSEEvent {
  type: SSEEventType;
  step?: GenerationStep;
  data?: unknown;
  message?: string;
  // Direct properties sent by backend (not nested in data)
  content?: string;
  entity?: { name: string; type: string };
  page?: { id: string; slug: string; title: string };
}

export interface StepStartEvent extends SSEEvent {
  type: "step_start";
  step: GenerationStep;
  details?: string;
}

export interface StepCompleteEvent extends SSEEvent {
  type: "step_complete";
  step: GenerationStep;
}

export interface ContentChunkEvent extends SSEEvent {
  type: "content_chunk";
  content: string;
}

export interface EntityFoundEvent extends SSEEvent {
  type: "entity_found";
  entity: {
    name: string;
    type: EntityType;
  };
}

export interface CompleteEvent extends SSEEvent {
  type: "complete";
  page: {
    id: string;
    slug: string;
    title: string;
  };
}

export interface ErrorEvent extends SSEEvent {
  type: "error";
  message: string;
}

export interface Page {
  id: string;
  slug: string;
  title: string;
  content: string;
  summary: string | null;
  status: PageStatus;
  viewCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface Entity {
  id: string;
  name: string;
  normalizedName: string;
  type: EntityType;
  description: string | null;
}

export interface PageWithEntities extends Page {
  entities: {
    entity: Entity;
    relevance: number;
  }[];
}

export interface GraphNode {
  id: string;
  label: string;
  slug?: string;
  type: "page" | "entity";
  entityType?: EntityType;
}

export interface GraphLink {
  source: string;
  target: string;
  type?: string;
}

export interface GraphData {
  nodes: GraphNode[];
  links: GraphLink[];
}

export interface SearchResult {
  id: string;
  slug: string;
  title: string;
  summary: string | null;
  score: number;
}

export interface APIResponse<T> {
  data?: T;
  error?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
}

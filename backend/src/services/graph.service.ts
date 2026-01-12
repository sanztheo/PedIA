import prisma from "../lib/prisma";
import { getCache, setCache } from "../lib/redis";
import type { GraphNode, GraphLink, GraphData } from "../types";

const GRAPH_CACHE_TTL = 1800;

export interface GetFullGraphOptions {
  limit?: number;
  offset?: number;
}

export const GraphService = {
  async getFullGraph(options: GetFullGraphOptions = {}): Promise<GraphData & { total: number }> {
    const { limit = 100, offset = 0 } = options;

    const cacheKey = `graph:full:${limit}:${offset}`;
    const cached = await getCache<GraphData & { total: number }>(cacheKey);
    if (cached) return cached;

    const [pages, entities, pageEntities, entityRelations, totalPages, totalEntities] =
      await Promise.all([
        prisma.page.findMany({
          where: { status: "PUBLISHED" },
          select: { id: true, title: true, slug: true },
          orderBy: { createdAt: "desc" },
          take: limit,
          skip: offset,
        }),
        prisma.entity.findMany({
          select: { id: true, name: true, type: true },
          take: limit,
          skip: offset,
        }),
        prisma.pageEntity.findMany({
          select: { pageId: true, entityId: true },
        }),
        prisma.entityRelation.findMany({
          select: { fromEntityId: true, toEntityId: true, type: true },
        }),
        prisma.page.count({ where: { status: "PUBLISHED" } }),
        prisma.entity.count(),
      ]);

    const nodes: GraphNode[] = [
      ...pages.map((p) => ({
        id: p.id,
        label: p.title,
        slug: p.slug,
        type: "page" as const,
      })),
      ...entities.map((e) => ({
        id: e.id,
        label: e.name,
        type: "entity" as const,
        entityType: e.type,
      })),
    ];

    const nodeIds = new Set(nodes.map((n) => n.id));

    const links: GraphLink[] = [
      ...pageEntities
        .filter((pe) => nodeIds.has(pe.pageId) && nodeIds.has(pe.entityId))
        .map((pe) => ({
          source: pe.pageId,
          target: pe.entityId,
          type: "mentions",
        })),
      ...entityRelations
        .filter((er) => nodeIds.has(er.fromEntityId) && nodeIds.has(er.toEntityId))
        .map((er) => ({
          source: er.fromEntityId,
          target: er.toEntityId,
          type: er.type,
        })),
    ];

    const result = {
      nodes,
      links,
      total: totalPages + totalEntities,
    };

    await setCache(cacheKey, result, GRAPH_CACHE_TTL);
    return result;
  },

  async getLocalGraph(pageId: string, depth: number = 2): Promise<GraphData> {
    const cacheKey = `graph:local:${pageId}:${depth}`;
    const cached = await getCache<GraphData>(cacheKey);
    if (cached) return cached;

    const page = await prisma.page.findUnique({
      where: { id: pageId },
      select: { id: true, title: true, slug: true },
    });

    if (!page) {
      return { nodes: [], links: [] };
    }

    const pageEntities = await prisma.pageEntity.findMany({
      where: { pageId },
      include: { entity: true },
    });

    const entityIds = pageEntities.map((pe) => pe.entityId);

    const relatedEntities =
      depth > 1
        ? await prisma.entityRelation.findMany({
            where: {
              OR: [{ fromEntityId: { in: entityIds } }, { toEntityId: { in: entityIds } }],
            },
            include: {
              fromEntity: true,
              toEntity: true,
            },
          })
        : [];

    const nodes: GraphNode[] = [
      {
        id: page.id,
        label: page.title,
        slug: page.slug,
        type: "page",
      },
    ];

    const nodeIds = new Set<string>([page.id]);

    for (const pe of pageEntities) {
      if (!nodeIds.has(pe.entityId)) {
        nodes.push({
          id: pe.entityId,
          label: pe.entity.name,
          type: "entity",
          entityType: pe.entity.type,
        });
        nodeIds.add(pe.entityId);
      }
    }

    for (const rel of relatedEntities) {
      if (!nodeIds.has(rel.fromEntityId)) {
        nodes.push({
          id: rel.fromEntityId,
          label: rel.fromEntity.name,
          type: "entity",
          entityType: rel.fromEntity.type,
        });
        nodeIds.add(rel.fromEntityId);
      }
      if (!nodeIds.has(rel.toEntityId)) {
        nodes.push({
          id: rel.toEntityId,
          label: rel.toEntity.name,
          type: "entity",
          entityType: rel.toEntity.type,
        });
        nodeIds.add(rel.toEntityId);
      }
    }

    const links: GraphLink[] = [
      ...pageEntities.map((pe) => ({
        source: page.id,
        target: pe.entityId,
        type: "mentions",
      })),
      ...relatedEntities.map((rel) => ({
        source: rel.fromEntityId,
        target: rel.toEntityId,
        type: rel.type,
      })),
    ];

    const result = { nodes, links };
    await setCache(cacheKey, result, GRAPH_CACHE_TTL);
    return result;
  },

  async getEntityRelations(entityId: string): Promise<{
    entity: { id: string; name: string; type: string } | null;
    relations: Array<{
      direction: "from" | "to";
      type: string;
      entity: { id: string; name: string; type: string };
    }>;
  }> {
    const entity = await prisma.entity.findUnique({
      where: { id: entityId },
      select: { id: true, name: true, type: true },
    });

    if (!entity) {
      return { entity: null, relations: [] };
    }

    const [relationsFrom, relationsTo] = await Promise.all([
      prisma.entityRelation.findMany({
        where: { fromEntityId: entityId },
        include: { toEntity: { select: { id: true, name: true, type: true } } },
      }),
      prisma.entityRelation.findMany({
        where: { toEntityId: entityId },
        include: { fromEntity: { select: { id: true, name: true, type: true } } },
      }),
    ]);

    const relations = [
      ...relationsFrom.map((r) => ({
        direction: "from" as const,
        type: r.type,
        entity: r.toEntity,
      })),
      ...relationsTo.map((r) => ({
        direction: "to" as const,
        type: r.type,
        entity: r.fromEntity,
      })),
    ];

    return { entity, relations };
  },
};

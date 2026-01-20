import prisma from "../lib/prisma";
import { getCache, setCache } from "../lib/redis";
import type { GraphNode, GraphLink, GraphData } from "../types";
import type { RelationType } from "@prisma/client";

const GRAPH_CACHE_TTL = 1800;

export interface MissingBacklink {
  fromEntityId: string;
  toEntityId: string;
  existingRelationType: RelationType;
  fromEntityName: string;
  toEntityName: string;
}

export interface PredictedLink {
  entityId: string;
  entityName: string;
  score: number;
  commonNeighbors: number;
}

export interface GetFullGraphOptions {
  limit?: number;
  offset?: number;
}

export const GraphService = {
  async getFullGraph(
    options: GetFullGraphOptions = {},
  ): Promise<GraphData & { total: number }> {
    const { limit = 100, offset = 0 } = options;

    const cacheKey = `graph:full:${limit}:${offset}`;
    const cached = await getCache<GraphData & { total: number }>(cacheKey);
    if (cached) return cached;

    const [
      pages,
      entities,
      pageEntities,
      entityRelations,
      totalPages,
      totalEntities,
    ] = await Promise.all([
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
        .filter(
          (er) => nodeIds.has(er.fromEntityId) && nodeIds.has(er.toEntityId),
        )
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
              OR: [
                { fromEntityId: { in: entityIds } },
                { toEntityId: { in: entityIds } },
              ],
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
        include: {
          fromEntity: { select: { id: true, name: true, type: true } },
        },
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

  async detectMissingBacklinks(pageId: string): Promise<MissingBacklink[]> {
    const pageEntities = await prisma.pageEntity.findMany({
      where: { pageId },
      select: { entityId: true },
    });

    if (pageEntities.length === 0) {
      return [];
    }

    const entityIds = pageEntities.map((pe) => pe.entityId);

    const existingRelations = await prisma.entityRelation.findMany({
      where: {
        OR: [
          { fromEntityId: { in: entityIds } },
          { toEntityId: { in: entityIds } },
        ],
      },
      include: {
        fromEntity: { select: { id: true, name: true } },
        toEntity: { select: { id: true, name: true } },
      },
    });

    const missingBacklinks: MissingBacklink[] = [];
    const relationSet = new Set<string>();

    for (const rel of existingRelations) {
      relationSet.add(`${rel.fromEntityId}:${rel.toEntityId}:${rel.type}`);
    }

    for (const rel of existingRelations) {
      const reverseKey = `${rel.toEntityId}:${rel.fromEntityId}:${rel.type}`;
      if (!relationSet.has(reverseKey)) {
        missingBacklinks.push({
          fromEntityId: rel.toEntityId,
          toEntityId: rel.fromEntityId,
          existingRelationType: rel.type,
          fromEntityName: rel.toEntity.name,
          toEntityName: rel.fromEntity.name,
        });
      }
    }

    return missingBacklinks;
  },

  async predictMissingLinks(
    entityId: string,
    limit: number = 10,
  ): Promise<PredictedLink[]> {
    const directRelations = await prisma.entityRelation.findMany({
      where: {
        OR: [{ fromEntityId: entityId }, { toEntityId: entityId }],
      },
      select: { fromEntityId: true, toEntityId: true },
    });

    const neighborIds = new Set<string>();
    for (const rel of directRelations) {
      if (rel.fromEntityId !== entityId) neighborIds.add(rel.fromEntityId);
      if (rel.toEntityId !== entityId) neighborIds.add(rel.toEntityId);
    }

    if (neighborIds.size === 0) {
      return [];
    }

    const secondDegreeRelations = await prisma.entityRelation.findMany({
      where: {
        OR: [
          { fromEntityId: { in: Array.from(neighborIds) } },
          { toEntityId: { in: Array.from(neighborIds) } },
        ],
        AND: [
          { fromEntityId: { not: entityId } },
          { toEntityId: { not: entityId } },
        ],
      },
      include: {
        fromEntity: { select: { id: true, name: true } },
        toEntity: { select: { id: true, name: true } },
      },
    });

    const candidateScores = new Map<
      string,
      { name: string; commonNeighbors: Set<string> }
    >();

    for (const rel of secondDegreeRelations) {
      const candidateId =
        neighborIds.has(rel.fromEntityId) && !neighborIds.has(rel.toEntityId)
          ? rel.toEntityId
          : neighborIds.has(rel.toEntityId) &&
              !neighborIds.has(rel.fromEntityId)
            ? rel.fromEntityId
            : null;

      if (!candidateId || candidateId === entityId) continue;

      if (!candidateScores.has(candidateId)) {
        const name =
          candidateId === rel.fromEntityId
            ? rel.fromEntity.name
            : rel.toEntity.name;
        candidateScores.set(candidateId, { name, commonNeighbors: new Set() });
      }

      const sharedNeighbor = neighborIds.has(rel.fromEntityId)
        ? rel.fromEntityId
        : rel.toEntityId;
      candidateScores.get(candidateId)!.commonNeighbors.add(sharedNeighbor);
    }

    const predictions: PredictedLink[] = [];

    for (const [candId, data] of candidateScores.entries()) {
      const commonCount = data.commonNeighbors.size;
      const jaccardScore =
        commonCount / (neighborIds.size + commonCount - commonCount);

      predictions.push({
        entityId: candId,
        entityName: data.name,
        score: Math.min(jaccardScore, 0.99),
        commonNeighbors: commonCount,
      });
    }

    return predictions.sort((a, b) => b.score - a.score).slice(0, limit);
  },

  async createMissingBacklinks(
    missingBacklinks: MissingBacklink[],
  ): Promise<number> {
    if (missingBacklinks.length === 0) return 0;

    let created = 0;

    for (const backlink of missingBacklinks) {
      try {
        await prisma.entityRelation.upsert({
          where: {
            fromEntityId_toEntityId_type: {
              fromEntityId: backlink.fromEntityId,
              toEntityId: backlink.toEntityId,
              type: backlink.existingRelationType,
            },
          },
          update: {
            strength: { increment: 0.1 },
          },
          create: {
            fromEntityId: backlink.fromEntityId,
            toEntityId: backlink.toEntityId,
            type: backlink.existingRelationType,
            strength: 0.5,
          },
        });
        created++;
      } catch {
        continue;
      }
    }

    return created;
  },
};

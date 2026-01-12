import prisma from "../lib/prisma";
import type { Entity, EntityType } from "@prisma/client";

export interface CreateEntityInput {
  name: string;
  type: EntityType;
  description?: string;
}

export interface ListEntitiesOptions {
  limit?: number;
  offset?: number;
  type?: EntityType;
}

function normalizeEntityName(name: string): string {
  return name.toLowerCase().trim();
}

export const EntityService = {
  async create(input: CreateEntityInput): Promise<Entity> {
    const normalizedName = normalizeEntityName(input.name);

    return prisma.entity.create({
      data: {
        name: input.name,
        normalizedName,
        type: input.type,
        description: input.description,
      },
    });
  },

  async getById(id: string): Promise<Entity | null> {
    return prisma.entity.findUnique({
      where: { id },
    });
  },

  async findByName(name: string): Promise<Entity | null> {
    const normalizedName = normalizeEntityName(name);

    return prisma.entity.findUnique({
      where: { normalizedName },
    });
  },

  async findOrCreate(input: CreateEntityInput): Promise<Entity> {
    const normalizedName = normalizeEntityName(input.name);

    return prisma.entity.upsert({
      where: { normalizedName },
      create: {
        name: input.name,
        normalizedName,
        type: input.type,
        description: input.description,
      },
      update: {},
    });
  },

  async list(options: ListEntitiesOptions = {}) {
    const { limit = 50, offset = 0, type } = options;

    const where = type ? { type } : {};

    const [entities, total] = await Promise.all([
      prisma.entity.findMany({
        where,
        orderBy: { createdAt: "desc" },
        take: limit,
        skip: offset,
      }),
      prisma.entity.count({ where }),
    ]);

    return {
      entities,
      total,
      limit,
      offset,
      hasMore: offset + entities.length < total,
    };
  },

  async linkToPage(
    pageId: string,
    entityId: string,
    relevance: number = 0.5,
  ): Promise<void> {
    await prisma.pageEntity.upsert({
      where: {
        pageId_entityId: { pageId, entityId },
      },
      create: {
        pageId,
        entityId,
        relevance,
      },
      update: {
        relevance,
      },
    });
  },

  async getPageEntities(pageId: string) {
    return prisma.pageEntity.findMany({
      where: { pageId },
      include: { entity: true },
      orderBy: { relevance: "desc" },
    });
  },

  async getEntityPages(entityId: string) {
    return prisma.pageEntity.findMany({
      where: { entityId },
      include: { page: true },
      orderBy: { relevance: "desc" },
    });
  },

  async getEntityWithRelations(id: string) {
    return prisma.entity.findUnique({
      where: { id },
      include: {
        relationsFrom: {
          include: { toEntity: true },
        },
        relationsTo: {
          include: { fromEntity: true },
        },
        pages: {
          include: { page: true },
          orderBy: { relevance: "desc" },
          take: 10,
        },
      },
    });
  },
};

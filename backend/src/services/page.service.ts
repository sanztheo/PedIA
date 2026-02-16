import prisma from "../lib/prisma";
import { getCache, setCache, deleteCache, invalidateGraphCache } from "../lib/redis";
import type { Page, PageStatus } from "@prisma/client";

const PAGE_CACHE_TTL = 3600;

export interface CreatePageInput {
  slug: string;
  title: string;
  content: string;
  summary?: string;
  status?: PageStatus;
}

export interface UpdatePageInput {
  title?: string;
  content?: string;
  summary?: string;
  status?: PageStatus;
}

export interface ListPagesOptions {
  limit?: number;
  offset?: number;
  status?: PageStatus;
}

export const PageService = {
  async create(input: CreatePageInput): Promise<Page> {
    const page = await prisma.$transaction(async (tx) => {
      const newPage = await tx.page.create({
        data: {
          slug: input.slug,
          title: input.title,
          content: input.content,
          summary: input.summary,
          status: input.status ?? "DRAFT",
        },
      });

      await tx.pageVersion.create({
        data: {
          pageId: newPage.id,
          content: input.content,
          version: 1,
          changeLog: "Version initiale",
        },
      });

      return newPage;
    });

    await setCache(`page:${page.slug}`, page, PAGE_CACHE_TTL);
    invalidateGraphCache().catch(() => {});
    return page;
  },

  async getBySlug(slug: string): Promise<Page | null> {
    const cached = await getCache<Page>(`page:${slug}`);
    if (cached) return cached;

    const page = await prisma.page.findUnique({
      where: { slug },
    });

    if (page) {
      await setCache(`page:${slug}`, page, PAGE_CACHE_TTL);
    }

    return page;
  },

  async getById(id: string): Promise<Page | null> {
    return prisma.page.findUnique({
      where: { id },
    });
  },

  async getBySlugWithEntities(slug: string) {
    return prisma.page.findUnique({
      where: { slug },
      include: {
        entities: {
          include: {
            entity: true,
          },
          orderBy: {
            relevance: "desc",
          },
        },
        sources: {
          include: {
            source: {
              select: {
                url: true,
                title: true,
                domain: true,
                reliability: true,
              },
            },
          },
        },
      },
    });
  },

  async list(options: ListPagesOptions = {}) {
    const { limit = 20, offset = 0, status } = options;

    const where = status ? { status } : {};

    const [pages, total] = await Promise.all([
      prisma.page.findMany({
        where,
        orderBy: { createdAt: "desc" },
        take: limit,
        skip: offset,
        select: {
          id: true,
          slug: true,
          title: true,
          summary: true,
          status: true,
          viewCount: true,
          createdAt: true,
          updatedAt: true,
        },
      }),
      prisma.page.count({ where }),
    ]);

    return {
      pages,
      total,
      limit,
      offset,
      hasMore: offset + pages.length < total,
    };
  },

  async update(id: string, input: UpdatePageInput): Promise<Page> {
    const page = await prisma.page.update({
      where: { id },
      data: input,
    });

    await deleteCache(`page:${page.slug}`);
    invalidateGraphCache().catch(() => {});
    return page;
  },

  async delete(id: string): Promise<void> {
    const page = await prisma.page.findUnique({
      where: { id },
      select: { slug: true },
    });

    await prisma.page.delete({ where: { id } });

    if (page) {
      await deleteCache(`page:${page.slug}`);
    }
    invalidateGraphCache().catch(() => {});
  },

  async incrementViewCount(id: string): Promise<void> {
    await prisma.page.update({
      where: { id },
      data: { viewCount: { increment: 1 } },
    });
  },
};

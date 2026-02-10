import { api } from '@/lib/api';
import { MainLayout } from '@/components/layout/MainLayout';
import { PageHeader } from '@/components/wiki/PageHeader';
import { MarkdownContent } from '@/components/wiki/MarkdownContent';
import { EntitySidebar } from '@/components/wiki/EntitySidebar';
import { SourcesPanel } from '@/components/wiki/SourcesPanel';
import { TableOfContents } from '@/components/wiki/TableOfContents';
import { MobileEntitiesButton } from '@/components/wiki/MobileEntitiesButton';
import { Separator } from '@/components/ui/separator';
import type { Page, Entity, Source } from '@/types';

interface WikiPageProps {
  params: Promise<{ slug: string }>;
}

interface PageResponse extends Page {
  entities?: { entity: Entity; relevance: number }[];
  sources?: { source: Source }[];
}

export default async function WikiPage({ params }: WikiPageProps) {
  const { slug } = await params;
  const response = await api.pages.get(slug);

  if (response.error || !response.data) {
    return (
      <MainLayout>
        <div className="flex flex-col items-center justify-center min-h-[60vh] px-8">
          <div className="text-center space-y-6">
            <div className="size-16 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
              <span className="text-3xl">🔍</span>
            </div>
            <h1 className="text-4xl font-bold tracking-tight">Page introuvable</h1>
            <p className="text-muted-foreground text-lg max-w-md">
              {response.error || 'La page demandée n\'a pas pu être chargée.'}
            </p>
          </div>
        </div>
      </MainLayout>
    );
  }

  const page = response.data as PageResponse;
  const entities = page.entities?.map(e => e.entity) ?? [];
  const sources = page.sources?.map(s => ({
    url: s.source.url,
    title: s.source.title ?? s.source.domain,
    domain: s.source.domain,
  })) ?? [];

  return (
    <MainLayout disableScroll={true}>
      <div className="flex flex-1 overflow-hidden h-full">
        {/* Main content area */}
        <div className="flex-1 overflow-y-auto min-w-0">
          <PageHeader
            title={page.title}
            slug={page.slug}
            createdAt={page.createdAt}
            updatedAt={page.updatedAt}
            viewCount={page.viewCount}
            status={page.status}
            pageId={page.id}
            confidenceScore={page.biasScore !== undefined ? (100 - page.biasScore) / 100 : undefined}
          />
          
          {/* Content */}
          <div className="px-8 lg:px-12 py-10 lg:py-14 space-y-8">
            <MarkdownContent content={page.content} />
            
            {sources.length > 0 && (
              <SourcesPanel sources={sources} />
            )}
          </div>
        </div>

        {/* Right Sidebar - TOC + Entities */}
        <aside className="hidden xl:flex flex-col w-80 border-l border-border/50 bg-muted/5">
          {/* Table of Contents */}
          <div className="px-6">
            <TableOfContents content={page.content} />
          </div>
          
          <Separator className="mx-6 my-4" />
          
          {/* Entities */}
          <EntitySidebar entities={entities} />
        </aside>
      </div>
      
      {/* Mobile floating button for entities */}
      <MobileEntitiesButton entities={entities} />
    </MainLayout>
  );
}

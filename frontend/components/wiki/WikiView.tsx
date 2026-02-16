'use client';

import { useEditSSE } from '@/hooks/useEditSSE';
import { PageHeader } from './PageHeader';
import { MarkdownContent } from './MarkdownContent';
import { SourcesPanel } from './SourcesPanel';
import { TableOfContents } from './TableOfContents';
import { EntitySidebar } from './EntitySidebar';
import { Separator } from '@/components/ui/separator';
import type { Page, Entity, Source } from '@/types';

interface WikiViewProps {
  page: Page & { biasScore?: number };
  entities: Entity[];
  sources: Source[];
}

export function WikiView({ page, entities, sources }: WikiViewProps) {
  const { isEditing, activeSection, updatedContent, startEdit } = useEditSSE(page.id);
  const content = updatedContent ?? page.content;

  return (
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
          onEdit={() => startEdit()}
          isEditing={isEditing}
        />

        <div className="px-8 lg:px-12 py-10 lg:py-14 space-y-8">
          <MarkdownContent 
            content={content} 
            activeSection={activeSection ?? undefined} 
          />

          {sources.length > 0 && <SourcesPanel sources={sources} />}
        </div>
      </div>

      {/* Right Sidebar - TOC + Entities */}
      <aside className="hidden xl:flex flex-col w-80 border-l border-border/50 bg-muted/5">
        <div className="px-6">
          <TableOfContents content={content} />
        </div>

        <Separator className="mx-6 my-4" />

        <EntitySidebar entities={entities} />
      </aside>
    </div>
  );
}

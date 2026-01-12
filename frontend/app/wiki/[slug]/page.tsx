import { api } from '@/lib/api';
import { MainLayout } from '@/components/layout/MainLayout';
import { PageHeader } from '@/components/wiki/PageHeader';
import { MarkdownContent } from '@/components/wiki/MarkdownContent';
import { EntitySidebar } from '@/components/wiki/EntitySidebar';
import type { Page, Entity } from '@/types';

interface WikiPageProps {
  params: Promise<{ slug: string }>;
}

interface PageResponse extends Page {
  entities?: { entity: Entity; relevance: number }[];
}

export default async function WikiPage({ params }: WikiPageProps) {
  const { slug } = await params;
  const response = await api.pages.get(slug);

  if (response.error || !response.data) {
    return (
      <MainLayout>
        <div className="flex flex-col items-center justify-center min-h-[50vh] px-6">
          <div className="text-center space-y-4">
            <h1 className="text-4xl font-bold">Page introuvable</h1>
            <p className="text-muted-foreground">
              {response.error || 'La page demandée n\'a pas pu être chargée.'}
            </p>
          </div>
        </div>
      </MainLayout>
    );
  }

  const page = response.data as PageResponse;
  const entities = page.entities?.map(e => e.entity) ?? [];

  return (
    <MainLayout disableScroll={true}>
      <div className="flex flex-1 overflow-hidden h-full">
        <div className="flex-1 overflow-y-auto min-w-0">
          <PageHeader
            title={page.title}
            createdAt={page.createdAt}
            updatedAt={page.updatedAt}
            viewCount={page.viewCount}
            status={page.status}
            pageId={page.id}
          />
          <div className="max-w-4xl mx-auto px-6 py-8">
            <MarkdownContent content={page.content} />
          </div>
        </div>

        {/* Right Sidebar for Entities */}
        <div className="hidden xl:block w-80 border-l overflow-y-auto">
          <EntitySidebar entities={entities} />
        </div>
      </div>
    </MainLayout>
  );
}

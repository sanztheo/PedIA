import { api } from '@/lib/api';
import { MainLayout } from '@/components/layout/MainLayout';
import { WikiView } from '@/components/wiki/WikiView';
import { MobileEntitiesButton } from '@/components/wiki/MobileEntitiesButton';
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
    reliability: s.source.reliability,
  })) ?? [];

  return (
    <MainLayout disableScroll={true}>
      <WikiView 
        page={page} 
        entities={entities} 
        sources={sources} 
      />
      <MobileEntitiesButton entities={entities} />
    </MainLayout>
  );
}

import { api } from '@/lib/api';
import { MainLayout } from '@/components/layout/MainLayout';
import { PageHeader } from '@/components/wiki/PageHeader';
import { MarkdownContent } from '@/components/wiki/MarkdownContent';
import { EntitySidebar } from '@/components/wiki/EntitySidebar';
import { SourcesPanel } from '@/components/wiki/SourcesPanel';
import { ReportButton } from '@/components/wiki/ReportButton';
import type { Page, Entity } from '@/types';

interface WikiPageProps {
  params: Promise<{ slug: string }>;
}

interface Source {
  url: string;
  title: string;
  domain: string;
}

interface PageResponse extends Page {
  entities?: { entity: Entity; relevance: number }[];
  sources?: Source[];
  confidenceScore?: number;
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
  
  // Default confidence score until backend provides it
  const confidenceScore = page.confidenceScore ?? 75;
  
  // Default sources from content generation (mock until backend provides them)
  const sources = page.sources && page.sources.length > 0 
    ? page.sources 
    : [
        { url: 'https://wikipedia.org', title: 'Wikipedia', domain: 'wikipedia.org' },
        { url: 'https://reuters.com', title: 'Reuters', domain: 'reuters.com' },
      ];

  return (
    <MainLayout disableScroll={true}>
      <div className="flex flex-1 overflow-hidden h-full">
        {/* Main content area */}
        <div className="flex-1 overflow-y-auto min-w-0">
          <PageHeader
            title={page.title}
            createdAt={page.createdAt}
            updatedAt={page.updatedAt}
            viewCount={page.viewCount}
            status={page.status}
            pageId={page.id}
            confidenceScore={confidenceScore}
          />
          
          {/* Content */}
          <div className="px-8 lg:px-12 py-10 lg:py-14">
            <MarkdownContent content={page.content} />
            
            {/* Report section */}
            <div className="mt-12 pt-8 border-t border-border/50">
              <div className="flex items-center justify-between">
                <p className="text-sm text-muted-foreground">
                  Un problème avec cette page ?
                </p>
                <ReportButton pageId={page.id} pageTitle={page.title} />
              </div>
            </div>
          </div>
        </div>

        {/* Right Sidebar */}
        <aside className="hidden xl:block w-80 border-l border-border/50 overflow-y-auto bg-muted/5">
          <EntitySidebar entities={entities} />
          {sources.length > 0 && (
            <div className="p-4 border-t border-border/50">
              <SourcesPanel sources={sources} />
            </div>
          )}
        </aside>
      </div>
    </MainLayout>
  );
}


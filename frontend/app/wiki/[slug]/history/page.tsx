'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { HistoryPanel } from '@/components/wiki/HistoryPanel';
import { DiffView } from '@/components/wiki/DiffView';
import { MarkdownContent } from '@/components/wiki/MarkdownContent';
import { api } from '@/lib/api';
import type { PageVersion } from '@/types';

interface HistoryPageProps {
  params: Promise<{ slug: string }>;
}

export default function HistoryPage({ params }: HistoryPageProps) {
  const router = useRouter();
  const [slug, setSlug] = useState<string>('');
  const [pageId, setPageId] = useState<string>('');
  const [versions, setVersions] = useState<PageVersion[]>([]);
  const [selectedVersion, setSelectedVersion] = useState<PageVersion | null>(null);
  const [compareVersions, setCompareVersions] = useState<[PageVersion, PageVersion] | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRolling, setIsRolling] = useState(false);

  useEffect(() => {
    params.then(async (p) => {
      setSlug(p.slug);
      const pageRes = await api.pages.get(p.slug);
      if (pageRes.data) {
        setPageId(pageRes.data.id);
        const versionsRes = await api.versions.list(pageRes.data.id);
        if (versionsRes.data) {
          setVersions(versionsRes.data);
          if (versionsRes.data.length > 0) {
            setSelectedVersion(versionsRes.data[0]);
          }
        }
      }
      setIsLoading(false);
    });
  }, [params]);

  const handleCompare = async (v1: number, v2: number) => {
    const [res1, res2] = await Promise.all([
      api.versions.get(pageId, v1),
      api.versions.get(pageId, v2),
    ]);
    if (res1.data && res2.data) {
      setCompareVersions([res1.data, res2.data]);
      setSelectedVersion(null);
    }
  };

  const handleRollback = async (version: number) => {
    if (!confirm(`Restaurer la version ${version} ?`)) return;
    setIsRolling(true);
    const res = await api.versions.rollback(pageId, version);
    if (res.data) {
      router.push(`/wiki/${slug}`);
    }
    setIsRolling(false);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-pulse text-muted-foreground">Chargement...</div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-background">
      <aside className="w-80 border-r border-border/50 bg-muted/5">
        <div className="p-4 border-b border-border/50">
          <Button variant="ghost" size="sm" asChild>
            <Link href={`/wiki/${slug}`}>
              <ArrowLeft className="size-4 mr-2" />
              Retour à l'article
            </Link>
          </Button>
        </div>
        <HistoryPanel
          versions={versions}
          currentVersion={selectedVersion?.version}
          onSelect={(v) => {
            setSelectedVersion(v);
            setCompareVersions(null);
          }}
          onCompare={handleCompare}
          onRollback={handleRollback}
          isLoading={isRolling}
        />
      </aside>

      <main className="flex-1 overflow-hidden">
        {compareVersions ? (
          <DiffView
            oldContent={compareVersions[0].content}
            newContent={compareVersions[1].content}
            oldVersion={compareVersions[0].version}
            newVersion={compareVersions[1].version}
          />
        ) : selectedVersion ? (
          <div className="h-full overflow-y-auto p-8">
            <div className="mb-4 text-sm text-muted-foreground">
              Version {selectedVersion.version} • {selectedVersion.changeLog}
            </div>
            <MarkdownContent content={selectedVersion.content} />
          </div>
        ) : (
          <div className="flex items-center justify-center h-full text-muted-foreground">
            Sélectionnez une version
          </div>
        )}
      </main>
    </div>
  );
}

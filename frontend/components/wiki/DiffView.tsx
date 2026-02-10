'use client';

import { useMemo } from 'react';
import { diffLines, Change } from 'diff';
import { cn } from '@/lib/utils';

interface DiffViewProps {
  oldContent: string;
  newContent: string;
  oldVersion: number;
  newVersion: number;
}

export function DiffView({ oldContent, newContent, oldVersion, newVersion }: DiffViewProps) {
  const changes = useMemo(() => {
    return diffLines(oldContent, newContent);
  }, [oldContent, newContent]);

  const stats = useMemo(() => {
    let added = 0;
    let removed = 0;
    changes.forEach((change) => {
      const lines = change.value.split('\n').filter(Boolean).length;
      if (change.added) added += lines;
      if (change.removed) removed += lines;
    });
    return { added, removed };
  }, [changes]);

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between p-4 border-b border-border/50 bg-muted/30">
        <div className="flex items-center gap-4">
          <span className="text-sm font-medium">
            Version {oldVersion} → {newVersion}
          </span>
          <div className="flex items-center gap-2 text-sm">
            <span className="text-green-500">+{stats.added}</span>
            <span className="text-red-500">-{stats.removed}</span>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-auto font-mono text-sm">
        <div className="min-w-full">
          {changes.map((change, index) => (
            <DiffBlock key={index} change={change} />
          ))}
        </div>
      </div>
    </div>
  );
}

function DiffBlock({ change }: { change: Change }) {
  const lines = change.value.split('\n');
  if (lines[lines.length - 1] === '') lines.pop();

  if (lines.length === 0) return null;

  return (
    <>
      {lines.map((line, i) => (
        <div
          key={i}
          className={cn(
            "px-4 py-0.5 whitespace-pre-wrap break-all border-l-4",
            change.added && "bg-green-500/10 border-green-500 text-green-200",
            change.removed && "bg-red-500/10 border-red-500 text-red-200",
            !change.added && !change.removed && "border-transparent text-muted-foreground"
          )}
        >
          <span className="select-none opacity-50 mr-4 inline-block w-4">
            {change.added ? '+' : change.removed ? '-' : ' '}
          </span>
          {line || ' '}
        </div>
      ))}
    </>
  );
}

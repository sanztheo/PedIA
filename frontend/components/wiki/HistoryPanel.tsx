'use client';

import { useState } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';
import { History, RotateCcw, GitCompare, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { PageVersion } from '@/types';

interface HistoryPanelProps {
  versions: PageVersion[];
  currentVersion?: number;
  onSelect: (version: PageVersion) => void;
  onCompare?: (v1: number, v2: number) => void;
  onRollback?: (version: number) => void;
  isLoading?: boolean;
}

export function HistoryPanel({
  versions,
  currentVersion,
  onSelect,
  onCompare,
  onRollback,
  isLoading,
}: HistoryPanelProps) {
  const [compareMode, setCompareMode] = useState(false);
  const [selected, setSelected] = useState<number[]>([]);

  const handleVersionClick = (version: PageVersion) => {
    if (compareMode) {
      const newSelected = selected.includes(version.version)
        ? selected.filter(v => v !== version.version)
        : [...selected, version.version].slice(-2);
      setSelected(newSelected);
    } else {
      onSelect(version);
    }
  };

  const handleCompare = () => {
    if (selected.length === 2 && onCompare) {
      onCompare(Math.min(...selected), Math.max(...selected));
    }
  };

  const exitCompareMode = () => {
    setCompareMode(false);
    setSelected([]);
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between p-4 border-b border-border/50">
        <div className="flex items-center gap-2">
          <History className="size-5 text-muted-foreground" />
          <h2 className="font-semibold">Historique</h2>
          <span className="text-xs text-muted-foreground">({versions.length})</span>
        </div>
        {onCompare && !compareMode && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCompareMode(true)}
            disabled={versions.length < 2}
          >
            <GitCompare className="size-4 mr-1" />
            Comparer
          </Button>
        )}
        {compareMode && (
          <Button variant="ghost" size="sm" onClick={exitCompareMode}>
            Annuler
          </Button>
        )}
      </div>

      {compareMode && (
        <div className="p-3 bg-primary/5 border-b border-primary/20">
          <p className="text-sm text-center mb-2">
            {selected.length === 0 && "Sélectionnez 2 versions"}
            {selected.length === 1 && "Sélectionnez 1 autre version"}
            {selected.length === 2 && (
              <span className="font-medium">
                v{Math.min(...selected)} → v{Math.max(...selected)}
              </span>
            )}
          </p>
          {selected.length === 2 && (
            <Button className="w-full" size="sm" onClick={handleCompare}>
              <GitCompare className="size-4 mr-2" />
              Voir les différences
            </Button>
          )}
        </div>
      )}

      <div className="flex-1 overflow-y-auto">
        {versions.length === 0 ? (
          <div className="p-4 text-center text-muted-foreground">
            Aucune version disponible
          </div>
        ) : (
          <ul className="divide-y divide-border/30">
            {versions.map((version, index) => (
              <li
                key={version.id}
                className={cn(
                  "p-4 cursor-pointer transition-colors hover:bg-muted/50",
                  !compareMode && currentVersion === version.version && "bg-muted/80",
                  compareMode && selected.includes(version.version) && "bg-primary/10"
                )}
                onClick={() => handleVersionClick(version)}
              >
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-2">
                    {compareMode && (
                      <div className={cn(
                        "size-5 rounded border-2 flex items-center justify-center",
                        selected.includes(version.version) 
                          ? "bg-primary border-primary text-primary-foreground" 
                          : "border-muted-foreground/30"
                      )}>
                        {selected.includes(version.version) && <Check className="size-3" />}
                      </div>
                    )}
                    <span className="font-medium">
                      Version {version.version}
                      {index === 0 && <span className="ml-2 text-xs text-green-500">(actuelle)</span>}
                    </span>
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {formatDistanceToNow(new Date(version.createdAt), { addSuffix: true, locale: fr })}
                  </span>
                </div>
                {version.changeLog && (
                  <p className="text-sm text-muted-foreground line-clamp-2 ml-7">
                    {version.changeLog}
                  </p>
                )}
                {!compareMode && index > 0 && onRollback && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="mt-2 text-xs"
                    onClick={(e) => {
                      e.stopPropagation();
                      onRollback(version.version);
                    }}
                    disabled={isLoading}
                  >
                    <RotateCcw className="size-3 mr-1" />
                    Restaurer cette version
                  </Button>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

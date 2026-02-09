'use client';

import { cn } from '@/lib/utils';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

interface ConfidenceBadgeProps {
  score: number;
  size?: 'sm' | 'md';
}

export function ConfidenceBadge({ score, size = 'md' }: ConfidenceBadgeProps) {
  const percentage = Math.round(score * 100);
  
  const getColor = () => {
    if (percentage >= 80) return 'bg-green-500/20 text-green-600 border-green-500/30';
    if (percentage >= 60) return 'bg-yellow-500/20 text-yellow-600 border-yellow-500/30';
    return 'bg-red-500/20 text-red-600 border-red-500/30';
  };

  const getLabel = () => {
    if (percentage >= 80) return 'Haute confiance';
    if (percentage >= 60) return 'Confiance moyenne';
    return 'Vérification recommandée';
  };

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <span
            className={cn(
              'inline-flex items-center gap-1.5 rounded-full border font-medium',
              getColor(),
              size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-3 py-1 text-sm'
            )}
          >
            <span className="size-1.5 rounded-full bg-current" />
            {percentage}%
          </span>
        </TooltipTrigger>
        <TooltipContent>
          <p>{getLabel()}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

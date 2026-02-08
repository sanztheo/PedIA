'use client';

import { Sparkles, Info } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

interface GeneratedBadgeProps {
  generatedAt: string;
  className?: string;
}

export function GeneratedBadge({ generatedAt, className }: GeneratedBadgeProps) {
  const date = new Date(generatedAt);
  const formattedDate = format(date, 'PPP à HH:mm', { locale: fr });

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div
            className={cn(
              'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full',
              'bg-gradient-to-r from-violet-500/10 to-purple-500/10',
              'border border-violet-500/20',
              'text-xs font-medium text-violet-400',
              'cursor-help transition-all hover:border-violet-500/40',
              className
            )}
          >
            <Sparkles className="size-3" />
            <span>Généré par IA</span>
            <Info className="size-3 opacity-60" />
          </div>
        </TooltipTrigger>
        <TooltipContent side="bottom" className="max-w-xs">
          <div className="space-y-1">
            <p className="font-medium">Contenu généré automatiquement</p>
            <p className="text-xs text-muted-foreground">
              Cette page a été générée le {formattedDate} par notre système d&apos;IA.
              Les informations sont vérifiées contre plusieurs sources mais peuvent contenir des inexactitudes.
            </p>
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

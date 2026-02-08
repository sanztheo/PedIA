'use client';

import { ShieldCheck, ShieldAlert, ShieldQuestion } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ConfidenceBadgeProps {
  score: number;
  size?: 'sm' | 'md' | 'lg';
}

type ConfidenceLevel = 'high' | 'medium' | 'low';

const confidenceConfig: Record<ConfidenceLevel, {
  label: string;
  className: string;
  bgClassName: string;
  icon: React.ComponentType<{ className?: string }>;
}> = {
  high: {
    label: 'Haute confiance',
    className: 'text-green-400',
    bgClassName: 'bg-green-400/10 border-green-400/20',
    icon: ShieldCheck,
  },
  medium: {
    label: 'À vérifier',
    className: 'text-yellow-400',
    bgClassName: 'bg-yellow-400/10 border-yellow-400/20',
    icon: ShieldAlert,
  },
  low: {
    label: 'Non vérifié',
    className: 'text-red-400',
    bgClassName: 'bg-red-400/10 border-red-400/20',
    icon: ShieldQuestion,
  },
};

const sizeConfig = {
  sm: { container: 'px-2 py-1 text-xs gap-1', icon: 'size-3' },
  md: { container: 'px-3 py-1.5 text-sm gap-1.5', icon: 'size-4' },
  lg: { container: 'px-4 py-2 text-base gap-2', icon: 'size-5' },
};

function getConfidenceLevel(score: number): ConfidenceLevel {
  if (score > 80) return 'high';
  if (score >= 50) return 'medium';
  return 'low';
}

export function ConfidenceBadge({ score, size = 'md' }: ConfidenceBadgeProps) {
  const level = getConfidenceLevel(score);
  const config = confidenceConfig[level];
  const sizeStyles = sizeConfig[size];
  const Icon = config.icon;

  return (
    <div
      className={cn(
        'inline-flex items-center rounded-full border font-medium',
        config.bgClassName,
        sizeStyles.container
      )}
      title={`Score de confiance: ${score}/100`}
    >
      <Icon className={cn(sizeStyles.icon, config.className)} />
      <span className={config.className}>{config.label}</span>
    </div>
  );
}

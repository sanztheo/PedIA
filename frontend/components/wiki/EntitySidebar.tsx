'use client';

import Link from 'next/link';
import type { Entity, EntityType } from '@/types';
import { cn } from '@/lib/utils';
import { User, Building2, MapPin, Calendar, Lightbulb, BookOpen, HelpCircle } from 'lucide-react';

interface EntitySidebarProps {
  entities: Entity[];
}

const entityTypeConfig: Record<EntityType, {
  color: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}> = {
  PERSON: {
    color: 'bg-entity-person text-entity-person-foreground',
    label: 'Personne',
    icon: User,
  },
  ORGANIZATION: {
    color: 'bg-entity-organization text-entity-organization-foreground',
    label: 'Organisation',
    icon: Building2,
  },
  LOCATION: {
    color: 'bg-entity-location text-entity-location-foreground',
    label: 'Lieu',
    icon: MapPin,
  },
  EVENT: {
    color: 'bg-entity-event text-entity-event-foreground',
    label: 'Événement',
    icon: Calendar,
  },
  CONCEPT: {
    color: 'bg-entity-concept text-entity-concept-foreground',
    label: 'Concept',
    icon: Lightbulb,
  },
  WORK: {
    color: 'bg-entity-work text-entity-work-foreground',
    label: 'Œuvre',
    icon: BookOpen,
  },
  OTHER: {
    color: 'bg-muted text-muted-foreground',
    label: 'Autre',
    icon: HelpCircle,
  },
};

export function EntitySidebar({ entities }: EntitySidebarProps) {
  if (entities.length === 0) {
    return (
      <aside className="w-full h-full bg-background p-6">
        <h2 className="mb-4 text-lg font-semibold">Entités</h2>
        <p className="text-sm text-muted-foreground">Aucune entité trouvée</p>
      </aside>
    );
  }

  return (
    <aside className="w-full h-full bg-background p-6">
      <h2 className="mb-6 text-lg font-semibold flex items-center gap-2">
        Entités
        <span className="text-xs font-normal text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
          {entities.length}
        </span>
      </h2>
      <div className="space-y-2">
        {entities.map((entity) => {
          const config = entityTypeConfig[entity.type];
          const Icon = config.icon;
          return (
            <Link
              key={entity.id}
              href={`/wiki/${entity.normalizedName}`}
              className={cn(
                "group block p-3 rounded-lg border border-border",
                "hover:border-primary/50 hover:bg-accent/50",
                "transition-all duration-200"
              )}
            >
              <div className="flex items-start gap-3">
                <span
                  className={cn(
                    'flex items-center justify-center size-8 rounded-lg',
                    config.color
                  )}
                >
                  <Icon className="size-4" />
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate group-hover:text-primary transition-colors">
                    {entity.name}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {config.label}
                  </p>
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </aside>
  );
}

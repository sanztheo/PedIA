"use client";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { EntityType } from "@/types";
import {
  ZoomIn,
  ZoomOut,
  Maximize2,
  User,
  Building2,
  MapPin,
  Calendar,
  Lightbulb,
  BookOpen,
  HelpCircle,
} from "lucide-react";

interface GraphControlsProps {
  onZoomIn: () => void;
  onZoomOut: () => void;
  onReset: () => void;
  filters: EntityType[];
  onFiltersChange: (filters: EntityType[]) => void;
  className?: string;
}

const entityTypes: { type: EntityType; icon: React.ComponentType<{ className?: string }>; label: string; color: string }[] = [
  { type: "PERSON", icon: User, label: "Personnes", color: "bg-blue-400" },
  { type: "ORGANIZATION", icon: Building2, label: "Organisations", color: "bg-emerald-400" },
  { type: "LOCATION", icon: MapPin, label: "Lieux", color: "bg-amber-400" },
  { type: "EVENT", icon: Calendar, label: "Événements", color: "bg-violet-400" },
  { type: "CONCEPT", icon: Lightbulb, label: "Concepts", color: "bg-pink-400" },
  { type: "WORK", icon: BookOpen, label: "Œuvres", color: "bg-indigo-400" },
  { type: "OTHER", icon: HelpCircle, label: "Autres", color: "bg-gray-400" },
];

export function GraphControls({
  onZoomIn,
  onZoomOut,
  onReset,
  filters,
  onFiltersChange,
  className,
}: GraphControlsProps) {
  const toggleFilter = (type: EntityType) => {
    if (filters.includes(type)) {
      onFiltersChange(filters.filter((f) => f !== type));
    } else {
      onFiltersChange([...filters, type]);
    }
  };

  return (
    <div className={cn("flex flex-col gap-2", className)}>
      <div className="flex items-center gap-1 p-1 bg-background/80 backdrop-blur-sm border border-border rounded-lg shadow-sm">
        <Button
          variant="ghost"
          size="icon-sm"
          onClick={onZoomIn}
          title="Zoom avant"
        >
          <ZoomIn className="size-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon-sm"
          onClick={onZoomOut}
          title="Zoom arrière"
        >
          <ZoomOut className="size-4" />
        </Button>
        <div className="w-px h-4 bg-border" />
        <Button
          variant="ghost"
          size="icon-sm"
          onClick={onReset}
          title="Recentrer"
        >
          <Maximize2 className="size-4" />
        </Button>
      </div>

      <div className="p-2 bg-background/80 backdrop-blur-sm border border-border rounded-lg shadow-sm">
        <p className="text-xs font-medium text-muted-foreground mb-2 px-1">
          Filtres
        </p>
        <div className="flex flex-wrap gap-1">
          {entityTypes.map(({ type, icon: Icon, label, color }) => {
            const isActive = filters.includes(type);
            return (
              <button
                key={type}
                onClick={() => toggleFilter(type)}
                title={label}
                className={cn(
                  "flex items-center gap-1.5 px-2 py-1 rounded-md text-xs transition-all",
                  isActive
                    ? "bg-accent text-accent-foreground"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted"
                )}
              >
                <span className={cn("size-2 rounded-full", isActive ? color : "bg-muted-foreground/30")} />
                <Icon className="size-3" />
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export default GraphControls;

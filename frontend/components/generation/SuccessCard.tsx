"use client";

import { useRouter } from "next/navigation";
import { ArrowRight, Check } from "lucide-react";
import { Button } from "@/components/ui/button";

interface SuccessCardProps {
  page: {
    id: string;
    slug: string;
    title: string;
  };
}

export function SuccessCard({ page }: SuccessCardProps) {
  const router = useRouter();

  return (
    <div className="rounded-lg border border-border bg-card p-6 space-y-4 animate-in fade-in duration-300">
      <div className="flex items-start gap-3">
        <div className="flex items-center justify-center size-8 rounded-full bg-green-500/10 text-green-500">
          <Check className="size-4" strokeWidth={2} />
        </div>
        <div className="flex-1 min-w-0 space-y-1">
          <p className="text-xs text-muted-foreground uppercase tracking-wide">
            Article créé
          </p>
          <h3 className="font-medium truncate">{page.title}</h3>
        </div>
      </div>

      <div className="h-px bg-border" />

      <Button
        onClick={() => router.push(`/wiki/${page.slug}`)}
        className="w-full justify-between group"
      >
        <span>Lire l&apos;article</span>
        <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
      </Button>

      <p className="text-center text-xs text-muted-foreground">
        Redirection automatique...
      </p>
    </div>
  );
}

export default SuccessCard;

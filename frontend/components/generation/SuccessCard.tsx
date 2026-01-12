"use client";

import { useRouter } from "next/navigation";
import { ArrowRight, BookOpen } from "lucide-react";

interface SuccessCardProps {
  page: {
    id: string;
    slug: string;
    title: string;
  };
}

// Pre-generate particle positions (static)
const PARTICLE_CONFIG = [
  { id: 0, x: 12, y: 20, delay: 0.1, size: 3, duration: 3.5 },
  { id: 1, x: 85, y: 15, delay: 0.3, size: 4, duration: 4.2 },
  { id: 2, x: 45, y: 80, delay: 0.0, size: 2.5, duration: 3.8 },
  { id: 3, x: 70, y: 45, delay: 0.4, size: 3.5, duration: 4.0 },
  { id: 4, x: 25, y: 65, delay: 0.2, size: 4.5, duration: 3.3 },
  { id: 5, x: 90, y: 75, delay: 0.15, size: 2, duration: 4.5 },
  { id: 6, x: 55, y: 30, delay: 0.35, size: 3, duration: 3.7 },
  { id: 7, x: 8, y: 85, delay: 0.25, size: 5, duration: 4.1 },
];

export function SuccessCard({ page }: SuccessCardProps) {
  const router = useRouter();

  const handleClick = () => {
    router.push(`/wiki/${page.slug}`);
  };

  return (
    <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-card via-card to-success/5 border border-success/20 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Ambient glow */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 right-0 w-64 h-64 bg-success/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-success/5 rounded-full blur-2xl translate-y-1/2 -translate-x-1/2" />
      </div>

      {/* Celebration particles */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {PARTICLE_CONFIG.map((particle) => (
          <div
            key={particle.id}
            className="absolute rounded-full bg-success/60 animate-float"
            style={{
              left: `${particle.x}%`,
              top: `${particle.y}%`,
              width: particle.size,
              height: particle.size,
              animationDelay: `${particle.delay}s`,
              animationDuration: `${particle.duration}s`,
            }}
          />
        ))}
      </div>

      {/* Content */}
      <div className="relative p-8 space-y-6">
        {/* Header */}
        <div className="flex items-start gap-4 animate-in fade-in slide-in-from-left-4 duration-500 delay-100">
          <div className="flex items-center justify-center size-12 rounded-xl bg-success/15 text-success ring-1 ring-success/20">
            <BookOpen className="size-5" strokeWidth={1.5} />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-medium uppercase tracking-widest text-success mb-1">
              Article créé
            </p>
            <h3 className="text-xl font-semibold text-foreground truncate">
              {page.title}
            </h3>
          </div>
        </div>

        {/* Divider */}
        <div className="h-px bg-gradient-to-r from-transparent via-border to-transparent animate-in fade-in zoom-in-x duration-500 delay-200" />

        {/* CTA Button */}
        <button
          onClick={handleClick}
          className="group relative w-full h-14 flex items-center justify-center gap-3 rounded-xl font-medium text-base bg-success text-success-foreground overflow-hidden hover:shadow-lg hover:shadow-success/25 active:scale-[0.98] transition-all animate-in fade-in slide-in-from-bottom-4 duration-500 delay-300"
        >
          {/* Button shine effect */}
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700" />

          <span className="relative">Lire l&apos;article</span>
          <ArrowRight
            className="relative size-4 transition-transform duration-300 group-hover:translate-x-1"
            strokeWidth={2}
          />
        </button>

        {/* Auto-redirect notice */}
        <p className="text-center text-xs text-muted-foreground animate-in fade-in duration-500 delay-[400ms]">
          Redirection automatique...
        </p>
      </div>
    </div>
  );
}

export default SuccessCard;

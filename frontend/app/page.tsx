import { SearchBar } from "@/components/search/SearchBar";
import Link from "next/link";

export default function Home() {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="border-b border-border">
        <div className="max-w-screen-lg mx-auto px-6 h-14 flex items-center justify-between">
          <span className="text-sm font-medium">PedIA</span>
          <nav className="flex items-center gap-6">
            <Link
              href="/explore"
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              Explorer
            </Link>
            <Link
              href="/graph"
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              Graph
            </Link>
          </nav>
        </div>
      </header>

      {/* Main */}
      <main className="flex-1 flex flex-col items-center justify-center px-6">
        <div className="w-full max-w-xl space-y-8">
          {/* Title */}
          <div className="space-y-3 text-center">
            <h1 className="text-4xl font-semibold tracking-tight">PedIA</h1>
            <p className="text-muted-foreground">
              L&apos;encyclopédie qui évolue avec vos recherches
            </p>
          </div>

          {/* Search */}
          <SearchBar autoFocus />

          {/* Features - inline */}
          <div className="flex items-center justify-center gap-6 text-sm text-muted-foreground">
            <span className="flex items-center gap-2">
              <span className="size-1 rounded-full bg-muted-foreground/50" />
              Génération temps réel
            </span>
            <span className="flex items-center gap-2">
              <span className="size-1 rounded-full bg-muted-foreground/50" />
              Sources vérifiées
            </span>
            <span className="flex items-center gap-2">
              <span className="size-1 rounded-full bg-muted-foreground/50" />
              Knowledge graph
            </span>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-border">
        <div className="max-w-screen-lg mx-auto px-6 h-14 flex items-center justify-end text-sm text-muted-foreground">
          <div className="flex items-center gap-4">
            <Link
              href="/about"
              className="hover:text-foreground transition-colors"
            >
              À propos
            </Link>
            <Link
              href="/api"
              className="hover:text-foreground transition-colors"
            >
              API
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}

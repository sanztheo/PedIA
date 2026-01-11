import { SearchBar } from "@/components/search/SearchBar";

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-4">
      <main className="flex flex-col items-center justify-center gap-8 w-full max-w-2xl">
        <div className="flex flex-col items-center gap-3">
          <h1 className="text-6xl font-bold tracking-tight">
            PedIA
          </h1>
          <p className="text-lg text-muted-foreground">
            L&apos;encyclopédie qui évolue avec vous
          </p>
        </div>

        <div className="w-full max-w-xl">
          <SearchBar autoFocus />
        </div>
      </main>
    </div>
  );
}

import Link from 'next/link';
import Image from 'next/image';
import { ArrowLeft, Github, Sparkles, Globe, Brain, BookOpen } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border">
        <div className="max-w-3xl mx-auto px-6 h-14 flex items-center justify-between">
          <Link href="/" className="hover:opacity-70 transition-opacity">
            <Image
              src="/logo/logo_no_bg.svg"
              alt="PedIA"
              width={28}
              height={28}
              className="invert dark:invert-0"
            />
          </Link>
          <Button variant="ghost" size="sm" asChild>
            <Link href="/">
              <ArrowLeft className="size-4 mr-2" />
              Retour
            </Link>
          </Button>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-3xl mx-auto px-6 py-16">
        <article className="prose prose-neutral dark:prose-invert max-w-none">
          {/* Hero */}
          <div className="not-prose mb-12 text-center">
            <h1 className="text-4xl font-bold tracking-tight mb-4">
              À propos de PedIA
            </h1>
            <p className="text-lg text-muted-foreground">
              L&apos;encyclopédie qui évolue avec vos recherches
            </p>
          </div>

          {/* Features Grid */}
          <div className="not-prose grid gap-6 sm:grid-cols-2 mb-12">
            <FeatureCard
              icon={<Sparkles className="size-5" />}
              title="Génération IA"
              description="Contenu généré en temps réel par intelligence artificielle à partir de sources web fiables."
            />
            <FeatureCard
              icon={<Globe className="size-5" />}
              title="Sources vérifiées"
              description="Chaque article cite ses sources pour une transparence totale sur l'origine des informations."
            />
            <FeatureCard
              icon={<Brain className="size-5" />}
              title="Knowledge Graph"
              description="Navigation visuelle entre les concepts grâce à un graphe de connaissances interactif."
            />
            <FeatureCard
              icon={<BookOpen className="size-5" />}
              title="Open Source"
              description="Projet entièrement open source. Contribuez, modifiez, améliorez librement."
            />
          </div>

          {/* Content */}
          <h2>Notre mission</h2>
          <p>
            PedIA repense l&apos;accès à la connaissance. Plutôt que de maintenir manuellement 
            des millions d&apos;articles, nous utilisons l&apos;intelligence artificielle pour 
            générer du contenu à la demande, toujours à jour et sourcé.
          </p>

          <h2>Comment ça marche ?</h2>
          <ol>
            <li>
              <strong>Recherche</strong> — Vous tapez un sujet dans la barre de recherche
            </li>
            <li>
              <strong>Génération</strong> — Notre IA recherche et synthétise les informations 
              les plus pertinentes du web
            </li>
            <li>
              <strong>Enrichissement</strong> — Les entités mentionnées sont extraites et 
              liées au graphe de connaissances
            </li>
            <li>
              <strong>Exploration</strong> — Naviguez de concept en concept via les liens 
              et le graphe interactif
            </li>
          </ol>

          <h2>Technologie</h2>
          <p>
            PedIA est construit avec des technologies modernes : Next.js pour le frontend, 
            Hono pour l&apos;API, Prisma pour la base de données, et des modèles de langage 
            de pointe pour la génération de contenu.
          </p>

          <h2>Contribuer</h2>
          <p>
            Le projet est open source et accueille les contributions. Que vous soyez 
            développeur, designer ou simplement passionné, votre aide est la bienvenue.
          </p>

          {/* CTA */}
          <div className="not-prose flex flex-col sm:flex-row gap-4 mt-8 pt-8 border-t border-border">
            <Button asChild>
              <Link href="/">
                Commencer à explorer
              </Link>
            </Button>
            <Button variant="outline" asChild>
              <a 
                href="https://github.com/sanztheo/PedIA" 
                target="_blank" 
                rel="noopener noreferrer"
              >
                <Github className="size-4 mr-2" />
                Voir sur GitHub
              </a>
            </Button>
          </div>
        </article>
      </main>
    </div>
  );
}

function FeatureCard({ 
  icon, 
  title, 
  description 
}: { 
  icon: React.ReactNode; 
  title: string; 
  description: string;
}) {
  return (
    <div className="p-5 rounded-lg border border-border bg-muted/30">
      <div className="flex items-center gap-3 mb-2">
        <div className="text-primary">{icon}</div>
        <h3 className="font-medium">{title}</h3>
      </div>
      <p className="text-sm text-muted-foreground">{description}</p>
    </div>
  );
}

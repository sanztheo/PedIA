'use client';

import { useState } from 'react';
import { Link2, Share2, Check, MoreHorizontal, Flag, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface PageActionsMenuProps {
  title: string;
  slug: string;
  pageId: string;
}

const reportReasons = [
  { value: 'INACCURATE', label: 'Information inexacte' },
  { value: 'BIAS', label: 'Contenu biaisé' },
  { value: 'OUTDATED', label: 'Information obsolète' },
  { value: 'MISSING_SOURCE', label: 'Source manquante' },
  { value: 'OFFENSIVE', label: 'Contenu offensant' },
  { value: 'OTHER', label: 'Autre' },
];

export function PageActionsMenu({ title, slug, pageId }: PageActionsMenuProps) {
  const [copied, setCopied] = useState(false);
  const [reportOpen, setReportOpen] = useState(false);
  const [reportReason, setReportReason] = useState('');
  const [reportDetails, setReportDetails] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const pageUrl = typeof window !== 'undefined' 
    ? `${window.location.origin}/wiki/${slug}` 
    : `/wiki/${slug}`;

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(pageUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `${title} - PedIA`,
          url: pageUrl,
        });
      } catch (err) {
        if ((err as Error).name !== 'AbortError') {
          console.error('Share failed:', err);
        }
      }
    }
  };

  const handleReport = async () => {
    if (!reportReason) return;
    
    setIsSubmitting(true);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/reports`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          pageId,
          reason: reportReason,
          details: reportDetails || undefined,
        }),
      });
      
      if (res.ok) {
        setSubmitted(true);
        setReportReason('');
        setReportDetails('');
      }
    } catch (err) {
      console.error('Report failed:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCloseReport = () => {
    setReportOpen(false);
    // Reset submitted state after dialog closes
    setTimeout(() => setSubmitted(false), 300);
  };

  const canShare = typeof navigator !== 'undefined' && !!navigator.share;

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            className="text-muted-foreground hover:text-foreground"
          >
            <MoreHorizontal className="size-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-48">
          <DropdownMenuItem onClick={handleCopyLink}>
            {copied ? (
              <Check className="size-4 mr-2 text-green-500" />
            ) : (
              <Link2 className="size-4 mr-2" />
            )}
            {copied ? 'Copié !' : 'Copier le lien'}
          </DropdownMenuItem>
          {canShare && (
            <DropdownMenuItem onClick={handleShare}>
              <Share2 className="size-4 mr-2" />
              Partager
            </DropdownMenuItem>
          )}
          <DropdownMenuSeparator />
          <DropdownMenuItem 
            onClick={() => setReportOpen(true)}
            className="text-destructive focus:text-destructive"
          >
            <Flag className="size-4 mr-2" />
            Signaler un problème
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <Dialog open={reportOpen} onOpenChange={handleCloseReport}>
        <DialogContent>
          {submitted ? (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <CheckCircle2 className="size-5 text-green-500" />
                  Signalement envoyé
                </DialogTitle>
                <DialogDescription>
                  Merci pour votre contribution ! Notre équipe examinera votre signalement dans les plus brefs délais.
                </DialogDescription>
              </DialogHeader>
              <DialogFooter>
                <Button onClick={handleCloseReport}>
                  Fermer
                </Button>
              </DialogFooter>
            </>
          ) : (
            <>
              <DialogHeader>
                <DialogTitle>Signaler un problème</DialogTitle>
                <DialogDescription>
                  Aidez-nous à améliorer cette page en signalant une erreur ou un problème.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label>Type de problème</Label>
                  <Select value={reportReason} onValueChange={setReportReason}>
                    <SelectTrigger>
                      <SelectValue placeholder="Sélectionnez un motif" />
                    </SelectTrigger>
                    <SelectContent>
                      {reportReasons.map((reason) => (
                        <SelectItem key={reason.value} value={reason.value}>
                          {reason.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Détails (optionnel)</Label>
                  <Textarea
                    value={reportDetails}
                    onChange={(e) => setReportDetails(e.target.value)}
                    placeholder="Décrivez le problème..."
                    rows={3}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={handleCloseReport}>
                  Annuler
                </Button>
                <Button 
                  onClick={handleReport} 
                  disabled={!reportReason || isSubmitting}
                >
                  {isSubmitting ? 'Envoi...' : 'Envoyer'}
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}

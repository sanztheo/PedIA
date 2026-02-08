'use client';

import { useState } from 'react';
import { Flag } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ReportModal } from './ReportModal';

interface ReportButtonProps {
  pageId: string;
  pageTitle: string;
}

export function ReportButton({ pageId, pageTitle }: ReportButtonProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <Button
        variant="ghost"
        size="sm"
        className="text-muted-foreground hover:text-foreground gap-2"
        onClick={() => setIsOpen(true)}
      >
        <Flag className="size-4" />
        <span className="hidden sm:inline">Signaler un problème</span>
      </Button>

      <ReportModal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        pageId={pageId}
        pageTitle={pageTitle}
      />
    </>
  );
}

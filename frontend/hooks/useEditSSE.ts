"use client";

import { useState, useCallback, useRef } from "react";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

export interface UseEditSSEReturn {
  isEditing: boolean;
  activeSection: string | null;
  updatedContent: string | null;
  startEdit: (instruction?: string) => void;
  cancel: () => void;
}

export function useEditSSE(pageId: string): UseEditSSEReturn {
  const [isEditing, setIsEditing] = useState(false);
  const [activeSection, setActiveSection] = useState<string | null>(null);
  const [updatedContent, setUpdatedContent] = useState<string | null>(null);
  const esRef = useRef<EventSource | null>(null);

  const cancel = useCallback(() => {
    esRef.current?.close();
    esRef.current = null;
    setIsEditing(false);
    setActiveSection(null);
  }, []);

  const startEdit = useCallback(
    (instruction?: string) => {
      if (isEditing) return;

      setIsEditing(true);
      setActiveSection(null);
      setUpdatedContent(null);

      const url = `${API_URL}/api/pages/${pageId}/edit${
        instruction ? `?instruction=${encodeURIComponent(instruction)}` : ""
      }`;

      const es = new EventSource(url);
      esRef.current = es;

      es.addEventListener("section_editing", (e) => {
        try {
          const data = JSON.parse((e as MessageEvent).data);
          setActiveSection(data.sectionId);
        } catch {}
      });

      es.addEventListener("edit_complete", (e) => {
        try {
          const data = JSON.parse((e as MessageEvent).data);
          setUpdatedContent(data.content);
        } catch {}
        setIsEditing(false);
        setActiveSection(null);
        es.close();
        esRef.current = null;
      });

      es.addEventListener("error", () => {
        setIsEditing(false);
        setActiveSection(null);
        es.close();
        esRef.current = null;
      });
    },
    [pageId, isEditing],
  );

  return { isEditing, activeSection, updatedContent, startEdit, cancel };
}

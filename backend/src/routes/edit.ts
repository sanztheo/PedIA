import { Hono } from "hono";
import { streamSSE } from "hono/streaming";
import { generateText, streamText } from "ai";
import { google } from "@ai-sdk/google";
import prisma from "../lib/prisma";
import { deleteCache } from "../lib/redis";
import { VersionService } from "../services/version.service";
import { getSystemPrompt } from "../ai/prompts";

const app = new Hono();

function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

interface Section {
  id: string;
  heading: string;
  content: string;
}

function parseSections(content: string): Section[] {
  const sections: Section[] = [];
  const lines = content.split("\n");
  let current: { id: string; heading: string; lines: string[] } | null = null;
  const introLines: string[] = [];

  for (const line of lines) {
    const match = line.match(/^(#{1,3})\s+(.+)$/);
    if (match) {
      if (current) {
        sections.push({
          id: current.id,
          heading: current.heading,
          content: current.lines.join("\n").trim(),
        });
      } else if (introLines.length > 0) {
        sections.push({ id: "__intro__", heading: "", content: introLines.join("\n").trim() });
        introLines.length = 0;
      }
      current = { id: slugify(match[2]), heading: match[2], lines: [line] };
    } else if (current) {
      current.lines.push(line);
    } else {
      introLines.push(line);
    }
  }

  if (current) {
    sections.push({
      id: current.id,
      heading: current.heading,
      content: current.lines.join("\n").trim(),
    });
  } else if (introLines.length > 0) {
    sections.push({ id: "__intro__", heading: "", content: introLines.join("\n").trim() });
  }

  return sections;
}

app.get("/:id/edit", async (c) => {
  const pageId = c.req.param("id");
  const instruction = c.req.query("instruction") || "";

  const page = await prisma.page.findUnique({
    where: { id: pageId },
    select: { id: true, slug: true, title: true, content: true },
  });

  if (!page) {
    return c.json({ error: "Page not found" }, 404);
  }

  return streamSSE(c, async (stream) => {
    const send = (event: string, data: Record<string, unknown>) =>
      stream.writeSSE({ event, data: JSON.stringify(data) });

    try {
      const sections = parseSections(page.content);
      if (sections.length === 0) {
        await send("error", { type: "error", message: "No sections found" });
        return;
      }

      const model = google("gemini-2.0-flash");

      const sectionsOverview = sections
        .map((s, i) => `${i + 1}. id="${s.id}" heading="${s.heading || "Introduction"}" length=${s.content.length}`)
        .join("\n");

      const { text: choice } = await generateText({
        model,
        prompt: `Article: "${page.title}"\n\nSections:\n${sectionsOverview}\n\n${instruction ? `Instruction: ${instruction}\n\n` : ""}Reply with ONLY the id of the section to improve. No explanation.`,
      });

      const chosenId = choice.trim().toLowerCase().replace(/[^a-z0-9-]/g, "");
      const target =
        sections.find((s) => s.id === chosenId) ??
        sections[1] ??
        sections[0];

      await send("section_editing", { type: "section_editing", sectionId: target.id });

      let newSectionContent = "";

      const sectionLabel = target.heading || "Introduction";

      const { fullStream } = streamText({
        model,
        maxOutputTokens: 4096,
        system: getSystemPrompt("edit"),
        messages: [
          {
            role: "user",
            content: `Article: "${page.title}"\n\nSection à améliorer: "${sectionLabel}"\n\nContenu actuel:\n${target.content}\n\n${
              instruction ? `Instruction spécifique: ${instruction}` : "Améliore le contenu en gardant un ton encyclopédique."
            }`,
          },
        ],
      });

      for await (const chunk of fullStream) {
        if (chunk.type === "text-delta") {
          newSectionContent += chunk.text;
          await send("content", {
            type: "content_chunk",
            content: chunk.text,
            sectionId: target.id,
          });
        }
      }

      // Reconstruct content from sections to avoid fragile .replace()
      const updatedSections = sections.map(s => {
        if (s.id === target.id) {
          return {
            ...s,
            content: s.heading 
              ? `${s.heading}\n\n${newSectionContent.trim()}`
              : newSectionContent.trim()
          };
        }
        return s;
      });

      const updatedContent = updatedSections
        .map(s => s.content)
        .join('\n\n')
        .trim();

      await prisma.page.update({
        where: { id: pageId },
        data: { content: updatedContent, updatedAt: new Date() },
      });

      VersionService.createVersion(
        pageId,
        updatedContent,
        `Amélioration "${target.heading}"`,
      ).catch((err) => {
        console.error('[EDIT] Failed to create version:', err);
      });

      deleteCache(`page:${page.slug}`).catch((err) => {
        console.error('[EDIT] Failed to invalidate cache:', err);
      });

      await send("edit_complete", {
        type: "edit_complete",
        sectionId: target.id,
        content: updatedContent,
      });
    } catch (err) {
      await send("error", {
        type: "error",
        message: err instanceof Error ? err.message : "Edit failed",
      });
    }
  });
});

export default app;

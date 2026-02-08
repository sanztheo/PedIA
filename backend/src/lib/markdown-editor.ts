import { unified } from "unified";
import remarkParse from "remark-parse";
import type { Root, RootContent } from "mdast";

export interface Section {
  id: string;
  type: "heading" | "paragraph" | "list" | "code" | "other";
  depth?: number;
  content: string;
  startLine: number;
  endLine: number;
}

export interface EditResult {
  success: boolean;
  content: string;
  changedSection?: string;
  error?: string;
}

function getNodeContent(node: RootContent): string {
  if ("value" in node) return node.value;
  if ("children" in node) {
    return (node.children as RootContent[]).map(getNodeContent).join("");
  }
  return "";
}

export function parseMarkdownSections(markdown: string): Section[] {
  const sections: Section[] = [];
  const processor = unified().use(remarkParse);
  const tree = processor.parse(markdown) as Root;

  let currentHeadingDepth = 0;
  const headingCounts: Record<number, number> = {};
  let paragraphCount = 0;
  let listCount = 0;
  let codeCount = 0;

  for (const node of tree.children) {
    const startLine = node.position?.start.line ?? 0;
    const endLine = node.position?.end.line ?? 0;

    if (node.type === "heading") {
      currentHeadingDepth = node.depth;
      headingCounts[node.depth] = (headingCounts[node.depth] || 0) + 1;
      paragraphCount = 0;
      listCount = 0;
      codeCount = 0;

      sections.push({
        id: `section_${node.depth}_${headingCounts[node.depth]}`,
        type: "heading",
        depth: node.depth,
        content: getNodeContent(node),
        startLine,
        endLine,
      });
    } else if (node.type === "paragraph") {
      paragraphCount++;
      sections.push({
        id: `para_${currentHeadingDepth}_${paragraphCount}`,
        type: "paragraph",
        content: getNodeContent(node),
        startLine,
        endLine,
      });
    } else if (node.type === "list") {
      listCount++;
      sections.push({
        id: `list_${currentHeadingDepth}_${listCount}`,
        type: "list",
        content: getNodeContent(node),
        startLine,
        endLine,
      });
    } else if (node.type === "code") {
      codeCount++;
      sections.push({
        id: `code_${currentHeadingDepth}_${codeCount}`,
        type: "code",
        content: node.value,
        startLine,
        endLine,
      });
    }
  }

  return sections;
}

export function editSection(
  markdown: string,
  sectionId: string,
  newContent: string
): EditResult {
  const lines = markdown.split("\n");
  const sections = parseMarkdownSections(markdown);
  const section = sections.find((s) => s.id === sectionId);

  if (!section) {
    return {
      success: false,
      content: markdown,
      error: `Section ${sectionId} not found`,
    };
  }

  const before = lines.slice(0, section.startLine - 1);
  const after = lines.slice(section.endLine);
  const result = [...before, newContent, ...after].join("\n");

  return {
    success: true,
    content: result,
    changedSection: sectionId,
  };
}

export function insertAfterSection(
  markdown: string,
  afterSectionId: string,
  content: string
): EditResult {
  const lines = markdown.split("\n");
  const sections = parseMarkdownSections(markdown);
  const section = sections.find((s) => s.id === afterSectionId);

  if (!section) {
    return {
      success: false,
      content: markdown,
      error: `Section ${afterSectionId} not found`,
    };
  }

  const before = lines.slice(0, section.endLine);
  const after = lines.slice(section.endLine);
  const result = [...before, "", content, ...after].join("\n");

  return {
    success: true,
    content: result,
    changedSection: afterSectionId,
  };
}

export function appendToSection(
  markdown: string,
  sectionId: string,
  content: string
): EditResult {
  const lines = markdown.split("\n");
  const sections = parseMarkdownSections(markdown);
  const sectionIndex = sections.findIndex((s) => s.id === sectionId);

  if (sectionIndex === -1) {
    return {
      success: false,
      content: markdown,
      error: `Section ${sectionId} not found`,
    };
  }

  const section = sections[sectionIndex];
  const nextSection = sections[sectionIndex + 1];
  const insertLine = nextSection ? nextSection.startLine - 1 : lines.length;

  const before = lines.slice(0, insertLine);
  const after = lines.slice(insertLine);
  const result = [...before, content, ...after].join("\n");

  return {
    success: true,
    content: result,
    changedSection: sectionId,
  };
}

export function deleteSection(markdown: string, sectionId: string): EditResult {
  const lines = markdown.split("\n");
  const sections = parseMarkdownSections(markdown);
  const section = sections.find((s) => s.id === sectionId);

  if (!section) {
    return {
      success: false,
      content: markdown,
      error: `Section ${sectionId} not found`,
    };
  }

  const before = lines.slice(0, section.startLine - 1);
  const after = lines.slice(section.endLine);
  const result = [...before, ...after].join("\n");

  return {
    success: true,
    content: result,
    changedSection: sectionId,
  };
}

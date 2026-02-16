'use client';

import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { isValidElement, cloneElement, type ReactNode, type ReactElement } from 'react';

interface MarkdownContentProps {
  content: string;
  activeSection?: string;
  className?: string;
}

interface Section {
  id: string;
  content: string;
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

function cleanMarkdownContent(content: string): string {
  let cleaned = content.trim();
  cleaned = cleaned.replace(/^```(?:markdown|md)?\s*\n?/, '');
  cleaned = cleaned.replace(/\n?```\s*$/, '');
  return cleaned.trim();
}

function splitIntoSections(content: string): Section[] {
  const sections: Section[] = [];
  const lines = content.split('\n');
  let current: { id: string; lines: string[] } | null = null;
  const introLines: string[] = [];

  for (const line of lines) {
    const match = line.match(/^(#{1,3})\s+(.+)$/);
    if (match) {
      if (current) {
        sections.push({ id: current.id, content: current.lines.join('\n') });
      } else if (introLines.length > 0) {
        sections.push({ id: '__intro__', content: introLines.join('\n') });
        introLines.length = 0;
      }
      current = { id: slugify(match[2]), lines: [line] };
    } else if (current) {
      current.lines.push(line);
    } else {
      introLines.push(line);
    }
  }

  if (current) {
    sections.push({ id: current.id, content: current.lines.join('\n') });
  } else if (introLines.length > 0) {
    sections.push({ id: '__intro__', content: introLines.join('\n') });
  }

  return sections;
}

function parseWikiLinks(text: string): ReactNode[] {
  const parts: ReactNode[] = [];
  const regex = /\[\[([^\]]+)\]\]/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      parts.push(text.slice(lastIndex, match.index));
    }

    const entityName = match[1];
    const slug = slugify(entityName);

    parts.push(
      <Link
        key={`${slug}-${match.index}`}
        href={`/search?q=${encodeURIComponent(entityName)}`}
        className="text-primary font-medium hover:underline decoration-primary/30 underline-offset-4 transition-colors"
      >
        {entityName}
      </Link>
    );

    lastIndex = match.index + match[0].length;
  }

  if (lastIndex < text.length) {
    parts.push(text.slice(lastIndex));
  }

  return parts.length > 0 ? parts : [text];
}

const markdownComponents = {
  h1: ({ children }: { children?: ReactNode }) => (
    <h1 className="text-4xl font-bold tracking-tight mb-6 mt-10 pb-4 border-b border-border text-foreground">
      {children}
    </h1>
  ),
  h2: ({ children }: { children?: ReactNode }) => {
    const text = typeof children === 'string' ? children : '';
    const id = slugify(text);
    return (
      <h2 id={id} className="text-2xl font-bold tracking-tight mb-4 mt-10 text-foreground group">
        {children}
        <a href={`#${id}`} className="ml-2 opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-foreground transition-opacity">#</a>
      </h2>
    );
  },
  h3: ({ children }: { children?: ReactNode }) => {
    const text = typeof children === 'string' ? children : '';
    const id = slugify(text);
    return (
      <h3 id={id} className="text-xl font-semibold tracking-tight mb-3 mt-8 text-foreground group">
        {children}
        <a href={`#${id}`} className="ml-2 opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-foreground transition-opacity text-sm">#</a>
      </h3>
    );
  },
  p: ({ children }: { children?: ReactNode }) => {
    const processed = processChildren(children);
    return (
      <p className="text-base leading-7 text-muted-foreground mb-6">
        {processed}
      </p>
    );
  },
  ul: ({ children }: { children?: ReactNode }) => (
    <ul className="list-disc list-outside ml-6 mb-6 space-y-2 text-muted-foreground">
      {children}
    </ul>
  ),
  ol: ({ children }: { children?: ReactNode }) => (
    <ol className="list-decimal list-outside ml-6 mb-6 space-y-2 text-muted-foreground">
      {children}
    </ol>
  ),
  li: ({ children }: { children?: ReactNode }) => {
    const processed = processChildren(children);
    return (
      <li className="text-base leading-7 pl-2">
        {processed}
      </li>
    );
  },
  a: ({ href, children }: { href?: string; children?: ReactNode }) => (
    <a
      href={href}
      className="text-primary font-medium underline underline-offset-4 decoration-primary/40 hover:decoration-primary transition-colors"
      target={href?.startsWith('http') ? '_blank' : undefined}
      rel={href?.startsWith('http') ? 'noopener noreferrer' : undefined}
    >
      {children}
    </a>
  ),
  strong: ({ children }: { children?: ReactNode }) => (
    <strong className="font-semibold text-foreground">{children}</strong>
  ),
  em: ({ children }: { children?: ReactNode }) => (
    <em className="italic">{children}</em>
  ),
  blockquote: ({ children }: { children?: ReactNode }) => (
    <blockquote className="border-l-4 border-primary/50 bg-muted/30 rounded-r-lg py-4 px-6 my-6 text-muted-foreground">
      {children}
    </blockquote>
  ),
  code: ({ className, children }: { className?: string; children?: ReactNode }) => {
    const isInline = !className;
    if (isInline) {
      return (
        <code className="bg-muted px-1.5 py-0.5 rounded text-sm font-mono text-foreground">
          {children}
        </code>
      );
    }
    return (
      <code className={cn('font-mono text-sm', className)}>
        {children}
      </code>
    );
  },
  pre: ({ children }: { children?: ReactNode }) => (
    <pre className="bg-muted/50 border border-border rounded-xl p-6 overflow-x-auto my-6">
      {children}
    </pre>
  ),
  hr: () => <hr className="border-border my-10" />,
  table: ({ children }: { children?: ReactNode }) => (
    <div className="overflow-x-auto my-6">
      <table className="w-full border-collapse border border-border rounded-lg overflow-hidden">
        {children}
      </table>
    </div>
  ),
  thead: ({ children }: { children?: ReactNode }) => (
    <thead className="bg-muted/50">{children}</thead>
  ),
  th: ({ children }: { children?: ReactNode }) => (
    <th className="text-left font-semibold text-foreground px-4 py-3 border-b border-border">
      {children}
    </th>
  ),
  td: ({ children }: { children?: ReactNode }) => {
    const processed = processChildren(children);
    return (
      <td className="px-4 py-3 border-b border-border text-muted-foreground">
        {processed}
      </td>
    );
  },
};

export function MarkdownContent({ content, activeSection, className }: MarkdownContentProps) {
  const cleaned = cleanMarkdownContent(content);
  const sections = splitIntoSections(cleaned);

  return (
    <div className={cn('markdown-content', className)}>
      {sections.map((section) => (
        <div
          key={section.id}
          data-section={section.id}
          className={cn(
            'transition-all duration-500 rounded-r-lg',
            activeSection === section.id && 'section-editing',
          )}
        >
          <ReactMarkdown
            remarkPlugins={[remarkGfm]}
            components={markdownComponents}
          >
            {section.content}
          </ReactMarkdown>
        </div>
      ))}
    </div>
  );
}

function processChildren(children: ReactNode): ReactNode {
  if (typeof children === 'string') {
    return parseWikiLinks(children);
  }

  if (Array.isArray(children)) {
    return children.map((child, i) => {
      if (typeof child === 'string') {
        const parts = parseWikiLinks(child);
        return parts.length === 1 ? parts[0] : <span key={i}>{parts}</span>;
      }
      if (isValidElement(child)) {
        return processElement(child, i);
      }
      return child;
    });
  }

  if (isValidElement(children)) {
    return processElement(children);
  }

  return children;
}

function processElement(element: ReactElement, key?: number): ReactNode {
  const props = element.props as { children?: ReactNode };
  if (!props.children) {
    return element;
  }

  const processedChildren = processChildren(props.children);
  return cloneElement(element, { key: key ?? element.key }, processedChildren);
}

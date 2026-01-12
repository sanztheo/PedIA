import ReactMarkdown from 'react-markdown';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { isValidElement, cloneElement, type ReactNode, type ReactElement } from 'react';

interface MarkdownContentProps {
  content: string;
  className?: string;
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
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
        href={`/wiki/${slug}`}
        className="inline-flex items-center gap-1 text-primary font-medium hover:underline underline-offset-2 decoration-primary/40"
      >
        <span className="size-1.5 rounded-full bg-primary/60" />
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

export function MarkdownContent({ content, className }: MarkdownContentProps) {
  return (
    <article
      className={cn(
        'prose prose-neutral dark:prose-invert max-w-none',
        'prose-headings:font-semibold',
        'prose-a:text-primary prose-a:no-underline hover:prose-a:underline',
        'prose-code:bg-muted prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded prose-code:before:content-none prose-code:after:content-none',
        'prose-pre:bg-muted prose-pre:border',
        'prose-blockquote:border-l-primary',
        'prose-img:rounded-lg',
        className
      )}
    >
      <ReactMarkdown
        components={{
          p: ({ children }) => {
            const processed = processChildren(children);
            return <p>{processed}</p>;
          },
          li: ({ children }) => {
            const processed = processChildren(children);
            return <li>{processed}</li>;
          },
          td: ({ children }) => {
            const processed = processChildren(children);
            return <td>{processed}</td>;
          },
        }}
      >
        {content}
      </ReactMarkdown>
    </article>
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

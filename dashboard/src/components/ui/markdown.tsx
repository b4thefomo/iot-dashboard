"use client";

import ReactMarkdown from "react-markdown";

interface MarkdownProps {
  content: string;
}

export function Markdown({ content }: MarkdownProps) {
  return (
    <div className="text-sm leading-relaxed">
      <ReactMarkdown
        components={{
          p: ({ children }) => (
            <p className="mb-3 last:mb-0">{children}</p>
          ),
          strong: ({ children }) => (
            <strong className="font-bold text-foreground">{children}</strong>
          ),
          em: ({ children }) => (
            <em className="italic">{children}</em>
          ),
          ul: ({ children }) => (
            <ul className="list-disc pl-5 mb-3 space-y-1.5 marker:text-primary">{children}</ul>
          ),
          ol: ({ children }) => (
            <ol className="list-decimal pl-5 mb-3 space-y-1.5 marker:text-primary marker:font-semibold">{children}</ol>
          ),
          li: ({ children }) => (
            <li className="pl-1">{children}</li>
          ),
          h1: ({ children }) => (
            <h1 className="text-base font-bold mb-2 mt-4 first:mt-0 text-foreground border-b border-border pb-1">{children}</h1>
          ),
          h2: ({ children }) => (
            <h2 className="text-sm font-bold mb-2 mt-4 first:mt-0 text-foreground">{children}</h2>
          ),
          h3: ({ children }) => (
            <h3 className="text-sm font-semibold mb-1.5 mt-3 first:mt-0 text-foreground">{children}</h3>
          ),
          code: ({ children, className }) => {
            // Check if it's a code block (has language class) or inline code
            const isBlock = className?.includes('language-');
            if (isBlock) {
              return (
                <code className="text-xs font-mono">{children}</code>
              );
            }
            return (
              <code className="bg-primary/10 text-primary px-1.5 py-0.5 rounded text-xs font-mono">{children}</code>
            );
          },
          pre: ({ children }) => (
            <pre className="bg-muted/80 border border-border p-3 rounded-lg text-xs overflow-x-auto mb-3 mt-2">{children}</pre>
          ),
          a: ({ href, children }) => (
            <a
              href={href}
              className="text-primary font-medium underline underline-offset-2 hover:no-underline"
              target="_blank"
              rel="noopener noreferrer"
            >
              {children}
            </a>
          ),
          blockquote: ({ children }) => (
            <blockquote className="border-l-3 border-primary/50 bg-muted/30 pl-4 py-2 pr-2 italic mb-3 rounded-r">{children}</blockquote>
          ),
          hr: () => (
            <hr className="my-4 border-border" />
          ),
          table: ({ children }) => (
            <div className="overflow-x-auto mb-3">
              <table className="min-w-full text-xs border border-border rounded">{children}</table>
            </div>
          ),
          thead: ({ children }) => (
            <thead className="bg-muted/50">{children}</thead>
          ),
          th: ({ children }) => (
            <th className="px-3 py-2 text-left font-semibold border-b border-border">{children}</th>
          ),
          td: ({ children }) => (
            <td className="px-3 py-2 border-b border-border">{children}</td>
          ),
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}

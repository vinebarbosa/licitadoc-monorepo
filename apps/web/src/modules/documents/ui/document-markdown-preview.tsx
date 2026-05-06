import type { ComponentProps } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { cn } from "@/shared/lib/utils";

const SAFE_PROTOCOLS = ["http:", "https:", "mailto:"];

function isSafeHref(href: string | undefined): boolean {
  if (!href) return false;
  if (href.startsWith("/") || href.startsWith("#") || href.startsWith(".")) return true;
  try {
    const { protocol } = new URL(href);
    return SAFE_PROTOCOLS.includes(protocol);
  } catch {
    return false;
  }
}

const components: ComponentProps<typeof ReactMarkdown>["components"] = {
  h1: ({ children }) => (
    <h1 className="mb-4 mt-8 text-2xl font-bold tracking-tight first:mt-0">{children}</h1>
  ),
  h2: ({ children }) => (
    <h2 className="mb-3 mt-7 text-xl font-semibold tracking-tight first:mt-0">{children}</h2>
  ),
  h3: ({ children }) => <h3 className="mb-2 mt-6 text-lg font-semibold first:mt-0">{children}</h3>,
  h4: ({ children }) => (
    <h4 className="mb-2 mt-5 text-base font-semibold first:mt-0">{children}</h4>
  ),
  h5: ({ children }) => <h5 className="mb-1 mt-4 text-sm font-semibold first:mt-0">{children}</h5>,
  h6: ({ children }) => (
    <h6 className="mb-1 mt-4 text-sm font-medium text-muted-foreground first:mt-0">{children}</h6>
  ),
  p: ({ children }) => <p className="mb-4 indent-8 text-justify leading-7 last:mb-0">{children}</p>,
  ul: ({ children }) => <ul className="mb-4 ml-6 list-disc space-y-1 last:mb-0">{children}</ul>,
  ol: ({ children }) => <ol className="mb-4 ml-6 list-decimal space-y-1 last:mb-0">{children}</ol>,
  li: ({ children }) => <li className="leading-7">{children}</li>,
  blockquote: ({ children }) => (
    <blockquote className="mb-4 border-l-4 border-border pl-4 italic text-muted-foreground last:mb-0">
      {children}
    </blockquote>
  ),
  code: ({ children, className }) => {
    const isBlock = className?.includes("language-");
    if (isBlock) {
      return (
        <code className="block whitespace-pre-wrap break-words font-mono text-sm">{children}</code>
      );
    }
    return (
      <code className="rounded bg-muted px-1 py-0.5 font-mono text-sm text-foreground">
        {children}
      </code>
    );
  },
  pre: ({ children }) => (
    <pre className="mb-4 overflow-x-auto rounded-md border bg-muted p-4 last:mb-0">{children}</pre>
  ),
  a: ({ href, children }) => {
    const safe = isSafeHref(href);
    if (!safe) {
      return <span className="underline">{children}</span>;
    }
    const isExternal = href?.startsWith("http://") || href?.startsWith("https://");
    return (
      <a
        href={href}
        className="font-medium text-primary underline underline-offset-4 hover:opacity-80"
        {...(isExternal ? { target: "_blank", rel: "noopener noreferrer" } : {})}
      >
        {children}
      </a>
    );
  },
  strong: ({ children }) => <strong className="font-semibold">{children}</strong>,
  em: ({ children }) => <em className="italic">{children}</em>,
  hr: () => <hr className="my-6 border-border" />,
  table: ({ children }) => (
    <div className="mb-4 w-full overflow-x-auto last:mb-0">
      <table className="w-full border-collapse text-sm">{children}</table>
    </div>
  ),
  thead: ({ children }) => <thead className="bg-muted">{children}</thead>,
  tbody: ({ children }) => <tbody>{children}</tbody>,
  tr: ({ children }) => <tr className="border-b border-border last:border-0">{children}</tr>,
  th: ({ children }) => (
    <th className="border border-border px-4 py-2 text-left font-medium">{children}</th>
  ),
  td: ({ children }) => <td className="border border-border px-4 py-2">{children}</td>,
};

export function DocumentMarkdownPreview({
  content,
  className,
}: {
  content: string;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "text-sm leading-7 text-foreground",
        "[&>*:first-child]:mt-0 [&>*:last-child]:mb-0",
        className,
      )}
    >
      <ReactMarkdown remarkPlugins={[remarkGfm]} components={components}>
        {content}
      </ReactMarkdown>
    </div>
  );
}

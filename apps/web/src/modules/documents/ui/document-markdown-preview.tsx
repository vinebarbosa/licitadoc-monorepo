import type { ComponentProps, ReactNode } from "react";
import { isValidElement } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { cn } from "@/shared/lib/utils";
import {
  institutionalDocumentSelectors,
  institutionalDocumentTheme,
} from "./institutional-document-theme";

const SAFE_PROTOCOLS = ["http:", "https:", "mailto:"];
const ADMINISTRATIVE_FIELD_LABELS = [
  "Unidade Orcamentaria",
  "Unidade Orçamentária",
  "Numero da Solicitacao",
  "Número da Solicitação",
  "Data de Emissao",
  "Data de Emissão",
  "Processo",
  "Objeto",
  "Objeto da Solicitacao",
  "Objeto da Solicitação",
  "Solicitante",
  "Responsavel pela Solicitacao",
  "Responsável pela Solicitação",
];

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

function getPlainText(children: ReactNode): string {
  if (typeof children === "string" || typeof children === "number") {
    return String(children);
  }

  if (Array.isArray(children)) {
    return children.map(getPlainText).join("");
  }

  if (isValidElement<{ children?: ReactNode }>(children)) {
    return getPlainText(children.props.children);
  }

  return "";
}

function getAdministrativeFieldParts(text: string) {
  const normalizedText = text.trim();

  for (const label of ADMINISTRATIVE_FIELD_LABELS) {
    const prefix = `${label}:`;

    if (normalizedText.toLocaleLowerCase("pt-BR").startsWith(prefix.toLocaleLowerCase("pt-BR"))) {
      return {
        label: normalizedText.slice(0, prefix.length),
        value: normalizedText.slice(prefix.length).trimStart(),
      };
    }
  }

  return null;
}

function isSignatureHeading(children: ReactNode) {
  return /\b(fecho|assinatura)\b/i.test(getPlainText(children));
}

const components: NonNullable<ComponentProps<typeof ReactMarkdown>["components"]> = {
  h1: ({ children }) => (
    <h1 className={institutionalDocumentTheme.mainTitleClassName}>{children}</h1>
  ),
  h2: ({ children }) => {
    const signatureHeading = isSignatureHeading(children);

    return (
      <h2
        className={cn(
          institutionalDocumentTheme.sectionTitleClassName,
          signatureHeading && institutionalDocumentTheme.signatureHeadingClassName,
        )}
        {...(signatureHeading ? { [institutionalDocumentSelectors.signatureHeading]: true } : {})}
      >
        {children}
      </h2>
    );
  },
  h3: ({ children }) => {
    const signatureHeading = isSignatureHeading(children);

    return (
      <h3
        className={cn(
          institutionalDocumentTheme.subtitleClassName,
          signatureHeading && institutionalDocumentTheme.signatureHeadingClassName,
        )}
        {...(signatureHeading ? { [institutionalDocumentSelectors.signatureHeading]: true } : {})}
      >
        {children}
      </h3>
    );
  },
  h4: ({ children }) => (
    <h4 className={institutionalDocumentTheme.subtitleClassName}>{children}</h4>
  ),
  h5: ({ children }) => (
    <h5 className={institutionalDocumentTheme.subtitleClassName}>{children}</h5>
  ),
  h6: ({ children }) => (
    <h6 className={institutionalDocumentTheme.subtitleClassName}>{children}</h6>
  ),
  p: ({ children }) => <p className={institutionalDocumentTheme.paragraphClassName}>{children}</p>,
  ul: ({ children }) => <ul className={institutionalDocumentTheme.listClassName}>{children}</ul>,
  ol: ({ children }) => <ol className={institutionalDocumentTheme.listClassName}>{children}</ol>,
  li: ({ children }) => {
    const administrativeField = getAdministrativeFieldParts(getPlainText(children));

    if (administrativeField) {
      return (
        <li
          className={cn(
            institutionalDocumentTheme.listItemClassName,
            institutionalDocumentTheme.administrativeFieldClassName,
          )}
          data-institutional-administrative-field
        >
          <span className={institutionalDocumentTheme.administrativeFieldLabelClassName}>
            {administrativeField.label}
          </span>{" "}
          <span>{administrativeField.value}</span>
        </li>
      );
    }

    return <li className={institutionalDocumentTheme.listItemClassName}>{children}</li>;
  },
  blockquote: ({ children }) => (
    <blockquote className={institutionalDocumentTheme.blockquoteClassName}>{children}</blockquote>
  ),
  code: ({ children, className }) => {
    const isBlock = className?.includes("language-");
    if (isBlock) {
      return <code className={institutionalDocumentTheme.blockCodeClassName}>{children}</code>;
    }
    return <code className={institutionalDocumentTheme.inlineCodeClassName}>{children}</code>;
  },
  pre: ({ children }) => <pre className={institutionalDocumentTheme.preClassName}>{children}</pre>,
  a: ({ href, children }) => {
    const safe = isSafeHref(href);
    if (!safe) {
      return <span className="underline">{children}</span>;
    }
    const isExternal = href?.startsWith("http://") || href?.startsWith("https://");
    return (
      <a
        href={href}
        className={institutionalDocumentTheme.linkClassName}
        {...(isExternal ? { target: "_blank", rel: "noopener noreferrer" } : {})}
      >
        {children}
      </a>
    );
  },
  strong: ({ children }) => <strong className="font-semibold">{children}</strong>,
  em: ({ children }) => <em className="italic">{children}</em>,
  hr: () => <hr className={institutionalDocumentTheme.horizontalRuleClassName} />,
  table: ({ children }) => (
    <div className={institutionalDocumentTheme.tableWrapperClassName}>
      <table className={institutionalDocumentTheme.tableClassName}>{children}</table>
    </div>
  ),
  thead: ({ children }) => <thead>{children}</thead>,
  tbody: ({ children }) => <tbody>{children}</tbody>,
  tr: ({ children }) => <tr>{children}</tr>,
  th: ({ children }) => <th>{children}</th>,
  td: ({ children }) => <td>{children}</td>,
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
        institutionalDocumentTheme.markdownClassName,
        "[&>*:first-child]:mt-0 [&>*:last-child]:mb-0",
        className,
      )}
      data-institutional-document-markdown
    >
      <ReactMarkdown remarkPlugins={[remarkGfm]} components={components}>
        {content}
      </ReactMarkdown>
    </div>
  );
}

import type { ReactNode } from "react";
import { DocumentWatermark } from "./document-watermark";
import { PageFooter } from "./page-footer";
import { PageHeader } from "./page-header";

export type PaperLayoutProps = {
  children: ReactNode;
  footer?: {
    address?: string;
    cnpj?: string;
    showPageNumbers?: boolean;
    website?: string;
  };
  header?: {
    department?: string;
    logo?: ReactNode;
    organization: string;
    subtitle?: string;
  };
  watermark?: {
    enabled?: boolean;
    label?: string;
  };
};

export function PaperLayout({ children, footer, header, watermark }: PaperLayoutProps) {
  return (
    <article className="paged-paper">
      {header ? (
        <header className="paged-paper-header">
          <PageHeader {...header} />
        </header>
      ) : null}

      {watermark?.enabled ? <DocumentWatermark label={watermark.label} /> : null}

      <main className="paged-paper-body">{children}</main>

      {footer ? (
        <footer className="paged-paper-footer">
          <PageFooter {...footer} />
        </footer>
      ) : null}
    </article>
  );
}

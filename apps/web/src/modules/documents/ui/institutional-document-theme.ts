import type { CSSProperties } from "react";
import { cn } from "@/shared/lib/utils";

export const institutionalDocumentSelectors = {
  outputRoot: "data-institutional-document-output",
  noBranding: "data-institutional-document-no-branding",
  sheet: "data-institutional-document-sheet",
  body: "data-institutional-document-body",
  liveStatus: "data-institutional-document-live-status",
  markdown: "data-institutional-document-markdown",
  signatureHeading: "data-institutional-signature-heading",
} as const;

export const institutionalDocumentThemeTokens = {
  "--institutional-page-width": "794px",
  "--institutional-page-min-height": "1123px",
  "--institutional-margin-top": "100px",
  "--institutional-margin-bottom": "80px",
  "--institutional-margin-inline": "90px",
  "--institutional-font-family": '"Times New Roman", "Liberation Serif", serif',
  "--institutional-text-color": "#000000",
  "--institutional-body-size": "12pt",
  "--institutional-title-size": "13pt",
  "--institutional-subtitle-size": "12pt",
  "--institutional-line-height": "1.55",
  "--institutional-paragraph-indent": "45px",
  "--institutional-paragraph-spacing": "12px",
  "--institutional-title-spacing": "28px",
  "--institutional-section-margin-top": "22px",
  "--institutional-section-margin-bottom": "12px",
  "--institutional-list-indent": "40px",
  "--institutional-list-item-spacing": "10px",
  "--institutional-signature-spacing": "60px",
} as CSSProperties;

export const institutionalDocumentTheme = {
  outputRootClassName: "institutional-document-output",
  sheetClassName: "institutional-document-sheet",
  bodyClassName: "institutional-document-body",
  liveStatusClassName: "institutional-document-live-status",
  markdownClassName: "institutional-document-markdown",
  mainTitleClassName: "institutional-document-title",
  sectionTitleClassName: "institutional-document-section-title",
  subtitleClassName: "institutional-document-subtitle",
  paragraphClassName: "institutional-document-paragraph",
  listClassName: "institutional-document-list",
  listItemClassName: "institutional-document-list-item",
  administrativeFieldClassName: "institutional-document-field",
  administrativeFieldLabelClassName: "institutional-document-field-label",
  tableWrapperClassName: "institutional-document-table-wrapper",
  tableClassName: "institutional-document-table",
  blockquoteClassName: "institutional-document-blockquote",
  inlineCodeClassName: "institutional-document-inline-code",
  blockCodeClassName: "institutional-document-block-code",
  preClassName: "institutional-document-pre",
  linkClassName: "institutional-document-link",
  horizontalRuleClassName: "institutional-document-rule",
  signatureHeadingClassName: "institutional-document-signature-heading",
};

export function getInstitutionalDocumentOutputClassName(className?: string) {
  return cn(institutionalDocumentTheme.outputRootClassName, className);
}

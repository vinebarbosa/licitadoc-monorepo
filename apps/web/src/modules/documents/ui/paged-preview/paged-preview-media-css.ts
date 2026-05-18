export const pagedPreviewMediaCss = `
@page {
  size: A4;
  margin: 50mm 25mm 48mm;
}

.paged-paper {
  position: relative;
  isolation: isolate;
  color: #111111;
  font-family: "Times New Roman", "Liberation Serif", serif;
  font-size: 12pt;
  line-height: 1.5;
}

.paged-paper-body,
.paged-paper-header,
.paged-paper-footer {
  position: relative;
  z-index: 1;
}

.paged-paper-header {
  position: running(page-header);
}

.paged-paper-footer {
  position: running(page-footer);
}

.paged-paper-watermark {
  position: fixed;
  top: 78mm;
  right: 12mm;
  left: 12mm;
  z-index: -1;
  display: flex;
  justify-content: center;
  color: rgb(15 23 42 / 8%);
  font-family: Arial, sans-serif;
  font-size: 72pt;
  font-weight: 800;
  letter-spacing: 0.08em;
  text-align: center;
  transform: rotate(-24deg);
}

.paged-paper-body h1,
.paged-paper-body h2,
.paged-paper-body h3 {
  break-after: avoid;
  page-break-after: avoid;
}

.paged-paper-body h1 {
  margin: 0 0 18pt;
  text-align: center;
  text-transform: uppercase;
  font-size: 14pt;
  line-height: 1.35;
}

.paged-paper-body h2 {
  margin: 18pt 0 8pt;
  text-transform: uppercase;
  font-size: 12.5pt;
  line-height: 1.35;
}

.paged-paper-body p {
  margin: 0 0 9pt;
  text-align: justify;
  text-indent: 35pt;
}

.paged-paper-body .ProseMirror {
  min-height: 0;
  outline: none;
}

.paged-paper-body .ProseMirror > *:first-child,
.paged-paper-body .institutional-document-markdown > *:first-child {
  margin-top: 0;
}

.paged-paper-body .ProseMirror > *:last-child,
.paged-paper-body .institutional-document-markdown > *:last-child {
  margin-bottom: 0;
}

.paged-paper-body p[data-indent-level="1"] {
  text-indent: 55pt;
}

.paged-paper-body p[data-indent-level="2"] {
  text-indent: 75pt;
}

.paged-paper-body p[data-indent-level="3"] {
  text-indent: 95pt;
}

.paged-paper-body p[data-indent-level="4"] {
  text-indent: 115pt;
}

.paged-paper-body p[data-indent-level="5"] {
  text-indent: 135pt;
}

.paged-paper-body p[data-indent-level="6"] {
  text-indent: 155pt;
}

.paged-paper-body p[data-no-first-line-indent="true"],
.paged-paper-body li p {
  text-indent: 0;
}

.paged-paper-body p[data-signature-closing-part="date"] {
  margin-top: 24pt;
}

.paged-paper-body p[data-signature-closing-part="name"] {
  margin-top: 24pt;
  text-indent: 0;
}

.paged-paper-body p[data-signature-closing-part="role"] {
  margin-top: 5pt;
  text-indent: 0;
}

.paged-paper-body ul,
.paged-paper-body ol {
  margin: 0 0 10pt;
  padding-left: 28pt;
}

.paged-paper-body li {
  margin-bottom: 5pt;
  text-align: justify;
}

.paged-paper-body table {
  width: 100%;
  margin: 8pt 0 12pt;
  border-collapse: collapse;
  break-inside: auto;
  page-break-inside: auto;
  font-size: 10pt;
}

.paged-paper-body .institutional-document-table-wrapper {
  width: 100%;
  max-width: 100%;
  margin: 8pt 0 12pt;
  overflow: visible;
}

.paged-paper-body thead {
  display: table-header-group;
}

.paged-paper-body tr {
  break-inside: avoid;
  page-break-inside: avoid;
}

.paged-paper-body th,
.paged-paper-body td {
  padding: 5pt 6pt;
  text-align: left;
  vertical-align: top;
  border: 0.7pt solid #111111;
}

.paged-paper-body th {
  font-weight: 700;
  background: #f3f4f6;
}

.paged-paper-body img {
  max-width: 100%;
  height: auto;
}

.paged-signature-block {
  margin-top: 28pt;
  break-inside: avoid;
  page-break-inside: avoid;
  text-align: center;
}

.paged-signature-line {
  width: 240pt;
  margin: 34pt auto 7pt;
  border-top: 0.8pt solid #111111;
}

.paged-page-number::after {
  content: counter(page);
}

.paged-page-total::after {
  content: counter(pages);
}
`;

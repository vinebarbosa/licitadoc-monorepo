## ADDED Requirements

### Requirement: Institutional output uses A4 page layout
The system SHALL render generated document HTML and print/PDF-ready output using an institutional A4 portrait page layout with a white background and protected content margins.

#### Scenario: Document output renders on A4 page
- **WHEN** a generated document is rendered for institutional output
- **THEN** the document surface uses A4 portrait proportions
- **AND** the background is white
- **AND** the content area does not touch the page edges

#### Scenario: Print output uses exact margins
- **WHEN** the institutional document is printed or rendered through print/PDF-ready CSS
- **THEN** the page content uses a top margin of 100px
- **AND** the page content uses a bottom margin of 80px
- **AND** the page content uses left and right margins of 90px

### Requirement: Institutional typography follows official document rules
The system SHALL use official-document typography tokens for institutional document output.

#### Scenario: Body typography renders
- **WHEN** the document body renders
- **THEN** the primary font stack is `Times New Roman`, `Liberation Serif`, `serif`
- **AND** body text uses 12pt font size
- **AND** body text color is `#000`

#### Scenario: Titles and subtitles render
- **WHEN** the document renders a main title or section title
- **THEN** titles use 13pt font size, bold weight, and uppercase text
- **AND** subtitles use 12pt font size and bold weight

### Requirement: Institutional reading layout improves long-form readability
The system SHALL apply formal reading rules to paragraphs and body text in institutional document output.

#### Scenario: Paragraphs render with formal spacing
- **WHEN** a paragraph renders in the document body
- **THEN** it is fully justified
- **AND** it uses a 45px first-line indent
- **AND** it uses a line-height of 1.55
- **AND** it has 12px spacing between paragraphs

#### Scenario: Text flow uses available browser pagination controls
- **WHEN** document text flows across pages
- **THEN** automatic hyphenation is enabled where supported
- **AND** orphan and widow control is enabled where supported
- **AND** title elements avoid breaking away from their following content where supported

### Requirement: Institutional document structure is reusable across document types
The system SHALL use the same institutional output structure for DFD, ETP, TR, and Minuta document types.

#### Scenario: Any supported document type renders through the theme
- **WHEN** a generated document of type `dfd`, `etp`, `tr`, or `minuta` is rendered
- **THEN** it uses the same institutional document output theme
- **AND** document-type-specific text remains supplied by the generated content rather than by separate visual themes

#### Scenario: Main title and sections render
- **WHEN** generated content contains a main title and numbered sections
- **THEN** the main title is centered, bold, uppercase, and has 28px bottom margin
- **AND** each section title uses numbered uppercase formatting when the content provides numbering
- **AND** each section has 22px top margin and 12px bottom margin

### Requirement: Administrative fields render cleanly
The system SHALL render administrative field content with a clean institutional layout.

#### Scenario: Administrative field rows render
- **WHEN** content includes administrative fields such as Unidade Orçamentária, Número da Solicitação, Data de Emissão, Processo, or Objeto
- **THEN** field labels render in bold
- **AND** field values render in normal weight
- **AND** the fields use light vertical spacing and an organized layout

### Requirement: Lists use formal document spacing
The system SHALL render lists using official-document spacing rules.

#### Scenario: Bullet list renders
- **WHEN** a bullet list renders in the document body
- **THEN** bullets use the standard black bullet marker
- **AND** the list uses a 40px left indent
- **AND** list items use 10px spacing between items
- **AND** item text remains justified where supported

#### Scenario: List item emphasis renders
- **WHEN** a list item contains an emphasized leading phrase
- **THEN** the emphasized phrase can render in bold
- **AND** the remaining item text renders in normal weight

### Requirement: Signature block follows institutional layout
The system SHALL render final signature content with an institutional signature layout.

#### Scenario: Signature block renders at document end
- **WHEN** generated content includes final city, state, date, responsible name, and role/cargo
- **THEN** city, UF, and date render aligned to the left
- **AND** responsible name renders centered and bold
- **AND** role/cargo renders centered below the name
- **AND** the signature block has 60px spacing before it

### Requirement: Pagination avoids poor breaks where CSS allows
The system SHALL apply pagination rules that reduce poor page breaks in institutional output.

#### Scenario: Content spans multiple pages
- **WHEN** document content spans multiple pages
- **THEN** automatic page breaks preserve readable flow
- **AND** headings avoid being left alone at the end of a page where supported
- **AND** lists avoid poor breaks where supported
- **AND** paragraphs use widow and orphan controls where supported

### Requirement: Institutional theme is separated by concern
The system SHALL separate institutional output concerns so the layout remains reusable and extensible.

#### Scenario: Theme implementation is reviewed
- **WHEN** a developer reviews the institutional document output implementation
- **THEN** structure, typography tokens, pagination rules, and styles are separated into reusable boundaries
- **AND** DFD, ETP, TR, and Minuta rendering can share those boundaries

#### Scenario: Future branding is added later
- **WHEN** a future change adds logos, watermark, footer, institutional bands, or organization colors
- **THEN** the institutional theme has extension points for those additions
- **AND** this change does not render those branding elements

### Requirement: Institutional output excludes graphic branding for now
The system MUST NOT render graphic branding elements in this institutional output theme.

#### Scenario: Document output renders under this scope
- **WHEN** a generated document is rendered with the institutional output theme
- **THEN** it does not render a logo
- **AND** it does not render a coat of arms or brasão
- **AND** it does not render a watermark
- **AND** it does not render decorative bands or graphic flourishes

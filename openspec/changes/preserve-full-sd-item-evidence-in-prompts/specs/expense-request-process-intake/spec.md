## ADDED Requirements

### Requirement: Expense request intake MUST preserve clean structured item rows
The system MUST parse SD item tables into clean top-level item rows with row evidence such as label, code, quantity, unit, unit value, and total value when present. The parser MUST NOT promote page headers, address blocks, pagination text, system headers, footers, or continuation fragments into top-level procurement items.

#### Scenario: Kit SD produces clean top-level rows
- **WHEN** SD text contains three top-level kit rows separated across pages with nested components
- **THEN** intake produces three top-level structured items corresponding to the kit rows and does not produce extra items from page headers or address blocks

#### Scenario: Row values remain attached to their item
- **WHEN** a top-level item row contains a code, quantity, unit, unit value, or total value
- **THEN** intake attaches those row values to the correct structured item

#### Scenario: Continuation text does not become an item
- **WHEN** text from a continued specification appears between page boundaries and the next item label
- **THEN** intake attaches it as component/specification evidence where appropriate or ignores it as non-item noise, but does not create a new top-level item from it

### Requirement: Expense request intake MUST report item-evidence quality
The parser MUST return diagnostics describing the quality of structured item evidence, including whether evidence is complete, partial, contaminated, or using legacy fallback.

#### Scenario: Header contamination is detected
- **WHEN** item parsing encounters candidate item labels containing recurring page headers, address blocks, or pagination text
- **THEN** diagnostics report contaminated item evidence or suppress the contaminated candidates before prompt use

#### Scenario: Missing row values are detected
- **WHEN** a candidate top-level item lacks expected row values and cannot be associated with a valid item row
- **THEN** diagnostics report missing or ambiguous row evidence instead of silently treating the candidate as a complete item

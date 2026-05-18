## ADDED Requirements

### Requirement: Minuta fixed-clause enforcement MUST replace overlapping generated clauses
The Minuta fixed-clause enforcement system MUST treat canonical fixed clauses as authoritative. When the generated document contains an overlapping or alias heading for a fixed-clause topic, enforcement MUST replace the generated block with the canonical template block instead of appending the canonical block after it.

#### Scenario: Alias heading occupies a fixed-clause slot
- **WHEN** a generated Minuta contains `CLÁUSULA DÉCIMA TERCEIRA - DAS ALTERAÇÕES`
- **THEN** fixed-clause enforcement treats it as overlapping the canonical alteration/reajuste area and prevents an additional duplicate alteration clause from being appended

#### Scenario: Publication alias is generated
- **WHEN** a generated Minuta contains `DA PUBLICAÇÃO`
- **THEN** fixed-clause enforcement maps it to the canonical `DA PUBLICIDADE` fixed clause and preserves only the canonical block

### Requirement: Minuta recipe tests MUST cover duplicate tail recovery
The system MUST include tests proving that Minuta post-processing recovers from a model-generated duplicated tail like the user-reported example.

#### Scenario: User-reported duplicated tail is sanitized
- **WHEN** sanitizer receives a Minuta with clauses 11-17, a closing/signature block, and then canonical clauses 13-18 appended after the signature
- **THEN** the output contains one coherent clause sequence and one terminal closing/signature block

#### Scenario: Existing canonical fixed clauses remain unchanged
- **WHEN** sanitizer receives a Minuta that already contains canonical fixed clauses without duplicates
- **THEN** enforcement preserves the canonical fixed clauses and does not create additional copies

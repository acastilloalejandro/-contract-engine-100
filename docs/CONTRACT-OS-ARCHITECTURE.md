# Contract OS Architecture

## Canonical model
`ContractState` is the only source of truth.

## Pipeline
Form -> normalization -> classification -> jurisdiction/date -> deterministic rules -> validation -> evidence -> clause selection -> Contract AST -> renderers -> signing -> audit.

## Invariants
1. UI never contains legal rules.
2. AI may extract, normalize and explain, but never provides the final legal determination.
3. Every rule has jurisdiction and effective dates.
4. Every generated contract stores a rule snapshot.
5. Historical contract versions are immutable.
6. Public verification never exposes private evidence.

## State machine
DRAFT -> COLLECTING -> CLASSIFYING -> VALIDATING -> REVIEW_REQUIRED or READY -> GENERATING -> GENERATED -> SIGNING -> SIGNED -> ACTIVE -> ENDED -> ARCHIVED.

## Production gates
Authoritative-source mapping, territorial rule coverage, backend persistence, encrypted object storage, authentication, authorization, signing provider, observability, privacy controls and legal review.

# Production Gates

The application must not be presented as production-ready until every gate passes.

## Legal
- authoritative source attached to every production rule
- territorial coverage verified
- effective dates tested
- regression scenarios reviewed

## Security
- authentication and authorization
- tenant isolation
- encrypted evidence storage
- signed URLs
- secret management
- CSP and secure headers
- audit trail

## Data
- server-side persistence
- migrations
- backup and restore test
- immutable contract versions
- rule snapshots

## Documents
- deterministic Contract AST
- PDF/DOCX render tests
- signature provider integration
- public verification endpoint that exposes no private evidence

## Operations
- CI
- monitoring
- error reporting
- rate limiting
- disaster recovery

## Legal review
A qualified professional must review the production rule set and generated contract templates before real-world use.

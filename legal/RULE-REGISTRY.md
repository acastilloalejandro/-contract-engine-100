# Rule Registry Contract

Every production rule must contain:

- id
- version
- jurisdiction
- effectiveFrom
- optional effectiveTo
- authoritative source
- conditions
- effects
- regression tests

A rule change creates a new version. Existing contract snapshots are never rewritten.

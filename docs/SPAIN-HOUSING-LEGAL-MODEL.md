# Spain Housing Rental · Legal/UX Model v6

## Scope
Formulario de arrendamiento de vivienda en España orientado a vivienda habitual. No sustituye asesoramiento jurídico.

## Rules verified against BOE on 2026-10-08
- LAU art. 9: minimum mandatory duration is 5 years when landlord is an individual and 7 years when landlord is a legal entity, subject to statutory rules and exceptions.
- LAU art. 17: rent is freely agreed subject to statutory price-control regimes; payment is electronic as the default, with a narrow cash exception; advance rent cannot exceed one monthly payment.
- LAU art. 18: annual rent updates follow the legally applicable reference and must respect the statutory ceiling in force.
- LAU art. 20: management and contract-formalization costs are borne by the landlord; general expenses charged to the tenant require written allocation and the annual amount at contract date.
- LAU art. 36: housing deposit is one month's rent; additional guarantees are subject to the statutory cap in the general long-term housing case.
- In residential tension zones, initial-rent controls and disclosure/evidence requirements can apply depending on the property, prior lease and landlord status.

## Product rule
The application must distinguish:
LEGAL RULE → DATA NEEDED → EVIDENCE → CALCULATION → HUMAN REVIEW → SIGNATURE.

It must never present a static frontend check as a government registry, identity verification, qualified electronic signature or legal certification.

## Current policy caveat
Price-control and updating rules can change. Legal-policy data should therefore be versioned and refreshed from official sources before a production release.

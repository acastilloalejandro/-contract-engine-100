# Third-party software inventory

This document records the third-party material deliberately retained in the public repository. It is an inventory, not a guarantee that every transitive, historical or copied component has been identified.

| Component | Location | Provenance information available in repository | License | Maintenance action |
|---|---|---|---|---|
| QRCode.js (David Shim) | `vendor/qrcode.min.js` | Vendored JavaScript; the accompanying notice identifies the upstream project/author but the precise upstream commit/version is not recorded in the current repository | MIT, per `vendor/QRCODE-LICENSE.txt` | Record exact upstream release or commit and cryptographic hash after provenance is verified; compare/update through a reviewed PR |

## Dependency controls

- The current npm lockfile has no declared runtime package dependencies. This does **not** mean the product has no third-party code: the QR library is vendored directly.
- `npm audit` covers the dependency tree known to npm, not the vendored QR library or arbitrary source copied into the repository.
- Never remove third-party notices when minifying or updating vendored assets.
- For each new third-party component, record its name, exact upstream URL, version/commit, hash, license, purpose, update owner and any known vulnerabilities.
- Generate and publish a machine-readable SBOM for any production release, then compare it with this human-reviewed inventory.
- License conclusions and intellectual-property ownership must be reviewed separately. The project's MIT license does not relicense third-party material beyond the rights its own license grants.

# Beta Issue Log

Type options: Bug, UI, Copy, Path, Permission, Performance, Access, Product understanding, Feature request.

Severity options: P0 blocker, P1 severe, P2 normal, P3 suggestion.

Status options: To confirm, Reproduced, Planned, Fixed, Won't do for now.

| ID | Date | Reporter | Page/Module | Type | Severity | Feedback | Reproduction Steps | Suggested Handling | Status |
|---|---|---|---|---|---|---|---|---|---|
| BETA-001 | 2026-05-13 | Internal | Access | Access | P2 normal | Some networks may have unstable access to `.vercel.app`. | Open `https://maimang-readbox.vercel.app` from representative networks. | Track network, device, browser, and whether a proxy was needed; continue custom domain work after a domain is selected. | To confirm |
| BETA-002 | 2026-05-13 | Internal | Deployment | Access | P2 normal | No custom domain is configured yet. | Check production entry. | Continue using the Vercel URL for the first beta round; resume T62 after a domain is selected. | To confirm |
| BETA-003 | 2026-05-13 | Internal | Product scope | Feature request | P3 suggestion | Search is not available. | Try to search articles, authors, notes, or collections. | Keep out of beta scope; consider after core reading loop feedback. | Won't do for now |
| BETA-004 | 2026-05-13 | Internal | Product scope | Feature request | P3 suggestion | Tags are not available. | Try to tag articles, external items, or traces. | Keep out of beta scope; consider after collection workflow feedback. | Won't do for now |
| BETA-005 | 2026-05-13 | Internal | Collections | Feature request | P3 suggestion | Public collection pages are not available. | Try to share or publicly open a collection. | Keep out of MVP scope until private collection value is validated. | Won't do for now |
| BETA-006 | 2026-05-13 | Internal | QA | Bug | P2 normal | There is no full browser automation e2e suite yet. | Review test coverage. | Use smoke and landing QA as current gates; consider Playwright/Cypress later. | To confirm |
| BETA-007 | 2026-05-13 | Internal | Mobile | UI | P2 normal | Mobile still needs real-device review. | Open main flows on real mobile devices. | Collect device/browser notes during beta. | To confirm |

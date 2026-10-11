# HU-PAT-001 — Patient contract models

## Purpose and traceability

The demo previously required split names and full contact data. Align read models with the owner contract while preserving the fictional list and accepting its minimum care projection.

- Requirement: [HU-PAT-001](https://github.com/code-corhuila/dlc-docs/issues/53).
- Contract: [Patients OpenAPI](https://github.com/code-corhuila/dlc-docs/blob/main/07-api/contracts/openapi/patients-service.yaml), including shared pagination metadata.
- Rules: PAT-003 and ADR-003 administrative/clinical separation. Composition remains governed by ADR-011.
- Target branch: `develop`; working branch: `feat/hu-pat-001-contract-models`.

## Changes and contract compatibility

- Model `Patient`, `PatientForCare`, `PatientView`, `PatientPage` and emergency contacts with the documented required/optional read fields.
- Preserve owner `name`, UUID identifiers and `version`; do not split names or invent missing contact values.
- Map only list fields to a presentation model; do not forward detail-only or unexpected fields. A care projection has no document field.
- Adapt fictional fixtures and render absent table values as an em dash. No API or event contract is changed.

TypeScript interfaces are compile-time contracts, not runtime response validation or authorization. The mapper does not determine user roles or patient assignments.

## Validation evidence

Execution date: 2026-10-10, America/Bogota. GREEN evidence applies to the implementation commit containing this report; the PR must record its full SHA and CI run links before review.

| Criterion / applicable DoD item | Evidence | Result |
|---|---|---|
| Test-first contract behavior | RED commit `5a22ea7`; missing exports/mapper and old model rejected by Angular compilation | Expected failure |
| Administrative and minimum care mapping | `patient-list-item.spec.ts` and component spec | Passed |
| No unexpected fields forwarded; source preserved | Mapper allowlist regression | Passed |
| Minimum profile reaches the list through the page | Page regression test for existing provider-to-view behavior | Passed |
| Unit/component regression suite | `ng test --watch=false --browsers=ChromeHeadless --code-coverage` | 10/10 passed |
| Instrumented TypeScript coverage | 17/17 statements, 2/2 branches, 6/6 functions, 15/15 lines | 100% in this small baseline |
| Production application build | `npm run build` | Passed |
| Whitespace validation | `git diff --check` | Passed |
| Owner responses, assignment authorization and clinical isolation | Real provider/integration tests | Pending |
| CI and independent review | Attach revision-specific runs and reviewer decision to the PR | Pending |

Run tests through `node_modules/.bin/ng.cmd` on Windows. ChromeHeadless required execution outside the sandbox. The current reproducible HTML coverage report is generated under `coverage/dlc-patient-portal/index.html` after project identity normalization and is not committed.

## Remaining scope and decisions

The page still uses the explicitly named `PatientsMockService` and fictional fixture. There is no integrated provider yet; its replacement and explicit provider separation are required before integrated acceptance. Runtime schema validation, shared-client transport, pagination behavior, composition, roles and writes are later increments.

No normalized-document uniqueness, deactivation guard, persistence, historical-retention or event execution evidence is claimed. Those require the owning services. The coverage percentage describes implemented instrumented code, not completed HU criteria.

This increment does not complete HU-PAT-001 and does not establish QA acceptance. Keep the fixture out of the future integrated path and record unresolved dependencies in the PR.

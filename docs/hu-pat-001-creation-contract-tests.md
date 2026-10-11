# HU-PAT-001 creation contract tests — local draft

Related: code-corhuila/dlc-docs#53 and dlc-patient-portal#1. Branch: feat/hu-pat-001-creation-contract-tests; eventual target: develop. No publication or HU closure.

## Specification and scope

Normative source: [Patients OpenAPI at 638e4f227c318b9e62bc1ce5a152c71414c72d51](https://github.com/code-corhuila/dlc-docs/blob/638e4f227c318b9e62bc1ce5a152c71414c72d51/07-api/contracts/openapi/patients-service.yaml), CreatePatient (lines 287–347). The local contract file had no modifications.

- Six required fields; maxima 30/50/255/40/255, optional address 500, optional contact name/relationship/phone 255/80/40. Valid past birth date; email syntax and maximum length are tested separately. No document-type enum is invented.
- A pure administrative metadata/mapping module owns the allowlist. The Angular form factory belongs to components/patient-form, not the domain model. The existing approved registration page consumes both.
- Tests cover empty/whitespace required values, each length boundary, email, valid/impossible/future/today dates, optional all-or-none contacts, trimming and exclusion of identity/status/audit/clinical fields.
- A midnight regression exercises America/Bogota: reevaluating an open form uses the current clinic date, rather than a date captured at creation. Fixed dates remain injectable for deterministic tests.
- This increment publishes no CSS, new modal, editing flow, API client, authorization boundary or event. Dummy uniqueness/server authorization/persistence and complete HU acceptance remain separate obligations. Existing visual work stays local.

## Executed local trace (2026-10-11, America/Bogota)

1. Initial test execution exposed unrelated duplicate request/uninitialized service errors in the local mock spec. Those local regression errors were repaired; they are excluded from the proposed increment because the approved baseline does not contain them.
2. RED: compilation then failed solely because patient-creation-form did not exist. The original tests included an incorrect email boundary expectation, corrected after checking Angular's installed syntax validator (254-character format bound versus the contract's 255-character maximum).
3. GREEN: 76/76 full working-tree Angular tests passed after the factory, mapper and page wiring were implemented.
4. Additional RED: midnight test executed, 1 failed / 19 passed, because the factory captured the previous clinic day.
5. GREEN: 77/77 full working-tree Angular tests passed after using the current clinic day during validation. Coverage: statements 92.33%, branches 85.96%, functions 91.30%, lines 93.54%; configured gates passed. Packaging: 1/1 passed outside the sandbox after a temporary rename was blocked inside it.

Local midnight RED source/test snapshots and executed RED/GREEN logs: coverage/hu-pat-001-trace (ignored, not publication artifacts). Historical execution on existing behavior is regression evidence, not retroactive TDD. No RED/GREEN commits were made: the attempted isolated RED commit was declined, and work continued in the user-requested original path without commits or staging. Future PR evidence must use reviewed revisions and CI links; local working-tree runs do not establish clean-checkout CI or HU Done.

## Proposed publication boundary

Only: model/patient-creation-contract.ts; components/patient-form/patient-creation-form.ts and its spec; model/patient-registration.ts; pages/patient-registration/patient-registration.component.ts; this report. Count additions plus deletions including tests/docs before staging. All other local UI/mock/navigation changes are excluded. Revalidate this boundary against a clean approved base before publication.

Final checks: 77/77 Angular tests passed after relocating the factory. Proposed increment: 227 additions/deletions across six files, including this report; the entire dirty workspace is larger and is not a publication unit. Builds and packaging must be rechecked on the selected clean revision before a PR.

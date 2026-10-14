# HU-PAT-001 reusable patient form

Reference: code-corhuila/dlc-docs#53; related portal issue #1. Branch: feat/hu-pat-001-reusable-patient-form; eventual target: develop. Local draft, without commits or publication.

## Scope and specification

- A standalone component in components/patient-form receives title, initialValue, busy, saved and failure; emits save/cancel and exposes asynchronous canLeave. It owns no store, Router, API client or session.
- Uses the approved creation factory, field metadata and administrative mapper from the preceding increment. Additional contacts reuse the canonical contact validators/limits; no clinical, status or identity fields are emitted.
- Clearing/replacing initialValue resets optional values and contacts without mutating caller data. busy prevents save/leave; saved prevents resubmission. Dirty forms ask keep/discard, repeated leave requests share the decision, Escape/destruction resolve false.
- Functional HTML supplies labels, error descriptions, focused error summary and native leave dialog. CSS and the local registration modal, navigation adapters and mock changes are excluded from this increment. The existing CSS file remains a local visual reference.
- Initial-value support prepares editing; loading a patient, changed-field PATCH with expectedVersion, per-row Edit buttons and authorized owner persistence remain pending. The approved registration page still owns its existing implementation until a separate wiring increment; this PR does not claim migration of every route.
- Normative source: Patients OpenAPI at dlc-docs revision 638e4f227c318b9e62bc1ce5a152c71414c72d51; PAT-003/ADR-003 exclude clinical data and Dentist writes. UI gates are not server authorization. No speculative endpoint, event or enum is introduced.

## Executed evidence

Existing local component behavior was characterized as regression, not retroactive TDD. RED executed in the original repository: 2 failed / 14 passed after correcting a test selector. Failures were the stale profile after null initialValue and missing busy guard. GREEN then passed 85/85 full working-tree Angular tests. Five further regression tests cover caller/request isolation, profile replacement, contact removal, pending/retry UI and label/error associations.

Local snapshots and RED/GREEN execution logs: coverage/hu-pat-001-reusable-trace (ignored). No RED/GREEN commits exist for this local draft. Future publication must attach the reviewed revision and hosted CI; working-tree results include unpublished UI and do not certify a clean PR checkout or HU Done.

## Publication boundary

Only patient-form.component.ts, patient-form.component.html, patient-form.component.spec.ts and this report. Keep CSS, local modal/pages, mock services, routing and all other local changes unstaged. Count all four files against develop, including tests and docs; revalidate the selected increment on the reviewed revision before acceptance.

Final local checks (2026-10-11, America/Bogota): 24 component cases; 93/93 full working-tree Angular tests and 1/1 packaging passed; standalone and portal builds passed. Coverage: statements 94.46%, branches 89.42%, functions 91.54%, lines 95.06%. The last three cases check every additional-contact length boundary. No CSS is imported by the reusable component; CSS remains local for the later visual slice.

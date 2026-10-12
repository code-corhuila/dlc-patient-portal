# HU-PAT-001 dummy deactivation with in-memory history

Reference: code-corhuila/dlc-docs#53; dlc-patient-portal#1. Branch: feat/dummy-deactivation; target: develop.
SDD: Patients OpenAPI POST /patients/{id}/deactivations; PAT-003–PAT-005; ADR-003.

- Composed Administrator-only modal: reason (1–1000 characters), expectedVersion, INACTIVE status and one version increment. Profile data remains intact; records retain reason, actor, UTC timestamp and previous version through local edits. No hard deletion or appointment cancellation exists; inactive documents remain reserved.
- Isolated fixtures: Ana permits deactivation, Carlos is blocked, registration explicitly seeds a clear synthetic guard. Unknown/unavailable verification fails closed. Laura starts inactive without invented history. These guards never establish real appointment eligibility.
- Session/actor changes clear drafts; deactivation is unavailable during creation/editing. Data/history reset on reload/full unmount. Idempotency, real authorization/HTTP, coordinated guards and durable audit history remain pending; this increment cannot close the HU.

## Review decisions

- APPLIED CSS: identical modal stylesheet moved to patients/shared/styles; creation, editing, shared form and list consume this shared resource.
- APPLIED contract anchor: patient-deactivation.contract.json captures the exact request schema and roles at dlc-docs revision 638e4f227c318b9e62bc1ce5a152c71414c72d51. It was compared against the parsed OpenAPI; policy and boundary tests consume it. Revalidate this snapshot against the reviewed owner revision before real API integration; no automatic tracking of upstream main is claimed.
- APPLIED failure signaling: history returns an explicit success/records or FORBIDDEN result; denied access is not rendered as empty history.
- CONSIDERED conflict precedence: the OpenAPI 409 description explicitly disclaims ordering. The dummy checks stale version before inactive status; a regression exercises both. This is a demo choice, not an owner precedence requirement. INVALID_REQUEST/GUARD_UNAVAILABLE are local outcomes, not invented API wire codes; real invalid/denied/unavailable responses are 400/403/503.
- APPLIED title: use feat(patients): add dummy deactivation with in-memory history; no durable audit log is claimed.

## Validation

- RED: missing-operation compilation failures, new-patient ACTIVE regression and denied-history result failure were reproduced before their fixes. Trace is local; separate RED/GREEN Git commits are not claimed. Logs under coverage/ are ignored artifacts, not reviewed CI evidence.
- Latest GREEN: 176/176 Angular cases; coverage statements 98.52%, branches 94.16%, functions 99.20%, lines 99.51% (Node 22/ChromeHeadless Windows). Log: coverage/deactivation-review-green.log.
- Latest packaging: 7 passed/1 POSIX-only skip; application/composition builds passed after relocation (coverage/deactivation-review-build.log). Earlier Docker/browser validation confirmed INACTIVO and history; screenshot coverage/dummy-deactivation-updated.png is historical evidence, not a new Docker run.
- Scoped diff: 399 changed lines including tests/docs, treating the byte-identical stylesheet relocation as a rename; confirm with Git after staging. No commit, push or promotion is performed by this follow-up; HU acceptance still requires reviewed CI and owner evidence.

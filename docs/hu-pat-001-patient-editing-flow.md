# HU-PAT-001 patient editing flow

Reference: dlc-docs#53 and dlc-patient-portal#1. Branch: feat/hu-pat-001-patient-editing-flow; target: develop. Local draft; no commits/push or HU closure.

## Contract and behavior

- User confirmed /app/patients/profiles/{patientId}/edit. dlc-front resolves the /app/patients/** namespace and redirects only a single UUID segment to Clinical; no dlc-front files or API endpoints are changed.
- Administrator/Assistant presentation gates expose Edit per row. Default list editing is disabled; Dentist/unauthenticated sessions never mount the editor. UI gates do not replace owner authorization (PAT-003, ADR-003).
- Reuses components/patient-form in edit mode. Missing optional GET fields need not be completed unless changed; creation validation remains strict. Existing required values cannot be cleared. Changed-field PATCH drafts include expectedVersion and exclude server ID/status/clinical/audit identities.
- Contact deletion sends an explicit empty array. Address deletion is rejected with a clear message because UpdatePatient permits neither empty address nor null; a clearing extension requires an approved owner contract decision. Documents remain editable as the approved Administrator/Assistant PATCH specifies.
- The data port remains the isolated dummy binding with TD-PAT-001. Success updates the list and permits immediate shell leave; stale versions preserve the draft and offer explicit reload with discard confirmation. Missing/read/write failures are safe text. Destroyed/session-expired views cannot submit retained callbacks.
- Functional native edit dialog keeps the list behind it and delegates unsaved leave to the reusable form. No Figma CSS is included. Previous local frame/template drafts were copied into ignored coverage/hu-pat-001-edit-trace before restoring the approved registration route for a publishable dependency graph.
- Standalone harness only: /patient and /patient/profiles/{id}/edit on current 4200. Its fictional Administrator context is explicit; Router is never imported by the composition entry. Composed navigation remains memory-driven through context.navigation/updateRoute; no own HTTP/session/tokens or owner persistence is introduced.

## Test trace and evidence

RED: edit-mode regression 1 failed/24 passed; missing editor compilation; list output missing compilation; composed navigation 2 failed/14 passed; successful-save leave race 1 failed/7 passed. GREEN corrections include zoneless view notification on reload and immediate saved-state leave. Existing local behaviors characterized after implementation are regression, not retroactive TDD. No separate RED commits are claimed; ignored local logs/snapshots retain the execution trace.

Publish only this feature's TS/functional HTML/tests and this report; exclude existing CSS, local creation-modal drafts and local creation/model regression specs. Verify additions+deletions against develop including all selected files, then validate a clean candidate and the eventual CI/reviewed SHA. Dummy frontend integration does not complete HU-PAT-001 or its owner dependencies/DoD.


Final validation: clean selected candidate 149/149 Angular cases plus 1/1 packaging and both builds; the earlier working-tree run passed 154/154 including excluded local regressions. CI on the eventual committed revision remains mandatory; no reviewed revision or HU completion is claimed. Selected increment: 396 changed lines including tests/docs; clean coverage statements 98.60%, branches 93.68%, functions 99.04%, lines 99.69%.

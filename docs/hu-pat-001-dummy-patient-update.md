# HU-PAT-001 dummy patient update

Reference: code-corhuila/dlc-docs#53 and dlc-patient-portal#1. Branch: feat/hu-pat-001-dummy-patient-update; target: develop. This increment does not close HU-PAT-001.

## Specification and review decisions

- Patients OpenAPI at dlc-docs revision 638e4f227c318b9e62bc1ce5a152c71414c72d51: UpdatePatient requires expectedVersion >= 1 and an actual administrative change; excludes additional/clinical/status/audit fields. PAT-001/003/005 and ADR-003 retain owner authorization, authoritative uniqueness, audit and persistence in Patients API/DB.
- Finding 1 — APPLIED: fixture transition planning is isolated under data/patient-update-demo.ts, not the portal domain model. TD-PAT-001 tracks its removal before real owner integration; fixture decisions are not authoritative business policy. No cross-domain read exception or new ADR is asserted.
- TD-PAT-001 — Owner: Patients portal integration. Trigger: before enabling owner HTTP responses. Exit: replace the synchronous demo binding with the shared-client asynchronous owner adapter; remove fixture version/collision/planning logic and demo-specific result types from the integrated path; exercise owner denial/conflict/failure responses and confirm no fixture fallback. Retain only contract-backed presentation validation. Debt remains OPEN; mocks cannot establish HU completion.
- Finding 2 — APPLIED: no copied email regex remains. Creation and fixture updates both use Angular Validators.email. A test changes that validator and verifies both flows follow it; RED failed 1/45, then corrected. Contact/field lengths derive from approved creation metadata.
- Finding 3 — REJECTED AS A NEW PERMISSION RULE: PATCH explicitly includes documentType/documentNumber and authorizes Administrator/Assistant (OpenAPI lines 160–204 and 348–363); Dentist is read-only. No separate identity-correction tier is documented. Do not invent one in the portal. Owner authorization/normalization must be enforced when integrating; a new tier would require an approved requirement/contract change first.
- Successful simulated edits preserve ID/status/omitted fields and existing metadata, increment once and notify subscribers; invalid/stale/duplicate/unknown requests do not partially persist. Reads, caller contacts, fixture profiles and subscriber snapshots are cloned. Metadata preservation does not implement server audit/history. No email uniqueness is invented.
- Finding 4 — APPLIED: verified absence of credentials, schema changes and own HTTP/session, and respected DTOs. PR #16 description was updated with all four checklist items checked and CI links; no review comment was sent.

## Verifiable evidence

- Reviewed head: c029c6199385baf57afdcf79f1162a6197684995. [CI run 38118051088](https://github.com/code-corhuila/dlc-patient-portal/actions/runs/38118051088) completed successfully; checkout tested merge bf9822f containing that head and base 1a8a03c. npm ci, test:coverage, artifact upload and build all passed. Artifact: patient-coverage, ID 11694716645; associated head matches c029c61.
- CI logs: 129/129 Angular tests and 1/1 packaging passed; statements 98.76%, branches 93.95%, functions 100%, lines 100%. A local git archive of exact c029c61, excluding unpublished changes, independently reproduced 129/129 and the same coverage. The earlier 137-test dirty-tree report is historical and is not acceptance evidence for this head.
- Original RED failed compilation for missing update types/methods. Review RED demonstrates validator divergence: 1 failed / 44 passed. Local snapshots/logs are ignored under coverage/hu-pat-001-review. No separate RED commit is claimed. The complete adapter update body was inspected directly: plan, replace matching profile, notify only on success, clone result.
- Corrections remain uncommitted; the next published revision requires its own CI run. Current working-tree checks include unpublished UI and cannot replace clean-revision acceptance. No editing page/button, route, CSS, API, owner authorization, event or schema is added.

## Publication boundary

Only model/patient.ts, data/patient-update-demo.ts, deletion of model/patient-update.ts, data/patients.port.ts, data/patients-mock.service.ts, data/patients-update.spec.ts and this report. Keep UI/navigation/CSS/modal and local creation regression changes excluded. Count the complete PR against develop (additions plus deletions), not just the review fix. No staging, commit or push is performed here.


Clean local correction candidate: 130/130 Angular tests, 1/1 packaging and both builds passed; coverage statements 98.75%, branches 93.95%, functions 100%, lines 100%. Dirty workspace: 138/138 passed, reported separately. Full selected PR diff after review: 386 changed lines. The candidate is not yet committed/pushed; its future CI remains mandatory.

# HU-PAT-001 shared registration form

Reference: code-corhuila/dlc-docs#53; dlc-patient-portal#1. Branch: refactor/shared-patient-form; target: develop.
SDD: Patients OpenAPI CreatePatient and UpdatePatient; PAT-001–PAT-003; ADR-003; composition C03/C04.

- Creation and editing render PatientFormComponent. Registration owns only port invocation, safe error/success state and navigation outputs; the shared form owns fields, validation, DTO mapping and pending leave decisions.
- Registration consumes PATIENTS_PORT instead of injecting PatientsMockService. The port remains explicitly synchronous/dummy; HTTP integration and asynchronous migration are separate pending increments.
- Six required creation fields, contract limits, past valid birth date, unrestricted documentType and optional complete contacts remain enforced. Creation can now submit multiple contacts through the existing shared form array; protected/clinical fields are excluded.
- The creation modal remains over the list. Both close/cancel delegate to the parent/shell navigation; saved state permits immediate leave before child inputs refresh. The generic shared success message identifies changes as local demo data.
- No routes, API calls, session ownership, clinical information, events or persistence are added. Full modal accessibility and owner authorization remain pending; this does not close HU-PAT-001.

## Evidence

- RED: 2 new integration tests failed with Shared patient form missing before implementation; coverage/shared-registration-red.log.
- Regression cases cover injected-port use, safe retries, multi-contact allowlisting, shared pending leave, destruction, forced session expiry and creation/edit routing. Local execution does not establish separate RED/GREEN Git commits.
- GREEN: 180/180 Angular tests on Node 22/ChromeHeadless Windows; statements 98.46%, branches 94.14%, functions 99.18%, lines 99.49%. Log: coverage/shared-registration-green.log.
- Packaging: 7 passed/1 POSIX-only skip. npm run build (application plus postbuild composition) passed; the existing shared-form NG8102 warning remains outside this slice. Log: coverage/shared-registration-build.log.
- Scoped diff: 244 changed lines including tests/docs; git diff --check passed. Local logs are ignored artifacts, not reviewed CI evidence. No commit or push is performed. Docker was rebuilt locally on request; the container is healthy and direct 4178/composed 4180 entries return 200 with the same updated bundle.

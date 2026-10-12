# HU-PAT-001 dummy deactivation

Reference: code-corhuila/dlc-docs#53; dlc-patient-portal#1.
Branch: feat/dummy-deactivation; target: develop.
SDD: Patients OpenAPI POST /patients/{id}/deactivations; PAT-003–PAT-005; ADR-003.

- Composed Administrator flow only: row action, native modal, required reason (1–1000 characters), current expectedVersion and retained local history.
- Assistant/Dentist have no action; the dummy adapter also checks role/actor identity. These client checks are presentation/demo policy, never server authorization.
- Existing profile fields are retained, status becomes INACTIVE and version advances once. Local records retain reason, actor, UTC timestamp and previous version; later edits retain these records. No hard deletion or appointment cancellation exists.
- Fixture-only guard: Ana Demo permits deactivation; Carlos Prueba is blocked. Registration explicitly adds a clear synthetic guard for the new dummy patient. Unknown/unavailable guard verification still fails closed as GUARD_UNAVAILABLE. Laura Mock starts inactive without invented historical evidence.
- Guard data is isolated in DemoDeactivationGuards, seeded by DEMO_DEACTIVATION_GUARDS. Synthetic registration eligibility never establishes absence of real appointments. No Appointments API, non-terminal appointment verification, event or internal endpoint is implemented or invented.
- Stale versions, repeated deactivation, forbidden operations and invalid requests do not mutate profiles or append history. Inactive documents remain reserved by the existing duplicate check.
- History is visible only to Administrator in this demo. Session/actor changes clear the dialog and draft. Deactivation is unavailable while creation/editing is active.
- Data/history survive list filtering and local edits within one mount, but reset on full unmount/reload. There is no durable audit log. Idempotency, real owner HTTP/authorization, appointment guards and durable history remain integration requirements; this cannot close the HU.

## Validation

- RED: new specs failed compilation with TS2339 for the missing operation/history/dialog before production implementation.
- Execution trace is local; no separate RED/GREEN Git commits are claimed. The pre-existing registration leave test now selects its own dialog explicitly.
- Store tests cover role denial, reason/version boundaries, guard rejection, immutable reads, retained data/history and duplicate reservation. UI tests cover success, history, revocation, session change and conflicts/failures.
- New-patient regression: RED reproduced an ACTIVE row and missing history after attempted deactivation; synthetic registration now explicitly seeds the demo guard. Log: coverage/dummy-deactivation-new-patient-red.log.
- GREEN: 175/175 Angular tests on Node 22/ChromeHeadless (Windows); statements 98.51%, branches 94.09%, functions 99.19%, lines 99.51%. Log: coverage/dummy-deactivation-green.log.
- Packaging: 7 passed/1 POSIX-only skip. npm run build (including postbuild composition) passed; pre-existing NG8102 template warnings remain outside this slice. Log: coverage/dummy-deactivation-build.log.
- The action uses the same teal token as Nuevo Paciente; the native dialog separates the reason and confirmation actions.
- Docker/browser regression through dlc-front: registered Paciente Prueba Nuevo, deactivated it with a reason, verified INACTIVO in the table and retained actor/reason/history in the dialog. Screenshot: coverage/dummy-deactivation-updated.png (ignored local evidence).
- Measure the complete scoped diff, including tests/docs, before committing; git diff --check passed. Local logs are ignored artifacts, not reviewed CI evidence.
- No commit, push or deployment promotion is performed. Docker is rebuilt locally on request for exploratory validation; this is not a published release or HU acceptance evidence.

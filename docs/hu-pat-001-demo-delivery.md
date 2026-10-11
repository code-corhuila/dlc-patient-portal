# HU-PAT-001 demo delivery

Reference: code-corhuila/dlc-docs#53 and dlc-patient-portal#1.
Branch: feat/hu-pat-001-demo-delivery; target: develop; inspected base: 14a5741.
Normative SDD: dlc-docs 05-architecture/frontend-composition.md C01-C03/C07 and ADR-011.
Scope: package and serve the existing dummy adapter; no API, domain behavior, shell files or Figma drafts are changed. This does not complete HU-PAT-001.

## Delivery contract

- `npm run build:demo` publishes all assets and a recovery descriptor together under `dist/demo/portals/patient/0.1.0-demo/`, then atomically replaces the root handoff descriptor via a temporary file and rename. These are two publication steps, not a single filesystem transaction.
- Named exports remain patient/contractVersion 1/mount with no import-time bootstrap. The release folder retains every relative chunk/asset. Existing releases are rejected rather than overwritten; use `npm run build:demo -- 0.1.1-demo` for a new release. Keep previously referenced releases.
- The generated descriptor is a handoff fragment, not a replacement for dlc-front's complete registry. Menu id: patients; route: /app/patients. C04 explicitly defines empty rolesAny as any authenticated staff; empty permissionsAll imposes no permission filter. Producer tests assert these exact arrays. It grants no resource authorization. The Spanish label is display text, not a domain identifier.
- On interruption after bundle publication, retain the immutable release and recover only its handoff with `npm run recover:demo -- 0.1.0-demo`. Recovery reads the stored descriptor and checks its identity/entry before replacing the handoff; it never rebuilds or deletes published assets. Fix the filesystem failure before recovery. Re-running build:demo is deliberately not a recovery operation: it must not replace an immutable release or silently select an older handoff.
- `npm run serve:demo` serves assets only on 127.0.0.1:4178, configurable through PATIENT_DEMO_PORT. It does not render the standalone UI. Angular's provisional standalone port remains 4200.
- Asset responses use no-store and module MIME types; missing files return 404, never SPA HTML. The local server accepts GET/HEAD only and rejects traversal. No gateway/API transport is introduced.
- Container: patient-portal-demo; port: 4178:80 by default; explicit network: `${PATIENT_NETWORK:-dlc-patient-portal_default}`. dlc-front references the same configurable name as an external network. When overriding PATIENT_NETWORK, both Compose projects must receive the same value; the owner must create the network before starting the shell. Dockerfile uses independently bundled Angular and official Node 22/nginx image digests inspected on 2026-10-11. Compose has an independent health check.
- From a clean checkout, run `docker compose -f deploy/compose.yml up --build -d`. Start Docker first. Do not publish a build containing uncommitted visual drafts; the primary working-tree build is exploratory, not the reviewed release candidate.

## Integration and tracked gaps

dlc-front integration has been merged according to the project owner: descriptor registration, PATIENT_UPSTREAM/proxy/network configuration and the local preview upstream. Consume /portals/patient/0.1.0-demo/entry.js through the same origin. No direct cross-origin portal loading or CORS configuration is required.
Tracked integration gap AUTH-PAT-DEMO: before introducing real patient data, validate owner-enforced PAT-003 authorization and Dentist assignment scope with actual denied responses. The shell must apply approved C04 visibility claims; any additional navigation filters require the approved IAM contract. Registry visibility cannot establish resource authorization. This gap blocks real-data acceptance and HU closure.
Verify shell session, list/create/edit, unsaved leave, Back/Forward, forced logout cleanup and stopped/restarted portal recovery. Dentist assignment projection and deactivation remain separate pending flows; UI gates do not establish PAT-003. Local synthetic patient IDs cannot link to Clinical until a shared dataset is approved. Owner APIs, appointment guards, persistence and TD-PAT-001 remain pending.
Promote to qa only after reviewed integration/CI/browser evidence using a qa child and controlled cherry-pick -x. No promotion or HU closure is part of this increment.

## Validation evidence

- Relevant current evidence: 8/8 Node packaging/delivery tests passed on Linux; Windows passed 7 with 1 POSIX permission skip. These exercise version preservation, recovery, concurrent publication, permissions and HTTP errors. No Node coverage percentage is claimed.
- Historical baseline only: 154/154 Angular cases passed in the original clean candidate. Angular source/specs are unchanged by this delivery PR; those results are not evidence of the new publication behavior. Coverage percentages are intentionally omitted here.
- Composition build and demo packaging passed. HTTP smoke test of the clean compiled entry: 200, no-store, text/javascript, 199259 bytes.
- Docker npm ci/build and nginx delivery were exercised locally on 2026-10-11. The version directory requires chmod(0755), covered by a Linux regression. Through dlc-front on 4180, the real entry returned 200 JavaScript/no-store, missing assets returned 404, and outage/recovery remained isolated. This does not replace reviewed CI evidence.
- Local logs are ignored artifacts, not CI links. CI artifacts and reviewed final revision must be linked in the PR before acceptance. No separate RED/GREEN Git commits are claimed.
- Measure all selected additions/deletions against develop, including tests/docs and deployment files. Existing local visual drafts are excluded. Update the PR size after each follow-up; the earlier 262-line figure no longer describes the reviewed revision.

## PR #18 review follow-up

- APPLIED: recoverable two-step publication and atomic descriptor replacement. RED reproduced missing recovery metadata and a raw concurrent ENOTEMPTY; GREEN passes all 8 Linux packaging/delivery tests. Logs: coverage/demo-review-red.log and coverage/demo-review-green.log (ignored).
- Current checks: Windows 7 passed/1 POSIX-only skip; shell navigation 6/6 passed; --recover CLI smoke passed. The clean Docker candidate rebuilt successfully and is healthy; direct 4177 and shell 4180 entry requests returned 200 JavaScript/no-store, missing asset 404. Logs: coverage/demo-review-windows.log, demo-review-docker.log and demo-review-http.json.
- APPLIED: concurrent complete-release collisions become RELEASE_EXISTS without changing the winner. Atomic directory rename resolves competing publishers; no stale lock file is introduced.
- CONSIDERED: removeTemporaryDirectory validates the resolved parent immediately before recursive cleanup. This guard protects cleanup, not publication; published releases are never recursively removed by recovery.
- DOCUMENTED/TESTED: C04 visibility is asserted by the producer and verified by the shell's generic claim tests and browser Administrator/Dentist navigation. No speculative resource authorization is added.
- RETAINED: Pacientes matches the Spanish shell navigation. Portal identity and routes remain the approved English identifiers.
- Angular 154/154 is historical clean-candidate evidence, not a new Angular run for this tooling-only change. No separate RED/GREEN Git commits are claimed for this follow-up.
- Second review: recovery is exposed through recover:demo; network naming is explicit and matches the shell's PATIENT_NETWORK setting; AUTH-PAT-DEMO tracks real-data authorization acceptance. A rollback deleting a completed immutable release is deliberately rejected; explicit recovery preserves published assets.

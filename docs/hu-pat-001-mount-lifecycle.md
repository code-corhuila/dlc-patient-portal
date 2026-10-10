# HU-PAT-001 — Portal mount lifecycle

## Purpose and traceability

Provide the Angular lifecycle adapter before connecting protected patient operations. The entry imports without root bootstrap and mounts only inside the compositor-supplied host.

- Related issue: https://github.com/code-corhuila/dlc-patient-portal/issues/1 (partial increment; do not close).
- Related HU: https://github.com/code-corhuila/dlc-docs/issues/53.
- Specification: `dlc-docs/05-architecture/frontend-composition.md`, C01–C03; ADR-011. Lifecycle cases contribute to FC-01–FC-06 and FC-17 without claiming full compositor acceptance.
- Working branch: `feat/hu-pat-001-mount-lifecycle`; target: `develop`.

## Behavior and decisions

Export `patient`, version `1` and `mount`; create a zoneless Angular application with a portal-local context token. Shadow DOM isolates the frame. Reject occupied hosts, incompatible identity/version and cancelled contexts. Dispose only the owned application/root and abort listener, including cancellation during application creation and partial bootstrap failures.

The handle provides idempotent `unmount`, memory-only `updateRoute` and `canLeave`. Root route `/` shows domain integration unavailable; unknown local paths show 404. There are no editable forms, so `canLeave` returns true. No global router, HTTP client, token store, mock provider or patient data is created by the entry.

`navigation`, `session` and `http` are opaque, unused context capabilities in this increment. Typed consumption, session invalidation and actual feature routing follow in separate increments. No domain API or event contract changes.

## Validation evidence

Executed 2026-10-10, America/Bogota. GREEN evidence applies to the implementation commit containing this report; record its full SHA and CI links in the PR before independent review.

| Criterion / applicable DoD item | Revision or run evidence | Result |
|---|---|---|
| Initial RED | `6e38e05`; missing entry and contract exports | Expected compilation failure |
| Partial-failure RED | `3aa1d18`; implementation working tree leaked listener and raw DOM failure | 1 failed, 19 passed; expected failure |
| Fatal-error RED | `2f24f51`; implementation working tree classified a render failure as cancellation | 1 failed, 21 passed; expected failure |
| Local runtime ownership, abort, idempotency and failure cleanup | `portal-entry.spec.ts`, including independent applications and bootstrap failure | Passed |
| Existing patient regression plus lifecycle suite | `ng test --watch=false --browsers=ChromeHeadless --code-coverage` | 22/22 passed |
| Instrumented coverage | Statements 67/68; branches 17/18; functions 13/13; lines 58/58 | 98.52%, 94.44%, 100%, 100% |
| Standalone production build | `npm run build` | Passed |
| AOT browser module build | `npm run build:portal` | Passed |
| Built entry import without DOM | Node dynamic import; exact identity/version and callable mount checked | Passed |
| CI, deployed compositor and independent review | Attach revision-specific evidence | Pending |

ChromeHeadless runs required execution outside the sandbox. Coverage HTML is generated at `coverage/dlc-patients-portal/index.html`; generated artifacts are not committed. Build the standalone application before the portal: the standalone build clears its enclosing output directory.

Diff baseline is `origin/develop` at `f699e33` (merged PR #7). The local `develop` ref still points to PR #6 and would incorrectly include the previous increment; verify size with `git diff --stat origin/develop...HEAD` after committing.

## Remaining scope

Publish `portal/browser` under `/portals/patient/{release}/` and register its `entry.js` through the owning deployment/compositor work. No release, registry mutation or hosting claim is made here. The local application retains its prior development bootstrap; the composition entry is separate.

Real IAM/session and owner HTTP responses, administrative screens, role/resource authorization, stale-response protection, unsaved-form handling and E2E acceptance remain pending. This increment does not complete issue #1, HU-PAT-001, QA acceptance or the reviewed DoD.

# HU-PAT-001 — Portal identity review corrections

## Purpose and traceability

Align the local component/package/build identity with the approved `dlc-patient-portal` name and strengthen cancellation evidence from the mount-lifecycle review. This partially contributes to [portal issue #1](https://github.com/code-corhuila/dlc-patient-portal/issues/1) and [HU-PAT-001](https://github.com/code-corhuila/dlc-docs/issues/53); it closes neither.

Authority: `dlc-docs/00-governance/documentation-rules.md` singular repository convention and ADR-011 / `frontend-composition.md` C01–C03. Branch: `fix/hu-pat-001-portal-identity`; target: `develop`.

## Changes and compatibility

Normalize package/lockfile names, Angular project/serve targets, output path, local titles and README. The packaging script now reads the output path from the named Angular project instead of duplicating it. The portal entry remains `patient` / version `1`; APIs, events and `patients-service` retain their names.

New output: `dist/dlc-patient-portal/portal/browser/entry.js`. Publish only the selected current build directory; prior ignored build directories can remain locally. No GitHub repository, local checkout folder, remote URL, registry or deployment is renamed by this change.

## Review disposition

| Finding | Decision and evidence |
|---|---|
| 1 — identity drift | APPLIED to local package/project/artifact identity. The configured Git remote still uses the plural name; repository ownership must reconcile that separately. The published URL is based on portalId, so a registry failure was not demonstrated. |
| 2 — possible cancellation leak | REJECTED diagnosis: the post-create disposed guard already destroys the application. Strengthened the regression to verify one destroy call and no root bootstrap during cancelled creation. |
| 3 — possible route no-op | REJECTED: updateRoute sets the component signal and ticks its application; the existing view/URL test passes. |
| 4 — PR title | APPLY in PR metadata: use `fix(patients): align HU-PAT-001 portal identity`. No PR metadata was changed by this local task. |
| 5 — missing CI links | DEFERRED to the separate CI increment; local results do not establish CI or DoD acceptance. |

## Validation evidence

Executed 2026-10-10, America/Bogota. Evidence applies to the implementation commit containing this report; the PR must identify its full SHA and later CI links.

| Criterion / applicable DoD item | Revision or execution | Result |
|---|---|---|
| Test-first configurable packaging | RED `d40843a`; old script ignored configured output and failed ENOENT | Expected failure |
| Packaging honors Angular output configuration | `npm run test:packaging`; isolated output fixture | 1/1 passed |
| Cancellation actually destroys the late application | Strengthened existing regression; no lifecycle production change | Passed |
| Angular regression suite | `ng test --watch=false --browsers=ChromeHeadless --code-coverage` | 22/22 passed |
| Instrumented TypeScript coverage | Statements 67/68; branches 17/18; functions 13/13; lines 58/58 | 98.52%, 94.44%, 100%, 100% |
| Standalone and portal builds | `npm run build`, then `npm run build:portal` | Passed |
| Canonical built artifact import | Node import of singular-path entry; exports checked | Passed |
| Clean installation, CI and independent review | Revision-specific runs still required | Pending |

Coverage report: `coverage/dlc-patient-portal/index.html`. Packaging fixtures are temporary and checked before recursive cleanup. Sandbox restrictions required packaging rename and ChromeHeadless runs outside the sandbox.

## Remaining scope

The existing lockfile dependency graph still describes Angular 20 while package.json requests Angular 21. Only its package identity changed here; no dependencies were regenerated. Reconcile this mismatch before a clean npm ci / CI acceptance, preserving the 400-line PR constraint through an explicit delivery plan. Existing node_modules enabled the measured local builds; no clean-install success is claimed.

Real session/HTTP integration, patient workflows, deployment and HU acceptance remain pending. Previous evidence reports retain their historical plural output paths for their original revisions; this report documents the new current paths.

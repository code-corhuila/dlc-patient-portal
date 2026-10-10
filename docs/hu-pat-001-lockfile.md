# HU-PAT-001 — Generated Angular 21 lockfile

## Purpose and traceability

Reconcile package-lock.json with the existing Angular 21 manifest so a clean npm ci can execute. This is a dependency/tooling prerequisite for the Patient CI baseline, not a completed patient workflow. Related: portal issue #1, HU-PAT-001 and governance quality gates.

Branch: `chore/hu-pat-001-lockfile`; target: `develop`. The manifest and domain code are unchanged. npm 11.6.1 on Node 22.16.0 generated the lockfile using `npm install --package-lock-only --ignore-scripts --no-audit --no-fund`; no dependency graph entries were hand-edited.

## Size exception

Generated lockfile diff: 12343 additions + 5754 deletions = 18097 changed lines. The user explicitly stated in this chat that they have a course exception for a separate generated-lockfile PR. Attach the exception evidence in that PR before review; no instructor approval link was supplied or independently verified here.

The exception applies to this generated graph, not normal source/CI PRs. This separate report records provenance and execution evidence.

## Validation evidence

Executed 2026-10-10, America/Bogota, in a newly created isolated checkout. Evidence applies to the implementation commit containing this report; record its full SHA in the PR.

- Manifest and root lock dependency/devDependency ranges match.
- `npm ci --no-audit --no-fund`: passed; 1119 packages installed, normal installation scripts enabled.
- Angular ChromeHeadless suite with coverage: 22/22 passed.
- Instrumented statements/branches/functions/lines: 98.52% / 94.44% / 100% / 100%.
- `npm run test:packaging`: 1/1 passed.
- `npm run build` and `npm run build:portal`: passed with the freshly installed graph.

## Remaining scope

Merge this prerequisite before the CI baseline, then integrate the target branch and link hosted-CI results for the exact reviewed revision. No audit, Linux CI, E2E, deployment, issue closure or HU completion is claimed. No new domain behavior was introduced, so no artificial RED test was created for the generated lockfile.

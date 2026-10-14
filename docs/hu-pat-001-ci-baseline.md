# HU-PAT-001 — Patient CI baseline

## Purpose and traceability

Make the user-supplied CI workflow executable for the Patient portal, with reproducible local checks and coverage artifacts. Related: [portal issue #1](https://github.com/code-corhuila/dlc-patient-portal/issues/1), [HU-PAT-001](https://github.com/code-corhuila/dlc-docs/issues/53), NFR-006 and governance quality gates.

Branch: `chore/hu-pat-001-ci-baseline`; target: `develop`. This is tooling maintenance, not a new domain behavior; no artificial RED was introduced. Existing behavior tests remain the validation boundary.

## Changes and supplied resources

- Include the user's workflow, PR template and existing CODEOWNERS newline-only change. Template and CODEOWNERS were not edited; their SHA256 hashes were preserved.
- The later user instruction to align names to patient authorizes the only workflow adjustment: `billing-coverage` becomes `patient-coverage`. Workflow triggers and steps are preserved.
- Add the required `test:coverage` command: headless Angular coverage followed by the packaging test.
- Enforce 80% coverage globally and 90% lines for the patient projection/domain patterns. Generate HTML and LCOV under `coverage/dlc-patient-portal/`.
- Run the composition build through `postbuild`, so the existing workflow build step verifies standalone and composition artifacts.
- Normalize current report instructions to the singular component name.

## Validation evidence

Executed 2026-10-10, America/Bogota. Evidence applies to the implementation commit containing this report; attach the full SHA and GitHub Actions run/artifact links to the PR before acceptance.

| Applicable criterion / DoD item | Execution evidence | Result |
|---|---|---|
| Workflow test command and coverage gates | `npm run test:coverage` | 22 Angular tests + 1 packaging test passed |
| Instrumented TypeScript coverage | Statements / branches / functions / lines | 98.52% / 94.44% / 100% / 100% |
| Coverage artifact input | HTML and `lcov.info` present | Passed |
| Workflow build command | `npm run build`, including postbuild | Standalone and composition builds passed |
| Clean dependency installation | Isolated `chore/hu-pat-001-lockfile`: `npm ci --no-audit --no-fund` | Passed; 1119 packages installed |
| Clean-install regression | Isolated Angular suite, packaging test and both builds | 22 + 1 tests and builds passed |
| Hosted Ubuntu workflow / independent review | Run on the reviewed PR revision | Pending; local Windows execution is not hosted-CI evidence |

ChromeHeadless required execution outside the sandbox. No remote workflow success, audit, lint or E2E result is claimed.

## Dependency and merge order

The generated lockfile prerequisite merged into develop in PR #10 (`174d781`). This branch integrates that target revision through a normal merge, without rebase. Its subsequent correction includes optional peers required by the npm 10 Linux resolver; rerun hosted CI on the final PR revision.

The user stated a course exception for the separate generated-lockfile PR; it does not waive the 400-line limit for this CI increment. Attach that exception evidence to the lockfile PR discussion. Keep the dependency graph out of this PR until it is already in the target branch.

The workflow runs on pull requests and workflow_dispatch, not ordinary branch pushes. Publication alone does not produce CI acceptance. Use the supplied PR template, reviewed revision and linked reports; do not close issue #1 or claim HU-PAT-001 Done.

## Linux resolver follow-up

The first lockfile passed Windows/npm 11 installation but omitted `@emnapi/core` and `@emnapi/runtime`, peers of the optional WASM runtime. This was reproduced with npm 10.9.4 and Linux/x64 resolution: `npm ci --dry-run --ignore-scripts --os=linux --cpu=x64 --no-audit --no-fund` failed EUSAGE for both missing 1.11.3 entries.

Regeneration with npm 10.9.4 `install --package-lock-only --include=optional --ignore-scripts --os=linux --cpu=x64 --no-audit --no-fund` adds those entries and normalizes peer metadata. Existing package versions and the manifest are unchanged. The identical Linux resolver validation now passes. This is resolver validation on Windows, not execution inside a Linux runtime; hosted Actions remains the authoritative Linux result.

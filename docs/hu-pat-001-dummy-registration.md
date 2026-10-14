# HU-PAT-001 — Dummy patient registration

## Scope and traceability

Related: [portal issue #1](https://github.com/code-corhuila/dlc-patient-portal/issues/1), [HU-PAT-001](https://github.com/code-corhuila/dlc-docs/issues/53), PAT-001/PAT-003 and ADR-011. DTO fields and limits follow Patients OpenAPI CreatePatient; this cut uses synthetic data without API calls.

Branch: `feat/hu-pat-001-dummy-registration`; target: `develop`. Registry/proxy integration remains separate. The composed `/new` route is reached through `navigation.request('/app/patients/new')`; Administrator/Assistant gating precedes route rendering.

## Delivered behavior

- Required document type/number, name, past birth date, phone and email; optional address and one complete emergency contact. Field limits are canonical form metadata; birth dates use the America/Bogota calendar and reject impossible dates or today/future dates.
- Trim submitted fields, omit empty optional data, show validation/duplicate/failure/success states, and prevent repeated creation after success. Errors contain no raw exceptions.
- Create an ACTIVE UUID identity with version 1 in the scoped memory store. Clone requests/results/snapshots to avoid fixture or external mutation. Returning to the list reads the updated store.
- Demo duplicate comparison trims and uppercases the document type/number pair, including inactive profiles. This explicitly local policy does not approve the backend normalization algorithm or prove concurrent uniqueness.
- Delegate navigation to the shell. A native HTML dialog resolves canLeave asynchronously; staying cancels navigation, and component destruction resolves a pending decision false. Session invalidation cannot be vetoed by a dirty form.
- TypeScript, HTML and CSS remain separate. No clinical fields, patient accounts, owner HTTP calls, audit identities or domain events are introduced; registered/cancelled are local UI outputs.

## Validation evidence

Executed 2026-10-10, America/Bogota. Results apply to the implementation commit containing this report; attach its full SHA and hosted-CI link to the PR.

| Applicable criterion / DoD item | Evidence | Result |
|---|---|---|
| Basic TDD | RED `ee4af72` missing creation DTO/component/store/guard; GREEN `d76a437` | Expected RED; 40 Angular tests passed |
| Contacts and asynchronous guard TDD | RED `c89fbd6` missing contact controls/DTO and Promise guard | Expected compilation failure |
| Final suite | `npm run test:coverage` | 41 Angular + 1 packaging tests passed |
| Instrumented statements / branches / functions / lines | 157/160; 62/67; 43/43; 134/134 | 98.12% / 92.53% / 100% / 100% |
| Standalone and composition build | `npm run build` including postbuild | Passed |
| Hosted CI, independent review and actual shell journey | Exact reviewed revision | Pending |

## Limits

Data lasts within one mounted portal instance and resets on reload/full unmount; no browser or server persistence is claimed. Validate session, form cancellation and registered-list behavior in dlc-front once its demo descriptor/proxy is installed. Multiple contacts, editing, deactivation, Dentist assignment fixtures and visual/accessibility polish remain subsequent increments. This partial demo does not close issue #1 or complete HU-PAT-001/DoD.

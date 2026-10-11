# HU-PAT-001 — Composed dummy navigation and session

## Scope and traceability

Related: [portal issue #1](https://github.com/code-corhuila/dlc-patient-portal/issues/1), [HU-PAT-001](https://github.com/code-corhuila/dlc-docs/issues/53), PAT-003 and ADR-011 / composition C02–C05. Branch: `feat/hu-pat-001-composition-navigation`; target: `develop`.

The user scoped this cut to synthetic frontend data and dlc-front composition without owner APIs. This increment prepares the Patient side; it does not register or deploy the portal in dlc-front and does not complete the full integration issue.

## Behavior and boundaries

- Consume the shell's typed read-only session and navigation capabilities through the local context token. No authentication, tokens, global history or API transport is created.
- Render the existing explicitly labeled dummy list only for authenticated Administrator/Assistant. Resolving, unavailable, signed-out and expired sessions expose no profiles. Session invalidation destroys the list and unsubscribes its reads; root destruction removes its session subscription.
- Dentist and unsupported roles do not receive all administrative fixtures. Assigned-patient care fixtures are a separate pending increment, not fabricated authorization evidence.
- Interpret the global search `q` provided by dlc-front: case-insensitive, trimmed local name/document matching. No matches show the existing empty list. This is not owner API search or document-uniqueness enforcement.
- Keep unknown local routes as 404; its recovery button delegates `/app/patients` to navigation.request. Applied/cancelled/rejected outcomes remain shell-owned; errors are safe text and stale-session outcomes are ignored.
- Keep dummy access behind PatientsMockService. Cancellation uses component destruction; no owner writes, clinical fields or cross-portal patient links are added.
- Keep component behavior, template and scoped styles in separate TypeScript, HTML and CSS files.

## Validation evidence

Executed 2026-10-10, America/Bogota. Evidence applies to the implementation commit containing this report; attach its full SHA and hosted-CI run to the PR.

| Criterion / applicable DoD item | Evidence | Result |
|---|---|---|
| Test-first session/navigation contract | RED `5c5d0b8`; missing SessionSnapshot and navigation methods | Expected compilation failure |
| Session gating, query updates and navigation outcomes | Portal-frame tests and updated mount regression | Passed |
| Destruction and invalidation cleanup | Session unsubscribe regression and takeUntilDestroyed | Passed |
| Regression suite | `npm run test:coverage` | 34 Angular + 1 packaging tests passed |
| Instrumented statements / branches / functions / lines | 93/95; 28/31; 22/22; 82/82 | 97.89% / 90.32% / 100% / 100% |
| Build including composition postbuild | `npm run build` | Passed |
| Hosted CI and actual shell browser journey | Exact reviewed revision | Pending |

## Integration next step

Replace the shell's pending patient registry descriptor and serve this portal's complete browser artifact directory at `/portals/patient/{demo-release}/`, same origin and no-store. Browser checks must cover mount/update/unmount, logout, Back/Forward and portal failure; this PR makes no runtime claim about dlc-front.

Coordinate shared synthetic patient identifiers before Clinical record navigation. `/app/patients/{uuid}` is a Clinical alias; an administrative detail route must be explicitly defined before its implementation. Registration, editing, deactivation, Dentist assignment projection and visual polish remain pending. Fixtures cannot establish server authorization, guarded deactivation, persistence or HU Done.

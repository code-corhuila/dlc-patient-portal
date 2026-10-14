# Changelog

User-visible changes and delivery improvements for `dlc-patient-portal`.
Entries describe implemented behavior; they do not establish user-story acceptance.

## [Unreleased]

### Added

- Patient listing, name/document search and an active-patient filter.
- Administrative patient registration with contract-defined fields, optional
  address and emergency contacts, and local duplicate-document detection.
- Patient editing at `/app/patients/profiles/{patientId}/edit`, with allowlisted
  update fields and local optimistic-version conflict handling.
- A shared registration/editing form with multiple emergency contacts,
  validation feedback and unsaved-change confirmation.
- Administrator-only demo deactivation with a required reason, version check,
  fictional appointment guards and in-memory history. Deactivation retains the
  profile without deleting records or cancelling appointments.
- A browser-module entry exporting `portalId`, `contractVersion` and `mount`,
  with route updates, leave checks and runtime cleanup for `dlc-front`.
- Shell-owned session and navigation consumption, including private-content
  cleanup on session invalidation.
- Docker/nginx demo delivery and a local static asset server on port `4178`.
- Unit, component, lifecycle and packaging tests with CI coverage reporting.

### Changed

- Standardized package, Angular project and artifact identity as
  `dlc-patient-portal`, with stable composition ID `patient`.
- Reused the shared patient form for registration instead of maintaining
  separate registration fields and validators.
- Consolidated modal styling in a shared stylesheet and aligned patient views
  with the supplied mockups while retaining contract-defined fields.

### Fixed

- Cancellation during Angular application creation and partial mount cleanup.
- Composed route updates and navigation-failure feedback.
- Edit payload constraints and isolation from standalone demo routing.
- Recoverable descriptor publication after an interrupted demo release.
- Explicit forbidden outcomes for demo deactivation-history access.
- Synthetic deactivation guards for newly registered demo patients.

### Delivery notes

- `release/2.0.0` is the prepared QA promotion branch. No merged or published
  version is asserted by this changelog.
- The promotion branch name does not change the package version (`0.0.0`) or
  the default demo asset release (`0.1.0-demo`).
- Patient data, deactivation history and appointment guards are fictional and
  reset on reload or full portal unmount. Browser role checks are presentation
  controls, not server-side authorization.
- Live owner API integration, durable persistence/history, real appointment
  guards, the Dentist assigned-patient read-only view and complete modal
  accessibility remain pending. HU-PAT-001 is not complete.
- The existing Angular `NG8102` placeholder warning remains.

Related: [HU-PAT-001](https://github.com/code-corhuila/dlc-docs/issues/53)
and [portal issue #1](https://github.com/code-corhuila/dlc-patient-portal/issues/1).

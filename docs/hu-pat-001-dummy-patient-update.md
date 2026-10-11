# HU-PAT-001 dummy patient update

Reference: code-corhuila/dlc-docs#53 and dlc-patient-portal#1. Branch: feat/hu-pat-001-dummy-patient-update; eventual target: develop. Local draft, no commits/push or HU closure.

## Specification and scope

- Patients OpenAPI at dlc-docs revision 638e4f227c318b9e62bc1ce5a152c71414c72d51: UpdatePatient requires expectedVersion >= 1 and at least one actual administrative change. Additional properties, clinical fields, direct status changes and client audit identities are denied. PAT-001/003/005 and ADR-003 govern ownership/minimization/history; server authorization remains mandatory.
- UpdatePatientRequest is separate from CreatePatientRequest. Pure planning validates supplied fields/contacts, retains omitted fields and existing metadata, checks version/document collisions and returns a cloned updated profile. No timestamp, audit event or identity is invented.
- PatientsMockService persists a successful plan in memory, returns isolated reads by ID and notifies list subscribers only after success. Fixtures, caller contacts, returned profiles and subscriber snapshots remain isolated. Registration retains the approved error: DOCUMENT_EXISTS result shape.
- PATIENTS_PORT explicitly exposes synchronous demo capabilities. These local results are not owner HTTP responses; a future asynchronous owner adapter/shared-client contract is still required. No own HTTP/session/tokens, API request, event publication, schema or clinical storage is added.
- ID/status are preserved, including inactive patients; there is no hard delete or deactivation implementation. Existing metadata preservation does not implement an authoritative audit/history store. Unknown ID, stale version, invalid/no-op changes and duplicate document are distinct demo failures.
- No editing page, Edit button, route, CSS or modal is included. Editing integration and real role/assignment enforcement remain pending. Duplicate comparison is the existing trim/case demo policy, not proof of owner normalization or concurrent database uniqueness. Email uniqueness is not invented.

## Validation and trace

Tests were written before update capabilities: RED failed compilation for missing UpdatePatientRequest/getPatient/updatePatient. Source and RED test/log snapshots are under ignored coverage/hu-pat-001-update-trace. Subsequent GREEN and regression/refactor runs passed; no RED/GREEN commits are claimed.

Final local working-tree results (2026-10-11, America/Bogota): 44 update cases; 137/137 Angular tests, 1/1 packaging, standalone and portal builds passed. Coverage: statements 95.77%, branches 91.61%, functions 93.25%, lines 96.09%; configured gates passed; patient-update.ts lines 100% (52/52). Local TypeScript AST complexity estimate: contacts 10, administrativeText 9, parseChanges 6, planPatientUpdate 10 (not an official CI analysis).

Cases cover partial updates, integer versions, stale competing edits/retry, atomic rejection, protected/unknown properties, every text/contact length boundary, optional contact clearing, object-order-independent no-op detection, Bogota midnight, inactive profiles, document pairs, nested clone isolation and subscriber notifications.

## Publication boundary

Only model/patient.ts, model/patient-update.ts, data/patients.port.ts, data/patients-mock.service.ts, data/patients-update.spec.ts and this report. Exclude the local creation regression spec, UI/navigation/CSS/modal drafts and all other changes. Selected increment: 375 changed lines, including additions/deletions, tests and this report; revalidate the selected clean revision and link reviewed SHA/CI before acceptance. Local full-suite results include unpublished changes and do not certify a clean PR checkout or HU Done.

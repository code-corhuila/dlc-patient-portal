# HU-PAT-001 mock-up patient UI

Reference: dlc-docs `12-ux-ui/mockup/di-lucca-mockup.pdf` pages 5 (Listado de pacientes, Figma `88:442`) and 6 (Registro paciente, Figma `88:1095`).
Branch: feat/hu-pat-001-mockup-ui; target: develop.
Scope: presentation only. Validation, the dummy store, the update planner, the composition contract and routes are unchanged. This does not complete HU-PAT-001.

## Delivered presentation

- "Gestión de Pacientes" header with the mock-up subtitle and a primary "Nuevo Paciente" action (top right). An explicit "Datos ficticios de demostración" badge keeps the dummy data labeled, as the composition evidence requires.
- Toolbar card: search by name or document (seeded by the shell's `q`, refined locally) and the "Solo Pacientes Activos" toggle.
- Table card: initials avatar, name with address subtitle, document type chip plus number, phone, email, birth date, ACTIVO/INACTIVO badge and a pencil edit action. Missing administrative values render "—".
- "Registrar Nuevo Paciente" opens as a modal over the list (`/new`), two-column grid, close button, "Cancelar" and "Guardar Paciente". Editing reuses the same modal styling ("Editar Paciente").
- All user-facing copy is Spanish. Portal identity, route paths and code identifiers stay English, as approved.

## Deliberate deviations from the mock-up

| Mock-up | Delivered | Reason |
|---|---|---|
| Separate Nombre / Apellido | One "Nombre completo" field | The Patients OpenAPI `CreatePatient` has a single `name`. Contract wins over a legacy frame (12-ux-ui maintenance rule). |
| Correo and Fecha de Nacimiento without `*` | Marked required | `CreatePatient` requires both. |
| Tipo Documento as a closed select | Text input with suggestions (CC, TI, CE, PA, RC) | The contract defines no `documentType` enum; a select would invent one. |
| No emergency contact | Optional "Contacto de emergencia" section | The contract and HU-PAT-001 registration flow already include it. |
| Fixture rows show birth date and address | Demo fixtures keep their original fields ("—") | The fixtures back existing update-logic tests; changing them is outside this presentation increment. Registered patients show both values. |

## Validation evidence

- RED `5c8dd16`: Angular compilation failed because `PatientListItem` lacked `initials`, `documentType`, `birthDate` and `address`. Log: coverage/mockup-ui-red.log (ignored).
- GREEN: 163/163 Angular tests, 8/8 packaging tests on Node 22 + Chromium (Linux container, CI-equivalent). Coverage: statements 98.7%, branches 93.54%, functions 99.09%, lines 99.71%.
- Visual check through dlc-front (`:8080`) as Administrator, 1244×996 (mock-up frame size), with the patient container rebuilt from this branch:
  - [Listado](img/hu-pat-001-mockup-ui-list.png)
  - [Registrar Nuevo Paciente](img/hu-pat-001-mockup-ui-new.png)
  - [Editar Paciente](img/hu-pat-001-mockup-ui-edit.png)
- The shell's sidebar and header belong to dlc-front and were not changed.

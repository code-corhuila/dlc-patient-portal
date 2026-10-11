# dlc-patient-portal

> Patients bounded context: administrative web UI.

Part of the **Di-lucca** distributed system — team `di-lucca`, Grupo 2.
Governance and documentation live in [`dlc-docs`](https://github.com/code-corhuila/dlc-docs).

## Composition entry

Run `npm run build:portal` to create `dist/dlc-patient-portal/portal/browser/entry.js`. It exports `portalId` (`patient`), `contractVersion` (`1`) and `mount` without bootstrapping on import. Publish the complete browser directory under the compositor's versioned same-origin release path; registry and hosting configuration belong to deployment.

The package and Angular project use the approved component name `dlc-patient-portal`. Packaging reads its output path from Angular configuration; `npm run test:packaging` verifies that behavior. The local folder and Git remote may retain their previous plural name; this change does not rename either or publish a release.

The composed frame consumes the shell session and shows an explicit fictional list for Administrator/Assistant. It accepts the shell's `q` query and delegates 404 recovery through shell navigation. Dentist assignment fixtures, owner APIs and shell registration remain pending. See [navigation evidence](docs/hu-pat-001-composition-navigation.md).

The `/new` local route supports administrative dummy registration, optional address/emergency contact and unsaved-change confirmation. Its store lasts only for the mounted Angular application; reload or full unmount resets it. See [registration evidence](docs/hu-pat-001-dummy-registration.md).

## Demo delivery for dlc-front

From a clean checkout, run `npm run build:demo`, then `npm run serve:demo` for versioned assets on localhost:4177. This serves `entry.js`, not a standalone page. For containers, start Docker and run `docker compose -f deploy/compose.yml up --build -d`. Existing release folders are immutable; select a new release with `npm run build:demo -- 0.1.1-demo`.

The generated `dist/demo/patient-descriptor.json` supplies the Patients descriptor to the front team. Registry/proxy registration and browser integration remain pending in dlc-front. See [delivery contract and evidence](docs/hu-pat-001-demo-delivery.md).

## Local CI checks

Use Node 22.x. After `npm ci`, run `npm run test:coverage` and `npm run build`. Coverage checks enforce 80% globally and 90% lines for the patient projection/domain patterns. Reports are written to `coverage/dlc-patient-portal/`; the build also produces the composition entry through `postbuild`.

CI records results for the tested revision; a successful run does not close HU-PAT-001. The separate generated-lockfile PR must merge before the CI baseline can pass a clean install. See [CI evidence](docs/hu-pat-001-ci-baseline.md).

## Branch policy

Three permanent branches. **None of them accepts a direct commit** — you enter through a child
branch and leave through a Pull Request.

```
develop  <--PR--  feat/... fix/... chore/...
qa       <--PR--  qa/...
main     <--PR--  release/...  hotfix/...
```

Promotion happens **by re-application** (`git cherry-pick -x`), never by merging one permanent
branch into another: `merge develop -> qa` and `merge qa -> main` do not exist in this model.

`main` requires **1 approval from `ariel5253`**. On `develop` and `qa` the team sets its own review
rule.

Full policy: `00-governance/branching-policy.md` in `di-lucca-docs`.

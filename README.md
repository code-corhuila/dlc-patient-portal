# dlc-patient-portal

> Patients bounded context: administrative web UI.

Part of the **Di-lucca** distributed system — team `di-lucca`, Grupo 2.
Governance and documentation live in [`dlc-docs`](https://github.com/code-corhuila/dlc-docs).

## Composition entry

Run `npm run build:portal` to create `dist/dlc-patient-portal/portal/browser/entry.js`. It exports `portalId` (`patient`), `contractVersion` (`1`) and `mount` without bootstrapping on import. Publish the complete browser directory under the compositor's versioned same-origin release path; registry and hosting configuration belong to deployment.

The package and Angular project use the approved component name `dlc-patient-portal`. Packaging reads its output path from Angular configuration; `npm run test:packaging` verifies that behavior. The local folder and Git remote may retain their previous plural name; this change does not rename either or publish a release.

The mounted frame currently reports unavailable domain integration and does not load fixtures. `npm start` and `npm run build` retain the separate standalone development application. See [lifecycle evidence and remaining scope](docs/hu-pat-001-mount-lifecycle.md).

## Branching

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

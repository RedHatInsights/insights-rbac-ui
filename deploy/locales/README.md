# Frontend template localization POC

`deploy/frontend.yaml` remains the hand-edited English source. The 68-key FormatJS English catalog is generated only when needed, named `insights-rbac-ui-feo-frontend-en.json` in Phrase, and never committed. Its keys match YAML fields and stable IDs (search, nested navigation, service tiles, document title). `zh-CN.json` contains six **illustrative manual translations**, not reviewed Phrase deliveries; these are for validating the file handoff only. `spec.locales.zh-CN` is generated from them and must not be edited by hand.

On the tooling feature branch, verify the file handoff without committing an English catalog:

```sh
CLI=/path/to/i18n-tooling/packages/i18n-pipeline/dist/cli.js
SOURCE_DIR="$(mktemp -d)"
trap 'rm -rf "$SOURCE_DIR"' EXIT
node "$CLI" feo extract --template deploy/frontend.yaml --output "$SOURCE_DIR/insights-rbac-ui-feo-frontend-en.json"
node "$CLI" feo inline --template deploy/frontend.yaml --source "$SOURCE_DIR/insights-rbac-ui-feo-frontend-en.json" --target deploy/locales/zh-CN.json --locale zh-CN --check
```

Remove `--check` from the second command to regenerate YAML. CI checks out the Phrase-independent tooling commit from https://issues.redhat.com/browse/RHCLOUD-52057 and generates English into runner temp space. The Phrase submit workflow is pinned to the dependent tooling commit `eccc725` (publish its branch before use) to regenerate the same catalog from pinned `deploy/frontend.yaml`, submit it under the descriptive filename, and later regenerate it from both the pinned and current base YAML to reject stale English. Reconciliation opens one PR containing only the zh-CN JSON and updated YAML; no source catalog is added to that PR.

The two Phrase caller workflows accept **separate marker commits on `RHCLOUD-52058`**: change `.github/i18n/feo-phrase-submit.pilot` to submit after review, then change `.github/i18n/feo-phrase-reconcile.pilot` after the zh-CN job finishes in Phrase. Do not commit either marker just to set up this POC. Before triggering, publish the pinned tooling commit, confirm the Phrase project and secrets, and allow this branch in the fork's protected `phrase-pilot` Actions environment (currently it only allows the earlier pilot). Feature-branch-only `workflow_dispatch` callers are not registered on the default branch, so use these guarded push triggers. **No Phrase job has been submitted for these sample translations.**

The published FEC validator in the lockfile rejects `spec.locales`. Until the schema update in https://issues.redhat.com/browse/RHCLOUD-52059 is released, `npm ci` applies a narrowly scoped `patch-package` schema patch and the localization workflow checks `npm run build`. Remove the patch and its `postinstall` hook once the updated config-utilities package is locked and `npm run build` passes without it. **A passing build does not make `spec.locales` deployable: wait for Frontend CRD, operator, publisher, and Chrome consumer support.**

Related: https://issues.redhat.com/browse/RHCLOUD-52057 and https://issues.redhat.com/browse/RHCLOUD-52058.

# Frontend template localization POC

`deploy/frontend.yaml` remains the hand-edited English source. The generated FormatJS catalog `translation-template.json` has 68 YAML-aligned, stable-ID strings (search, nested navigation, service tiles, document title). `zh-CN.json` contains six **illustrative manual translations**, not reviewed Phrase deliveries; these are for validating the file handoff only. `spec.locales.zh-CN` is generated from them and must not be edited by hand.

On the tooling feature branch, run:

```sh
CLI=/path/to/i18n-tooling/packages/i18n-pipeline/dist/cli.js
node "$CLI" feo extract --template deploy/frontend.yaml --output deploy/locales/translation-template.json --check
node "$CLI" feo inline --template deploy/frontend.yaml --source deploy/locales/translation-template.json --target deploy/locales/zh-CN.json --locale zh-CN --check
```

Remove `--check` to regenerate. CI checks out the Phrase-independent tooling commit from https://issues.redhat.com/browse/RHCLOUD-52057; manual-only Phrase callers use dependent branch `RHCLOUD-52058-phrase-handoff` for the optional `frontendTemplate.path` integration that commits both JSON and YAML into one PR. Before live submission, confirm the Phrase project and protected secrets, and replace temporary branch references with reviewed commit SHAs. GitHub only registers `workflow_dispatch` callers on the default branch; on this feature branch, a maintainer must arrange a safe pilot trigger before running them. No Phrase job has been submitted for these sample translations.

The published FEC validator in the lockfile rejects `spec.locales`. Until the schema update in https://issues.redhat.com/browse/RHCLOUD-52059 is released, `npm ci` applies a narrowly scoped `patch-package` schema patch and the localization workflow checks `npm run build`. Remove the patch and its `postinstall` hook once the updated config-utilities package is locked and `npm run build` passes without it. **A passing build does not make `spec.locales` deployable: wait for Frontend CRD, operator, publisher, and Chrome consumer support.**

Related: https://issues.redhat.com/browse/RHCLOUD-52057 and https://issues.redhat.com/browse/RHCLOUD-52058.

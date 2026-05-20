# Changelog

## Unreleased

- Update @basetime/a2w-webview-ts dependency to version 1.0.1 in SPA and standard examples, and synchronize pnpm-lock.yaml files.. (`fadfdbc`)

## 1.0.1 - 2026-05-20

- Refactor 'ready' event handling to remove payload requirement across the application, updating related components and tests accordingly.. (`b9d7d71`)
- Update @basetime/a2w-webview-ts dependency to version 1.0.0 in SPA and standard examples, and adjust pnpm-lock.yaml accordingly.. (`26ddeaa`)

## 1.0.0 - 2026-05-20

- Refactor release workflow to publish before committing and tagging, ensuring main branch remains untouched on publish failure. Update @basetime/a2w-webview-ts dependency to version 1.0.1 in SPA and standard examples.. (`5781a2d`)

## 1.0.0 - 2026-05-20

- See [MIGRATION.md](MIGRATION.md) for the v0.2.7 → v1.0.0 upgrade notes covering everything below.
- Add synthetic `boot` event (`AppEvents['boot']`, payload `{ isEmbedded }`) that fires once per `WebApp` instance after the SDK has resolved native-bridge availability, with replay semantics for late subscribers. Recommended replacement for the synchronous `isEmbedded` getter, which is now `@deprecated`.
- Queue `webApp.send(...)` calls that arrive before the native bridge is injected; flush them in order once the bridge appears.
- Make `webApp.off(event, cb)` cancel a still-pending subscription that hasn't been attached to the bridge yet (previously was a silent no-op).
- Emit a single `console.warn` when the SDK times out waiting for `window.atw` to appear (10s), reporting the number of dropped queued messages and pending subscriptions. The `boot` event also fires at that point with `isEmbedded: false`.
- Refactor `WebApp` to a single shared bridge-readiness state machine instead of per-subscription polling loops, eliminating the N concurrent timers previously created by wildcard subscriptions.
- Update the SPA and standard examples to bootstrap via the `boot` event instead of the deprecated synchronous `isEmbedded` check. Examples will type-check cleanly once their pinned `@basetime/a2w-webview-ts` dependency is bumped to a release that includes this change.

## 0.2.7 - 2026-05-18

- Update README to include new properties in ScanPayload interface and upgrade @basetime/a2w-webview-ts dependency to version 0.2.6 in SPA and standard examples.. (`323e0d6`)

## 0.2.6 - 2026-05-18

- Update .gitignore to include GCP service-account credentials and modify package.json to specify files for publishing.. (`e04e98d`)

## 0.2.5 - 2026-05-18

- Enhance ScanPayload interface by adding barcode property and updating pass type to allow null values for non-a2w barcodes.. (`b63f4b6`)

## 0.2.4 - 2026-05-15

- Update repository URL in package.json and adjust release workflow comments to clarify provenance verification requirements.. (`9beef27`)


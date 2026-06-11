# Migration Guide: v0.2.7 → v1.0.0

`@basetime/a2w-webview-ts@1.0.0` cements the SDK's public API around the
new synthetic `boot` event and adds robust support for WebView runtimes
that inject `window.atw` after page load (notably some PAX devices).
This guide walks through the changes that are likely to affect existing
consumers.

> **No public APIs were removed.** Code written for v0.2.7 will continue
> to compile and run against v1.0.0. The version bump signals stability
> around the new bootstrap pattern and surfaces a few behavior changes
> that you should review before upgrading.

---

## TL;DR

| You were doing... | You should now... |
| --- | --- |
| `if (!webApp.isEmbedded) { ... }` at module load | Subscribe to the `boot` event (see [§1](#1-replace-synchronous-isembedded-checks-with-the-boot-event)) |
| Calling `webApp.send(...)` right after `new WebApp()` and assuming early messages were dropped | Nothing — they're now queued and flushed when the bridge appears ([§3](#3-send-now-queues-messages-until-the-bridge-is-ready)) |
| `webApp.off(event, cb)` to cancel a pending subscription | Nothing — it now actually cancels the pending attach ([§4](#4-off-now-cancels-pending-poll-subscriptions)) |
| Silently swallowing `console.warn` in production logs | Allow-list `[a2w-webview-ts]` warnings or filter them ([§5](#5-bridge-poll-timeout-now-emits-a-consolewarn)) |
| Using a custom event map `WebApp<MyEvents>` | Check whether your map uses a key named `boot` ([§6](#6-appevents-gained-a-boot-key)) |

---

## 1. Replace synchronous `isEmbedded` checks with the `boot` event

### Why

`webApp.isEmbedded` is a synchronous getter that returns `true` only if
**both** `window.ReactNativeWebView` and `window.atw` are defined at
the moment of the call. On some Android WebView runtimes the native
bridge injects `window.atw` *after* the JS bundle evaluates, so a
synchronous check at module load can return `false` for an app that is
genuinely embedded.

The new `boot` event fires exactly once per `WebApp` instance after
the SDK has finished waiting for the bridge (up to 10 seconds), so
gating UI on `boot` is reliable regardless of injection timing.

`isEmbedded` is now marked `@deprecated` but continues to work as a
live (lazy) check; we will keep it shipping through the 1.x line.

### Before

```typescript
import { WebApp } from '@basetime/a2w-webview-ts';

const webApp = new WebApp();
if (!webApp.isEmbedded) {
  throw new Error('Not embedded');
}
```

### After (vanilla)

```typescript
import { WebApp } from '@basetime/a2w-webview-ts';

const webApp = new WebApp();
webApp.on('boot', ({ payload }) => {
  if (!payload.isEmbedded) {
    // render a "not embedded" UI
    return;
  }
  // proceed with the embedded UI
});
```

### After (React)

```tsx
import { useEvent } from '@basetime/a2w-webview-ts/react';
import { useState } from 'react';

function Bootstrap() {
  const [isEmbedded, setIsEmbedded] = useState<boolean | null>(null);
  useEvent('boot', ({ payload }) => setIsEmbedded(payload.isEmbedded));

  if (isEmbedded === null) {
    return null; // still resolving — usually <1 frame
  }
  return isEmbedded ? <App /> : <NotEmbeddedScreen />;
}
```

### Notes

- `boot` is replay-safe: subscribers that register **after** the event
  has already fired still receive the cached payload (delivered
  asynchronously on the next tick).
- `boot` is **not** included in the `'*'` wildcard fan-out. It is
  synthetic — emitted by the SDK itself rather than by the native
  bridge — and including it in `'*'` would surprise consumers logging
  scanner traffic. Subscribe to it explicitly with `on('boot', ...)`
  or `useEvent('boot', ...)`.

---

## 2. `BootPayload` is a new exported type

`AppEvents` now includes a `boot: BootPayload` entry. If you import
event payload types by name, the new type is available:

```typescript
import type { BootPayload } from '@basetime/a2w-webview-ts';
```

`BootPayload` shape:

```typescript
interface BootPayload {
  isEmbedded: boolean;
}
```

---

## 3. `send()` now queues messages until the bridge is ready

### What changed

In v0.2.7, `webApp.send(...)` called before `window.atw` was injected
was silently dropped. In v1.0.0, those messages are buffered and
flushed in arrival order once the bridge appears.

If the bridge never appears within the 10-second timeout, queued
messages are dropped and a single `console.warn` is logged (see [§5](#5-bridge-poll-timeout-now-emits-a-consolewarn)).

### Impact

This is **strictly more forgiving** than the previous behavior. The
typical effect is that effects like `useEffect(() => webApp.send('ready'))`
now reliably reach the host even on WebViews with delayed bridge
injection, where they previously vanished.

### Things to be aware of

- Queued messages are flushed in the same order they were enqueued.
- There is currently no queue size cap. If your app calls `send()` in
  a tight loop while the bridge is missing, those messages all
  accumulate until the bridge appears or the SDK times out.
- Messages sent **after** the timeout is reached are dropped silently
  (no further warnings), matching the v0.2.7 "no bridge, no send"
  behavior.

---

## 4. `off()` now cancels pending poll subscriptions

### What changed

In v0.2.7, calling `webApp.off(event, cb)` while the SDK was still
waiting for the bridge was a silent no-op — and any subscription
registered via `webApp.on(event, cb)` during that window would still
be attached once the bridge appeared, even after the corresponding
`off()`. In v1.0.0, `off()` reliably cancels both attached **and**
pending subscriptions.

### Impact

If you were relying on the buggy old behavior (which would be
unusual), the SDK now actually unsubscribes when you ask it to. The
disposer returned by `on()` continues to work as before; this only
affects callers using the explicit `off()` API.

```typescript
const cb = (msg) => { /* ... */ };
webApp.on('scan', cb);
webApp.off('scan', cb); // now reliably prevents `cb` from ever being attached
```

---

## 5. Bridge poll timeout now emits a `console.warn`

If `window.ReactNativeWebView` exists but `window.atw` never appears
within 10 seconds, the SDK now logs:

```
[a2w-webview-ts] window.atw did not appear within 10000ms; dropping N queued message(s) and M pending subscription(s).
```

This is emitted **at most once per `WebApp` instance**.

### Impact

- Production observability tools that aggregate `console.warn` will
  begin reporting this message for devices where the native bridge
  fails to inject (genuinely a problem worth knowing about).
- If you intentionally instantiate `WebApp` in a non-embedded context
  where `window.ReactNativeWebView` is set by something other than the
  scanner runtime (unusual), you can suppress the warning by gating
  construction on your own check.

The `boot` event also fires at the timeout boundary with
`{ isEmbedded: false }`, so the warning is a strict superset of the
information you can already react to.

---

## 6. Build target moved from `esnext` to `es2018`

The package's published JavaScript now targets ES2018 (was `esnext`).
This was a deliberate compatibility change for older Android WebView
engines on PAX hardware. It does **not** affect the public API and is
transparent to consumers using any reasonably modern bundler. Mention
it if you ship raw, un-bundled SDK code to constrained runtimes.

---

## 7. Removed / breaking changes

**None.** v1.0.0 contains no removals and no breaking type changes
relative to v0.2.7. The version bump reflects the SDK's commitment to
the new `boot`-based bootstrap pattern and signals API stability going
forward.

If you encounter unexpected behavior after upgrading, please open an
issue against
[basetime/a2w-webview-ts](https://github.com/basetime/a2w-webview-ts).

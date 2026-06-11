![Logo](https://cdn.addtowallet.io/img/a2w-webview-ts-logo.png)

**Full documentation:** [https://basetime.github.io/a2w-webview-ts/](https://basetime.github.io/a2w-webview-ts/)

**SDK for webview apps running inside the Addtowallet scanner.**

`@basetime/a2w-webview-ts` is a TypeScript SDK for embedded webview apps in the Addtowallet scanner:

- **WebApp bridge:** Subscribe to scanner events (`scan`, `standby`, `error`) and send commands (`navigate`, `settings`) via a typed `WebApp` class.
- **React hooks:** Optional `/react` subpath with `useEvent` and `useWebApp` for React-based embedded UIs.
- **Boot lifecycle:** Synthetic `boot` event for reliable embedded detection on older Android WebView runtimes.

## Documentation

| Topic           | Link                                                                   |
| --------------- | ---------------------------------------------------------------------- |
| Getting started | [Introduction](https://basetime.github.io/a2w-webview-ts/)             |
| Installation    | [Installation](https://basetime.github.io/a2w-webview-ts/installation) |
| Usage           | [Usage](https://basetime.github.io/a2w-webview-ts/usage)               |
| React           | [React](https://basetime.github.io/a2w-webview-ts/react)               |
| Events          | [Events](https://basetime.github.io/a2w-webview-ts/events)             |
| Migration       | [Migration Guide](https://basetime.github.io/a2w-webview-ts/migration) |

Canonical docs live in [`docs/`](./docs/). Edit those pages directly, then run `pnpm docs:build:nav` to refresh the VitePress sidebar.

## Development

```bash
pnpm install
pnpm test
pnpm docs:serve    # VitePress dev server with nav watcher
pnpm docs:build    # production docs build
```

## License

UNLICENSED

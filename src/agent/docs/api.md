
# 🌐 API

### `start(location?: string, options?: StartOptions): Promise<ToadScheduler>`

Run Sigyn agent. It will fetch logs depending your rules `polling` and send alerts when `count` threshold is reached.

- `location: string` Optional, default to `process.cwd()`. The path to your SQLite database, it will create the file if it doesn't exists but the directory **must** exists.
- `options.logger: Logger` Optional, default to `pino`. You can use your own logger which must be an object with theses 3 methods: `debug`, `info` & `error`.
- `options.level` Optional, only works if no logger given. Set log level: `"info" | "debug" | "error"`.
- `options.timeout` Optional, you can provide a timeout for Grafana API requests. Default: `30_000`.

The returned scheduler instance allow you to put some extra logic if needed, see [API for scheduler](https://github.com/kibertoad/toad-scheduler/blob/main/README.md#api-for-scheduler).

## 🖋️ Interfaces

```ts
interface Logger {
  info: (message: string) => void;
  error: (message: string) => void;
  debug: (message: string) => void;
}

interface StartOptions {
  logger?: Logger;
  level?: "info" | "debug" | "error";
  timeout?: number;
}
```

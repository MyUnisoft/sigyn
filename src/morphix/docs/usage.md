# Usage

```ts
import { morphix } from "@sigyn/morphix";

await morphix("Hello {name | capitalize}", { name: "john" });
```

> [!NOTE]
> `morphix()` is async because it supports async **functions**

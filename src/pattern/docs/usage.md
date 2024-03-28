# Usage

```ts
import { Pattern } from "@sigyn/pattern";

const parser = new Pattern("HTTP <verb> <_> <endpoint>");

const parsedLogs = parser.executeOnLogs([
  "HTTP POST 200 /api/v1/dowork",
  "HTTP GET 200 /api/v1/dowork"
]);

// Automatically infer types 
for (const { verb, endpoint } of parsedLogs) {
  console.log(verb, endpoint);
}
```

You can also provide an Array to Pattern constructor (quite helpful with long or multipart patterns).

```ts
new Pattern([
  "[schema: <id>|type: <user_type>]",
  "HTTP <verb> <_> <endpoint>"
] as const)
```

> [!TIP]
> Use `as const` to benefit from type inference

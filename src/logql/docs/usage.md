# Usage

**Build your LogQL**
```ts
import { LogQL } from "@sigyn/logql";

const logql = new LogQL("foo");
logql.streamSelector.set("env", "prod");
logql.lineEq("bar");
logql.lineNotEq("baz");

// {env=\"prod\"} |= `foo` |= `bar` != `baz`
console.log(logql.toString());
```

**Parse your LogQL**
```ts
import { LogQL } from "@sigyn/logql";

const logql = new LogQL("{app=\"foo\", env=\"preprod\"} |= `foo` != `bar`");

console.log([...logql.streamSelector.entries()]);
console.log(logql.lineFilters.lineContains());
console.log(logql.lineFilters.lineDoesNotContain());
```

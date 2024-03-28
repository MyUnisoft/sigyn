# Shape

<em>Pattern</em> and <em>NoopPattern</em> both implement the same Shape using `PatternShape` interface.

```ts
type LokiPatternType = string | Array<string> | ReadonlyArray<string>;

interface PatternShape<T extends LokiPatternType = string> {
  compile(): (log: string) => [] | [log: LokiLiteralPattern<T>];
  executeOnLogs(logs: Array<string>): LokiLiteralPattern<T>[];
}
```

# LogQL

Individual LogQL parts (used in the parent class). You can also use them individually for separate needs.

```
{env="staging"} |= "req-xxx" | pattern `ok: <ok>` | ok = "true" | unpack
^^^             ^^^          ^^^                  ^^^           ^^^
StreamSelector  LineFilters  ParserExpression     LabelFilters  ParserExpression
```

- [StreamSelector](./StreamSelector.md)
- [LineFilters](./LineFilters.md)
- [LabelFilters](./LabelFilters.md)
- [ParserExpression](./ParserExpression.md)

## API

### constructor

Initializes a new instance of the `LogQL` class.

Available `init` types are:
- `string` - Create an instance of `LogQL` with a **lineContains** (`lineFilter`) operator.
- `string[]` - Create an instance of `LogQL` with multiple **lineContains** (`lineFilter`) operators.
- `StreamSelector` - Create an instance of `LogQL` based on a `StreamSelector` subclass.
- `LineFilters` - Create an instance of `LogQL` based on a `LineFilters` subclass.
- `StreamSelector` - Create an instance of `LogQL` based on a `LabelFilters` subclass.
- `ParserExpression` - Create an instance of `LogQL` based on a `ParserExpression` subclass.

---

Properties of the class are:
- `streamSelector` - see [StreamSelector](./StreamSelector.md)
- `lineFilters` - see [LineFilters](./LineFilters.md)
- `labelFilters` - see [LabelFilters](./LabelFilters.md)
- `parserExpression` - see [ParserExpression](./ParserExpression.md)

### lineEq(value: string): LogQL

Add a **lineContains** (`|=`) line filter.

### lineNotEq(value: string): LogQL

Add a **lineDoesNotContain** (`!=`) line filter.

### lineRegEq(value: string): LogQL

Add a **lineContainsRegexMatch** (`|~`)

### lineRegNotEq(value: string): LogQL

Add a **lineDoesNotContainRegexMatch** (`!~`) line filter.

### toString(): string

Converts the LogQL instance into a LogQL query string.
Returns a string representing the LogQL query.

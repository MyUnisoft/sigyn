# Templates

## Config

There is 2 sorts of templates you can configure with Sigyn:
1. Root templates, theses templates are useful to be used or referenced by notifications templates.
2. Notifications templates, theses concernes [rules](./rules.md), [composite rules](./composite-rules.md) & [self monitoring](./self-monitoring.md).

Both can be setting up with an object as following:

| Property | Type | Required | Description |
|---|---|---|---|
| `extends` | `string` | ❌ | The template to extends from. |
| `title` | `string`   | ❌ | The title of the notification template. |
| `content` | `string[]` or `object` | ❌ | The content of the notification template. It can be an object when extending another template (using `extends`) |
| `content.before` | `string[]` | ❌ | The content of the notification template to add **after** the extended template's content |
| `content.after` | `string[]` | ❌ | The content of the notification template to add **before** the extended template's content |
| `content.at.index` | `number` | ❌ | The index indicating where the new content should be added. Negative index works i.e. `-1` mean "before the last line" |
| `content.at.value` | `string` | ❌ | The specific content line to be included at the provided index. |

> [!IMPORTANT]
> Either one of `title` or `content` is **required**.
 
> [!NOTE]
> Extending templates can be nested: a **root template** can be extended from another **root template**.

> [!NOTE]
> When extending another template, `title` & `content` will simply replace the base template property. (except `content` if an object is provided which allow to update the extended template `content`)

## Variables

You can use any of theses variables (both for `title` & `content`), surrounding with `{}` (see example below):
- `ruleName`
- `logql`
- `count` (count of logs retrievied within the interval)
- `counter`
- `threshold` (`alert.on.count`)
- `interval`
- `lokiUrl` 

> [!NOTE]
> You can use hyperlink with Markdown i.e. `[See logs]({lokiUrl})`.

For self-monitoring, you can use theses variables, surrounding with `{}`:
- `agentFailure.errors` which is equal to the joined error messages
- `agentFailure.rules` which is equal to the joined failed rules

For composite rules, you can use theses variables, surrounding with `{}`:
- `compositeRuleName`
- `label` which includes each combined labels from all rules
- `rules` joined rules names

You can also use a label variable from your LogQL using `{label.x}`:
```json
{
  ...
  "logql": "{app=\"foo\", env=\"preprod\"} |= `my super logql`",
  "template": {
    "content": [
      "app: {label.app} | env: {label.env}"
    ]
  }
  ...
}
```

You can also use any variable extracted from `stream` vector.

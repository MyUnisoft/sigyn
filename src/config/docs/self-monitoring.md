# Self Monitoring

Self monitoring allow to trigger an alert when something wrong happened. It can be your Loki instance down, a rule with a bad **LogQL**, etc

- [Example Configuration](#example-configuration)
- [Schema Properties](#schema-properties)
  - [`template`](#notifiers) (See [Templates](./templates.md))
  - [`notifiers`](#notifiers)
  - [`errorFilters`](#errorfilters)
  - [`ruleFilters`](#rulefilters)
  - [`minimumErrorCount`](#minimumerrorcount)
  - [`throttle`](#throttle) (See [Throttle](./templates.md))

## Example configuration

```json
{
  "selfMonitoring": {
    "notifiers": ["discord"],
    "template": {
      "title": "Bad Gateway",
      "content": [
        "Loki is down!"
      ]
    },
    "errorFilters": ["Bad Gateway"]
  }
}
```

## Schema Properties

### `template`

See [templates](./templates.md)

> [!NOTE]
> `template` property is **required**

> [!WARNING]
> Self-monitoring templates can be a root template reference, however the available variables are differents.

### `notifiers`

Defines the notifiers to send alerts on.

| Type      | Required | Default                        |
|-----------|----------|--------------------------------|
| `string[]` | ❌      | All root configured notifiers |

### `errorFilters`

The `errorFilters` allow to filter errors.  
Each item can be either a strict-equal match value or a RegExp.

| Type      | Required |
|-----------|----------|
| `string[]` | ❌      |

For instance, if you don't want to be notified by malformed **LogQL** queries (**Bad Request** errors) then you can filter it:

```json
{
  "errorFilters": [
    "Bad Request"
  ]
}
```

### `ruleFilters`

The `ruleFilters` property allow the rules to be filtered **by their name**. Can be useful for instance if you have a rule with a very high count of logs that may throw a timeout.

| Type      | Required |
|-----------|----------|
| `string[]` | ❌      |

### `minimumErrorCount`

The minimum count of error before triggering an alert.

| Type     | Required | Default |
|----------|----------| --------|
| `number` | ❌      | `0`       |

### `throttle`

See [Throttle](./throttle.md)


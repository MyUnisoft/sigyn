# Rules

Rules represents the main field of the Sigyn configuration. Theses allow to detailing when alerts should trigger based on specified conditions.

Rules takes an array of object in the `rules` root config field.

> [!NOTE]
> There are 2 sorts of rules: **basic** and **label based**.  
> - **basic** rule: both `count` and `interval` are **required**, other properties **must** be omitted.  
> - **label based** rule: `label`, `value` **or** `valueMatch` are **required** plus at least one of `minimumLabelCount` or `interval` which defines the minimum logs to be fetched to have a revelant alert when `percentThreshold` is set, or `count` which works the same as basic alerting.  
> `minimumLabelCount` and/or `interval` are optional when rule is based on `count` label.  
> You cannot use both `value` and `valueMatch`

## Summary

- [Example Configuration](#example-configuration)
- [Schema Properties](#schema-properties)
  - [`name`](#name)
  - [`logql`](#logql)
  - [`polling`](#polling)
  - [`pollingStrategy`](#pollingstrategy)
  - [`disabled`](#disabled)
  - [`notifiers`](#notifiers)
  - [`labelFilters`](#labelfilters)
  - [`alert`](#alert)
    - [`alert.on`](#alert-on)
      - [`alert.on.count`](#alert-on-count)
      - [`alert.on.interval`](#alert-on-interval)
      - [`alert.on.label`](#alert-on-label)
      - [`alert.on.value`](#alert-on-value)
      - [`alert.on.valueMatch`](#alert-on-valuematch)
      - [`alert.on.percentThreshold`](#alert-on-percentthreshold)
    - [`alert.template`](#alert-template) (See [Templates](./templates.md))
    - [`alert.severity`](#alert-severity)
    - [`alert.throttle`](#alert-throttle) (See [Throttle](./throttle.md))

## Example configuration

```json
{
  "rules": [
    {
      "name": "Foo",
      "logql": "{app=\"foo\", env=\"preprod\"} |= `Error`",
      "polling": [
        "*/10 * 0-15 * * *",
        "*/30 * 16-23 * * *"
      ],
      "alert": {
        "on": {
          "count": "10",
          "interval": "5m"
        },
        "template": {
          "title": "{ruleName} - Triggered {counter} times!",
          "content": [
            "- LogQL: {logql}",
            "- Threshold: {count}",
            "- Interval: {interval}",
            "- [See logs on Grafana]({lokiUrl})"
          ]
        }
      }
    },
    {
      "name": "My rule on env: {label.env}",
      "logql": "{app=\"foo\", env={label.env}} |= `your awesome logql`",
      "polling": "30s",
      "labelFilters": {
        "env": ["prod", "preprod"]
      },
      "alert": {
        "on": {
          "count": "< 10",
          "interval": "5m"
        },
        "template": "onlyTitle"
      }
    },
    {
      "name": "A rule based on label matching",
      "logql": "{app=\"foo\"} |~ `state: (ok|ko)` | regexp `state: (?P<state>ok|ko)`",
      "alert": {
        "on": {
          "label": "state",
          "value": "ko",
          "percentThreshold": 80,
          "interval": "5d"
        },
        "template": {
          "title": "Too much KO"
        }
      }
    }
  ],
  ...
}
```

## Schema Properties

### `name`

The name of the rule. Must be unique between each rule.

| Type                   | Required |
|------------------------|----------|
| `string`               | ✔️       |

You can use labels from `labelFilters` (see below), **example**:

```json
{
  "name": "[Foo] Error - {label.env}",
  "labelFilters": {
    "env": ["production", "preprod"]
  },
  ...
},
```

> [!NOTE]
> When a rule use `labelFilters`, since rule name must be unique, Sigyn will update the name automatically if you don't use each label filters in the name like in the above example.

### `logql`

The LogQL query associated with the rule.

| Type                   | Required |
|------------------------|----------|
| `string` or `object`   | ✔️       |

You can use labels from `labelFilters` (see below), **example**:

```json
{
  "logql": "{app=\"foo\", env={label.env}} |= `Error`",
  "labelFilters": {
    "env": ["production", "preprod"]
  },
  ...
},
```

The object syntax can be useful with variables, **example**:

```json
{
  "logql": {
    "query": "{app=\"foo\"} |~ `connect ({vars.tcpErrors})`",
    "vars": {
      "tcpErrors": [
        "ECONNREFUSED",
        "ECONNRESET",
        "ECONNABORTED",
        "EHOSTUNREACH",
        "ETIMEDOUT"
      ]
    }
  },
  ...
},
```

The **LogQL** query will become ``{app=\"foo\"} |~ `connect (ECONNREFUSED|ECONNRESET|ECONNABORTED|EHOSTUNREACH|ETIMEDOUT)` `` upon initialization.

### `polling`

The polling interval for the rule. You can use a `duration` i.e. `2m` or a **Cron expression**.  
If given an array of polling, it should only be **Cron expressions**, this is useful if you want a different polling the day and the night.  

| Type                   | Required | Default |
|------------------------|----------|---------|
| `string` or `string[]` | ❌       | `1m`    |

**Examples**
```json
{
  "polling": "1h",
  ...
}
```

With this polling, Sigyn will fetch logs every hours.
```json
{
  "polling": [
    "* 8-20 * * 1-5",
    "*/10 21-7 * * 1-5"
  ],
  ...
}
```
With this config, Sigyn will fetch logs Monday through Friday, every minutes from 8:00 am to 8:59 pm and every 10 minutes from 9 pm to 7:59 am.

### `pollingStrategy`

The `pollingStrategy` defines how Sigyn fetch logs on the polling range resumption.

Given this `polling`: `* 7-20 * * *`, at 7:00 am it will fetch logs since 8:59 pm (last day) when strategy is `unbounded`.  
You can use `bounded` strategy to make Sigyn skip the first poll so the first poll and starts at 7:01.

| Type                     | Required | Default     |
|--------------------------|----------|-------------|
| `bounded` or `unbounded` | ❌       | `unbounded` |

**Example**
```json
{
  "polling": "* 7-20 * * *",
  "pollingStrategy": "bounded",
  ...
}
```

### `disabled`

Weither the rule should be disabled. When a rule is disabled, Sigyn simply ignore it.

| Type      | Required | Default     |
|-----------|----------|-------------|
| `boolean` | ❌       | `false`    |

### `notifiers`

Defines the notifiers to send alerts on.

| Type      | Required | Default                        |
|-----------|----------|--------------------------------|
| `string[]` | ❌      | All root configured notifiers |

**Examples**
```json
{
  ...,
  "notifiers": {
    "slack": {
      "notifier": "slack",
      "webhookUrl": "https://hooks.slack.com/services/aaa/bbb"
    },
    "discord": {
      "notifier": "discord",
      "webhookUrl": "https://discord.com/api/webhooks/aaa/bbb"
    }
  },
  "rules": [
    {
      "name": "Send alerts to Slack notifier only",
      "notifiers": ["slack"],
      ...
    },
    {
      "name": "notifiers are skipped: send alerts to both Slack & Discord",
      ...
    }
  ],
  ...
}
```

### `labelFilters`

The `labelFilters` field allow you to duplicate a rule for multiple labels (i.e envs, services...).  
It works in pair with `logql` field where you can set the wanted labels.

| Type      | Required | Default     |
|-----------|----------|-------------|
| `object`  | ❌       | `false`     |

Where all items are defined as:

| Property       | Type       | Required |
|----------------|------------|----------|
| `[key:string]` | `string[]` | ✔️       |

**Examples**

```json
{
  "logql": "{app=\"foo\", env={label.env}} |= `Error`",
  "labelFilters": {
    "env": ["production", "preprod"]
  },
}
```

Upon initialization, Sigyn will create 2 distinct rules, with theses queries:
- ``{app=\"foo\", env=\"production\"} |= `Error` `` (the first `production` label filter)
- ``{app=\"foo\", env=\"preprod\"} |= `Error` `` (the second `preprod` label filter)

### `alert`

The `alert` field allow to configure alerting behaviors via multiple rule definitions.

### `alert.on`

An object specifying when the alert should trigger.

| Type       | Required |
|------------|----------|
| `object`   | ✔️       |

### `alert.on.count`

The count threshold of logs (or labels when rule is based on labels) to triggers an alert.  
You can use a range string i.e `<=50`, `>6`.

For **label based** rule, this property **must** be a valid number i.e `900` or `"900"`.

| Type                 | Required |
|----------------------|----------|
| `number` or `string` | ✔️       |

### `alert.on.interval`

The interval range to compare fetched rules. When count represents a minimum of logs then Sigyn make sure the interval has been reached.

For instance, given this config:
```json
{
  "polling": "1m",
  "alert": {
    "on": {
      "interval": "1h",
      "count": 100
    }
  }
}
```

If it Sigyn retrieve 20 logs per poll, then after the 5th poll (5 minutes) it will trigger the alert because the interval doesn't need to be fully completed.

If `count` is `0` or `<= 20`, now Sigyn will count each retrievied logs only after one hour. This allow you to create alerts based on a minimum count of logs for a given interval.
We can imagine an authentication service: if there is zero connexion in a 1 hour interval, then probably there is a problem somewhere (this use case works nice with CRON polling where you might not be interested to monitor logs the night).

### `alert.on.label`

The `label` field allow to make the rule based on a given label.  
Imagine this **LogQL** query: ``{app=\"foo\"} |~ `statusCode: [0-9]+` | regexp `((?P<responseTime>\\d+\\.\\d+)ms)` ``. The label `responseTime` will be added to all retrieved logs. Then, you can make alert rule based on `responseTime`.

| Type     | Required |
|----------------------|
| `string` | ✔️       |

### `alert.on.value`

> [!IMPORTANT]
> For label based rule only.

The `value` field specify the value for which the label should match. Can be either a `string` or a `range` i.e. `> 500`.  
Based on the previous example query: ``{app=\"foo\"} |~ `statusCode: [0-9]+` | regexp `((?P<responseTime>\\d+\\.\\d+)ms)` ``, we can trigger an alert when a response time is above 1s:

```json
{
  "label": "responseTime",
  "value": "> 1000"
}
```

### `alert.on.valueMatch`

> [!IMPORTANT]
> For label based rule only.

The `valueMatch` field is similar to the `value` field but it accept RegExp.  
Based on the previous example query: ``{app=\"foo\"} |~ `statusCode: [0-9]+` | regexp `((?P<responseTime>\\d+\\.\\d+)ms)` ``, we can trigger an alert when a response time is above 1s:
```json
{
  "label": "responseTime",
  "valueMatch": "[0-9]{4}"
}
```

### `alert.on.percentThreshold`

> [!IMPORTANT]
> For label based rule only.
>
> **Cannot be used in addition of `count`**

The `percentThreshold` field allow to compare the count of label on the given interval that matches the given `value` (or `valueMatch`).   
Let's take this query as example: ``{app=\"sigyn\"} |~ `state: (ok|ko)` | regexp `state: (?P<state>ok|ko)` ``:
```json
{
  "label": "state",
  "value": "ko",
  "percentThreshold": 70
}
```

After each polling for the given interval, Sigyn will compare the ratio of `ko` state with the `ok` ones, if the percentage is at least 70%, then Sigyn will trigger the alert.

### `alert.template`

See [Templates](./templates.md)

### `alert.severity`

The `severity` field is used to by the notifiers, the alert UI changes based on theses severities.

| Type      | Required | Default                              |
|-----------|----------|--------------------------------------|
| `string`  | ❌       | `config.defaultSeverity` or `error` |

**Allowed values:**
- `critical`
- `error` | `major`
- `warning` | `minor`
- `information` | `info` | `low`

> [!NOTE]
> You can specify root property `defaultSeverity` to change the default severity which is `error`.

- `alert.severity` (String or Number, Optional):
  - If not specified, the default value is `config.defaultSeverity`, if not specified the default is Severity 3 (`error`). Theses severities change the alert UI sent by the notifiers.
  **Allowed values:**
  - `critical`
  - `error` | `major`
  - `warning` | `minor`
  - `information` | `info` | `low`

### `alert.throttle`

See [Throttle](./throttle.md)

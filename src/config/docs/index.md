
# ⚙️ Configuration

The **Sigyn** configuration object consists of theses properties: `loki`, `grafana`, `templates`, `rules`, `compositeRules`, `notifiers` and `selfMonitoring`.

### Example configuration

```json
{
  "loki": {
    "apiUrl": "http://localhost:3100"
  },
  "grafana": {
    "apiUrl": "http://localhost:3000"
  },
  "templates": {
    "onlyTitle": {
      "title": "{ruleName} - Triggered {counter} times!"
    }
  },
  "notifiers": {
    "slack": {
      "notifier": "slack",
      "webhookUrl": "https://hooks.slack.com/services/aaa/bbb"
    },
    "discord": {
      "notifier": "discord",
      "webhookUrl": "https://discord.com/api/webhooks/aaa/bbb"
    },
    "teams": {
      "notifier": "teams",
      "webhookUrl": "https://bizoffice9447.webhook.office.com/webhookb2/aaa/bbb"
    }
  },
  "rules": [
    {
      "name": "test1",
      "logql": "{app=\"foo\", env=\"preprod\"} |= `your awesome logql`",
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
  ]
}
```

### Required
The `loki` property defines an object that allows configuring Loki API access.

The `grafana` property defines an object that allows configuring Grafana API access.

The `rules` property defines an array of rule objects, each representing a specific monitoring rule.

The `notifiers` property is an object that allows configuring various notification methods.

### Optional
The `templates` property defines an object that allows to reuse **template** in any rule.

The `extends` property defines an array of the configurations **paths** to extends from.
Theses configurations can have only `rules` and `templates` properties which works the same way as the main configuration.

The `missingLabelStrategy` defines the behavior when **Sigyn** detects an unknown label value. 
- `ignore` Default. Skip the rule creation for the given label.
- `error` Fails config validation (Sigyn agent will not start).

The `defaultSeverity` defines the rule alert severities when not specified. Severity 3 (`error`) by default.<br>
**Allowed values:**
- `critical`
- `error` | `major`
- `warning` | `minor`
- `information` | `info` | `low`

The `selfMonitoring` property defines how/when Sigyn should emit alert for self problem (i.e when Loki API is down)

### Schema Properties

- `loki` (Object, Required):
  - This object specifies the Loki API configuration.

  | Property   | Type       | Required | Description |
  |------------|------------|----------|-------------|
  | `apiUrl`   | `string`   | ✔️       | The Loki API url |
---
- `grafana` (Object, Required):
  - This object specifies the Grafana API configuration.

  | Property   | Type       | Required | Description |
  |------------|------------|----------|-------------|
  | `apiUrl`   | `string`   | ✔️       | The Grafana API url |
---
- `templates` See [templates](./docs/templates.md)
---
- `extends` (String[], Optional):
  - This array specifies the configuration paths to extends from.
  - The paths can be either `foo` or `foo.sigyn.config.json` where the `foo` configuration file **must** be `foo.sigyn.config.json`.
---
- `missingLabelStrategy` (String, Optional):
  - This property defines whether Sigyn should throw if a given label value is not found via Loki API.

  | Value    | Description |
  |----------|-------------|
  | `ignore` | (**Default**) Skip the rule creation for each unknown label |
  | `error`  | Invalidate config and throws when an unknown label is given |
---
- `rules` See [Rules](./docs/rules.md)
---
- `compositeRules` See [Composite Rules](./docs/composite-rules.md)
---
- `selfMonitoring` See [Self Monitoring](./docs/self-monitoring.md)
---
**Notifiers**

**Sigyn** provide its set of notifiers, each one have its own configuration rules.

- `@sigyn/discord` [See docs](../discord/README.md)
- `@sigyn/slack` [See docs](../slack/README.md)
- `@sigyn/teams` [See docs](../teams/README.md)

Theses notifiers can be set without `@sigyn/` scope in the config file.

Each notifier is a key-value object where key represents the notifier name to reuse in rules and `notifier` the only required value property which represents the notifier library.

**Example**
```json
"notifiers": {
  "my-super-notifier": {
    "notifier": "@sigyn/discord",
    "webhookUrl": "https://discord.com/api/webhooks/aaa/bbb"
  },
  "another-discord-notifier": {
    "notifier": "discord",
    "webhookUrl": "https://discord.com/api/webhooks/ccc/ddd"
  }
},
"rules": [
  {
    ...
    "notifiers": ["my-super-notifier"]
  }
]
```

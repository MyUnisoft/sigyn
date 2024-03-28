# Getting Started

Once you have installed the Sigyn agent and setup your environment variables, there is a few more steps to get started.

## Prepare your notification webhook

Before you start using Sigyn, you need to have a notification webhook. This webhook will be used to send notifications to your preferred platform.
Sigyn is compatible with [Slack](https://slack.com), [Discord](https://discord.com), and [Microsoft Teams](https://www.microsoft.com/en/microsoft-teams/group-chat-software).

For instance, if you wanna use Discord, you can follow the steps below:
- Go to you server `Settings`
- `APPS` > `Integrations` > `Webhooks` then choose or create your webhook
- You'll need to copy the webhook url to put it in the config later.
- Install the Discord notifier package using your favorite package manager:
  ::: code-group
  ```sh [npm]
  npm install @sigyn/discord
  ```
  ```sh [pnpm]
  pnpm install @sigyn/discord
  ```
  ```sh [yarn]
  yarn add @sigyn/discord
  ```
  :::

Refers to the [notifiers documentation](/notifiers/usage) for more options.

## Create your first configuration

We'll create the configuration JSON file in a `/config/` directory. This will be useful later because you can `extends` the root config with multiple files.

Let's create `/config/sigyn.config.json` with the following content:

```json
{
  "grafana": {
    "apiUrl": "http://localhost:3000",
  },
  "loki": {
    "apiUrl": "http://localhost:3100",
  },
  "notifiers": {
    "discord": {
      "notifier": "discord",
      "webhookUrl": "https://discord.com/api/webhooks/AAA/BBB"
    },
  },
  "rules": [
    {
      "name": "My Awesome rule",
      "logql": "{app=\"foo\", env=\"preprod\"} |= `my awesome query`",
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
  ]
}
```

- `grafana.apiUrl` is the Grafana API URL, usually `localhost:3000` locally.
- `loki.apiUrl` is the Loki API URL, usually `localhost:3100` locally.
- `notifiers` is an object with the notifiers you want to use. In this case, we are using Discord.
  - Don't forget to replace the `webhookUrl` with your own.
  - the `discord` key (`notifiers.discord`) is the notifier name, it's used to link the rule to the notifier. The `"notifier": "discord"` refers the notifier package.
    This allow to have multiple notifiers of the same type.
    > [!NOTE]
    > `"notifier": "discord"` is a `"notifier": "@sigyn/discord"` shortcut.
    > When using Sigyn notifiers, the `@sigyn/` prefix is optional.

- `rules` is an array of rules representing the core of Sigyn configuration.
  - `name` is the rule name.
  - `logql` is the LogQL query you want to fetch logs with.
  - `alert` is the alert configuration.
    - `on` is the condition to trigger the alert.
      - `count` is the number of logs to trigger the alert.
      - `interval` is the interval to count the logs.
    - `template` is the alert template to send to the notifier.
      - `{ruleName}` will be replaced by the rule name.
      - `{counter}` will be replaced by the number of logs.
      - `{logql}` will be replaced by the LogQL query.
      - `{count}` will be replaced by the count threshold.
      - `{interval}` will be replaced by the interval.
      - `{lokiUrl}` will be replaced by the Loki URL.
      - > [!NOTE]
        > Sigyn notifiers will formats theses values, for instance {logql} will be formatted as a code block.

> [!TIP]
> There are much more options available in the configuration, please see the [config documentation](/config/) for more details.

## Here wo go!

Now that you have your configuration ready, you can create the main file to start Sigyn.

`/index.js`
```js
// Import Node.js Dependencies
import path from "node:path";

// Import Third-party Dependencies
import { start } from "@sigyn/agent";

start(path.join(process.cwd(), "config"));
```

You can now run your script with Node.js and see the magic happening!

```sh
node index.js
```

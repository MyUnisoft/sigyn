# Usage

> [!IMPORTANT]
> Each notifier **must** export a `execute` function. This function is dynamically
> imported by Sigyn to send the alert. The function takes a single object argument with
> the configured options (in the config), the template (initialized from config) and the data to be templated (provided by the Agent).

## Webhook

Create a class that extends from `WebhookNotifier` to build a Webhook notifier.

```ts
import { ExecuteWebhookOptions, WebhookNotifier } from "@sigyn/notifiers";

class MyAwesomeWebhookNotifier extends WebhookNotifier {
  async formatWebhook(): Promise<any> {
    const title = await this.formatTitle();
    const content = await this.formatContent();

    return {
      title,
      content.join("\n")
    }
  }
}

export function execute(options: ExecuteWebhookOptions) {
  const notifier = new MyAwesomeWebhookNotifier(options);

  return notifier.execute();
}
```

The only required method to implement is `formatWebhook()`.
This method return the Webhook body.
```ts
async execute() {
  const body = await this.formatWebhook();

  return httpie.post<string>(this.webhookUrl, {
    body,
    headers: this.#headers
  });
}
```
You can use `formatTitle()` & `formatContent()` to get title & content formatted with template data. Theses functions uses `@sigyn/morphix` and you can customise the options of boths:

```ts
class MyAwesomeWebhookNotifier extends WebhookNotifier {
  contentTemplateOptions() {
    return {
      transform: ({ value }) => (value === undefined ? "unknown" : value),
      ignoreMissing: true
    }
  }

  titleTemplateOptions() {
    return {
      transform: ({ value }) => (value === undefined ? "unknown" : value),
      ignoreMissing: true
    }
  }

  async formatWebhook(): Promise<any> {
    const title = await this.formatTitle();
    const content = await this.formatContent();

    return {
      title,
      content.join("\n")
    }
  }
}
```

> [!NOTE]
> The `contentTemplateOptions` & `titleTemplateOptions` above are the default values.

By default, `showSeverityEmoji` is truthy: this option add an emoji before the title depending the alert **severity**.
```ts
const kSeverityEmoji = {
  critical: "💥",
  error: "❗️",
  warning: "⚠️",
  info: "📢"
};
```
You can do `this.showSeverityEmoji = false` to disable this behavior.
```ts
async formatWebhook(): Promise<any> {
  this.showSeverityEmoji = false;

  const title = await this.formatTitle();
  const content = await this.formatContent();

  return {
    title,
    content.join("\n")
  }
}
```
You can also disable it in the constructor
```ts
class MyAwesomeWebhookNotifier extends WebhookNotifier {
  // directly set the property to false
  showSeverityEmoji = false;

  constructor(options: ExecuteWebhookOptions) {
    super(options);
    // or
    this.showSeverityEmoji = false;
  }
}
```

You can see implementation examples with our notifiers:
- [`@sigyn/discord`](https://github.com/MyUnisoft/sigyn/blob/main/src/discord/src/index.ts)
- [`@sigyn/slack`](https://github.com/MyUnisoft/sigyn/blob/main/src/slack/src/index.ts)
- [`@sigyn/teams`](https://github.com/MyUnisoft/sigyn/blob/main/src/teams/src/index.ts)

## Interfaces

```ts
interface ExecuteWebhookOptions {
    webhookUrl: string;
    data: ExecuteWebhookData;
    template: SigynInitializedTemplate;
}
interface ExecuteWebhookData {
    ruleConfig?: NotifierFormattedSigynRule;
    counter?: number;
    severity: "critical" | "error" | "warning" | "info";
    label?: Record<string, string>;
    lokiUrl?: string;
    agentFailure?: {
        errors: string;
        rules: string;
    };
    rules?: string;
}
```

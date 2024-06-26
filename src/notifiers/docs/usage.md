# Usage

> [!IMPORTANT]
> Each notifier **must** export a `execute` function. This function is dynamically
> imported by Sigyn to send the alert. The function takes a single object argument with
> the configured options (in the config), the template (initialized from config) and the data to be templated (provided by the Agent).

## Webhook

Create a class that extends from `WebhookNotifier<T>` to build a Webhook notifier.

```ts
import { WebhookNotifierOptions, WebhookNotifier } from "@sigyn/notifiers";

interface MyAwesomeFormat {
  title: string,
  content: string
}

class MyAwesomeWebhookNotifier extends WebhookNotifier<MyAwesomeFormat> {
  async formatWebhookBody(): Promise<MyAwesomeFormat> {
    const [title, content] = await Promise.all([
      this.formatTitle(),
      this.formatContent()
    ]);

    return {
      title,
      content: content.join("\n")
    }
  }
}

export function execute(
  options: WebhookNotifierOptions
) {
  const notifier = new MyAwesomeWebhookNotifier(options);
  const body = await notifier.formatWebhookBody();

  return notifier.execute(
    body
  );
}
```

You can use `formatTitle()` & `formatContent()` to get title & content formatted with template data. Theses functions uses `@sigyn/morphix` and you can customise the options of boths:

```ts
import { MorphixOptions } from "@sigyn/morphix";

const kCustomTemplateOptions: MorphixOptions = {
  transform: ({ value }) => (value === undefined ? "unknown" : value),
  ignoreMissing: true
};

class MyAwesomeWebhookNotifier extends WebhookNotifier<MyAwesomeFormat> {
  contentTemplateOptions() {
    return kCustomTemplateOptions;
  }

  titleTemplateOptions() {
    return kCustomTemplateOptions;
  }
}
```

> [!NOTE]
> The `contentTemplateOptions` & `titleTemplateOptions` above are the default values.

---

By default, `showSeverityEmoji` is truthy: this option add an emoji before the title depending the alert **severity**.

```ts
const kSeverityEmoji = {
  critical: "💥",
  error: "❗️",
  warning: "⚠️",
  info: "📢"
};
```

But you can disable it by providing the constructor options `showSeverityEmoji` to false.

```ts
class MyAwesomeWebhookNotifier extends WebhookNotifier<MyAwesomeFormat> {
  constructor(
    options: WebhookNotifierOptions
  ) {
    super({ ...options, showSeverityEmoji: false });
  }
}
```

You can see implementation examples with our notifiers:
- [`@sigyn/discord`](https://github.com/MyUnisoft/sigyn/blob/main/src/discord/src/index.ts)
- [`@sigyn/slack`](https://github.com/MyUnisoft/sigyn/blob/main/src/slack/src/index.ts)
- [`@sigyn/teams`](https://github.com/MyUnisoft/sigyn/blob/main/src/teams/src/index.ts)

## Interfaces

```ts
export interface WebhookNotifierOptions {
  webhookUrl: string;
  data: WebhookData;s
  template: SigynInitializedTemplate;
  /**
   * @default true
   */
  showSeverityEmoji?: boolean;
}

export interface WebhookData {
  ruleConfig?: NotifierFormattedSigynRule;
  counter?: number;
  severity: "critical" | "error" | "warning" | "info";
  label?: Record<string, string>;
  lokiUrl?: string;
  agentFailure?: {
    errors: string;
    rules: string;
  }
  rules?: string;
  labelCount: number;
  labelMatchCount: number;
  labelMatchPercent?: number;
}
```

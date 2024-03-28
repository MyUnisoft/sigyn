# Usage

Add the Teams notifier to your Sigyn config:

```json
{
  "notifiers": {
    "my-notifier": {
      "notifier": "teams",
      "webhookUrl": "https://biz.webhook.office.com/webhook2/xxx/yyy"
    },
    ...
  },
  "rules": [
    ...
  ]
}
```

> [!IMPORTANT]
> Unlike other notifiers, **Teams** require both a `title` and a `content` otherwise it will fail with a 400.

**Webhook URL**

You can follow [this guide](https://learn.microsoft.com/en-us/microsoftteams/platform/webhooks-and-connectors/how-to/add-incoming-webhook?tabs=dotnet#create-incoming-webhooks-1s) for guidance on how to create a Teams webhook.

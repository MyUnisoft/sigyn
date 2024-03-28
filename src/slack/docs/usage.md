# Usage

Add the Discord notifier to your Sigyn config:

```json
{
  "notifiers": {
    "my-notifier": {
      "notifier": "slack",
      "webhookUrl": "https://hooks.slack.com/services/aaa/bbb"
    },
    ...
  },
  "rules": [
    ...
  ]
}
```

**Webhook URL**

You can follow [this guide](https://api.slack.com/messaging/webhooks) for guidance on how to create a Slack webhook.

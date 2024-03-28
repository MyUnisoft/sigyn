# Usage

Add the Discord notifier to your Sigyn config:

```json
{
  "notifiers": {
    "my-notifier": {
      "notifier": "discord",
      "webhookUrl": "https://discord.com/api/webhooks/xxx/yyy"
    },
    ...
  },
  "rules": [
    ...
  ]
}
```

**Webhook URL**

Using Discord webhooks is very simple: go to you server settings, **APPS** > **Integrations** > **Webhooks** then choose or create your webhook and click **Copy Webhook URL** button 🎉

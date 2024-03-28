# JSON schema

You can easily enjoy autocompletion & documentation from JSON schema for your `sigyn.config.json` on Visual Studio Code.

1. Go in settings. <kbd>Ctrl</kbd> + <kbd>Shift</kbd> + <kbd>P</kbd> -> **Preferences: Open User Settings (JSON)**
2. Add the JSON Schemas:
```json
"json.schemas": [
  {
    "fileMatch": ["*.sigyn.config.json"],
    "url":  "https://raw.githubusercontent.com/MyUnisoft/sigyn/main/src/config/src/schemas/extendedConfigSchema.json"
  },
  {
    "fileMatch": ["sigyn.config.json"],
    "url":  "https://raw.githubusercontent.com/MyUnisoft/sigyn/main/src/config/src/schemas/configSchema.json"
  }
]
```

> [!NOTE]
> The `*.sigyn.config.json` is for the extended configurations

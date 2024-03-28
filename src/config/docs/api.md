# 🌐 API

## `initConfig(path: string | URL): Promise<SigynConfig>`

Initialize **Sigyn** config given the path to the JSON config file.

## `getConfig(): SigynConfig`

Returns the previously initialized **Sigyn** config.

> [!NOTE]
> If you try to get config while the config has not been initialied, it will throws.

## `validateConfig(config: PartialSigynConfig): void`

Validate Sigyn configuration against an internal AJV Schema.

## `validateExtendedConfig(config: ExtendedSigynConfig): void`

Validate Sigyn extended configuration against an internal AJV Schema.


# Installation instructions

## Requirements

- [Node.js](https://nodejs.org/en/) version 18 or higher.

## Install locally

You can locally install this package using your favorite package manager.

::: code-group
```sh [npm]
npm install @sigyn/agent
```
```sh [pnpm]
pnpm install @sigyn/agent
```
```sh [yarn]
yarn add @sigyn/agent
```
:::

## Add environment variables

```bash
$ touch .env
```

Add these variables:

:::code-group
```ini [Required]
GRAFANA_API_TOKEN=your_token
```
```ini [Optional]
# Default to sigyn.sqlite3
SIGYN_DB=your_db
```

> [!NOTE]
> The `SIGYN_DB` simply represents the **SQLite database** file to be created. You don't need to create the file yourself.

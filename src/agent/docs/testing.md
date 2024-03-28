# Testing

It can be useful to make sure your config is valid before running the agent.

Follow these steps to test your configuration:
- Install `@sigyn/config`, `@myunisoft/httpie` & `dotenv` using your favorite package manager:
  ::: code-group
  ```sh [npm]
  npm install -D @sigyn/config @myunisoft/httpie dotenv
  ```
  ```sh [pnpm]
  pnpm install -D @sigyn/config @myunisoft/httpie dotenv
  ```
  ```sh [yarn]
  yarn add -D @sigyn/config @myunisoft/httpie dotenv
  ```
  :::
- Create a new file in a `/test/` folder. `/test/config.spec.js` for instance.
- Add this code:
  ```js
  // Import Node.js Dependencies
  import assert from "node:assert";
  import { describe, before, after, test } from "node:test";
  import path from "node:path";

  // Import Third-party Dependencies
  import { initConfig } from "@sigyn/config";
  import {
    MockAgent,
    getGlobalDispatcher,
    setGlobalDispatcher 
  } from "@myunisoft/httpie";

  // CONSTANTS
  const kLokiFixtureApiUrl = "http://localhost:3100";
  const kMockAgent = new MockAgent();
  const kGlobalDispatcher = getGlobalDispatcher();
  const kConfigPath = path.join(process.cwd(), "config", "sigyn.config.json");

  describe("Config", () => {
    before(() => {
      process.env.GRAFANA_API_TOKEN = "foo";
      setGlobalDispatcher(kMockAgent);

      const pool = kMockAgent.get(kLokiFixtureApiUrl);
      pool.intercept({
        path: () => true
      }).reply(200);
    });

    after(() => {
      setGlobalDispatcher(kGlobalDispatcher);
    });

    test("Config should be valid", async() => {
      await assert.doesNotReject(async() => await initConfig(kConfigPath));
    })
  })

  ```
- Uses this commmand: `node -r dotenv/config --test test/config.spec.js`

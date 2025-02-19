// Import Node.js Dependencies
import assert from "node:assert";
import fs from "node:fs";
import path from "node:path";
import url from "node:url";
import { before, beforeEach, after, describe, it } from "node:test";
import { setTimeout } from "node:timers/promises";

// Import Third-party Dependencies
import { MockAgent, getGlobalDispatcher, setGlobalDispatcher } from "@myunisoft/httpie";
import { SigynInitializedConfig, initConfig } from "@sigyn/config";
import isCI from "is-ci";

// Import Internal Dependencies
import { getDB, initDB } from "../../src/database.js";
import { createRuleAlert, MockLogger, resetRuteMuteUntil, ruleMuteUntilTimestamp } from "./helpers.js";
import { handleCompositeRules } from "../../src/compositeRules.js";
import { Rule } from "../../src/rules.js";

// CONSTANTS
const __dirname = path.dirname(url.fileURLToPath(import.meta.url));
const kCompositeRulesConfigLocation = path.join(__dirname, "/fixtures/composite-rules/sigyn.config.json");
const kLogger = new MockLogger();
const kMockAgent = new MockAgent();
const kGlobalDispatcher = getGlobalDispatcher();
// time to wait for the task to be fully executed (alert sent)
const kTimeout = isCI ? 350 : 200;

describe("Composite Rules", { concurrency: 1 }, () => {
  let config: SigynInitializedConfig;
  let rules: any;

  before(async() => {
    fs.mkdirSync(".temp", { recursive: true });

    initDB(kLogger, { databaseFilename: ".temp/test.sqlite3" });

    process.env.GRAFANA_API_TOKEN = "toto";
    setGlobalDispatcher(kMockAgent);

    const pool = kMockAgent.get("https://discord.com");
    pool.intercept({
      method: "POST",
      path: () => true
    }).reply(200);

    initDB(kLogger, { databaseFilename: ".temp/test-agent.sqlite3" });

    config = await initConfig(kCompositeRulesConfigLocation);
    rules = config.rules.map((ruleConfig) => {
      const rule = new Rule(ruleConfig, { logger: kLogger });
      rule.init();

      return rule;
    });
  });

  beforeEach(() => {
    getDB().prepare("DELETE FROM alerts").run();
  });

  after(() => {
    setGlobalDispatcher(kGlobalDispatcher);
  });

  it("should not trigger an alert because notif count is 0 while it require 6", async() => {
    getDB().prepare("DELETE FROM compositeRuleAlerts").run();
    handleCompositeRules(kLogger);

    await setTimeout(kTimeout);

    assert.throws(() => kMockAgent.assertNoPendingInterceptors());
  });

  it("should not trigger an alert because ruleCountThreshold is 1 and it require 2", async() => {
    getDB().prepare("DELETE FROM compositeRuleAlerts").run();
    createRuleAlert(rules[0], 6);

    handleCompositeRules(kLogger);
    await setTimeout(kTimeout);

    assert.throws(() => kMockAgent.assertNoPendingInterceptors());
  });

  it("should trigger an alert because notif count is 6 and it require 6", async() => {
    getDB().prepare("DELETE FROM compositeRuleAlerts").run();
    createRuleAlert(rules[0], 2);
    createRuleAlert(rules[1], 2);
    createRuleAlert(rules[2], 2);

    handleCompositeRules(kLogger);
    await setTimeout(kTimeout);

    assert.doesNotThrow(() => kMockAgent.assertNoPendingInterceptors());
  });

  it("should have throttle", async() => {
    const pool = kMockAgent.get("https://discord.com");
    pool.intercept({
      method: "POST",
      path: () => true
    }).reply(200);
    getDB().prepare("DELETE FROM compositeRuleAlerts").run();
    createRuleAlert(rules[0], 2);
    createRuleAlert(rules[1], 2);
    createRuleAlert(rules[2], 2);

    handleCompositeRules(kLogger);
    await setTimeout(kTimeout);

    assert.doesNotThrow(() => kMockAgent.assertNoPendingInterceptors());

    pool.intercept({
      method: "POST",
      path: () => true
    }).reply(200);

    createRuleAlert(rules[0], 2);
    createRuleAlert(rules[1], 2);
    createRuleAlert(rules[2], 2);

    handleCompositeRules(kLogger);

    await setTimeout(kTimeout);

    assert.throws(() => kMockAgent.assertNoPendingInterceptors(), {
      name: "UndiciError",
      message: /1 interceptor is pending:/
    });

    createRuleAlert(rules[0], 2);
    createRuleAlert(rules[1], 2);
    createRuleAlert(rules[2], 2);

    handleCompositeRules(kLogger);
    await setTimeout(kTimeout);
    assert.throws(() => kMockAgent.assertNoPendingInterceptors(), {
      name: "UndiciError",
      message: /1 interceptor is pending:/
    });

    createRuleAlert(rules[0], 2);
    createRuleAlert(rules[1], 2);
    createRuleAlert(rules[2], 2);

    handleCompositeRules(kLogger);
    await setTimeout(kTimeout);

    // We have throttle.count set to 3 so this alert should be sent
    assert.doesNotThrow(() => kMockAgent.assertNoPendingInterceptors());
  });

  it("should mute rules", async() => {
    resetRuteMuteUntil(rules[0]);
    resetRuteMuteUntil(rules[1]);
    resetRuteMuteUntil(rules[2]);

    getDB().prepare("DELETE FROM compositeRuleAlerts").run();

    assert.equal(ruleMuteUntilTimestamp(rules[0]), 0);
    assert.equal(ruleMuteUntilTimestamp(rules[1]), 0);
    assert.equal(ruleMuteUntilTimestamp(rules[2]), 0);

    createRuleAlert(rules[0], 4);
    createRuleAlert(rules[1], 4);

    handleCompositeRules(kLogger);
    await setTimeout(kTimeout);

    assert.ok(ruleMuteUntilTimestamp(rules[0]) > Date.now());
    assert.ok(ruleMuteUntilTimestamp(rules[1]) > Date.now());
    assert.ok(ruleMuteUntilTimestamp(rules[2]) > Date.now());
  });
});

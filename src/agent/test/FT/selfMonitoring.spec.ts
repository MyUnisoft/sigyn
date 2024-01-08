// Import Node.js Dependencies
import assert from "node:assert";
import path from "node:path";
import { afterEach, before, beforeEach, describe, it } from "node:test";
import { setTimeout } from "node:timers/promises";

// Import Third-party Dependencies
import { initConfig } from "@sigyn/config";
import isCI from "is-ci";

// Import Internal Dependencies
import { asyncTask } from "../../src/tasks/asyncTask";
import { MockLogger } from "./helpers";
import { Rule } from "../../src/rules";
import { getDB, initDB } from "../../src/database";
import { resetCalls, getCalls, getArgs } from "./mocks/sigyn-test-notifier";

// CONSTANTS
const kFixturePath = path.join(__dirname, "/fixtures");
const kRuleConfigLocation = path.join(kFixturePath, "/self-monitoring/sigyn.config.json");
const kRuleNotMatchFiltersConfigLocation = path.join(kFixturePath, "/not-match-rule-filters/sigyn.config.json");
const kRuleMatchRuleFiltersConfigLocation = path.join(kFixturePath, "/no-self-monitoring-filters/sigyn.config.json");
const kRuleMatchErrorFiltersConfigLocation = path.join(kFixturePath, "/no-self-monitoring-filters/sigyn.config.json");
const kRuleNoFiltersConfigLocation = path.join(kFixturePath, "/no-self-monitoring-filters/sigyn.config.json");
const kRuleThrottleConfigLocation = path.join(kFixturePath, "/self-monitoring-throttle/sigyn.config.json");
const kRuleActivationThresholdConfigLocation = path.join(kFixturePath, "/self-monitoring-activation-threshold/sigyn.config.json");
const kRuleIntervalThrottleConfigLocation = path.join(kFixturePath, "/self-monitoring-interval/sigyn.config.json");
const kLogger = new MockLogger();
const kMockLokiApi = {
  Loki: {
    queryRangeStream() {
      throw new Error("Failed");
    }
  }
};
// time to wait for the task to be fully executed (alert sent)
const kTimeout = isCI ? 350 : 200;

describe("Self-monitoring", () => {
  beforeEach(() => {
    resetCalls();
  });

  before(async() => {
    process.env.GRAFANA_API_TOKEN = "toto";
  });

  afterEach(() => {
    getDB().exec("DELETE FROM agentFailures");
  });

  it("should not send alert when error does not match errorFilters", async() => {
    initDB(kLogger, { databaseFilename: ".temp/test-agent.sqlite3" });
    const config = await initConfig(kRuleConfigLocation);
    const rule = new Rule(config.rules[0], { logger: kLogger });
    rule.init();

    const task = asyncTask(
      config.rules[0], {
        logger: kLogger,
        lokiApi: kMockLokiApi as any,
        rule
      }
    );

    assert.ok(task);
    task.execute();

    await setTimeout(kTimeout);

    assert.equal(getCalls(), 0);
  });

  it("should not send alert when error does not match ruleFilters", async() => {
    initDB(kLogger, { databaseFilename: ".temp/test-agent.sqlite3" });
    const config = await initConfig(kRuleNotMatchFiltersConfigLocation);
    const rule = new Rule(config.rules[0], { logger: kLogger });
    rule.init();

    const task = asyncTask(
      config.rules[0], {
        logger: kLogger,
        lokiApi: kMockLokiApi as any,
        rule
      }
    );

    task.execute();

    await setTimeout(kTimeout);

    assert.equal(getCalls(), 0);
  });

  it("should send alert as rule matches ruleFilters", async() => {
    initDB(kLogger, { databaseFilename: ".temp/test-agent.sqlite3" });
    const config = await initConfig(kRuleMatchRuleFiltersConfigLocation);

    for (const ruleConfig of config.rules) {
      const rule = new Rule(ruleConfig, { logger: kLogger });
      rule.init();
      const task = asyncTask(
        config.rules[0], {
          logger: kLogger,
          lokiApi: kMockLokiApi as any,
          rule
        }
      );

      task.execute();
    }


    await setTimeout(kTimeout);

    assert.equal(getCalls(), 3);

    const errors = getArgs()[0].data.agentFailure.errors;
    assert.equal(errors, "Failed", "should not have duplicated errors");
  });

  it("should send alert as rule matches errorFilters", async() => {
    const config = await initConfig(kRuleMatchErrorFiltersConfigLocation);
    const rule = new Rule(config.rules[0], { logger: kLogger });
    rule.init();

    const task = asyncTask(
      config.rules[0], {
        logger: kLogger,
        lokiApi: kMockLokiApi as any,
        rule
      }
    );

    task.execute();

    await setTimeout(kTimeout);

    assert.equal(getCalls(), 1);
  });

  it("should send alert as there are is no filter", async() => {
    const config = await initConfig(kRuleNoFiltersConfigLocation);
    const rule = new Rule(config.rules[0], { logger: kLogger });
    rule.init();

    const task = asyncTask(
      config.rules[0], {
        logger: kLogger,
        lokiApi: kMockLokiApi as any,
        rule
      }
    );

    task.execute();

    await setTimeout(kTimeout);

    assert.equal(getCalls(), 1);
  });

  it("should have throttle", async() => {
    const config = await initConfig(kRuleThrottleConfigLocation);
    const rule = new Rule(config.rules[0], { logger: kLogger });
    rule.init();

    const task = asyncTask(
      config.rules[0], {
        logger: kLogger,
        lokiApi: kMockLokiApi as any,
        rule
      }
    );

    task.execute();
    await setTimeout(kTimeout);
    assert.equal(getCalls(), 1);

    task.execute();
    await setTimeout(kTimeout);
    // Still 1 call as throttle is activated
    assert.equal(getCalls(), 1);

    task.execute();
    await setTimeout(kTimeout);
    // Still 1 call as throttle is activated
    assert.equal(getCalls(), 1);

    task.execute();
    await setTimeout(kTimeout);
    // Throttle is OFF, alert sent again.
    assert.equal(getCalls(), 2);
  });

  it("should wait remaining activationThreshold (3) before activate throttle", async() => {
    const config = await initConfig(kRuleActivationThresholdConfigLocation);
    const rule = new Rule(config.rules[0], { logger: kLogger });
    rule.init();
    getDB().exec("DELETE FROM agentFailures");

    const task = asyncTask(
      config.rules[0], {
        logger: kLogger,
        lokiApi: kMockLokiApi as any,
        rule
      }
    );

    task.execute();
    await setTimeout(kTimeout);
    // first alert, no throttle (remaining: 2)
    assert.equal(getCalls(), 1);


    task.execute();
    await setTimeout(kTimeout);
    // because of activationThreshold, no throttle (remaining: 1)
    assert.equal(getCalls(), 2);

    task.execute();
    await setTimeout(kTimeout);
    // because of activationThreshold, no throttle (remaining: 0 -> now throttle is ON)
    assert.equal(getCalls(), 3);

    task.execute();
    await setTimeout(kTimeout);
    // Now that throttle is activated (count = 3, 2 more to get OFF), alert not sent.
    assert.equal(getCalls(), 3);

    task.execute();
    await setTimeout(kTimeout);
    // Throttle is still activated (count = 3, 1 more to get OFF), alert not sent.
    assert.equal(getCalls(), 3);

    task.execute();
    await setTimeout(kTimeout);
    // Throttle is still activated (count = 3, 0 more, throttle is off now), alert not sent.
    assert.equal(getCalls(), 3);

    // Throttle is OFF, alert sent again.
    task.execute();
    await setTimeout(kTimeout);
    assert.equal(getCalls(), 4);
  });

  it("should disable throttle after interval", async() => {
    const config = await initConfig(kRuleIntervalThrottleConfigLocation);
    const rule = new Rule(config.rules[0], { logger: kLogger });
    rule.init();

    const task = asyncTask(
      config.rules[0], {
        logger: kLogger,
        lokiApi: kMockLokiApi as any,
        rule
      }
    );

    task.execute();
    await setTimeout(kTimeout);
    // first alert, no throttle
    assert.equal(getCalls(), 1);

    task.execute();
    await setTimeout(kTimeout);
    // throttle activated, still 1 call
    assert.equal(getCalls(), 1);

    task.execute();
    await setTimeout(kTimeout);
    // throttle activated, still 1 call
    assert.equal(getCalls(), 1);

    // wait 5s (the interval value)
    await setTimeout(5000);
    task.execute();
    await setTimeout(kTimeout);
    // throttle deactivated, now 2 calls
    assert.equal(getCalls(), 2);
  });
});

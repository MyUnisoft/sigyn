/* eslint-disable max-nested-callbacks */
// Import Node.js Dependencies
import assert from "node:assert";
import path from "node:path";
import fs from "node:fs";
import timers from "node:timers/promises";
import { after, before, describe, it } from "node:test";

// Import Third-party Dependencies
import dayjs from "dayjs";
import MockDate from "mockdate";
import { SigynConfig, SigynRule, initConfig } from "@sigyn/config";
import { MockAgent, getGlobalDispatcher, setGlobalDispatcher } from "@myunisoft/httpie";

// Import Internal Dependencies
import { DbRule, getDB, initDB } from "../../src/database";
import { MockLogger } from "./helpers";
import { Rule } from "../../src/rules";

// CONSTANTS
const kMultiPollingConfigLocation = path.join(__dirname, "/fixtures/multi-polling/sigyn.config.json");
const kLokiFixtureApiUrl = "http://localhost:3100";
const kMockAgent = new MockAgent();
const kGlobalDispatcher = getGlobalDispatcher();
const kLogger = new MockLogger();

function getRule(rule: SigynRule): DbRule {
  return getDB().prepare("SELECT * FROM rules WHERE name = ?").get(rule.name) as DbRule;
}

async function pollingIn100ms(rule: Rule, logs: string[]): Promise<boolean> {
  const t0 = performance.now();

  const createAlert = await rule.walkOnLogs([{ values: logs, stream: {} }]);

  const timeToHandleLogsInMs = Math.floor(performance.now() - t0);

  if (timeToHandleLogsInMs > 119) {
    // 119ms is the max time to have tests to pass since we do series a 5 polls
    // (120 * 5 would make 600 and would break the intended behavior), we must be bellow 600ms
    throw new Error(`timeToHandleLogsInMs > 119 (${timeToHandleLogsInMs}`);
  }

  if (timeToHandleLogsInMs < 100) {
    await timers.setTimeout(100 - timeToHandleLogsInMs);
  }

  return createAlert;
}

function resetRuleCounter(rule: SigynRule): void {
  const db = getDB();
  db.transaction(() => {
    db.prepare("UPDATE rules SET counter = 0 WHERE name = ?").run(rule.name);
    db.prepare("DELETE FROM ruleLabels");
    db.prepare("DELETE FROM ruleLogs");
  })();
}

function createAlertInDB(rule: DbRule): void {
  getDB().prepare("INSERT INTO alerts (ruleId, createdAt) VALUES (?, ?)").run(rule.id, dayjs().valueOf());
  getDB().prepare("UPDATE ruleLogs SET processed = 1 WHERE ruleId = ?").run(rule.id);
}

describe("Rule.walkOnLogs()", () => {
  before(async() => {
    // we create a temp folder to store the test database
    fs.rmSync(".temp", { recursive: true, force: true });
    fs.mkdirSync(".temp");

    process.env.GRAFANA_API_TOKEN = "toto";
    setGlobalDispatcher(kMockAgent);

    const pool = kMockAgent.get(kLokiFixtureApiUrl);
    pool.intercept({
      path: () => true
    }).reply(200);

    initDB(kLogger, { databaseFilename: ".temp/test-agent.sqlite3" });
  });

  after(() => {
    setGlobalDispatcher(kGlobalDispatcher);
  });

  describe("A rule with polling = '100ms', alert.on.count = 5 and alert.on.interval = '500ms'", () => {
    let config: SigynConfig;

    before(async() => {
      config = await initConfig(kMultiPollingConfigLocation);
    });

    describe("When receiving one new log on each polling within the interval limit", () => {
      it("should send alert on 5th polling and reset count", async() => {
        const ruleConfig = config.rules[0];
        const rule = new Rule(ruleConfig, { logger: kLogger });
        rule.init();
        assert.equal(getRule(ruleConfig).counter, 0);

        let pollingCount = 0;
        while (pollingCount++ < 4) {
          const createAlert = await pollingIn100ms(rule, ["one new log"]);

          assert.equal(createAlert, false);
          assert.equal(getRule(ruleConfig).counter, pollingCount);
        }

        const createAlert = await pollingIn100ms(rule, ["one new log"]);

        assert.equal(createAlert, true);
        // once alert triggers, counter should be reset to 0
        assert.equal(getRule(ruleConfig).counter, 0);
      });
    });

    describe("When receiving one new log on each polling outside the interval limit", () => {
      it("should not send alert", async() => {
        const ruleConfig = config.rules[0];
        const rule = new Rule(ruleConfig, { logger: kLogger });
        rule.init();
        assert.equal(getRule(ruleConfig).counter, 0);

        let pollingCount = 0;
        while (pollingCount++ < 4) {
          const createAlert = await pollingIn100ms(rule, ["one new log outside interval limit"]);

          assert.equal(createAlert, false);
          assert.equal(getRule(ruleConfig).counter, pollingCount);
        }

        // counter is 4 in 400ms, we wait 100ms more to be outside the interval (it does 200ms because polling takes 100ms)
        assert.equal(getRule(ruleConfig).counter, 4);
        await timers.setTimeout(100);

        const createAlertAfter600Ms = await pollingIn100ms(rule, ["one new log"]);

        // counter is still 4 because it has removed one counter added 600s later while interval is 500ms
        assert.equal(createAlertAfter600Ms, false);
        assert.equal(getRule(ruleConfig).counter, 4);

        const createAlertAfter700Ms = await pollingIn100ms(rule, ["one new log"]);

        // counter is still 4 because it has removed one counter added 600ms later while interval is 500ms
        assert.equal(createAlertAfter700Ms, false);
        assert.equal(getRule(ruleConfig).counter, 4);
      });
    });

    describe("When receiving 5 new logs on first polling", () => {
      it("should send alert and reset count", async() => {
        const ruleConfig = config.rules[0];
        const rule = new Rule(ruleConfig, { logger: kLogger });
        // need to reset counter because previous test has set it to 4 and didn't triggers alert so counter has not been reset
        resetRuleCounter(ruleConfig);

        assert.equal(getRule(ruleConfig).counter, 0);

        const createAlert = await pollingIn100ms(rule, Array.from(Array(5)).map(() => "one new log"));

        assert.equal(createAlert, true);
        // once alert triggers, counter should be reset to 0
        assert.equal(getRule(ruleConfig).counter, 0);
      });
    });

    describe("A rule with throttle.count = 6 and throttle.interval = '1s'", () => {
      describe("When receiving less logs than throttle.count within the interval", () => {
        it("should send a first alert", async() => {
          const ruleConfig = config.rules[0];
          const rule = new Rule(ruleConfig, { logger: kLogger });

          assert.equal(getRule(ruleConfig).counter, 0);

          const createAlert = await pollingIn100ms(rule, Array.from(Array(5)).map(() => "one new log"));

          assert.equal(createAlert, true);
          // once alert triggers, counter should be reset to 0
          assert.equal(getRule(ruleConfig).counter, 0);

          // Since throttle is based on alerts table, we need to create it ourself
          createAlertInDB(getRule(ruleConfig));
        });

        it("should not send another alert whithin interval and with less logs than count threshold", async() => {
          for (let i = 0; i < 5; i++) {
            const ruleConfig = config.rules[0];
            const rule = new Rule(ruleConfig, { logger: kLogger });

            assert.equal(getRule(ruleConfig).counter, 0);

            const createAlert = await pollingIn100ms(rule, Array.from(Array(5)).map(() => "one new log"));

            assert.equal(createAlert, false);
            // once alert triggers, counter should be reset to 0
            assert.equal(getRule(ruleConfig).throttleCount, i + 1);
          }
        });

        it("should send another alert whithin interval and with more logs than count threshold", async() => {
          const ruleConfig = config.rules[0];
          const rule = new Rule(ruleConfig, { logger: kLogger });

          assert.equal(getRule(ruleConfig).counter, 0);

          const createAlert = await pollingIn100ms(rule, Array.from(Array(15)).map(() => "one new log"));

          assert.equal(createAlert, true);
          // once alert triggers, counter should be reset to 0
          assert.equal(getRule(ruleConfig).counter, 0);
        });
      });
    });

    describe("A rule with no throttle", () => {
      it("should send a first alert", async() => {
        const ruleConfig = { ...config.rules[0], alert: { ...config.rules[0].alert, throttle: undefined } };

        const rule = new Rule(ruleConfig, { logger: kLogger });

        assert.equal(getRule(ruleConfig).counter, 0);

        const createAlert = await pollingIn100ms(rule, Array.from(Array(5)).map(() => "one new log"));

        assert.equal(createAlert, true);
        // once alert triggers, counter should be reset to 0
        assert.equal(getRule(ruleConfig).counter, 0);

        // Since throttle is based on alerts table, we need to create it ourself
        createAlertInDB(getRule(ruleConfig));
      });

      it("should send each another alert", async() => {
        for (let i = 0; i < 3; i++) {
          const ruleConfig = { ...config.rules[0], alert: { ...config.rules[0].alert, throttle: undefined } };
          const rule = new Rule(ruleConfig, { logger: kLogger });

          assert.equal(getRule(ruleConfig).counter, 0);

          const createAlert = await pollingIn100ms(rule, Array.from(Array(5)).map(() => "one new log"));

          assert.equal(createAlert, true);
          // once alert triggers, counter should be reset to 0
          assert.equal(getRule(ruleConfig).counter, 0);
        }
      });
    });

    describe("A rule with a maximum count threshold (count < 50)", () => {
      it("should wait the whole interval before checking whether sending an alert", async() => {
        const ruleConfig = {
          ...config.rules[0],
          alert: {
            ...config.rules[0].alert,
            on: {
              ...config.rules[0].alert.on,
              count: "< 50"
            },
            throttle: undefined
          }
        };
        const rule = new Rule(ruleConfig, { logger: kLogger });

        assert.equal(getRule(ruleConfig).counter, 0);

        // since interval is 500ms and polling 100ms, need to do 5 polling to end the interval
        // 4 POLLINGS
        for (let i = 0; i < 4; i++) {
          const createAlert = await pollingIn100ms(rule, ["one log"]);

          assert.equal(createAlert, false);
          // once alert triggers, counter should be reset to 0
          assert.equal(getRule(ruleConfig).counter, i + 1);
        }

        // 5th POLLING
        assert.equal(getRule(ruleConfig).counter, 4);
        const createAlert = await pollingIn100ms(rule, ["one log should trigger alert"]);

        assert.equal(createAlert, true);
        // once alert triggers, counter should be reset to 0
        assert.equal(getRule(ruleConfig).counter, 0);
      });

      it("should not send alert after the interval ends as trehshold is lesser than logs count", async() => {
        const ruleConfig = {
          ...config.rules[0],
          alert: {
            ...config.rules[0].alert,
            on: {
              ...config.rules[0].alert.on,
              count: "< 50"
            },
            throttle: undefined
          }
        };
        const rule = new Rule(ruleConfig, { logger: kLogger });
        resetRuleCounter(ruleConfig);
        assert.equal(getRule(ruleConfig).counter, 0);

        // since interval is 500ms and polling 100ms, need to do 5 polling to end the interval
        // 4 POLLINGS
        for (let i = 0; i < 4; i++) {
          const createAlert = await pollingIn100ms(rule, Array.from(Array(10)).map(() => "one new log"));

          assert.equal(createAlert, false);
          // once alert triggers, counter should be reset to 0
          assert.equal(getRule(ruleConfig).counter, (i + 1) * 10);
        }

        // 5th POLLING
        assert.equal(getRule(ruleConfig).counter, 40);
        const createAlert = await pollingIn100ms(rule, Array.from(Array(10)).map(() => "one new log"));

        assert.equal(createAlert, false);
        // once alert triggers, counter should be reset to 0
        assert.equal(getRule(ruleConfig).counter, 50);
      });
    });

    it("should store labels", async() => {
      const rule = new Rule(config.rules[0], { logger: kLogger });
      await rule.walkOnLogs([
        { values: ["one"], stream: { foo: "bar" } },
        { values: ["two"], stream: { foo: "baz", foz: "boz" } }
      ]);

      const labels = getDB().prepare("SELECT * FROM ruleLabels").all();

      assert.equal(labels.length, 3);
      assert.deepEqual(labels, [
        { id: 1, ruleId: 1, key: "foo", value: "bar" },
        { id: 2, ruleId: 1, key: "foo", value: "baz" },
        { id: 3, ruleId: 1, key: "foz", value: "boz" }
      ]);
    });

    it("should not store duplicate labels", async() => {
      getDB().exec("DELETE from ruleLabels");

      const rule = new Rule(config.rules[0], { logger: kLogger });

      await rule.walkOnLogs([
        { values: ["one"], stream: { foo: "bar" } },
        { values: ["two"], stream: { foo: "bar" } }
      ]);

      const labels = getDB().prepare("SELECT * FROM ruleLabels").all();

      assert.equal(labels.length, 1);
      assert.deepEqual(labels, [
        { id: 1, ruleId: 1, key: "foo", value: "bar" }
      ]);
    });
  });
});

describe("Rule.getQueryRangeStartUnixTimestamp()", () => {
  let config: SigynConfig;

  before(async() => {
    config = await initConfig(kMultiPollingConfigLocation);
  });

  describe("Given a cron polling '* 7-20 * * *' with a bounded polling strategy", () => {
    before(() => {
      config.rules[0].polling = "* 7-20 * * *";
      config.rules[0].pollingStrategy = "bounded";
    });

    const expected = [
      ["01-01-2023 18:00:00", "01-01-2023 17:59:00"],
      ["01-01-2023 17:32:00", "01-01-2023 17:31:00"],
      ["01-01-2023 20:00:00", "01-01-2023 19:59:00"],
      ["01-01-2023 13:27:00", "01-01-2023 13:26:00"],
      ["01-01-2023 7:01:00", "01-01-2023 7:00:00"],
      ["01-01-2023 9:10:00", "01-01-2023 9:09:00"],
      ["01-01-2023 12:17:00", "01-01-2023 12:16:00"],
      ["01-01-2023 15:55:00", "01-01-2023 15:54:00"]
    ];

    for (const [date, expectedResultDate] of expected) {
      it(`should return the previous interval (${expectedResultDate}) when date is ${date}`, () => {
        MockDate.set(date);

        const rule = new Rule(config.rules[0], { logger: kLogger });
        const start = rule.getQueryRangeStartUnixTimestamp();

        assert.equal(start, dayjs(expectedResultDate).unix());
      });
    }

    it("should return null when date is 01-01-2023 07:00:00", () => {
      MockDate.set("01-01-2023 07:00:00");

      const rule = new Rule(config.rules[0], { logger: kLogger });
      const start = rule.getQueryRangeStartUnixTimestamp();

      assert.equal(start, null);
    });
  });

  describe("Given a cron polling '* 7-20 * * *' with an unbounded polling strategy", () => {
    before(() => {
      config.rules[0].polling = "* 7-20 * * *";
      config.rules[0].pollingStrategy = "unbounded";
    });

    const expected = [
      ["01-01-2023 18:00:00", "01-01-2023 17:59:00"],
      ["01-01-2023 17:32:00", "01-01-2023 17:31:00"],
      ["01-01-2023 20:00:00", "01-01-2023 19:59:00"],
      ["01-01-2023 13:27:00", "01-01-2023 13:26:00"],
      ["01-01-2023 7:01:00", "01-01-2023 7:00:00"],
      ["01-01-2023 9:10:00", "01-01-2023 9:09:00"],
      ["01-01-2023 12:17:00", "01-01-2023 12:16:00"],
      ["01-01-2023 15:55:00", "01-01-2023 15:54:00"]
    ];

    for (const [date, expectedResultDate] of expected) {
      it(`should return the previous interval (${expectedResultDate}) when date is ${date}`, () => {
        MockDate.set(date);

        const rule = new Rule(config.rules[0], { logger: kLogger });
        const start = rule.getQueryRangeStartUnixTimestamp();

        assert.equal(start, dayjs(expectedResultDate).unix());
      });
    }

    it("should return previous polling when date is 01-01-2023 07:00:00", () => {
      MockDate.set("01-01-2023 07:00:00");

      const rule = new Rule(config.rules[0], { logger: kLogger });
      const start = rule.getQueryRangeStartUnixTimestamp();

      assert.equal(start, dayjs("12-31-2022 20:59:00").unix());
    });
  });
});

describe("Rule.getRuleFromDatabaseWithLabels()", () => {
  let config: SigynConfig;

  before(async() => {
    config = await initConfig(kMultiPollingConfigLocation);
  });

  it("should return a rule with labels", async() => {
    getDB().exec("DELETE from ruleLabels");

    const rule = new Rule(config.rules[0], { logger: kLogger });
    await rule.walkOnLogs([
      { values: ["one"], stream: { foo: "bar" } },
      { values: ["two"], stream: { foo: "baz", foz: "boz" } }
    ]);

    const ruleWithLabels = rule.getRuleFromDatabaseWithLabels();

    assert.equal(Object.keys(ruleWithLabels.labels).length, 2);
    assert.equal(ruleWithLabels.labels.foo, "bar, baz");
    assert.equal(ruleWithLabels.labels.foz, "boz");
  });

  it("should return a rule without labels", async() => {
    getDB().exec("DELETE from ruleLabels");

    const rule = new Rule(config.rules[0], { logger: kLogger });
    const ruleWithLabels = rule.getRuleFromDatabaseWithLabels();

    assert.equal(Object.keys(ruleWithLabels.labels).length, 0);
  });
});
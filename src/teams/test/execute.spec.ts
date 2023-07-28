// Import Node.js Dependencies
import assert from "node:assert";
import { after, before, describe, it } from "node:test";

// Import Third-party Dependencies
import { MockAgent, MockPool, getGlobalDispatcher, setGlobalDispatcher } from "@myunisoft/httpie";

// Import Internal Dependencies
import * as teams from "../src/index";

const kMockAgent = new MockAgent();
const kDispatcher = getGlobalDispatcher();
const kValidRuleConfig = {
  name: "test1",
  logql: "{app=\"foo\", env=\"prod\"} |= `One of the file names does not match what is expected`",
  polling: "1m",
  alert: {
    on: {
      count: 6,
      interval: "5m"
    },
    template: {
      title: "🚨 {ruleName} - Triggered {counter} times!",
      content: [
        "- LogQL: {logql}",
        "- Threshold: {count}",
        "- Interval: {interval}"
      ]
    }
  }
};
const kDummyWebhoobURL = "https://foo.com";

describe("execute()", () => {
  let pool: MockPool;

  before(() => {
    setGlobalDispatcher(kMockAgent);
    pool = kMockAgent.get(kDummyWebhoobURL);
    kMockAgent.disableNetConnect();
  });

  after(() => {
    kMockAgent.enableNetConnect();
    setGlobalDispatcher(kDispatcher);
  });

  it("should throws if there is no title AND no content", async() => {
    await assert.rejects(async() => {
      await teams.execute({
        counter: 10,
        ruleConfig: { ...kValidRuleConfig, alert: { ...kValidRuleConfig.alert, template: {} } },
        webhookUrl: kDummyWebhoobURL
      });
    }, {
      name: "Error",
      message: "Invalid rule template: one of the title or content is required."
    });
  });

  it("should execute webhook", async() => {
    pool.intercept({
      method: "POST",
      path: "/"
    }).reply(200, { foo: "bar" });

    const { data } = await teams.execute({
      counter: 10,
      ruleConfig: kValidRuleConfig,
      webhookUrl: kDummyWebhoobURL
    });

    assert.deepEqual(JSON.parse(data), { foo: "bar" });
  });

  it("should fail executing webhook when Teams API rejects", async() => {
    pool.intercept({
      method: "POST",
      path: "/"
    }).reply(400, { message: "Unable to send webhook" });

    await assert.rejects(async() => await teams.execute({
      counter: 10,
      ruleConfig: kValidRuleConfig,
      webhookUrl: kDummyWebhoobURL
    }), {
      name: "Error",
      message: "Bad Request"
    });
  });

  it("should fail executing webhook when given missing config", async() => {
    pool.intercept({
      method: "POST",
      path: "/"
    }).reply(200, { foo: "bar" });

    await assert.rejects(async() => await teams.execute({
      counter: 10,
      ruleConfig: {
        ...kValidRuleConfig,
        alert: { ...kValidRuleConfig.alert, on: { ...kValidRuleConfig.alert.on, count: undefined } }
      } as any,
      webhookUrl: kDummyWebhoobURL
    }), {
      name: "MissingValueError",
      message: "Missing a value for the placeholder: count"
    });
  });
});
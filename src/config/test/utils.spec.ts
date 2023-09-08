// Import Node.js Dependencies
import assert from "node:assert";
import { after, before, describe, it } from "node:test";

// Import Third-party Dependencies
import { MockAgent, getGlobalDispatcher, setGlobalDispatcher } from "@myunisoft/httpie";

// Import Internal Dependencies
import * as utils from "../src/utils";
import { AlertSeverity, PartialSigynConfig, SigynConfig, SigynRule } from "../src/types";

// CONSTANTS
const kDummyUrl = "http://localhost:3000";
const kMockAgent = new MockAgent();
const kGlobalDispatcher = getGlobalDispatcher();

describe("Utils", () => {
  before(() => {
    process.env.GRAFANA_API_TOKEN = "toto";
    setGlobalDispatcher(kMockAgent);

    const pool = kMockAgent.get(kDummyUrl);
    pool.intercept({
      path: (path) => path.includes("env")
    }).reply(200, { data: ["prod", "dev"] }, { headers: { "Content-Type": "application/json" } }).persist();
  });

  after(() => {
    setGlobalDispatcher(kGlobalDispatcher);
  });

  describe("mergeRulesLabelFilters()", () => {
    it("should create rule for each label filter", async() => {
      const rules: Partial<SigynRule>[] = [
        {
          name: "foo",
          logql: "{app=\"foo\"} |= `my super logql`"
        },
        {
          name: "bar",
          logql: "{env={label.env}} |= `my super logql`",
          labelFilters: {
            env: ["prod", "dev"]
          }
        },
        {
          name: "baz",
          logql: "{app=\"foo\", env={label.env}} |= `my super logql`",
          labelFilters: {
            env: ["prod", "dev"]
          }
        }
      ];
      const expectedRules: Partial<SigynRule>[] = [
        {
          name: "foo",
          logql: "{app=\"foo\"} |= `my super logql`"
        },
        {
          name: "bar (env = prod)",
          logql: "{env=\"prod\"} |= `my super logql`",
          labelFilters: {
            env: ["prod", "dev"]
          }
        },
        {
          name: "bar (env = dev)",
          logql: "{env=\"dev\"} |= `my super logql`",
          labelFilters: {
            env: ["prod", "dev"]
          }
        },
        {
          name: "baz (env = prod)",
          logql: "{app=\"foo\", env=\"prod\"} |= `my super logql`",
          labelFilters: {
            env: ["prod", "dev"]
          }
        },
        {
          name: "baz (env = dev)",
          logql: "{app=\"foo\", env=\"dev\"} |= `my super logql`",
          labelFilters: {
            env: ["prod", "dev"]
          }
        }
      ];
      const config = {
        loki: {
          apiUrl: kDummyUrl
        },
        rules
      };
      assert.deepEqual(await utils.mergeRulesLabelFilters(config as SigynConfig), expectedRules);
    });
  });

  describe("fetchRulesLabels()", () => {
    it("should fetch labels from Loki", async() => {
      const config: any = {
        loki: {
          apiUrl: kDummyUrl
        },
        rules: [
          {
            labelFilters: {
              env: ["foo"],
              app: ["foo"]
            }
          }
        ]
      };

      const labels = await utils.fetchRulesLabels(config);

      assert.equal(labels.size, 2);
      assert.deepEqual(labels.get("env"), ["prod", "dev"]);
      assert.equal(labels.get("foo"), undefined);
    });
  });

  describe("applyDefaultValues", () => {
    const config: PartialSigynConfig = {
      loki: {
        apiUrl: kDummyUrl
      },
      notifiers: {
        discord: {
          webhookUrl: "https://discord.com/api/webhooks/1234567890/abcdefg"
        },
        slack: {
          webhookUrl: "https://hooks.slack.com/services/1234567890/abcdefg"
        }
      },
      rules: [
        {
          name: "foo",
          logql: "{app=\"foo\"} |= `my super logql`",
          alert: {
            on: {
              count: 5,
              interval: "10h"
            },
            throttle: {
              interval: "1h"
            },
            template: {
              title: "Alert for foo"
            }
          }

        }
      ]
    };

    it("should apply default values", () => {
      assert.deepEqual(utils.applyDefaultValues(config), {
        loki: {
          apiUrl: kDummyUrl
        },
        notifiers: {
          discord: {
            webhookUrl: "https://discord.com/api/webhooks/1234567890/abcdefg"
          },
          slack: {
            webhookUrl: "https://hooks.slack.com/services/1234567890/abcdefg"
          }
        },
        missingLabelStrategy: "ignore",
        defaultSeverity: "error",
        rules: [
          {
            name: "foo",
            logql: "{app=\"foo\"} |= `my super logql`",
            polling: "1m",
            disabled: false,
            notifiers: ["discord", "slack"],
            pollingStrategy: "unbounded",
            alert: {
              on: {
                count: 5,
                interval: "10h"
              },
              throttle: {
                interval: "1h",
                count: 0
              },
              severity: "error",
              template: {
                title: "Alert for foo"
              }
            }
          }
        ]
      });
    });

    it("given severity 'information', severity should be 'info'", () => {
      config.rules[0].alert.severity = "information";
      assert.equal(utils.applyDefaultValues(config).rules[0].alert.severity, "info");
    });

    it("given severity 'major', severity should be 'error'", () => {
      config.rules[0].alert.severity = "major";
      assert.equal(utils.applyDefaultValues(config).rules[0].alert.severity, "error");
    });

    it("given severity 'minor', severity should be 'warning'", () => {
      config.rules[0].alert.severity = "minor";
      assert.equal(utils.applyDefaultValues(config).rules[0].alert.severity, "warning");
    });
  });

  describe("getSeverity()", () => {
    const sev1: AlertSeverity[] = ["critical"];
    for (const sev of sev1) {
      it(`should return 'critical' when given '${sev}'`, () => {
        assert.equal(utils.getSeverity(sev), "critical");
      });
    }

    const sev2: AlertSeverity[] = ["error", "major"];
    for (const sev of sev2) {
      it(`should return 'error' when given '${sev}'`, () => {
        assert.equal(utils.getSeverity(sev), "error");
      });
    }

    const sev3: AlertSeverity[] = ["warning", "minor"];
    for (const sev of sev3) {
      it(`should return 'warning' when given '${sev}'`, () => {
        assert.equal(utils.getSeverity(sev), "warning");
      });
    }

    const sev4: AlertSeverity[] = ["information", "info", "low"];
    for (const sev of sev4) {
      it(`should return 'info' when given '${sev}'`, () => {
        assert.equal(utils.getSeverity(sev), "info");
      });
    }
  });

  describe("applyRulesLogQLVariables()", () => {
    const config: PartialSigynConfig = {
      loki: {
        apiUrl: kDummyUrl
      },
      notifiers: {
        discord: {
          webhookUrl: "https://discord.com/api/webhooks/1234567890/abcdefg"
        },
        slack: {
          webhookUrl: "https://hooks.slack.com/services/1234567890/abcdefg"
        }
      },
      rules: [
        {
          name: "foo ({vars.foo})",
          logql: {
            query: "{app=\"foo\"} |= `{vars.foo} {vars.baz}`",
            vars: {
              foo: "bar",
              baz: ["foo", "bar"]
            }
          },
          alert: {
            on: {
              count: 5,
              interval: "10h"
            },
            throttle: {
              interval: "1h"
            },
            template: {
              title: "Alert for foo"
            }
          }

        }
      ]
    };

    it("should apply variables", async() => {
      const rules = utils.applyRulesLogQLVariables(config as SigynConfig);

      assert.equal(rules[0].logql, "{app=\"foo\"} |= `bar foo|bar`");
    });

    it("should not modify logql if there is no variable", async() => {
      const conf = { ...config } as any;
      conf.rules[0].logql.vars = undefined;

      const rules = utils.applyRulesLogQLVariables(conf as SigynConfig);

      assert.equal(rules[0].logql, "{app=\"foo\"} |= `{vars.foo} {vars.baz}`");
    });
  });
});

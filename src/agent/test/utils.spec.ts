// Import Node.js Dependencies
import assert from "node:assert";
import { describe, it } from "node:test";

// Import Third-party Dependencies
import dayjs from "dayjs";

// Import Internal Dependencies
import * as utils from "../src/utils";

describe("Utils", () => {
  describe("durationToDate()", () => {
    it("should add one year", () => {
      const date = utils.durationOrCronToDate("1y", "add");

      assert.equal(date.get("y"), dayjs().add(1, "y").get("y"));
    });

    it("should subtract one year", () => {
      const date = utils.durationOrCronToDate("1y", "subtract");

      assert.equal(date.get("y"), dayjs().subtract(1, "y").get("y"));
    });
  });

  describe("ruleCountThresholdOperator", () => {
    const ruleCountThresholdOperatorTests: [number | string, utils.RuleCounterOperatorValue][] = [
      ["10", [">=", 10]],
      [10, [">=", 10]],
      [">= 10", [">=", 10]],
      [">=10", [">=", 10]],
      [">=  10", [">=", 10]],
      [">=  10  ", [">=", 10]],
      ["  >=  10  ", [">=", 10]],
      ["> 10", [">", 10]],
      ["< 10", ["<", 10]],
      ["<= 10", ["<=", 10]],
      ["<=10", ["<=", 10]],
      ["<=  10", ["<=", 10]],
      ["<=  10  ", ["<=", 10]],
      ["  <=  10  ", ["<=", 10]],
      ["<  10  ", ["<", 10]]
    ];

    for (const [input, expected] of ruleCountThresholdOperatorTests) {
      it(`should return ${JSON.stringify(expected)} given "${input}"`, () => {
        const [operator, count] = utils.ruleCountThresholdOperator(input);

        assert.equal(operator, expected[0]);
        assert.equal(count, expected[1]);
      });
    }

    it("should throw if the input is not a valid string", () => {
      assert.throws(() => {
        utils.ruleCountThresholdOperator("foo");
      }, {
        name: "Error",
        message: "Invalid count threshold format."
      });
    });

    it("should throw if the value is not valid", () => {
      assert.throws(() => {
        utils.ruleCountThresholdOperator(">= foo");
      }, {
        name: "Error",
        message: "Invalid count threshold format."
      });
    });

    it("should throw if the operator is not valid", () => {
      assert.throws(() => {
        utils.ruleCountThresholdOperator("foo 10");
      }, {
        name: "Error",
        message: "Invalid count threshold format."
      });
    });
  });

  describe("ruleCountMatchOperator()", () => {
    it("should return true if the operator is '>' and the counter is greater than the count", () => {
      assert.equal(utils.ruleCountMatchOperator(">", 10, 5), true);
    });

    it("should return true if the operator is '>=' and the counter is greater than or equal to the count", () => {
      assert.equal(utils.ruleCountMatchOperator(">=", 10, 10), true);
      assert.equal(utils.ruleCountMatchOperator(">=", 10, 5), true);
    });

    it("should return true if the operator is '<' and the counter is less than the count", () => {
      assert.equal(utils.ruleCountMatchOperator("<", 5, 10), true);
    });

    it("should return true if the operator is '<=' and the counter is less than or equal to the count", () => {
      assert.equal(utils.ruleCountMatchOperator("<=", 5, 10), true);
      assert.equal(utils.ruleCountMatchOperator("<=", 10, 10), true);
    });

    it("should return false if the operator is '>' and the counter is less than the count", () => {
      assert.equal(utils.ruleCountMatchOperator(">", 5, 10), false);
    });

    it("should return false if the operator is '>=' and the counter is less than the count", () => {
      assert.equal(utils.ruleCountMatchOperator(">=", 5, 10), false);
    });

    it("should return false if the operator is '<' and the counter is greater than the count", () => {
      assert.equal(utils.ruleCountMatchOperator("<", 10, 5), false);
    });

    it("should return false if the operator is '<=' and the counter is greater than the count", () => {
      assert.equal(utils.ruleCountMatchOperator("<=", 10, 5), false);
    });

    it("should throw if the operator is not valid", () => {
      assert.throws(() => {
        utils.ruleCountMatchOperator("foo" as utils.RuleCounterOperator, 10, 5);
      }, {
        name: "Error",
        message: "Invalid operator: foo"
      });
    });
  });

  describe("getNotifierPackage()", () => {
    it("should return '@sigyn/discord' when given 'discord'", () => {
      assert.equal(utils.getNotifierPackage("discord"), "@sigyn/discord");
    });

    it("should return '@sigyn/slack' when given 'slack'", () => {
      assert.equal(utils.getNotifierPackage("discord"), "@sigyn/discord");
    });

    it("should return the given notifier name when it is not a Sigyn notifier", () => {
      assert.equal(utils.getNotifierPackage("foo"), "foo");
    });
  });

  describe("getRulePollings()", () => {
    it("should return a cron polling given a valid cron expression", () => {
      const [[isCron, polling]] = utils.getRulePollings("*/5 * * * *");

      assert.equal(isCron, true);
      assert.equal(polling, "*/5 * * * *");
    });

    it("should be a valid cron expression given a cron with seconds (non-standard)", () => {
      const [[isCron, polling]] = utils.getRulePollings("* * * * * *");

      assert.equal(isCron, true);
      assert.equal(polling, "* * * * * *");
    });

    it("should return a list of cron polling given a list of valid cron expression", () => {
      const pollings = utils.getRulePollings([
        "*/10 * 15-15,38 * * *",
        "*/30 * 0-14 * * *",
        "*/30 * 15,39-23 * * *"
      ]);

      assert.equal(pollings.length, 3);

      for (const [isCron] of pollings) {
        assert.equal(isCron, true);
      }
    });

    it("should not return a cron", () => {
      const [[isCron, polling]] = utils.getRulePollings("5m");

      assert.equal(isCron, false);
      assert.equal(polling, "5m");
    });

    it("should throw when no polling given", () => {
      assert.throws(() => {
        utils.getRulePollings("");
      }, {
        name: "Error",
        message: "Missing polling value"
      });
    });
    it("should throw when given an empty list", () => {
      assert.throws(() => {
        utils.getRulePollings([]);
      }, {
        name: "Error",
        message: "Missing polling value"
      });
    });

    it("should throw when a polling in the list is not a valid cron expression", () => {
      assert.throws(() => {
        utils.getRulePollings(["foo"]);
      }, {
        name: "Error",
        message: "All polling values must be cron expressions"
      });
    });

    it("should throw when given a list with a single polling that is not a valid cron expression", () => {
      assert.throws(() => {
        utils.getRulePollings(["1m"]);
      }, {
        name: "Error",
        message: "All polling values must be cron expressions"
      });
    });
  });
});

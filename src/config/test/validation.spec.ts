// Import Node.js Dependencies
import assert from "node:assert";
import { describe, it } from "node:test";

// Import Internal Dependencies
import { validate } from "../src/validate";
import { SigynConfig } from "../src/types";

const kValidConfig: SigynConfig = {
  notifiers: {
    foo: {
      bar: "baz"
    }
  },
  rules: [
    {
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
    }
  ]
};

describe("Config validation", () => {
  it("should validate a valid config", () => {
    assert.doesNotThrow(() => {
      validate(kValidConfig);
    });
  });

  it("given a rule template with only title, it should validate", () => {
    assert.doesNotThrow(() => {
      validate({
        ...kValidConfig,
        rules: [
          {
            ...kValidConfig.rules[0],
            alert: {
              ...kValidConfig.rules[0].alert,
              template: {
                title: "foo"
              }
            }
          }
        ]
      });
    });
  });

  it("given a rule template with only content, it should validate", () => {
    assert.doesNotThrow(() => {
      validate({
        ...kValidConfig,
        rules: [
          {
            ...kValidConfig.rules[0],
            alert: {
              ...kValidConfig.rules[0].alert,
              template: {
                content: ["foo"]
              }
            }
          }
        ]
      });
    });
  });

  it("given a rule template with empty title, it should throws", () => {
    assert.throws(() => {
      validate({
        ...kValidConfig,
        rules: [
          {
            ...kValidConfig.rules[0],
            alert: {
              ...kValidConfig.rules[0].alert,
              template: {
                title: ""
              }
            }
          }
        ]
      });
    }, {
      name: "Error",
      message: "Invalid config: /rules/0/alert/template/title: must NOT have fewer than 1 characters"
    });
  });

  it("given a rule template with empty content, it should throws", () => {
    assert.throws(() => {
      validate({
        ...kValidConfig,
        rules: [
          {
            ...kValidConfig.rules[0],
            alert: {
              ...kValidConfig.rules[0].alert,
              template: {
                content: []
              }
            }
          }
        ]
      });
    }, {
      name: "Error",
      message: "Invalid config: /rules/0/alert/template/content: must NOT have fewer than 1 items"
    });
  });

  it("given a rule template with empty title and valid content, it should throws", () => {
    assert.throws(() => {
      validate({
        ...kValidConfig,
        rules: [
          {
            ...kValidConfig.rules[0],
            alert: {
              ...kValidConfig.rules[0].alert,
              template: {
                title: "",
                content: ["foo"]
              }
            }
          }
        ]
      });
    }, {
      name: "Error",
      message: "Invalid config: /rules/0/alert/template/title: must NOT have fewer than 1 characters"
    });
  });

  it("given a rule template with empty content and valid title, it should throws", () => {
    assert.throws(() => {
      validate({
        ...kValidConfig,
        rules: [
          {
            ...kValidConfig.rules[0],
            alert: {
              ...kValidConfig.rules[0].alert,
              template: {
                title: "",
                content: []
              }
            }
          }
        ]
      });
    }, {
      name: "Error",
      message: "Invalid config: /rules/0/alert/template/title: must NOT have fewer than 1 characters"
    });
  });

  it("given a rule template without title and content, it should throws", () => {
    assert.throws(() => {
      validate({
        ...kValidConfig,
        rules: [
          {
            ...kValidConfig.rules[0],
            alert: {
              ...kValidConfig.rules[0].alert,
              template: {}
            }
          }
        ]
      });
    }, {
      name: "Error",
      // eslint-disable-next-line max-len
      message: "Invalid config: /rules/0/alert/template: must have required property 'title', /rules/0/alert/template: must have required property 'content', /rules/0/alert/template: must match a schema in anyOf"
    });
  });

  it("rule name should be required", () => {
    assert.throws(() => {
      validate({
        ...kValidConfig,
        rules: [
          {
            ...kValidConfig.rules[0],
            name: undefined as any
          }
        ]
      });
    }, {
      name: "Error",
      message: "Invalid config: /rules/0: must have required property 'name'"
    });
  });

  it("rule name should not be empty", () => {
    assert.throws(() => {
      validate({
        ...kValidConfig,
        rules: [
          {
            ...kValidConfig.rules[0],
            name: ""
          }
        ]
      });
    }, {
      name: "Error",
      message: "Invalid config: /rules/0/name: must NOT have fewer than 1 characters"
    });
  });

  it("rule name should be unique", () => {
    assert.throws(() => {
      validate({
        ...kValidConfig,
        rules: [
          {
            ...kValidConfig.rules[0]
          },
          {
            ...kValidConfig.rules[0]
          }
        ]
      });
    }, {
      name: "Error",
      // TODO: should we have a better error message?
      message: "Invalid config: /rules: must pass \"uniqueItemProperties\" keyword validation"
    });
  });

  it("rule logql should be required", () => {
    assert.throws(() => {
      validate({
        ...kValidConfig,
        rules: [
          {
            ...kValidConfig.rules[0],
            logql: undefined as any
          }
        ]
      });
    }, {
      name: "Error",
      message: "Invalid config: /rules/0: must have required property 'logql'"
    });
  });

  it("rule logql should not be empty", () => {
    assert.throws(() => {
      validate({
        ...kValidConfig,
        rules: [
          {
            ...kValidConfig.rules[0],
            logql: ""
          }
        ]
      });
    }, {
      name: "Error",
      message: "Invalid config: /rules/0/logql: must NOT have fewer than 1 characters"
    });
  });

  it("rule polling should be required", () => {
    assert.throws(() => {
      validate({
        ...kValidConfig,
        rules: [
          {
            ...kValidConfig.rules[0],
            polling: undefined as any
          }
        ]
      });
    }, {
      name: "Error",
      message: "Invalid config: /rules/0: must have required property 'polling'"
    });
  });

  it("rule polling should not be empty", () => {
    assert.throws(() => {
      validate({
        ...kValidConfig,
        rules: [
          {
            ...kValidConfig.rules[0],
            polling: ""
          }
        ]
      });
    }, {
      name: "Error",
      message: "Invalid config: /rules/0/polling: must NOT have fewer than 1 characters"
    });
  });

  it("rule alert should be required", () => {
    assert.throws(() => {
      validate({
        ...kValidConfig,
        rules: [
          {
            ...kValidConfig.rules[0],
            alert: undefined as any
          }
        ]
      });
    }, {
      name: "Error",
      message: "Invalid config: /rules/0: must have required property 'alert'"
    });
  });

  it("rule alert property 'on' should be required", () => {
    assert.throws(() => {
      validate({
        ...kValidConfig,
        rules: [
          {
            ...kValidConfig.rules[0],
            alert: {
              ...kValidConfig.rules[0].alert,
              on: undefined as any
            }
          }
        ]
      });
    }, {
      name: "Error",
      message: "Invalid config: /rules/0/alert: must have required property 'on'"
    });
  });

  it("rule alert property 'on.count' should be required", () => {
    assert.throws(() => {
      validate({
        ...kValidConfig,
        rules: [
          {
            ...kValidConfig.rules[0],
            alert: {
              ...kValidConfig.rules[0].alert,
              on: {
                ...kValidConfig.rules[0].alert.on,
                count: undefined as any
              }
            }
          }
        ]
      });
    }, {
      name: "Error",
      message: "Invalid config: /rules/0/alert/on: must have required property 'count'"
    });
  });

  it("rule alert property 'on.count' should be string or number", () => {
    assert.throws(() => {
      validate({
        ...kValidConfig,
        rules: [
          {
            ...kValidConfig.rules[0],
            alert: {
              ...kValidConfig.rules[0].alert,
              on: {
                ...kValidConfig.rules[0].alert.on,
                count: true as any
              }
            }
          }
        ]
      });
    }, {
      name: "Error",
      // eslint-disable-next-line max-len
      message: "Invalid config: /rules/0/alert/on/count: must be number, /rules/0/alert/on/count: must be string, /rules/0/alert/on/count: must match exactly one schema in oneOf"
    });
  });

  it("rule alert property 'on.interval' should be required", () => {
    assert.throws(() => {
      validate({
        ...kValidConfig,
        rules: [
          {
            ...kValidConfig.rules[0],
            alert: {
              ...kValidConfig.rules[0].alert,
              on: {
                ...kValidConfig.rules[0].alert.on,
                interval: undefined as any
              }
            }
          }
        ]
      });
    }, {
      name: "Error",
      message: "Invalid config: /rules/0/alert/on: must have required property 'interval'"
    });
  });

  it("rule alert property 'on.interval' should be a string", () => {
    assert.throws(() => {
      validate({
        ...kValidConfig,
        rules: [
          {
            ...kValidConfig.rules[0],
            alert: {
              ...kValidConfig.rules[0].alert,
              on: {
                ...kValidConfig.rules[0].alert.on,
                interval: 15 as any
              }
            }
          }
        ]
      });
    }, {
      name: "Error",
      message: "Invalid config: /rules/0/alert/on/interval: must be string"
    });
  });

  it("rule alert property 'on' should not have additional properties", () => {
    assert.throws(() => {
      validate({
        ...kValidConfig,
        rules: [
          {
            ...kValidConfig.rules[0],
            alert: {
              ...kValidConfig.rules[0].alert,
              on: {
                ...kValidConfig.rules[0].alert.on,
                foo: "bar"
              } as any
            }
          }
        ]
      });
    }, {
      name: "Error",
      message: "Invalid config: /rules/0/alert/on: must NOT have additional properties"
    });
  });
});
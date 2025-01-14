// Import Node.js Dependencies
import { isDeepStrictEqual } from "node:util";

// Import Third-party Dependencies
import { minimatch } from "minimatch";

// Import Internal Dependencies
import type { SigynConfig, SigynCompositeRule, SigynInitializedCompositeRule } from "../types.js";
import { extendsTemplates } from "./templates.js";
import { ruleSeverity } from "./defaultValues.js";

// CONSTANTS
const kDefaultCompositeRuleInterval = "1d";

export function initialize(config: SigynConfig): SigynInitializedCompositeRule[] {
  if (!config.compositeRules) {
    return [];
  }

  const ruleNames = config.rules.map((rule) => rule.name);
  const compositeRules: SigynInitializedCompositeRule[] = [];

  for (const compositeRule of config.compositeRules) {
    const excludeRules = (compositeRule?.filters?.exclude ?? []).flatMap(
      (ruleToExclude) => ruleNames.filter((ruleName) => minimatch(ruleName, ruleToExclude))
    );
    const includeRules = compositeRule?.filters?.include?.flatMap(
      (ruleToInclude) => ruleNames.filter((ruleName) => minimatch(ruleName, ruleToInclude))
    ) ?? ruleNames;
    const severities = new Set(compositeRule?.filters?.severity ?? ["critical", "error", "warning", "info"]);
    const rules = config.rules.filter((rule) => includeRules.includes(rule.name) &&
      !excludeRules.includes(rule.name) &&
      severities.has(ruleSeverity(config, rule))
    ).map((rule) => rule.name);

    compositeRules.push({
      ...compositeRule,
      rules,
      interval: compositeRule.interval ?? kDefaultCompositeRuleInterval
    } as SigynInitializedCompositeRule);

    {
      const compositeRule = compositeRules.at(-1)!;
      if (compositeRule.rules.length <= 1) {
        throw new Error(`Composite rule ${compositeRule.name} require at least 2 matching rules`);
      }

      if (compositeRules.filter((rule) => isDeepStrictEqual(rule.rules, compositeRule.rules)).length > 1) {
        throw new Error("Found multiple composite rules wich scope the same rules");
      }

      const ruleCount = compositeRule.rules.length;
      const ruleCountThreshold = compositeRule.ruleCountThreshold ?? 0;
      if (ruleCountThreshold > ruleCount) {
        throw new Error(`ruleCountThreshold (${ruleCountThreshold}) cannot be higher than total rule (${ruleCount})`);
      }
    }
  }

  return compositeRules;
}

export function handleTemplates(
  config: SigynConfig,
  compositeRules: SigynCompositeRule[]
): SigynCompositeRule[] {
  if (compositeRules.length === 0) {
    return [];
  }

  const clonedRules = JSON.parse(JSON.stringify((compositeRules)));

  for (const rule of clonedRules) {
    if (typeof rule.template === "object" && rule.template.extends) {
      rule.template = extendsTemplates(rule.template, config);
    }
    else if (typeof rule.template === "string") {
      rule.template = config.templates![rule.template];
    }
  }

  return clonedRules;
}

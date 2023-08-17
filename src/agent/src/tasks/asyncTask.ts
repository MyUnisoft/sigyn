// Import Third-party Dependencies
import { SigynRule } from "@sigyn/config";
import { GrafanaLoki } from "@myunisoft/loki";
import { AsyncTask } from "toad-scheduler";

// Import Internal Dependencies
import { Rule } from "../rules";
import { Logger } from "..";
import { createRuleAlert } from "../alert";

export interface AsyncTaskOptions {
  logger: Logger;
  rule: Rule;
  lokiApi: GrafanaLoki;
}

export function asyncTask(ruleConfig: SigynRule, options: AsyncTaskOptions) {
  const { rule, logger, lokiApi } = options;

  const task = new AsyncTask(ruleConfig.name, async() => {
    const start = rule.getQueryRangeStartUnixTimestamp();
    if (start === null) {
      return;
    }

    const { logs } = await lokiApi.queryRangeStream<string>(ruleConfig.logql, {
      start
    });

    try {
      logger.info(`[${ruleConfig.name}](state: polling|start: ${start}|query: ${ruleConfig.logql})`);

      const createAlert = await rule.walkOnLogs(logs);
      if (createAlert) {
        createRuleAlert(rule.getRuleFromDatabaseWithLabels(), ruleConfig, logger);
        rule.clearLabels();
      }
    }
    catch (e) {
      logger.error(`[${ruleConfig.name}](error: ${e.message})`);
    }
  });

  return task;
}

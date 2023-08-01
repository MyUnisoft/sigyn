// Import Third-party Dependencies
import { SigynRule } from "@sigyn/config";
import { AsyncTask } from "toad-scheduler";
import { Logger } from "pino";

// Import Internal Dependencies
import { Rule } from "../rules";

export interface AsyncTaskOptions {
  logger: Logger;
  rule: Rule;
}

export function asyncTask(ruleConfig: SigynRule, options: AsyncTaskOptions) {
  const { rule, logger } = options;

  const task = new AsyncTask(ruleConfig.name, async() => {
    try {
      logger.info(`[${ruleConfig.name}](state: polling start|polling: ${ruleConfig.polling}|query: ${ruleConfig.logql})`);

      await rule.handleLogs();
    }
    catch (e) {
      logger.error(`[${ruleConfig.name}](error: ${e.message})`);
    }
  });

  return task;
}

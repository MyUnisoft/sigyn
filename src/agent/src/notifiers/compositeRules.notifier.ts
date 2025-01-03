// Import Internal Dependencies
import { type Logger } from "../index.js";
import { Rule } from "../rules.js";
import { type Alert, Notifier } from "./notifier.js";

// CONSTANTS
const kIdentifier = Symbol("compositeRuleNotifier");
const kCompositeRuleSeverity = "critical";

export interface CompositeRuleAlert extends Alert {
  compositeRuleName: string;
  ruleNames: string[];
}

export class CompositeRuleNotifier extends Notifier<CompositeRuleAlert> {
  private static shared: CompositeRuleNotifier;

  constructor(logger: Logger, identifier: symbol) {
    if (identifier !== kIdentifier) {
      throw new Error("Cannot instanciate CompositeRuleNotifier, use CompositeRuleNotifier.getSharedInstance instead");
    }

    super(logger, kIdentifier);
  }

  static getSharedInstance(logger: Logger): CompositeRuleNotifier {
    this.shared ??= new CompositeRuleNotifier(logger, kIdentifier);

    return this.shared;
  }

  override nonUniqueMatcher(notification: CompositeRuleAlert, newNotifications: CompositeRuleAlert) {
    return notification.compositeRuleName === newNotifications.compositeRuleName;
  }

  override async sendNotification(alert: CompositeRuleAlert) {
    const { notifierConfig, compositeRuleName } = alert;
    const notifierOptions = {
      ...notifierConfig,
      data: this.#compositeRuleAlertData(alert),
      template: this.config.compositeRules!.find((rule) => rule.name === compositeRuleName)!.template
    };

    try {
      await this.execute(notifierOptions);

      this.logger.info(`[${compositeRuleName}](notify: success|notifier: ${notifierConfig.notifier})`);
    }
    catch (error: any) {
      this.logger.error(`[${compositeRuleName}](notify: error|notifier: ${notifierConfig.notifier}|message: ${error.message})`);
      this.logger.debug(error);
    }
  }

  #compositeRuleAlertData(alert: CompositeRuleAlert) {
    const { compositeRuleName, ruleNames } = alert;

    const compositeRule = this.config.compositeRules!.find((compositeRule) => compositeRule.name === compositeRuleName)!;
    const rulesLabels = Object.create(null);

    this.config.rules.forEach((ruleConfig) => {
      if (compositeRule.rules.includes(ruleConfig.name) === false) {
        return;
      }

      const rule = new Rule(ruleConfig, { logger: this.logger });
      rule.init();
      const { labels } = rule.getAlertFormattedRule();
      Object.assign(rulesLabels, labels);
    });

    return {
      // TODO: make it configurable
      severity: kCompositeRuleSeverity,
      compositeRuleName,
      label: rulesLabels,
      rules: ruleNames.join(", ")
    };
  }
}

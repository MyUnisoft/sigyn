// Import Third-party Dependencies
import * as httpie from "@myunisoft/httpie";
import { NotifierFormattedSigynRule } from "@sigyn/config";

// CONSTANTS
const kWebhookUsername = "Sigyn Agent";
// https://gist.github.com/thomasbnt/b6f455e2c7d743b796917fa3c205f812
const kEmbedColor = 15548997;

interface ExecuteWebhookOptions {
  webhookUrl: string;
  ruleConfig: NotifierFormattedSigynRule;
  counter: number;
}

async function formatWebhook(counter: number, config: NotifierFormattedSigynRule) {
  // pupa is ESM only, need a dynamic import for CommonJS.
  const { default: pupa } = await import("pupa");

  const {
    alert: {
      on: {
        count, interval
      },
      template: {
        title: templateTitle = "",
        content: templateContent = []
      }
    },
    name: ruleName,
    logql
  } = config;

  if (templateTitle === "" && templateContent.length === 0) {
    throw new Error("Invalid rule template: one of the title or content is required.");
  }

  // displaying backtick in code snippet needs code snippet to be surround by double backtick.
  // if the logql ends with a backtick, we need to add a space after it otherwise the string
  // ends with triple backtick and the code snippet is done.
  const formattedLogQL = logql.includes("`") ? `\`\`${logql.endsWith("`") ? `${logql} ` : logql}\`\`` : `\`${logql}\``;
  const templateData = { ruleName, count, counter, interval, logql: formattedLogQL };
  const contentTemplateOptions = {
    transform: ({ value }) => (value === undefined ? value : `**${value}**`)
  };

  const content: string[] = templateContent.map((content) => pupa(
    content,
    templateData,
    contentTemplateOptions
  ));

  return {
    embeds: [{
      title: pupa(templateTitle, templateData),
      description: content.join("\n"),
      color: kEmbedColor
    }],
    username: kWebhookUsername
  };
}

export async function execute(options: ExecuteWebhookOptions) {
  const { webhookUrl, counter, ruleConfig } = options;

  const body = await formatWebhook(counter, ruleConfig);

  return httpie.post<string>(webhookUrl, {
    body,
    headers: {
      "content-type": "application/json"
    }
  });
}

export interface SigynConfig {
  notifiers: SigynNotifiers;
  rules: SigynRule[]
}

export interface SigynNotifiers {
  discord?: DiscordNotifier;
}

export interface DiscordNotifier {
  webhookUrl: string;
}

export interface SigynRule {
  name: string;
  logql: string;
  polling: string;
  alert: SigynAlert;
  disabled?: boolean;
  notifiers?: string[];
}

export interface SigynAlert {
  on: {
    count: number;
    interval: string;
  },
  template: SigynAlertTemplate;
}

export interface SigynAlertTemplate {
  title?: string;
  content?: string[];
}

interface BaseEntity {
  id: number;
}

export interface DbRule extends BaseEntity {
  name: string;
  counter: number;
  lastRunAt?: number;
}

export interface DbCounter extends BaseEntity {
  name: string;
  counter: number;
  timestamp: number;
}

export interface DbAlert extends BaseEntity {
  createdAt: number;
}

export interface DbNotifier extends BaseEntity {
  name: string;
}

export interface DbAlertNotif extends BaseEntity {
  alertId: BaseEntity["id"];
  notifierId: BaseEntity["id"];
  status: "pending" | "success" | "error";
  retries: number;
}

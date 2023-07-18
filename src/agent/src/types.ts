type TODO = any;

export interface SigynConfig {
  notifier: Record<string, TODO>;
  rules: SigynRule[]
}

export interface SigynRule {
  name: string;
  logql: string;
  polling: string;
  alert: SigynAlert;
}

export interface SigynAlert {
  on: {
    count: number;
    interval: string;
  },
  template?: TODO;
}

export interface IRule {
  name: string;
  counter: number;
  lastRunAt?: number;
}

export interface ICounter {
  name: string;
  counter: number;
  timestamp: number;
}

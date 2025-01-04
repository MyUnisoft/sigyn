// Import Third-party Dependencies
import { randIp, randSuperhero } from "@ngneat/falso";
import type { LokiIngestLogs, LogEntry } from "@myunisoft/loki";

// CONSTANTS
const kDefaultLogsCount = 100;
const kNowInNanoSeconds = Date.now() * 1_000_000;
const k1HourInNanoSeconds = 60 * 60 * 1_000_000_000;
const kDefaultStartUnixTime = kNowInNanoSeconds - k1HourInNanoSeconds;
const kDefaultEndUnixTime = kNowInNanoSeconds;
const kDefaultMode: Mode = "random";

type Mode = "formated" | "json" | "random";

export interface LogGeneratorOptions {
  mode?: Mode;
  count?: number;
  labels?: Record<string, string>;
  startUnixEpoch?: number;
  endUnixEpoch?: number;
}

export interface Superhero {
  realName: string;
  alterEgo: string;
  company: string;
}

export class LogGenerator {
  mode: Mode;
  count: number;
  labels: Record<string, string>;
  startUnixEpoch: number;
  endUnixEpoch: number;
  currentMode: Exclude<Mode, "random">;
  timestamp: string;
  ip: string;
  reqId: string;
  level: string;
  method: string;
  status: number;
  realName: string;
  alterEgo: string;
  company: string;
  error?: Error;

  constructor(options: LogGeneratorOptions) {
    const {
      count = kDefaultLogsCount,
      startUnixEpoch = kDefaultStartUnixTime,
      endUnixEpoch = kDefaultEndUnixTime,
      mode = kDefaultMode,
      labels = Object.create(null)
    } = options;

    this.count = count;
    this.startUnixEpoch = startUnixEpoch;
    this.endUnixEpoch = endUnixEpoch;
    this.mode = mode;
    this.labels = labels;
  }

  randomMode() {
    const modes: Exclude<Mode, "random">[] = ["formated", "json"];

    return modes[Math.floor(Math.random() * modes.length)];
  }

  refresh() {
    if (this.mode === "random") {
      this.currentMode = this.randomMode();
    }

    this.timestamp = (this.startUnixEpoch + Math.floor(Math.random() * (this.endUnixEpoch - this.startUnixEpoch))).toString();
    this.ip = randIp();
    this.reqId = crypto.randomUUID();
    this.method = Math.random() > 0.5 ? "POST" : "GET";

    const { status, level } = this.randomStatus();
    this.status = status;
    this.level = level;
  }

  * generate() {
    while (this.count--) {
      this.refresh();

      const firstHero = randSuperhero() as Superhero;

      yield this.debug(firstHero);
      yield* this.log(firstHero);
    }
  }

  baseFormatted() {
    return `${this.ip} <${this.reqId}> | ${this.method} /api/v1/superhero`;
  }

  baseJson() {
    return {
      ip: this.ip,
      reqId: this.reqId,
      req: {
        method: this.method,
        endpoint: "/api/v1/superhero"
      }
    };
  }

  send(message: string): LokiIngestLogs {
    return {
      stream: {
        level: this.level,
        format: this.currentMode,
        ...this.labels
      },
      values: [
        [this.timestamp, message]
      ]
    };
  }

  debug(hero: Superhero) {
    if (this.currentMode === "formated") {
      return this.send(`${this.baseFormatted()} (realName:${hero.realName}|alterEgo:${hero.alterEgo}|company:${hero.company})`);
    }

    const base = this.baseJson();
    Object.assign(base.req, { body: { ...hero } });

    return this.send(JSON.stringify({ ...base }));
  }

  randomStatus() {
    const statuses = [
      200, 200, 200, 200, 200, 200, 200,
      400, 400,
      500
    ];
    const status = statuses[Math.floor(Math.random() * statuses.length)];

    if (status === 500) {
      return { status, level: "critical" };
    }
    else if (status === 400) {
      return { status, level: "error" };
    }

    return { status, level: "info" };
  }

  * log(superhero: Superhero) {
    if (this.status === 500) {
      const error = new Error("Internal Server Error");

      yield this.send(error.stack!);

      return;
    }
    else if (this.status === 400) {
      const error = new Error(`Unknown superhero: ${superhero.realName}`);

      if (this.currentMode === "formated") {
        yield this.send(`${this.baseFormatted()} [400](error: ${error.message})`);
      }
      else {
        const { req, ...base } = this.baseJson();
        Object.assign(base, { res: { status: 400, error: error.message } });

        yield this.send(JSON.stringify({ ...base }));
      }

      return;
    }

    if (this.currentMode === "formated") {
      yield this.send(`${this.baseFormatted()} [200](count: ${random(1, 50)}|time: ${random(1, 1200)}ms)`);

      return;
    }

    const base = this.baseJson();
    Object.assign(base, { res: { status: 200, count: random(1, 50), time: random(1, 1200) } });
  }
}

function random(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

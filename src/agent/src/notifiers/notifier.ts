// Import Third-party Dependencies
import SQLite3 from "better-sqlite3";
import { type SigynInitializedConfig, getConfig } from "@sigyn/config";

// Import Internal Dependencies
import { type Logger } from "../index.js";
import { getDB } from "../database.js";
import { NotifierQueue } from "./notifierQueue.js";

export interface Alert {
  notifierConfig: {
    notifier: string;
    [key: string]: unknown;
  };
}

export class Notifier<T extends Alert> {
  static localPackages = new Set([
    "discord",
    "slack",
    "teams"
  ]);

  #queue = NotifierQueue.getSharedInstance<T>();
  #identifier: symbol;
  protected logger: Logger;
  protected notifiersId = new Map<string, number>();
  protected db: SQLite3.Database;
  protected config: SigynInitializedConfig;

  constructor(logger: Logger, identifier: symbol) {
    this.logger = logger;
    this.#identifier = identifier;
    this.db = getDB();
    this.config = getConfig();
    this.#queue = NotifierQueue.getSharedInstance();
    this.#queue.on(
      identifier,
      (notificationAlerts: T[]) => this.sendNotifications(notificationAlerts)
    );
  }

  sendAlerts(alerts: T[]) {
    this.push(alerts);
  }

  protected push(notificationAlerts: T[]) {
    this.#queue.push(
      ...notificationAlerts.map((alert) => Object.assign(alert, {
        _id: this.#identifier,
        _nonUniqueMatcher: this.nonUniqueMatcher
      }))
    );
  }

  protected async sendNotifications(notificationAlerts: T[]) {
    await Promise.allSettled(
      notificationAlerts.map((alert) => this.sendNotification(alert))
    );
  }

  protected sendNotification(_alert: T): void {
    throw new Error("sendNotification must be implemented");
  }

  protected nonUniqueMatcher(_notification: T, _newNotifications: T): boolean {
    throw new Error("nonUniqueMatcher must be implemented");
  }

  protected async execute(options: Alert["notifierConfig"]) {
    try {
      const notifierLib = options.notifier;
      const notifierPackage = Notifier.localPackages.has(notifierLib) ? `@sigyn/${notifierLib}` : notifierLib;

      const notifier = await import(notifierPackage);
      await notifier.execute(options);
    }
    finally {
      setImmediate(() => {
        this.#queue.done();
      });
    }
  }
}

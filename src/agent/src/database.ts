// Import Node.js Dependencies
import path from "node:path";
import fs from "node:fs";
import url from "node:url";

// Import Third-party Dependencies
import SQLite3 from "better-sqlite3";
import { type SigynRule } from "@sigyn/config";

// Import Internal Dependencies
import { type Logger } from "./index.js";

// CONSTANTS
const __dirname = path.dirname(url.fileURLToPath(import.meta.url));
const kDefaultDatabaseFilename = process.env.SIGYN_DB ?? "sigyn.sqlite3";
const kDatabaseInitPath = path.join(__dirname, "../data/init-db.sql");

let db: SQLite3.Database | undefined;

export interface DbRule {
  id: number;
  name: string;
  counter: number;
  threshold: number;
  lastRunAt?: number;
  throttleCount: number;
  lastIntervalReset: null | number;
  firstReset: 0 | 1;
  muteUntil: number;
}

export interface DbRuleLog {
  id: number;
  log: string;
  ruleId: number;
  timestamp: number;
  processed: 0 | 1;
}

export interface DbRuleLabel {
  id: number;
  key: string;
  value: string;
  ruleId: number;
  timestamp: number;
}

export interface DbCounter {
  id: number;
  name: string;
  counter: number;
  timestamp: number;
}

export interface DbAlert {
  id: number;
  createdAt: number;
}

export interface DbNotifier {
  id: number;
  name: string;
}

export interface DbAlertNotif {
  id: number;
  alertId: number;
  notifierId: number;
  status: "pending" | "success" | "error";
  retries: number;
}

export interface DbAgentFailure {
  id: number;
  ruleId: number;
  message: string;
  timestamp: number;
  count: number;
  processed: number;
}

export interface DbAgentFailureAlert {
  id: number;
  createdAt: number;
}

export interface InitDbOptions {
  /**
   * @default process.env.SIGYN_DB.
   *
   * If no SIGYN_DB env found, default to 'sigyn.sqlite3'.
   */
  databaseFilename?: string;
  /**
   * If the database is already initialized, allow to override it.
   */
  force?: boolean;
}

export function initDB(
  logger: Logger,
  options: InitDbOptions = Object.create(null)
): SQLite3.Database {
  if (db && !options.force) {
    // This is workaround to use the initialized DB from functional tests
    // FIXME: inject DB in options ?
    return db;
  }

  const { databaseFilename = kDefaultDatabaseFilename } = options;
  db = new SQLite3(databaseFilename);

  const initRawSQL = fs.readFileSync(kDatabaseInitPath, "utf-8");
  db.exec(initRawSQL);

  logger.info(`[Database] initialized at '${path.join(process.cwd(), databaseFilename)}'`);

  return db;
}

export function getDB(): SQLite3.Database {
  if (db === undefined) {
    throw new Error("You must init database first");
  }

  return db;
}

export function cleanRulesInDb(
  configRules: SigynRule[]
) {
  const db = getDB();

  const dbRules = db.prepare("SELECT * FROM rules").all() as DbRule[];

  for (const dbRule of dbRules) {
    const dbRuleConfig = configRules.find((rule) => rule.name === dbRule.name);

    if (dbRuleConfig === undefined) {
      db.prepare("DELETE FROM rules WHERE name = ?").run(dbRule.name);
    }
  }
}

export function getOldestLabelTimestamp(ruleId: number, label: string) {
  return (getDB()
    .prepare("SELECT timestamp FROM ruleLabels WHERE key = ? AND ruleId = ? ORDER BY timestamp ASC LIMIT 1")
    .get(label, ruleId) as Pick<DbRuleLabel, "timestamp">)?.timestamp;
}

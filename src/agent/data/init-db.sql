PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS rules
  (
    id        INTEGER PRIMARY KEY,
    name      TEXT UNIQUE NOT NULL,
    counter   INTEGER DEFAULT 0,
    lastRunAt INTEGER
  );

CREATE TABLE IF NOT EXISTS counters
  (
    id        INTEGER PRIMARY KEY,
    ruleId    INTEGER,
    counter   INTEGER,
    timestamp INTEGER,
    FOREIGN KEY(ruleId) REFERENCES rules(id)
  ); 

CREATE TABLE IF NOT EXISTS alerts
  (
    id        INTEGER PRIMARY KEY,
    ruleId    INTEGER,
    createdAt INTEGER,
    FOREIGN KEY(ruleId) REFERENCES rules(id)
  ); 

CREATE TABLE IF NOT EXISTS notifiers
  (
    id        INTEGER PRIMARY KEY,
    name      TEXT NOT NULL
  ); 

CREATE TABLE IF NOT EXISTS alertNotifs
  (
    alertId    INTEGER,
    notifierId INTEGER,
    status     TEXT,
    retries    INTEGER DEFAULT 0,
    FOREIGN KEY(alertId) REFERENCES alerts(id),
    FOREIGN KEY(notifierId) REFERENCES notifiers(id)
  ); 

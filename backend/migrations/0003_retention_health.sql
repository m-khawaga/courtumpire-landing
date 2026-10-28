CREATE TABLE retention_health (
 kind TEXT PRIMARY KEY, last_attempt TEXT NOT NULL, last_success TEXT,
 failed INTEGER NOT NULL DEFAULT 0
);


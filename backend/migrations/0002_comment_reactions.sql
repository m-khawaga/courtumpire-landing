/* Additive migration: preserves existing comments and article reactions. */
ALTER TABLE articles ADD COLUMN title TEXT NOT NULL DEFAULT '';
CREATE TABLE comment_reactions (
 comment_id TEXT NOT NULL REFERENCES comments(id) ON DELETE CASCADE,
 browser_id TEXT NOT NULL, value INTEGER CHECK(value IN (1,-1) OR value IS NULL),
 version INTEGER NOT NULL DEFAULT 0, last_key TEXT, updated_at TEXT NOT NULL,
 PRIMARY KEY(comment_id,browser_id)
);
CREATE INDEX comment_reaction_totals ON comment_reactions(comment_id,value);
CREATE TABLE comment_reaction_ops (
 comment_id TEXT NOT NULL REFERENCES comments(id) ON DELETE CASCADE,
 browser_id TEXT NOT NULL, request_key TEXT NOT NULL, requested_value INTEGER,
 expected_version INTEGER NOT NULL, applied INTEGER, expires INTEGER NOT NULL,
 PRIMARY KEY(comment_id,browser_id,request_key)
);
CREATE INDEX comment_reaction_ops_expiry ON comment_reaction_ops(expires);


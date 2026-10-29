-- Additive only. Private drafts remain in the separate DRAFTS database.
CREATE TABLE publishing_state(id INTEGER PRIMARY KEY CHECK(id=1), version INTEGER NOT NULL DEFAULT 0, next_edition INTEGER NOT NULL DEFAULT 1);
INSERT INTO publishing_state(id) VALUES(1);
CREATE TABLE editions(id TEXT PRIMARY KEY, slug TEXT NOT NULL UNIQUE, edition_number INTEGER NOT NULL UNIQUE, status TEXT NOT NULL CHECK(status IN ('published','unpublished','trash','deleted')), revision INTEGER NOT NULL, hash TEXT NOT NULL, content TEXT NOT NULL, rendered TEXT NOT NULL, cover TEXT NOT NULL, snapshot TEXT NOT NULL, comparison TEXT NOT NULL, published_at TEXT NOT NULL, changed_at TEXT NOT NULL);
CREATE INDEX editions_archive ON editions(status,published_at DESC,id);
CREATE TABLE edition_revisions(edition_id TEXT NOT NULL, revision INTEGER NOT NULL, hash TEXT NOT NULL, content TEXT NOT NULL, rendered TEXT NOT NULL, cover TEXT NOT NULL, snapshot TEXT NOT NULL, comparison TEXT NOT NULL, status TEXT NOT NULL, changed_at TEXT NOT NULL, PRIMARY KEY(edition_id,revision));
CREATE TABLE edition_slugs(slug TEXT PRIMARY KEY, edition_id TEXT NOT NULL);
CREATE TABLE publication_operations(id TEXT PRIMARY KEY, fingerprint TEXT NOT NULL, result TEXT NOT NULL, at TEXT NOT NULL);
CREATE TRIGGER edition_insert_history AFTER INSERT ON editions WHEN NEW.status<>'deleted' BEGIN INSERT INTO edition_revisions VALUES(NEW.id,NEW.revision,NEW.hash,NEW.content,NEW.rendered,NEW.cover,NEW.snapshot,NEW.comparison,NEW.status,NEW.changed_at); END;
CREATE TRIGGER edition_update_history AFTER UPDATE ON editions WHEN NEW.status<>'deleted' BEGIN INSERT INTO edition_revisions VALUES(NEW.id,NEW.revision,NEW.hash,NEW.content,NEW.rendered,NEW.cover,NEW.snapshot,NEW.comparison,NEW.status,NEW.changed_at); END;

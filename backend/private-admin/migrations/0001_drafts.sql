CREATE TABLE drafts (
 id TEXT PRIMARY KEY, edition_id TEXT, title TEXT NOT NULL, content TEXT NOT NULL,
 revision INTEGER NOT NULL CHECK(revision>0), hash TEXT NOT NULL,
 created_at TEXT NOT NULL, saved_at TEXT NOT NULL, actor TEXT NOT NULL
);
CREATE UNIQUE INDEX drafts_edition_id ON drafts(edition_id) WHERE edition_id IS NOT NULL;
CREATE TABLE draft_revisions (
 draft_id TEXT NOT NULL REFERENCES drafts(id) ON DELETE CASCADE,
 revision INTEGER NOT NULL, content TEXT NOT NULL, hash TEXT NOT NULL,
 saved_at TEXT NOT NULL, actor TEXT NOT NULL, PRIMARY KEY(draft_id,revision)
);
CREATE TRIGGER draft_initial AFTER INSERT ON drafts BEGIN
 INSERT INTO draft_revisions VALUES(new.id,new.revision,new.content,new.hash,new.saved_at,new.actor);
END;
CREATE TRIGGER draft_revision AFTER UPDATE OF content ON drafts BEGIN
 INSERT INTO draft_revisions VALUES(new.id,new.revision,new.content,new.hash,new.saved_at,new.actor);
END;
CREATE INDEX drafts_saved ON drafts(saved_at);


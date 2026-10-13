-- Öffentliche Decks.
--
-- Ein Deck gehört weiterhin genau einem Konto und wird auch nur von
-- diesem geändert. is_public entscheidet allein darüber, ob es ausserdem
-- unter "Community Decks" auftaucht und dort von allen angesehen werden
-- kann, auch ohne Konto. Vorgabe ist 0: Was es schon gibt, bleibt privat,
-- und ein neues Deck ist es ebenfalls, bis sein Besitzer das ändert.
ALTER TABLE decks ADD COLUMN is_public INTEGER NOT NULL DEFAULT 0;

-- Die Übersicht liest nur die öffentlichen Decks und sortiert nach der
-- letzten Änderung. Der Index deckt beides in einem.
CREATE INDEX IF NOT EXISTS idx_decks_public ON decks(is_public, updated_at DESC);

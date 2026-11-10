-- Ordner für Decks und für Karten der Collection.
--
-- Ein Ordner ist kein eigener Datensatz, sondern ein Pfad am Eintrag:
-- "Commander/Budget" liegt im Ordner Budget innerhalb von Commander. So
-- braucht es keine zweite Tabelle und keine Verweise, die beim Löschen
-- nachgezogen werden müssten. Leer heisst: liegt in keinem Ordner.
ALTER TABLE decks ADD COLUMN folder TEXT;
ALTER TABLE collection_cards ADD COLUMN folder TEXT;

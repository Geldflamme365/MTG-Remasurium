-- Ein zweiter Commander für Partner-Paare.
--
-- Manche Commander teilen sich den Platz: Karten mit Partner, Friends
-- forever, Choose a Background und ähnlichen Fähigkeiten. Der zweite
-- steht wie der erste direkt am Deck und mit denselben denormalisierten
-- Angaben, damit die Übersicht ohne zweite Abfrage auskommt. Alle Spalten
-- dürfen leer sein: Ein Deck mit nur einem Commander bleibt, wie es war.
ALTER TABLE decks ADD COLUMN partner_card_id TEXT;
ALTER TABLE decks ADD COLUMN partner_name TEXT;
ALTER TABLE decks ADD COLUMN partner_image TEXT;
ALTER TABLE decks ADD COLUMN partner_art TEXT;

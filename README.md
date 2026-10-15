# MTG Remasurium

A card finder for Magic: The Gathering with an old-school look. You can
search cards through the Scryfall API, read the Oracle text, look at older
prints of the same card, and keep your own collection.

Without an account, everything stays in your browser. With an account, your
collection is saved on Cloudflare, so it is the same on every device.

Search results come in pages of 60 cards, on the search page and in the deck
editor alike. Scryfall hands out at most 175 per answer, so the next batch is
fetched only when you page past what is loaded — one answer covers almost three
pages. Use the buttons under the results, or swipe sideways on a phone.

The start page has a "Random Commander" button next to "Random Card". It pulls
a random card that is allowed to lead a deck, planeswalker commanders
included, and opens it. The search page has the same thing as a suggestion
button, but there the card only drops into the result list without opening
anything.

You can try it right now at <https://remasurium.ch>. It is still in
development, so things can change.

## Project structure

| Path | What it is |
| --- | --- |
| `Remasurium/` | The website. It is served as static files. |
| `Remasurium/regeln.js` | The Magic rules the app needs, as plain functions. No DOM, no network. |
| `tests/regeln.test.mjs` | Tests for those rules. Run them with `npm test`. |
| `src/index.js` | The Worker. It handles the API under `/api/*`. |
| `src/auth.js` | Password hashing and sessions. |
| `migrations/` | The database schema for D1. |

There is no build step and no framework. Just HTML, CSS and JavaScript.

## Run it on your computer

```bash
npm install
npm run db:migrate:local
npm run dev
```

Then open <http://127.0.0.1:8787>. This uses a local test database in the
`.wrangler/` folder. It is separate from the real one, so you cannot break
anything.

## Put it online

The database already exists and its id is in `wrangler.jsonc`. The schema is
applied. So you only need:

```bash
npm run deploy
```

If you set this project up in a different Cloudflare account, do this once
first:

```bash
npx wrangler login
npm run db:create      # this prints a new database id
                       # -> copy it into wrangler.jsonc
npm run db:migrate     # create the tables in the new database
```

If `wrangler login` gets stuck on `localhost:8976`, it means the login window
closed too early. You can use an API token from the Cloudflare dashboard
instead and put it in `CLOUDFLARE_API_TOKEN`.

## The API

Every route starts with `/api`. The session is stored in a cookie. The browser
sends it automatically, so you do not have to handle it yourself.

| Method | Path | What it does |
| --- | --- | --- |
| POST | `/auth/register` | Create an account and log in right away |
| POST | `/auth/login` | Log in |
| POST | `/auth/logout` | Log out |
| POST | `/auth/recover` | Set a new password with the recovery code |
| POST | `/auth/recovery-code` | Get a new recovery code (must be logged in) |
| GET | `/auth/me` | Show the current user, or `null` |
| PATCH | `/profile` | Change the display name |
| GET | `/collection` | Get the collection |
| PUT | `/collection/:cardId` | Add or update one card |
| DELETE | `/collection/:cardId` | Remove one card |
| POST | `/collection/merge` | Copy local cards up without overwriting |
| GET | `/decks/public` | List public decks (no account needed) |
| GET | `/decks/public/:id` | One public deck with its cards (no account needed) |
| GET | `/decks` | List all decks with their card count |
| POST | `/decks` | Create a deck |
| GET | `/decks/:id` | One deck with all its cards |
| PATCH | `/decks/:id` | Rename a deck or set its commander |
| DELETE | `/decks/:id` | Delete a deck |
| PUT | `/decks/:id/cards` | Set several cards at once; quantity 0 takes one out |
| PUT | `/decks/:id/cards/:cardId` | Add a card or change how many copies |
| DELETE | `/decks/:id/cards/:cardId` | Take a card out |
| POST | `/decks/merge` | Copy local decks up when you log in |

## About security

- Passwords are hashed with PBKDF2-SHA256. Every account has its own salt.
- The number of rounds is 50,000. You find it in `src/auth.js`. The Cloudflare
  free plan gives a Worker 10 ms of CPU time per invocation. Waiting for the
  database does not count against that; hashing does, which makes it the most
  expensive thing this Worker performs. The OWASP number of 210,000 costs
  roughly four times as much — measured on a laptop, 70 ms against 17 ms. The
  ratio is what carries over; the absolute numbers depend on the hardware, and
  Cloudflare's is faster than a laptop. That 50,000 fits is what the running
  site proves.
- 50,000 is a round number with room to spare, not a tuned one. Exceeding the
  limit does not make a login slow, it kills the request, and hashing is only
  part of what the request has to do. Creeping closer to the ceiling would buy
  about one bit against an attacker and risk failed logins under load.
- Each account stores the number of rounds it was created with. Login hashes
  with the account's own number, not the current constant, so the constant can
  be raised later on a paid plan and old logins still work.
- The database only stores a SHA-256 hash of the session token. Someone who
  reads the database cannot take over a session with it.
- Login also hashes a password when the email does not exist. Otherwise the
  response time would tell an attacker which accounts are real.
- Failed logins are counted per account (8 tries) and per IP address (30
  tries) in a window of 15 minutes. After that the account or the address is
  blocked for 15 minutes and the API answers with 429. Blocks expire on their
  own, so nobody can lock you out of your account for good. A successful
  login clears the counter.

## Forgot your password

There is no reset email. Cloudflare cannot send mail to any address, and an
outside mail service would need a domain this project does not have.

Instead every account gets a recovery code, shown once when you sign up. To
get back in you enter your email, that code and a new password. The code is
used up in the process and you get a new one right away. While you are logged
in you can create a new code at any time, which makes the old one invalid.
Only a hash of the code is stored.

Resetting also ends all open sessions, so somebody who was already logged in
gets kicked out. The reset route has the same block as the login, so the code
cannot be guessed by trying many times.

## Decks

> **Still being built.** The deck section works, but it is the newest part of
> the project and not finished. The overview and the editor still get changes,
> and the editor in particular is due a visual pass: the panels are laid out
> for function right now, not for looks. Expect things to move around.

The Decks tab holds every deck you build. Each deck has a name, a format and
can have a commander. The commander's artwork is what you see on the deck in
the overview, so you can tell your decks apart at a glance.

Right now the only format is Commander. The others are in the list but turned
off, because the rules behind them are not written yet.

In a Commander deck you may only keep one copy of a card. Two kinds of cards
are free of that rule: basic lands, and cards that say "A deck can have any
number of cards named ...", like Relentless Rats. For those the `+` button
stays usable. The commander itself counts as one of the cards in the deck.

Hovering a deck in the overview shows a small pencil in its corner. It turns
the name into a text field, so a deck can be renamed without opening it. Enter
saves, Escape cancels, and clicking somewhere else saves as well. The name can
also be changed in the deck window at any time.

Click a deck to open the editor. It has two windows side by side: card search
on the left, the deck itself on the right. Drag the bar between them to make
one side wider, the way you would with two windows next to each other. The
width is remembered for next time. You can also move it with the arrow keys.

- **Search** takes plain names or full Scryfall syntax like `c:g t:creature
  mv<=3`. Click a result to see the card up close, then add it from there.
- The suggestion buttons above the search follow your commander. A Commander
  deck may only hold cards in the commander's colours, so every suggestion
  carries that filter, and the commander's creature type is offered as a
  tribal search.
- **Quick Add** sits in the deck window. Type a card name and it takes the best
  match, even if you spell it a bit wrong.
- Every card row has `-` and `+` for the number of copies, a star to make that
  card the commander, and `X` to take it out. Going below one copy removes the
  card.
- Click the picture of a card to open the same detail view the collection has:
  the card up close, its rules text and all its printings. The only difference
  is the button, which adds the card to the deck or takes it out instead of
  touching your collection. This works for search results and for cards
  already in the deck.
- Changing the printing there swaps the card in the deck and keeps the number
  of copies. Clicking the commander's picture goes straight to its printings,
  and the artwork in the overview changes along with it.
- A card made commander leaves the card list, the way the Commander rules put
  it apart from the rest of the deck. It still counts towards the deck size.
- A deck can have **two commanders**, for partner pairs. The star takes the
  first free slot: with no commander it sets the commander, with one it
  adds the partner. With both slots taken it says so instead of pushing
  one out. The commander slot then shows both side by side, each with its
  own star and remove button; with a single commander it looks exactly as
  before. Stepping the commander down moves the partner up into its place.
- With a pair, the colour identity is the union of both, for the rules
  check, the search suggestions and the basic lands alike. The rules check
  also asks whether the two may share the command zone at all: both with
  Partner, both with Partner with or Friends forever, Choose a Background
  with a Background, or Doctor's companion with a Doctor. Scryfall
  supplies those keywords along with the rest of a card; for a custom card
  they are unknown and nothing is flagged.
- The playtester stacks both commanders in the command zone the way the
  deck view stacks its cards: the first shows its name bar, the second
  lies on top. Unlike the deck view the stack does not open on hover; the
  zone sits on the bottom edge and would grow off the table. The zone
  keeps its width. Exporting writes both
  at the top of the list.

Decks work without an account too. They then live in your browser and move up
to your account the first time you log in.

### Deck settings

"Deck settings" in the editor toolbar holds what belongs to the deck as a
whole rather than to a single card. Right now that is its visibility.
Format and the bracket rating will join it there later; for now every deck
is checked as Commander.

### Community decks

Clicking **Decks** in the menu bar drops open a small list: **My decks**
or **Community decks**. You pick before you land anywhere. Both have
their own address, `#/decks` and `#/decks/community`, so either can be
linked or reloaded.

Community decks lists every deck someone made public, newest change
first, and it works without an account: looking at decks needs no
sign-up.

A deck becomes public through the tick box in its settings, and the same
tick box takes it back. What that shares is the deck name, every card in
it and the owner's display name. Never the email address: the public
endpoints read `display_name` and nothing else from the users table.

A public deck opens in the ordinary deck editor, but read-only. The card
list, the rules check, the statistics, the prices, export and the
playtester all work on it. Everything that would change it is gone:
delete, rename, quantities, the commander star, custom cards, optimize
lands, the deck settings and the card search beside it.

That hiding is only the surface. The functions behind those buttons check
the same flag and refuse, so a stray keyboard shortcut cannot slip past
it, and the Worker never accepted the request in the first place: a deck
is written only by its owner, and `GET /decks/:id` answers 404 for
everyone else — public or not. The public route is a separate, read-only
door.

Decks that live only in your browser cannot be made public. There would be
nothing for anyone else to fetch, so the tick box stays disabled until you
have an account.

### Sharing a deck

Every open deck has its own address, `#/decks/<id>`, in the browser's
address bar. Copy it and send it: the link opens that deck directly.
Your own deck opens as usual; someone else's public deck opens
read-only. The browser's back button returns to the list.

If the deck is private, the link shows a screen saying so instead. Not
logged in, it offers to log in, and once you have, the deck opens if it
is yours. Logged in with another account, it simply says the deck
belongs to someone else. A link to a deck that no longer exists says
that too. To tell the two apart, `GET /decks/public/:id` answers 403
for a private deck and 404 for a missing one; nothing else about a
private deck leaves the server.

### Import and export

Import sits in the deck overview and always makes a new deck. Export sits in
the deck window and writes out the deck you have open. Both use the same plain
card list, one card per line with the number first:

```
1 Commodore Guff
1 Sol Ring
1 Preordain
```

This is the same format Moxfield and Arena use, so lists move between them
without editing. While reading a list:

- Lines starting with `//` or `#` and empty lines are skipped.
- A set in brackets like `1 Sol Ring (LEA) 269` is ignored, only the name
  counts.
- `1x Preordain` works, and a line with no number at all counts as one.
- Names are looked up 75 at a time in one request. Anything that does not
  match exactly gets a second try with a tolerant search, so small typos still
  land. What is left over is named in the status line.
- The first card that is allowed to be a commander becomes one. That covers
  legendary creatures and cards that say they can be your commander, like the
  planeswalker Commodore Guff.
- You can give the new deck a name. Leave the field empty and it takes the
  commander's name. Either way the deck opens right after, where the name can
  be changed at any time.

Export writes the commander first, so an exported deck can be read back in
unchanged.

### Playtester

"▶ Playtest" next to the rules check opens the deck as a game **in a new
tab**, at `#/playtest/<deck id>`. It is a page of its own, not a window on
top of the editor: the site's header and footer step aside so the table
gets the full height. That address can be opened or reloaded directly, so
the game survives an accidental refresh and can sit on a second screen
next to the editor.

The library is shuffled fresh, seven cards go to the hand, and the
commander sits in its own zone next to the library, the same size. The
graveyard and the exile zone sit to the right of your hand. Each title
counts what is in it and opens the whole pile, since the zone itself only
shows the card on top.

Point at a card and a single key sends it somewhere, no dragging needed:

| Key | Where the card goes |
| --- | --- |
| `E` | Exile |
| `G` | Graveyard |
| `L` | Top of the library |
| `H` | Hand |
| `C` | A copy on the battlefield (see below) |
| `F` | Stays put and flips over (battlefield only) |

`F` turns a card on the battlefield over. A double-faced card shows its
other face, taken from Scryfall; any other card lies face down and shows
the card back. Press `F` again to turn it back. With a selection, `F`
flips every selected card, first all to the same side. A card that
leaves the battlefield is face up again. `Ctrl+F` still opens the
library search.

`C` copies the card instead of moving it. By the rules such a copy is a
token, so it appears on the battlefield, next to the original if that is
there, and ceases to exist once it leaves. A copy of a real card carries
a small "Copy" label along its bottom edge to tell it from the original,
and so does a copy of that copy, since it still goes back to a real card;
a copy of a token is just another token and needs none. `Ctrl+C` is left
alone for the browser.

Right-click a card on the battlefield to add counters: Loyalty, +1/+1,
Lifelink, Hexproof, Indestructible, Time, Charge or Generic. They show as
small plates along the card's right edge; two +1/+1 counters read
"+2/+2", loyalty sits in a little shield. Every counter type a card
carries gets its own row in that menu with `-`, the count, `+` and a bin
that removes them all; the menu stays open while you click. With several
cards selected, the menu acts on all of them.

A planeswalker enters the battlefield with its starting loyalty, taken
from Scryfall (a loyalty of X starts at nothing). A card that leaves the
battlefield loses its counters, as the rules say; moving it around on
the battlefield keeps them. A copy starts without counters, apart from
the loyalty a planeswalker enters with.

Over the library's pile those keys act on its top card. With nothing
under the pointer they do nothing, so `D` keeps drawing as usual. `S`
with the pointer over the library shuffles it.

The library shows a real card back, fetched from Scryfall like every
other card image here. If that image cannot be loaded, a drawn stand-in
takes its place so the pile stays visible.

Dropping a card on a zone puts it in that zone: hand, battlefield,
graveyard, exile, library. The zone under your pointer lights up before
you let go. Library and commander sit inside the battlefield, so they are asked
first; the commander zone takes only the commander back, anything else
dropped there lands on the battlefield.

Right-clicking the library opens its menu:

| Entry | What it does |
| --- | --- |
| Draw | One card to your hand |
| Draw X cards | 1, 2, 3, 5, 7 or 10 at once |
| Move top card to | Hand, battlefield, graveyard or the bottom |
| Search library | Every card as a grid, in library order |
| Shuffle library | |
| Draw a random card | Not the top one, any of them |
| Turn the top card over | Lays it face up on the pile, where it stays |
| Peek at the top X cards | Look without changing the order |
| Peek at the bottom X cards | Same from the other end |
| Mill X cards | From the top into the graveyard |
| Card actions | Look at the top card, or put it on the bottom |

Turning the top card over leaves it where it is; it simply lies face up
on the pile, and a click still draws it. It remembers which card was
turned, not merely that something was, so drawing the revealed card does
not leave the next one lying open.

Searching the library shows a "Shuffle library after close" checkbox
under the search field. It is ticked every time the search opens, since
you almost always shuffle after searching; however the search closes
(X, Escape, a click beside it or taking a card), the library is then
shuffled. Untick it to leave the order as it is, just this once.

The grids you can take a card from — the library, the graveyard, the
exile zone — carry a search field that filters by name as you type.
Peeking at a few cards does not; there the order is the point. `Ctrl+F`
opens the library search as well.

Clicking a card in those grids puts it onto the battlefield. The `E`,
`G`, `L` and `H` keys work there too, on whichever card you point at, so
anywhere else is one key away. The grid redraws after a move, so the card
you just sent away leaves it. The search field is deliberately not
focused when the grid opens, or those keys would land in it as text.

Drag across empty table to draw a selection box; every card it touches
is selected and gets a light outline. Selected cards behave as if the
pointer were on each of them at once: a click on one taps them all (they
follow the card you clicked, so a mixed group ends up uniform rather than
mixed again), dragging one moves them all by the same distance, and `E`,
`G`, `L` and `H` send them all. Dropped on a zone, the whole group goes
there. Pointing at a card outside the selection means just that card.
Hold `Shift` while drawing to add to the selection; a click on empty
table or `Esc` clears it.

Just above your hand, at the left edge of the table, sits a small **mana count**: one row per
colour plus colourless. Clicking the top half of a symbol adds one, the
bottom half takes one away, never below zero; the pointer turns into a plus or a minus to say which. A new turn sets every
colour back to zero. The little cross folds it down to its heading, and
it stays that way the next time.

A right-click on the table itself opens **Create token** with every token
the deck needs. The token appears on the battlefield with a dashed
border, since it is not a card of the deck. Move it anywhere else — drag
it, or use a key — and it simply ceases to exist, the way a token does.

Drag a card from your hand or straight off the library onto the table and
drop it where you want it. The card follows your pointer the whole way,
and the place it came from stays visible but faded, so you can see what is
moving and where from. A card already in play can be dragged to a new
spot the same way. A click on a card in play taps it, turning it 90
degrees; another click turns it back. Clicking the library draws to your
hand.

| Key | What it does |
| --- | --- |
| `D` | Draw a card |
| `N` | New turn: untap everything, draw, turn counter up |
| `Shift+N` | New game, shuffled again |
| `Ctrl+F` | Search the library |
| `Esc` | Close the menu, then the grid, then the playtester |

Browsers keep `Ctrl+N` for themselves and hand it to the window, not the page,
so `Shift+N` starts a new game instead. The buttons in the bottom bar do the
same thing. Nothing here is saved; closing the tab ends the game.

Closing tries to close the tab, since the editor opened it. Open the
address by hand and there is nothing to close, so it goes back to the deck
list instead.

### Statistics

Under the deck sits a statistics panel. On top the mana curve: how many cards
sit at each mana value, 0 through 7 and everything from 8 up in the last bar,
with the average in the title bar. Lands are left out, since they have no cost
and would drag the curve down; the commander counts in.

Under both sits the list of tokens the deck needs. It is not typed by
hand: Scryfall names, for every card, what it creates, and the list is
the union of those over the whole deck with the commander counted in.
Duplicates fall away, so a deck making Soldiers from four cards lists
Soldier once.

Below it the colour split of the mana costs, one bar per colour with its share.
It counts coloured mana symbols, so a card costing `{2}{B}{G}` adds one to
black and one to green, and a hybrid like `{W/U}` adds half to each.

### Prices

Cards carry a price: under every hit in the search, under every printing in the
version list, and in the deck editor on the card you point at. Each card type
group shows the sum of its cards, and the whole deck is priced in the editor
header and on its tile in the overview. The commander counts in both.

The numbers come from Cardmarket. Scryfall passes their EUR prices through
along with the rest of a card, so the price rides on a request the app makes
anyway. Francs are converted at the European Central Bank daily reference rate,
fetched once a day. If a card has no price on Cardmarket, it is named as such
and left out of the sums rather than counted as zero.

### Optimize lands

"Optimize lands" at the right end of the toolbar opens a window that fills the
deck up with basic lands. You say how many lands the deck should have in total,
and the basics are split along the coloured mana symbols in the deck, the
commander counted in. A deck whose symbols are 71% black and 29% green gets its
basics in the same ratio.

Lands you already play are subtracted first, so only the remainder is filled
with basics. A hybrid symbol like `{W/U}` counts half for each of its colours.
The colours offered are the commander's colour identity; a colourless deck gets
Wastes instead.

Every number can be overwritten by hand, and what stands in the fields is what
gets set. Setting a colour to zero takes those basics out of the deck.

### Rules check

Next to "Delete deck" the editor shows whether the deck is legal. Red-orange
"not legal" means something is off; click it and a window lists what. Green
"legal" means the deck passes. Checked are:

- exactly 100 cards, the commander counted among them
- one copy of each card, apart from basic lands and cards like Relentless Rats
- cards banned or not allowed in Commander
- every card inside the commander's colour identity

Cards that cause a problem get a red border in the deck, in both the list and
the stacked view, so a message in the window can be traced back to a card.

The ban list is not kept in this project. Card legality, type line and colour
identity all come from Scryfall in one request per new card, so the check costs
nothing extra. If Scryfall cannot be reached, size and copies are still checked
and the rest is skipped.

## Custom cards

Not every card you want to play exists on Scryfall. A proxy, a card you
drew yourself, something from a homebrew set. "Custom card" sits in the
collection panel and in the deck toolbar, and "Custom commander" sits in
the commander slot while no commander is picked. All three open the same
window: pick an image, give it a name, choose a type and a colour
identity. The commander button puts the finished card straight onto the
commander slot.

There is still no Oracle text, no mana cost and no price, so the detail
view drops those sections instead of filling them with question marks.
The two things you can set are the ones the rest of the app actually
needs. The type decides which heading the card sits under in the deck.
The colour identity decides what fits: as a normal card it has to fit
inside the commander's colours, and as the commander it sets that frame
for everything else. It also steers the search suggestions and which
basics "Optimize lands" offers. Ticking nothing means colourless.

The image is shrunk in your browser to 488 pixels wide, the same size
Scryfall serves as "normal", and stored as a data URL in the very field
that otherwise holds the Scryfall address. That is why custom cards need
no table and no endpoint of their own: they travel the same way as every
other card, into `localStorage` without an account and up to the Worker
with one. Expect roughly 100 kB per card. Without an account the browser's
storage sets the ceiling, so a few dozen cards is the realistic order of
magnitude, not a few hundred.

The id of a custom card carries everything that is not a name or a
picture:

```
custom-creature-wu-b56eca25-6bbc-4b06-be92-93b694017653
       └ type    └ colours
```

The prefix `custom-` tells every part of the app that there is nothing to
look up here. Type and colours ride along in the id because a card row
stores only a name, a set and an image, and there was no field left for
them. This way they need no column of their own, they reach the cloud and
every other device for free, and any browser can read them back without
asking anyone. Cards made before this existed are plain `custom-<random>`
and stay typeless and colourless.

What follows from all that:

- The rules check counts them towards the 100 cards but never calls them
  banned or not legal. Colours it does check, in both directions.
- They stay out of the mana curve and out of the colour split, since they
  have no mana value and no mana symbols. The colour identity is a
  separate thing from the mana symbols a card costs.
- They have no price and are named as such in the sums, the same way a
  card missing from Cardmarket is.
- They group under the type you picked, or under "Other" if you picked
  none.
- A deck may hold any number of copies. What a card you made yourself is
  worth is yours to decide, so the singleton rule stays out of it.
- A custom card can be the commander. Its own picture then stands for the
  deck in the overview, and its colours become the deck's frame.

Exporting a deck writes the name of a custom card like any other. Reading
that list back in will not find it again, because the name means nothing
to Scryfall.

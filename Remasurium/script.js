import { api } from "./api.js";
import { createDeckStore } from "./decks.js";
import { getLang, setLang, t, watchForNewContent } from "./i18n.js";
import {
  BASIC_LANDS,
  CARD_TYPES,
  CURVE_MAX,
  WASTES,
  farbkuerzel,
  hatTyp,
  istStandardlandTyp,
  landZuFarbe,
  manaKurve,
  mischen,
  passtInFarbidentitaet,
  typKategorie,
  verteileNachAnteil,
  zaehlePips
} from "./regeln.js";

const state = {
  results: [],
  searchSelection: null,
  searchPrints: [],
  searchFaceIndex: 0,
  collectionSelection: null,
  collectionPrints: [],
  collectionFaceIndex: 0,
  versionModalContext: null,
  collection: loadCollection(),
  user: null,
  decks: [],
  // "mine" zeigt die eigenen Decks, "community" die öffentlich
  // gestellten aller Konten.
  deckTab: "mine",
  communityDecks: [],
  // Ein fremdes Deck wird nur angesehen. Die Flagge blendet alles aus,
  // was es ändern würde, und hält die Funktionen dahinter zusätzlich an.
  deckReadOnly: false,
  activeDeck: null,
  activeDeckCards: [],
  deckResults: [],
  deckVersionCard: null,
  renamingDeckId: null,
  // Blättern in den Suchergebnissen: geladene Karten, aktuelle Seite und
  // die Adresse der nächsten Scryfall-Seite.
  searchPage: 0,
  searchNextUrl: null,
  searchTotal: 0,
  deckSearchPage: 0,
  deckSearchNextUrl: null,
  deckSearchTotal: 0,
  deckProblems: [],
  // Die Karten-Ids aus den Problemen, damit sie im Deck rot umrandet werden.
  deckProblemCards: new Set(),
  deckSearchCollapsed: false,
  deckSelection: null,
  deckPrints: [],
  deckFaceIndex: 0,
  commanderCard: null
};

const deckStore = createDeckStore({ isLoggedIn: () => Boolean(state.user) });

// Laufende Nummer je Ansicht, um veraltete Antworten zu erkennen.
const selectionCounters = {
  search: 0,
  collection: 0,
  deck: 0
};

const els = {
  status: document.getElementById("status"),
  routeFooter: document.getElementById("routeFooter"),
  searchInput: document.getElementById("searchInput"),
  searchBtn: document.getElementById("searchBtn"),
  results: document.getElementById("results"),
  searchDetails: document.getElementById("searchDetails"),
  searchModal: document.getElementById("searchModal"),
  modalCloseBtn: document.getElementById("modalCloseBtn"),
  collectionModal: document.getElementById("collectionModal"),
  collectionModalCloseBtn: document.getElementById("collectionModalCloseBtn"),
  versionModal: document.getElementById("versionModal"),
  versionModalCloseBtn: document.getElementById("versionModalCloseBtn"),
  versionModalTitle: document.getElementById("versionModalTitle"),
  versionModalNote: document.getElementById("versionModalNote"),
  versionList: document.getElementById("versionList"),
  collection: document.getElementById("collection"),
  collectionDetails: document.getElementById("collectionDetails"),
  resultCountOutputs: document.querySelectorAll("[data-results-count]"),
  collectionCountOutputs: document.querySelectorAll("[data-collection-count]"),
  queryButtons: document.querySelectorAll("[data-query]"),
  randomButtons: document.querySelectorAll("[data-random-card]"),
  views: {
    home: document.getElementById("view-home"),
    suche: document.getElementById("view-suche"),
    collection: document.getElementById("view-collection"),
    decks: document.getElementById("view-decks"),
    account: document.getElementById("view-account"),
    playtest: document.getElementById("view-playtest")
  },
  deckOverview: document.getElementById("deckOverview"),
  deckEditor: document.getElementById("deckEditor"),
  deckList: document.getElementById("deckList"),
  deckCount: document.getElementById("deckCount"),
  deckStatus: document.getElementById("deckStatus"),
  newDeckName: document.getElementById("newDeckName"),
  newDeckFormat: document.getElementById("newDeckFormat"),
  createDeckBtn: document.getElementById("createDeckBtn"),
  deckLayout: document.querySelector(".deck-layout"),
  deckSplitter: document.getElementById("deckSplitter"),
  deckSearchInput: document.getElementById("deckSearchInput"),
  deckSearchBtn: document.getElementById("deckSearchBtn"),
  deckSearchResults: document.getElementById("deckSearchResults"),
  deckSearchCount: document.getElementById("deckSearchCount"),
  deckQueryBank: document.getElementById("deckQueryBank"),
  deckQueryNote: document.getElementById("deckQueryNote"),
  deckCardModal: document.getElementById("deckCardModal"),
  deckCardModalCloseBtn: document.getElementById("deckCardModalCloseBtn"),
  deckCardDetails: document.getElementById("deckCardDetails"),
  deckNameInput: document.getElementById("deckNameInput"),
  renameDeckBtn: document.getElementById("renameDeckBtn"),
  deleteDeckBtn: document.getElementById("deleteDeckBtn"),
  backToDecksBtn: document.getElementById("backToDecksBtn"),
  commanderSlot: document.getElementById("commanderSlot"),
  deckCards: document.getElementById("deckCards"),
  deckTotal: document.getElementById("deckTotal"),
  quickAddInput: document.getElementById("quickAddInput"),
  quickAddBtn: document.getElementById("quickAddBtn"),
  deckListText: document.getElementById("deckListText"),
  deckCopyBtn: document.getElementById("deckCopyBtn"),
  deckImportBtn: document.getElementById("deckImportBtn"),
  openFeedbackBtn: document.getElementById("openFeedbackBtn"),
  feedbackModal: document.getElementById("feedbackModal"),
  feedbackModalCloseBtn: document.getElementById("feedbackModalCloseBtn"),
  feedbackForm: document.getElementById("feedbackForm"),
  feedbackStatus: document.getElementById("feedbackStatus"),
  adminReviews: document.getElementById("adminReviews"),
  reviewList: document.getElementById("reviewList"),
  toggleSearchBtn: document.getElementById("toggleSearchBtn"),
  legalityBadge: document.getElementById("legalityBadge"),
  deckStatsSummary: document.getElementById("deckStatsSummary"),
  openPlaytestBtn: document.getElementById("openPlaytestBtn"),
  playtestView: document.getElementById("view-playtest"),
  playtestCloseBtn: document.getElementById("playtestCloseBtn"),
  playtestTitle: document.getElementById("playtestTitle"),
  playtestBoard: document.getElementById("playtestBoard"),
  playtestHint: document.getElementById("playtestHint"),
  playtestHand: document.getElementById("playtestHand"),
  playtestLibrary: document.getElementById("playtestLibrary"),
  playtestCommander: document.getElementById("playtestCommander"),
  playtestTurn: document.getElementById("playtestTurn"),
  playtestLibCount: document.getElementById("playtestLibCount"),
  playtestHandCount: document.getElementById("playtestHandCount"),
  playtestBoardCount: document.getElementById("playtestBoardCount"),
  playtestGraveCount: document.getElementById("playtestGraveCount"),
  playtestGraveyard: document.getElementById("playtestGraveyard"),
  playtestGraveyardBody: document.getElementById("playtestGraveyardBody"),
  playtestExile: document.getElementById("playtestExile"),
  playtestExileBody: document.getElementById("playtestExileBody"),
  playtestExileCount: document.getElementById("playtestExileCount"),
  playtestCardsModal: document.getElementById("playtestCardsModal"),
  playtestCardsTitle: document.getElementById("playtestCardsTitle"),
  playtestCardsNote: document.getElementById("playtestCardsNote"),
  playtestCardsGrid: document.getElementById("playtestCardsGrid"),
  playtestCardsSearchRow: document.getElementById("playtestCardsSearchRow"),
  playtestCardsSearch: document.getElementById("playtestCardsSearch"),
  playtestCardsEmpty: document.getElementById("playtestCardsEmpty"),
  playtestCardsCloseBtn: document.getElementById("playtestCardsCloseBtn"),
  playtestMenu: document.getElementById("playtestMenu"),
  playtestMana: document.getElementById("playtestMana"),
  playtestManaToggle: document.getElementById("playtestManaToggle"),
  playtestManaList: document.getElementById("playtestManaList"),
  playtestDrawBtn: document.getElementById("playtestDrawBtn"),
  playtestTurnBtn: document.getElementById("playtestTurnBtn"),
  playtestResetBtn: document.getElementById("playtestResetBtn"),
  manaCurve: document.getElementById("manaCurve"),
  deckTokens: document.getElementById("deckTokens"),
  deckTokenCount: document.getElementById("deckTokenCount"),
  manaColors: document.getElementById("manaColors"),
  openLandsBtn: document.getElementById("openLandsBtn"),
  landsModal: document.getElementById("landsModal"),
  landsModalCloseBtn: document.getElementById("landsModalCloseBtn"),
  landsTotal: document.getElementById("landsTotal"),
  landsRecalcBtn: document.getElementById("landsRecalcBtn"),
  landsFacts: document.getElementById("landsFacts"),
  landsSplit: document.getElementById("landsSplit"),
  landsStatus: document.getElementById("landsStatus"),
  landsApplyBtn: document.getElementById("landsApplyBtn"),
  deckPanelTitle: document.getElementById("deckPanelTitle"),
  deckOwnTools: document.getElementById("deckOwnTools"),
  deckCommunityNote: document.getElementById("deckCommunityNote"),
  decksNavLink: document.getElementById("decksNavLink"),
  decksNavMenu: document.getElementById("decksNavMenu"),
  openDeckSettingsBtn: document.getElementById("openDeckSettingsBtn"),
  deckSettingsModal: document.getElementById("deckSettingsModal"),
  deckSettingsCloseBtn: document.getElementById("deckSettingsCloseBtn"),
  deckSettingsStatus: document.getElementById("deckSettingsStatus"),
  deckPublicToggle: document.getElementById("deckPublicToggle"),
  openCustomCollectionBtn: document.getElementById("openCustomCollectionBtn"),
  openCustomDeckBtn: document.getElementById("openCustomDeckBtn"),
  customCardModal: document.getElementById("customCardModal"),
  customCardCloseBtn: document.getElementById("customCardCloseBtn"),
  customCardName: document.getElementById("customCardName"),
  customCardType: document.getElementById("customCardType"),
  customCardColors: document.getElementById("customCardColors"),
  customCardFile: document.getElementById("customCardFile"),
  customCardPreview: document.getElementById("customCardPreview"),
  customCardStatus: document.getElementById("customCardStatus"),
  customCardSaveBtn: document.getElementById("customCardSaveBtn"),
  legalityModal: document.getElementById("legalityModal"),
  legalityModalCloseBtn: document.getElementById("legalityModalCloseBtn"),
  legalitySummary: document.getElementById("legalitySummary"),
  legalityList: document.getElementById("legalityList"),
  deckImportText: document.getElementById("deckImportText"),
  deckImportName: document.getElementById("deckImportName"),
  randomCommanderBtn: document.getElementById("randomCommanderBtn"),
  randomCommanderPill: document.getElementById("randomCommanderPill"),
  langToggle: document.getElementById("langToggle"),
  openImportBtn: document.getElementById("openImportBtn"),
  openExportBtn: document.getElementById("openExportBtn"),
  importModal: document.getElementById("importModal"),
  exportModal: document.getElementById("exportModal"),
  importModalCloseBtn: document.getElementById("importModalCloseBtn"),
  exportModalCloseBtn: document.getElementById("exportModalCloseBtn"),
  navLinks: document.querySelectorAll(".nav-link"),
  authStatus: document.getElementById("authStatus"),
  accountGuest: document.getElementById("accountGuest"),
  accountUser: document.getElementById("accountUser"),
  accountPanelTitle: document.getElementById("accountPanelTitle"),
  accountFooter: document.getElementById("accountFooter"),
  loginForm: document.getElementById("loginForm"),
  registerForm: document.getElementById("registerForm"),
  recoverForm: document.getElementById("recoverForm"),
  recoveryPanel: document.getElementById("recoveryPanel"),
  recoveryCode: document.getElementById("recoveryCode"),
  copyRecoveryBtn: document.getElementById("copyRecoveryBtn"),
  dismissRecoveryBtn: document.getElementById("dismissRecoveryBtn"),
  newRecoveryBtn: document.getElementById("newRecoveryBtn"),
  profileForm: document.getElementById("profileForm"),
  profileEmail: document.getElementById("profileEmail"),
  profileCreated: document.getElementById("profileCreated"),
  profileName: document.getElementById("profileName"),
  logoutBtn: document.getElementById("logoutBtn"),
  authTabs: document.querySelectorAll("[data-auth-tab]"),
  collectionScopeLabel: document.getElementById("collectionScopeLabel"),
  collectionScopeNote: document.getElementById("collectionScopeNote")
};

// Alle Statuszeilen sehen gleich aus: Text setzen, Klasse setzen. Fehlt
// das Element, passiert nichts.
function schreibeStatus(element, text, type = "muted") {
  if (!element) {
    return;
  }
  element.textContent = text;
  element.className = `status ${type}`;
}

function setStatus(text, type = "muted") {
  schreibeStatus(els.status, text, type);
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function loadCollection() {
  try {
    return JSON.parse(localStorage.getItem("remasurium.collection") || "[]");
  } catch {
    return [];
  }
}

// Ohne Konto ist localStorage die Quelle der Wahrheit, mit Konto der
// Server. Deshalb wird im Cloud-Modus bewusst nichts lokal gespiegelt:
// so bleibt nach dem Abmelden nichts aus der Cloud im Browser liegen.
function saveCollection() {
  if (state.user) {
    return;
  }
  localStorage.setItem("remasurium.collection", JSON.stringify(state.collection));
}

function entryFromCard(card, addedAt = null) {
  return {
    id: card.id,
    name: card.name,
    set_name: card.set_name ?? null,
    released_at: card.released_at ?? null,
    image: getCardPreviewUrl(card) || card.image || null,
    added_at: addedAt
  };
}

// Alles, was keine bekannte Route ist, landet auf der Startseite.
const ROUTEN = new Set(["suche", "collection", "decks", "account", "playtest"]);

// Eine Adresse kann mehr als den Seitennamen tragen: Der Playtester hängt
// die Kennung seines Decks an, also #/playtest/<deck>.
function routeTeile(hash) {
  return String(hash).replace(/^#\/?/, "").trim().split("/").filter(Boolean);
}

function normalizeRoute(hash) {
  const route = (routeTeile(hash)[0] || "").toLowerCase();
  return ROUTEN.has(route) ? route : "home";
}

function setActiveNav(route) {
  for (const link of els.navLinks) {
    // Der Rückmeldeknopf trägt zwar dieselbe Klasse, führt aber zu
    // keinem Ziel und darf deshalb nie als aktive Seite erscheinen.
    if (!link.getAttribute("href")) {
      continue;
    }
    const target = normalizeRoute(link.getAttribute("href"));
    const active = route === target;
    link.classList.toggle("active", active);
    link.setAttribute("aria-current", active ? "page" : "false");
  }
}

function updateRouteChrome(route) {
  const labels = {
    home: "scry://remasurium/home",
    suche: "scry://remasurium/search",
    collection: "scry://remasurium/collection",
    decks: "scry://remasurium/decks",
    account: "scry://remasurium/account",
    playtest: "scry://remasurium/playtest"
  };
  const label = labels[route] || labels.home;  if (els.routeFooter) {
    els.routeFooter.textContent = label;
  }
}

function renderRoute() {
  const route = normalizeRoute(window.location.hash);

  Object.entries(els.views).forEach(([name, node]) => {
    node.classList.toggle("active", name === route);
  });

  const titleMap = {
    home: "MTG Remasurium - Home",
    suche: "MTG Remasurium - Suche",
    collection: "MTG Remasurium - Collection",
    decks: "MTG Remasurium - Decks",
    account: "MTG Remasurium - Account",
    playtest: "MTG Remasurium - Playtest"
  };

  document.title = titleMap[route] || "MTG Remasurium";

  // Auf der Playtest-Seite treten Kopf- und Fusszeile zurück, damit das
  // Spielfeld die ganze Höhe bekommt.
  document.body.classList.toggle("is-playtest", route === "playtest");

  if (route === "playtest") {
    startePlaytestSeite(routeTeile(window.location.hash)[1] || "");
  } else if (playtest.laeuft) {
    // Wer von der Playtest-Seite wegnavigiert, beendet damit die Partie.
    playtestZugAbbrechen();
    playtest.laeuft = false;
  }

  // Der Tab führt immer auf die Übersicht. Ohne das bliebe das zuletzt
  // geöffnete Deck stehen, obwohl man den Menüpunkt angeklickt hat.
  if (route === "decks") {
    // Der zweite Teil der Adresse entscheidet, welche Liste erscheint:
    // #/decks zeigt die eigenen, #/decks/community die öffentlichen. So
    // lässt sich beides auch verlinken.
    showDeckOverview();
    setDeckTab(routeTeile(window.location.hash)[1] === "community" ? "community" : "mine");
  }

  zeigeDecksMenu(false);

  setActiveNav(route);
  updateRouteChrome(route);
  closeVersionModal();
  closeDeckCardModal();
  closeSearchModal();
  closeCollectionModal();
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function openSearchRoute() {
  if (normalizeRoute(window.location.hash) !== "suche") {
    window.location.hash = "#/suche";
  } else {
    renderRoute();
  }
}

function openSearchModal() {
  if (!els.searchModal) {
    return;
  }
  els.searchModal.classList.add("open");
  els.searchModal.setAttribute("aria-hidden", "false");
}

function closeSearchModal() {
  if (!els.searchModal) {
    return;
  }
  els.searchModal.classList.remove("open");
  els.searchModal.setAttribute("aria-hidden", "true");
}

function openCollectionModal() {
  if (!els.collectionModal) {
    return;
  }
  els.collectionModal.classList.add("open");
  els.collectionModal.setAttribute("aria-hidden", "false");
}

function closeCollectionModal() {
  if (!els.collectionModal) {
    return;
  }
  els.collectionModal.classList.remove("open");
  els.collectionModal.setAttribute("aria-hidden", "true");
}

// Scryfall bittet um 50 bis 100 ms Abstand zwischen Anfragen. Ohne
// Bremse laufen schnelle Klicks in ein 429, und die Versionsliste bleibt
// leer, obwohl es Versionen gibt. Darum laufen alle Aufrufe nacheinander
// durch diese Warteschlange.
const SCRYFALL_MIN_GAP_MS = 120;
const SCRYFALL_MAX_RETRIES = 3;

let scryfallQueue = Promise.resolve();
let lastScryfallCall = 0;

function queueScryfall(task) {
  const run = scryfallQueue.then(async () => {
    const wait = SCRYFALL_MIN_GAP_MS - (Date.now() - lastScryfallCall);
    if (wait > 0) {
      await new Promise((resolve) => setTimeout(resolve, wait));
    }
    try {
      return await task();
    } finally {
      lastScryfallCall = Date.now();
    }
  });

  // Der Fehler wird beim Aufrufer behandelt, die Kette darf daran nicht
  // zerbrechen.
  scryfallQueue = run.then(
    () => undefined,
    () => undefined
  );
  return run;
}

async function scryfallFetch(url, options = {}, attempt = 0) {
  let response;

  try {
    response = await queueScryfall(() => fetch(url, options));
  } catch (error) {
    // Abgebrochene Verbindung, kein HTTP-Fehler. Kommt bei wackligem
    // WLAN vor und darf nicht sofort als "keine Versionen" enden.
    if (attempt < SCRYFALL_MAX_RETRIES) {
      setStatus("Verbindung zu Scryfall unterbrochen, neuer Versuch...", "muted");
      await new Promise((resolve) => setTimeout(resolve, (attempt + 1) * 700));
      return scryfallFetch(url, options, attempt + 1);
    }
    throw new Error("Scryfall ist gerade nicht erreichbar.");
  }

  if (response.status === 429 && attempt < SCRYFALL_MAX_RETRIES) {
    const retryAfter = Number(response.headers.get("Retry-After")) || 1;
    setStatus("Scryfall bremst gerade, versuche es gleich nochmal...", "muted");
    await new Promise((resolve) => setTimeout(resolve, retryAfter * 1000));
    return scryfallFetch(url, options, attempt + 1);
  }

  return response;
}

async function fetchJson(url, options = {}) {
  const response = await scryfallFetch(url, options);
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}`);
  }
  return response.json();
}

async function fetchRandomCard(query = "") {
  const nonce = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
  const filter = query ? `q=${encodeURIComponent(query)}&` : "";
  return fetchJson(`https://api.scryfall.com/cards/random?${filter}__cb=${encodeURIComponent(nonce)}`, {
    cache: "no-store"
  });
}

// Scryfall liefert je Antwort höchstens 175 Karten und dazu die Adresse
// der nächsten Seite. Die wird mitgegeben, damit weitergeblättert werden
// kann, und total_cards sagt, wie viele es insgesamt sind.
async function searchCards(query) {
  const url = `https://api.scryfall.com/cards/search?q=${encodeURIComponent(query)}&unique=cards&order=released`;
  return ladeSuchseite(url);
}

async function ladeSuchseite(url) {
  const response = await scryfallFetch(url);
  if (response.status === 404) {
    return { cards: [], nextUrl: null, total: 0 };
  }
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}`);
  }
  const data = await response.json();
  return {
    cards: data.data || [],
    nextUrl: data.has_more ? data.next_page : null,
    total: data.total_cards ?? (data.data || []).length
  };
}

function hasAdvancedScryfallSyntax(query) {
  return /[:<>=!()"]/u.test(query);
}

async function searchCardsWithTolerance(query) {
  const direkt = await searchCards(query);
  if (direkt.cards.length) {
    return { ...direkt, mode: "direct" };
  }

  if (hasAdvancedScryfallSyntax(query)) {
    return { cards: [], mode: "none" };
  }

  try {
    const fuzzyCard = await fetchJson(`https://api.scryfall.com/cards/named?fuzzy=${encodeURIComponent(query)}`);
    return { cards: [fuzzyCard], mode: "fuzzy", correctedName: fuzzyCard.name };
  } catch {
    try {
      const auto = await fetchJson(`https://api.scryfall.com/cards/autocomplete?q=${encodeURIComponent(query)}`);
      const suggestion = auto?.data?.[0];
      if (!suggestion) {
        return { cards: [], mode: "none" };
      }

      const exactCard = await fetchJson(`https://api.scryfall.com/cards/named?exact=${encodeURIComponent(suggestion)}`);
      return { cards: [exactCard], mode: "autocomplete", correctedName: exactCard.name };
    } catch {
      return { cards: [], mode: "none" };
    }
  }
}

// Alle Prints einer Karte teilen sich dieselbe prints_search_uri, die
// taugt also als Schluessel. Gespeichert wird das Promise, damit zwei
// schnelle Klicks auf dieselbe Karte nur eine Anfrage ausloesen.
const printHistoryCache = new Map();

async function loadPrintHistory(card) {
  if (!card || !card.prints_search_uri) {
    return [];
  }

  const key = card.prints_search_uri;

  if (!printHistoryCache.has(key)) {
    const request = fetchJson(key)
      .then((data) =>
        (data.data || []).slice().sort((a, b) => new Date(a.released_at) - new Date(b.released_at))
      )
      .catch((error) => {
        // Fehlschlaege nicht behalten, sonst bleibt die Karte dauerhaft
        // ohne Versionen.
        printHistoryCache.delete(key);
        throw error;
      });

    printHistoryCache.set(key, request);
  }

  return printHistoryCache.get(key);
}

function isInCollection(id) {
  return state.collection.some((item) => item.id === id);
}

function getCardPreviewUrl(card) {
  return (
    card.image_uris?.normal ||
    card.image_uris?.large ||
    card.image_uris?.small ||
    card.card_faces?.[0]?.image_uris?.normal ||
    card.card_faces?.[0]?.image_uris?.large ||
    card.card_faces?.[0]?.image_uris?.small ||
    ""
  );
}

// Eine Ergebnisseite fasst 60 Karten, Scryfall liefert 175 je Antwort.
// Eine Abfrage reicht also für knapp drei Seiten.
const SEARCH_PAGE_SIZE = 60;

function setSearchResults(cards, { nextUrl = null, total = null } = {}) {
  state.results = cards;
  state.searchPage = 0;
  state.searchNextUrl = nextUrl;
  state.searchTotal = total ?? cards.length;
}

function searchPageCount() {
  const gesamt = Math.max(state.searchTotal, state.results.length);
  return Math.max(1, Math.ceil(gesamt / SEARCH_PAGE_SIZE));
}

function setDeckResults(cards, { nextUrl = null, total = null } = {}) {
  state.deckResults = cards;
  state.deckSearchPage = 0;
  state.deckSearchNextUrl = nextUrl;
  state.deckSearchTotal = total ?? cards.length;
}

function deckSearchPageCount() {
  const gesamt = Math.max(state.deckSearchTotal, state.deckResults.length);
  return Math.max(1, Math.ceil(gesamt / SEARCH_PAGE_SIZE));
}

// Blätterleiste für beide Suchen.
function pagerMarkup(seite, seiten) {
  if (seiten <= 1) {
    return "";
  }
  return `
    <div class="pager">
      <button type="button" class="retro-button" data-page="prev"${seite === 0 ? " disabled" : ""}>&lt; Zurück</button>
      <span class="pager-state">${escapeHtml(
        t("Seite {page} von {pages}", { page: seite + 1, pages: seiten })
      )}</span>
      <button type="button" class="retro-button" data-page="next"${seite >= seiten - 1 ? " disabled" : ""}>Weiter &gt;</button>
    </div>
    <p class="small-note pager-hint">Auf dem Handy kannst du auch seitwärts wischen.</p>
  `;
}

// Wischgesten für einen Ergebnisbereich. Nur deutlich waagrechte und lang
// genug gezogene Gesten zählen, sonst würde Scrollen umblättern.
function bindeWischen(bereich, blaettern) {
  let start = null;
  bereich.addEventListener(
    "touchstart",
    (event) => {
      start = event.touches.length === 1
        ? { x: event.touches[0].clientX, y: event.touches[0].clientY }
        : null;
    },
    { passive: true }
  );
  bereich.addEventListener(
    "touchend",
    (event) => {
      if (!start) return;
      const punkt = event.changedTouches[0];
      const dx = punkt.clientX - start.x;
      const dy = punkt.clientY - start.y;
      start = null;
      if (Math.abs(dx) < 60 || Math.abs(dx) < Math.abs(dy) * 1.5) return;
      blaettern(dx < 0 ? 1 : -1);
    },
    { passive: true }
  );
}

function updateResultCount() {
  // Angezeigt wird, was es insgesamt gibt, nicht was gerade geladen ist.
  const anzahl = Math.max(state.searchTotal, state.results.length);
  const text = `${anzahl} ${anzahl === 1 ? "card" : "cards"}`;
  els.resultCountOutputs.forEach((node) => {
    node.textContent = text;
  });
}

function updateCollectionCount() {
  const text = `${state.collection.length}`;
  els.collectionCountOutputs.forEach((node) => {
    node.textContent = text;
  });
}

// Ein Versionswechsel an einer gespeicherten Karte tauscht den Eintrag
// aus, statt eine zweite Karte anzulegen. Der Platz in der Collection
// bleibt erhalten, weil das Hinzufuegedatum mitwandert.
async function replaceCollectionCard(previousId, nextCard) {
  const index = state.collection.findIndex((item) => item.id === previousId);
  if (index === -1) {
    return false;
  }

  const previous = state.collection;
  const entry = entryFromCard(nextCard, state.collection[index].added_at || null);

  const updated = state.collection.slice();
  updated[index] = entry;
  state.collection = updated;

  saveCollection();
  renderCollection();

  if (!state.user) {
    return true;
  }

  try {
    await api.putCard(entry);
    await api.deleteCard(previousId);
    return true;
  } catch (error) {
    state.collection = previous;
    saveCollection();
    renderCollection();
    setStatus(`Version konnte in der Cloud nicht geändert werden: ${error.message}`, "err");
    return false;
  }
}

function renderCollectionViews() {
  renderCollection();
  renderSearchDetails();
  renderCollectionDetails();
}

async function toggleCollection(card) {
  if (!card) {
    return;
  }

  const removing = isInCollection(card.id);
  const entry = entryFromCard(card);
  const previous = state.collection;

  if (removing) {
    state.collection = state.collection.filter((item) => item.id !== card.id);

    if (state.collectionSelection?.id === card.id) {
      state.collectionSelection = null;
      state.collectionPrints = [];
      closeCollectionModal();
    }
  } else {
    state.collection = [entry, ...state.collection];
  }

  saveCollection();
  renderCollectionViews();
  setStatus(
    removing ? `${card.name} aus Collection entfernt.` : `${card.name} zur Collection hinzugefügt.`,
    "ok"
  );

  if (!state.user) {
    return;
  }

  // Im Cloud-Modus zaehlt erst der Server. Schlaegt der Aufruf fehl,
  // wird die Anzeige zurueckgedreht statt etwas Falsches zu zeigen.
  try {
    if (removing) {
      await api.deleteCard(card.id);
    } else {
      await api.putCard(entry);
    }
  } catch (error) {
    state.collection = previous;
    renderCollectionViews();
    setStatus(`Konnte nicht in der Cloud gespeichert werden: ${error.message}`, "err");
  }
}

// Blättert auf eine Seite und lädt dafür so viele Scryfall-Seiten nach,
// wie es braucht. Eine Antwort deckt fast drei Ergebnisseiten ab.
async function gotoSearchPage(seite) {
  const ziel = Math.max(0, Math.min(seite, searchPageCount() - 1));
  if (ziel === state.searchPage) {
    return;
  }

  const gebraucht = (ziel + 1) * SEARCH_PAGE_SIZE;
  while (state.results.length < gebraucht && state.searchNextUrl) {
    setStatus(t("Lade weitere Treffer..."), "muted");
    try {
      const weitere = await ladeSuchseite(state.searchNextUrl);
      state.results = [...state.results, ...weitere.cards];
      state.searchNextUrl = weitere.nextUrl;
    } catch (error) {
      setStatus(t("Weitere Treffer konnten nicht geladen werden: {error}", { error: error.message }), "err");
      break;
    }
  }

  state.searchPage = ziel;
  renderResults();
  els.results.scrollIntoView({ block: "start", behavior: "smooth" });
  setStatus(
    t("Seite {page} von {pages}, {count} Treffer insgesamt.", {
      page: ziel + 1,
      pages: searchPageCount(),
      count: Math.max(state.searchTotal, state.results.length)
    }),
    "ok"
  );
}

// Kachel fuer die Suchergebnisse. Beide Suchen zeigen dasselbe, nur der
// Knopf traegt ein anderes Datenattribut.
function suchKachel(card, { attribut, titel, aktiv = false }) {
  const preview = getCardPreviewUrl(card);
  return `
    <button
      type="button"
      class="search-tile${aktiv ? " active" : ""}"
      ${attribut}="${escapeHtml(card.id)}"
      title="${escapeHtml(titel)}"
    >
      <span class="tile-frame">
        ${
          preview
            ? `<img src="${escapeHtml(preview)}" alt="${escapeHtml(card.name)}" loading="lazy" />`
            : `<span class="search-fallback">${escapeHtml(card.name)}</span>`
        }
      </span>
      <span class="tile-caption">
        ${escapeHtml(card.name)}
        ${preisSpanne(card)}
      </span>
    </button>
  `;
}

function renderResults() {
  updateResultCount();

  if (!state.results.length) {
    els.results.innerHTML = `<div class="empty-state">Noch keine Treffer. Starte eine Suche oder nutze ein Beispiel.</div>`;
    return;
  }

  const seiten = searchPageCount();
  const start = state.searchPage * SEARCH_PAGE_SIZE;
  const aufDerSeite = state.results.slice(start, start + SEARCH_PAGE_SIZE);

  els.results.innerHTML = `
    <div class="search-grid">
      ${aufDerSeite
        .map((card) =>
          suchKachel(card, {
            attribut: "data-select",
            titel: card.name,
            aktiv: state.searchSelection?.id === card.id
          })
        )
        .join("")}
    </div>
    ${pagerMarkup(state.searchPage, seiten)}
  `;

  for (const btn of els.results.querySelectorAll("button[data-page]")) {
    btn.addEventListener("click", () => {
      gotoSearchPage(state.searchPage + (btn.dataset.page === "next" ? 1 : -1));
    });
  }

  for (const btn of els.results.querySelectorAll("button[data-select]")) {
    btn.addEventListener("click", () => {
      const card = state.results.find((item) => item.id === btn.dataset.select);
      if (card) {
        selectSearchCard(card);
      }
    });
  }
}

function renderCollection() {
  updateCollectionCount();

  if (!state.collection.length) {
    els.collection.innerHTML = `<div class="empty-state">Noch keine Karten gespeichert.</div>`;
    return;
  }

  els.collection.innerHTML = `
    <div class="collection-grid">
      ${state.collection
        .map(
          (card) => `
            <button
              type="button"
              class="collection-tile${state.collectionSelection?.id === card.id ? " active" : ""}"
              data-pick="${card.id}"
              title="${escapeHtml(card.name)}"
            >
              <span class="tile-frame">
                ${
                  card.image
                    ? `<img src="${escapeHtml(card.image)}" alt="${escapeHtml(card.name)}" loading="lazy" />`
                    : `<span class="collection-fallback">${escapeHtml(card.name)}</span>`
                }
              </span>
              <span class="tile-caption">${escapeHtml(card.name)}</span>
            </button>
          `
        )
        .join("")}
    </div>
  `;

  for (const entry of els.collection.querySelectorAll("button[data-pick]")) {
    entry.addEventListener("click", async () => {
      const id = entry.dataset.pick;
      // Eine eigene Karte steht vollständig in der Collection, da gibt es
      // nichts nachzuladen.
      const eigene = state.collection.find((item) => item.id === id);
      if (istEigeneKarte(id) && eigene) {
        await selectCollectionCard(eigeneKarteAus(eigene));
        return;
      }
      try {
        setStatus("Lade Karte aus Collection...", "muted");
        const card = await fetchJson(`https://api.scryfall.com/cards/${id}`);
        await selectCollectionCard(card);
      } catch (error) {
        setStatus(`Karte konnte nicht geladen werden: ${error.message}`, "err");
      }
    });
  }
}

function updateCollectionPreview(card) {
  const image = getCardPreviewUrl(card);
  if (!image) {
    return;
  }

  let changed = false;
  state.collection = state.collection.map((item) => {
    if (item.id === card.id && item.image !== image) {
      changed = true;
      return { ...item, image };
    }
    return item;
  });

  if (!changed) {
    return;
  }

  saveCollection();
  renderCollection();

  if (state.user) {
    const entry = state.collection.find((item) => item.id === card.id);
    if (entry) {
      api.putCard(entry).catch(() => {
        // Nur das Vorschaubild, ein Fehlschlag darf die Ansicht nicht stoeren.
      });
    }
  }
}

// In der Detailansicht steht nur der Knopf. Die Versionen selbst
// kommen in ein eigenes Fenster, damit die Detailansicht nicht von
// einer langen Bilderliste erschlagen wird.
function renderVersionSection(prints) {
  if (!prints.length) {
    return `
      <div>
        <h3>Versionen</h3>
        <p class="small-note">Keine Versionsdaten vorhanden.</p>
      </div>
    `;
  }

  if (prints.length === 1) {
    return `
      <div>
        <h3>Versionen</h3>
        <p class="small-note">Von dieser Karte gibt es nur diesen einen Print.</p>
      </div>
    `;
  }

  return `
    <div>
      <div class="versions-head">
        <h3>Versionen</h3>
        <button type="button" class="retro-button version-toggle" data-open-versions="1">
          Version ändern (${prints.length})
        </button>
      </div>
      <p class="small-note">Öffnet alle ${prints.length} Prints in einem eigenen Fenster.</p>
    </div>
  `;
}

function createDetailsHtml(card, prints, context) {
  if (!card) {
    return context === "search"
      ? `<p class="small-note">Noch keine Karte ausgewählt.</p>`
      : `<p class="small-note">Noch keine Karte aus der Collection geöffnet.</p>`;
  }

  const faceIndexes = {
    search: state.searchFaceIndex,
    collection: state.collectionFaceIndex,
    deck: state.deckFaceIndex
  };
  const activeFaceIndex = faceIndexes[context] ?? 0;
  // Eine eigene Karte hat weder Oracle-Text noch Set, Rarität oder
  // andere Ausgaben. Diese Abschnitte entfallen für sie ganz, statt
  // mit Fragezeichen gefüllt zu werden.
  const eigene = istEigeneKarte(card.id);
  const inDeck = state.activeDeckCards.some((entry) => entry.id === card.id);
  const hasFaces = Array.isArray(card.card_faces) && card.card_faces.length > 1;
  const safeFaceIndex = hasFaces ? Math.max(0, Math.min(activeFaceIndex, card.card_faces.length - 1)) : 0;
  const face = hasFaces ? card.card_faces[safeFaceIndex] : null;
  const img = face?.image_uris?.normal || card.image_uris?.normal || card.card_faces?.[0]?.image_uris?.normal || "";
  const oracleText =
    face?.oracle_text ||
    card.oracle_text ||
    card.card_faces?.map((entry) => entry.oracle_text || "").filter(Boolean).join("\n\n") ||
    "Kein Oracle Text vorhanden.";
  const cardName = face?.name || card.name;
  // Bei einer eigenen Karte steht dort dasselbe Wort, unter dem sie im
  // Deck einsortiert ist, damit beides zusammenpasst.
  const typeLine = eigene
    ? card.type_line
      ? t(typKategorie(card.type_line))
      : t(EIGENE_SET)
    : face?.type_line || card.type_line || "Unbekannter Typ";
  const canFlip =
    hasFaces &&
    card.card_faces.every((entry) => Boolean(entry.image_uris?.normal || entry.image_uris?.large || entry.image_uris?.small));

  return `
    <div class="details-grid">
      <div class="preview-wrap">
        ${img ? `<img class="preview" src="${escapeHtml(img)}" alt="${escapeHtml(cardName)}" />` : `<p class="small-note">Kein Bild vorhanden.</p>`}
        ${
          canFlip
            ? `<button type="button" class="flip-btn" data-flip-face="1" data-context="${context}" aria-label="Kartenseite wechseln" title="Kartenseite wechseln">↻</button>`
            : ""
        }
        <div class="details-actions">
          ${
            context === "deck"
              ? `<button type="button" class="retro-button collection-button${inDeck ? " is-saved" : ""}" data-toggle-deck="${card.id}">
                   <span class="collection-button-icon" aria-hidden="true">${inDeck ? "−" : "+"}</span>
                   <span>${inDeck ? "Aus dem Deck entfernen" : "Hinzufügen"}</span>
                 </button>`
              : `<button type="button" class="retro-button collection-button${isInCollection(card.id) ? " is-saved" : ""}" data-toggle-collection="${card.id}">
                   <span class="collection-button-icon" aria-hidden="true">${isInCollection(card.id) ? "★" : "☆"}</span>
                   <span>${isInCollection(card.id) ? "Aus Collection entfernen" : "In Collection speichern"}</span>
                 </button>`
          }
        </div>
      </div>

      <div class="meta">
        <div>
          <h3>${escapeHtml(cardName)}</h3>
          <p class="small-note">${escapeHtml(typeLine)}</p>
          <div class="pill-row details-pills">
            ${
              eigene
                ? `<span class="pill">${escapeHtml(t(EIGENE_SET))}</span>
                   <span class="pill">${escapeHtml(
                     farbkuerzel(eigeneKarteMerkmale(card.id).colorIdentity)
                   )}</span>`
                : `<span class="pill">Set: ${escapeHtml(card.set_name || "?")}</span>
                   <span class="pill">Release: ${escapeHtml(card.released_at || "?")}</span>
                   <span class="pill">Rarity: ${escapeHtml(card.rarity || "?")}</span>`
            }
          </div>
        </div>

        ${
          eigene
            ? `<p class="small-note">${escapeHtml(
                t("Selbst angelegt, darum ohne Oracle-Text, Preis und weitere Ausgaben.")
              )}</p>`
            : `<div class="analysis">
                 <h3>Oracle Text</h3>
                 <div class="raw">${escapeHtml(oracleText)}</div>
               </div>

               ${renderVersionSection(prints)}`
        }
      </div>
    </div>
  `;
}

function bindDetailsEvents(container, context) {
  const toggleBtn = container.querySelector("button[data-toggle-collection]");
  if (toggleBtn) {
    toggleBtn.addEventListener("click", () => {
      const card = context === "search" ? state.searchSelection : state.collectionSelection;
      toggleCollection(card);
    });
  }

  const openVersions = container.querySelector("button[data-open-versions]");
  if (openVersions) {
    openVersions.addEventListener("click", () => openVersionModal(context));
  }

  const deckToggle = container.querySelector("button[data-toggle-deck]");
  if (deckToggle) {
    deckToggle.addEventListener("click", async () => {
      const card = state.deckSelection;
      if (!card) {
        return;
      }
      if (state.activeDeckCards.some((entry) => entry.id === card.id)) {
        await removeDeckCard(card.id);
      } else {
        await addCardToDeck(card);
      }
      renderDeckCardDetails();
    });
  }

  const flipBtn = container.querySelector("button[data-flip-face]");
  if (flipBtn) {
    flipBtn.addEventListener("click", () => {
      if (context === "deck") {
        const faces = state.deckSelection?.card_faces || [];
        if (faces.length > 1) {
          state.deckFaceIndex = state.deckFaceIndex === 0 ? 1 : 0;
          renderDeckCardDetails();
        }
      } else if (context === "search") {
        const faces = state.searchSelection?.card_faces || [];
        if (faces.length > 1) {
          state.searchFaceIndex = state.searchFaceIndex === 0 ? 1 : 0;
          renderSearchDetails();
        }
      } else {
        const faces = state.collectionSelection?.card_faces || [];
        if (faces.length > 1) {
          state.collectionFaceIndex = state.collectionFaceIndex === 0 ? 1 : 0;
          renderCollectionDetails();
        }
      }
    });
  }
}

// Das Versionsfenster nutzt bewusst dieselben Klassen wie das
// Suchergebnis-Raster, damit die Karten dort gleich gross erscheinen.
function renderVersionModal() {
  const context = state.versionModalContext;
  if (!context || !els.versionList) {
    return;
  }

  const sources = {
    collection: [state.collectionSelection, state.collectionPrints],
    deck: [state.deckSelection, state.deckPrints]
  };
  const [card, prints] = sources[context] || [state.searchSelection, state.searchPrints];

  if (els.versionModalTitle) {
    els.versionModalTitle.textContent = card ? `versions - ${card.name.toLowerCase()}` : "card versions";
  }
  if (els.versionModalNote) {
    els.versionModalNote.textContent = `${prints.length} Prints. Klick auf ein Bild, um zu dieser Version zu wechseln.`;
  }

  els.versionList.innerHTML = prints
    .map((print) => {
      const preview = getCardPreviewUrl(print);
      const active = print.id === card?.id;
      return `
        <button
          type="button"
          class="search-tile version-tile${active ? " active" : ""}"
          data-print="${print.id}"
          data-context="${context}"
          title="${escapeHtml(print.set_name || "Unbekanntes Set")}"
          ${active ? 'aria-current="true"' : ""}
        >
          <span class="tile-frame">
            ${
              preview
                ? `<img src="${escapeHtml(preview)}" alt="${escapeHtml(print.set_name || print.name)}" loading="lazy" />`
                : `<span class="version-fallback">${escapeHtml(print.set_name || "?")}</span>`
            }
          </span>
          <span class="tile-caption">
            ${escapeHtml(print.set_name || "Unbekanntes Set")}
            <small>${escapeHtml(print.collector_number || "?")} - ${escapeHtml(print.released_at || "?")}</small>
            ${preisSpanne(print)}
          </span>
        </button>
      `;
    })
    .join("");

  for (const tile of els.versionList.querySelectorAll("button[data-print]")) {
    tile.addEventListener("click", async () => {
      const targetContext = tile.dataset.context;

      try {
        setStatus("Lade Version...", "muted");
        const selectedPrint = await fetchJson(`https://api.scryfall.com/cards/${tile.dataset.print}`);
        // Nach der Wahl schliesst sich das Fenster wieder, darum kuemmert
        // sich selectSearchCard bzw. selectCollectionCard.
        if (targetContext === "deck") {
          // Steht die Karte schon im Deck, wird dort die Ausgabe
          // getauscht. Sonst wird nur die Detailansicht umgestellt.
          const previous = state.deckSelection;
          const entry = state.activeDeckCards.find((card) => card.id === previous?.id);

          state.deckSelection = selectedPrint;
          state.deckFaceIndex = 0;
          closeVersionModal();

          if (entry) {
            state.deckVersionCard = entry;
            await applyDeckVersion(selectedPrint);
          }
          renderDeckCardDetails();
        } else if (targetContext === "deckcard") {
          closeVersionModal();
          await applyDeckVersion(selectedPrint);
        } else if (targetContext === "commander") {
          closeVersionModal();
          await applyCommanderVersion(selectedPrint, state.versionSlot || "commander");
        } else if (targetContext === "search") {
          await selectSearchCard(selectedPrint);
        } else {
          const previousId = state.collectionSelection?.id;
          const shouldReplace =
            previousId && previousId !== selectedPrint.id && isInCollection(previousId);
          const replaced = shouldReplace ? await replaceCollectionCard(previousId, selectedPrint) : false;

          await selectCollectionCard(selectedPrint);

          if (replaced) {
            setStatus(
              `Gespeicherte Karte auf ${selectedPrint.set_name || "andere Version"} umgestellt.`,
              "ok"
            );
          }
        }
      } catch (error) {
        setStatus(`Version konnte nicht geladen werden: ${error.message}`, "err");
      }
    });
  }
}

function openVersionModal(context) {
  if (!els.versionModal) {
    return;
  }
  state.versionModalContext = context;
  renderVersionModal();
  els.versionModal.classList.add("open");
  els.versionModal.setAttribute("aria-hidden", "false");
}

function closeVersionModal() {
  if (!els.versionModal) {
    return;
  }
  state.versionModalContext = null;
  els.versionModal.classList.remove("open");
  els.versionModal.setAttribute("aria-hidden", "true");
}

function renderSearchDetails() {
  els.searchDetails.innerHTML = createDetailsHtml(state.searchSelection, state.searchPrints, "search");
  bindDetailsEvents(els.searchDetails, "search");
}

function renderCollectionDetails() {
  els.collectionDetails.innerHTML = createDetailsHtml(state.collectionSelection, state.collectionPrints, "collection");
  bindDetailsEvents(els.collectionDetails, "collection");
}

async function selectSearchCard(card) {
  // Jede Auswahl bekommt eine Nummer. Trifft die Antwort einer aelteren
  // Auswahl spaeter ein, wird sie verworfen, statt die aktuelle Karte
  // mit fremden Versionen zu ueberschreiben.
  const requestId = ++selectionCounters.search;

  state.searchSelection = card;
  state.searchFaceIndex = 0;
  // Sofort leeren, sonst zeigt die Detailansicht bis zum Eintreffen der
  // neuen Liste noch die Versionen der vorherigen Karte an.
  state.searchPrints = [];
  closeVersionModal();
  renderResults();
  renderSearchDetails();
  openSearchModal();
  setStatus(`Lade Versionshistorie für ${card.name}...`, "muted");

  try {
    const prints = await loadPrintHistory(card);
    if (requestId !== selectionCounters.search) {
      return;
    }
    state.searchPrints = prints;
    renderSearchDetails();
    setStatus(`Karte geladen: ${card.name}`, "ok");
  } catch (error) {
    if (requestId !== selectionCounters.search) {
      return;
    }
    state.searchPrints = [];
    renderSearchDetails();
    setStatus(`Versionshistorie konnte nicht geladen werden: ${error.message}`, "err");
  }
}

async function selectCollectionCard(card) {
  const requestId = ++selectionCounters.collection;

  state.collectionSelection = card;
  state.collectionFaceIndex = 0;
  state.collectionPrints = [];
  closeVersionModal();
  updateCollectionPreview(card);
  renderCollection();
  renderCollectionDetails();
  openCollectionModal();
  setStatus(`Lade Versionshistorie für ${card.name}...`, "muted");

  try {
    const prints = await loadPrintHistory(card);
    if (requestId !== selectionCounters.collection) {
      return;
    }
    state.collectionPrints = prints;
    renderCollectionDetails();
    setStatus(`Collection-Karte geladen: ${card.name}`, "ok");
  } catch (error) {
    if (requestId !== selectionCounters.collection) {
      return;
    }
    state.collectionPrints = [];
    renderCollectionDetails();
    setStatus(`Versionshistorie konnte nicht geladen werden: ${error.message}`, "err");
  }
}

async function runSearch() {
  const query = els.searchInput.value.trim();
  if (!query) {
    setStatus("Bitte einen Suchbegriff eingeben.", "err");
    return;
  }

  setStatus(`Suche nach ${query}...`, "muted");
  try {
    const result = await searchCardsWithTolerance(query);
    setSearchResults(result.cards, { nextUrl: result.nextUrl, total: result.total });
    renderResults();

    if (state.results.length) {
      if (result.mode === "fuzzy" || result.mode === "autocomplete") {
        setStatus(`Kein exakter Treffer. Zeige ähnlichen Treffer: ${result.correctedName}`, "ok");
      } else if (searchPageCount() > 1) {
        setStatus(
          t("{count} Treffer gefunden, aufgeteilt auf {pages} Seiten.", {
            count: state.searchTotal,
            pages: searchPageCount()
          }),
          "ok"
        );
      } else {
        setStatus(`${state.results.length} Treffer gefunden.`, "ok");
      }
    } else {
      state.searchSelection = null;
      state.searchPrints = [];
      renderSearchDetails();
      setStatus("Keine Treffer gefunden.", "err");
    }
  } catch (error) {
    setSearchResults([]);
    state.searchSelection = null;
    state.searchPrints = [];
    renderResults();
    renderSearchDetails();
    setStatus(`Fehler bei der Suche: ${error.message}`, "err");
  }
}

async function loadRandomCard() {
  openSearchRoute();
  setStatus("Ziehe Zufallskarte...", "muted");

  try {
    // Standardländer überspringen: Als Zufallsfund sind sie wertlos, und
    // es gibt sehr viele davon. -t:basic erfasst auch die verschneiten
    // Varianten, denn die tragen dieselbe Typangabe.
    const card = await fetchRandomCard("-t:basic");
    setSearchResults([card]);
    renderResults();
    await selectSearchCard(card);
    setStatus(t("Zufallskarte geladen: {name}", { name: card.name }), "ok");
  } catch (error) {
    setStatus(`Zufallskarte konnte nicht geladen werden: ${error.message}`, "err");
  }
}

// is:commander deckt bei Scryfall genau die Karten ab, die Commander
// sein dürfen: legendäre Kreaturen und die Planeswalker und Karten, die
// es ausdrücklich erlauben.
//
// game:paper hält die reinen Digitalkarten heraus, also die Alchemy-
// Varianten mit A- im Namen und Arena-eigene Karten. Auf Papier gibt es
// rund 3550 mögliche Commander, mit den digitalen wären es 3680.
async function loadRandomCommander() {
  openSearchRoute();
  setStatus("Ziehe zufälligen Commander...", "muted");

  try {
    const card = await fetchRandomCard("is:commander game:paper");
    setSearchResults([card]);
    renderResults();
    await selectSearchCard(card);
    setStatus(`Zufälliger Commander: ${card.name}`, "ok");
  } catch (error) {
    setStatus(`Commander konnte nicht geladen werden: ${error.message}`, "err");
  }
}

// Wie loadRandomCommander, aber ohne die Detailansicht aufzureissen:
// Die Karte landet nur in der Trefferliste.
async function searchRandomCommander() {
  openSearchRoute();
  setStatus("Ziehe zufälligen Commander...", "muted");

  try {
    const card = await fetchRandomCard("is:commander game:paper");
    setSearchResults([card]);
    state.searchSelection = null;
    state.searchPrints = [];
    renderResults();
    renderSearchDetails();
    setStatus(`Zufälliger Commander: ${card.name}`, "ok");
  } catch (error) {
    setStatus(`Commander konnte nicht geladen werden: ${error.message}`, "err");
  }
}

function bindQueryButtons() {
  els.queryButtons.forEach((button) => {
    button.addEventListener("click", async () => {
      const query = button.dataset.query || "";
      els.searchInput.value = query;
      openSearchRoute();

      if (button.dataset.autorun === "true") {
        await runSearch();
      }
    });
  });
}

function bindRandomButtons() {
  els.randomButtons.forEach((button) => {
    button.addEventListener("click", async () => {
      await loadRandomCard();
    });
  });
}

els.searchBtn.addEventListener("click", runSearch);
els.searchInput.addEventListener("keydown", (event) => {
  if (event.key === "Enter") {
    runSearch();
  }
});

window.addEventListener("hashchange", renderRoute);

// Ein Klick auf den Menüpunkt, auf dem man schon steht, ändert die Adresse
// nicht, also meldet der Browser auch keinen Wechsel. Ohne das hier bliebe
// im Deck-Tab das offene Deck stehen, statt auf die Übersicht zu gehen.
for (const link of els.navLinks) {
  const href = link.getAttribute("href");
  if (!href) {
    continue;
  }
  link.addEventListener("click", () => {
    if (normalizeRoute(href) === normalizeRoute(window.location.hash)) {
      renderRoute();
    }
  });
}
// Escape schliesst zuerst nur das Versionsfenster, damit man nicht aus
// der Detailansicht fliegt, bloss weil man die Auswahl wegklicken will.
window.addEventListener("keydown", (event) => {
  if (event.key !== "Escape") {
    return;
  }
  if (state.versionModalContext) {
    closeVersionModal();
    return;
  }
  closeDeckCardModal();
  closeSearchModal();
  closeCollectionModal();
});

if (els.modalCloseBtn) {
  els.modalCloseBtn.addEventListener("click", closeSearchModal);
}

if (els.searchModal) {
  els.searchModal.addEventListener("click", (event) => {
    if (event.target === els.searchModal) {
      closeSearchModal();
    }
  });
}

if (els.deckCardModalCloseBtn) {
  els.deckCardModalCloseBtn.addEventListener("click", closeDeckCardModal);
}

if (els.deckCardModal) {
  els.deckCardModal.addEventListener("click", (event) => {
    if (event.target === els.deckCardModal) {
      closeDeckCardModal();
    }
  });
}

if (els.versionModalCloseBtn) {
  els.versionModalCloseBtn.addEventListener("click", closeVersionModal);
}

if (els.versionModal) {
  els.versionModal.addEventListener("click", (event) => {
    if (event.target === els.versionModal) {
      closeVersionModal();
    }
  });
}

if (els.collectionModalCloseBtn) {
  els.collectionModalCloseBtn.addEventListener("click", closeCollectionModal);
}

if (els.collectionModal) {
  els.collectionModal.addEventListener("click", (event) => {
    if (event.target === els.collectionModal) {
      closeCollectionModal();
    }
  });
}

function setDeckStatus(text, type = "muted") {
  schreibeStatus(els.deckStatus, text, type);
}

// Karten, von denen ein Deck beliebig viele haben darf. Das sind
// Standardländer und die Relentless-Karten. Statt dafür pro Karte den
// Scryfall-Tag abzufragen, wird der Regeltext geprüft: Genau diese
// Karten tragen den Satz "A deck can have any number of cards named".
// Das spart eine Anfrage je Karte und funktioniert auch offline.
function allowsAnyNumber(card) {
  const type = card.type_line || "";
  if (/\bBasic\b/i.test(type) && /\bLand\b/i.test(type)) {
    return true;
  }

  const text = [card.oracle_text, ...(card.card_faces || []).map((face) => face.oracle_text)]
    .filter(Boolean)
    .join(" ");
  return /any number of cards named/i.test(text);
}

// Commander darf sein: jede legendäre Kreatur, dazu Karten, die es
// ausdrücklich erlauben. Das betrifft vor allem Planeswalker wie
// Commodore Guff, die keine Kreaturen sind.
function canBeCommander(card) {
  const text = [card.oracle_text, ...(card.card_faces || []).map((face) => face.oracle_text)]
    .filter(Boolean)
    .join(" ");
  if (/can be your commander/i.test(text)) {
    return true;
  }

  const type = card.type_line || "";
  return /Legendary/i.test(type) && /Creature/i.test(type);
}

function getCardArtUrl(card) {
  return card.image_uris?.art_crop || card.card_faces?.[0]?.image_uris?.art_crop || null;
}

function deckCardFromScryfall(card) {
  return {
    id: card.id,
    name: card.name,
    set_name: card.set_name ?? null,
    image: getCardPreviewUrl(card) || card.image || null,
    unlimited: istEigeneKarte(card.id) || allowsAnyNumber(card)
  };
}

function aktuelleDeckListe() {
  return state.deckTab === "community" ? state.communityDecks : state.decks;
}

function renderDeckList() {
  const fremd = state.deckTab === "community";
  const decks = aktuelleDeckListe();
  els.deckCount.textContent = `${decks.length} ${decks.length === 1 ? "deck" : "decks"}`;

  if (!decks.length) {
    els.deckList.innerHTML = `<div class="empty-state">${escapeHtml(
      fremd
        ? t("Noch hat niemand ein Deck öffentlich gestellt.")
        : t("Noch keine Decks. Gib oben einen Namen ein und leg los.")
    )}</div>`;
    return;
  }

  const bild = (deck) =>
    deck.commander?.art || deck.commander?.image
      ? `<img class="${deck.commander.art ? "" : "is-full-card"}" src="${escapeHtml(
          deck.commander.art || deck.commander.image
        )}" alt="Artwork von ${escapeHtml(deck.commander.name || "")}" loading="lazy" />`
      : `<span class="deck-tile-empty">Kein Commander gewählt</span>`;

  els.deckList.innerHTML = decks
    .map((deck) => {
      // Commander und Partner zählen beim Preis mit wie bei der Kartenzahl.
      const preis = preisSumme([
        ...(deck.cards || []),
        ...deckCommanders(deck).map((karte) => ({ id: karte.id, quantity: 1 }))
      ]);
      const info = `${t(deck.cardCount === 1 ? "{count} Karte" : "{count} Karten", {
        count: deck.cardCount
      })} · ${escapeHtml(preisText(preis))}${
        deck.commander
          ? ` · ${escapeHtml(deckCommanders(deck).map((karte) => karte.name).join(" & "))}`
          : ""
      }${fremd && deck.owner ? ` · ${escapeHtml(deck.owner)}` : ""}`;

      // Ein fremdes Deck lässt sich nur öffnen, nicht umbenennen.
      if (fremd) {
        return `
          <div class="deck-tile">
            <button type="button" class="deck-tile-open" data-public-deck="${escapeHtml(deck.id)}" title="${escapeHtml(deck.name)} ansehen">
              ${bild(deck)}
              <span class="deck-tile-body">
                <strong>${escapeHtml(deck.name)}</strong>
                <span>${info}</span>
              </span>
            </button>
          </div>
        `;
      }

      // Beim Umbenennen tritt an die Stelle des Namens ein Eingabefeld.
      // Der Öffnen-Knopf entfällt so lange, damit ein Klick ins Feld
      // nicht das Deck aufmacht.
      if (state.renamingDeckId === deck.id) {
        return `
          <div class="deck-tile is-renaming">
            <span class="deck-tile-open">${bild(deck)}</span>
            <span class="deck-tile-body">
              <input class="deck-rename-input" type="text" maxlength="80" value="${escapeHtml(deck.name)}" aria-label="Deckname" />
              <span>${info}</span>
            </span>
          </div>
        `;
      }

      return `
        <div class="deck-tile">
          <button type="button" class="deck-tile-open" data-deck="${escapeHtml(deck.id)}" title="${escapeHtml(deck.name)} öffnen">
            ${bild(deck)}
            <span class="deck-tile-body">
              <strong>${escapeHtml(deck.name)}</strong>
              <span>${info}</span>
            </span>
          </button>
          <button type="button" class="deck-tile-rename" data-rename="${escapeHtml(deck.id)}" title="Deck umbenennen" aria-label="${escapeHtml(deck.name)} umbenennen">✎</button>
        </div>
      `;
    })
    .join("");

  for (const tile of els.deckList.querySelectorAll("button[data-deck]")) {
    tile.addEventListener("click", () => openDeck(tile.dataset.deck));
  }

  for (const tile of els.deckList.querySelectorAll("button[data-public-deck]")) {
    tile.addEventListener("click", () => openPublicDeck(tile.dataset.publicDeck));
  }

  for (const btn of els.deckList.querySelectorAll("button[data-rename]")) {
    btn.addEventListener("click", () => {
      state.renamingDeckId = btn.dataset.rename;
      renderDeckList();
    });
  }

  const input = els.deckList.querySelector(".deck-rename-input");
  if (input) {
    bindRenameInput(input);
  }
}

function bindRenameInput(input) {
  const deckId = state.renamingDeckId;
  let erledigt = false;

  input.focus();
  input.select();

  const abbrechen = () => {
    if (erledigt) {
      return;
    }
    erledigt = true;
    state.renamingDeckId = null;
    renderDeckList();
  };

  const speichern = async () => {
    if (erledigt) {
      return;
    }
    erledigt = true;

    const name = input.value.trim();
    state.renamingDeckId = null;

    if (!name || name === state.decks.find((deck) => deck.id === deckId)?.name) {
      renderDeckList();
      return;
    }

    try {
      await deckStore.update(deckId, { name });
      await refreshDecks();
      setDeckStatus(`Deck heisst jetzt "${name}".`, "ok");
    } catch (error) {
      renderDeckList();
      setDeckStatus(error.message, "err");
    }
  };

  input.addEventListener("keydown", (event) => {
    if (event.key === "Enter") {
      event.preventDefault();
      speichern();
    } else if (event.key === "Escape") {
      event.preventDefault();
      abbrechen();
    }
  });
  input.addEventListener("blur", speichern);
}

async function refreshDecks() {
  try {
    state.decks = await deckStore.list();
    renderDeckList();
    ladeDeckPreise();
  } catch (error) {
    setDeckStatus(`Decks konnten nicht geladen werden: ${error.message}`, "err");
  }
}

// --- Community Decks ------------------------------------------------------
//
// Ein öffentliches Deck gehört weiterhin seinem Konto. Hier wird es nur
// angesehen: derselbe Editor, aber ohne alles, was es ändern würde.

function aktualisiereDeckListe() {
  return state.deckTab === "community" ? refreshCommunityDecks() : refreshDecks();
}

function setDeckTab(tab) {
  state.deckTab = tab === "community" ? "community" : "mine";
  const fremd = state.deckTab === "community";

  els.deckOwnTools.hidden = fremd;
  els.deckCommunityNote.hidden = !fremd;
  els.deckPanelTitle.textContent = fremd ? "community decks" : "my decks";

  renderDeckList();
  aktualisiereDeckListe();
}

async function refreshCommunityDecks() {
  setDeckStatus(t("Öffentliche Decks werden geladen..."), "muted");
  try {
    state.communityDecks = (await api.listPublicDecks()).decks;
    renderDeckList();
    ladeDeckPreise();
    setDeckStatus(
      t(state.communityDecks.length === 1 ? "{count} öffentliches Deck." : "{count} öffentliche Decks.", {
        count: state.communityDecks.length
      }),
      "ok"
    );
  } catch (error) {
    setDeckStatus(
      t("Öffentliche Decks konnten nicht geladen werden: {error}", { error: error.message }),
      "err"
    );
  }
}

async function openPublicDeck(deckId) {
  setDeckStatus(t("Deck wird geladen..."), "muted");
  try {
    const result = await api.getPublicDeck(deckId);
    state.deckReadOnly = true;
    els.deckOverview.hidden = true;
    els.deckEditor.hidden = false;
    els.deckEditor.classList.add("is-readonly");
    applyDeckResult(result);
    setDeckStatus(
      result.deck.owner
        ? t("Deck von {name}. Ansehen geht, ändern nicht.", { name: result.deck.owner })
        : t("Fremdes Deck. Ansehen geht, ändern nicht."),
      "muted"
    );
  } catch (error) {
    setDeckStatus(t("Deck konnte nicht geladen werden: {error}", { error: error.message }), "err");
  }
}

// Die Knöpfe sind im Nur-Lesen-Modus ausgeblendet. Das hier hält
// zusätzlich die Funktionen dahinter an, damit auch ein Tastenkürzel
// oder ein alter Verweis nichts ändert.
function deckAenderbar() {
  if (state.deckReadOnly) {
    setDeckStatus(t("Dieses Deck gehört jemand anderem und lässt sich nur ansehen."), "muted");
    return false;
  }
  return true;
}

// --- Deck-Einstellungen ---------------------------------------------------
//
// Bisher steht hier nur die Sichtbarkeit. Format und Bracket bekommen
// später an derselben Stelle ihren Platz.

function openDeckSettings() {
  if (!state.activeDeck || !deckAenderbar()) {
    return;
  }
  els.deckPublicToggle.checked = Boolean(state.activeDeck.isPublic);
  // Ohne Konto liegt das Deck nur in diesem Browser; es gäbe nichts, was
  // andere aufrufen könnten.
  els.deckPublicToggle.disabled = !state.user;
  schreibeStatus(
    els.deckSettingsStatus,
    state.user ? t("Bereit.") : t("Veröffentlichen geht nur mit einem Konto."),
    state.user ? "muted" : "err"
  );
  openModal(els.deckSettingsModal);
}

async function deckSichtbarkeitAendern() {
  if (!state.activeDeck || !deckAenderbar()) {
    return;
  }
  const oeffentlich = els.deckPublicToggle.checked;
  schreibeStatus(els.deckSettingsStatus, t("Wird gespeichert..."), "muted");
  try {
    applyDeckResult(await deckStore.update(state.activeDeck.id, { isPublic: oeffentlich }));
    schreibeStatus(
      els.deckSettingsStatus,
      oeffentlich ? t("Das Deck ist jetzt öffentlich.") : t("Das Deck ist wieder privat."),
      "ok"
    );
  } catch (error) {
    // Das Häkchen zurückdrehen, sonst zeigt es etwas an, was nicht gilt.
    els.deckPublicToggle.checked = !oeffentlich;
    schreibeStatus(els.deckSettingsStatus, error.message, "err");
  }
}

// Die Übersicht steht sofort, die Preise kommen nach. Beim ersten Mal
// kostet das ein paar Abfragen, danach liegt alles im Cache.
async function ladeDeckPreise() {
  const ids = aktuelleDeckListe().flatMap((deck) => [
    ...(deck.cards || []).map((karte) => karte.id),
    ...deckCommanders(deck).map((karte) => karte.id)
  ]);
  if (!ids.length) {
    return;
  }
  try {
    await ensureLegality(ids);
    renderDeckList();
  } catch {
    // Ohne Scryfall bleibt die Übersicht ohne Preise, sonst unverändert.
  }
}

function showDeckOverview() {
  state.activeDeck = null;
  state.activeDeckCards = [];
  state.deckReadOnly = false;
  els.deckEditor.classList.remove("is-readonly");
  els.deckOverview.hidden = false;
  els.deckEditor.hidden = true;
  renderDeckList();
}

// --- Commander und Partner ------------------------------------------------
// Ein Deck hat einen Commander und kann einen zweiten haben, wenn beide
// sich den Platz teilen dürfen: Partner, Friends forever, Choose a
// Background und Verwandte. Überall, wo gezählt, gefärbt oder geprüft
// wird, gilt die Liste beider. Mit nur einem Commander sieht alles aus
// wie zuvor.

const COMMANDER_PLAETZE = ["commander", "partner"];

function deckCommanders(deck = state.activeDeck) {
  return [deck?.commander, deck?.partner].filter(Boolean);
}

// Die Farbidentität eines Paars ist die Vereinigung beider. Ist sie für
// einen der beiden nicht bekannt, gilt sie als unbekannt: Lieber gar
// nicht prüfen als gegen einen halben Rahmen.
function commanderIdentitaet() {
  const commanders = deckCommanders();
  if (!commanders.length) {
    return null;
  }
  const farben = new Set();
  for (const karte of commanders) {
    const eigene = cardInfoCache.get(karte.id)?.colorIdentity;
    if (!eigene) {
      return null;
    }
    for (const farbe of eigene) {
      farben.add(farbe);
    }
  }
  return ["W", "U", "B", "R", "G"].filter((farbe) => farben.has(farbe));
}

// Dürfen diese zwei sich den Commander-Platz teilen? true, false, oder
// null, wenn es sich nicht sagen lässt, weil Scryfall die
// Schlüsselwörter einer der beiden Karten nicht kennt.
function partnerPaarGueltig(a, b) {
  const ka = cardInfoCache.get(a.id);
  const kb = cardInfoCache.get(b.id);
  if (!Array.isArray(ka?.keywords) || !Array.isArray(kb?.keywords)) {
    return null;
  }
  const hat = (info, wort) => info.keywords.includes(wort);
  const beide = (wort) => hat(ka, wort) && hat(kb, wort);
  const einerMitTyp = (wort, typ) =>
    (hat(ka, wort) && hatTyp(kb.typeLine || "", typ)) || (hat(kb, wort) && hatTyp(ka.typeLine || "", typ));

  return (
    beide("Partner") ||
    beide("Partner with") ||
    beide("Friends forever") ||
    einerMitTyp("Choose a background", "Background") ||
    einerMitTyp("Doctor's companion", "Doctor")
  );
}

// Ein Eintrag im Commander-Feld: Bild, Name, Knöpfe. Bei einem einzelnen
// Commander genau der Aufbau von früher, bei zweien steht derselbe
// Eintrag zweimal nebeneinander.
function commanderEintragHtml(karte, platz) {
  const rot = state.deckProblemCards.has(karte.id) ? " is-illegal" : "";
  const bezeichnung = platz === "partner" ? "Partner" : "Commander";
  const hinweis =
    platz === "partner"
      ? t("Teilt sich den Platz mit {name}.", { name: state.activeDeck.commander?.name || "" })
      : "Sein Bild steht in der Übersicht für dieses Deck.";
  return `
    ${
      karte.image
        ? `<button type="button" class="deck-card-thumb${rot}" data-commander-version="${platz}" title="Version von ${escapeHtml(
            karte.name
          )} wechseln" aria-label="Version von ${escapeHtml(karte.name)} wechseln"><img src="${escapeHtml(
            karte.image
          )}" alt="${escapeHtml(karte.name)}" /></button>`
        : `<span class="commander-empty">?</span>`
    }
    <div>
      <span class="field-label">${bezeichnung}</span>
      <strong>${escapeHtml(karte.name)}</strong>
      <p class="small-note">${escapeHtml(hinweis)}</p>
      <div class="button-row">
        <button type="button" data-commander-absetzen="${platz}" class="retro-button commander-star" title="${t("Als Commander entfernen")}" aria-label="${t("Als Commander entfernen")}">★</button>
        <button type="button" data-commander-entfernen="${platz}" class="retro-button">Karte entfernen</button>
      </div>
    </div>
  `;
}

function renderCommanderSlot() {
  const deck = state.activeDeck;
  const commander = deck?.commander;
  const partner = deck?.partner;

  els.commanderSlot.classList.toggle("is-paar", Boolean(commander && partner));

  if (!commander) {
    els.commanderSlot.innerHTML = `
      <span class="commander-empty">?</span>
      <div>
        <span class="field-label">Commander</span>
        <strong>Noch keiner gewählt</strong>
        <p class="small-note">Mit dem Stern bei einer Karte im Deck festlegen.</p>
        <div class="button-row">
          <button type="button" id="customCommanderBtn" class="retro-button">Eigener Commander</button>
        </div>
      </div>
    `;
  } else if (!partner) {
    els.commanderSlot.innerHTML = commanderEintragHtml(commander, "commander");
  } else {
    els.commanderSlot.innerHTML = COMMANDER_PLAETZE.map(
      (platz) => `<div class="commander-eintrag">${commanderEintragHtml(deck[platz], platz)}</div>`
    ).join("");
  }

  for (const btn of els.commanderSlot.querySelectorAll("[data-commander-absetzen]")) {
    btn.addEventListener("click", () => demoteCommander(btn.dataset.commanderAbsetzen));
  }
  for (const btn of els.commanderSlot.querySelectorAll("[data-commander-entfernen]")) {
    btn.addEventListener("click", () => removeCommanderCard(btn.dataset.commanderEntfernen));
  }
  for (const btn of els.commanderSlot.querySelectorAll("[data-commander-version]")) {
    btn.addEventListener("click", () => openCommanderVersionPicker(btn.dataset.commanderVersion));
  }

  const eigenerBtn = els.commanderSlot.querySelector("#customCommanderBtn");
  if (eigenerBtn) {
    eigenerBtn.addEventListener("click", () => openEigeneKarteModal("commander"));
  }
}

// Leert einen der beiden Plätze. Geht der Commander, rückt der Partner
// auf seinen Platz nach: Der erste Platz ist nie leer, solange es einen
// zweiten gibt, und das Bild in der Übersicht bleibt gesetzt.
function platzLeerenAenderung(platz) {
  const deck = state.activeDeck;
  if (platz === "partner" || !deck?.partner) {
    return { [platz]: null };
  }
  return { commander: deck.partner, partner: null };
}

// Den Commander abzusetzen darf die Karte nicht aus dem Deck werfen.
// Sie wandert zurück in die Kartenliste, denn beim Ernennen war sie von
// dort gekommen.
async function demoteCommander(platz = "commander") {
  if (!deckAenderbar()) return;
  const commander = state.activeDeck?.[platz];
  if (!commander) {
    return;
  }

  setDeckStatus(`Setze ${commander.name} als Commander ab...`, "muted");

  // Die volle Karte liefert Set und Relentless-Eigenschaft für die
  // Deckzeile. Ohne Netz geht es auch mit dem, was am Deck steht.
  let entry = {
    id: commander.id,
    name: commander.name,
    set_name: null,
    image: commander.image ?? null,
    unlimited: false
  };
  if (istEigeneKarte(commander.id)) {
    // Zu einer eigenen Karte gibt es nichts nachzuschlagen. Ohne diesen
    // Zweig liefe die Abfrage ins Leere und der Rückfall oben würde ihr
    // Set und ihr Recht auf mehrere Exemplare wegnehmen.
    entry = deckCardFromScryfall(eigeneKarteAus(commander));
  } else {
    try {
      entry = deckCardFromScryfall(
        await fetchJson(`https://api.scryfall.com/cards/${encodeURIComponent(commander.id)}`)
      );
    } catch {
      // Rückfall auf die gespeicherten Angaben.
    }
  }

  try {
    await deckStore.putCard(state.activeDeck.id, entry, 1);
    applyDeckResult(await deckStore.update(state.activeDeck.id, platzLeerenAenderung(platz)));
    await refreshDecks();
    setDeckStatus(t("{name} steht wieder als Karte im Deck.", { name: commander.name }), "ok");
  } catch (error) {
    setDeckStatus(error.message, "err");
  }
}

// Nimmt die Karte ganz aus dem Deck, im Gegensatz zum Stern, der sie
// nur vom Commander-Platz zurück in die Liste schiebt.
async function removeCommanderCard(platz = "commander") {
  if (!deckAenderbar()) return;
  const commander = state.activeDeck?.[platz];
  if (!commander) {
    return;
  }

  try {
    applyDeckResult(await deckStore.update(state.activeDeck.id, platzLeerenAenderung(platz)));
    await refreshDecks();
    setDeckStatus(t("{name} aus dem Deck entfernt.", { name: commander.name }), "ok");
  } catch (error) {
    setDeckStatus(error.message, "err");
  }
}

async function openCommanderVersionPicker(platz = "commander") {
  const commander = state.activeDeck?.[platz];
  if (!commander) {
    return;
  }

  if (istEigeneKarte(commander.id)) {
    setDeckStatus(t("Zu einer eigenen Karte gibt es keine anderen Ausgaben."), "muted");
    return;
  }

  setDeckStatus(`Lade Versionen von ${commander.name}...`, "muted");
  try {
    const full = await fetchJson(`https://api.scryfall.com/cards/${encodeURIComponent(commander.id)}`);
    const prints = await loadPrintHistory(full);
    if (prints.length < 2) {
      setDeckStatus(`Von ${commander.name} gibt es nur diesen einen Print.`, "muted");
      return;
    }
    state.searchPrints = prints;
    state.searchSelection = full;
    // Das Versionsfenster ist für beide Plätze dasselbe; es muss sich
    // merken, welchen es am Ende ändert.
    state.versionSlot = platz;
    openVersionModal("commander");
    setDeckStatus(`${prints.length} Versionen von ${commander.name}.`, "ok");
  } catch (error) {
    setDeckStatus(`Versionen konnten nicht geladen werden: ${error.message}`, "err");
  }
}

// Beim Commander wird kein Eintrag getauscht, sondern das Deck
// aktualisiert. Das Artwork muss dabei mitwandern, sonst zeigt die
// Übersicht weiter das Bild der alten Ausgabe.
async function applyCommanderVersion(print, platz = "commander") {
  await setCommander(
    {
      id: print.id,
      name: print.name,
      image: getCardPreviewUrl(print),
      art: getCardArtUrl(print)
    },
    platz
  );
}

function cardCategory(card) {
  return typKategorie(cardInfoCache.get(card.id)?.typeLine || "");
}

function groupCardsByType(cards) {
  const gruppen = new Map();
  for (const card of cards) {
    const label = cardCategory(card);
    if (!gruppen.has(label)) {
      gruppen.set(label, []);
    }
    gruppen.get(label).push(card);
  }

  const reihenfolge = [...CARD_TYPES.map((eintrag) => eintrag.label), "Sonstige"];
  return reihenfolge
    .filter((label) => gruppen.has(label))
    .map((label) => ({
      label,
      cards: gruppen.get(label),
      count: gruppen.get(label).reduce((summe, card) => summe + card.quantity, 0)
    }));
}

function renderDeckCards() {
  const cards = state.activeDeckCards;
  const singleton = (state.activeDeck?.format || "commander") === "commander";
  // Commander und Partner zählen als Karten des Decks mit, auch beim Preis.
  const commanders = deckCommanders().map((karte) => ({ id: karte.id, quantity: 1 }));
  const total = cards.reduce((sum, card) => sum + card.quantity, 0) + commanders.length;
  const preis = preisSumme([...cards, ...commanders]);
  els.deckTotal.textContent = `${t(total === 1 ? "{count} Karte" : "{count} Karten", {
    count: total
  })} · ${preisText(preis)}`;

  if (!cards.length) {
    els.deckCards.innerHTML = `<div class="empty-state">Noch keine Karten. Such links eine oder nutze Quick Add.</div>`;
    return;
  }

  const aktionen = (card) => `
    <button type="button" data-less="${escapeHtml(card.id)}" title="Eine weniger" aria-label="Eine weniger">-</button>
    <span class="quantity">${card.quantity}</span>
    <button type="button" data-more="${escapeHtml(card.id)}" title="${
      singleton && !card.unlimited ? "Im Commander ist nur ein Exemplar erlaubt" : "Eine mehr"
    }" aria-label="Eine mehr"${singleton && !card.unlimited ? " disabled" : ""}>+</button>
    <button type="button" data-commander="${escapeHtml(card.id)}" title="Als Commander festlegen" aria-label="Als Commander festlegen">★</button>
    <button type="button" data-remove="${escapeHtml(card.id)}" title="Aus dem Deck entfernen" aria-label="Entfernen">X</button>
  `;

  // Zu einer eigenen Karte gibt es keine zweite Ausgabe, der Klick führt
  // dort nur in die Detailansicht.
  const bildTitel = (card) =>
    istEigeneKarte(card.id) ? `${card.name} ansehen` : `Version von ${card.name} wechseln`;

  const bild = (card) => `
    <button type="button" class="deck-card-thumb" data-version="${escapeHtml(card.id)}" title="${escapeHtml(bildTitel(card))}" aria-label="${escapeHtml(bildTitel(card))}">
      ${
        card.image
          ? `<img src="${escapeHtml(card.image)}" alt="${escapeHtml(card.name)}" loading="lazy" />`
          : `<span class="deck-card-thumb-empty">?</span>`
      }
    </button>
  `;

  // Karten, an denen die Regelprüfung hängt, bekommen einen roten Rand.
  const rot = (card) => (state.deckProblemCards.has(card.id) ? " is-illegal" : "");

  // Preis der Karte, bei mehreren Exemplaren die Summe.
  const preisZeile = (card) => {
    const preis = kartenPreis(card.id);
    if (preis === null) {
      return `<span class="deck-card-price is-unknown">${escapeHtml(t("kein Preis"))}</span>`;
    }
    const gesamt = preis * card.quantity;
    const text = card.quantity > 1
      ? `${formatPreis(gesamt)} (${card.quantity} x ${formatPreis(preis)})`
      : formatPreis(gesamt);
    return `<span class="deck-card-price">${escapeHtml(text)}</span>`;
  };

  const zeile = (card) => `
    <div class="deck-card-row${rot(card)}">
      ${bild(card)}
      <span class="deck-card-name">
        <strong>${escapeHtml(card.name)}</strong>
        <span>${escapeHtml(card.set_name || "?")}</span>
        ${preisZeile(card)}
      </span>
      <span class="deck-card-actions">${aktionen(card)}</span>
    </div>
  `;

  // Eingeklappt steht mehr Platz zur Verfügung. Dann liegen die Karten einer
  // Kategorie als Stapel untereinander: sichtbar bleibt nur der Namensbalken,
  // beim Überfahren rutscht die darunterliegende Karte nach unten weg.
  const kachel = (card) => `
    <div class="deck-card-tile${rot(card)}">
      ${bild(card)}
      ${card.quantity > 1 ? `<span class="deck-tile-count">${card.quantity}×</span>` : ""}
      <span class="deck-card-actions deck-tile-actions">${aktionen(card)}</span>
      ${preisZeile(card)}
    </div>
  `;

  const eingeklappt = state.deckSearchCollapsed;
  els.deckCards.classList.toggle("is-grid", eingeklappt);

  els.deckCards.innerHTML = groupCardsByType(cards)
    .map(
      (gruppe) => `
        <div class="deck-group">
          <h3 class="deck-group-head">
            ${escapeHtml(t(gruppe.label))}
            <span>${gruppe.count} &middot; ${escapeHtml(preisText(preisSumme(gruppe.cards)))}</span>
          </h3>
          <div class="${eingeklappt ? "deck-group-stack" : "deck-group-list"}">
            ${gruppe.cards.map(eingeklappt ? kachel : zeile).join("")}
          </div>
        </div>
      `
    )
    .join("");

  const find = (id) => state.activeDeckCards.find((card) => card.id === id);

  for (const btn of els.deckCards.querySelectorAll("button[data-more]")) {
    btn.addEventListener("click", () => {
      const card = find(btn.dataset.more);
      if (card) changeDeckQuantity(card, card.quantity + 1);
    });
  }
  for (const btn of els.deckCards.querySelectorAll("button[data-less]")) {
    btn.addEventListener("click", () => {
      const card = find(btn.dataset.less);
      if (!card) return;
      // Bei eins bedeutet ein weiteres Minus: raus aus dem Deck.
      if (card.quantity <= 1) removeDeckCard(card.id);
      else changeDeckQuantity(card, card.quantity - 1);
    });
  }
  for (const btn of els.deckCards.querySelectorAll("button[data-remove]")) {
    btn.addEventListener("click", () => removeDeckCard(btn.dataset.remove));
  }
  for (const btn of els.deckCards.querySelectorAll("button[data-commander]")) {
    btn.addEventListener("click", () => {
      const card = find(btn.dataset.commander);
      if (card) setCommanderFromDeckCard(card);
    });
  }
  // Auch bei Karten, die schon im Deck liegen, führt der Klick aufs Bild
  // in dieselbe Detailansicht wie bei den Suchtreffern.
  for (const btn of els.deckCards.querySelectorAll("button[data-version]")) {
    btn.addEventListener("click", async () => {
      const card = find(btn.dataset.version);
      if (!card) {
        return;
      }
      if (istEigeneKarte(card.id)) {
        await selectDeckSearchCard(eigeneKarteAus(card));
        return;
      }
      setDeckStatus(`Lade ${card.name}...`, "muted");
      try {
        await selectDeckSearchCard(
          await fetchJson(`https://api.scryfall.com/cards/${encodeURIComponent(card.id)}`)
        );
      } catch (error) {
        setDeckStatus(`Karte konnte nicht geladen werden: ${error.message}`, "err");
      }
    });
  }
}

// Tauscht die Ausgabe einer Karte im Deck. Die Menge bleibt erhalten.
async function applyDeckVersion(print) {
  if (!deckAenderbar()) return;
  const previous = state.deckVersionCard;
  if (!previous || !state.activeDeck) {
    return;
  }

  try {
    const entry = deckCardFromScryfall(print);
    await deckStore.putCard(state.activeDeck.id, entry, previous.quantity);
    if (previous.id !== entry.id) {
      applyDeckResult(await deckStore.removeCard(state.activeDeck.id, previous.id));
    } else {
      applyDeckResult(await deckStore.get(state.activeDeck.id));
    }
    setDeckStatus(`${entry.name}: Version ${print.set_name || "gewechselt"}.`, "ok");
  } catch (error) {
    setDeckStatus(`Version konnte nicht gewechselt werden: ${error.message}`, "err");
  }
}

// Der Stern an einer Karte nimmt den ersten freien Platz: ohne
// Commander den Commander-Platz, mit einem den des Partners. Sind beide
// belegt, sagt er das, statt still einen zu verdrängen - früher ging der
// verdrängte Commander dabei ganz aus dem Deck verloren.
function freierCommanderPlatz() {
  if (!state.activeDeck?.commander) return "commander";
  if (!state.activeDeck?.partner) return "partner";
  return null;
}

async function setCommanderFromDeckCard(card) {
  const platz = freierCommanderPlatz();
  if (!platz) {
    setDeckStatus(t("Beide Commander-Plätze sind belegt. Setz zuerst einen mit dem Stern ab."), "err");
    return;
  }

  // Zu einer eigenen Karte gibt es keinen fertigen Ausschnitt. Er wird
  // aus dem Kartenbild geschnitten, an der Stelle, an der das Bildfenster
  // auf jeder Magic-Karte sitzt.
  if (istEigeneKarte(card.id)) {
    await setCommander({ ...card, art: await eigenesArtwork(card.image) }, platz);
    return;
  }

  // Für das Artwork in der Übersicht wird die vollständige Karte
  // gebraucht, die Deckzeile kennt nur das normale Bild.
  try {
    const full = await fetchJson(`https://api.scryfall.com/cards/${encodeURIComponent(card.id)}`);
    await setCommander({ ...card, art: getCardArtUrl(full) }, platz);
  } catch {
    await setCommander(card, platz);
  }
}

const commanderCardCache = new Map();

async function loadCommanderCard(id) {
  if (!commanderCardCache.has(id)) {
    commanderCardCache.set(
      id,
      fetchJson(`https://api.scryfall.com/cards/${encodeURIComponent(id)}`).catch((error) => {
        commanderCardCache.delete(id);
        throw error;
      })
    );
  }
  return commanderCardCache.get(id);
}

const DEFAULT_DECK_QUERIES = [
  { query: "t:legendary t:creature", label: "legendary creature" },
  { query: "c:g t:creature mv<=3", label: "grün, klein" },
  { query: 'o:"draw a card"', label: "draw a card" }
];

function renderDeckQueries(entries, note) {
  els.deckQueryBank.innerHTML = entries
    .map(
      (entry) =>
        `<button type="button" class="query-pill" data-deck-query="${escapeHtml(entry.query)}" title="${escapeHtml(
          entry.query
        )}">${escapeHtml(entry.label)}</button>`
    )
    .join("");

  for (const button of els.deckQueryBank.querySelectorAll("[data-deck-query]")) {
    button.addEventListener("click", () => {
      els.deckSearchInput.value = button.dataset.deckQuery || "";
      runDeckSearch();
    });
  }

  if (els.deckQueryNote) {
    els.deckQueryNote.textContent = note;
  }
}

// Die Vorschläge richten sich nach dem Commander: Ein Deck darf nur
// Karten seiner Farbidentität enthalten, deshalb steckt id<= in jeder
// Abfrage. Dazu kommt sein Kreaturentyp als Stammes-Vorschlag.
// Ein Deck darf nur Karten der Farbidentität seines Commanders führen,
// deshalb steckt id<= in jeder Abfrage.
function vorschlaegeZuIdentitaet(identitaet) {
  const letters = (identitaet || []).join("").toLowerCase();
  const identity = letters ? `id<=${letters}` : "id:colorless";
  const label = letters ? letters.toUpperCase() : "farblos";
  return {
    identity,
    label,
    entries: [
      { query: `${identity} t:creature`, label: `Kreaturen ${label}` },
      { query: `${identity} t:instant or ${identity} t:sorcery`, label: `Spells ${label}` },
      { query: `${identity} o:"draw a card"`, label: "Kartenziehen" },
      { query: `${identity} o:"add {c}" t:land`, label: "Länder" }
    ]
  };
}

async function updateDeckQueries() {
  const commander = state.activeDeck?.commander;

  if (!commander) {
    state.commanderCard = null;
    renderDeckQueries(DEFAULT_DECK_QUERIES, "Klick auf eine Karte öffnet ihre Details. Mit einem Commander passen sich die Vorschläge an.");
    return;
  }

  // Bei einem Partner-Paar zählt die Vereinigung beider Farbidentitäten:
  // Die Vorschläge richten sich nach dem Deck, nicht nach einer Hälfte.
  // Eine eigene Karte sagt ihre Identität selbst, dafür braucht es
  // Scryfall nicht; einen Kreaturentyp hat sie dagegen nicht.
  const commanders = deckCommanders();
  const namen = commanders.map((karte) => karte.name).join(" & ");

  try {
    const farben = new Set();
    let ersterVoll = null;
    for (const karte of commanders) {
      if (istEigeneKarte(karte.id)) {
        eigeneKarteMerkmale(karte.id).colorIdentity.forEach((farbe) => farben.add(farbe));
        continue;
      }
      const voll = await loadCommanderCard(karte.id);
      if (karte.id === commander.id) {
        ersterVoll = voll;
      }
      (voll.color_identity || []).forEach((farbe) => farben.add(farbe));
    }
    state.commanderCard = ersterVoll;

    const identitaet = ["W", "U", "B", "R", "G"].filter((farbe) => farben.has(farbe));
    const { entries, label, identity } = vorschlaegeZuIdentitaet(identitaet);

    // Kreaturentypen stehen hinter dem Gedankenstrich der Typzeile. Den
    // Stammes-Vorschlag gibt der erste Commander vor.
    const subtypes = (ersterVoll?.type_line || "").split("—")[1]?.trim().split(/\s+/) || [];
    if (subtypes.length) {
      entries.splice(1, 0, { query: `${identity} t:${subtypes[0].toLowerCase()}`, label: subtypes[0] });
    }

    renderDeckQueries(entries, `Vorschläge passend zu ${namen} (${label}).`);
  } catch {
    renderDeckQueries(DEFAULT_DECK_QUERIES, "Klick auf eine Karte öffnet ihre Details.");
  }
}

// Regelprüfung für das Commander-Format.
//
// Deckgrösse und Mengen stehen lokal zur Verfügung. Ob eine Karte
// verboten ist, weiss nur Scryfall, deshalb wird die Legalität einmal je
// Karte geholt und gemerkt.
const COMMANDER_DECK_SIZE = 100;
// Hält je Karte die Commander-Legalität, die Typzeile und die
// Farbidentität. Alles kommt aus derselben Abfrage, Gruppierung und
// Farbprüfung kosten also keine zusätzliche Anfrage.
const cardInfoCache = new Map();
const legalityCache = {
  get: (id) => cardInfoCache.get(id)?.legality,
  has: (id) => cardInfoCache.has(id)
};

// Diese Angaben ändern sich so gut wie nie: Typzeile und Farbidentität gar
// nicht, die Legalität nur wenn die Bannliste angepasst wird. Sie im
// Browser zu behalten spart nach jedem Neuladen die Abfrage an Scryfall.
const CARD_INFO_KEY = "remasurium.cardInfo";
const CARD_INFO_TTL = 30 * 24 * 60 * 60 * 1000;
const CARD_INFO_MAX = 4000;
// Hochzählen, sobald ein Feld dazukommt. Sonst behalten alte Einträge ihre
// frischen Preise, das neue Feld bleibt aber für immer leer, weil nur
// unbekannte Karten und veraltete Preise nachgefragt werden.
const CARD_INFO_VERSION = 4;
// Preise sind das Einzige, was sich täglich ändert. Sie bekommen deshalb
// eine eigene, kurze Haltbarkeit und einen eigenen Zeitstempel.
const PRICE_TTL = 24 * 60 * 60 * 1000;

function preisVeraltet(id) {
  const eintrag = cardInfoCache.get(id);
  return !eintrag || !eintrag.pt || Date.now() - eintrag.pt > PRICE_TTL;
}

// Cardmarket-Preis in Euro. Scryfall bezieht die eur-Preise von dort.
function kartenPreis(id) {
  const eintrag = cardInfoCache.get(id);
  const roh = eintrag?.price;
  const zahl = Number(roh);
  return roh != null && Number.isFinite(zahl) ? zahl : null;
}

function preisAusScryfall(card) {
  const roh = card?.prices?.eur ?? card?.prices?.eur_foil ?? null;
  const zahl = Number(roh);
  return roh != null && Number.isFinite(zahl) ? zahl : null;
}

// Cardmarket rechnet in Euro, angezeigt wird in Franken. Der Kurs kommt
// von den Referenzkursen der EZB, einmal am Tag.
const RATE_KEY = "remasurium.chfRate";
const RATE_TTL = 24 * 60 * 60 * 1000;
const RATE_URL = "https://api.frankfurter.dev/v1/latest?base=EUR&symbols=CHF";

let kurs = null;

function ladeKursAusAblage() {
  try {
    const roh = JSON.parse(localStorage.getItem(RATE_KEY) || "null");
    if (roh && Number.isFinite(Number(roh.rate))) {
      kurs = { rate: Number(roh.rate), date: roh.date, t: roh.t || 0 };
    }
  } catch {
    kurs = null;
  }
}

async function ensureKurs() {
  if (kurs && Date.now() - kurs.t < RATE_TTL) {
    return;
  }
  try {
    const response = await fetch(RATE_URL);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const data = await response.json();
    const rate = Number(data?.rates?.CHF);
    if (!Number.isFinite(rate)) throw new Error("kein Kurs");
    kurs = { rate, date: data.date, t: Date.now() };
    localStorage.setItem(RATE_KEY, JSON.stringify(kurs));
  } catch {
    // Ohne frischen Kurs wird der zuletzt bekannte weiterverwendet. Gibt
    // es gar keinen, bleiben die Preise in Euro stehen: lieber eine
    // andere Währung als gar kein Preis.
  }
}

function formatPreis(betragEur) {
  if (!kurs) {
    return `${betragEur.toFixed(2)} €`;
  }
  return `${(betragEur * kurs.rate).toFixed(2)} CHF`;
}

ladeKursAusAblage();
ensureKurs();

// Summe über Karten mit Menge. Gibt zusätzlich zurück, wie viele Karten
// keinen Preis haben, damit die Anzeige das nicht verschweigt.
function preisSumme(karten) {
  let summe = 0;
  let ohnePreis = 0;
  for (const karte of karten) {
    const preis = kartenPreis(karte.id);
    if (preis === null) {
      ohnePreis += karte.quantity || 1;
      continue;
    }
    summe += preis * (karte.quantity || 1);
  }
  return { summe, ohnePreis };
}

// Preiszeile unter einer Karte in Suche und Versionsliste. Die Karte
// bringt ihre Preise selbst mit, dafür ist keine Abfrage nötig.
function preisSpanne(card) {
  const preis = preisAusScryfall(card);
  return preis === null
    ? `<span class="tile-price is-unknown">${escapeHtml(t("kein Preis"))}</span>`
    : `<span class="tile-price">${escapeHtml(formatPreis(preis))}</span>`;
}

function preisText({ summe, ohnePreis }) {
  return ohnePreis > 0
    ? t("{price} (+{count} ohne Preis)", { price: formatPreis(summe), count: ohnePreis })
    : formatPreis(summe);
}

function ladeCardInfo() {
  let roh;
  try {
    roh = JSON.parse(localStorage.getItem(CARD_INFO_KEY) || "null");
  } catch {
    return;
  }
  if (!roh || roh.v !== CARD_INFO_VERSION || typeof roh.cards !== "object") {
    return;
  }

  const grenze = Date.now() - CARD_INFO_TTL;
  const preisGrenze = Date.now() - PRICE_TTL;
  for (const [id, eintrag] of Object.entries(roh.cards)) {
    if (!eintrag || eintrag.t < grenze) continue;
    // Alte Preise werden verworfen, die Karte selbst bleibt.
    const preisFrisch = eintrag.pt > preisGrenze;
    cardInfoCache.set(id, {
      legality: eintrag.legality,
      typeLine: eintrag.typeLine,
      colorIdentity: eintrag.colorIdentity,
      manaCost: eintrag.manaCost,
      cmc: eintrag.cmc ?? null,
      tokens: eintrag.tokens || [],
      keywords: eintrag.keywords,
      price: preisFrisch ? eintrag.price : null,
      pt: preisFrisch ? eintrag.pt : 0,
      t: eintrag.t
    });
  }
}

let speicherLauf = null;

function speichereCardInfo() {
  // Gesammelt schreiben, sonst wird die ganze Ablage je Karte neu erzeugt.
  clearTimeout(speicherLauf);
  speicherLauf = setTimeout(() => {
    // Was Scryfall nicht kannte, wird nicht behalten: sonst bliebe eine
    // einmalige Fehlantwort dreissig Tage lang stehen.
    const brauchbar = [...cardInfoCache.entries()].filter(
      ([, eintrag]) => eintrag.colorIdentity !== null
    );
    // Bei Überlauf die ältesten Einträge fallen lassen.
    const behalten = brauchbar
      .sort((a, b) => (b[1].t || 0) - (a[1].t || 0))
      .slice(0, CARD_INFO_MAX);

    const cards = {};
    for (const [id, eintrag] of behalten) {
      cards[id] = eintrag;
    }
    try {
      localStorage.setItem(CARD_INFO_KEY, JSON.stringify({ v: CARD_INFO_VERSION, cards }));
    } catch {
      // Voller Speicher: die Ablage fliegt raus, im Arbeitsspeicher bleibt
      // alles erhalten. Beim nächsten Mal wird wieder gefragt.
      localStorage.removeItem(CARD_INFO_KEY);
    }
  }, 400);
}

ladeCardInfo();

async function ensureLegality(ids) {
  await ensureKurs();
  // Eigene Karten kennt Scryfall nicht. Ihr Eintrag entsteht hier, damit
  // sie gar nicht erst in die Abfrage geraten.
  const bekannte = [...new Set(ids)].filter(Boolean);
  merkeEigeneKarten(bekannte);
  // Nachgefragt wird für unbekannte Karten und für alle, deren Preis
  // älter als einen Tag ist. Die übrigen Angaben stehen dann schon.
  const fehlende = bekannte.filter(
    (id) => !istEigeneKarte(id) && (!cardInfoCache.has(id) || preisVeraltet(id))
  );
  if (!fehlende.length) {
    return;
  }

  for (let i = 0; i < fehlende.length; i += 75) {
    const teil = fehlende.slice(i, i + 75);
    const response = await scryfallFetch("https://api.scryfall.com/cards/collection", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ identifiers: teil.map((id) => ({ id })) })
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const data = await response.json();
    for (const card of data.data || []) {
      cardInfoCache.set(card.id, {
        legality: card.legalities?.commander || "unknown",
        typeLine: card.type_line || "",
        colorIdentity: card.color_identity || [],
        // Bei doppelseitigen Karten steht oben keine Manakosten, nur je Seite.
        manaCost: card.mana_cost || card.card_faces?.[0]?.mana_cost || "",
        cmc: typeof card.cmc === "number" ? card.cmc : null,
        // Scryfall nennt unter all_parts, was eine Karte an Spielsteinen
        // erzeugt. Mehr als Kennung und Name braucht es hier nicht; das
        // Bild wird erst geholt, wenn die Liste wirklich gezeigt wird.
        tokens: (card.all_parts || [])
          .filter((teil) => teil.component === "token")
          .map((teil) => ({ id: teil.id, name: teil.name })),
        // Schlüsselwörter wie Partner oder Friends forever. Daran hängt,
        // ob zwei Commander sich den Platz teilen dürfen.
        keywords: card.keywords || [],
        price: preisAusScryfall(card),
        pt: Date.now(),
        t: Date.now()
      });
    }
    // Was Scryfall nicht kennt, wird nicht als Fehler gewertet.
    for (const id of teil) {
      if (!cardInfoCache.has(id)) {
        cardInfoCache.set(id, {
          legality: "unknown",
          typeLine: "",
          colorIdentity: null,
          manaCost: "",
          tokens: [],
          price: null,
          pt: Date.now(),
          t: Date.now()
        });
      }
    }
  }

  speichereCardInfo();
}


function collectDeckProblems() {
  const probleme = [];
  const karten = state.activeDeckCards;
  const commander = state.activeDeck?.commander;
  const commanders = deckCommanders();
  const gesamt = karten.reduce((summe, karte) => summe + karte.quantity, 0) + commanders.length;
  // Ein Problem kennt die Karten, die es ausgelöst haben. Damit lassen
  // sie sich im Deck rot umranden.
  const melde = (text, ...ids) => probleme.push({ text, ids });

  if (!commander) {
    melde(t("Dem Deck fehlt ein Commander."));
  }

  if (gesamt < COMMANDER_DECK_SIZE) {
    melde(
      t("Das Deck hat {count} Karten, es fehlen {diff} auf 100.", {
        count: gesamt,
        diff: COMMANDER_DECK_SIZE - gesamt
      })
    );
  } else if (gesamt > COMMANDER_DECK_SIZE) {
    melde(
      t("Das Deck hat {count} Karten, {diff} zu viel für 100.", {
        count: gesamt,
        diff: gesamt - COMMANDER_DECK_SIZE
      })
    );
  }

  for (const karte of karten) {
    if (karte.quantity > 1 && !karte.unlimited) {
      melde(
        t("{name}: {count} Exemplare, erlaubt ist eines.", { name: karte.name, count: karte.quantity }),
        karte.id
      );
    }
  }

  for (const karte of [...commanders, ...karten]) {
    const status = legalityCache.get(karte.id);
    if (status === "banned") {
      melde(t("{name} ist im Commander verboten.", { name: karte.name }), karte.id);
    } else if (status === "not_legal") {
      melde(t("{name} ist im Commander nicht zugelassen.", { name: karte.name }), karte.id);
    }
  }

  // Der Commander steckt den Farbrahmen ab: Jede Karte im Deck darf nur
  // Farben mitbringen, die auch er hat. Ohne Daten von Scryfall wird
  // nicht geraten.
  // Zwei Commander dürfen sich den Platz nur teilen, wenn ihre Karten es
  // erlauben. Kennt Scryfall die Schlüsselwörter eines der beiden nicht,
  // etwa bei einer eigenen Karte, wird nicht geraten.
  if (commanders.length === 2 && partnerPaarGueltig(commanders[0], commanders[1]) === false) {
    melde(
      t("{a} und {b} dürfen nicht gemeinsam Commander sein.", {
        a: commanders[0].name,
        b: commanders[1].name
      }),
      commanders[0].id,
      commanders[1].id
    );
  }

  const rahmen = commanderIdentitaet();
  if (rahmen) {
    for (const karte of karten) {
      const eigene = cardInfoCache.get(karte.id)?.colorIdentity;
      if (!eigene || passtInFarbidentitaet(eigene, rahmen)) {
        continue;
      }
      melde(
        t("{name} passt nicht zur Farbidentität {colors} des Commanders.", {
          name: karte.name,
          colors: farbkuerzel(rahmen)
        }),
        karte.id
      );
    }
  }

  return probleme;
}

function renderLegality(probleme) {
  state.deckProblems = probleme;
  state.deckProblemCards = new Set(probleme.flatMap((problem) => problem.ids));

  const inOrdnung = probleme.length === 0;
  els.legalityBadge.textContent = inOrdnung ? t("legal") : t("nicht legal");
  els.legalityBadge.classList.toggle("is-legal", inOrdnung);
  els.legalityBadge.classList.toggle("is-illegal", !inOrdnung);

  els.legalitySummary.textContent = inOrdnung
    ? t("Das Deck erfüllt die Commander-Regeln.")
    : t("{count} Punkte sprechen gegen ein legales Commander-Deck.", { count: probleme.length });
  els.legalitySummary.className = `status ${inOrdnung ? "ok" : "err"}`;

  els.legalityList.innerHTML = probleme
    .map((problem) => `<li>${escapeHtml(problem.text)}</li>`)
    .join("");
}

async function checkDeckLegality() {
  if (!state.activeDeck) {
    return;
  }

  // Erst das, was ohne Netz feststeht, damit die Anzeige sofort stimmt.
  renderLegality(collectDeckProblems());

  const ids = [
    ...deckCommanders().map((karte) => karte.id),
    ...state.activeDeckCards.map((karte) => karte.id)
  ];
  try {
    await ensureLegality(ids.filter(Boolean));
    renderLegality(collectDeckProblems());
    // Mit der Legalität kommen auch Typzeile und Farbidentität. Erst jetzt
    // lässt sich eine frisch hinzugefügte Karte richtig einsortieren
    // (vorher stünde sie unter "Sonstige") und rot umranden.
    renderDeckCards();
    renderDeckStats();
    renderCommanderSlot();
  } catch {
    // Ohne Scryfall bleiben Grösse und Mengen geprüft, verbotene Karten
    // lassen sich dann nicht beurteilen.
  }
}

// --- Eigene Karten --------------------------------------------------------
//
// Eine eigene Karte ist ein Bild mit einem Namen, sonst nichts. Nach aussen
// sieht sie aus wie eine Karte von Scryfall, trägt aber eine Kennung mit
// festem Vorsatz. Daran erkennt jede Stelle im Programm, dass es zu ihr
// nichts nachzuschlagen gibt: keine anderen Ausgaben, kein Preis, keine
// Regelauskunft.
//
// Das Bild wird im Browser verkleinert und als Data-URL in genau dem Feld
// abgelegt, in dem sonst die Bildadresse von Scryfall steht. Deshalb
// braucht es dafür weder eine neue Tabelle noch einen neuen Endpunkt, und
// die Karte wandert mit demselben Weg in die Cloud wie jede andere.

const EIGENE_VORSATZ = "custom-";
const EIGENE_SET = "Eigene Karte";
// Dieselbe Breite, die Scryfall als "normal" ausliefert. Mehr braucht die
// Detailansicht nicht, und jedes Pixel darüber liegt dauerhaft im Speicher.
const EIGENE_BILD_BREITE = 488;
// Obergrenze für die fertige Data-URL, also für das, was gespeichert wird.
// Wird sie überschritten, sinkt die Qualität stufenweise.
const EIGENE_BILD_GRENZE = 300 * 1024;
const EIGENE_TYPEN = CARD_TYPES.map((eintrag) => eintrag.key.toLowerCase());
const EIGENE_FARBEN = ["W", "U", "B", "R", "G"];

function istEigeneKarte(id) {
  return String(id || "").startsWith(EIGENE_VORSATZ);
}

// Typ und Farbidentität stehen in der Kennung selbst:
//   custom-<typ>-<farben>-<zufall>, etwa custom-creature-wu-a1b2...
// Beides liesse sich sonst nirgends unterbringen, denn Collection und
// Deck speichern je Karte nur Name, Set und Bild. In der Kennung reisen
// sie ohne neue Spalte überall mit, auch in die Cloud, und jedes Gerät
// liest sie ohne Nachfrage wieder heraus.
const EIGENE_OHNE_TYP = "x";
const EIGENE_FARBLOS = "c";

function eigeneKarteKennung(typ, farben) {
  const typTeil = EIGENE_TYPEN.includes(typ) ? typ : EIGENE_OHNE_TYP;
  const farbTeil = farben.length ? farben.join("").toLowerCase() : EIGENE_FARBLOS;
  return `${EIGENE_VORSATZ}${typTeil}-${farbTeil}-${crypto.randomUUID()}`;
}

function eigeneKarteMerkmale(id) {
  const [typ, farben] = String(id || "").slice(EIGENE_VORSATZ.length).split("-");
  // Eigene Karten aus der Zeit vor dieser Erweiterung tragen nur die
  // Zufallskennung. Sie bleiben typlos und farblos, so wie sie angelegt
  // wurden. Eine Verwechslung ist ausgeschlossen, weil der erste Teil
  // einer Zufallskennung immer acht Hexadezimalzeichen sind.
  const bekannt = typ === EIGENE_OHNE_TYP || EIGENE_TYPEN.includes(typ);
  return {
    typeLine: bekannt && typ !== EIGENE_OHNE_TYP ? typ[0].toUpperCase() + typ.slice(1) : "",
    colorIdentity:
      bekannt && /^[wubrg]+$/.test(farben || "") ? farben.toUpperCase().split("") : []
  };
}

// Bringt eine eigene Karte in die Form, die der Rest des Programms von
// Scryfall gewohnt ist. image_uris ist der Grund dafür: daran kommen
// Kachel, Detailansicht und Deckzeile ohne Sonderfall heran.
function eigeneKarteAus(eintrag) {
  const bild = eintrag.image || null;
  return {
    ...eintrag,
    set_name: eintrag.set_name || EIGENE_SET,
    released_at: eintrag.released_at ?? null,
    type_line: eigeneKarteMerkmale(eintrag.id).typeLine,
    oracle_text: "",
    image: bild,
    image_uris: bild ? { small: bild, normal: bild, large: bild, art_crop: bild } : undefined,
    // Wie viele Exemplare erlaubt sind, weiss nur, wer die Karte gemacht
    // hat. Das Programm steht dem nicht im Weg.
    unlimited: true,
    custom: true
  };
}

function eigeneKarte(name, bild, typ, farben) {
  return eigeneKarteAus({ id: eigeneKarteKennung(typ, farben), name, image: bild });
}

// Eigene Karten bekommen ihren Eintrag im Kartenspeicher von Hand:
// farblos, ohne Typ, ohne Manakosten. Damit fallen sie von selbst aus
// Manakurve, Farbanteil und Preissumme heraus, ohne dass diese Stellen
// einen Sonderfall brauchen, und sie sprengen nie die Farbidentität des
// Commanders.
function merkeEigeneKarteInfo(id) {
  if (cardInfoCache.has(id)) {
    return;
  }
  const { typeLine, colorIdentity } = eigeneKarteMerkmale(id);
  cardInfoCache.set(id, {
    legality: "unknown",
    typeLine,
    colorIdentity,
    manaCost: "",
    cmc: null,
    tokens: [],
    price: null,
    pt: Date.now(),
    t: Date.now()
  });
}

function merkeEigeneKarten(ids) {
  for (const id of ids) {
    if (id && istEigeneKarte(id)) {
      merkeEigeneKarteInfo(id);
    }
  }
}

// Auf einer Magic-Karte sitzt das Bildfenster immer an derselben Stelle.
// Die Werte sind Anteile der Kartenfläche, abgemessen an einer echten
// Karte: Das Fenster beginnt bei 11,6 Prozent der Höhe und endet bei
// 55,4; waagerecht liegt es mittig und lässt links und rechts je 7,9
// Prozent frei. Als Gegenprobe das Seitenverhältnis von 1,37 - genau
// das, was auch Scryfall seinen Ausschnitten gibt.
const ART_FENSTER = { x: 0.079, y: 0.1155, w: 0.842, h: 0.4389 };
const EIGENE_ART_BREITE = 480;

// Schneidet aus einer eigenen Karte das Bildfenster heraus. Die Übersicht
// zeigt vom Commander nur dieses Stück, bei Scryfall-Karten liefert es
// der art_crop. Ohne eigenen Ausschnitt stünde dort die ganze Karte mit
// Titelzeile und Regeltext, zusammengequetscht auf Bannerhöhe.
async function eigenesArtwork(bild) {
  if (!bild) {
    return null;
  }
  try {
    const bitmap = await createImageBitmap(await (await fetch(bild)).blob());
    const sx = Math.round(bitmap.width * ART_FENSTER.x);
    const sy = Math.round(bitmap.height * ART_FENSTER.y);
    const sw = Math.round(bitmap.width * ART_FENSTER.w);
    const sh = Math.round(bitmap.height * ART_FENSTER.h);

    const breite = Math.min(EIGENE_ART_BREITE, sw);
    const hoehe = Math.max(1, Math.round((sh / sw) * breite));
    const flaeche = document.createElement("canvas");
    flaeche.width = breite;
    flaeche.height = hoehe;
    flaeche.getContext("2d").drawImage(bitmap, sx, sy, sw, sh, 0, 0, breite, hoehe);
    bitmap.close?.();
    return flaeche.toDataURL("image/jpeg", 0.82);
  } catch {
    // Ohne Ausschnitt fällt die Übersicht auf die ganze Karte zurück.
    return null;
  }
}

// Verkleinert ein hochgeladenes Bild auf Kartengrösse und gibt es als
// Data-URL zurück.
async function bildAlsDatenUrl(datei) {
  const bitmap = await createImageBitmap(datei);
  const faktor = Math.min(1, EIGENE_BILD_BREITE / bitmap.width);
  const breite = Math.max(1, Math.round(bitmap.width * faktor));
  const hoehe = Math.max(1, Math.round(bitmap.height * faktor));

  const flaeche = document.createElement("canvas");
  flaeche.width = breite;
  flaeche.height = hoehe;
  const stift = flaeche.getContext("2d");
  // JPEG kennt keine Transparenz. Ohne weissen Grund würden durchsichtige
  // Stellen eines PNG schwarz werden.
  stift.fillStyle = "#ffffff";
  stift.fillRect(0, 0, breite, hoehe);
  stift.drawImage(bitmap, 0, 0, breite, hoehe);
  bitmap.close?.();

  for (const guete of [0.85, 0.7, 0.55, 0.4]) {
    const url = flaeche.toDataURL("image/jpeg", guete);
    if (url.length <= EIGENE_BILD_GRENZE) {
      return url;
    }
  }
  return flaeche.toDataURL("image/jpeg", 0.3);
}

// Das Bild liegt hier schon fertig verkleinert, damit das Anlegen danach
// ohne Wartezeit geht.
const eigeneKarteEntwurf = { bild: null, ziel: "collection" };

function setEigeneKarteStatus(text, art = "muted") {
  schreibeStatus(els.customCardStatus, text, art);
}

function renderEigeneKarteVorschau() {
  els.customCardPreview.innerHTML = eigeneKarteEntwurf.bild
    ? `<img src="${escapeHtml(eigeneKarteEntwurf.bild)}" alt="${escapeHtml(t("Vorschau"))}" />`
    : `<span class="small-note">${escapeHtml(t("Noch kein Bild gewählt."))}</span>`;
}

// Die angekreuzten Farben in WUBRG-Reihenfolge, wie sie im Markup stehen.
function eigeneKarteFarben() {
  return [...els.customCardColors.querySelectorAll("input[type=checkbox]")]
    .filter((feld) => feld.checked)
    .map((feld) => feld.value);
}

function openEigeneKarteModal(ziel) {
  eigeneKarteEntwurf.ziel = ziel;
  eigeneKarteEntwurf.bild = null;
  els.customCardName.value = "";
  els.customCardFile.value = "";
  els.customCardType.value = "";
  for (const feld of els.customCardColors.querySelectorAll("input[type=checkbox]")) {
    feld.checked = false;
  }
  els.customCardSaveBtn.textContent =
    ziel === "commander" ? t("Als Commander anlegen") : t("Karte anlegen");
  renderEigeneKarteVorschau();
  setEigeneKarteStatus(t("Wähle ein Bild aus."));
  openModal(els.customCardModal);
  els.customCardName.focus();
}

async function eigeneKarteBildGewaehlt() {
  const datei = els.customCardFile.files?.[0];
  if (!datei) {
    eigeneKarteEntwurf.bild = null;
    renderEigeneKarteVorschau();
    setEigeneKarteStatus(t("Wähle ein Bild aus."));
    return;
  }

  setEigeneKarteStatus(t("Bild wird verkleinert..."));
  try {
    eigeneKarteEntwurf.bild = await bildAlsDatenUrl(datei);
    renderEigeneKarteVorschau();
    setEigeneKarteStatus(
      t("Bild bereit, {size} kB.", { size: Math.round(eigeneKarteEntwurf.bild.length / 1024) }),
      "ok"
    );
  } catch (error) {
    eigeneKarteEntwurf.bild = null;
    renderEigeneKarteVorschau();
    setEigeneKarteStatus(
      t("Das Bild konnte nicht gelesen werden: {error}", { error: error.message }),
      "err"
    );
  }
}

async function eigeneKarteAnlegen() {
  if (!eigeneKarteEntwurf.bild) {
    setEigeneKarteStatus(t("Es fehlt noch das Bild."), "err");
    return;
  }

  const karte = eigeneKarte(
    els.customCardName.value.trim().slice(0, 80) || t("Eigene Karte"),
    eigeneKarteEntwurf.bild,
    els.customCardType.value,
    eigeneKarteFarben()
  );
  merkeEigeneKarteInfo(karte.id);

  if (eigeneKarteEntwurf.ziel === "commander") {
    // Der Commander steht nicht zusätzlich in der Kartenliste, deshalb
    // geht die Karte direkt auf den Platz. Der Stern holt sie später
    // wieder in die Liste zurück.
    await setCommander({ ...karte, art: await eigenesArtwork(karte.image) }, freierCommanderPlatz() || "commander");
  } else if (eigeneKarteEntwurf.ziel === "deck") {
    await addCardToDeck(karte);
  } else {
    await toggleCollection(karte);
  }

  closeModal(els.customCardModal);
}

// --- Länder optimieren ---------------------------------------------------
// Die Standardländer werden nach den farbigen Manasymbolen im Deck verteilt.




function istStandardland(karte) {
  return istStandardlandTyp(cardInfoCache.get(karte.id)?.typeLine || "");
}

function istLand(karte) {
  return hatTyp(cardInfoCache.get(karte.id)?.typeLine || "", "Land");
}

function deckPips() {
  const summe = { W: 0, U: 0, B: 0, R: 0, G: 0 };
  const alle = [
    ...deckCommanders().map((karte) => ({ id: karte.id, quantity: 1 })),
    ...state.activeDeckCards
  ];
  for (const karte of alle) {
    const kosten = cardInfoCache.get(karte.id)?.manaCost || "";
    const einzeln = zaehlePips(kosten);
    for (const farbe of Object.keys(summe)) {
      summe[farbe] += einzeln[farbe] * karte.quantity;
    }
  }
  return summe;
}

// Welche Farben im Fenster auftauchen: die Farbidentität des Commanders,
// sonst die Farben, für die das Deck überhaupt Symbole hat. Dazu jede Farbe,
// von der schon Standardländer im Deck liegen, damit man sie leeren kann.
function landfarben() {
  const identitaet = commanderIdentitaet();
  const pips = deckPips();
  const basis = identitaet?.length
    ? identitaet
    : BASIC_LANDS.filter((eintrag) => pips[eintrag.farbe] > 0).map((eintrag) => eintrag.farbe);

  const vorhanden = new Set(
    state.activeDeckCards
      .filter(istStandardland)
      .map((karte) => BASIC_LANDS.find((eintrag) => eintrag.name === karte.name)?.farbe)
      .filter(Boolean)
  );

  const liste = BASIC_LANDS.filter(
    (eintrag) => basis.includes(eintrag.farbe) || vorhanden.has(eintrag.farbe)
  );
  return liste.length ? liste : [WASTES];
}


function landZahlen() {
  const karten = state.activeDeckCards;
  const laender = karten.filter(istLand);
  const standard = laender.filter(istStandardland);
  const menge = (liste) => liste.reduce((summe, karte) => summe + karte.quantity, 0);
  return {
    laenderGesamt: menge(laender),
    standard: menge(standard),
    nichtStandard: menge(laender) - menge(standard)
  };
}

function landsVorschlag(zielGesamt) {
  const farben = landfarben();
  const pips = deckPips();
  const { nichtStandard } = landZahlen();
  const zuVerteilen = Math.max(0, zielGesamt - nichtStandard);
  const anzahlen = verteileNachAnteil(
    zuVerteilen,
    farben.map((eintrag) => pips[eintrag.farbe] ?? 0)
  );
  return farben.map((eintrag, index) => ({
    ...eintrag,
    pips: pips[eintrag.farbe] ?? 0,
    anzahl: anzahlen[index]
  }));
}

function renderLandsFacts() {
  const { nichtStandard, standard } = landZahlen();
  const eingaben = [...els.landsSplit.querySelectorAll("input[data-farbe]")];
  const danach = eingaben.reduce((summe, feld) => summe + (Number(feld.value) || 0), 0);

  const zeilen = [
    [t("Länder ohne Standardländer"), nichtStandard],
    [t("Standardländer jetzt"), standard],
    [t("Standardländer danach"), danach],
    [t("Länder danach insgesamt"), nichtStandard + danach]
  ];
  els.landsFacts.innerHTML = zeilen
    .map(([begriff, wert]) => `<dt>${escapeHtml(begriff)}</dt><dd>${wert}</dd>`)
    .join("");
}

function renderLandsSplit(vorschlag) {
  // Farbloses Deck: es gibt keine Standardländer zu verteilen.
  if (!vorschlag.length) {
    els.landsSplit.innerHTML = `<div class="empty-state">Das Deck hat keine farbigen Manasymbole, es gibt nichts zu verteilen.</div>`;
    renderLandsFacts();
    return;
  }

  const gesamtPips = vorschlag.reduce((summe, eintrag) => summe + eintrag.pips, 0);
  els.landsSplit.innerHTML = vorschlag
    .map((eintrag) => {
      // Ohne farbige Symbole im Deck gibt es keinen Anteil zu zeigen.
      const anteil = gesamtPips > 0 ? `${Math.round((eintrag.pips / gesamtPips) * 100)}%` : "–";
      return `
        <label class="lands-row">
          <span class="lands-name">${escapeHtml(eintrag.name)}</span>
          <span class="lands-share">${anteil}</span>
          <input type="number" min="0" max="99" step="1" data-farbe="${eintrag.farbe}" value="${eintrag.anzahl}" />
        </label>
      `;
    })
    .join("");

  for (const feld of els.landsSplit.querySelectorAll("input[data-farbe]")) {
    feld.addEventListener("input", renderLandsFacts);
  }
  renderLandsFacts();
}

function openLandsModal() {
  if (!state.activeDeck) return;
  const { laenderGesamt } = landZahlen();
  // 36 ist der übliche Richtwert im Commander. Wer schon mehr Länder hat,
  // startet bei seiner eigenen Zahl und verliert so keine.
  els.landsTotal.value = Math.max(laenderGesamt, 36);
  setLandsStatus(t("Noch nichts geändert."), "muted");
  renderLandsSplit(landsVorschlag(Number(els.landsTotal.value)));
  openModal(els.landsModal);
  els.landsTotal.focus();
}

function setLandsStatus(text, art = "muted") {
  schreibeStatus(els.landsStatus, text, art);
}

async function applyLands() {
  if (!deckAenderbar()) return;
  if (!state.activeDeck) return;
  const wuensche = [...els.landsSplit.querySelectorAll("input[data-farbe]")].map((feld) => ({
    farbe: feld.dataset.farbe,
    name: landZuFarbe(feld.dataset.farbe).name,
    anzahl: Math.max(0, Math.min(99, Number(feld.value) || 0))
  }));

  setLandsStatus(t("Wird gesetzt..."), "muted");
  try {
    // Nur die Länder nachschlagen, die noch nicht im Deck liegen.
    const fehlende = wuensche
      .filter((wunsch) => wunsch.anzahl > 0)
      .filter((wunsch) => !state.activeDeckCards.some((karte) => karte.name === wunsch.name))
      .map((wunsch) => wunsch.name);
    const gefunden = fehlende.length ? (await lookupCardsByName(fehlende)).found : new Map();

    // Alles in einem Zug: eine Anfrage statt einer je Farbe.
    const stapel = [];
    for (const wunsch of wuensche) {
      const imDeck = state.activeDeckCards.find((karte) => karte.name === wunsch.name);
      if (wunsch.anzahl === 0) {
        if (imDeck) stapel.push({ card: imDeck, quantity: 0 });
        continue;
      }
      const treffer = gefunden.get(wunsch.name.toLowerCase());
      const karte = imDeck || (treffer ? deckCardFromScryfall(treffer) : null);
      if (karte) stapel.push({ card: karte, quantity: wunsch.anzahl });
    }

    if (stapel.length) {
      applyDeckResult(await deckStore.putCards(state.activeDeck.id, stapel));
    }
    const gesetzt = wuensche.reduce((summe, wunsch) => summe + wunsch.anzahl, 0);
    setLandsStatus(t("{count} Standardländer gesetzt.", { count: gesetzt }), "ok");
    renderLandsSplit(
      wuensche.map((wunsch) => ({
        ...landZuFarbe(wunsch.farbe),
        pips: deckPips()[wunsch.farbe] ?? 0,
        anzahl: wunsch.anzahl
      }))
    );
  } catch (error) {
    setLandsStatus(error.message, "err");
  }
}

// --- Playtester -----------------------------------------------------------
// Ein Deck einmal von Hand durchspielen: ziehen, ablegen, tappen, Zug für
// Zug. Nichts davon wird gespeichert, beim Schliessen ist es vorbei.

const START_HAND = 7;

// Feste Grösse einer Karte auf dem Spielfeld. .is-board ändert die Breite
// aus .playtest-card (118px, Seitenverhältnis 63/88) nicht, deshalb ist
// das hier keine Annahme, sondern übernommen aus styles.css.
const BOARD_CARD_W = 118;
const BOARD_CARD_H = Math.round((BOARD_CARD_W * 88) / 63);

// Die Rückseite kommt von Scryfall, von wo auch jedes andere Kartenbild
// in diesem Programm kommt. Lädt sie nicht, tritt der gezeichnete Ersatz
// darunter hervor; der Stapel bleibt dann sichtbar, nur ohne Bild.
const KARTEN_RUECKSEITE =
  "https://backs.scryfall.io/large/0/a/0aeebaf5-8c7d-4636-9e82-8c27447861f7.jpg";

// Mengen, die in den Untermenüs zur Auswahl stehen.
const PT_MENGEN = [1, 2, 3, 5, 7, 10];

const playtest = {
  library: [],
  hand: [],
  board: [],
  graveyard: [],
  exile: [],
  // Kennung der aufgedeckten obersten Karte, sonst null.
  aufgedecktUid: null,
  // Freies Mana dieses Zugs, je Farbe. Ein neuer Zug setzt alles auf 0.
  mana: { W: 0, U: 0, B: 0, R: 0, G: 0, C: 0 },
  // Die Commander-Zone hält einen Commander oder ein Partner-Paar.
  commanders: [],
  turn: 1,
  laeuft: false
};

// Kennungen der Karten auf dem Spielfeld, die gerade ausgewählt sind.
const playtestAuswahl = new Set();

// Die Zonen, zwischen denen eine Karte wandern kann. Jede weiss, wo ihre
// Karten liegen; damit kommt jede Bewegung mit einer Funktion aus, statt
// für jedes Paar von Zonen einen eigenen Fall zu brauchen.
const PT_ZONEN = {
  hand: { label: "Hand", liste: () => playtest.hand },
  board: { label: "Spielfeld", liste: () => playtest.board },
  graveyard: { label: "Friedhof", liste: () => playtest.graveyard },
  exile: { label: "Exil", liste: () => playtest.exile },
  library: { label: "Bibliothek", liste: () => playtest.library }
};

// Jedes Exemplar einer Karte wird ein eigenes Stück mit eigener Nummer,
// sonst liessen sich vier Wälder nicht auseinanderhalten.
function playtestStapel() {
  const stuecke = [];
  for (const karte of state.activeDeckCards) {
    for (let i = 0; i < karte.quantity; i++) {
      stuecke.push({
        uid: `${karte.id}#${i}`,
        id: karte.id,
        name: karte.name,
        image: karte.image
      });
    }
  }
  return stuecke;
}

function playtestNeu() {
  playtest.library = mischen(playtestStapel());
  playtest.hand = playtest.library.splice(0, START_HAND);
  playtest.board = [];
  playtest.graveyard = [];
  playtest.exile = [];
  playtest.aufgedecktUid = null;
  playtestAuswahl.clear();
  manaLeeren();
  // Die Bilder der Spielsteine im Voraus holen, damit ein frisch
  // erzeugter Stein nicht erst leer auf dem Feld liegt.
  ensureTokenKarten(deckTokenRefs()).catch(() => {});
  playtest.commanders = deckCommanders().map((karte) => ({
    uid: `cmd#${karte.id}`,
    id: karte.id,
    name: karte.name,
    image: karte.image
  }));
  playtest.turn = 1;
  playtest.laeuft = true;
  schliessePlaytestMenu();
  renderPlaytest();
  setPlaytestHinweis(t("Neues Spiel, {count} Karten auf der Hand.", { count: playtest.hand.length }));
}

function playtestZiehen(anzahl = 1) {
  let gezogen = 0;
  for (let i = 0; i < anzahl && playtest.library.length; i++) {
    playtest.hand.push(playtest.library.shift());
    gezogen += 1;
  }
  renderPlaytest();
  setPlaytestHinweis(
    gezogen
      ? t(gezogen === 1 ? "{count} Karte gezogen." : "{count} Karten gezogen.", { count: gezogen })
      : t("Die Bibliothek ist leer.")
  );
}

function playtestNeuerZug() {
  playtest.turn += 1;
  // Zugbeginn: alles enttappen, dann ziehen.
  for (const stueck of playtest.board) {
    stueck.tapped = false;
  }
  // Mana bleibt nicht über den Zug hinaus stehen.
  manaLeeren();
  playtestZiehen(1);
  setPlaytestHinweis(t("Zug {turn}.", { turn: playtest.turn }));
}

// --- Karten zwischen Zonen bewegen ---------------------------------------

// Nimmt ein Stück aus der Zone heraus, in der es gerade liegt.
function playtestEntnehmen(uid) {
  for (const name of Object.keys(PT_ZONEN)) {
    const liste = PT_ZONEN[name].liste();
    const index = liste.findIndex((stueck) => stueck.uid === uid);
    if (index >= 0) {
      return liste.splice(index, 1)[0];
    }
  }
  const ausCommander = playtest.commanders.findIndex((stueck) => stueck.uid === uid);
  if (ausCommander >= 0) {
    return playtest.commanders.splice(ausCommander, 1)[0];
  }
  return null;
}

// Legt ein Stück in eine Zone. Oben heisst bei der Bibliothek "als
// nächstes gezogen", beim Friedhof "zuletzt dorthin gewandert".
function playtestEinfuegen(stueck, zone, optionen = {}) {
  if (!stueck) {
    return;
  }
  // Ein Spielstein hört auf zu existieren, sobald er das Spielfeld
  // verlässt. Er wird deshalb nirgends eingefügt, sondern fällt weg -
  // egal ob gezogen, über ein Tastenkürzel oder aus dem Menü heraus.
  if (stueck.istToken && zone !== "board") {
    return;
  }
  if (zone === "commander") {
    playtest.commanders.push(stueck);
    return;
  }
  if (zone === "board") {
    stueck.tapped = stueck.tapped || false;
    stueck.xAnteil = optionen.xAnteil ?? stueck.xAnteil ?? 0.45;
    stueck.yAnteil = optionen.yAnteil ?? stueck.yAnteil ?? 0.4;
    playtest.board.push(stueck);
    return;
  }

  // Ausserhalb des Spielfelds ist nichts getappt.
  delete stueck.tapped;
  const liste = PT_ZONEN[zone]?.liste();
  if (!liste) {
    return;
  }
  if (zone === "library") {
    if (optionen.unten) liste.push(stueck);
    else liste.unshift(stueck);
  } else if (zone === "graveyard" || zone === "exile") {
    // Zuletzt dorthin gewandert liegt obenauf.
    liste.unshift(stueck);
  } else {
    liste.push(stueck);
  }
}

function playtestVerschiebe(uid, zone, optionen = {}) {
  const stueck = playtestEntnehmen(uid);
  playtestEinfuegen(stueck, zone, optionen);
  return stueck;
}

// --- Zeichnen -------------------------------------------------------------

function playtestKartenBild(stueck, klassen = "", attribute = "") {
  return `
    <div class="playtest-card ${klassen}" data-uid="${escapeHtml(stueck.uid)}" title="${escapeHtml(stueck.name)}" ${attribute}>
      ${
        stueck.image
          ? `<img src="${escapeHtml(stueck.image)}" alt="${escapeHtml(stueck.name)}" draggable="false" />`
          : `<span class="playtest-card-name">${escapeHtml(stueck.name)}</span>`
      }
    </div>
  `;
}

// Die Rückseite trägt das Bild und darunter einen gezeichneten Ersatz.
// Fällt das Bild aus, bekommt die Karte die Klasse "ohne-bild" und der
// Ersatz wird sichtbar.
function playtestRueckseite(attribute = "") {
  return `
    <div class="playtest-card is-back" ${attribute}>
      <img src="${KARTEN_RUECKSEITE}" alt="" draggable="false" />
      <span class="playtest-back-ersatz">MTG</span>
    </div>
  `;
}

function renderPlaytest() {
  els.playtestTurn.textContent = playtest.turn;
  els.playtestLibCount.textContent = playtest.library.length;
  els.playtestHandCount.textContent = playtest.hand.length;
  els.playtestBoardCount.textContent = playtest.board.length;
  els.playtestGraveCount.textContent = playtest.graveyard.length;
  els.playtestExileCount.textContent = playtest.exile.length;

  els.playtestHand.innerHTML = playtest.hand
    .map((stueck) => playtestKartenBild(stueck, "is-hand"))
    .join("");

  // Die Bibliothek zeigt eine Rückseite, solange etwas drin ist.
  els.playtestLibrary.innerHTML = `
    <span class="playtest-zone-title">${escapeHtml(t("Bibliothek"))} (${playtest.library.length})</span>
    ${
      !playtest.library.length
        ? `<div class="playtest-empty">${escapeHtml(t("leer"))}</div>`
        : playtest.aufgedecktUid === playtest.library[0].uid
          ? // Aufgedeckt: Die oberste Karte liegt offen da, bleibt aber
            // der Stapel - ein Klick zieht sie wie sonst auch.
            playtestKartenBild(playtest.library[0], "is-offen", 'data-draw="1"')
          : playtestRueckseite(
              `data-draw="1" title="${escapeHtml(t("Klick zieht, Ziehen legt direkt ins Spiel, Rechtsklick öffnet das Menü"))}"`
            )
    }
  `;

  // Ein Paar liegt nebeneinander; die Zone wird dafür breiter, ein
  // einzelner Commander sieht aus wie bisher.
  els.playtestCommander.classList.toggle("is-paar", playtest.commanders.length > 1);
  els.playtestCommander.innerHTML = `
    <span class="playtest-zone-title">${escapeHtml(t("Commander"))}</span>
    ${
      playtest.commanders.length
        ? `<div class="playtest-commander-karten">${playtest.commanders
            .map((stueck) => playtestKartenBild(stueck, "is-commander"))
            .join("")}</div>`
        : `<div class="playtest-empty">${escapeHtml(t("keiner"))}</div>`
    }
  `;

  // Vom Friedhof liegt die zuletzt dorthin gewanderte Karte obenauf. Der
  // Titel zählt mit und öffnet angeklickt den ganzen Stapel, sonst käme
  // man an die darunter liegenden Karten nicht mehr heran.
  for (const [zone, titelEl, koerperEl] of [
    ["graveyard", els.playtestGraveyard, els.playtestGraveyardBody],
    ["exile", els.playtestExile, els.playtestExileBody]
  ]) {
    const liste = PT_ZONEN[zone].liste();
    titelEl.querySelector(".playtest-zone-title").textContent =
      `${t(PT_ZONEN[zone].label)} (${liste.length})`;
    koerperEl.innerHTML = liste.length
      ? playtestKartenBild(liste[0], "is-ablage")
      : `<div class="playtest-empty">${escapeHtml(t("leer"))}</div>`;
  }

  for (const alt of els.playtestBoard.querySelectorAll(".playtest-card.is-board")) {
    alt.remove();
  }
  auswahlBereinigen();
  // Position kommt als Anteil (0 bis 1) der freien Fläche, nicht als
  // fester Pixelwert. So bleibt jede Karte innerhalb des Bretts, auch
  // wenn es seit dem Ablegen schmaler geworden ist.
  const brettMasse = els.playtestBoard.getBoundingClientRect();
  const nutzbarB = Math.max(0, brettMasse.width - BOARD_CARD_W);
  const nutzbarH = Math.max(0, brettMasse.height - BOARD_CARD_H);
  for (const stueck of playtest.board) {
    const left = Math.round((stueck.xAnteil ?? 0) * nutzbarB);
    const top = Math.round((stueck.yAnteil ?? 0) * nutzbarH);
    els.playtestBoard.insertAdjacentHTML(
      "beforeend",
      `<div class="playtest-card is-board${stueck.tapped ? " is-tapped" : ""}${stueck.istToken ? " is-token" : ""}${playtestAuswahl.has(stueck.uid) ? " is-selected" : ""}" data-uid="${escapeHtml(
        stueck.uid
      )}" style="left: ${left}px; top: ${top}px" title="${escapeHtml(stueck.name)}">
        ${
          stueck.image
            ? `<img src="${escapeHtml(stueck.image)}" alt="${escapeHtml(stueck.name)}" draggable="false" />`
            : `<span class="playtest-card-name">${escapeHtml(stueck.name)}</span>`
        }
      </div>`
    );
  }

  // Bricht das Rückseitenbild weg, tritt der gezeichnete Ersatz hervor.
  for (const img of els.playtestView.querySelectorAll(".playtest-card.is-back img")) {
    img.addEventListener(
      "error",
      () => img.closest(".playtest-card")?.classList.add("ohne-bild"),
      { once: true }
    );
  }

  els.playtestHint.hidden = playtest.board.length > 0;
}

// Ohne Deckname bleibt er weg, statt als leeres Stück dazwischen zu
// stehen. Schlägt das Laden fehl, wird bewusst keiner gesetzt: Sonst
// stünde dort der Name des zuletzt geöffneten Decks und behauptete, es
// gehe um dieses.
function setPlaytestHinweis(text, deckName = state.activeDeck?.name || "") {
  els.playtestTitle.textContent = deckName ? `playtest — ${deckName} — ${text}` : `playtest — ${text}`;
}

// --- Kartenraster ---------------------------------------------------------
//
// Zeigt eine Menge Karten in der Reihenfolge, in der sie gerade liegen.
// Beim Durchsuchen der Bibliothek lässt sich eine davon anklicken und
// wandert dann auf die Hand; beim blossen Ansehen passiert nichts.

// Das gerade gezeigte Raster. Wählbare merken sich ihre Zone, damit sie
// sich nach einem Zug neu zeichnen lassen: Wer im Raster eine Karte
// wegschickt, soll sie dort verschwinden sehen.
let kartenRaster = null;

// Filtert das Raster nach Kartenname. Gezeichnet wird nur einmal, das
// Suchen blendet danach bloss aus; so bleibt die Reihenfolge erhalten.
function filterePlaytestKarten() {
  const suche = els.playtestCardsSearch.value.trim().toLowerCase();
  let treffer = 0;
  for (const karte of els.playtestCardsGrid.querySelectorAll(".playtest-grid-card")) {
    const passt = !suche || karte.title.toLowerCase().includes(suche);
    karte.hidden = !passt;
    if (passt) treffer += 1;
  }
  els.playtestCardsEmpty.hidden = treffer > 0 || !suche;
}

function zeichneKartenRaster(stuecke, waehlbar) {
  els.playtestCardsGrid.innerHTML = stuecke.length
    ? stuecke
        .map(
          (stueck) => `
            <button type="button" class="playtest-grid-card${waehlbar ? " is-waehlbar" : ""}" data-uid="${escapeHtml(
              stueck.uid
            )}"${waehlbar ? "" : " disabled"} title="${escapeHtml(stueck.name)}">
              ${
                stueck.image
                  ? `<img src="${escapeHtml(stueck.image)}" alt="${escapeHtml(stueck.name)}" loading="lazy" />`
                  : `<span class="playtest-card-name">${escapeHtml(stueck.name)}</span>`
              }
            </button>
          `
        )
        .join("")
    : `<div class="empty-state">${escapeHtml(t("Keine Karten."))}</div>`;
}

function openPlaytestKarten(titel, stuecke, { hinweis = "", waehlbar = false, zone = null } = {}) {
  kartenRaster = { waehlbar, zone };
  els.playtestCardsTitle.textContent = titel;
  els.playtestCardsNote.textContent = hinweis;
  // Gesucht wird dort, wo man etwas holen will. Beim blossen Ansehen
  // von ein paar Karten wäre ein Suchfeld nur im Weg.
  els.playtestCardsSearchRow.hidden = !waehlbar;
  els.playtestCardsSearch.value = "";
  els.playtestCardsEmpty.hidden = true;
  zeichneKartenRaster(stuecke, waehlbar);
  openModal(els.playtestCardsModal);
  // Das Suchfeld bekommt bewusst keinen Fokus: Sonst landeten E, G, L
  // und H als Text darin, statt die Karte unter dem Zeiger zu bewegen.
}

// Zeichnet ein wählbares Raster mit dem aktuellen Inhalt seiner Zone neu
// und behält dabei den Suchtext.
function aktualisiereKartenRaster() {
  if (!kartenRaster?.zone || !els.playtestCardsModal.classList.contains("open")) {
    return;
  }
  const suchtext = els.playtestCardsSearch.value;
  zeichneKartenRaster(PT_ZONEN[kartenRaster.zone].liste(), kartenRaster.waehlbar);
  els.playtestCardsSearch.value = suchtext;
  filterePlaytestKarten();
}

// --- Kontextmenü ----------------------------------------------------------

let menuEintraege = [];

function schliessePlaytestMenu() {
  els.playtestMenu.hidden = true;
  els.playtestMenu.innerHTML = "";
}

function menuEintragZuPfad(pfad) {
  return pfad
    .split(".")
    .reduce((liste, teil) => (Array.isArray(liste) ? liste[Number(teil)] : liste?.unter?.[Number(teil)]), menuEintraege);
}

function menuHtml(eintraege, pfad = "") {
  return eintraege
    .map((eintrag, i) => {
      const id = pfad ? `${pfad}.${i}` : String(i);
      if (eintrag.trenner) {
        return `<div class="pt-menu-trenner"></div>`;
      }
      if (eintrag.unter) {
        return `
          <div class="pt-menu-item has-sub" data-sub="${id}">
            <span>${escapeHtml(t(eintrag.label))}</span>
            <span class="pt-menu-pfeil" aria-hidden="true">&rsaquo;</span>
            <div class="pt-submenu" hidden>${menuHtml(eintrag.unter, id)}</div>
          </div>
        `;
      }
      return `
        <div class="pt-menu-item" data-aktion="${id}">
          <span>${escapeHtml(t(eintrag.label))}</span>
          ${eintrag.kuerzel ? `<span class="pt-menu-kuerzel">${escapeHtml(eintrag.kuerzel)}</span>` : ""}
        </div>
      `;
    })
    .join("");
}

function zeigePlaytestMenu(x, y, eintraege) {
  menuEintraege = eintraege;
  els.playtestMenu.innerHTML = menuHtml(eintraege);
  els.playtestMenu.hidden = false;
  // Erst sichtbar machen, dann messen: vorher hat das Menü keine Grösse.
  const masse = els.playtestMenu.getBoundingClientRect();
  const links = Math.min(x, window.innerWidth - masse.width - 8);
  const oben = Math.min(y, window.innerHeight - masse.height - 8);
  els.playtestMenu.style.left = `${Math.max(8, links)}px`;
  els.playtestMenu.style.top = `${Math.max(8, oben)}px`;
}

// --- Die Befehle der Bibliothek ------------------------------------------

function bibliothekMischen() {
  playtest.library = mischen(playtest.library);
  renderPlaytest();
  setPlaytestHinweis(t("Bibliothek gemischt."));
}

function zufallskarteZiehen() {
  if (!playtest.library.length) {
    setPlaytestHinweis(t("Die Bibliothek ist leer."));
    return;
  }
  const index = Math.floor(Math.random() * playtest.library.length);
  const stueck = playtest.library.splice(index, 1)[0];
  playtest.hand.push(stueck);
  renderPlaytest();
  setPlaytestHinweis(t("Zufällig gezogen: {name}.", { name: stueck.name }));
}

function obersteVerschieben(zone, unten = false) {
  if (!playtest.library.length) {
    setPlaytestHinweis(t("Die Bibliothek ist leer."));
    return;
  }
  const stueck = playtest.library.shift();
  playtestEinfuegen(stueck, zone, { unten });
  renderPlaytest();
  setPlaytestHinweis(
    t("{name} nach {zone}.", { name: stueck.name, zone: t(PT_ZONEN[zone]?.label || zone) })
  );
}

// Dreht die oberste Karte um, statt ein Fenster zu öffnen. Sie bleibt
// liegen, wo sie ist. Gemerkt wird die Kennung und nicht bloss "ja oder
// nein": Sonst läge nach dem Ziehen die nächste Karte offen da, obwohl
// aufgedeckt wurde genau eine.
function obersteAufdecken() {
  if (!playtest.library.length) {
    setPlaytestHinweis(t("Die Bibliothek ist leer."));
    return;
  }
  const oberste = playtest.library[0];
  const schonOffen = playtest.aufgedecktUid === oberste.uid;
  playtest.aufgedecktUid = schonOffen ? null : oberste.uid;
  renderPlaytest();
  setPlaytestHinweis(
    schonOffen ? t("Wieder zugedeckt.") : t("Aufgedeckt: {name}.", { name: oberste.name })
  );
}

function bibliothekAnsehen(ende, anzahl) {
  if (!playtest.library.length) {
    setPlaytestHinweis(t("Die Bibliothek ist leer."));
    return;
  }
  const stuecke =
    ende === "unten" ? playtest.library.slice(-anzahl).reverse() : playtest.library.slice(0, anzahl);
  openPlaytestKarten(
    ende === "unten"
      ? t("Unterste {count} Karten", { count: stuecke.length })
      : t("Oberste {count} Karten", { count: stuecke.length }),
    stuecke,
    { hinweis: t("Nur ansehen, die Reihenfolge bleibt unverändert.") }
  );
}

function bibliothekMillen(anzahl) {
  const gemillt = Math.min(anzahl, playtest.library.length);
  for (let i = 0; i < gemillt; i++) {
    playtestEinfuegen(playtest.library.shift(), "graveyard");
  }
  renderPlaytest();
  setPlaytestHinweis(
    gemillt
      ? t(gemillt === 1 ? "{count} Karte in den Friedhof." : "{count} Karten in den Friedhof.", {
          count: gemillt
        })
      : t("Die Bibliothek ist leer.")
  );
}

function oeffneBibliothekssuche() {
  openPlaytestKarten(t("Bibliothek durchsuchen"), playtest.library, {
    hinweis: t("In der Reihenfolge der Bibliothek, oberste Karte zuerst. Ein Klick legt sie ins Spiel, E, G, L und H schicken sie woanders hin."),
    waehlbar: true,
    zone: "library"
  });
}

// Friedhof und Exil zeigen in ihrer Zone nur die oberste Karte. Der
// Titel öffnet den ganzen Stapel, sonst käme man an die darunter
// liegenden Karten nicht mehr heran.
function oeffneAblage(zone) {
  openPlaytestKarten(t(PT_ZONEN[zone].label), PT_ZONEN[zone].liste(), {
    hinweis: t("Zuletzt dorthin gewandert zuerst. Ein Klick legt die Karte ins Spiel, E, G, L und H schicken sie woanders hin."),
    waehlbar: true,
    zone
  });
}

function obersteAnsehen() {
  if (!playtest.library.length) {
    setPlaytestHinweis(t("Die Bibliothek ist leer."));
    return;
  }
  const oberste = playtest.library[0];
  const karte = state.activeDeckCards.find((eintrag) => eintrag.id === oberste.id);
  if (istEigeneKarte(oberste.id) && karte) {
    selectDeckSearchCard(eigeneKarteAus(karte));
    return;
  }
  fetchJson(`https://api.scryfall.com/cards/${encodeURIComponent(oberste.id)}`)
    .then(selectDeckSearchCard)
    .catch(() => setPlaytestHinweis(t("Die Karte liess sich nicht laden.")));
}

// --- Spielsteine im Playtester -------------------------------------------

let tokenZaehler = 0;

function playtestTokenErzeugen(ref) {
  const karte = tokenCache.get(ref.id);
  tokenZaehler += 1;
  playtestEinfuegen(
    {
      uid: `token#${tokenZaehler}`,
      id: ref.id,
      name: ref.name,
      image: karte?.image || null,
      istToken: true
    },
    "board",
    // Leicht gestreut, damit mehrere Steine nicht genau aufeinander
    // liegen und sich einzeln greifen lassen.
    { xAnteil: 0.3 + Math.random() * 0.35, yAnteil: 0.25 + Math.random() * 0.35 }
  );
  renderPlaytest();
  setPlaytestHinweis(t("Spielstein erzeugt: {name}.", { name: ref.name }));
}

// Das Menü des Spielfelds. Bisher steht dort nur das Erzeugen von
// Spielsteinen; die Liste kommt aus den Karten des Decks.
function spielfeldMenuEintraege() {
  const refs = deckTokenRefs();
  return [
    {
      label: "Spielstein erzeugen",
      unter: refs.length
        ? refs.map((ref) => ({ label: ref.name, aktion: () => playtestTokenErzeugen(ref) }))
        : [{ label: "Dieses Deck braucht keine Spielsteine.", aktion: () => {} }]
    }
  ];
}

// Die Einträge des Bibliotheksmenüs.
function bibliothekMenuEintraege() {
  const mengen = (aktion) => PT_MENGEN.map((n) => ({ label: String(n), aktion: () => aktion(n) }));
  return [
    { label: "Ziehen", kuerzel: "D", aktion: () => playtestZiehen(1) },
    { label: "X Karten ziehen", unter: mengen((n) => playtestZiehen(n)) },
    {
      label: "Oberste Karte nach",
      unter: [
        { label: "Hand", aktion: () => obersteVerschieben("hand") },
        { label: "Spielfeld", aktion: () => obersteVerschieben("board") },
        { label: "Friedhof", aktion: () => obersteVerschieben("graveyard") },
        { label: "Unter die Bibliothek", aktion: () => obersteVerschieben("library", true) }
      ]
    },
    { trenner: true },
    { label: "Bibliothek durchsuchen", kuerzel: "Strg+F", aktion: oeffneBibliothekssuche },
    { label: "Bibliothek mischen", aktion: bibliothekMischen },
    { label: "Zufällige Karte ziehen", aktion: zufallskarteZiehen },
    { trenner: true },
    { label: "Oberste Karte umdrehen", aktion: obersteAufdecken },
    { label: "Oberste X Karten ansehen", unter: mengen((n) => bibliothekAnsehen("oben", n)) },
    { label: "Unterste X Karten ansehen", unter: mengen((n) => bibliothekAnsehen("unten", n)) },
    { label: "X Karten millen", unter: mengen((n) => bibliothekMillen(n)) },
    { trenner: true },
    {
      label: "Karten-Aktionen",
      unter: [
        { label: "Oberste Karte ansehen", aktion: obersteAnsehen },
        { label: "Oberste Karte nach unten legen", aktion: () => obersteVerschieben("library", true) }
      ]
    }
  ];
}

// --- Ziehen mit dem Zeiger ------------------------------------------------
// Ein Schatten folgt dem Finger, beim Loslassen entscheidet die Zone
// darunter, wohin die Karte kommt.

let zug = null;

// Nimmt einen laufenden Zug vorzeitig zurück: Schatten weg, Zustand weg.
// Wird gebraucht, wenn das Fenster mitten im Ziehen schliesst - sonst
// bliebe der Schatten für immer frei schwebend auf der Seite stehen,
// weil dann nie ein pointerup mehr kommt.
function playtestZugAbbrechen() {
  zug?.schatten?.remove();
  for (const el of els.playtestView.querySelectorAll(".is-source")) {
    el.classList.remove("is-source");
  }
  zug = null;
  rahmen?.el?.remove();
  rahmen = null;
}

// Die Zonen, die sich beim Ziehen hervorheben lassen. Das Spielfeld
// gehört nicht dazu: Es ist die Fläche, auf der ohnehin alles liegt.
const PT_ZIELE = [
  els.playtestGraveyard,
  els.playtestExile,
  els.playtestHand,
  els.playtestLibrary,
  els.playtestCommander
];

function PT_ZIEL_ZU_EL() {
  return {
    graveyard: els.playtestGraveyard,
    exile: els.playtestExile,
    hand: els.playtestHand,
    library: els.playtestLibrary,
    commander: els.playtestCommander
  };
}

// Welche Zone liegt unter diesem Punkt? Bibliothek und Commander liegen
// innerhalb des Spielfelds, deshalb werden sie zuerst gefragt.
function playtestZoneAn(x, y) {
  const trifft = (el) => {
    if (!el) return false;
    const r = el.getBoundingClientRect();
    return x >= r.left && x <= r.right && y >= r.top && y <= r.bottom;
  };
  if (trifft(els.playtestGraveyard)) return "graveyard";
  if (trifft(els.playtestExile)) return "exile";
  if (trifft(els.playtestHand)) return "hand";
  if (trifft(els.playtestLibrary)) return "library";
  if (trifft(els.playtestCommander)) return "commander";
  if (trifft(els.playtestBoard)) return "board";
  return null;
}

// --- Auswahlrahmen --------------------------------------------------------
// Auf freier Fläche des Spielfelds aufgezogen, wählt der Rahmen alle
// Karten darunter aus. Ausgewählte Karten verhalten sich, als läge der
// Zeiger auf jeder von ihnen: Ein Klick tappt alle, Ziehen bewegt alle,
// die Tastenkürzel treffen alle. Mit Umschalt ergänzt ein neuer Rahmen
// die bisherige Auswahl, statt sie zu ersetzen.

let rahmen = null;

// Setzt die Markierung direkt an den Karten, ohne alles neu zu zeichnen.
// Beim Aufziehen des Rahmens passiert das bei jeder Mausbewegung.
function zeigeAuswahl() {
  for (const el of els.playtestBoard.querySelectorAll(".playtest-card.is-board")) {
    el.classList.toggle("is-selected", playtestAuswahl.has(el.dataset.uid));
  }
}

function auswahlLeeren() {
  if (!playtestAuswahl.size) {
    return false;
  }
  playtestAuswahl.clear();
  zeigeAuswahl();
  return true;
}

// Ausgewählt bleibt nur, was noch auf dem Spielfeld liegt.
function auswahlBereinigen() {
  const aufFeld = new Set(playtest.board.map((stueck) => stueck.uid));
  for (const uid of [...playtestAuswahl]) {
    if (!aufFeld.has(uid)) {
      playtestAuswahl.delete(uid);
    }
  }
}

function rahmenStart(event) {
  // Nur auf freier Fläche: nicht in Bibliothek und Commander, nicht im
  // Mana-Zähler.
  if (
    !els.playtestBoard.contains(event.target) ||
    event.target.closest(".playtest-zones, .pt-mana")
  ) {
    return;
  }
  // Ohne das beginnt der Browser beim Ziehen eine Textauswahl.
  event.preventDefault();
  schliessePlaytestMenu();
  rahmen = {
    pointerId: event.pointerId,
    startX: event.clientX,
    startY: event.clientY,
    el: null,
    basis: event.shiftKey ? new Set(playtestAuswahl) : new Set()
  };
  try {
    els.playtestBoard.setPointerCapture?.(event.pointerId);
  } catch {
    // egal
  }
}

function rahmenBewegung(event) {
  const weit = Math.abs(event.clientX - rahmen.startX) + Math.abs(event.clientY - rahmen.startY);
  if (!rahmen.el && weit < 5) {
    return;
  }
  const brett = els.playtestBoard.getBoundingClientRect();
  if (!rahmen.el) {
    rahmen.el = document.createElement("div");
    rahmen.el.className = "pt-rahmen";
    els.playtestBoard.appendChild(rahmen.el);
  }
  // Der Rahmen bleibt innerhalb des Spielfelds, auch wenn der Zeiger
  // darüber hinausfährt.
  const x = Math.min(Math.max(event.clientX, brett.left), brett.right);
  const y = Math.min(Math.max(event.clientY, brett.top), brett.bottom);
  const links = Math.min(rahmen.startX, x);
  const oben = Math.min(rahmen.startY, y);
  const rechts = Math.max(rahmen.startX, x);
  const unten = Math.max(rahmen.startY, y);
  Object.assign(rahmen.el.style, {
    left: `${links - brett.left}px`,
    top: `${oben - brett.top}px`,
    width: `${rechts - links}px`,
    height: `${unten - oben}px`
  });

  // Getroffen ist jede Karte, die der Rahmen auch nur berührt.
  playtestAuswahl.clear();
  for (const uid of rahmen.basis) {
    playtestAuswahl.add(uid);
  }
  for (const el of els.playtestBoard.querySelectorAll(".playtest-card.is-board")) {
    const r = el.getBoundingClientRect();
    if (r.left < rechts && r.right > links && r.top < unten && r.bottom > oben) {
      playtestAuswahl.add(el.dataset.uid);
    }
  }
  zeigeAuswahl();
}

function rahmenEnde() {
  const aufgezogen = Boolean(rahmen.el);
  rahmen.el?.remove();
  const basis = rahmen.basis;
  rahmen = null;
  // Ein blosser Klick auf freie Fläche hebt die Auswahl auf.
  if (!aufgezogen && !basis.size) {
    auswahlLeeren();
  }
  if (playtestAuswahl.size > 1) {
    setPlaytestHinweis(t("{count} Karten ausgewählt.", { count: playtestAuswahl.size }));
  }
}

// --- Ziehen und Klicken ---------------------------------------------------

function playtestZeigerStart(event) {
  // Ein zweiter Finger darf einen laufenden Zug nicht übernehmen, sonst
  // verliert der erste seine Zuordnung und sein Schatten bleibt hängen.
  if (zug || rahmen) {
    return;
  }
  // Nur die primäre Maustaste zieht; rechte oder mittlere Klicks sollen
  // ihre eigene Funktion behalten (Kontextmenü, Auto-Scroll).
  if (event.pointerType === "mouse" && event.button !== 0) {
    return;
  }

  const karte = event.target.closest(".playtest-card");
  if (!karte) {
    rahmenStart(event);
    return;
  }
  if (!els.playtestView.contains(karte)) {
    return;
  }

  schliessePlaytestMenu();
  const uid = karte.dataset.uid || null;
  // Gehört die Karte zur Auswahl, zieht sie die ganze Gruppe mit. Eine
  // Karte ausserhalb der Auswahl anzufassen, hebt die Auswahl auf.
  const gruppe =
    uid && playtestAuswahl.has(uid) && playtestAuswahl.size > 1 ? [...playtestAuswahl] : null;
  if (!gruppe && uid && !playtestAuswahl.has(uid)) {
    auswahlLeeren();
  }

  const rect = karte.getBoundingClientRect();
  zug = {
    pointerId: event.pointerId,
    uid,
    gruppe,
    ausBibliothek: karte.dataset.draw === "1",
    startX: event.clientX,
    startY: event.clientY,
    griffX: event.clientX - rect.left,
    griffY: event.clientY - rect.top,
    bewegt: false,
    schatten: null,
    quelle: karte
  };
  // Nur eine Bequemlichkeit: ohne Zeigerfang läuft das Ziehen über die
  // Ereignisse am Fenster weiter. Schlägt es fehl, darf es nicht den
  // ganzen Griff abbrechen.
  try {
    karte.setPointerCapture?.(event.pointerId);
  } catch {
    // egal
  }
}

// Die Elemente aller Karten einer Gruppe, um sie beim Ziehen blass zu
// zeigen und danach wieder aufzuhellen.
function gruppenElemente(gruppe) {
  return [...els.playtestBoard.querySelectorAll(".playtest-card.is-board")].filter((el) =>
    gruppe.includes(el.dataset.uid)
  );
}

function playtestZeigerBewegung(event) {
  if (rahmen && event.pointerId === rahmen.pointerId) {
    rahmenBewegung(event);
    return;
  }
  if (!zug || event.pointerId !== zug.pointerId) return;
  const weit = Math.abs(event.clientX - zug.startX) + Math.abs(event.clientY - zug.startY);
  if (!zug.bewegt && weit < 6) {
    return;
  }
  if (!zug.bewegt) {
    zug.bewegt = true;
    zug.schatten = zug.quelle.cloneNode(true);
    zug.schatten.classList.add("is-dragging");
    zug.schatten.classList.remove("is-tapped", "is-source", "is-board", "is-selected");
    // Der Schatten hat eine feste Breite, die Karte in einer Zone aber
    // die Breite ihrer Zone. Ohne diese Übernahme spränge sie beim
    // Anfassen auf eine andere Grösse. offsetWidth statt der Masse aus
    // getBoundingClientRect, weil eine getappte Karte um 90 Grad gedreht
    // ist und dort Breite und Höhe vertauscht zurückkämen.
    zug.schatten.style.width = `${zug.quelle.offsetWidth}px`;
    // Bei einer Gruppe zeigt der Schatten, wie viele mitgehen.
    if (zug.gruppe) {
      zug.schatten.insertAdjacentHTML(
        "beforeend",
        `<span class="pt-anzahl">${zug.gruppe.length}</span>`
      );
    }
    document.body.appendChild(zug.schatten);
    // Die Plätze, von denen die Karten kommen, bleiben blass sichtbar.
    for (const el of zug.gruppe ? gruppenElemente(zug.gruppe) : [zug.quelle]) {
      el.classList.add("is-source");
    }
  }
  zug.schatten.style.left = `${event.clientX - zug.griffX}px`;
  zug.schatten.style.top = `${event.clientY - zug.griffY}px`;

  // Die Zone unter dem Zeiger hebt sich hervor, damit vor dem Loslassen
  // zu sehen ist, wo die Karte landet.
  const zone = playtestZoneAn(event.clientX, event.clientY);
  for (const el of PT_ZIELE) {
    el?.classList.remove("is-ziel");
  }
  if (zone && zone !== "board") {
    PT_ZIEL_ZU_EL()[zone]?.classList.add("is-ziel");
  }
}

// Wohin auf dem Spielfeld? Als Anteil an der freien Fläche statt in
// festen Pixeln, geklemmt auf 0..1: Der Ablageort bleibt so immer
// innerhalb des Bretts, auch wenn weit aussen am Kartenrand gegriffen
// wurde.
function brettAnteil(clientX, clientY, griffX, griffY) {
  const brett = els.playtestBoard.getBoundingClientRect();
  const nutzbarB = Math.max(0, brett.width - BOARD_CARD_W);
  const nutzbarH = Math.max(0, brett.height - BOARD_CARD_H);
  const rohX = clientX - brett.left - griffX;
  const rohY = clientY - brett.top - griffY;
  return {
    xAnteil: nutzbarB > 0 ? Math.min(1, Math.max(0, rohX / nutzbarB)) : 0,
    yAnteil: nutzbarH > 0 ? Math.min(1, Math.max(0, rohY / nutzbarH)) : 0
  };
}

const auf01 = (wert) => Math.min(1, Math.max(0, wert));

// Eine Gruppe ablegen. Auf dem Spielfeld wandert sie als Ganzes, jede
// Karte um dieselbe Strecke; ihre Lage zueinander bleibt erhalten. In
// jeder anderen Zone landen alle Karten dort, Spielsteine verschwinden.
function gruppeAblegen(gruppe, uid, zone, event, griffX, griffY) {
  if (zone === "board" || zone === "commander") {
    const gegriffen = playtest.board.find((stueck) => stueck.uid === uid);
    if (!gegriffen) {
      return;
    }
    const neu = brettAnteil(event.clientX, event.clientY, griffX, griffY);
    const dx = neu.xAnteil - (gegriffen.xAnteil ?? 0);
    const dy = neu.yAnteil - (gegriffen.yAnteil ?? 0);
    for (const stueck of playtest.board) {
      if (gruppe.includes(stueck.uid)) {
        stueck.xAnteil = auf01((stueck.xAnteil ?? 0) + dx);
        stueck.yAnteil = auf01((stueck.yAnteil ?? 0) + dy);
      }
    }
    return;
  }

  playtestMehrereVerschieben(gruppe, zone);
}

// Schickt mehrere Karten vom Spielfeld in eine Zone. Gemeinsam genutzt
// vom Ziehen einer Gruppe und von den Tastenkürzeln. Spielsteine zählen
// nicht als Karten, die irgendwo ankommen: Sie verschwinden, und die
// Meldung sagt das getrennt.
function playtestMehrereVerschieben(uids, zone) {
  let karten = 0;
  let steine = 0;
  // In der Reihenfolge des Spielfelds, damit auch der Stapel in der
  // Zielzone eine nachvollziehbare Reihenfolge bekommt.
  for (const stueck of playtest.board.filter((eintrag) => uids.includes(eintrag.uid))) {
    const entnommen = playtestEntnehmen(stueck.uid);
    if (entnommen?.istToken) steine += 1;
    else karten += 1;
    playtestEinfuegen(entnommen, zone);
  }
  auswahlBereinigen();
  const teile = [];
  if (karten) {
    teile.push(
      t(karten === 1 ? "{count} Karte nach {zone}." : "{count} Karten nach {zone}.", {
        count: karten,
        zone: t(PT_ZONEN[zone].label)
      })
    );
  }
  if (steine) {
    teile.push(
      t(steine === 1 ? "{count} Spielstein verschwindet." : "{count} Spielsteine verschwinden.", {
        count: steine
      })
    );
  }
  setPlaytestHinweis(teile.join(" "));
}

function playtestZeigerEnde(event) {
  if (rahmen && event.pointerId === rahmen.pointerId) {
    rahmenEnde();
    return;
  }
  if (!zug || event.pointerId !== zug.pointerId) return;
  const { uid, gruppe, ausBibliothek, bewegt, schatten, griffX, griffY, quelle } = zug;
  zug = null;
  schatten?.remove();
  quelle?.classList.remove("is-source");
  for (const el of els.playtestView.querySelectorAll(".is-source")) {
    el.classList.remove("is-source");
  }
  for (const el of PT_ZIELE) {
    el?.classList.remove("is-ziel");
  }

  // Klick ohne Bewegung: aus der Bibliothek ziehen, sonst tappen. Bei
  // einer Gruppe richten sich alle nach der angeklickten Karte, statt
  // dass jede für sich umschlägt - sonst stünden gemischte Gruppen nach
  // dem Klick wieder gemischt da.
  if (!bewegt) {
    if (ausBibliothek) {
      playtestZiehen(1);
      return;
    }
    const stueck = playtest.board.find((eintrag) => eintrag.uid === uid);
    if (!stueck) {
      return;
    }
    const neu = !stueck.tapped;
    for (const eintrag of playtest.board) {
      if (gruppe ? gruppe.includes(eintrag.uid) : eintrag.uid === uid) {
        eintrag.tapped = neu;
      }
    }
    renderPlaytest();
    return;
  }

  const zone = playtestZoneAn(event.clientX, event.clientY);
  if (!zone) {
    renderPlaytest();
    return;
  }

  if (gruppe) {
    gruppeAblegen(gruppe, uid, zone, event, griffX, griffY);
    renderPlaytest();
    return;
  }

  const stueck = ausBibliothek ? playtest.library.shift() : playtestEntnehmen(uid);
  if (!stueck) {
    renderPlaytest();
    return;
  }

  // Der Commander-Platz nimmt nur den Commander zurück; jede andere
  // Karte landet dort auf dem Spielfeld.
  const ziel = zone === "commander" && !String(stueck.uid).startsWith("cmd#") ? "board" : zone;

  if (ziel === "board") {
    playtestEinfuegen(stueck, "board", brettAnteil(event.clientX, event.clientY, griffX, griffY));
  } else {
    playtestEinfuegen(stueck, ziel);
    setPlaytestHinweis(
      stueck.istToken
        ? t("{name} verschwindet.", { name: stueck.name })
        : t("{name} nach {zone}.", {
            name: stueck.name,
            zone: ziel === "commander" ? t("Commander") : t(PT_ZONEN[ziel].label)
          })
    );
  }
  renderPlaytest();
}

// --- Mana-Zähler ----------------------------------------------------------
// Zählt freies Mana je Farbe mit. Die obere Hälfte eines Symbols zählt
// eins dazu, die untere eins weg. Ein neuer Zug setzt alles auf 0. Das
// Kreuzchen klappt den Zähler bis auf seine Überschrift zu; wie er stand,
// bleibt für den nächsten Besuch erhalten.

const MANA_FARBEN = ["W", "U", "B", "R", "G", "C"];
const MANA_ZU_KEY = "remasurium.manaZu";

function zeigeMana() {
  for (const farbe of MANA_FARBEN) {
    const feld = els.playtestManaList.querySelector(`[data-mana="${farbe}"]`);
    if (!feld) continue;
    feld.querySelector(".pt-mana-zahl").textContent = playtest.mana[farbe];
    // Leere Farben treten zurück, damit das Auge bei dem bleibt, was da ist.
    feld.classList.toggle("is-leer", !playtest.mana[farbe]);
  }
}

function manaLeeren() {
  for (const farbe of MANA_FARBEN) {
    playtest.mana[farbe] = 0;
  }
  zeigeMana();
}

// Die Symbole kommen von Scryfall, wie die Kartenbilder auch. Lädt eines
// nicht, steht an seiner Stelle ein farbiger Kreis mit dem Buchstaben.
function baueMana() {
  els.playtestManaList.innerHTML = MANA_FARBEN.map(
    (farbe) => `
      <button type="button" class="pt-mana-feld is-leer" data-mana="${farbe}" title="${escapeHtml(
        t("Obere Hälfte +1, untere −1")
      )}">
        <span class="pt-mana-symbol pt-mana-${farbe}">
          <img src="https://svgs.scryfall.io/card-symbols/${farbe}.svg" alt="${farbe}" draggable="false" />
          <span class="pt-mana-ersatz">${farbe}</span>
        </span>
        <span class="pt-mana-zahl">0</span>
      </button>
    `
  ).join("");
  for (const img of els.playtestManaList.querySelectorAll("img")) {
    img.addEventListener("error", () => img.parentElement.classList.add("ohne-bild"), { once: true });
  }
}

function setzeManaZu(zu) {
  els.playtestMana.classList.toggle("is-zu", zu);
  els.playtestManaToggle.textContent = zu ? "+" : "×";
  els.playtestManaToggle.setAttribute("aria-expanded", zu ? "false" : "true");
  try {
    localStorage.setItem(MANA_ZU_KEY, zu ? "1" : "0");
  } catch {
    // Ohne Ablage gilt der Zustand eben nur für diesen Besuch.
  }
}

// --- Öffnen und Schliessen ------------------------------------------------

// Der Playtester bekommt einen eigenen Tab. Welches Deck gespielt wird,
// steht in der Adresse, damit die Seite dort für sich allein laden kann
// und nicht den Deck-Editor im Rücken braucht.
function openPlaytest() {
  if (!state.activeDeck) return;
  if (!state.activeDeckCards.length) {
    setDeckStatus(t("Das Deck hat keine Karten zum Spielen."), "err");
    return;
  }
  window.open(
    `${window.location.pathname}#/playtest/${encodeURIComponent(state.activeDeck.id)}`,
    "_blank"
  );
}

// Im frischen Tab ist noch kein Deck geladen. Die Sperre verhindert, dass
// zwei Aufrufe kurz hintereinander zwei Partien gleichzeitig starten.
let playtestLaedt = null;

async function startePlaytestSeite(deckId) {
  if (!deckId) {
    setPlaytestHinweis(t("Kein Deck angegeben."), "");
    return;
  }
  if (playtestLaedt === deckId || (playtest.laeuft && state.activeDeck?.id === deckId)) {
    return;
  }

  playtestLaedt = deckId;
  setPlaytestHinweis(t("Deck wird geladen..."), "");
  try {
    // Erst wenn feststeht, ob jemand angemeldet ist, weiss der Deckspeicher,
    // wo er suchen soll.
    await authBereit;
    if (state.activeDeck?.id !== deckId) {
      // Ein öffentliches Deck darf jeder durchspielen, auch ohne Konto.
      // Darum erst der eigene Weg, dann der öffentliche.
      try {
        applyDeckResult(await deckStore.get(deckId));
      } catch (fehler) {
        applyDeckResult(await api.getPublicDeck(deckId));
      }
    }
    if (!state.activeDeckCards.length) {
      setPlaytestHinweis(t("Das Deck hat keine Karten zum Spielen."));
      return;
    }
    playtestNeu();
  } catch (error) {
    setPlaytestHinweis(t("Deck konnte nicht geladen werden: {error}", { error: error.message }), "");
  } finally {
    playtestLaedt = null;
  }
}

function closePlaytest() {
  playtestZugAbbrechen();
  schliessePlaytestMenu();
  playtest.laeuft = false;
  // Der Tab wurde aus dem Deck-Editor heraus geöffnet und darf sich
  // deshalb selbst schliessen. Wer die Adresse von Hand aufgerufen hat,
  // landet stattdessen bei den Decks.
  window.close();
  setTimeout(() => {
    if (!window.closed) {
      window.location.hash = "#/decks";
    }
  }, 120);
}

// Das Brett kann sich unter laufenden Karten verändern: Fenstergrösse,
// Bildschirmdrehung, die schmale Ansicht auf dem Handy. Die Positionen
// stecken als Anteil, nicht als Pixel, ein Neuzeichnen reicht deshalb.
new ResizeObserver(() => {
  if (playtest.laeuft) {
    renderPlaytest();
  }
}).observe(els.playtestBoard);

// --- Statistik ------------------------------------------------------------


function deckStatistik() {
  const alle = [
    ...state.activeDeckCards,
    ...deckCommanders().map((karte) => ({ id: karte.id, quantity: 1 }))
  ];

  const fuerKurve = alle.map((karte) => ({
    manaValue: cardInfoCache.get(karte.id)?.cmc,
    quantity: karte.quantity,
    istLand: istLand(karte)
  }));

  return { ...manaKurve(fuerKurve), farben: deckPips() };
}

// --- Spielsteine ----------------------------------------------------------
//
// Welche Spielsteine ein Deck braucht, steht bei den Karten selbst:
// Scryfall nennt sie unter all_parts. Gesammelt wird über das ganze Deck,
// den Commander eingerechnet; doppelte fallen weg.

const tokenCache = new Map();

function deckTokenRefs() {
  const ids = [
    ...state.activeDeckCards.map((karte) => karte.id),
    ...deckCommanders().map((karte) => karte.id)
  ];
  const gefunden = new Map();
  for (const id of ids) {
    for (const token of cardInfoCache.get(id)?.tokens || []) {
      if (token.id && !gefunden.has(token.id)) {
        gefunden.set(token.id, token);
      }
    }
  }
  return [...gefunden.values()].sort((a, b) => a.name.localeCompare(b.name, "de"));
}

// Holt Bild und Typzeile der Spielsteine nach. Einmal je Sitzung reicht,
// diese Angaben ändern sich nicht.
async function ensureTokenKarten(refs) {
  const fehlende = refs.filter((ref) => !tokenCache.has(ref.id)).map((ref) => ref.id);
  if (!fehlende.length) {
    return;
  }
  for (let i = 0; i < fehlende.length; i += 75) {
    const teil = fehlende.slice(i, i + 75);
    const response = await scryfallFetch("https://api.scryfall.com/cards/collection", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ identifiers: teil.map((id) => ({ id })) })
    });
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }
    const data = await response.json();
    for (const karte of data.data || []) {
      tokenCache.set(karte.id, {
        id: karte.id,
        name: karte.name,
        typeLine: karte.type_line || "",
        image: getCardPreviewUrl(karte) || null
      });
    }
  }
}

// Die Liste wird oft neu gezeichnet; ohne diesen Vergleich flackerte sie
// bei jedem Rendern des Deckeditors.
let letzteTokenListe = null;

async function renderDeckTokens() {
  const refs = deckTokenRefs();
  const kennung = refs.map((ref) => ref.id).join(",");
  if (kennung === letzteTokenListe) {
    return;
  }
  letzteTokenListe = kennung;

  els.deckTokenCount.textContent = refs.length;
  if (!refs.length) {
    els.deckTokens.innerHTML = `<div class="empty-state">${escapeHtml(
      t("Dieses Deck braucht keine Spielsteine.")
    )}</div>`;
    return;
  }

  els.deckTokens.innerHTML = `<div class="empty-state">${escapeHtml(
    t("Spielsteine werden geladen...")
  )}</div>`;
  try {
    await ensureTokenKarten(refs);
  } catch {
    // Ohne Scryfall bleiben wenigstens die Namen stehen.
  }
  els.deckTokens.innerHTML = refs
    .map((ref) => {
      const karte = tokenCache.get(ref.id);
      return `
        <div class="deck-token" title="${escapeHtml(karte?.typeLine || ref.name)}">
          ${
            karte?.image
              ? `<img src="${escapeHtml(karte.image)}" alt="${escapeHtml(ref.name)}" loading="lazy" />`
              : ""
          }
          <span>${escapeHtml(ref.name)}</span>
        </div>
      `;
    })
    .join("");
}

function renderDeckStats() {
  if (!state.activeDeck) {
    return;
  }
  renderDeckTokens();
  const { balken, summe, anzahl, schnitt, farben } = deckStatistik();

  els.deckStatsSummary.textContent = anzahl
    ? t("Ø {avg} bei {count} Karten", { avg: schnitt.toFixed(2), count: anzahl })
    : t("{count} Karten", { count: 0 });

  const hoechster = Math.max(...balken, 1);
  els.manaCurve.innerHTML = balken
    .map(
      (wert, stufe) => `
        <div class="curve-column" title="${escapeHtml(
          t("{count} Karten mit Manawert {value}", {
            count: wert,
            value: stufe === CURVE_MAX ? `${CURVE_MAX}+` : stufe
          })
        )}">
          <span class="curve-count">${wert || ""}</span>
          <span class="curve-bar" style="height: ${Math.round((wert / hoechster) * 100)}%"></span>
          <span class="curve-label">${stufe === CURVE_MAX ? `${CURVE_MAX}+` : stufe}</span>
        </div>
      `
    )
    .join("");

  const gesamtPips = BASIC_LANDS.reduce((wert, eintrag) => wert + farben[eintrag.farbe], 0);
  if (!gesamtPips) {
    els.manaColors.innerHTML = `<div class="empty-state">${escapeHtml(
      t("Das Deck hat keine farbigen Manasymbole.")
    )}</div>`;
    return;
  }

  // Ein durchgehender Balken, je Farbe ein Abschnitt nach Anteil.
  const vertreten = BASIC_LANDS.filter((eintrag) => farben[eintrag.farbe] > 0).map((eintrag) => ({
    ...eintrag,
    anteil: (farben[eintrag.farbe] / gesamtPips) * 100
  }));

  els.manaColors.innerHTML = `
    <div class="color-bar">
      ${vertreten
        .map(
          (eintrag) => `
            <span
              class="color-seg is-${eintrag.farbe.toLowerCase()}"
              style="width: ${eintrag.anteil.toFixed(2)}%"
              title="${escapeHtml(t(eintrag.label))} ${Math.round(eintrag.anteil)}%"
            >${eintrag.farbe}</span>
          `
        )
        .join("")}
    </div>
    <div class="color-legend">
      ${vertreten
        .map(
          (eintrag) => `
            <span class="color-key">
              <span class="color-dot is-${eintrag.farbe.toLowerCase()}"></span>
              ${escapeHtml(t(eintrag.label))} ${Math.round(eintrag.anteil)}%
            </span>
          `
        )
        .join("")}
    </div>
  `;
}

function renderDeckEditor() {
  if (!state.activeDeck) {
    return;
  }
  els.deckNameInput.value = state.activeDeck.name;
  // Zuerst prüfen: der synchrone Teil setzt die Problemkarten, damit die
  // roten Ränder gleich beim ersten Zeichnen stimmen.
  checkDeckLegality();
  renderCommanderSlot();
  renderDeckCards();
  renderDeckStats();
  updateDeckQueries();
}

function applyDeckResult(result) {
  state.activeDeck = result.deck;
  state.activeDeckCards = result.cards || [];
  // Eigene Karten tragen Typ und Farben in ihrer Kennung, dafür braucht
  // es kein Netz. Der Eintrag entsteht deshalb sofort und nicht erst mit
  // der Regelprüfung, sonst stünden sie bis dahin unter "Sonstige".
  merkeEigeneKarten([
    ...deckCommanders().map((karte) => karte.id),
    ...state.activeDeckCards.map((karte) => karte.id)
  ]);
  renderDeckEditor();
}

async function openDeck(deckId) {
  setDeckStatus("Lade Deck...", "muted");
  state.deckReadOnly = false;
  els.deckEditor.classList.remove("is-readonly");
  try {
    const result = await deckStore.get(deckId);
    applyDeckResult(result);
    els.deckOverview.hidden = true;
    els.deckEditor.hidden = false;
    setDeckStatus(`Deck geöffnet: ${result.deck.name}`, "ok");
  } catch (error) {
    setDeckStatus(`Deck konnte nicht geöffnet werden: ${error.message}`, "err");
  }
}

async function createDeck() {
  const name = els.newDeckName.value.trim();
  const format = els.newDeckFormat.value || "commander";
  setDeckStatus("Lege Deck an...", "muted");
  try {
    const deck = await deckStore.create(name, format);
    els.newDeckName.value = "";
    await refreshDecks();
    setDeckStatus(`Deck "${deck.name}" angelegt.`, "ok");
    await openDeck(deck.id);
  } catch (error) {
    setDeckStatus(error.message, "err");
  }
}

async function renameDeck() {
  if (!deckAenderbar()) return;
  if (!state.activeDeck) return;
  const name = els.deckNameInput.value.trim();
  try {
    applyDeckResult(await deckStore.update(state.activeDeck.id, { name }));
    await refreshDecks();
    setDeckStatus("Deckname gespeichert.", "ok");
  } catch (error) {
    setDeckStatus(error.message, "err");
  }
}

async function deleteDeck() {
  if (!deckAenderbar()) return;
  if (!state.activeDeck) return;
  const name = state.activeDeck.name;
  if (!window.confirm(`Deck "${name}" wirklich löschen? Das lässt sich nicht rückgängig machen.`)) {
    return;
  }
  try {
    await deckStore.remove(state.activeDeck.id);
    showDeckOverview();
    await refreshDecks();
    setDeckStatus(`Deck "${name}" gelöscht.`, "ok");
  } catch (error) {
    setDeckStatus(error.message, "err");
  }
}

async function addCardToDeck(card, quantity = 1) {
  if (!deckAenderbar()) return;
  if (!state.activeDeck) return;
  try {
    applyDeckResult(await deckStore.putCard(state.activeDeck.id, deckCardFromScryfall(card), quantity));
    setDeckStatus(`${card.name} ins Deck gelegt.`, "ok");
  } catch (error) {
    setDeckStatus(error.message, "err");
  }
}

async function changeDeckQuantity(card, quantity) {
  if (!deckAenderbar()) return;
  try {
    applyDeckResult(await deckStore.putCard(state.activeDeck.id, card, quantity));
    setDeckStatus(`${card.name}: ${quantity}x`, "ok");
  } catch (error) {
    setDeckStatus(error.message, "err");
  }
}

async function removeDeckCard(cardId) {
  if (!deckAenderbar()) return;
  try {
    applyDeckResult(await deckStore.removeCard(state.activeDeck.id, cardId));
    setDeckStatus("Karte entfernt.", "ok");
  } catch (error) {
    setDeckStatus(error.message, "err");
  }
}

async function setCommander(card, platz = "commander") {
  if (!deckAenderbar()) return;
  if (!state.activeDeck) return;
  try {
    const eintrag = card
      ? { id: card.id, name: card.name, image: card.image ?? null, art: card.art ?? null }
      : null;
    applyDeckResult(await deckStore.update(state.activeDeck.id, { [platz]: eintrag }));
    await refreshDecks();
    setDeckStatus(
      !card
        ? "Commander entfernt."
        : platz === "partner"
          ? t("{name} ist jetzt Partner-Commander.", { name: card.name })
          : `${card.name} ist jetzt Commander.`,
      "ok"
    );
  } catch (error) {
    setDeckStatus(error.message, "err");
  }
}

// Format wie bei Moxfield und Arena: eine Karte pro Zeile, davor die
// Anzahl. Set-Angaben in Klammern und Kommentarzeilen werden überlesen.
function parseDeckList(text) {
  const entries = [];

  for (const raw of String(text || "").split(/\r?\n/)) {
    const line = raw.trim();
    if (!line || line.startsWith("//") || line.startsWith("#")) {
      continue;
    }

    const match = line.match(/^(?:(\d+)\s*[xX]?\s+)?(.+)$/);
    if (!match) {
      continue;
    }

    const name = match[2]
      .replace(/\s*\([^)]*\)\s*[\w-]*\s*$/, "")
      .replace(/\s*\*[^*]*\*\s*$/, "")
      .trim();

    if (name) {
      entries.push({ name, quantity: Math.min(Math.max(Number(match[1]) || 1, 1), 99) });
    }
  }

  return entries;
}

function openModal(element) {
  element.classList.add("open");
  element.setAttribute("aria-hidden", "false");
}

function closeModal(element) {
  element.classList.remove("open");
  element.setAttribute("aria-hidden", "true");
}

function openImportModal() {
  openModal(els.importModal);
  els.deckImportName.focus();
}

function openExportModal() {
  exportDeckList();
  openModal(els.exportModal);
}

function exportDeckList() {
  if (!state.activeDeck) {
    return;
  }

  const lines = [];
  // Commander und Partner zuerst, damit ein Reimport sie wiederfindet.
  for (const karte of deckCommanders()) {
    lines.push(`1 ${karte.name}`);
  }
  for (const card of state.activeDeckCards) {
    lines.push(`${card.quantity} ${card.name}`);
  }

  els.deckListText.value = lines.join("\n");
  setDeckStatus(t("{count} Zeilen exportiert.", { count: lines.length }), "ok");
}

async function copyDeckList() {
  if (!els.deckListText.value.trim()) {
    exportDeckList();
  }
  try {
    await navigator.clipboard.writeText(els.deckListText.value);
    setDeckStatus("Liste in die Zwischenablage kopiert.", "ok");
  } catch {
    setDeckStatus("Kopieren hat nicht geklappt, bitte von Hand markieren.", "err");
  }
}

// Scryfall nimmt bis zu 75 Karten je Anfrage entgegen. Das ist deutlich
// schonender, als jede Zeile einzeln abzufragen.
async function lookupCardsByName(names) {
  const found = new Map();
  const missing = [];

  for (let i = 0; i < names.length; i += 75) {
    const chunk = names.slice(i, i + 75);
    const response = await scryfallFetch("https://api.scryfall.com/cards/collection", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ identifiers: chunk.map((name) => ({ name })) })
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const data = await response.json();
    for (const card of data.data || []) {
      found.set(card.name.toLowerCase(), card);
      // Bei doppelseitigen Karten steht in der Liste oft nur die
      // Vorderseite.
      const front = card.name.split("//")[0].trim().toLowerCase();
      if (!found.has(front)) {
        found.set(front, card);
      }
    }
    for (const entry of data.not_found || []) {
      missing.push(entry.name);
    }
  }

  return { found, missing };
}

async function importDeckList(text) {
  if (!state.activeDeck) {
    return;
  }

  const entries = parseDeckList(text);
  if (!entries.length) {
    setDeckStatus("Die Liste ist leer.", "err");
    return;
  }

  setDeckStatus(`Suche ${entries.length} Karten...`, "muted");

  let found;
  let missing;
  try {
    ({ found, missing } = await lookupCardsByName(entries.map((entry) => entry.name)));
  } catch (error) {
    setDeckStatus(`Import fehlgeschlagen: ${error.message}`, "err");
    return;
  }

  // Was Scryfall exakt nicht kennt, bekommt eine zweite Chance mit
  // toleranter Suche - so überleben kleine Tippfehler.
  const stillMissing = [];
  for (const name of missing) {
    try {
      const card = await fetchJson(`https://api.scryfall.com/cards/named?fuzzy=${encodeURIComponent(name)}`);
      found.set(name.toLowerCase(), card);
    } catch {
      stillMissing.push(name);
    }
  }

  let added = 0;
  let commanderSet = false;

  for (const entry of entries) {
    const card = found.get(entry.name.toLowerCase());
    if (!card) {
      continue;
    }

    // Die erste legendäre Kreatur wird Commander, sofern noch keiner
    // gewählt ist. Damit lässt sich ein exportiertes Deck unverändert
    // wieder einlesen.
    if (!commanderSet && !state.activeDeck.commander && canBeCommander(card)) {
      await setCommander({
        id: card.id,
        name: card.name,
        image: getCardPreviewUrl(card),
        art: getCardArtUrl(card)
      });
      commanderSet = true;
      added += 1;
      continue;
    }

    try {
      applyDeckResult(
        await deckStore.putCard(state.activeDeck.id, deckCardFromScryfall(card), entry.quantity)
      );
      added += 1;
    } catch {
      stillMissing.push(entry.name);
    }
  }

  await refreshDecks();

  const problem = stillMissing.length ? ` Nicht gefunden: ${stillMissing.join(", ")}.` : "";
  setDeckStatus(`${added} von ${entries.length} Karten übernommen.${problem}`, stillMissing.length ? "err" : "ok");
  return { added, total: entries.length, missing: stillMissing };
}

// Import läuft in der Übersicht und legt immer ein neues Deck an.
async function importDeckAsNew() {
  const text = els.deckImportText.value;
  const entries = parseDeckList(text);

  if (!entries.length) {
    setDeckStatus("Die Liste ist leer.", "err");
    return;
  }

  const wunschname = els.deckImportName.value.trim();
  setDeckStatus(`Lege Deck an und lese ${entries.length} Zeilen...`, "muted");

  try {
    const deck = await deckStore.create(wunschname || "Importiertes Deck");
    await openDeck(deck.id);
    const result = await importDeckList(text);

    // Ohne eigenen Namen bekommt das Deck den seines Commanders, das ist
    // brauchbarer als "Importiertes Deck".
    if (!wunschname && state.activeDeck?.commander) {
      applyDeckResult(
        await deckStore.update(state.activeDeck.id, { name: state.activeDeck.commander.name })
      );
      await refreshDecks();
    }

    els.deckImportText.value = "";
    els.deckImportName.value = "";
    closeModal(els.importModal);

    const problem = result?.missing.length ? ` Nicht gefunden: ${result.missing.join(", ")}.` : "";
    setDeckStatus(
      `Deck "${state.activeDeck.name}" angelegt, ${result?.added ?? 0} von ${entries.length} Karten übernommen.${problem}`,
      result?.missing.length ? "err" : "ok"
    );
  } catch (error) {
    setDeckStatus(`Import fehlgeschlagen: ${error.message}`, "err");
  }
}

function renderDeckCardDetails() {
  els.deckCardDetails.innerHTML = createDetailsHtml(state.deckSelection, state.deckPrints, "deck");
  bindDetailsEvents(els.deckCardDetails, "deck");
}

function openDeckCardModal() {
  els.deckCardModal.classList.add("open");
  els.deckCardModal.setAttribute("aria-hidden", "false");
}

function closeDeckCardModal() {
  els.deckCardModal.classList.remove("open");
  els.deckCardModal.setAttribute("aria-hidden", "true");
}

// Dieselbe Detailansicht wie in der Collection, nur legt der Knopf die
// Karte ins Deck statt in die Collection.
async function selectDeckSearchCard(card) {
  const requestId = ++selectionCounters.deck;

  state.deckSelection = card;
  state.deckFaceIndex = 0;
  state.deckPrints = [];
  renderDeckCardDetails();
  openDeckCardModal();
  setDeckStatus(`Lade Versionshistorie für ${card.name}...`, "muted");

  try {
    const prints = await loadPrintHistory(card);
    if (requestId !== selectionCounters.deck) {
      return;
    }
    state.deckPrints = prints;
    renderDeckCardDetails();
    setDeckStatus(`Karte geladen: ${card.name}`, "ok");
  } catch (error) {
    if (requestId !== selectionCounters.deck) {
      return;
    }
    renderDeckCardDetails();
    setDeckStatus(`Versionshistorie konnte nicht geladen werden: ${error.message}`, "err");
  }
}

// Blättert im Suchfenster des Deck-Editors und lädt dafür nach.
async function gotoDeckSearchPage(seite) {
  const ziel = Math.max(0, Math.min(seite, deckSearchPageCount() - 1));
  if (ziel === state.deckSearchPage) {
    return;
  }

  const gebraucht = (ziel + 1) * SEARCH_PAGE_SIZE;
  while (state.deckResults.length < gebraucht && state.deckSearchNextUrl) {
    setDeckStatus(t("Lade weitere Treffer..."), "muted");
    try {
      const weitere = await ladeSuchseite(state.deckSearchNextUrl);
      state.deckResults = [...state.deckResults, ...weitere.cards];
      state.deckSearchNextUrl = weitere.nextUrl;
    } catch (error) {
      setDeckStatus(t("Weitere Treffer konnten nicht geladen werden: {error}", { error: error.message }), "err");
      break;
    }
  }

  state.deckSearchPage = ziel;
  renderDeckSearchResults();
  els.deckSearchResults.scrollIntoView({ block: "start", behavior: "smooth" });
  setDeckStatus(
    t("Seite {page} von {pages}, {count} Treffer insgesamt.", {
      page: ziel + 1,
      pages: deckSearchPageCount(),
      count: Math.max(state.deckSearchTotal, state.deckResults.length)
    }),
    "ok"
  );
}

function renderDeckSearchResults() {
  const results = state.deckResults;
  // Angezeigt wird, was es insgesamt gibt, nicht was gerade geladen ist.
  const anzahl = Math.max(state.deckSearchTotal, results.length);
  els.deckSearchCount.textContent = `${anzahl} ${anzahl === 1 ? "card" : "cards"}`;

  if (!results.length) {
    els.deckSearchResults.innerHTML = `<div class="empty-state">Noch keine Treffer.</div>`;
    return;
  }

  const seiten = deckSearchPageCount();
  const start = state.deckSearchPage * SEARCH_PAGE_SIZE;

  els.deckSearchResults.innerHTML = `
    <div class="search-grid">
      ${results
        .slice(start, start + SEARCH_PAGE_SIZE)
        .map((card) =>
          suchKachel(card, { attribut: "data-add", titel: `Details zu ${card.name}` })
        )
        .join("")}
    </div>
    ${pagerMarkup(state.deckSearchPage, seiten)}
  `;

  for (const btn of els.deckSearchResults.querySelectorAll("button[data-page]")) {
    btn.addEventListener("click", () => {
      gotoDeckSearchPage(state.deckSearchPage + (btn.dataset.page === "next" ? 1 : -1));
    });
  }

  for (const tile of els.deckSearchResults.querySelectorAll("button[data-add]")) {
    tile.addEventListener("click", () => {
      const card = state.deckResults.find((entry) => entry.id === tile.dataset.add);
      if (card) selectDeckSearchCard(card);
    });
  }
}

async function runDeckSearch() {
  const query = els.deckSearchInput.value.trim();
  if (!query) {
    setDeckStatus("Bitte einen Suchbegriff eingeben.", "err");
    return;
  }

  setDeckStatus(`Suche nach ${query}...`, "muted");
  try {
    const result = await searchCardsWithTolerance(query);
    setDeckResults(result.cards, { nextUrl: result.nextUrl, total: result.total });
    renderDeckSearchResults();
    if (!state.deckResults.length) {
      setDeckStatus("Keine Treffer gefunden.", "err");
    } else if (deckSearchPageCount() > 1) {
      setDeckStatus(
        t("{count} Treffer gefunden, aufgeteilt auf {pages} Seiten.", {
          count: state.deckSearchTotal,
          pages: deckSearchPageCount()
        }),
        "ok"
      );
    } else {
      setDeckStatus(`${state.deckResults.length} Treffer.`, "ok");
    }
  } catch (error) {
    setDeckResults([]);
    renderDeckSearchResults();
    setDeckStatus(`Fehler bei der Suche: ${error.message}`, "err");
  }
}

// Quick Add nimmt den besten Treffer zum Namen, damit man eine Karte
// eintippen kann, ohne den Umweg über die Suchergebnisse.
async function quickAdd() {
  if (!deckAenderbar()) return;
  const name = els.quickAddInput.value.trim();
  if (!name) {
    setDeckStatus("Bitte einen Kartennamen eingeben.", "err");
    return;
  }

  setDeckStatus(`Suche ${name}...`, "muted");
  try {
    const card = await fetchJson(`https://api.scryfall.com/cards/named?fuzzy=${encodeURIComponent(name)}`);
    els.quickAddInput.value = "";
    await addCardToDeck(card);
  } catch (error) {
    setDeckStatus(`Keine Karte zu "${name}" gefunden.`, "err");
  }
}

function setFeedbackStatus(text, type = "muted") {
  schreibeStatus(els.feedbackStatus, text, type);
}

function renderReviews(reviews) {
  if (!reviews.length) {
    els.reviewList.innerHTML = `<div class="empty-state">${t("Noch kein Feedback.")}</div>`;
    return;
  }

  els.reviewList.innerHTML = reviews
    .map(
      (review) => `
        <div class="review-entry">
          <div>
            <div class="review-head">
              <strong>${escapeHtml(review.name)}</strong>
              <span>${"★".repeat(review.rating)}${"☆".repeat(5 - review.rating)}</span>
              <span>${escapeHtml(new Date(review.createdAt).toLocaleString("de-CH"))}</span>
              ${review.email ? `<span>${escapeHtml(review.email)}</span>` : ""}
            </div>
            <p class="review-text">${escapeHtml(review.message)}</p>
          </div>
          <button type="button" class="retro-button" data-delete-review="${escapeHtml(review.id)}" title="${t("Feedback löschen")}">X</button>
        </div>
      `
    )
    .join("");

  for (const btn of els.reviewList.querySelectorAll("button[data-delete-review]")) {
    btn.addEventListener("click", async () => {
      try {
        await api.deleteReview(btn.dataset.deleteReview);
        await loadReviews();
        setFeedbackStatus(t("Feedback gelöscht."), "ok");
      } catch (error) {
        setFeedbackStatus(error.message, "err");
      }
    });
  }
}

// Der Bereich erscheint nur für das Adminkonto. Die eigentliche Sperre
// sitzt im Worker, hier geht es allein um die Ansicht.
async function loadReviews() {
  if (!state.user?.isAdmin) {
    els.adminReviews.hidden = true;
    return;
  }

  els.adminReviews.hidden = false;
  try {
    const data = await api.listReviews();
    renderReviews(data.reviews || []);
  } catch (error) {
    els.reviewList.innerHTML = `<div class="empty-state">${escapeHtml(error.message)}</div>`;
  }
}

function openFeedbackModal() {
  openModal(els.feedbackModal);
  loadReviews();
}

async function submitFeedback(event) {
  event.preventDefault();

  const message = els.feedbackForm.message.value.trim();
  if (!message) {
    setFeedbackStatus(t("Bitte schreib etwas ins Feedback."), "err");
    return;
  }

  setFeedbackStatus(t("Wird gesendet..."), "muted");
  try {
    await api.sendReview(
      els.feedbackForm.name.value.trim(),
      Number(els.feedbackForm.rating.value),
      message
    );
    els.feedbackForm.reset();
    setFeedbackStatus(t("Danke für das Feedback."), "ok");
    await loadReviews();
  } catch (error) {
    setFeedbackStatus(error.message, "err");
  }
}

function setAuthStatus(text, type = "muted") {
  schreibeStatus(els.authStatus, text, type);
}

function showAuthTab(name) {
  els.authTabs.forEach((tab) => {
    const active = tab.dataset.authTab === name;
    tab.classList.toggle("active", active);
    tab.setAttribute("aria-selected", active ? "true" : "false");
  });
  els.loginForm.hidden = name !== "login";
  els.registerForm.hidden = name !== "register";
  els.recoverForm.hidden = name !== "recover";
}

// Der Code steht nur einmal zur Verfuegung, darum bleibt das Feld
// stehen, bis es aktiv weggeklickt wird.
function showRecoveryCode(code) {
  if (!code || !els.recoveryPanel) {
    return;
  }
  els.recoveryCode.textContent = code;
  els.recoveryPanel.hidden = false;
}

function hideRecoveryCode() {
  if (!els.recoveryPanel) {
    return;
  }
  els.recoveryPanel.hidden = true;
  els.recoveryCode.textContent = "-";
}

function renderAccount() {
  const user = state.user;

  els.accountGuest.hidden = Boolean(user);
  els.accountUser.hidden = !user;
  els.accountPanelTitle.textContent = user ? "profile" : "sign in";
  els.accountFooter.textContent = user
    ? `MTG Remasurium / cloud mode - ${user.displayName}`
    : "MTG Remasurium / local mode";

  if (user) {
    els.profileEmail.textContent = user.email;
    els.profileCreated.textContent = new Date(user.createdAt).toLocaleDateString("de-CH");
    els.profileName.value = user.displayName;
  }

  els.collectionScopeLabel.textContent = user
    ? "Karten in deiner Cloud-Collection"
    : "cards saved locally in your browser";
  els.collectionScopeNote.textContent = user
    ? "Deine Collection liegt auf deinem Konto und ist auf jedem Gerät gleich."
    : "Gespeicherte Karten bleiben nur in diesem Browser. Melde dich an, um sie in der Cloud zu sichern.";
}

// Nach Login oder Registrierung: lokale Karten hochschieben, danach
// gilt der Serverstand.
async function adoptSession(user, { mergeLocal = false } = {}) {
  state.user = user;

  try {
    const local = mergeLocal ? loadCollection() : [];
    const data = local.length ? await api.mergeCollection(local) : await api.getCollection();
    state.collection = data.cards || [];

    if (local.length) {
      localStorage.removeItem("remasurium.collection");
    }
  } catch (error) {
    state.collection = [];
    setAuthStatus(`Collection konnte nicht geladen werden: ${error.message}`, "err");
  }

  // Lokal angelegte Decks wandern beim Login mit hoch.
  try {
    const localDecks = mergeLocal ? deckStore.takeLocalDecks() : [];
    if (localDecks.length) {
      await api.mergeDecks(localDecks);
      deckStore.clearLocal();
    }
  } catch (error) {
    setAuthStatus(`Decks konnten nicht übernommen werden: ${error.message}`, "err");
  }

  showDeckOverview();
  await refreshDecks();
  renderAccount();
  renderCollectionViews();
}

async function handleLogin(event) {
  event.preventDefault();
  const email = els.loginForm.email.value.trim();
  const password = els.loginForm.password.value;

  setAuthStatus("Melde an...", "muted");
  try {
    const data = await api.login(email, password);
    await adoptSession(data.user, { mergeLocal: true });
    els.loginForm.reset();
    setAuthStatus(`Angemeldet als ${data.user.email}.`, "ok");
  } catch (error) {
    setAuthStatus(error.message, "err");
  }
}

async function handleRegister(event) {
  event.preventDefault();
  const email = els.registerForm.email.value.trim();
  const password = els.registerForm.password.value;
  const displayName = els.registerForm.displayName.value.trim();

  setAuthStatus("Erstelle Konto...", "muted");
  try {
    const data = await api.register(email, password, displayName);
    await adoptSession(data.user, { mergeLocal: true });
    els.registerForm.reset();
    showRecoveryCode(data.recoveryCode);
    setAuthStatus(`Konto erstellt. Angemeldet als ${data.user.email}.`, "ok");
  } catch (error) {
    setAuthStatus(error.message, "err");
  }
}

async function handleRecover(event) {
  event.preventDefault();
  const email = els.recoverForm.email.value.trim();
  const code = els.recoverForm.recoveryCode.value.trim();
  const newPassword = els.recoverForm.newPassword.value;

  setAuthStatus("Setze Passwort zurück...", "muted");
  try {
    const data = await api.recover(email, code, newPassword);
    await adoptSession(data.user, { mergeLocal: true });
    els.recoverForm.reset();
    showAuthTab("login");
    showRecoveryCode(data.recoveryCode);
    setAuthStatus("Passwort geändert. Der alte Code ist verbraucht, hier ist der neue.", "ok");
  } catch (error) {
    setAuthStatus(error.message, "err");
  }
}

async function handleNewRecoveryCode() {
  setAuthStatus("Erzeuge neuen Code...", "muted");
  try {
    const data = await api.newRecoveryCode();
    showRecoveryCode(data.recoveryCode);
    setAuthStatus("Neuer Code erzeugt. Der alte gilt nicht mehr.", "ok");
  } catch (error) {
    setAuthStatus(error.message, "err");
  }
}

async function copyRecoveryCode() {
  try {
    await navigator.clipboard.writeText(els.recoveryCode.textContent);
    setAuthStatus("Code in die Zwischenablage kopiert.", "ok");
  } catch {
    setAuthStatus("Kopieren hat nicht geklappt, bitte von Hand abschreiben.", "err");
  }
}

async function handleProfileUpdate(event) {
  event.preventDefault();
  const displayName = els.profileName.value.trim();

  setAuthStatus("Speichere...", "muted");
  try {
    const data = await api.updateProfile(displayName);
    state.user = data.user;
    renderAccount();
    setAuthStatus("Profil gespeichert.", "ok");
  } catch (error) {
    setAuthStatus(error.message, "err");
  }
}

async function handleLogout() {
  setAuthStatus("Melde ab...", "muted");
  try {
    await api.logout();
  } catch {
    // Auch wenn der Server nicht antwortet, lokal abmelden.
  }

  state.user = null;
  state.collection = loadCollection();
  state.collectionSelection = null;
  state.collectionPrints = [];
  closeCollectionModal();

  renderAccount();
  renderCollectionViews();
  showDeckOverview();
  await refreshDecks();
  showAuthTab("login");
  // Keinen Code auf dem Bildschirm stehen lassen.
  hideRecoveryCode();
  setAuthStatus("Abgemeldet. Du siehst wieder die lokale Collection.", "ok");
}

// Laeuft die Seite ohne Worker (z.B. direkt als Datei geoeffnet),
// bleibt es beim lokalen Modus statt einer Fehlermeldung.
async function initAuth() {
  renderAccount();

  try {
    const data = await api.me();
    if (data.user) {
      await adoptSession(data.user);
      setAuthStatus(`Angemeldet als ${data.user.email}.`, "ok");
    }
  } catch {
    setAuthStatus("Offline-Modus: Die Collection bleibt in diesem Browser.", "muted");
  }
}

// Trennlinie zwischen Such- und Deckfenster. Die Breite wird als Anteil
// gespeichert, damit sie beim naechsten Besuch wieder stimmt.
const SPLIT_KEY = "remasurium.deckSplit";
const SPLIT_MIN = 25;
const SPLIT_MAX = 75;

function applyDeckSplit(percent) {
  const clamped = Math.min(Math.max(percent, SPLIT_MIN), SPLIT_MAX);
  els.deckLayout.style.setProperty("--deck-split", `${clamped}%`);
  return clamped;
}

function startSplitDrag(startEvent) {
  startEvent.preventDefault();
  document.body.classList.add("is-splitting");

  const move = (event) => {
    const box = els.deckLayout.getBoundingClientRect();
    const x = (event.touches ? event.touches[0].clientX : event.clientX) - box.left;
    applyDeckSplit((x / box.width) * 100);
  };

  const stop = () => {
    document.body.classList.remove("is-splitting");
    window.removeEventListener("mousemove", move);
    window.removeEventListener("mouseup", stop);
    window.removeEventListener("touchmove", move);
    window.removeEventListener("touchend", stop);
    const current = parseFloat(els.deckLayout.style.getPropertyValue("--deck-split")) || 52;
    localStorage.setItem(SPLIT_KEY, String(current));
  };

  window.addEventListener("mousemove", move);
  window.addEventListener("mouseup", stop);
  window.addEventListener("touchmove", move, { passive: false });
  window.addEventListener("touchend", stop);
}

if (els.deckSplitter) {
  els.deckSplitter.addEventListener("mousedown", startSplitDrag);
  els.deckSplitter.addEventListener("touchstart", startSplitDrag, { passive: false });
  // Mit den Pfeiltasten laesst sich die Linie ebenfalls verschieben.
  els.deckSplitter.addEventListener("keydown", (event) => {
    const step = event.key === "ArrowLeft" ? -4 : event.key === "ArrowRight" ? 4 : 0;
    if (!step) {
      return;
    }
    event.preventDefault();
    const current = parseFloat(els.deckLayout.style.getPropertyValue("--deck-split")) || 52;
    localStorage.setItem(SPLIT_KEY, String(applyDeckSplit(current + step)));
  });
  applyDeckSplit(Number(localStorage.getItem(SPLIT_KEY)) || 52);
}

els.createDeckBtn.addEventListener("click", createDeck);
els.newDeckName.addEventListener("keydown", (event) => {
  if (event.key === "Enter") createDeck();
});
els.backToDecksBtn.addEventListener("click", showDeckOverview);
els.deleteDeckBtn.addEventListener("click", deleteDeck);
els.renameDeckBtn.addEventListener("click", renameDeck);
els.deckNameInput.addEventListener("keydown", (event) => {
  if (event.key === "Enter") renameDeck();
});
els.deckSearchBtn.addEventListener("click", runDeckSearch);
els.deckSearchInput.addEventListener("keydown", (event) => {
  if (event.key === "Enter") runDeckSearch();
});
els.quickAddBtn.addEventListener("click", quickAdd);
els.quickAddInput.addEventListener("keydown", (event) => {
  if (event.key === "Enter") quickAdd();
});
els.deckCopyBtn.addEventListener("click", copyDeckList);
els.deckImportBtn.addEventListener("click", importDeckAsNew);
els.openFeedbackBtn.addEventListener("click", openFeedbackModal);
els.feedbackForm.addEventListener("submit", submitFeedback);
els.feedbackModalCloseBtn.addEventListener("click", () => closeModal(els.feedbackModal));
els.feedbackModal.addEventListener("click", (event) => {
  if (event.target === els.feedbackModal) {
    closeModal(els.feedbackModal);
  }
});
// Suchfenster ein- und ausklappen. Der Pfeil zeigt die Richtung, in die
// es geht: <| schiebt nach links weg, |> holt es zurück.
const SEARCH_COLLAPSE_KEY = "remasurium.deckSearchCollapsed";

function applySearchCollapse() {
  const zu = state.deckSearchCollapsed;
  els.deckLayout.classList.toggle("is-collapsed", zu);
  els.toggleSearchBtn.textContent = zu ? "|>" : "<|";
  const titel = zu ? t("Suchfenster ausklappen") : t("Suchfenster einklappen");
  els.toggleSearchBtn.title = titel;
  els.toggleSearchBtn.setAttribute("aria-label", titel);
  els.toggleSearchBtn.setAttribute("aria-expanded", String(!zu));
}

els.toggleSearchBtn.addEventListener("click", () => {
  state.deckSearchCollapsed = !state.deckSearchCollapsed;
  localStorage.setItem(SEARCH_COLLAPSE_KEY, state.deckSearchCollapsed ? "1" : "0");
  applySearchCollapse();
  renderDeckCards();
});

state.deckSearchCollapsed = localStorage.getItem(SEARCH_COLLAPSE_KEY) === "1";
applySearchCollapse();

// Wischen blättert in beiden Suchen. Einmal verdrahtet, nicht bei jedem
// Zeichnen neu.
bindeWischen(els.results, (richtung) => gotoSearchPage(state.searchPage + richtung));
bindeWischen(els.deckSearchResults, (richtung) =>
  gotoDeckSearchPage(state.deckSearchPage + richtung)
);

els.openPlaytestBtn.addEventListener("click", openPlaytest);
els.playtestCloseBtn.addEventListener("click", closePlaytest);
els.playtestDrawBtn.addEventListener("click", () => playtestZiehen(1));
els.playtestTurnBtn.addEventListener("click", playtestNeuerZug);
els.playtestResetBtn.addEventListener("click", playtestNeu);

els.playtestView.addEventListener("pointerdown", playtestZeigerStart);

// Rechtsklick auf die Bibliothek öffnet ihr Menü. Das eigene Menü des
// Browsers tritt dafür zurück.
els.playtestView.addEventListener("contextmenu", (event) => {
  if (!playtest.laeuft) {
    return;
  }
  // Die Bibliothek liegt innerhalb des Spielfelds, deshalb zuerst.
  if (els.playtestLibrary.contains(event.target)) {
    event.preventDefault();
    zeigePlaytestMenu(event.clientX, event.clientY, bibliothekMenuEintraege());
    return;
  }
  if (els.playtestBoard.contains(event.target) && !event.target.closest(".pt-mana")) {
    event.preventDefault();
    zeigePlaytestMenu(event.clientX, event.clientY, spielfeldMenuEintraege());
  }
});

// Im Menü: ein Eintrag mit Untermenü klappt es auf, ein Eintrag mit
// Befehl führt ihn aus und schliesst das Menü.
els.playtestMenu.addEventListener("click", (event) => {
  const befehl = event.target.closest("[data-aktion]");
  if (befehl) {
    menuEintragZuPfad(befehl.dataset.aktion)?.aktion?.();
    schliessePlaytestMenu();
    return;
  }
  const auf = event.target.closest("[data-sub]");
  if (!auf) {
    return;
  }
  const panel = auf.querySelector(".pt-submenu");
  const warZu = panel.hidden;
  for (const anderes of els.playtestMenu.querySelectorAll(".pt-submenu")) {
    anderes.hidden = true;
    anderes.classList.remove("nach-links");
    anderes.style.marginTop = "";
  }
  panel.hidden = !warZu;
  if (!panel.hidden) {
    // Erst sichtbar, dann messen: vorher hat das Untermenü keine Grösse.
    // Passt es rechts nicht mehr hin, klappt es nach links auf; steht es
    // unten über, rückt es so weit hoch, wie es muss.
    let masse = panel.getBoundingClientRect();
    if (masse.right > window.innerWidth - 8) {
      panel.classList.add("nach-links");
      masse = panel.getBoundingClientRect();
    }
    const ueberstand = masse.bottom - (window.innerHeight - 8);
    if (ueberstand > 0) {
      panel.style.marginTop = `${-Math.min(ueberstand, masse.top - 8)}px`;
    }
  }
});

document.addEventListener("pointerdown", (event) => {
  if (!els.playtestMenu.hidden && !els.playtestMenu.contains(event.target)) {
    schliessePlaytestMenu();
  }
});

els.playtestGraveyard
  .querySelector(".playtest-zone-title")
  .addEventListener("click", () => oeffneAblage("graveyard"));
els.playtestExile
  .querySelector(".playtest-zone-title")
  .addEventListener("click", () => oeffneAblage("exile"));

// Welche Karte liegt gerade unter dem Zeiger? Die Tastenkürzel schicken
// sie in eine Zone, ohne dass man sie dafür ziehen muss.
let ueberfahreneKarte = null;

els.playtestView.addEventListener("pointerover", (event) => {
  const karte = event.target.closest(".playtest-card");
  // Der Stapel der Bibliothek trägt keine eigene Kennung; gemeint ist
  // dort die oberste Karte.
  ueberfahreneKarte = karte
    ? karte.dataset.uid || (karte.dataset.draw === "1" ? playtest.library[0]?.uid || null : null)
    : null;
});

els.playtestView.addEventListener("pointerleave", () => {
  ueberfahreneKarte = null;
});

// Taste -> Zone. Entspricht den Anfangsbuchstaben: Exil, Graveyard,
// Library, Hand.
const PT_TASTEN_ZONEN = { e: "exile", g: "graveyard", l: "library", h: "hand" };

function playtestTastenZug(taste) {
  const zone = PT_TASTEN_ZONEN[taste];
  if (!zone) {
    return false;
  }
  // Mit einer Auswahl trifft das Kürzel alle ausgewählten Karten, als läge
  // der Zeiger auf jeder von ihnen. Nur wer gezielt auf eine Karte
  // ausserhalb der Auswahl zeigt, meint diese eine.
  const gruppe =
    playtestAuswahl.size && (!ueberfahreneKarte || playtestAuswahl.has(ueberfahreneKarte))
      ? [...playtestAuswahl]
      : null;
  if (gruppe) {
    playtestMehrereVerschieben(gruppe, zone);
    ueberfahreneKarte = null;
    renderPlaytest();
    return true;
  }
  if (!ueberfahreneKarte) {
    return false;
  }
  const stueck = playtestVerschiebe(ueberfahreneKarte, zone);
  if (!stueck) {
    return false;
  }
  ueberfahreneKarte = null;
  renderPlaytest();
  aktualisiereKartenRaster();
  setPlaytestHinweis(
    stueck.istToken && zone !== "board"
      ? t("{name} verschwindet.", { name: stueck.name })
      : t("{name} nach {zone}.", { name: stueck.name, zone: t(PT_ZONEN[zone].label) })
  );
  return true;
}

baueMana();
setzeManaZu((() => {
  try {
    return localStorage.getItem(MANA_ZU_KEY) === "1";
  } catch {
    return false;
  }
})());

els.playtestManaToggle.addEventListener("click", () => {
  setzeManaZu(!els.playtestMana.classList.contains("is-zu"));
});

// Obere Hälfte des Feldes zählt dazu, untere weg. Zeiger und Klick
// rechnen mit derselben Funktion, damit das Plus am Zeiger auch wirklich
// ein Plus bewirkt.
function manaHaelfte(feld, clientY) {
  const masse = feld.getBoundingClientRect();
  return clientY < masse.top + masse.height / 2 ? "plus" : "minus";
}

els.playtestManaList.addEventListener("pointermove", (event) => {
  const feld = event.target.closest("[data-mana]");
  if (feld) {
    feld.dataset.haelfte = manaHaelfte(feld, event.clientY);
  }
});

els.playtestManaList.addEventListener("pointerout", (event) => {
  const feld = event.target.closest("[data-mana]");
  if (feld && !feld.contains(event.relatedTarget)) {
    delete feld.dataset.haelfte;
  }
});

// Unter 0 geht es nicht.
els.playtestManaList.addEventListener("click", (event) => {
  const feld = event.target.closest("[data-mana]");
  if (!feld) {
    return;
  }
  const farbe = feld.dataset.mana;
  const plus = manaHaelfte(feld, event.clientY) === "plus";
  playtest.mana[farbe] = Math.max(0, playtest.mana[farbe] + (plus ? 1 : -1));
  zeigeMana();
});

els.playtestCardsSearch.addEventListener("input", filterePlaytestKarten);

els.playtestCardsCloseBtn.addEventListener("click", () => closeModal(els.playtestCardsModal));
els.playtestCardsModal.addEventListener("click", (event) => {
  if (event.target === els.playtestCardsModal) {
    closeModal(els.playtestCardsModal);
  }
});

// Im Raster nimmt ein Klick die Karte auf die Hand, sofern das Raster
// dafür geöffnet wurde.
els.playtestCardsGrid.addEventListener("click", (event) => {
  const karte = event.target.closest(".playtest-grid-card.is-waehlbar");
  if (!karte) {
    return;
  }
  const stueck = playtestVerschiebe(karte.dataset.uid, "board");
  closeModal(els.playtestCardsModal);
  renderPlaytest();
  if (stueck) {
    setPlaytestHinweis(t("{name} nach {zone}.", { name: stueck.name, zone: t("Spielfeld") }));
  }
});

// Auch im Raster gelten die Tastenkürzel für die Karte unter dem Zeiger.
els.playtestCardsGrid.addEventListener("pointerover", (event) => {
  ueberfahreneKarte = event.target.closest(".playtest-grid-card")?.dataset.uid || null;
});

els.playtestCardsGrid.addEventListener("pointerleave", () => {
  ueberfahreneKarte = null;
});
window.addEventListener("pointermove", playtestZeigerBewegung);
window.addEventListener("pointerup", playtestZeigerEnde);
window.addEventListener("pointercancel", (event) => {
  if ((zug && event.pointerId === zug.pointerId) || (rahmen && event.pointerId === rahmen.pointerId)) {
    playtestZugAbbrechen();
  }
});

// Tastenkürzel gelten nur, solange der Playtester offen ist und man nicht
// gerade in einem Feld tippt.
window.addEventListener("keydown", (event) => {
  if (!playtest.laeuft) {
    return;
  }
  if (/^(input|textarea|select)$/i.test(event.target.tagName)) {
    return;
  }

  const taste = event.key.toLowerCase();
  // Liegt der Zeiger auf einer Karte, schicken E, G, L und H sie in ihre
  // Zone. Das geht den übrigen Kürzeln vor, aber nur wenn wirklich eine
  // Karte unter dem Zeiger liegt - sonst bliebe etwa H ohne Wirkung.
  if (!event.ctrlKey && !event.metaKey && !event.shiftKey && playtestTastenZug(taste)) {
    event.preventDefault();
    return;
  }
  if (taste === "f" && (event.ctrlKey || event.metaKey)) {
    // Die Suche des Browsers hilft hier nicht weiter, die Bibliothek
    // steht ja nicht auf der Seite.
    event.preventDefault();
    oeffneBibliothekssuche();
  } else if (taste === "d" && !event.ctrlKey && !event.metaKey) {
    event.preventDefault();
    playtestZiehen(1);
  } else if (taste === "n" && (event.ctrlKey || event.metaKey || event.shiftKey)) {
    // Strg+N fangen die meisten Browser selbst ab, Umschalt+N geht immer.
    event.preventDefault();
    playtestNeu();
  } else if (taste === "n") {
    event.preventDefault();
    playtestNeuerZug();
  } else if (event.key === "Escape") {
    // Escape räumt von innen nach aussen: erst das Menü, dann das
    // Kartenfenster, erst zuletzt den Playtester selbst.
    if (!els.playtestMenu.hidden) {
      schliessePlaytestMenu();
    } else if (els.playtestCardsModal.classList.contains("open")) {
      closeModal(els.playtestCardsModal);
    } else if (auswahlLeeren()) {
      setPlaytestHinweis(t("Auswahl aufgehoben."));
    } else {
      closePlaytest();
    }
  }
});

els.openLandsBtn.addEventListener("click", openLandsModal);
els.landsModalCloseBtn.addEventListener("click", () => closeModal(els.landsModal));
els.landsApplyBtn.addEventListener("click", applyLands);
// Die Gesamtzahl verteilt neu, von Hand gesetzte Zahlen werden dabei ersetzt.
els.landsRecalcBtn.addEventListener("click", () => {
  renderLandsSplit(landsVorschlag(Number(els.landsTotal.value) || 0));
});
els.landsTotal.addEventListener("change", () => {
  renderLandsSplit(landsVorschlag(Number(els.landsTotal.value) || 0));
});

// Das Decks-Menü klappt beim Klick auf den Menüpunkt auf, statt sofort
// irgendwo zu landen. Ein Klick daneben oder Escape schliesst es wieder.
function zeigeDecksMenu(offen) {
  const sichtbar = offen ?? els.decksNavMenu.hidden;
  els.decksNavMenu.hidden = !sichtbar;
  els.decksNavLink.setAttribute("aria-expanded", sichtbar ? "true" : "false");
}

els.decksNavLink.addEventListener("click", (event) => {
  event.preventDefault();
  zeigeDecksMenu();
});

for (const eintrag of els.decksNavMenu.querySelectorAll(".nav-dropdown-item")) {
  eintrag.addEventListener("click", () => zeigeDecksMenu(false));
}

document.addEventListener("click", (event) => {
  if (!els.decksNavMenu.hidden && !event.target.closest(".nav-dropdown")) {
    zeigeDecksMenu(false);
  }
});

window.addEventListener("keydown", (event) => {
  if (event.key === "Escape") {
    zeigeDecksMenu(false);
  }
});

els.openDeckSettingsBtn.addEventListener("click", openDeckSettings);
els.deckSettingsCloseBtn.addEventListener("click", () => closeModal(els.deckSettingsModal));
els.deckPublicToggle.addEventListener("change", deckSichtbarkeitAendern);
els.deckSettingsModal.addEventListener("click", (event) => {
  if (event.target === els.deckSettingsModal) {
    closeModal(els.deckSettingsModal);
  }
});

els.openCustomCollectionBtn.addEventListener("click", () => openEigeneKarteModal("collection"));
els.openCustomDeckBtn.addEventListener("click", () => openEigeneKarteModal("deck"));
els.customCardCloseBtn.addEventListener("click", () => closeModal(els.customCardModal));
els.customCardFile.addEventListener("change", eigeneKarteBildGewaehlt);
els.customCardSaveBtn.addEventListener("click", eigeneKarteAnlegen);
els.customCardModal.addEventListener("click", (event) => {
  if (event.target === els.customCardModal) {
    closeModal(els.customCardModal);
  }
});

els.legalityBadge.addEventListener("click", () => openModal(els.legalityModal));
els.legalityModalCloseBtn.addEventListener("click", () => closeModal(els.legalityModal));
els.legalityModal.addEventListener("click", (event) => {
  if (event.target === els.legalityModal) {
    closeModal(els.legalityModal);
  }
});
els.openImportBtn.addEventListener("click", openImportModal);
els.openExportBtn.addEventListener("click", openExportModal);
els.importModalCloseBtn.addEventListener("click", () => closeModal(els.importModal));
els.exportModalCloseBtn.addEventListener("click", () => closeModal(els.exportModal));
for (const modal of [els.importModal, els.exportModal]) {
  modal.addEventListener("click", (event) => {
    if (event.target === modal) {
      closeModal(modal);
    }
  });
}
els.randomCommanderBtn.addEventListener("click", loadRandomCommander);
els.randomCommanderPill.addEventListener("click", searchRandomCommander);

// Sprachumschaltung. Der Knopf zeigt die Sprache, in die er wechselt.
function updateLangToggle() {
  els.langToggle.textContent = getLang() === "de" ? "EN" : "DE";
}

// Texte mit eingesetzten Zahlen oder Namen sind nach dem Zusammenbauen
// keine Wörterbuch-Schlüssel mehr. Der Textknoten-Durchlauf erreicht sie
// deshalb nicht, sie müssen neu erzeugt werden.
function rerenderDynamicText() {
  renderResults();
  renderDeckSearchResults();
  renderCollection();
  renderDeckList();
  renderAccount();
  // Der Titel des Einklapp-Knopfs hängt am Zustand, nicht am Quelltext:
  // die Übersetzung würde sonst den ursprünglichen Text zurücksetzen.
  applySearchCollapse();
  // Der Playtester zeichnet seine Zonen selbst, der allgemeine Durchlauf
  // erwischt sie nicht.
  if (playtest.laeuft) {
    renderPlaytest();
  }
  if (state.activeDeck) {
    renderDeckEditor();
  }
}

els.langToggle.addEventListener("click", () => {
  setLang(getLang() === "de" ? "en" : "de");
  updateLangToggle();
  rerenderDynamicText();
});

els.authTabs.forEach((tab) => {
  tab.addEventListener("click", () => showAuthTab(tab.dataset.authTab));
});
els.loginForm.addEventListener("submit", handleLogin);
els.registerForm.addEventListener("submit", handleRegister);
els.recoverForm.addEventListener("submit", handleRecover);
els.profileForm.addEventListener("submit", handleProfileUpdate);
els.logoutBtn.addEventListener("click", handleLogout);
els.newRecoveryBtn.addEventListener("click", handleNewRecoveryCode);
els.copyRecoveryBtn.addEventListener("click", copyRecoveryCode);
els.dismissRecoveryBtn.addEventListener("click", hideRecoveryCode);

bindQueryButtons();
bindRandomButtons();
showDeckOverview();
renderDeckSearchResults();
renderResults();
renderSearchDetails();
renderCollection();
renderCollectionDetails();

// Die Anmeldung wird vor dem ersten Zeichnen angestossen und nicht erst
// danach: Die Playtest-Seite holt beim Laden ihr Deck, und ob das aus der
// Cloud oder aus dem Browser kommt, hängt daran. Ohne dieses Warten
// suchte ein frisch geöffneter Tab ein Cloud-Deck im localStorage und
// meldete "Deck nicht gefunden".
const authBereit = initAuth();

renderRoute();
setStatus("Bereit. Gib einen Suchbegriff ein.", "muted");

// Sprache anwenden, bevor der Rest nachlädt. setLang setzt dabei auch
// das lang-Attribut des Dokuments.
setLang(getLang());
updateLangToggle();
watchForNewContent();

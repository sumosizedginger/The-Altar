/**
 * src/ui/codex.js — Phase 3 Codex UI controller.
 *
 * The Codex is the teaching layer: browse the 40 symbols (each with a live,
 * stroke-ordered preview), the tools, zones, rituals, and the full source
 * register. Honesty rules are structural here:
 *   - parity context boxes render for EVERY tradition attached to an entry;
 *   - competing readings are shown side by side, never merged;
 *   - cautions and low confidence are labeled, never smoothed over;
 *   - zone-rule verdicts render in the data's own convention language —
 *     the UI adds no judgment of its own.
 *
 * All app flow goes through the state machine; all announcements go through
 * the event bus. This file renders state, it is not state.
 */

import { createApp } from "../core/app.js";
import { EVENTS } from "../core/events.js";
import { STATE_DESCRIPTION } from "../core/stateMachine.js";
import { SYMBOLS } from "../../data/symbols.js";
import { TOOLS } from "../../data/tools.js";
import { ZONES } from "../../data/zones.js";
import { RITUALS } from "../../data/rituals.js";
import { SOURCES } from "../../data/sources.js";
import { TRADITIONS } from "../../data/traditions.js";
import { SymbolPreview } from "./preview.js";

/* ---- data maps ---------------------------------------------------------- */
const SOURCES_BY_ID = Object.fromEntries(SOURCES.map((s) => [s.id, s]));
const TRADITION_NAMES = Object.fromEntries(Object.values(TRADITIONS).map((t) => [t.id, t.name]));

const PHASE_NOTE = {
  PLACING: "The workshop is open in the 3D room — choose from the library, set each piece, and the room will share what convention says.",
  BUILDING: "The workshop is open in the 3D room — drag, rotate, undo, and when it feels right, summarize or step toward ritual.",
  RITUAL: "Ritual Mode — guided steps, positional synthesized sound — arrives in Phase 6.",
  SUMMARY: "The summary lives in the workshop: a keepsake record and screenshot of what you placed.",
};

const VERDICT_CHIP = { allowed: "chip-solid", warned: "chip", forbidden: "chip-ink" };

const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const app = createApp();
const $ = (id) => document.getElementById(id);

/* ---- tiny DOM builder ---------------------------------------------------- */
function el(tag, attrs = {}, ...children) {
  const node = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs)) {
    if (k === "class") node.className = v;
    else if (k === "text") node.textContent = v;
    else if (k.startsWith("on")) node.addEventListener(k.slice(2), v);
    else node.setAttribute(k, v);
  }
  for (const c of children) {
    if (c == null) continue;
    node.append(c);
  }
  return node;
}
const chip = (text, cls = "chip") => el("span", { class: cls, text });

/* ---- toast ---------------------------------------------------------------- */
let toastTimer = 0;
function toast(text) {
  const t = $("toast");
  t.textContent = text;
  t.classList.add("show");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => t.classList.remove("show"), 4600);
}

/* ---- state rendering -------------------------------------------------------- */
function syncState() {
  const m = app.machine;
  const st = m.state;
  $("state-badge").textContent = st + (m.sandbox ? " · sandbox" : "");

  const atThreshold = st === "THRESHOLD";
  $("threshold").classList.toggle("gone", !atThreshold);
  $("main").hidden = atThreshold;

  const inCodex = st === "CODEX";
  $("panel-codex").hidden = !inCodex;
  $("panel-placeholder").hidden = inCodex;
  if (!inCodex) {
    $("ph-state-name").textContent = st;
    $("ph-body").textContent = STATE_DESCRIPTION[st] ?? "";
    $("ph-phase").textContent = PHASE_NOTE[st] ?? "";
    // PLACING/BUILDING will live in the 3D room; its Phase 4 preview is up
    $("ph-link").hidden = !["PLACING", "BUILDING"].includes(st);
  }

  const sandboxBox = $("sandbox-toggle");
  sandboxBox.checked = m.sandbox;
  sandboxBox.disabled = !["PLACING", "BUILDING"].includes(st);

  renderStatePaths();
}

function renderStatePaths() {
  const m = app.machine;
  const wrap = $("state-paths");
  wrap.textContent = "";
  wrap.append(
    el("button", { class: "path-btn current", text: m.state, disabled: "", title: "You are here" }),
    el("span", { text: "→", style: "color:var(--ink-faint)" }),
  );
  for (const edge of m.edgesFrom()) {
    const btn = el("button", {
      class: "path-btn",
      text: edge.to,
      title: edge.open ? `Go to ${edge.to}` : `Closed from here (${edge.reason})`,
    });
    if (!edge.open) btn.setAttribute("disabled", "");
    else btn.addEventListener("click", () => m.transition(edge.to));
    wrap.append(btn);
  }
}

/* ---- list rendering ----------------------------------------------------------- */
let activeTab = "symbols";
let activeTradition = null;
let query = "";
let lastCard = null;
let currentSelection = null;

function renderList() {
  const list = $("list");
  list.textContent = "";
  let items = [];
  if (activeTab === "symbols") items = SYMBOLS.filter(symbolMatches);
  else if (activeTab === "tools") items = TOOLS.filter(toolMatches);
  else if (activeTab === "zones") items = ZONES.filter(zoneMatches);
  else if (activeTab === "rituals") items = RITUALS.filter(ritualMatches);
  else if (activeTab === "sources") items = SOURCES.filter(sourceMatches);

  $("workarea").classList.toggle("solo", activeTab !== "symbols");

  for (const item of items) {
    const card = el("button", {
      class: "list-item card",
      role: "listitem",
      "aria-current": currentSelection?.id === item.id ? "true" : "false",
    });
    card.append(...listCardChildren(activeTab, item));
    card.addEventListener("click", () => {
      lastCard = card;
      select(activeTab, item);
    });
    list.append(card);
  }
  if (!items.length) {
    list.append(
      el("p", {
        text: "Nothing matches that search — try fewer words.",
        style: "color:var(--ink-faint);grid-column:1/-1",
      }),
    );
  }
}

function hay(...strings) {
  return strings.filter(Boolean).join(" ").toLowerCase();
}

const symbolMatches = (s) =>
  (!activeTradition || s.traditions.includes(activeTradition)) &&
  (!query || hay(s.name, s.id, s.meaning, s.intent, s.history).includes(query));

const toolMatches = (t) => !query || hay(t.name, t.id, t.aka, t.description, t.whenUsed).includes(query);
const zoneMatches = (z) => !query || hay(z.name, z.id, z.description).includes(query);
const ritualMatches = (r) => !query || hay(r.name, r.id, r.description).includes(query);
const sourceMatches = (s) => !query || hay(s.title, s.author, s.id, s.note).includes(query);

function listCardChildren(kind, item) {
  if (kind === "symbols") {
    const chips = [chip(item.animationType, "chip chip-outline")];
    if (item.contested) chips.push(chip("contested"));
    if (item.confidence === "low") chips.push(chip("low confidence"));
    if (item.caution) chips.push(chip("display note"));
    return [
      el("span", { class: "name", text: item.name }),
      el("span", {
        class: "meta",
        text: item.traditions.map((t) => TRADITION_NAMES[t] ?? t).join(" · "),
      }),
      el("span", { class: "chipline" }, ...chips),
    ];
  }
  if (kind === "tools") {
    return [
      el("span", { class: "name", text: item.name }),
      el("span", {
        class: "meta",
        text: [item.category, item.traditions?.join(" · ")].filter(Boolean).join(" — "),
      }),
      ...(item.caution ? [el("span", { class: "chipline" }, chip("caution"))] : []),
    ];
  }
  if (kind === "zones") {
    return [
      el("span", { class: "name", text: item.name }),
      el("span", { class: "meta", text: `${bearingLabel(item.compassBearing)} · ${item.heightBand}` }),
    ];
  }
  if (kind === "rituals") {
    return [
      el("span", { class: "name", text: item.name }),
      el("span", { class: "meta", text: `${item.steps.length} steps · ~${item.estimatedMinutes} min` }),
    ];
  }
  return [
    el("span", { class: "name", text: `${item.author}, ${item.year}` }),
    el("span", { class: "meta", text: item.title }),
    el("span", { class: "chipline" }, chip(item.type, "chip chip-outline")),
  ];
}

function bearingLabel(deg) {
  if (deg == null) return "—";
  const names = ["N", "NE", "E", "SE", "S", "SW", "W", "NW"];
  return `${names[Math.round(deg / 45) % 8]} · ${deg}°`;
}

/* ---- selection + detail ---------------------------------------------------------- */
function select(kind, item) {
  currentSelection = item;
  app.bus.emit(EVENTS.CODEX_SELECT, { kind, id: item.id });
  renderList();
  renderDetail(kind, item);
  $("detail").hidden = false;
  $("btn-close").focus();
}

function closeDetail() {
  currentSelection = null;
  $("detail").hidden = true;
  preview?.pause();
  renderList();
  lastCard?.focus();
}

function fields(pairs) {
  const dl = el("dl", { class: "fields" });
  for (const [k, v] of pairs) {
    if (v == null || v === "") continue;
    dl.append(el("dt", { text: k }), el("dd", { text: String(v) }));
  }
  return dl;
}

function contextBox(title, paragraphs, { gold = false, listItems = null } = {}) {
  const box = el("div", { class: "context-box" + (gold ? " gold-rule" : "") }, el("h4", { text: title }));
  for (const p of paragraphs ?? []) box.append(el("p", { text: p }));
  if (listItems) box.append(el("ul", {}, ...listItems.map((t) => el("li", { text: t }))));
  return box;
}

function renderDetail(kind, item) {
  const body = $("detail-body");
  body.textContent = "";
  $("detail-chips").textContent = "";

  if (kind !== "symbols") {
    $("preview-wrap").hidden = true;
    $("detail-actions").hidden = true;
    $("detail-title").textContent = item.name;
    if (kind === "tools") renderToolDetail(body, item);
    else if (kind === "zones") renderZoneDetail(body, item);
    else if (kind === "rituals") renderRitualDetail(body, item);
    else renderSourceDetail(body, item);
    return;
  }

  $("preview-wrap").hidden = false;
  $("detail-actions").hidden = false;
  $("detail-title").textContent = item.name;
  const chips = $("detail-chips");
  chips.append(chip(item.animationType, "chip chip-outline"));
  if (item.contested) chips.append(chip("contested"));
  if (item.confidence === "low") chips.append(chip("low confidence"));

  const prose = el("div", { class: "prose" });
  prose.append(el("h3", { text: "Meaning" }), el("p", { text: item.meaning }));
  if (item.intent) prose.append(el("h3", { text: "Intent" }), el("p", { text: item.intent }));
  prose.append(el("h3", { text: "History" }), el("p", { text: item.history }));
  if (item.whenUsed) prose.append(el("h3", { text: "When used" }), el("p", { text: item.whenUsed }));
  if (item.whereUsed) prose.append(el("h3", { text: "Where placed" }), el("p", { text: item.whereUsed }));

  const strokeOl = el("ol", {}, ...(item.strokeOrder ?? []).map((s) => el("li", { text: s })));
  prose.append(el("h3", { text: "How it is drawn — stroke order" }), strokeOl);

  /* honesty structure: caution → competing readings → per-tradition parity boxes */
  if (item.caution) body.append(contextBox("A note before displaying", [item.caution], { gold: true }));
  if (item.competingInterpretations?.length) {
    body.append(
      contextBox("Readings differ — shown side by side", null, {
        listItems: item.competingInterpretations,
      }),
    );
  }
  for (const tid of item.traditions) {
    const t = TRADITIONS[tid];
    if (!t?.contextBox) continue;
    body.append(
      contextBox(`Context — ${t.name}`, [
        t.contextBox.howUsed,
        `Common concerns: ${t.contextBox.commonConcerns}`,
      ]),
    );
  }

  const rules = Object.entries(item.zoneRules ?? {});
  if (rules.length) {
    prose.append(el("h3", { text: "Placement notes" }));
    for (const [zoneId, r] of rules) {
      const zone = ZONES.find((z) => z.id === zoneId);
      prose.append(
        el(
          "div",
          { class: "context-box", style: "margin:0.5rem 0" },
          el(
            "h4",
            {},
            chip(r.verdict, VERDICT_CHIP[r.verdict] ?? "chip"),
            el("span", { text: `${zone?.name ?? zoneId}`, style: "margin-left:.5rem" }),
          ),
          el("p", { text: r.rationale }),
        ),
      );
    }
  }

  /* sources, resolved from the register only — never invented */
  prose.append(el("h3", { text: "Sources" }));
  const srcList = el("ul", {});
  for (const sid of item.sources ?? []) {
    const s = SOURCES_BY_ID[sid];
    if (!s) continue;
    srcList.append(
      el(
        "li",
        {},
        el("strong", { text: `${s.author}, ${s.year}` }),
        el("span", { text: ` — ${s.title} ` }),
        el("em", { text: `(${s.type})` }),
        s.note
          ? el("div", { text: s.note, style: "color:var(--ink-faint);font-size:.88rem" })
          : null,
      ),
    );
  }
  prose.append(srcList);
  if (item.confidence === "low") {
    prose.append(
      el("p", {
        text: "This entry is labeled low-confidence: the claims above are not pinned to the listed sources, and we would rather say so than borrow certainty.",
        style: "color:var(--ink-faint);font-size:.9rem;font-style:italic",
      }),
    );
  }

  body.append(prose);
  preview?.show(item);
  preview?.resume();
}

function renderToolDetail(body, t) {
  body.append(
    fields([
      ["Also known as", t.aka],
      ["Category", t.category],
      ["Traditions", t.traditions?.join(", ")],
      ["Height", t.heightClass],
      ["Sound", t.sound],
    ]),
  );
  body.append(
    el(
      "div",
      { class: "prose" },
      el("h3", { text: "What it is" }),
      el("p", { text: t.description }),
      t.whenUsed ? el("h3", { text: "When used" }) : null,
      t.whenUsed ? el("p", { text: t.whenUsed }) : null,
    ),
  );
  if (t.caution) body.append(contextBox("Handle with care", [t.caution], { gold: true }));
}

function renderZoneDetail(body, z) {
  body.append(
    fields([
      ["Height band", z.heightBand],
      ["Compass", bearingLabel(z.compassBearing)],
      ["Capacity", z.capacity],
    ]),
  );
  body.append(
    el("div", { class: "prose" }, el("h3", { text: "What it holds" }), el("p", { text: z.description })),
  );
  if (z.adjacencyNote) body.append(contextBox("Sits well beside", [z.adjacencyNote]));
}

function renderRitualDetail(body, r) {
  body.append(
    fields([
      ["Length", `about ${r.estimatedMinutes} minutes`],
      ["Steps", r.steps.length],
      ["Restores", r.restore],
    ]),
  );
  if (r.disclaimer) body.append(contextBox("Before you begin", [r.disclaimer], { gold: true }));
  const ol = el("ol", {});
  for (const s of r.steps) {
    const line = el("li", { text: s.instruction });
    if (s.hint?.text) {
      line.append(
        el("div", { text: `hint: ${s.hint.text}`, style: "color:var(--ink-faint);font-size:.85rem" }),
      );
    }
    ol.append(line);
  }
  body.append(
    el(
      "div",
      { class: "prose" },
      el("h3", { text: "The steps" }),
      ol,
      el("p", {
        style: "color:var(--ink-faint);font-size:.85rem",
        text: "Step-by-step guidance and sound arrive with Ritual Mode (Phase 6); the Codex shows the outline only.",
      }),
    ),
  );
}

function renderSourceDetail(body, s) {
  body.append(
    fields([
      ["Author", s.author],
      ["Year", s.year],
      ["Type", s.type],
    ]),
  );
  body.append(
    el(
      "div",
      { class: "prose" },
      el("h3", { text: "Title" }),
      el("p", { text: s.title }),
      s.note ? el("h3", { text: "Why it is listed" }) : null,
      s.note ? el("p", { text: s.note }) : null,
    ),
  );
}

/* ---- preview lifecycle --------------------------------------------------------- */
let preview = null;

function ensurePreview() {
  if (preview) return;
  preview = new SymbolPreview($("preview"), app.bus, { reducedMotion });
  preview.pause(); // resumes when a symbol is selected
}

/* ---- wiring ------------------------------------------------------------------------ */
function setTab(tab) {
  activeTab = tab;
  closeDetail();
  for (const btn of document.querySelectorAll(".tab")) {
    btn.setAttribute("aria-selected", String(btn.dataset.tab === tab));
  }
  $("symbols-toolbar").style.display = tab === "symbols" ? "" : "none";
  app.bus.emit(EVENTS.CODEX_TAB, { tab });
  renderList();
}

function buildTraditionChips() {
  const wrap = $("tradition-chips");
  wrap.textContent = "";
  const all = el("button", {
    class: "filter-chip",
    text: "all traditions",
    "aria-pressed": String(activeTradition === null),
  });
  all.addEventListener("click", () => {
    activeTradition = null;
    app.bus.emit(EVENTS.CODEX_FILTER, { tradition: null });
    buildTraditionChips();
    renderList();
  });
  wrap.append(all);
  for (const [tid, name] of Object.entries(TRADITION_NAMES)) {
    const b = el("button", {
      class: "filter-chip",
      text: name,
      "aria-pressed": String(activeTradition === tid),
    });
    b.addEventListener("click", () => {
      activeTradition = activeTradition === tid ? null : tid;
      app.bus.emit(EVENTS.CODEX_FILTER, { tradition: activeTradition });
      buildTraditionChips();
      renderList();
    });
    wrap.append(b);
  }
}

function boot() {
  /* threshold */
  $("btn-enter").addEventListener("click", () => app.machine.transition("CODEX"));
  $("btn-reset").addEventListener("click", () => app.machine.reset());

  /* sandbox */
  $("sandbox-toggle").addEventListener("change", (e) => {
    app.machine.setSandbox(e.target.checked);
    e.target.checked = app.machine.sandbox; // revert on gentle refusal
  });

  /* tabs */
  for (const btn of document.querySelectorAll(".tab")) {
    btn.addEventListener("click", () => setTab(btn.dataset.tab));
  }

  /* search */
  let debounce = 0;
  $("search").addEventListener("input", (e) => {
    clearTimeout(debounce);
    debounce = setTimeout(() => {
      query = e.target.value.trim().toLowerCase();
      app.bus.emit(EVENTS.CODEX_SEARCH, { query });
      renderList();
    }, 140);
  });

  /* detail actions */
  $("btn-close").addEventListener("click", closeDetail);
  $("btn-replay").addEventListener("click", () => preview?.replay());
  if (reducedMotion) {
    const rb = $("btn-replay");
    rb.disabled = true;
    rb.title =
      "Replay is off because your system has Reduce Motion enabled; the finished symbol is shown instead.";
  }

  /* keyboard: Escape closes the detail pane. The canvas has
     pointer-events:none, so focus always lives on DOM elements and this
     handler can never fight a canvas drag. */
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && !$("detail").hidden) closeDetail();
  });

  /* bus subscriptions — the UI is a view of the machine */
  app.bus.on(EVENTS.STATE_CHANGE, syncState);
  app.bus.on(EVENTS.SANDBOX_CHANGE, syncState);
  app.bus.on(EVENTS.APP_NOTICE, (n) => toast(n.text));

  /* static scaffolding */
  buildTraditionChips();
  renderList();
  syncState();
  ensurePreview();
}

boot();

/**
 * scripts/test-imports.mjs — static module-reference gate.
 *
 * Catches the "call exists, import never landed" bug class (createCameraRig,
 * 2026-10) that syntax checks and headless suites cannot see in
 * browser-only modules: for every module under src/, every bare identifier
 * that is CALLED or constructed with `new` must be bound — imported,
 * declared locally, a function parameter, or a whitelisted standard
 * global. Also verifies every imported specifier actually exists among the
 * target module's exports (catches renamed-import drift).
 *
 * Deliberately strict: add a genuine new global to GLOBALS explicitly.
 */

import { readFileSync, readdirSync, statSync } from "node:fs";
import { join, relative } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(fileURLToPath(new URL(import.meta.url)), "..", "..", "src");

/** Language keywords that may appear in call-like position. */
const KEYWORDS = new Set([
  "if", "else", "for", "while", "do", "switch", "case", "default", "return",
  "throw", "try", "catch", "finally", "function", "new", "typeof", "instanceof",
  "in", "of", "await", "async", "yield", "break", "continue", "delete", "void",
  "constructor", "get", "set", "static", "super", "this", "with", "debugger",
]);

/** Standard globals (browser + Node) that need no binding in-module. */
const GLOBALS = new Set([
  // browsers
  "document", "window", "location", "navigator", "history", "screen", "localStorage",
  "sessionStorage", "matchMedia", "requestAnimationFrame", "cancelAnimationFrame",
  "setTimeout", "setInterval", "setImmediate", "clearTimeout", "clearInterval",
  "clearImmediate", "performance", "console", "fetch", "alert", "confirm", "prompt",
  "getComputedStyle", "innerWidth", "innerHeight", "outerWidth", "outerHeight",
  "devicePixelRatio", "CustomEvent", "Event", "KeyboardEvent", "PointerEvent",
  "MouseEvent", "ResizeObserver", "IntersectionObserver", "MutationObserver",
  "AudioContext", "webkitAudioContext", "OfflineAudioContext", "Blob", "URL", "URLSearchParams", "Headers", "Request", "Response", "File",
  "FileReader", "FormData", "Image", "HTMLElement", "HTMLInputElement",
  "HTMLSelectElement", "HTMLTextAreaElement", "HTMLCanvasElement", "HTMLImageElement",
  "DOMParser", "AbortController", "crypto", "atob", "btoa", "Worker",
  "XMLHttpRequest", "WebSocket", "addEventListener", "removeEventListener",
  "dispatchEvent", "open", "close", "postMessage", "structuredClone", "reportError",
  // ECMA + Node
  "Math", "JSON", "Object", "Array", "Set", "Map", "WeakMap", "WeakSet", "Proxy",
  "Reflect", "Symbol", "BigInt", "Boolean", "Number", "String", "Float32Array",
  "Float64Array", "Int8Array", "Int16Array", "Int32Array", "Uint8Array",
  "Uint8ClampedArray", "Uint16Array", "Uint32Array", "ArrayBuffer", "DataView",
  "Promise", "Date", "RegExp", "Error", "TypeError", "RangeError", "SyntaxError",
  "isNaN", "isFinite", "parseInt", "parseFloat", "encodeURIComponent",
  "decodeURIComponent", "encodeURI", "decodeURI", "TextEncoder", "TextDecoder",
  "queueMicrotask", "import", "globalThis", "self", "require", "module", "exports",
  "undefined", "NaN", "Infinity", "eval",
]);

/* ---- source scanning (comments, strings, template literals stripped) ---- */

function stripNonCode(src) {
  let out = "";
  let i = 0;
  const n = src.length;
  while (i < n) {
    const c = src[i];
    const d = src[i + 1];
    if (c === "/" && d === "/") {
      while (i < n && src[i] !== "\n") i++;
      continue;
    }
    if (c === "/" && d === "*") {
      i += 2;
      while (i < n && !(src[i] === "*" && src[i + 1] === "/")) i++;
      i += 2;
      continue;
    }
    if (c === "'" || c === '"') {
      const quote = c;
      i++;
      while (i < n && src[i] !== quote) i += src[i] === "\\" ? 2 : 1;
      i++;
      continue;
    }
    if (c === "`") {
      i++;
      while (i < n && src[i] !== "`") i += src[i] === "\\" ? 2 : 1;
      i++;
      continue;
    }
    out += c;
    i++;
  }
  return out;
}

function collectBindings(code) {
  const bound = new Set();
  // imports: named, default, namespace
  for (const m of code.matchAll(/import\s+(?:([A-Za-z_$][\w$]*)\s*,\s*)?(?:\{([^}]*)\}|(?:\*\s*as\s+([A-Za-z_$][\w$]*)))/g)) {
    if (m[1]) bound.add(m[1]);
    if (m[3]) bound.add(m[3]);
    if (m[2]) {
      for (const spec of m[2].split(",")) {
        const name = spec.trim().split(/\s+as\s+/).pop()?.trim();
        if (name) bound.add(name);
      }
    }
  }
  // declarations
  for (const m of code.matchAll(/\b(?:function|const|let|var|class)\s+([A-Za-z_$][\w$]*)/g)) bound.add(m[1]);
  // destructured const/let: objects and arrays
  for (const m of code.matchAll(/\b(?:const|let|var)\s*\{([^}]*)\}\s*=/g)) {
    for (const part of m[1].split(",")) {
      const name = part.trim().split(/\s*:\s*/).pop()?.split(/\s*=/)[0]?.trim();
      if (name && /^[A-Za-z_$][\w$]*$/.test(name)) bound.add(name);
    }
  }
  for (const m of code.matchAll(/\b(?:const|let|var)\s*\[([^\]]*)\]\s*=/g)) {
    for (const part of m[1].split(",")) {
      const name = part.trim().split(/\s*=\s*/)[0]?.trim();
      if (name && /^[A-Za-z_$][\w$]*$/.test(name)) bound.add(name);
    }
  }
  // object/class method shorthand: name(...) {  — after { , } at line starts
  for (const m of code.matchAll(/(?:\{|,|\})\s*\n\s*([A-Za-z_$][\w$]*)\s*\(([^()]*)\)\s*\{/g)) {
    bound.add(m[1]);
    addParams(m[2], bound);
  }
  // getters/setters
  for (const m of code.matchAll(/\b(?:get|set)\s+([A-Za-z_$][\w$]*)\s*\(/g)) bound.add(m[1]);
  // parameters: function decls (named + anonymous), arrow groups, single-arg arrows, catch
  for (const m of code.matchAll(/\bfunction\s*[A-Za-z_$]?[\w$]*\s*\(([^)]*)\)/g)) addParams(m[1], bound);
  for (const m of code.matchAll(/\(([^()]*)\)\s*=>/g)) addParams(m[1], bound);
  for (const m of code.matchAll(/(?<![.\w$"'`])([A-Za-z_$][\w$]*)\s*=>/g)) bound.add(m[1]);
  for (const m of code.matchAll(/\bcatch\s*\(\s*([A-Za-z_$][\w$]*)/g)) bound.add(m[1]);
  return bound;
}

function addParams(list, bound) {
  for (const raw of list.split(",")) {
    const piece = raw.trim().replace(/^[{[]/, "").replace(/[}\]]$/, "");
    for (const name of piece.split(/\s*:\s*/)) {
      const id = name.trim().split(/\s*=/)[0]?.trim();
      if (id && /^[A-Za-z_$][\w$]*$/.test(id)) bound.add(id);
    }
  }
}

function collectUsages(code) {
  const used = new Map(); // name -> first call site line
  for (const m of code.matchAll(/(?<![.\w$"'`])([A-Za-z_$][\w$]*)\s*\(/g)) {
    if (!used.has(m[1])) used.set(m[1], code.slice(0, m.index).split("\n").length);
  }
  for (const m of code.matchAll(/\bnew\s+([A-Za-z_$][\w$]*)/g)) {
    if (!used.has(m[1])) used.set(m[1], code.slice(0, m.index).split("\n").length);
  }
  return used;
}

/* ---- export tables for the specifier check ------------------------------- */

const EXPORT_CACHE = new Map();
function exportsOf(file) {
  if (EXPORT_CACHE.has(file)) return EXPORT_CACHE.get(file);
  const src = readFileSync(file, "utf8");
  const names = new Set();
  let hasDefault = false;
  for (const m of src.matchAll(/export\s+(?:const|let|var|function|class)\s+([A-Za-z_$][\w$]*)/g)) names.add(m[1]);
  for (const m of src.matchAll(/export\s*\{([^}]*)\}/g)) {
    for (const spec of m[1].split(",")) {
      const name = spec.trim().split(/\s+as\s+/).pop()?.trim();
      if (name) names.add(name);
    }
  }
  if (/export\s+default/.test(src)) hasDefault = true;
  const result = { names, hasDefault };
  EXPORT_CACHE.set(file, result);
  return result;
}

/* ---- walk src/ ------------------------------------------------------------ */

function walk(dir) {
  const files = [];
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) files.push(...walk(full));
    else if (entry.endsWith(".js")) files.push(full);
  }
  return files;
}

let problems = 0;
for (const file of walk(ROOT)) {
  const raw = readFileSync(file, "utf8");
  const code = stripNonCode(raw);
  const rel = relative(ROOT, file);

  // 1) imported specifiers exist in the target module
  for (const m of raw.matchAll(/import\s+(?:([A-Za-z_$][\w$]*)\s*,?\s*)?(?:\{([^}]*)\})?\s*(?:\*\s*as\s+[A-Za-z_$][\w$]*\s*)?from\s+["']([^"']+)["']/g)) {
    const [, defaultName, named, spec] = m;
    if (!spec.startsWith(".") && !spec.startsWith("/")) continue; // bare (three shim)
    const target = new URL(spec, `file://${file}`).pathname;
    let table;
    try {
      table = exportsOf(target);
    } catch {
      console.log(`  ✗ ${rel}: import target not found: ${spec}`);
      problems++;
      continue;
    }
    if (defaultName && !table.hasDefault) {
      console.log(`  ✗ ${rel}: "${spec}" has no default export (for ${defaultName})`);
      problems++;
    }
    if (named) {
      for (const specItem of named.split(",")) {
        const wanted = specItem.trim().split(/\s+as\s+/)[0]?.trim();
        if (!wanted) continue;
        if (!table.names.has(wanted)) {
          console.log(`  ✗ ${rel}: "${spec}" does not export "${wanted}"`);
          problems++;
        }
      }
    }
  }

  // 2) every used identifier is bound
  const bound = collectBindings(code);
  for (const [name, line] of collectUsages(code)) {
    if (bound.has(name) || GLOBALS.has(name) || KEYWORDS.has(name)) continue;
    console.log(`  ✗ ${rel}:${line}: "${name}" is used but never imported or declared`);
    problems++;
  }
}

if (problems) {
  console.log(`\nRESULT: FAIL — ${problems} module-reference problem(s)\n`);
  process.exit(1);
}
console.log("RESULT: PASS — every called/constructed identifier is bound; every import resolves to a real export\n");

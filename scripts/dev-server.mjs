#!/usr/bin/env node
/**
 * scripts/dev-server.mjs — minimal static server for The Altar.
 *
 * Replaces `python3 -m http.server` for development because it sends
 * `Cache-Control: no-store` on every response. The project ships ES
 * modules with plain relative URLs; without no-store, browsers can
 * serve stale module copies via heuristic caching and the page fails
 * silently in confusing ways.
 *
 *   node scripts/dev-server.mjs [port]
 */
import http from "node:http";
import { readFile } from "node:fs/promises";
import { createReadStream, existsSync, statSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const PORT = Number(process.argv[2] || 8000);

const MIME = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".mjs": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".svg": "image/svg+xml",
  ".ico": "image/x-icon",
  ".woff2": "font/woff2",
};

const server = http.createServer(async (req, res) => {
  try {
    const url = new URL(req.url, `http://${req.headers.host ?? "localhost"}`);
    let pathname = decodeURIComponent(url.pathname);
    if (pathname.endsWith("/")) pathname += "index.html";
    const file = path.normalize(path.join(ROOT, pathname));
    if (!file.startsWith(ROOT + path.sep) && file !== ROOT) {
      res.writeHead(403).end("forbidden");
      return;
    }
    if (!existsSync(file) || !statSync(file).isFile()) {
      res.writeHead(404, { "Content-Type": "text/plain" }).end(`404 ${pathname}`);
      return;
    }
    res.writeHead(200, {
      "Content-Type": MIME[path.extname(file).toLowerCase()] ?? "application/octet-stream",
      "Cache-Control": "no-store",
      "Access-Control-Allow-Origin": "*",
    });
    createReadStream(file).pipe(res);
  } catch (e) {
    res.writeHead(500).end(String(e));
  }
});

server.listen(PORT, "0.0.0.0", () => {
  console.log(`The Altar dev server on http://0.0.0.0:${PORT} (Cache-Control: no-store)`);
});

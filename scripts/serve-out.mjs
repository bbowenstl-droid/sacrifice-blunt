#!/usr/bin/env node
// Local preview that behaves like GitHub Pages: serves out/ under PAGES_BASE_PATH,
// resolves folder/index.html, and falls back to 404.html.
import http from "node:http";
import fs from "node:fs";
import path from "node:path";

const root = path.resolve(path.dirname(new URL(import.meta.url).pathname), "../out");
const base = (process.env.PAGES_BASE_PATH ?? "").replace(/\/$/, "");
const port = Number(process.env.PORT ?? 4000);
const types = { ".html": "text/html; charset=utf-8", ".js": "text/javascript", ".css": "text/css", ".json": "application/json", ".png": "image/png", ".jpg": "image/jpeg", ".webp": "image/webp", ".svg": "image/svg+xml", ".woff2": "font/woff2", ".pdf": "application/pdf", ".xml": "application/xml", ".txt": "text/plain", ".webmanifest": "application/manifest+json", ".ico": "image/x-icon" };

http.createServer((req, res) => {
  const url = decodeURIComponent((req.url ?? "/").split("?")[0]);
  const send = (file, status = 200) => { res.writeHead(status, { "content-type": types[path.extname(file)] ?? "application/octet-stream" }); fs.createReadStream(file).pipe(res); };
  if (base && url === base) { res.writeHead(301, { location: base + "/" }); return res.end(); }
  if (base && !url.startsWith(base + "/")) return send(path.join(root, "404.html"), 404);
  let p = path.join(root, url.slice(base.length));
  if (!p.startsWith(root)) return send(path.join(root, "404.html"), 404);
  if (fs.existsSync(p) && fs.statSync(p).isDirectory()) {
    if (!url.endsWith("/")) { res.writeHead(301, { location: url + "/" }); return res.end(); }
    p = path.join(p, "index.html");
  }
  if (fs.existsSync(p)) return send(p);
  return send(path.join(root, "404.html"), 404);
}).listen(port, () => console.log(`Serving out/ at http://localhost:${port}${base}/`));

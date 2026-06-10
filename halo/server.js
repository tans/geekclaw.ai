import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import { extname, join, normalize } from "node:path";

const port = Number(process.env.PORT || "26222");
const publicDir = join(process.cwd(), "public");

const contentTypes = {
  ".css": "text/css; charset=utf-8",
  ".html": "text/html; charset=utf-8",
  ".ico": "image/x-icon",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".png": "image/png",
  ".svg": "image/svg+xml; charset=utf-8",
  ".webp": "image/webp",
};

function send(res, status, body, type = "text/plain; charset=utf-8") {
  res.writeHead(status, { "content-type": type });
  res.end(body);
}

async function serveFile(pathname, res) {
  const safePath = normalize(pathname).replace(/^(\.\.[/\\])+/, "");
  const filePath = join(publicDir, safePath);
  try {
    const file = await readFile(filePath);
    const type = contentTypes[extname(filePath).toLowerCase()] || "application/octet-stream";
    res.writeHead(200, { "content-type": type, "cache-control": "public, max-age=600" });
    res.end(file);
    return true;
  } catch {
    return false;
  }
}

const server = createServer(async (req, res) => {
  const url = new URL(req.url || "/", `http://${req.headers.host || "127.0.0.1"}`);
  const pathname = url.pathname;

  if (pathname === "/health") {
    return send(
      res,
      200,
      JSON.stringify({ ok: true, service: "halo", now: new Date().toISOString() }),
      "application/json; charset=utf-8",
    );
  }

  if (pathname !== "/" && await serveFile(pathname.slice(1), res)) {
    return;
  }

  if (pathname === "/" || pathname === "/index.html") {
    const html = await readFile(join(publicDir, "index.html"), "utf8");
    return send(res, 200, html, "text/html; charset=utf-8");
  }

  send(res, 404, "Not Found");
});

server.listen(port, "0.0.0.0", () => {
  console.log(`[halo] running on http://127.0.0.1:${port}`);
});

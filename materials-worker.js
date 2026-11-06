import catalog from "./resources-data.json";

const files = new Map();
for (const item of catalog.items) {
  for (const variant of item.variants) files.set(variant.url, {type: "image/png", name: variant.downloadName});
  files.set(item.zip.url, {type: "application/zip", name: item.id + ".zip"});
}

/** @type {ExportedHandler<Env>} */
export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (!url.pathname.startsWith("/materials/")) return env.ASSETS.fetch(request);
    if (request.method !== "GET" && request.method !== "HEAD") {
      return new Response("Method not allowed", {status: 405, headers: {Allow: "GET, HEAD"}});
    }
    const file = files.get(url.pathname);
    if (!file) return new Response("File not found", {status: 404});
    try {
      const key = url.pathname.slice("/materials/".length);
      const data = request.method === "GET" ? await env.MATERIALS.get(key) : null;
      const object = request.method === "HEAD" ? await env.MATERIALS.head(key) : data;
      if (!object) return new Response("File not found", {status: 404});
      const headers = new Headers({
        "Content-Type": file.type,
        "Content-Length": String(object.size),
        "Cache-Control": "public, max-age=31536000, immutable",
        "ETag": object.httpEtag,
        "X-Content-Type-Options": "nosniff",
        "Content-Disposition": 'attachment; filename="' + file.name + '"'
      });
      if (request.headers.get("If-None-Match") === object.httpEtag) {
        return new Response(null, {status: 304, headers: {"ETag": object.httpEtag, "Cache-Control": "public, max-age=31536000, immutable"}});
      }
      return new Response(data ? data.body : null, {headers});
    } catch {
      return new Response("Download temporarily unavailable", {status: 503, headers: {"Retry-After": "30"}});
    }
  }
};

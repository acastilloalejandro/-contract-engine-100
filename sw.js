/*
 * Contract Engine 100 · Field System
 * Copyright (c) 2026 Alejandro Hernández Castillo
 * Contact: acastilloalejandro@icloud.com
 * License: see LICENSE and NOTICE.md at the repository root.
 * Third-party components, dependencies, and assets remain under their own licenses.
 */
const CACHE_NAME = "ce100-shell-v5.2.1-bithome-fusion";
const SHELL = [
  "./",
  "./index.html",
  "./verify.html",
  "./config.js",
  "./manifest.webmanifest",
  "./styles/world-ui.css",
  "./app/main.js",
  "./app/schema.js",
  "./app/engine.js",
  "./app/ui.js",
  "./app/contract-preview.js",
  "./app/auth.js",
  "./app/onboarding-ui.js",
  "./app/verify.js",
  "./vendor/qrcode.min.js",
  "./icons/contract-engine.svg",
  "./icons/bithome.svg",
  "./real-estate/index.html",
  "./real-estate/main.js",
  "./real-estate/schema.js",
  "./real-estate/style.css"
];

self.addEventListener("install", event => {
  event.waitUntil((async () => {
    const cache = await caches.open(CACHE_NAME);
    const base = self.registration.scope;
    await cache.addAll(SHELL.map(path => new URL(path, base).href));
    await self.skipWaiting();
  })());
});

self.addEventListener("activate", event => {
  event.waitUntil((async () => {
    const names = await caches.keys();
    await Promise.all(names.filter(name => name.startsWith("ce100-shell-") && name !== CACHE_NAME)
      .map(name => caches.delete(name)));
    await self.clients.claim();
  })());
});

self.addEventListener("fetch", event => {
  const request = event.request;
  if (request.method !== "GET") return;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  // Keep the public runtime configuration fresh; never cache API responses.
  // Only public static pages/assets are cached. API routes and unknown paths always bypass this worker.
  const base = self.registration.scope;
  const publicPaths = new Set(SHELL.map(path => new URL(path, base).pathname));
  const realEstateHome = new URL("./real-estate/", base).pathname;
  const allowedNavigations = new Set([
    new URL("./", base).pathname,
    new URL("./index.html", base).pathname,
    new URL("./real-estate/index.html", base).pathname,
    realEstateHome,
    new URL("./verify.html", base).pathname
  ]);
  if (url.pathname.includes("/v1/") || url.pathname.includes("/api/") || request.headers.has("Authorization")) return;
  const isConfig = url.pathname === new URL("./config.js", base).pathname;
  if (request.mode === "navigate" && !allowedNavigations.has(url.pathname)) return;
  if (request.mode !== "navigate" && !publicPaths.has(url.pathname)) return;
  if (request.mode === "navigate" || isConfig) {
    event.respondWith((async () => {
      try {
        const response = await fetch(request);
        if (response.ok && url.origin === self.location.origin) {
          const cache = await caches.open(CACHE_NAME);
          await cache.put(request, response.clone());
        }
        return response;
      } catch {
        return await caches.match(request, { ignoreSearch: true }) ||
          (url.pathname === realEstateHome
            ? await caches.match(new URL("./real-estate/index.html", base).href)
            : await caches.match(new URL("./index.html", base).href));
      }
    })());
    return;
  }

  event.respondWith((async () => {
    const cached = await caches.match(request);
    if (cached) return cached;
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(CACHE_NAME);
      await cache.put(request, response.clone());
    }
    return response;
  })());
});

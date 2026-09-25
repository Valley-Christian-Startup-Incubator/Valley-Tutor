// Frozen at build time (module-load time, during `next build`), not at
// request time — the pages that use this are statically prerendered, so the
// value gets baked into the built HTML once per deploy. Appended as a cache-
// busting query param to the legacy public/*.js script tags: those files
// have stable, unhashed URLs and change on every deploy, so without this a
// browser (or CDN) holding a cached copy of e.g. auth.js under the old URL
// has no way to know a new deploy exists until its cache TTL expires —
// this makes every deploy request a URL that was never cached before,
// which is unaffected by any cache header/TTL either they or an upstream
// proxy chooses to apply.
export const BUILD_VERSION = String(Date.now());

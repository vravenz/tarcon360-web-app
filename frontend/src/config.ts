// frontend/src/config.ts

// Local dev: CRA usually runs on 3000, backend on 4000
const isLocal = typeof window !== "undefined" && window.location.hostname === "localhost"

// ✅ Use same-origin on production (Vercel): backend is /api on same domain
export const BACKEND_URL = isLocal ? "http://localhost:4000" : ""

// For static files, stop using VPS/static URL.
// Use Supabase Storage public URL instead.
export const STATIC_URL = isLocal ? "http://localhost:4000" : ""

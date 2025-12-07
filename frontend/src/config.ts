// // frontend/src/config.ts
// const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:4000';
// const STATIC_URL = process.env.REACT_APP_STATIC_URL || 'http://localhost';

// export { BACKEND_URL, STATIC_URL };

// // const BACKEND_URL =
// //   process.env.REACT_APP_BACKEND_URL || 'http://162.0.225.181:4000';
// // const STATIC_URL =
// //   process.env.REACT_APP_STATIC_URL || 'http://162.0.225.181';

// // export { BACKEND_URL, STATIC_URL };


// Auto-detect environment
const isBrowser = typeof window !== "undefined";
const isProduction = isBrowser && !window.location.hostname.includes("localhost");

// Auto backend URL resolution
let BACKEND_URL = "http://localhost:4000"; // default for local dev
let STATIC_URL = "http://localhost";

if (isProduction) {
  // Automatically use VPS origin for production
  const origin = window.location.origin; // e.g. http://159.198.46.146
  BACKEND_URL = `${origin}:4000`;        // backend on port 4000
  STATIC_URL = origin;
}

// Allow .env to override (optional)
BACKEND_URL = process.env.REACT_APP_BACKEND_URL || BACKEND_URL;
STATIC_URL = process.env.REACT_APP_STATIC_URL || STATIC_URL;

export { BACKEND_URL, STATIC_URL };

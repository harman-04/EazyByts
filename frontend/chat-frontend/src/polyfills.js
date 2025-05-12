// src/polyfills.js
// Polyfill 'global' for environments where it's not defined (like modern browsers)
if (typeof global === 'undefined') {
  window.global = window;
}

// Some libraries might also expect 'process.env'
if (typeof process === 'undefined') {
  window.process = { env: {} };
}
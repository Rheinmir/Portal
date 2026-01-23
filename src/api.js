/**
 * API URL Helper for Netlify Deployment
 *
 * Production: Uses VITE_API_URL environment variable pointing to backend server
 * Development: Uses relative path (Vite proxy handles /api/* requests)
 */

const API_BASE = import.meta.env.VITE_API_URL || "";

/**
 * Constructs the full API URL for a given path
 * @param {string} path - API path starting with /api/
 * @returns {string} Full URL for the API endpoint
 */
export function apiUrl(path) {
  return API_BASE + path;
}

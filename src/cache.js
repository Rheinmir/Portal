const PREFIX = "portal_cache_";

export function getCached(tenant) {
  try {
    const raw = localStorage.getItem(PREFIX + tenant);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function setCached(tenant, data) {
  try {
    localStorage.setItem(PREFIX + tenant, JSON.stringify(data));
  } catch {}
}

export function invalidateCache(tenant) {
  try {
    localStorage.removeItem(PREFIX + tenant);
  } catch {}
}

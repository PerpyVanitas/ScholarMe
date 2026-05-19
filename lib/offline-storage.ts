/**
 * Utility for persisting data offline on the Web using the Cache API.
 * Specifically handles Quizzes and Study Sets.
 */

const CACHE_NAME = "scholarme-offline-v1";

export async function saveToOfflineCache(url: string, data: any) {
  if (!window.caches) return;
  
  const cache = await window.caches.open(CACHE_NAME);
  const response = new Response(JSON.stringify(data), {
    headers: { 'Content-Type': 'application/json' }
  });
  
  await cache.put(url, response);
}

export async function getFromOfflineCache(url: string) {
  if (!window.caches) return null;
  
  const cache = await window.caches.open(CACHE_NAME);
  const response = await cache.match(url);
  
  if (!response) return null;
  
  return await response.json();
}

export async function clearOfflineCache() {
  if (!window.caches) return;
  await window.caches.delete(CACHE_NAME);
}

/**
 * Hook-friendly wrapper for SWR or direct fetch
 */
export async function fetchWithOffline(url: string) {
  try {
    const res = await fetch(url);
    if (res.ok) {
      const data = await res.json();
      await saveToOfflineCache(url, data);
      return data;
    }
  } catch (err) {
    console.warn("Network failed, attempting offline load...", err);
    return await getFromOfflineCache(url);
  }
  return null;
}

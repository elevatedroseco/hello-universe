/**
 * IndexedDB-based cache for the Tiberian Sun base skeleton ZIP (~200MB).
 * Avoids re-downloading on subsequent exports.
 */

const DB_NAME = 'ts-mod-kit-cache';
const STORE_NAME = 'skeleton';
const DB_VERSION = 1;
const SKELETON_VERSION = 'v1.0'; // Increment to invalidate cache

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export async function getCachedSkeleton(): Promise<Blob | null> {
  try {
    const db = await openDB();
    return new Promise((resolve) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const req = store.get(SKELETON_VERSION);
      req.onsuccess = () => {
        const result = req.result;
        if (result?.data instanceof Blob) {
          console.log(`✅ Cache hit: skeleton ${(result.data.size / 1024 / 1024).toFixed(1)} MB`);
          resolve(result.data);
        } else {
          resolve(null);
        }
      };
      req.onerror = () => resolve(null);
    });
  } catch {
    return null;
  }
}

export async function cacheSkeleton(blob: Blob): Promise<void> {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      store.put({ data: blob, timestamp: Date.now(), version: SKELETON_VERSION }, SKELETON_VERSION);
      tx.oncomplete = () => {
        console.log(`✅ Cached skeleton: ${(blob.size / 1024 / 1024).toFixed(1)} MB`);
        resolve();
      };
      tx.onerror = () => reject(tx.error);
    });
  } catch (err) {
    console.warn('Failed to cache skeleton:', err);
  }
}

export async function clearSkeletonCache(): Promise<void> {
  try {
    const db = await openDB();
    return new Promise((resolve) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      tx.objectStore(STORE_NAME).clear();
      tx.oncomplete = () => resolve();
      tx.onerror = () => resolve();
    });
  } catch {
    // ignore
  }
}

export async function getCacheSize(): Promise<number | null> {
  try {
    const db = await openDB();
    return new Promise((resolve) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const req = tx.objectStore(STORE_NAME).get(SKELETON_VERSION);
      req.onsuccess = () => {
        const result = req.result;
        resolve(result?.data instanceof Blob ? result.data.size : null);
      };
      req.onerror = () => resolve(null);
    });
  } catch {
    return null;
  }
}

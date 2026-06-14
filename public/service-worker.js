// Service Worker for Kingdom Builder Web - Offline Support
// fix/sw-network-first - index.html 改 Network-First，移除 precache，升版至 v2 清舊快取
//
// BASE = SW 所在的路徑前綴（例：/kingdom/）。統一平台單一 origin 下，
// 所有路徑與 scope 都帶前綴，避免跨 app（如數獨）SW 快取互吃。
const BASE = new URL('./', self.location).pathname; // e.g. '/kingdom/'
const CACHE_NAME = `kingdom-builder${BASE.replace(/\//g, '-').replace(/-$/, '')}-v2`;
// v2：升版讓 activate 清掉殘留的 v1 快取（v1 鎖死舊 index.html 導致白屏）

// 只 precache 不帶 content-hash 的靜態入口（不含 index.html，避免被 cache-first 鎖死）
const PRECACHE_ASSETS = [
  `${BASE}`,
  `${BASE}manifest.json`,
  `${BASE}icons/icon-192.svg`,
  `${BASE}icons/icon-512.svg`,
];

// Install Event - 預快取靜態資源（不含 index.html）
// 用個別 put + allSettled：任一資源 404 不會整批 reject 卡死 install
// （cache.addAll 是全有全無，單一資源缺失會害 skipWaiting 不執行 → SW 卡 installing）
self.addEventListener('install', (event) => {
  console.log('[SW] Installing...');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('[SW] Caching static resources');
        return Promise.allSettled(
          PRECACHE_ASSETS.map((asset) =>
            cache.add(asset).catch((err) => {
              console.warn('[SW] Precache skip (non-fatal):', asset, err);
            })
          )
        );
      })
      .then(() => {
        console.log('[SW] Install complete');
        return self.skipWaiting(); // 立即啟用新的 Service Worker
      })
      .catch((error) => {
        console.error('[SW] Install failed:', error);
      })
  );
});

// Activate Event - 清理舊快取（v1 → v2 升版後會觸發刪除）
self.addEventListener('activate', (event) => {
  console.log('[SW] Activating...');
  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames
            .filter((key) => key !== CACHE_NAME)
            .map((key) => {
              console.log('[SW] Deleting old cache:', key);
              return caches.delete(key);
            })
        );
      })
      .then(() => {
        console.log('[SW] Activate complete');
        return self.clients.claim(); // 立即控制所有頁面
      })
      .catch((error) => {
        console.error('[SW] Activate failed:', error);
      })
  );
});

// Fetch Event - 差異化快取策略
// - navigation / index.html → Network-First（防止重部署後白屏）
// - 帶 content-hash 的靜態資源（assets/）→ Cache-First（immutable，省流量）
// - 非 GET 直接 pass through
self.addEventListener('fetch', (event) => {
  const { request } = event;

  // 只處理 GET 請求
  if (request.method !== 'GET') {
    return;
  }

  const url = new URL(request.url);

  // SW 本身不攔截
  if (url.pathname === `${BASE}service-worker.js`) {
    return;
  }

  // Navigation 請求 / index.html → Network-First
  // 確保每次訪問都拿到最新的 index.html（含最新 bundle hash），防白屏
  if (
    request.mode === 'navigate' ||
    url.pathname === BASE ||
    url.pathname === `${BASE}index.html`
  ) {
    event.respondWith(networkFirst(request));
    return;
  }

  // 其餘 GET（帶 hash 的 JS/CSS bundle、圖片等）→ Cache-First
  // content-hash 檔名 immutable，cache-first 正確省流量
  event.respondWith(cacheFirst(request));
});

// Cache-First 策略：優先使用快取，cache miss 時請求網路並更新快取
function cacheFirst(request) {
  return caches.match(request)
    .then((cachedResponse) => {
      if (cachedResponse) {
        console.log('[SW Cache-First] Cache hit:', request.url);
        return cachedResponse;
      }

      console.log('[SW Cache-First] Cache miss, fetching:', request.url);
      return fetch(request)
        .then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            const responseToCache = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(request, responseToCache);
              console.log('[SW Cache-First] Cached:', request.url);
            });
          }
          return networkResponse;
        })
        .catch((error) => {
          console.error('[SW Cache-First] Fetch failed:', error);
          throw error;
        });
    });
}

// Network-First 策略：優先請求網路（成功時更新快取），離線才 fallback 舊快取
function networkFirst(request) {
  return fetch(request)
    .then((networkResponse) => {
      if (networkResponse && networkResponse.status === 200) {
        console.log('[SW Network-First] Network success:', request.url);
        const responseToCache = networkResponse.clone();
        caches.open(CACHE_NAME).then((cache) => {
          cache.put(request, responseToCache);
          console.log('[SW Network-First] Updated cache:', request.url);
        });
        return networkResponse;
      }
      return networkResponse;
    })
    .catch((error) => {
      console.log('[SW Network-First] Network failed, trying cache:', request.url);
      return caches.match(request)
        .then((cachedResponse) => {
          if (cachedResponse) {
            console.log('[SW Network-First] Cache fallback hit:', request.url);
            return cachedResponse;
          }
          console.error('[SW Network-First] No cache available:', error);
          throw error;
        });
    });
}

// Message Event - 處理來自主頁面的訊息
self.addEventListener('message', (event) => {
  console.log('[SW] Message received:', event.data);

  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }

  if (event.data && event.data.type === 'CLEAR_CACHE') {
    caches.delete(CACHE_NAME).then(() => {
      console.log('[SW] Cache cleared');
      if (event.ports && event.ports[0]) {
        event.ports[0].postMessage({ success: true });
      }
    });
  }
});

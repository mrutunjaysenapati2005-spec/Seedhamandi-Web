// SeedhaMandi PWA Service Worker (v1.0.0)
// Designed for SIH Low-Bandwidth Resilience: Offline-First + Embedded Fallback DB

const CACHE_NAME = 'seedhamandi-pwa-cache-v1';

const APP_SHELL_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/icon.svg',
  '/pwa-192x192.png',
  '/pwa-512x512.png',
  '/apple-touch-icon.png',
  '/favicon.png'
];

// Fallback seed catalog for API responses when completely offline on first visit
const OFFLINE_SEED_PRODUCTS = {
  products: [
    {
      id: 'prod_1',
      name: 'Nashik Red Onions (Premium Export Quality)',
      category: 'VEGETABLES',
      price: 24,
      unit: 'kg',
      quantityAvailable: 4200,
      minOrderQty: 25,
      farmerId: 'usr_farmer_1',
      farmerName: 'Ramesh Patel',
      farmerVillage: 'Baramati',
      farmerDistrict: 'Pune',
      farmerState: 'Maharashtra',
      mandiAvgPrice: 28,
      harvestDate: '2026-09-18',
      shelfLifeDays: 45,
      perishabilityIndex: 4,
      coldChainRequired: false,
      grade: 'A',
      image: 'https://images.unsplash.com/photo-1618512496248-a07fe83aa8cb?auto=format&fit=crop&w=600&q=80',
      description: 'Sun-cured premium Nashik red onions with thick dry outer skin.',
      badges: ['Direct Harvest', 'Grade A Verified', 'Zero Middlemen']
    },
    {
      id: 'prod_2',
      name: 'Baramati Vine Ripe Tomatoes',
      category: 'VEGETABLES',
      price: 32,
      unit: 'kg',
      quantityAvailable: 1850,
      minOrderQty: 10,
      farmerId: 'usr_farmer_1',
      farmerName: 'Ramesh Patel',
      farmerVillage: 'Baramati',
      farmerDistrict: 'Pune',
      farmerState: 'Maharashtra',
      mandiAvgPrice: 38,
      harvestDate: '2026-09-20',
      shelfLifeDays: 8,
      perishabilityIndex: 8,
      coldChainRequired: true,
      grade: 'A',
      image: 'https://images.unsplash.com/photo-1592924357228-91a4daadcfea?auto=format&fit=crop&w=600&q=80',
      description: 'Firm, pesticide-safe vine tomatoes handpicked at optimal red-orange firmness.',
      badges: ['High Perishability', 'Cold-Chain Reefer', 'Fresh Harvest']
    },
    {
      id: 'prod_3',
      name: 'Mahabaleshwar Fresh Winter Strawberries',
      category: 'FRUITS',
      price: 210,
      unit: 'kg',
      quantityAvailable: 340,
      minOrderQty: 2,
      farmerId: 'usr_fpo_1',
      farmerName: 'Sahyadri Kisan Samriddhi FPO',
      farmerVillage: 'Mahabaleshwar',
      farmerDistrict: 'Satara',
      farmerState: 'Maharashtra',
      mandiAvgPrice: 260,
      harvestDate: '2026-09-21',
      shelfLifeDays: 3,
      perishabilityIndex: 10,
      coldChainRequired: true,
      grade: 'A',
      image: 'https://images.unsplash.com/photo-1464965911861-746a04b4bca6?auto=format&fit=crop&w=600&q=80',
      description: 'Pre-cooled Sweet Charlie variety strawberries. Reefer transit 4°C required.',
      badges: ['Tier 1 Perishability', 'Reefer Telemetry', 'Grade A Export']
    },
    {
      id: 'prod_4',
      name: 'Sehore Sharbati Golden Wheat Sacks',
      category: 'GRAINS',
      price: 44,
      unit: 'kg',
      quantityAvailable: 8500,
      minOrderQty: 50,
      farmerId: 'usr_fpo_1',
      farmerName: 'Sahyadri Kisan Samriddhi FPO',
      farmerVillage: 'Sehore Belt',
      farmerDistrict: 'Nashik Hub',
      farmerState: 'Madhya Pradesh / MH',
      mandiAvgPrice: 50,
      harvestDate: '2026-08-15',
      shelfLifeDays: 365,
      perishabilityIndex: 1,
      coldChainRequired: false,
      grade: 'A',
      image: 'https://images.unsplash.com/photo-1574323347407-f5e1ad6d020b?auto=format&fit=crop&w=600&q=80',
      description: 'Golden heavy rainfed Sharbati grains. Zero moisture, long grain.',
      badges: ['Bulk Grain', 'Ambient Dry Storage', 'FPO Certified']
    }
  ]
};

// 1. Install Event: Pre-cache App Shell & Core Assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(async (cache) => {
      try {
        await cache.addAll(APP_SHELL_ASSETS);
      } catch (err) {
        console.warn('PWA Pre-cache partial warning:', err);
      }
      return self.skipWaiting();
    })
  );
});

// 2. Activate Event: Evict Outdated Caches & Claim Clients
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name !== CACHE_NAME)
          .map((name) => caches.delete(name))
      );
    }).then(() => self.clients.claim())
  );
});

// 3. Fetch Event: Multi-Tiered Intelligent Caching Strategy
self.addEventListener('fetch', (event) => {
  const request = event.request;
  const url = new URL(request.url);

  // Ignore non-GET requests (e.g. POST orders are handled via client offline queue)
  if (request.method !== 'GET') {
    return;
  }

  // A. API Requests (/api/*): Network-first with 1500ms timeout & cached fallback
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(
      (async () => {
        const cache = await caches.open(CACHE_NAME);

        // Try network with timeout
        try {
          const timeoutPromise = new Promise((_, reject) =>
            setTimeout(() => reject(new Error('Network timeout (1500ms)')), 1500)
          );

          const networkResponse = await Promise.race([
            fetch(request.clone()),
            timeoutPromise
          ]);

          if (networkResponse && networkResponse.status === 200) {
            // Cache fresh copy for offline retrieval
            cache.put(request, networkResponse.clone());
            return networkResponse;
          }
        } catch (error) {
          // Network failed or timed out -> Fall back to cache
        }

        const cachedResponse = await cache.match(request);
        if (cachedResponse) {
          return cachedResponse;
        }

        // If specifically products API and nothing in cache, return pre-defined offline seed
        if (url.pathname.includes('/products')) {
          return new Response(JSON.stringify(OFFLINE_SEED_PRODUCTS), {
            headers: {
              'Content-Type': 'application/json',
              'X-PWA-Offline-Fallback': 'true'
            }
          });
        }

        return new Response(JSON.stringify({ offline: true, message: 'Offline cache active' }), {
          headers: { 'Content-Type': 'application/json' }
        });
      })()
    );
    return;
  }

  // B. HTML / Navigation Requests: Network-first with cache fallback to /index.html (SPA)
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request).catch(async () => {
        const cached = await caches.match(request);
        if (cached) return cached;
        const indexFallback = await caches.match('/index.html');
        if (indexFallback) return indexFallback;
        return caches.match('/');
      })
    );
    return;
  }

  // C. Static Assets (JS, CSS, Images, Fonts): Stale-While-Revalidate
  event.respondWith(
    caches.match(request).then((cachedResponse) => {
      const fetchPromise = fetch(request)
        .then(async (networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            const cache = await caches.open(CACHE_NAME);
            cache.put(request, networkResponse.clone());
          }
          return networkResponse;
        })
        .catch(() => {
          // Network fail is fine if cached
        });

      return cachedResponse || fetchPromise;
    })
  );
});

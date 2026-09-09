// Service Worker sederhana untuk Reuni Rubi 1987-2027
// Strategi: coba internet dulu (biar data selalu terbaru: RSVP, pembayaran, dll),
// kalau gagal (offline / sinyal jelek) baru pakai salinan tersimpan terakhir.
const CACHE_NAME = 'reuni-rubi-v1';
const APP_SHELL = ['./', './index.html'];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(APP_SHELL))
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((names) =>
      Promise.all(names.filter((n) => n !== CACHE_NAME).map((n) => caches.delete(n)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  // Cuma tangani request GET ke halaman sendiri (bukan API Google Sheets/CDN eksternal)
  if (event.request.method !== 'GET') return;

  event.respondWith(
    fetch(event.request)
      .then((response) => {
        // simpan salinan terbaru ke cache tiap kali berhasil dari internet
        const copy = response.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(event.request, copy));
        return response;
      })
      .catch(() => caches.match(event.request).then((cached) => cached || caches.match('./index.html')))
  );
});

/**
 * Web Push — Service Worker에 합칠 초안 스니펫
 * next-pwa가 생성하는 sw.js에 커스텀 importScripts 또는
 * 빌드 후 스크립트 병합 시 아래 로직을 참고.
 */

export const SERVICE_WORKER_PUSH_HANDLER_SNIPPET = `
// --- Web Push 초안 (클라이언트 등록은 별도 권한 플로우 필요) ---
self.addEventListener('push', (event) => {
  let data = { title: '인트라넷', body: '새 알림이 있습니다.' };
  try {
    if (event.data) data = { ...data, ...event.data.json() };
  } catch (_) {}
  event.waitUntil(
    self.registration.showNotification(data.title, {
      body: data.body,
      icon: '/icons/icon-192.png',
      badge: '/icons/icon-192.png',
      tag: 'intranet-notification',
    })
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil(clients.openWindow('/'));
});
`;

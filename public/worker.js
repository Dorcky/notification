// Service worker for handling push notifications

self.addEventListener('push', event => {
    const data = event.data.json();
    
    const options = {
        body: data.body || 'New notification',
        icon: data.icon || '/bed-icon.png',
        badge: data.badge || '/badge.png',
        data: {
            url: data.url || '/'
        }
    };

    event.waitUntil(
        self.registration.showNotification(data.title || 'Notification', options)
    );
});

// Handle notification click
self.addEventListener('notificationclick', event => {
    event.notification.close();
    
    // This looks to see if the current is already open and focuses if it is
    event.waitUntil(
        clients.matchAll({ type: 'window' }).then(clientList => {
            const url = event.notification.data.url;
            
            for (let i = 0; i < clientList.length; i++) {
                const client = clientList[i];
                if (client.url === url && 'focus' in client) {
                    return client.focus();
                }
            }
            
            if (clients.openWindow) {
                return clients.openWindow(url);
            }
        })
    );
});
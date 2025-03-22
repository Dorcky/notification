// Service Worker pour les notifications push
self.addEventListener('push', function(event) {
    const data = event.data.json();
    
    const options = {
        body: data.body,
        icon: 'https://via.placeholder.com/128',
        badge: 'https://via.placeholder.com/32',
        vibrate: [100, 50, 100],
        data: {
            dateOfArrival: Date.now(),
            primaryKey: 1
        },
        actions: [
            {
                action: 'close',
                title: 'Fermer',
                icon: 'https://via.placeholder.com/128'
            }
        ]
    };
    
    event.waitUntil(
        self.registration.showNotification(data.title, options)
    );
});

// Gérer les clics sur les notifications
self.addEventListener('notificationclick', function(event) {
    event.notification.close();
    
    if (event.action === 'close') {
        return;
    }
    
    // Vous pouvez ajouter ici du code pour ouvrir une page spécifique
    event.waitUntil(
        clients.openWindow('/')
    );
});
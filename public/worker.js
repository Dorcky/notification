// Installation du service worker
self.addEventListener('install', event => {
    self.skipWaiting();
    console.log('Service Worker installé.');
});

// Activation du service worker
self.addEventListener('activate', event => {
    console.log('Service Worker activé.');
});

// Écouter les notifications push
self.addEventListener('push', event => {
    const data = event.data.json();
    
    // Options de notification, incluant le son
    const options = {
        body: data.body,
        icon: '/bed-icon.png', // Ajoutez une icône à votre projet
        badge: '/badge-icon.png', // Ajoutez un badge à votre projet
        vibrate: [100, 50, 100],
        sound: '/notification.mp3', // Chemin vers votre fichier son
        data: {
            dateOfArrival: Date.now(),
            primaryKey: 1
        },
        actions: [
            {
                action: 'close',
                title: 'Fermer',
                icon: '/close.png'
            }
        ]
    };
    
    event.waitUntil(
        self.registration.showNotification(data.title, options)
    );
});

// Gestion des clics sur les notifications
self.addEventListener('notificationclick', event => {
    event.notification.close();
    
    // Vous pouvez ajouter une action spécifique quand l'utilisateur clique sur la notification
    if (event.action === 'close') {
        console.log('Notification fermée');
    } else {
        clients.openWindow('/');
    }
});
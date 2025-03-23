const publicVapidKey = "BDudcZhaSbUBeCKloBMWxpqN9bcPyIoI72AgdslkIPkBr0Dyj855g1f3RjZONUyfhB5uHYsIZ31zqyCx4EeThvM"; // Remplacez par la clé publique générée dans server.js
let subscriptionId = null;

// Fonction pour activer les notifications
async function activateNotifications() {
    if ('serviceWorker' in navigator && 'PushManager' in window) {
        try {
            // Enregistrer le Service Worker
            const registration = await navigator.serviceWorker.register('/worker.js');
            console.log('Service Worker enregistré.');

            // Demander la permission pour les notifications
            const permission = await Notification.requestPermission();
            if (permission !== 'granted') {
                alert("Permission refusée !");
                return;
            }
            // S'abonner aux notifications push
            const subscription = await registration.pushManager.subscribe({
                userVisibleOnly: true,
                applicationServerKey: urlBase64ToUint8Array(publicVapidKey)
            });

            // Envoyer l'abonnement au serveur
            const response = await fetch('https://notification-0dn4.onrender.com/subscribe', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(subscription)
            });

            const data = await response.json();
            subscriptionId = data.id; // Sauvegarder l'ID pour pouvoir se désabonner plus tard
            
            console.log('Abonnement aux notifications enregistré avec ID:', subscriptionId);
        } catch (error) {
            console.error('Erreur lors de l\'activation des notifications :', error);
        }
    } else {
        alert("Votre navigateur ne supporte pas les notifications push.");
    }
}

// Fonction pour désactiver les notifications
async function deactivateNotifications() {
    if (subscriptionId) {
        try {
            await fetch('https://notification-0dn4.onrender.com/unsubscribe', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id: subscriptionId })
            });

            // Désinscrire le service worker
            const registration = await navigator.serviceWorker.getRegistration();
            if (registration) {
                await registration.unregister();
            }
            
            subscriptionId = null;
            console.log('Notifications désactivées.');
        } catch (error) {
            console.error('Erreur lors de la désactivation:', error);
        }
    } else {
        console.log('Aucun abonnement actif à désactiver.');
    }
}

// Convertir la clé VAPID en Uint8Array
function urlBase64ToUint8Array(base64String) {
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
    const rawData = window.atob(base64);
    return new Uint8Array([...rawData].map(char => char.charCodeAt(0)));
}

// Ajouter des écouteurs aux boutons
document.getElementById("turnOn").addEventListener("click", activateNotifications);
document.getElementById("turnOff").addEventListener("click", deactivateNotifications);

function playNotificationSound() {
    const audio = new Audio('/notification-sound.mp3');
    audio.play().catch(error => {
        console.error('Impossible de jouer le son:', error);
        // La plupart des navigateurs exigent une interaction utilisateur avant de jouer des sons
    });
}

// Afficher les boutons en fonction de l'état des notifications
// Dans script.js
document.getElementById("testNotification").addEventListener("click", async () => {
    if (subscriptionId) {
        try {
            playNotificationSound(); // Jouer le son manuellement
            const response = await fetch('https://notification-0dn4.onrender.com/send-notification', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id: subscriptionId })
            });
            const data = await response.json();
            console.log('Résultat du test:', data);
        } catch (error) {
            console.error('Erreur lors du test:', error);
        }
    } else {
        alert("Activez d'abord les notifications!");
    }
});

// Vous pourriez aussi l'appeler lors de la réception d'une notification quand la page est visible
navigator.serviceWorker.addEventListener('message', event => {
    if (event.data && event.data.type === 'NOTIFICATION_RECEIVED') {
        playNotificationSound();
    }
});
// Variables pour stocker l'état de l'abonnement
let subscriptionId = null;
const statusElement = document.getElementById('status');
const subscribeButton = document.getElementById('subscribe');
const unsubscribeButton = document.getElementById('unsubscribe');
const sendTestButton = document.getElementById('send-test');

// Convertir une clé d'API en format Uint8Array
function urlBase64ToUint8Array(base64String) {
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding)
        .replace(/\-/g, '+')
        .replace(/_/g, '/');

    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);

    for (let i = 0; i < rawData.length; ++i) {
        outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
}

// Clé publique VAPID (doit correspondre à celle du serveur)
const vapidPublicKey = 'BDudcZhaSbUBeCKloBMWxpqN9bcPyIoI72AgdslkIPkBr0Dyj855g1f3RjZONUyfhB5uHYsIZ31zqyCx4EeThvM';
const convertedVapidKey = urlBase64ToUint8Array(vapidPublicKey);

// Enregistrer le service worker
if ('serviceWorker' in navigator && 'PushManager' in window) {
    window.addEventListener('load', function() {
        navigator.serviceWorker.register('/sw.js')
            .then(function(registration) {
                console.log('ServiceWorker enregistré avec succès:', registration);
                initPushNotifications(registration);
            })
            .catch(function(error) {
                console.error('Erreur lors de l\'enregistrement du ServiceWorker:', error);
                updateStatus('Erreur: ServiceWorker non supporté');
            });
    });
} else {
    console.error('Les notifications push ne sont pas supportées');
    updateStatus('Erreur: Notifications push non supportées sur cet appareil');
    subscribeButton.disabled = true;
}

// Initialiser les notifications push
function initPushNotifications(registration) {
    // Vérifier si déjà abonné
    registration.pushManager.getSubscription()
        .then(function(subscription) {
            if (subscription) {
                console.log('Déjà abonné aux notifications');
                // Récupérer l'ID d'abonnement depuis localStorage
                subscriptionId = localStorage.getItem('notificationSubscriptionId');
                if (subscriptionId) {
                    updateUIForSubscription();
                } else {
                    // Si l'ID n'est pas trouvé, désabonner et recommencer
                    subscription.unsubscribe().then(() => {
                        console.log('Abonnement annulé car ID non trouvé');
                    });
                }
            } else {
                console.log('Non abonné aux notifications');
            }
        });
}

// Mettre à jour l'interface selon l'état d'abonnement
function updateUIForSubscription() {
    subscribeButton.disabled = true;
    unsubscribeButton.disabled = false;
    sendTestButton.disabled = false;
    updateStatus('État: Abonné aux notifications');
}

// Mettre à jour l'interface pour l'état non abonné
function updateUIForUnsubscription() {
    subscribeButton.disabled = false;
    unsubscribeButton.disabled = true;
    sendTestButton.disabled = true;
    updateStatus('État: Non abonné aux notifications');
}

// Mettre à jour le statut affiché
function updateStatus(message) {
    statusElement.textContent = message;
}

// S'abonner aux notifications
subscribeButton.addEventListener('click', function() {
    if (!('serviceWorker' in navigator)) return;

    navigator.serviceWorker.ready
        .then(function(registration) {
            return registration.pushManager.subscribe({
                userVisibleOnly: true,
                applicationServerKey: convertedVapidKey
            });
        })
        .then(function(subscription) {
            console.log('Abonné aux notifications:', subscription);
            
            // Envoyer l'abonnement au serveur
            return fetch('/subscribe', {
                method: 'POST',
                body: JSON.stringify(subscription),
                headers: {
                    'Content-Type': 'application/json'
                }
            });
        })
        .then(function(response) {
            return response.json();
        })
        .then(function(data) {
            console.log('Réponse du serveur:', data);
            subscriptionId = data.id;
            
            // Stocker l'ID dans localStorage
            localStorage.setItem('notificationSubscriptionId', subscriptionId);
            
            updateUIForSubscription();
        })
        .catch(function(error) {
            console.error('Erreur lors de l\'abonnement:', error);
            updateStatus('Erreur lors de l\'abonnement: ' + error.message);
        });
});

// Se désabonner des notifications
unsubscribeButton.addEventListener('click', function() {
    if (!subscriptionId) return;
    
    // Appeler le serveur pour désactiver les notifications
    fetch('/unsubscribe', {
        method: 'POST',
        body: JSON.stringify({ id: subscriptionId }),
        headers: {
            'Content-Type': 'application/json'
        }
    })
    .then(function(response) {
        return response.json();
    })
    .then(function(data) {
        console.log('Désabonnement réussi:', data);
        
        // Supprimer l'ID du localStorage
        localStorage.removeItem('notificationSubscriptionId');
        subscriptionId = null;
        
        // Désabonner côté navigateur
        return navigator.serviceWorker.ready
            .then(function(registration) {
                return registration.pushManager.getSubscription();
            })
            .then(function(subscription) {
                if (subscription) {
                    return subscription.unsubscribe();
                }
            });
    })
    .then(function() {
        console.log('Désabonnement complet');
        updateUIForUnsubscription();
    })
    .catch(function(error) {
        console.error('Erreur lors du désabonnement:', error);
        updateStatus('Erreur lors du désabonnement: ' + error.message);
    });
});

// Envoyer une notification de test
sendTestButton.addEventListener('click', function() {
    if (!subscriptionId) return;
    
    fetch('/send-notification', {
        method: 'POST',
        body: JSON.stringify({ id: subscriptionId }),
        headers: {
            'Content-Type': 'application/json'
        }
    })
    .then(function(response) {
        return response.json();
    })
    .then(function(data) {
        console.log('Notification envoyée:', data);
        updateStatus('Notification de test envoyée');
    })
    .catch(function(error) {
        console.error('Erreur lors de l\'envoi de la notification:', error);
        updateStatus('Erreur lors de l\'envoi de la notification: ' + error.message);
    });
});
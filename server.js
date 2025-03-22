const express = require('express');
const bodyParser = require('body-parser');
const webPush = require('web-push');
const path = require('path');

const app = express();
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, 'public'))); // Serve static files from the "public" directory

const vapidKeys = {
    publicKey: 'BDudcZhaSbUBeCKloBMWxpqN9bcPyIoI72AgdslkIPkBr0Dyj855g1f3RjZONUyfhB5uHYsIZ31zqyCx4EeThvM',
    privateKey: 'EAqDD_E69qctgcxbrMGZ1V65p9x-bXGUhKTDHhYS0HE'
};

webPush.setVapidDetails(
    'mailto:example@yourdomain.com',
    vapidKeys.publicKey,
    vapidKeys.privateKey
);

let subscriptions = new Map();
app.post('/subscribe', (req, res) => {
    const id = Date.now().toString(); // ID unique pour cet abonnement
    const newSubscription = {
        id: id,
        subscription: req.body,
        interval: null
    };

    subscriptions.set(id, newSubscription);

    // Démarrer l'intervalle pour cet abonnement
    startNotificationInterval(id);

    res.status(201).json({ 
        message: 'Abonnement enregistré avec succès !',
        id: id
    });
});

app.post('/send-notification', (req, res) => {
    const payload = JSON.stringify({
        title: "Rappel de sommeil",
        body: "Il est temps d'aller se coucher !"
    });

    subscriptions.set(id, newSubscription);

    // Démarrer l'intervalle pour cet abonnement
    startNotificationInterval(id);

    res.status(201).json({ 
        message: 'Abonnement enregistré avec succès !',
        id: id
    });
});

// Fonction pour démarrer l'envoi de notifications à intervalle régulier
function startNotificationInterval(id) {
    const sub = subscriptions.get(id);
    if (!sub) return;
    
    // Créer un intervalle qui s'exécute toutes les minutes (60000 ms)
    sub.interval = setInterval(() => {
        const payload = JSON.stringify({
            title: "Rappel périodique",
            body: `Rappel automatique - ${new Date().toLocaleTimeString()}`
        });

        webPush.sendNotification(sub.subscription, payload)
        .then(() => console.log(`Notification envoyée à ${id}`))
        .catch(err => {
            console.error(`Erreur d'envoi à ${id}:`, err);
            // Si l'abonnement n'est plus valide, on le supprime
            if (err.statusCode === 410) {
                console.log(`Abonnement ${id} n'est plus valide, suppression...`);
                clearInterval(sub.interval);
                subscriptions.delete(id);
            }
        });
}, 60000); // 60000 ms = 1 minute
}

// Ajouter une route pour désactiver les notifications
app.post('/unsubscribe', (req, res) => {
    const { id } = req.body;
    
    if (subscriptions.has(id)) {
        const sub = subscriptions.get(id);
        clearInterval(sub.interval);
        subscriptions.delete(id);
        res.status(200).json({ message: 'Notifications désactivées' });
    } else {
        res.status(404).json({ message: 'Abonnement non trouvé' });
    }
});

// Serve the root route
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Start the server
app.listen(3008, () => console.log('Serveur démarré sur http://localhost:3008'));
const express = require('express');
const bodyParser = require('body-parser');
const webPush = require('web-push');
const cors = require('cors');

const app = express();
app.use(cors()); // Autoriser les requêtes cross-origin
app.use(bodyParser.json());

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

// Route pour s'abonner
app.post('/api/subscribe', (req, res) => {
    const id = Date.now().toString();
    subscriptions.set(id, { id, subscription: req.body });

    res.status(201).json({ 
        message: 'Abonnement enregistré avec succès !',
        id: id
    });
});

// Route pour envoyer une notification
app.post('/api/send-notification', (req, res) => {
    const { id } = req.body;
    const sub = subscriptions.get(id);

    if (!sub) {
        return res.status(404).json({ message: 'Abonnement introuvable' });
    }

    const payload = JSON.stringify({
        title: "Rappel de sommeil",
        body: "Il est temps d'aller se coucher !"
    });

    webPush.sendNotification(sub.subscription, payload)
        .then(() => res.status(200).json({ message: 'Notification envoyée' }))
        .catch(err => res.status(500).json({ error: err.message }));
});

// Route pour se désabonner
app.post('/api/unsubscribe', (req, res) => {
    const { id } = req.body;
    if (subscriptions.has(id)) {
        subscriptions.delete(id);
        res.status(200).json({ message: 'Notifications désactivées' });
    } else {
        res.status(404).json({ message: 'Abonnement non trouvé' });
    }
});

module.exports = app;

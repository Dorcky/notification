const express = require('express');
const bodyParser = require('body-parser');
const webPush = require('web-push');
const cors = require('cors');

const app = express();
app.use(cors()); // Allow cross-origin requests
app.use(bodyParser.json());

// VAPID keys should ideally be in environment variables for production
const vapidKeys = {
    publicKey: 'BDudcZhaSbUBeCKloBMWxpqN9bcPyIoI72AgdslkIPkBr0Dyj855g1f3RjZONUyfhB5uHYsIZ31zqyCx4EeThvM',
    privateKey: 'EAqDD_E69qctgcxbrMGZ1V65p9x-bXGUhKTDHhYS0HE'
};

webPush.setVapidDetails(
    'mailto:example@yourdomain.com',
    vapidKeys.publicKey,
    vapidKeys.privateKey
);

// In-memory storage - would use a database in production
let subscriptions = new Map();

// Subscribe route
app.post('/api/subscribe', (req, res) => {
    const id = Date.now().toString();
    subscriptions.set(id, { id, subscription: req.body });

    console.log(`New subscription registered with ID: ${id}`);
    
    res.status(201).json({ 
        message: 'Subscription successfully registered!',
        id: id
    });
});

// Send notification route
app.post('/api/send-notification', (req, res) => {
    const { id, title, body } = req.body;
    const sub = subscriptions.get(id);

    if (!sub) {
        return res.status(404).json({ message: 'Subscription not found' });
    }

    const payload = JSON.stringify({
        title: title || "Sleep Reminder",
        body: body || "It's time to go to bed!"
    });

    webPush.sendNotification(sub.subscription, payload)
        .then(() => {
            console.log(`Notification sent to subscription ID: ${id}`);
            res.status(200).json({ message: 'Notification sent' });
        })
        .catch(err => {
            console.error(`Error sending notification: ${err.message}`);
            res.status(500).json({ error: err.message });
        });
});

// Unsubscribe route
app.post('/api/unsubscribe', (req, res) => {
    const { id } = req.body;
    if (subscriptions.has(id)) {
        subscriptions.delete(id);
        console.log(`Unsubscribed ID: ${id}`);
        res.status(200).json({ message: 'Notifications disabled' });
    } else {
        res.status(404).json({ message: 'Subscription not found' });
    }
});

// Simple health check route
app.get('/api/health', (req, res) => {
    res.status(200).json({ status: 'API is running' });
});

// Handle default route to test if API is working
app.get('/api', (req, res) => {
    res.status(200).json({ 
        message: 'Push notification API is running',
        endpoints: [
            { method: 'POST', path: '/api/subscribe', description: 'Register for notifications' },
            { method: 'POST', path: '/api/send-notification', description: 'Send a notification' },
            { method: 'POST', path: '/api/unsubscribe', description: 'Unsubscribe from notifications' }
        ]
    });
});

// For local development
if (process.env.NODE_ENV !== 'production') {
    const PORT = process.env.PORT || 3000;
    app.listen(PORT, () => {
        console.log(`Server running on port ${PORT}`);
    });
}

module.exports = app;
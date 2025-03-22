const API_URL = 'https://notification-9a64p4lk1-dorckys-projects.vercel.app';
const publicVapidKey = "BDudcZhaSbUBeCKloBMWxpqN9bcPyIoI72AgdslkIPkBr0Dyj855g1f3RjZONUyfhB5uHYsIZ31zqyCx4EeThvM";

// Store subscription ID in localStorage for persistence
let subscriptionId = localStorage.getItem('notificationSubscriptionId');
let notificationStatus = document.getElementById('notificationStatus');

// Update UI based on subscription status
function updateUI() {
    if (subscriptionId) {
        notificationStatus.textContent = "Notifications are enabled";
        notificationStatus.className = "status-enabled";
        document.getElementById("turnOn").disabled = true;
        document.getElementById("turnOff").disabled = false;
        document.getElementById("testNotification").disabled = false;
    } else {
        notificationStatus.textContent = "Notifications are disabled";
        notificationStatus.className = "status-disabled";
        document.getElementById("turnOn").disabled = false;
        document.getElementById("turnOff").disabled = true;
        document.getElementById("testNotification").disabled = true;
    }
}

// Function to activate notifications
async function activateNotifications() {
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
        showMessage("Your browser doesn't support push notifications", "error");
        return;
    }

    try {
        // Request permission
        const permission = await Notification.requestPermission();
        if (permission !== 'granted') {
            showMessage("Notification permission denied", "error");
            return;
        }

        // Register service worker
        const registration = await navigator.serviceWorker.register('/worker.js');
        console.log('Service Worker registered');

        // Subscribe to push notifications
        const subscription = await registration.pushManager.subscribe({
            userVisibleOnly: true,
            applicationServerKey: urlBase64ToUint8Array(publicVapidKey)
        });

        // Send subscription to server
        const response = await fetch(`${API_URL}/api/subscribe`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(subscription)
        });

        if (!response.ok) {
            throw new Error(`Server responded with ${response.status}`);
        }

        const data = await response.json();
        subscriptionId = data.id;
        
        // Save subscription ID
        localStorage.setItem('notificationSubscriptionId', subscriptionId);
        
        showMessage("Notifications enabled successfully", "success");
        updateUI();
    } catch (error) {
        console.error('Error activating notifications:', error);
        showMessage(`Error: ${error.message}`, "error");
    }
}

// Function to deactivate notifications
async function deactivateNotifications() {
    if (!subscriptionId) {
        showMessage("No active subscription", "warning");
        return;
    }

    try {
        // Unsubscribe from server
        const response = await fetch(`${API_URL}/api/unsubscribe`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id: subscriptionId })
        });

        if (!response.ok) {
            throw new Error(`Server responded with ${response.status}`);
        }

        // Unregister service worker
        const registration = await navigator.serviceWorker.getRegistration();
        if (registration) {
            const subscription = await registration.pushManager.getSubscription();
            if (subscription) {
                await subscription.unsubscribe();
            }
            await registration.unregister();
        }
        
        // Clear subscription ID
        localStorage.removeItem('notificationSubscriptionId');
        subscriptionId = null;
        
        showMessage("Notifications disabled successfully", "success");
        updateUI();
    } catch (error) {
        console.error('Error deactivating notifications:', error);
        showMessage(`Error: ${error.message}`, "error");
    }
}

// Function to test notifications
async function testNotification() {
    if (!subscriptionId) {
        showMessage("Enable notifications first", "warning");
        return;
    }

    try {
        const response = await fetch(`${API_URL}/api/send-notification`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
                id: subscriptionId,
                title: "Test Notification",
                body: "This is a test notification!"
            })
        });

        if (!response.ok) {
            throw new Error(`Server responded with ${response.status}`);
        }

        showMessage("Test notification sent", "success");
    } catch (error) {
        console.error('Error sending test notification:', error);
        showMessage(`Error: ${error.message}`, "error");
    }
}

// Helper function to convert base64 to Uint8Array (for the VAPID key)
function urlBase64ToUint8Array(base64String) {
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
    const rawData = window.atob(base64);
    return new Uint8Array([...rawData].map(char => char.charCodeAt(0)));
}

// Helper function to show status messages
function showMessage(message, type = "info") {
    const messageElement = document.getElementById("message");
    messageElement.textContent = message;
    messageElement.className = `message ${type}`;
    messageElement.style.display = "block";
    
    setTimeout(() => {
        messageElement.style.display = "none";
    }, 3000);
}

// Add event listeners when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    document.getElementById("turnOn").addEventListener("click", activateNotifications);
    document.getElementById("turnOff").addEventListener("click", deactivateNotifications);
    document.getElementById("testNotification").addEventListener("click", testNotification);
    
    // Check service worker support
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
        document.getElementById("browserSupport").textContent = 
            "Your browser doesn't support push notifications";
        document.getElementById("browserSupport").className = "error";
        document.getElementById("turnOn").disabled = true;
    }
    
    // Initialize UI
    updateUI();
});
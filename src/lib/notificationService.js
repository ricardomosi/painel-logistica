/**
 * Utility service for Mobile Web Notifications & Device Alerts
 */

export const notificationService = {
  isSupported() {
    return typeof window !== 'undefined' && 'Notification' in window;
  },

  getPermission() {
    if (!this.isSupported()) return 'unsupported';
    return Notification.permission;
  },

  async requestPermission() {
    if (!this.isSupported()) return 'unsupported';
    try {
      const permission = await Notification.requestPermission();
      return permission;
    } catch (err) {
      console.warn('Error requesting notification permission:', err);
      return 'denied';
    }
  },

  async triggerNotification({ title, body, tag, data, icon }) {
    const iconUrl = icon || 'https://res.cloudinary.com/dyw2bm0p4/image/upload/v1773232316/favicon-photoaidcom-cropped_hgixpq.png';

    // 1. Device vibration for mobile feedback
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      try {
        navigator.vibrate([200, 100, 250, 100, 300]);
      } catch (e) {}
    }

    // 2. Try Service Worker showNotification (Best on Android / Mobile Chrome)
    if (typeof navigator !== 'undefined' && 'serviceWorker' in navigator) {
      try {
        const registration = await navigator.serviceWorker.ready;
        if (registration && registration.showNotification) {
          await registration.showNotification(title, {
            body,
            icon: iconUrl,
            badge: iconUrl,
            tag: tag || 'logistica-msg-' + Date.now(),
            renotify: true,
            vibrate: [200, 100, 250, 100, 300],
            data: data || {},
          });
          return true;
        }
      } catch (swErr) {
        console.debug('SW notification attempt fallback:', swErr);
      }
    }

    // 3. Fallback to standard Window Notification API if permission granted
    if (this.isSupported() && Notification.permission === 'granted') {
      try {
        const n = new Notification(title, {
          body,
          icon: iconUrl,
          tag: tag || 'logistica-msg',
        });
        n.onclick = () => {
          window.focus();
          n.close();
        };
        return true;
      } catch (err) {
        console.debug('Standard Notification error:', err);
      }
    }

    return false;
  }
};

export default notificationService;

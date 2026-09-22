// Web Notification API with Actionable Buttons for Android & Wear OS
class NotificationService {
  public async requestPermission(): Promise<boolean> {
    if (!('Notification' in window)) return false;
    if (Notification.permission === 'granted') return true;

    const perm = await Notification.requestPermission();
    return perm === 'granted';
  }

  // Show actionable notification via Service Worker registration
  public async showStationAlert(
    title: string,
    body: string,
    type: 'WORK_START' | 'GYM_ALERT' | 'EVENING_START'
  ) {
    if (!('serviceWorker' in navigator)) return;
    const reg = await navigator.serviceWorker.ready;

    let actions: any[] = [];
    if (type === 'WORK_START') {
      actions = [
        { action: 'start_timer', title: 'بدء الآن ▶' },
        { action: 'defer_to_buffer', title: 'تأجيل للبافر ⏱' },
      ];
    } else if (type === 'GYM_ALERT') {
      actions = [
        { action: 'mark_done', title: 'تم بالإنجاز ✔' },
        { action: 'start_timer', title: 'بدء 10 ضغطات ▶' },
      ];
    } else {
      actions = [
        { action: 'start_timer', title: 'بدء الجلسة ▶' },
      ];
    }

    try {
      await reg.showNotification(title, {
        body,
        icon: '/favicon.svg',
        badge: '/favicon.svg',
        tag: 'station-alert',
        renotify: true,
        data: { type },
        actions,
      } as any);
    } catch (err) {
      console.warn('Could not show actionable notification:', err);
    }
  }
}

export const notificationService = new NotificationService();

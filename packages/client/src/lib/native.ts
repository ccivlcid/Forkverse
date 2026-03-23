/**
 * Native platform integration via Capacitor.
 * All calls are safe no-ops on web — only activate on iOS/Android.
 */
import { Capacitor } from '@capacitor/core';

export const isNative = Capacitor.isNativePlatform();

/** StatusBar: dark style with app background */
export async function initStatusBar() {
  if (!isNative) return;
  const { StatusBar, Style } = await import('@capacitor/status-bar');
  await StatusBar.setStyle({ style: Style.Dark });
  await StatusBar.setBackgroundColor({ color: '#0d1117' });
}

/** SplashScreen: hide after app is ready */
export async function hideSplash() {
  if (!isNative) return;
  const { SplashScreen } = await import('@capacitor/splash-screen');
  await SplashScreen.hide();
}

/** Haptics: light impact feedback for button taps */
export async function hapticTap() {
  if (!isNative) return;
  const { Haptics, ImpactStyle } = await import('@capacitor/haptics');
  await Haptics.impact({ style: ImpactStyle.Light });
}

/** Haptics: medium impact for significant actions (star, share) */
export async function hapticAction() {
  if (!isNative) return;
  const { Haptics, ImpactStyle } = await import('@capacitor/haptics');
  await Haptics.impact({ style: ImpactStyle.Medium });
}

/** Keyboard: listen for show/hide to adjust layout */
export async function initKeyboard() {
  if (!isNative) return;
  const { Keyboard } = await import('@capacitor/keyboard');
  Keyboard.addListener('keyboardWillShow', (info) => {
    document.documentElement.style.setProperty('--keyboard-height', `${info.keyboardHeight}px`);
  });
  Keyboard.addListener('keyboardWillHide', () => {
    document.documentElement.style.setProperty('--keyboard-height', '0px');
  });
}

/** Share: native share sheet */
export async function nativeShare(opts: { title: string; text?: string; url?: string }) {
  if (!isNative) {
    // Fallback to Web Share API
    if (navigator.share) {
      await navigator.share(opts);
    }
    return;
  }
  const { Share } = await import('@capacitor/share');
  await Share.share(opts);
}

/** Clipboard: copy text */
export async function nativeCopy(text: string) {
  if (!isNative) {
    await navigator.clipboard.writeText(text);
    return;
  }
  const { Clipboard } = await import('@capacitor/clipboard');
  await Clipboard.write({ string: text });
}

/** Push notifications: request permission and get token */
export async function initPushNotifications(onToken: (token: string) => void) {
  if (!isNative) return;
  const { PushNotifications } = await import('@capacitor/push-notifications');

  const permission = await PushNotifications.requestPermissions();
  if (permission.receive !== 'granted') return;

  await PushNotifications.register();

  PushNotifications.addListener('registration', (token) => {
    onToken(token.value);
  });

  PushNotifications.addListener('pushNotificationReceived', (notification) => {
    // Could dispatch to notification store
    console.log('[Push] received:', notification.title);
  });

  PushNotifications.addListener('pushNotificationActionPerformed', (action) => {
    // Navigate based on notification data
    const url = action.notification.data?.url as string | undefined;
    if (url) {
      window.location.href = url;
    }
  });
}

/** App: handle back button + deep links */
export async function initAppListeners() {
  if (!isNative) return;
  const { App } = await import('@capacitor/app');

  // Handle hardware back button (Android)
  App.addListener('backButton', ({ canGoBack }) => {
    if (canGoBack) {
      window.history.back();
    } else {
      App.exitApp();
    }
  });

  // Handle deep links
  App.addListener('appUrlOpen', (event) => {
    const url = new URL(event.url);
    const path = url.pathname;
    if (path) {
      window.location.href = path;
    }
  });
}

/** Initialize all native features — call once on app start */
export async function initNative(onPushToken?: (token: string) => void) {
  if (!isNative) return;
  await Promise.all([
    initStatusBar(),
    initKeyboard(),
    initAppListeners(),
    hideSplash(),
  ]);
  if (onPushToken) {
    await initPushNotifications(onPushToken);
  }
}

declare global {
  interface Window {
    Telegram?: {
      WebApp?: {
        ready: () => void;
        expand: () => void;
        close: () => void;
        initData: string;
        initDataUnsafe?: {
          query_id?: string;
          user?: {
            id: number;
            first_name: string;
            last_name?: string;
            username?: string;
            language_code?: string;
          };
          start_param?: string;
        };
        themeParams?: Record<string, string>;
        isExpanded?: boolean;
        viewportHeight?: number;
      };
    };
  }
}

/** Initialize Telegram WebApp SDK when running inside Telegram */
export function initTelegramWebApp() {
  if (typeof window !== "undefined" && window.Telegram?.WebApp) {
    const tg = window.Telegram.WebApp;
    try {
      tg.ready();
      tg.expand();
    } catch {
      /* ignore if not in Telegram */
    }
  }
}

/** Check if current runtime is inside Telegram WebApp */
export function isTelegramWebApp(): boolean {
  return typeof window !== "undefined" && Boolean(window.Telegram?.WebApp?.initData);
}

/** Get Telegram User info if running inside Telegram Mini App */
export function getTelegramUser() {
  if (typeof window !== "undefined" && window.Telegram?.WebApp) {
    return window.Telegram.WebApp.initDataUnsafe?.user ?? null;
  }
  return null;
}

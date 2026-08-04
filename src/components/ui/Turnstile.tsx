import * as React from "react";

interface TurnstileOptions {
  sitekey: string;
  theme?: "light" | "dark" | "auto";
  callback?: (token: string) => void;
  "expired-callback"?: () => void;
  "error-callback"?: () => void;
}

declare global {
  interface Window {
    turnstile?: {
      render: (container: string | HTMLElement, options: TurnstileOptions) => string;
      reset: (widgetId?: string) => void;
      remove: (widgetId?: string) => void;
    };
  }
}

const REAL_SITE_KEY = process.env.REACT_APP_TURNSTILE_SITE_KEY || "0x4AAAAAAEF5JN2xQc8ojFGz";
const TEST_SITE_KEY = "1x00000000000000000000AA"; // Cloudflare test key for localhost

const isLocalhost = window.location.hostname === "localhost" || window.location.hostname.endsWith(".localhost");
const SITE_KEY = isLocalhost ? TEST_SITE_KEY : REAL_SITE_KEY;

interface TurnstileProps {
  onVerify: (token: string | null) => void;
  /** Called when the widget cannot load or render at all, so the page can stop blocking submit. */
  onError?: () => void;
  theme?: "light" | "dark" | "auto";
}

export function Turnstile({ onVerify, onError, theme = "dark" }: TurnstileProps) {
  const containerRef = React.useRef<HTMLDivElement>(null);
  const widgetIdRef = React.useRef<string | null>(null);

  React.useEffect(() => {
    let active = true;
    let checkInterval: NodeJS.Timeout;

    const removeWidget = () => {
      if (!widgetIdRef.current || !window.turnstile) return;
      const id = widgetIdRef.current;
      // Null the ref before remove() so a throw here can never make the next
      // render() call bail out on a stale id.
      widgetIdRef.current = null;
      try {
        window.turnstile.remove(id);
      } catch {
        // widget already gone
      }
    };

    const renderWidget = () => {
      if (!containerRef.current || !window.turnstile) return;

      removeWidget();

      try {
        const id = window.turnstile.render(containerRef.current, {
          sitekey: SITE_KEY,
          theme: theme,
          callback: (token: string) => {
            if (active) onVerify(token);
          },
          "expired-callback": () => {
            if (active) onVerify(null);
          },
          "error-callback": () => {
            if (active) onVerify(null);
          },
        });
        widgetIdRef.current = id;
      } catch (err) {
        console.error("Turnstile render error:", err);
        if (active) onError?.();
      }
    };

    // Wait for window.turnstile to be initialized
    if (window.turnstile) {
      renderWidget();
    } else {
      let waited = 0;
      checkInterval = setInterval(() => {
        if (window.turnstile) {
          clearInterval(checkInterval);
          if (active) renderWidget();
          return;
        }
        waited += 100;
        if (waited >= 10000) {
          clearInterval(checkInterval);
          console.error("Turnstile script failed to load");
          if (active) onError?.();
        }
      }, 100);
    }

    return () => {
      active = false;
      if (checkInterval) clearInterval(checkInterval);
      removeWidget();
    };
  }, [onVerify, onError, theme]);

  return (
    <div className="flex justify-center my-4">
      <div ref={containerRef} />
    </div>
  );
}

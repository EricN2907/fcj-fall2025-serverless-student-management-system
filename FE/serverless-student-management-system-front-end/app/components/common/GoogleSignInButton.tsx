import { useEffect, useRef } from "react";

declare global {
  interface Window {
    google?: any;
    googleInitialized?: boolean;
  }
}

interface Props {
  onSuccess: (credential: string) => void;
  onError?: () => void;
  showOneTap?: boolean;
}

export default function GoogleSignInButton({ onSuccess, onError, showOneTap = false }: Props) {
  const btnRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const interval = setInterval(() => {
      if (window.google && btnRef.current) {
        clearInterval(interval);

        // Initialize only once
        if (!window.googleInitialized) {
          window.google.accounts.id.initialize({
            client_id: import.meta.env.VITE_GOOGLE_CLIENT_ID,
            callback: (res: any) => {
              if (res.credential) onSuccess(res.credential);
              else onError?.();
            },
          });
          window.googleInitialized = true;

          // Show One Tap if enabled
          if (showOneTap) {
            window.google.accounts.id.prompt((notification: any) => {
              if (notification.isNotDisplayed()) {
                console.warn("One Tap not displayed:", notification.getNotDisplayedReason());
              }
              if (notification.isSkippedMoment()) {
                console.warn("One Tap skipped:", notification.getSkippedReason());
              }
            });
          }
        }

        // Render button
        window.google.accounts.id.renderButton(btnRef.current, {
          theme: "outline",
          size: "large",
          type: "standard",
          shape: "pill",
          width: "280",
          logo_alignment: "left",
        });
      }
    }, 200);

    return () => clearInterval(interval);
  }, [onSuccess, onError, showOneTap]);

  return <div ref={btnRef}></div>;
}

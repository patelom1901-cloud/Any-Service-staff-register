import React, { useState, useEffect } from 'react';
import './InstallPWA.css';

export default function InstallPWA() {
  const [supportsPWA, setSupportsPWA] = useState(false);
  const [promptInstall, setPromptInstall] = useState(null);
  const [isIOS, setIsIOS] = useState(false);

  useEffect(() => {
    // Check if on iOS
    const isIosDevice = /iphone|ipad|ipod/.test(window.navigator.userAgent.toLowerCase());
    // Check if already installed
    const isInStandaloneMode = ('standalone' in window.navigator) && (window.navigator.standalone);
    
    // Also check standard matchMedia for display-mode
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches;

    if (isIosDevice && !isInStandaloneMode && !isStandalone) {
      setIsIOS(true);
      setSupportsPWA(true);
    }

    const handler = e => {
      e.preventDefault();
      setSupportsPWA(true);
      setPromptInstall(e);
    };
    window.addEventListener("beforeinstallprompt", handler);

    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  const onClick = evt => {
    evt.preventDefault();
    if (!promptInstall) {
      return;
    }
    promptInstall.prompt();
    promptInstall.userChoice.then((choiceResult) => {
      if (choiceResult.outcome === 'accepted') {
        console.log('User accepted the install prompt');
      } else {
        console.log('User dismissed the install prompt');
      }
      setSupportsPWA(false);
      setPromptInstall(null);
    });
  };

  const onDismiss = () => {
    setSupportsPWA(false);
  };

  if (!supportsPWA) {
    return null;
  }

  return (
    <div className="pwa-banner">
      <div className="pwa-content">
        <div className="pwa-icon">📱</div>
        <div className="pwa-text">
          <h4>Install App</h4>
          {isIOS && !promptInstall ? (
            <p>Tap Share → Add to Home Screen</p>
          ) : (
            <p>Add to home screen for faster access</p>
          )}
        </div>
      </div>
      <div className="pwa-actions">
        <button className="btn-ghost btn-small" onClick={onDismiss}>Later</button>
        {!isIOS || promptInstall ? (
          <button className="btn btn-primary btn-small" onClick={onClick}>Install</button>
        ) : null}
      </div>
    </div>
  );
}

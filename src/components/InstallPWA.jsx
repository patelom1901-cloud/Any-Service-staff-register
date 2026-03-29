import React, { useState, useEffect } from 'react';
import './InstallPWA.css';

export default function InstallPWA() {
  const [showBanner, setShowBanner] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [deviceType, setDeviceType] = useState('desktop'); 
  const [isStandalone, setIsStandalone] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);

  useEffect(() => {
    // Session-based dismissal. Will show again if user closes and opens a new tab.
    if (sessionStorage.getItem('pwa_banner_dismissed') === 'true') {
      setIsDismissed(true);
      return;
    }

    const checkStandalone = () => {
      // Check if installed natively or added to homescreen
      const isStandaloneMode = ('standalone' in window.navigator) && window.navigator.standalone;
      const matchMediaStandalone = window.matchMedia('(display-mode: standalone)').matches;
      const isAndroidWebAPK = document.referrer.includes('android-app://');
      
      const isAlreadyInstalled = isStandaloneMode || matchMediaStandalone || isAndroidWebAPK;
      setIsStandalone(isAlreadyInstalled);
      return isAlreadyInstalled;
    };

    if (checkStandalone()) return;

    // Detect device environment
    const ua = window.navigator.userAgent.toLowerCase();
    const isIos = /iphone|ipad|ipod/.test(ua) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
    const isAndroid = /android/.test(ua);
    
    if (isIos) {
      setDeviceType('ios');
      setTimeout(() => setShowBanner(true), 2000); // 2 second delay
    } else if (isAndroid) {
      setDeviceType('android');
      setTimeout(() => setShowBanner(true), 2000);
    } else {
      setDeviceType('desktop');
      // For desktop, wait slightly longer and rely mostly on the native prompt event
      setTimeout(() => setShowBanner(true), 3000);
    }

    // Capture the native browser install prompt
    const handleBeforeInstallPrompt = (e) => {
      e.preventDefault(); // Prevent standard mini-infobar
      setDeferredPrompt(e);
      setShowBanner(true); // Ensure banner shows since native prompt is ready
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    
    // Listen for successful installation
    const handleAppInstalled = () => {
      setShowBanner(false);
      setIsStandalone(true);
      setDeferredPrompt(null);
    };
    
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const handleDismiss = () => {
    setShowBanner(false);
    sessionStorage.setItem('pwa_banner_dismissed', 'true'); // Only dismissed for this session
  };

  const handleInstallClick = async () => {
    if (!deferredPrompt && deviceType !== 'ios') {
      alert("Please open your browser menu and tap 'Install App' or 'Add to Home Screen'.");
      return;
    }
    
    if (deferredPrompt) {
        deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;
        
        if (outcome === 'accepted') {
          console.log('User accepted the PWA install prompt');
          setShowBanner(false);
        } else {
          console.log('User dismissed the PWA install prompt');
        }
        setDeferredPrompt(null);
    }
  };

  if (isStandalone || isDismissed || !showBanner) {
    return null;
  }

  return (
    <div className="pwa-top-banner">
      <div className="pwa-banner-content">
        <div className="pwa-icon">
          <img src="/favicon.png" alt="ASAR Logo" />
        </div>
        
        <div className="pwa-text">
          <strong>Install ASAR App</strong>
          <p>
             {deviceType === 'ios' && (
                 <span>Tap Share <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"/><polyline points="16 6 12 2 8 6"/><line x1="12" y1="2" x2="12" y2="15"/></svg> then <strong>"Add to Home Screen"</strong></span>
             )}
             {deviceType !== 'ios' && deferredPrompt && (
                 <span>Add to home screen for faster access & offline support</span>
             )}
             {deviceType !== 'ios' && !deferredPrompt && (
                 <span>Open browser menu (⋮) and tap <strong>Install</strong></span>
             )}
          </p>
        </div>

        {deferredPrompt && (
            <button className="pwa-install-btn" onClick={handleInstallClick}>
                Install
            </button>
        )}

        <button className="pwa-close-btn" onClick={handleDismiss} aria-label="Close">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
        </button>
      </div>
    </div>
  );
}

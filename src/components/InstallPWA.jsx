import React, { useState, useEffect } from 'react';
import './InstallPWA.css';

export default function InstallPWA() {
  const [showInstaller, setShowInstaller] = useState(false);
  const [promptInstall, setPromptInstall] = useState(null);
  const [deviceType, setDeviceType] = useState('desktop'); // ios, android, desktop
  const [isStandalone, setIsStandalone] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);

  useEffect(() => {
    // Check if user has already dismissed the prompt
    if (localStorage.getItem('pwa_prompt_dismissed') === 'true') {
      setIsDismissed(true);
      return;
    }

    const checkStandalone = () => {
      // iOS detection
      const isStandaloneMode = ('standalone' in window.navigator) && window.navigator.standalone;
      // Standard detection
      const matchMediaStandalone = window.matchMedia('(display-mode: standalone)').matches;
      // Android WebAPK detection
      const isAndroidWebAPK = document.referrer.includes('android-app://');
      
      const isAlreadyInstalled = isStandaloneMode || matchMediaStandalone || isAndroidWebAPK;
      setIsStandalone(isAlreadyInstalled);
      return isAlreadyInstalled;
    };

    if (checkStandalone()) return;

    // Detect device
    const ua = window.navigator.userAgent.toLowerCase();
    const isIos = /iphone|ipad|ipod/.test(ua) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
    const isAndroid = /android/.test(ua);
    
    if (isIos) {
      setDeviceType('ios');
      // Delay showing prompt slightly for a better UX
      setTimeout(() => setShowInstaller(true), 2500);
    } else if (isAndroid) {
      setDeviceType('android');
      // Show manual fallback prompt after 2.5s if native prompt doesn't fire
      setTimeout(() => {
        setShowInstaller(current => {
          return true; // Force show the manual instructions if native hasn't taken over
        });
      }, 2500);
    } else {
      setDeviceType('desktop');
      setTimeout(() => setShowInstaller(true), 3000);
    }

    // Capture the native install prompt
    const handler = (e) => {
      e.preventDefault();
      setPromptInstall(e);
      setShowInstaller(true); // Show our UI when native is ready
    };

    window.addEventListener("beforeinstallprompt", handler);
    
    // Listen for successful installation
    const installHandler = () => {
      setShowInstaller(false);
      setIsStandalone(true);
    };
    window.addEventListener('appinstalled', installHandler);

    return () => {
      window.removeEventListener("beforeinstallprompt", handler);
      window.removeEventListener('appinstalled', installHandler);
    };
  }, []);

  const handleDismiss = () => {
    setShowInstaller(false);
    localStorage.setItem('pwa_prompt_dismissed', 'true');
  };

  const handleInstallClick = async () => {
    if (!promptInstall) {
      alert("Please open your browser menu and tap 'Install App' or 'Add to Home Screen'.");
      return;
    }
    
    promptInstall.prompt();
    const { outcome } = await promptInstall.userChoice;
    
    if (outcome === 'accepted') {
      console.log('User accepted the install prompt');
      setShowInstaller(false);
    } else {
      console.log('User dismissed the install prompt');
    }
    setPromptInstall(null);
  };

  if (isStandalone || isDismissed || !showInstaller) {
    return null;
  }

  const renderInstructions = () => {
    if (promptInstall) {
      // NATIVE INSTALL READY
      return (
        <div className="pwa-instructions">
          <p>Get the full ASAR experience by installing the native app.</p>
          <button className="pwa-install-button native" onClick={handleInstallClick}>
            Install Native App 🚀
          </button>
        </div>
      );
    } 
    
    // MANUAL FALLBACKS
    if (deviceType === 'ios') {
      return (
        <div className="pwa-instructions ios">
          <p>Install ASAR on your iPhone/iPad:</p>
          <ol>
            <li>Tap the <strong>Share</strong> icon <svg className="inline-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"></path><polyline points="16 6 12 2 8 6"></polyline><line x1="12" y1="2" x2="12" y2="15"></line></svg> below.</li>
            <li>Scroll down and select <strong>Add to Home Screen</strong> <svg className="inline-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><line x1="12" y1="8" x2="12" y2="16"></line><line x1="8" y1="12" x2="16" y2="12"></line></svg>.</li>
          </ol>
        </div>
      );
    } else if (deviceType === 'android') {
      return (
        <div className="pwa-instructions android">
          <p>Install ASAR on your Android:</p>
          <ol>
            <li>Tap the <strong>Menu</strong> icon <span>(⋮)</span> at the top right of your browser.</li>
            <li>Select <strong>Install app</strong> or <strong>Add to Home screen</strong>.</li>
          </ol>
        </div>
      );
    } else {
      return (
        <div className="pwa-instructions desktop">
          <p>Install ASAR on your computer:</p>
          <ol>
            <li>Click the Install icon <svg className="inline-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><polyline points="8 12 12 16 16 12"></polyline><line x1="12" y1="8" x2="12" y2="16"></line></svg> in your browser's address bar at the top.</li>
          </ol>
        </div>
      );
    }
  };

  return (
    <>
      <div className="pwa-overlay" onClick={handleDismiss} />
      <div className="pwa-drawer">
        <button className="pwa-close-button" onClick={handleDismiss} aria-label="Close">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
        </button>
        
        <div className="pwa-drawer-header">
          <div className="pwa-app-icon">
            <img src="/favicon.png" alt="ASAR Logo" />
          </div>
          <div className="pwa-app-info">
            <h3>Any Service App</h3>
            <span>Attendance & Advances Tracker</span>
          </div>
        </div>
        
        <div className="pwa-drawer-body">
          {renderInstructions()}
        </div>
      </div>
    </>
  );
}

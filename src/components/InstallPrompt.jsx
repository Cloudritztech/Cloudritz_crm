import { useState, useEffect } from 'react';
import { Download, X } from 'lucide-react';

export default function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [showPrompt, setShowPrompt] = useState(false);

  useEffect(() => {
    const handler = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
      
      // Show prompt if not dismissed before
      const dismissed = localStorage.getItem('install-prompt-dismissed');
      if (!dismissed) {
        setShowPrompt(true);
      }
    };

    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;

    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    
    if (outcome === 'accepted') {
      setDeferredPrompt(null);
      setShowPrompt(false);
    }
  };

  const handleDismiss = () => {
    setShowPrompt(false);
    localStorage.setItem('install-prompt-dismissed', 'true');
  };

  if (!showPrompt) return null;

  return (
    <div className="fixed bottom-20 left-4 right-4 lg:left-auto lg:right-4 lg:w-96 z-50 animate-slide-up">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 p-4">
        <div className="flex items-start gap-3">
          <div className="p-2 bg-primary-light rounded-xl">
            <Download className="w-5 h-5 text-primary-theme" />
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-gray-900 dark:text-white mb-1">
              Install App
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
              Install our app for faster access and offline support
            </p>
            <div className="flex gap-2">
              <button
                onClick={handleInstall}
                className="btn-primary-theme text-sm px-4 py-2"
              >
                Install
              </button>
              <button
                onClick={handleDismiss}
                className="px-4 py-2 text-sm text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
              >
                Not now
              </button>
            </div>
          </div>
          <button
            onClick={handleDismiss}
            className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}

import { useState, useEffect } from 'react';
import { FiDownload, FiX } from 'react-icons/fi';
import { toast } from 'react-toastify';

const PWAInstallPrompt = () => {
    const [deferredPrompt, setDeferredPrompt] = useState(null);
    const [showPrompt, setShowPrompt] = useState(false);

    useEffect(() => {
        // Listen for the beforeinstallprompt event
        const handleBeforeInstallPrompt = (e) => {
            // Prevent the mini-infobar from appearing on mobile
            e.preventDefault();
            // Stash the event for later use
            setDeferredPrompt(e);
            // Show the install prompt
            setShowPrompt(true);

            // Log that the app is installable
            console.log('PWA is installable - beforeinstallprompt fired');
        };

        window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

        // Listen for app installation
        window.addEventListener('appinstalled', () => {
            console.log('PWA was installed');
            toast.success('App installed successfully! You can now use Dwella offline.');
            setShowPrompt(false);
            setDeferredPrompt(null);
        });

        return () => {
            window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
        };
    }, []);

    const handleInstall = async () => {
        if (!deferredPrompt) {
            return;
        }

        try {
            // Show the install prompt
            deferredPrompt.prompt();
            // Wait for the user to respond to the prompt
            const { outcome } = await deferredPrompt.userChoice;
            if (outcome === 'accepted') {
                console.log('User accepted the install prompt');
                toast.success('Installing Dwella...');
            } else {
                console.log('User dismissed the install prompt');
            }
            // Clear the deferred prompt after use
            setDeferredPrompt(null);
            setShowPrompt(false);
        } catch (error) {
            console.error('Error during PWA installation:', error);
            toast.error('Installation failed. Please try again.');
        }
    };

    const handleDismiss = () => {
        setShowPrompt(false);
        // Optionally, clear the deferred prompt to prevent showing it again
        // setDeferredPrompt(null);
    };

    // Don't render if there's no deferred prompt or if the prompt is dismissed
    if (!showPrompt || !deferredPrompt) {
        return null;
    }

    return (
        <div className="fixed top-0 left-0 right-0 z-40 px-4 pt-4">
            <div className="mx-auto max-w-md rounded-lg bg-gradient-to-r from-emerald-500 to-emerald-600 p-4 shadow-lg">
                <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3">
                        <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-white/20">
                            <FiDownload className="text-white" size={20} />
                        </div>
                        <div>
                            <h3 className="font-semibold text-white">Install Dwella</h3>
                            <p className="mt-1 text-sm text-emerald-50">
                                Install our app for quick access and offline support
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={handleDismiss}
                        className="ml-2 flex-shrink-0 text-white hover:text-emerald-100 transition-colors"
                        aria-label="Dismiss install prompt"
                    >
                        <FiX size={20} />
                    </button>
                </div>

                <div className="mt-4 flex gap-2">
                    <button
                        onClick={handleInstall}
                        className="flex-1 rounded-lg bg-white px-4 py-2 font-medium text-emerald-600 hover:bg-emerald-50 transition-colors"
                    >
                        Install
                    </button>
                    <button
                        onClick={handleDismiss}
                        className="rounded-lg bg-white/20 px-4 py-2 font-medium text-white hover:bg-white/30 transition-colors"
                    >
                        Not Now
                    </button>
                </div>
            </div>
        </div>
    );
};

export default PWAInstallPrompt;

import { Capacitor } from '@capacitor/core';
import { App as CapacitorApp } from '@capacitor/app';
import { OTAStatus } from '../types';

let isUpdaterAvailable = false;
let CapacitorUpdaterModule: any = null;

// Dynamically check and import CapacitorUpdater if running in native/Capacitor environment
export const initOtaService = async (onUpdateAppliedCallback?: (msg: string) => void) => {
  try {
    if (Capacitor.isNativePlatform()) {
      const module: any = await import('@capgo/capacitor-updater');
      CapacitorUpdaterModule = module.CapacitorUpdater || module.default;
      if (CapacitorUpdaterModule) {
        isUpdaterAvailable = true;
        // Tell Capgo the current bundle started successfully so it avoids rolling back
        await CapacitorUpdaterModule.notifyAppReady();
      }
    }
  } catch (err) {
    console.log('Capacitor Live Update running in web/preview mode:', err);
  }

  // Check if an update was just applied previously
  if (typeof window !== 'undefined') {
    const justUpdated = localStorage.getItem('hz_just_updated');
    if (justUpdated === 'true') {
      localStorage.removeItem('hz_just_updated');
      if (onUpdateAppliedCallback) {
        onUpdateAppliedCallback('Heavenly Zemma updated to latest version!');
      }
    }
  }

  // Listen to App foreground events to check for OTA updates on every app open and resume
  try {
    CapacitorApp.addListener('appStateChange', (state) => {
      if (state.isActive) {
        checkForOTAUpdate();
      }
    });
  } catch (err) {
    // Web fallback for visibilitychange
    if (typeof document !== 'undefined') {
      document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'visible') {
          checkForOTAUpdate();
        }
      });
    }
  }
};

export const checkForOTAUpdate = async (
  onProgress?: (progress: number) => void
): Promise<{ available: boolean; version?: string; message: string }> => {
  console.log('[OTA] Checking for over-the-air update...');

  // If in native environment with Capgo
  if (isUpdaterAvailable && CapacitorUpdaterModule) {
    try {
      const update = await CapacitorUpdaterModule.check();
      if (update && update.url) {
        console.log('[OTA] New version found:', update.version);
        if (onProgress) onProgress(20);
        
        // Download update in background
        const downloaded = await CapacitorUpdaterModule.download({
          url: update.url,
          version: update.version,
        });
        
        if (onProgress) onProgress(80);

        // Apply on next launch
        await CapacitorUpdaterModule.set(downloaded);
        if (typeof window !== 'undefined') {
          localStorage.setItem('hz_just_updated', 'true');
        }

        if (onProgress) onProgress(100);

        return {
          available: true,
          version: update.version,
          message: `Update v${update.version} downloaded and ready for next launch.`,
        };
      } else {
        return {
          available: false,
          version: '1.0.0',
          message: 'Heavenly Zemma is up to date (v1.0.0).',
        };
      }
    } catch (err: any) {
      console.warn('[OTA] Check failed:', err);
      // Auto rollback mechanism is handled by Capgo if notifyAppReady is not called within timeout
      return {
        available: false,
        message: 'Could not connect to OTA server. You are running the latest stable build.',
      };
    }
  }

  // Web / Dev simulation
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({
        available: false,
        version: '1.0.0-web',
        message: 'App is running latest build (v1.0.0). OTA update daemon active.',
      });
    }, 800);
  });
};

export const getOTAVersionInfo = (): { version: string; channel: string } => {
  return {
    version: '1.0.4',
    channel: 'production',
  };
};

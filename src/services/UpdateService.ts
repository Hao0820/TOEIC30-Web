class UpdateService {
  private lastCheckTime = 0;
  private currentBuildTime: number = typeof __APP_BUILD_TIME__ !== 'undefined' ? __APP_BUILD_TIME__ : Date.now();

  constructor() {
    this.initAutoChecker();
  }

  private initAutoChecker() {
    if (typeof window === 'undefined') return;

    // Check 2 seconds after initial load
    setTimeout(() => {
      this.checkAndApplyUpdate();
    }, 2000);

    // Check when user returns to the app tab or unlocks phone
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible') {
        this.checkAndApplyUpdate();
      }
    });

    window.addEventListener('focus', () => {
      this.checkAndApplyUpdate();
    });

    // Check periodically every 2 minutes
    setInterval(() => {
      this.checkAndApplyUpdate();
    }, 120000);
  }

  public async checkAndApplyUpdate(): Promise<boolean> {
    const now = Date.now();
    // Throttle checks to once every 10 seconds
    if (now - this.lastCheckTime < 10000) return false;
    this.lastCheckTime = now;

    try {
      const res = await fetch(`/version.json?t=${now}`, {
        cache: 'no-store',
        headers: { 'Cache-Control': 'no-cache, no-store, must-revalidate', 'Pragma': 'no-cache' }
      });
      if (!res.ok) return false;

      const data = await res.json();
      if (data && data.buildTime && data.buildTime > this.currentBuildTime) {
        console.log(`[UpdateService] New version detected: ${data.version} (${data.buildTime}) vs current (${this.currentBuildTime}). Auto-refreshing...`);
        // Clear caches if available
        if ('caches' in window) {
          const cacheKeys = await caches.keys();
          await Promise.all(cacheKeys.map(key => caches.delete(key)));
        }
        // Force reload to latest build
        window.location.replace(`${window.location.origin}${window.location.pathname}?v=${data.buildTime}`);
        return true;
      }
    } catch (e) {
      console.warn('[UpdateService] Update check failed:', e);
    }
    return false;
  }

  public forceHardRefresh() {
    if ('caches' in window) {
      caches.keys().then((names) => {
        names.forEach((name) => caches.delete(name));
      });
    }
    window.location.href = `${window.location.origin}${window.location.pathname}?t=${Date.now()}`;
  }
}

export const updateService = new UpdateService();

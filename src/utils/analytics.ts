import { generateId } from './diceUtils';
import { GA_MEASUREMENT_ID } from './constants';

export interface LocalAnalyticsStats {
  visitorId: string;
  totalSessions: number;
  firstSessionTime: string;
  lastSessionTime: string;
  totalRolls: number;
  totalDiceRolled: number;
  totalSumRolled: number;
  highestRoll: number;
  presetsLoadedCount: Record<string, number>;
  customDiceAddedCount: number;
  backupsExportedCount: number;
  backupsImportedCount: number;
  shareLinksGeneratedCount: number;
  favoriteTheme: string;
  telemetryEnabled: boolean;
}

const STORAGE_KEY = 'diceAnalyticsStats';
const PRIVACY_KEY = 'telemetryEnabled';

function getDefaultStats(): LocalAnalyticsStats {
  const now = new Date().toISOString();
  return {
    visitorId: generateId(),
    totalSessions: 0,
    firstSessionTime: now,
    lastSessionTime: now,
    totalRolls: 0,
    totalDiceRolled: 0,
    totalSumRolled: 0,
    highestRoll: 0,
    presetsLoadedCount: {},
    customDiceAddedCount: 0,
    backupsExportedCount: 0,
    backupsImportedCount: 0,
    shareLinksGeneratedCount: 0,
    favoriteTheme: 'theme-dark',
    telemetryEnabled: localStorage.getItem(PRIVACY_KEY) !== 'false',
  };
}

export function getLocalStats(): LocalAnalyticsStats {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      return { ...getDefaultStats(), ...parsed };
    }
  } catch (e) {
    console.error('Failed to load analytics stats', e);
  }
  const defaults = getDefaultStats();
  saveLocalStats(defaults);
  return defaults;
}

export function saveLocalStats(stats: LocalAnalyticsStats): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(stats));
    localStorage.setItem(PRIVACY_KEY, String(stats.telemetryEnabled));
  } catch (e) {
    console.error('Failed to save analytics stats', e);
  }
}

export function setTelemetryEnabled(enabled: boolean): void {
  const stats = getLocalStats();
  stats.telemetryEnabled = enabled;
  saveLocalStats(stats);

  // Google Analytics' official kill switch: when set, gtag drops all hits
  // (including automatic page_views), making the privacy toggle actually binding.
  (window as unknown as Record<string, unknown>)[`ga-disable-${GA_MEASUREMENT_ID}`] = !enabled;
}

/** Detect device classification for metrics */
export function getDeviceCategory(): 'mobile' | 'tablet' | 'desktop' {
  const width = window.innerWidth;
  if (width <= 480) return 'mobile';
  if (width <= 768) return 'tablet';
  return 'desktop';
}

/** Record a new session on app mount */
export function recordSessionStart(): LocalAnalyticsStats {
  const stats = getLocalStats();
  stats.totalSessions += 1;
  stats.lastSessionTime = new Date().toISOString();
  saveLocalStats(stats);

  if (stats.telemetryEnabled) {
    dispatchExternalEvent('session_start', {
      deviceCategory: getDeviceCategory(),
      referrer: document.referrer || 'direct',
      screenSize: `${window.innerWidth}x${window.innerHeight}`,
    });
  }

  return stats;
}

export type AnalyticsEventName =
  | 'page_view'
  | 'roll_dice'
  | 'preset_loaded'
  | 'preset_saved'
  | 'dice_added'
  | 'dice_removed'
  | 'dice_customized'
  | 'backup_exported'
  | 'backup_imported'
  | 'share_link_copied'
  | 'theme_changed'
  | 'sound_toggled'
  | 'modifier_toggled';

/** Primary event logger */
export function trackEvent(eventName: AnalyticsEventName, payload: Record<string, unknown> = {}): void {
  const stats = getLocalStats();

  // 1. Update local metrics counters
  switch (eventName) {
    case 'roll_dice': {
      const diceCount = typeof payload.diceCount === 'number' ? payload.diceCount : 0;
      const sum = typeof payload.sum === 'number' ? payload.sum : 0;
      stats.totalRolls += 1;
      stats.totalDiceRolled += diceCount;
      stats.totalSumRolled += sum;
      if (sum > stats.highestRoll) {
        stats.highestRoll = sum;
      }
      break;
    }
    case 'preset_loaded': {
      const presetName = typeof payload.presetName === 'string' ? payload.presetName : 'Unknown';
      stats.presetsLoadedCount[presetName] = (stats.presetsLoadedCount[presetName] || 0) + 1;
      break;
    }
    case 'dice_added': {
      stats.customDiceAddedCount += 1;
      break;
    }
    case 'backup_exported': {
      stats.backupsExportedCount += 1;
      break;
    }
    case 'backup_imported': {
      stats.backupsImportedCount += 1;
      break;
    }
    case 'share_link_copied': {
      stats.shareLinksGeneratedCount += 1;
      break;
    }
    case 'theme_changed': {
      if (typeof payload.theme === 'string') {
        stats.favoriteTheme = payload.theme;
      }
      break;
    }
  }

  saveLocalStats(stats);

  // 2. Dispatch to external analytics if telemetry is enabled
  if (stats.telemetryEnabled) {
    dispatchExternalEvent(eventName, payload);
  }
}

interface WindowWithGtag extends Window {
  gtag?: (command: string, action: string, params?: Record<string, unknown>) => void;
}

/** Dispatches events to standard external providers if configured */
function dispatchExternalEvent(eventName: string, payload: Record<string, unknown>): void {
  try {
    // Support Google Analytics (gtag.js)
    if (typeof window !== 'undefined') {
      const win = window as unknown as WindowWithGtag;
      if (win.gtag) {
        win.gtag('event', eventName, payload);
      }
    }

    // Support custom analytics HTTP endpoint if defined in env
    const endpoint = import.meta.env?.VITE_ANALYTICS_ENDPOINT;
    if (endpoint) {
      const body = JSON.stringify({
        event: eventName,
        timestamp: new Date().toISOString(),
        payload,
      });
      if (navigator.sendBeacon) {
        navigator.sendBeacon(endpoint, body);
      } else {
        fetch(endpoint, { method: 'POST', body, headers: { 'Content-Type': 'application/json' } }).catch(() => {});
      }
    }
  } catch {
    // Silent fail for telemetry so user experience is never impacted
  }
}

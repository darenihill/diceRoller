import { SAVED } from './savedValues';
import { readItem } from './safeStorage';
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

const STORAGE_KEY = SAVED.usageStats;
const PRIVACY_KEY = SAVED.telemetry;

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
    telemetryEnabled: readItem(PRIVACY_KEY) !== 'false',
  };
}

/**
 * Keeps only values of the right kind from saved stats, so a hand-edited or
 * damaged backup can't blank the Usage Stats screen (security review,
 * 2026-11-07): a missing or wrong-typed value falls back to its default.
 */
export function cleanStats(parsed: unknown): LocalAnalyticsStats {
  const stats = getDefaultStats();
  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) return stats;
  const src = parsed as Record<string, unknown>;
  const out = stats as unknown as Record<string, unknown>;
  for (const [key, fallback] of Object.entries(stats)) {
    // The analytics switch alone decides; a backup's stats can't turn it back on
    if (key === 'telemetryEnabled') continue;
    const value = src[key];
    if (key === 'presetsLoadedCount') {
      if (value && typeof value === 'object' && !Array.isArray(value)) {
        const counts: Record<string, number> = {};
        for (const [name, n] of Object.entries(value)) {
          if (typeof n === 'number' && Number.isFinite(n)) counts[name] = n;
        }
        out[key] = counts;
      }
    } else if (typeof fallback === 'number') {
      if (typeof value === 'number' && Number.isFinite(value)) out[key] = value;
    } else if (typeof value === typeof fallback) {
      out[key] = value;
    }
  }
  return stats;
}

export function getLocalStats(): LocalAnalyticsStats {
  try {
    const raw = readItem(STORAGE_KEY);
    if (raw) {
      return cleanStats(JSON.parse(raw));
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
  if (enabled) loadGoogleTag();
  else clearGoogleCookies();
}

/** True on the developer's own machine, where nothing goes to Google (index.html) */
const isDevHost = () => location.hostname === 'localhost' || location.hostname === '127.0.0.1';

/**
 * Fetches Google's tag script when metrics are turned on. index.html skips it
 * while metrics are off, so a visit with metrics off asks nothing of Google
 * (privacy review, 2026-11-09).
 */
export function loadGoogleTag(): void {
  if (isDevHost() || document.querySelector('script[src*="googletagmanager.com/gtag/js"]')) return;
  const s = document.createElement('script');
  s.async = true;
  s.src = `https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`;
  document.head.appendChild(s);
}

/**
 * Google Analytics keeps an ID in its own cookies (_ga, _ga_<id>) for about 13
 * months. With metrics off they are deleted, on this site and its parent
 * domain, so turning metrics off leaves nothing of Google's behind (privacy
 * review, 2026-11-09).
 */
export function clearGoogleCookies(): void {
  try {
    const names = document.cookie.split(';').map(c => c.split('=')[0].trim()).filter(n => /^_ga(_|$)/.test(n));
    if (names.length === 0) return;
    const parts = location.hostname.split('.');
    const domains = [''];
    for (let i = 0; i < parts.length - 1; i++) domains.push(`; domain=.${parts.slice(i).join('.')}`);
    for (const name of names) {
      for (const domain of domains) {
        document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/${domain}`;
      }
    }
  } catch {
    // Cookies blocked: there is nothing of Google's to clear
  }
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
  // Metrics turned off before this fix, or by a backup, may have left Google's cookies
  if (!stats.telemetryEnabled) clearGoogleCookies();

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
  | 'roll_one_die'
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
  | 'shake_toggled'
  | 'bright_rings_toggled'
  | 'sort_dice_toggled'
  | 'shake_roll'
  | 'table_view_toggled'
  | 'modifier_toggled'
  | 'install_clicked';

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

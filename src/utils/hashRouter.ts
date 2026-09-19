/**
 * Rouleur URL Hash Router
 * Provides seamless deep-linking, browser history navigation (back/forward),
 * refresh retention, and PWA shortcut navigation for all 21 cycling tools.
 */

import { TOOLS_LIST } from '../data/toolsList';

const VALID_TOOL_IDS = new Set(TOOLS_LIST.map(t => t.id));

/**
 * Parses a tool ID from the browser window.location.hash.
 * Supports:
 * - '#tool-power-calc' (PWA manifest standard)
 * - '#/tool/power-calc' (SPA route convention)
 * - '#power-calc' (direct shortcut)
 * - '' or '#home' or '#' -> returns null (Dashboard view)
 */
export function parseToolIdFromHash(hash: string): string | null {
  if (!hash) return null;

  // Remove leading '#' and optional leading '/'
  let clean = hash.replace(/^#\/?/, '').trim();
  if (!clean || clean === 'home' || clean === '/') return null;

  // Strip 'tool-' or 'tool/' prefix if present
  if (clean.startsWith('tool-')) {
    clean = clean.substring(5);
  } else if (clean.startsWith('tool/')) {
    clean = clean.substring(5);
  }

  // Check against valid tool IDs
  if (VALID_TOOL_IDS.has(clean)) {
    return clean;
  }

  return null;
}

/**
 * Formats a canonical URL hash for a given tool ID.
 * Example: 'tire-pressure' -> '#tool-tire-pressure'
 * null -> '' (root dashboard)
 */
export function formatHashForTool(toolId: string | null): string {
  if (!toolId || !VALID_TOOL_IDS.has(toolId)) {
    return '';
  }
  return `#tool-${toolId}`;
}

/**
 * Updates browser URL hash and history stack without triggering full-page reload.
 */
export function syncHashToBrowser(toolId: string | null, replace = false): void {
  if (typeof window === 'undefined') return;

  const targetHash = formatHashForTool(toolId);
  const currentHash = window.location.hash;

  if (targetHash === currentHash) return;

  const newUrl = targetHash
    ? `${window.location.pathname}${window.location.search}${targetHash}`
    : `${window.location.pathname}${window.location.search}`;

  if (replace) {
    window.history.replaceState({ toolId }, '', newUrl);
  } else {
    window.history.pushState({ toolId }, '', newUrl);
  }
}

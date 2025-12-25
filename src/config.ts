/**
 * Game configuration constants
 */

/**
 * Viewport dimensions for desktop
 * Covers about one room and a little bit more (~15x15 tiles)
 */
export const DESKTOP_VIEWPORT_WIDTH = 17;
export const DESKTOP_VIEWPORT_HEIGHT = 13;

/**
 * Viewport dimensions for mobile
 * Smaller viewport with larger tiles for easier touch interaction
 */
export const MOBILE_VIEWPORT_WIDTH = 13;
export const MOBILE_VIEWPORT_HEIGHT = 11;

/**
 * Tile size for desktop (in pixels)
 */
export const DESKTOP_TILE_SIZE = 24;

/**
 * Tile size for mobile (in pixels)
 * Larger tiles make it easier to tap on mobile devices
 */
export const MOBILE_TILE_SIZE = 32;

/**
 * Check if the device is mobile
 * Uses hybrid approach: user agent + window width for better coverage
 * - User agent catches mobile browsers that may have large viewports
 * - Window width catches responsive layouts and tablets
 */
export function isMobileDevice(): boolean {
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
    navigator.userAgent
  ) || window.innerWidth < 768;
}

/**
 * Get viewport width based on device type
 */
export function getViewportWidth(): number {
  return isMobileDevice() ? MOBILE_VIEWPORT_WIDTH : DESKTOP_VIEWPORT_WIDTH;
}

/**
 * Get viewport height based on device type
 */
export function getViewportHeight(): number {
  return isMobileDevice() ? MOBILE_VIEWPORT_HEIGHT : DESKTOP_VIEWPORT_HEIGHT;
}

/**
 * Get tile size based on device type
 */
export function getTileSize(): number {
  return isMobileDevice() ? MOBILE_TILE_SIZE : DESKTOP_TILE_SIZE;
}

// Legacy exports for backward compatibility (use dynamic functions above instead)
export const VIEWPORT_WIDTH = DESKTOP_VIEWPORT_WIDTH;
export const VIEWPORT_HEIGHT = DESKTOP_VIEWPORT_HEIGHT;

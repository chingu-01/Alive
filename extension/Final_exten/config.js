/**
 * Attenova Configuration
 * Customize these values to change extension behavior.
 */

const CONFIG = {
  // Parent/Child Mode Settings
  DEFAULT_MODE: 'child',
  DEFAULT_TAB_LIMIT: 4,
  MAX_TAB_LIMIT: 20,
  MIN_TAB_LIMIT: 1,

  // Tab Switch Tracking
  FREQUENCY_CHECK_MINUTES: 2,
  FREQUENCY_THRESHOLD: 5,

  // Notification Settings
  SHOW_TAB_LIMIT_ALERTS: true,
  SHOW_ON_PAGE_ALERTS: true,

  // Email OTP Settings
  EMAILJS_SERVICE_ID: 'YOUR_EMAILJS_SERVICE_ID',
  EMAILJS_TEMPLATE_ID: 'YOUR_EMAILJS_TEMPLATE_ID',
  EMAILJS_PUBLIC_KEY: 'YOUR_EMAILJS_PUBLIC_KEY',

  // Auto Check Settings
  TAB_LIMIT_CHECK_INTERVAL_SECONDS: 10,

  // UI Settings
  POPUP_REFRESH_INTERVAL: 2000,

  // Storage Keys
  STORAGE_KEYS: {
    ACTIVE_MODE: 'activeMode',
    TAB_LIMIT: 'tabLimit',
    TAB_SWITCHES: 'tabSwitches',
    TAB_SWITCH_TIMESTAMPS: 'tabSwitchTimestamps',
    TAB_SWITCH_LOG: 'tabSwitchLog',
    SITE_HISTORY: 'siteHistory',
    VISITED_TABS: 'visitedTabs',
    TAB_OPEN_COUNT: 'tabOpenCount',
    TAB_OPEN_HISTORY: 'tabOpenHistory',
    CURRENT_ACTIVE_TAB: 'currentActiveTab',
    CURRENT_ACTIVE_TAB_START_TIME: 'currentActiveTabStartTime',
    OPEN_TABS: 'openTabs',
    EXTRA_TABS: 'extraTabs',
    LAST_VIOLATION: 'lastViolation',
    PARENT_PASSWORD_HASH: 'parentPasswordHash',
    PARENT_PASSWORD_SALT: 'parentPasswordSalt',
    PARENT_EMAIL: 'parentEmail',
    PASSWORD_RESET_OTP_HASH: 'passwordResetOtpHash',
    PASSWORD_RESET_OTP_SALT: 'passwordResetOtpSalt',
    PASSWORD_RESET_OTP_EXPIRES_AT: 'passwordResetOtpExpiresAt',
    PASSWORD_RESET_OTP_EMAIL: 'passwordResetOtpEmail'
  },

  // UI Labels
  LABELS: {
    TAB_LIMIT_EXCEEDED: 'Tab Limit Exceeded',
    PARENT_MODE: 'Parent Mode',
    CHILD_MODE: 'Child Mode',
    EXTENSION_NAME: 'Attenova'
  }
};

if (typeof module !== 'undefined' && module.exports) {
  module.exports = CONFIG;
}
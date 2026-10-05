// ============================================================
// copy.ts — editable copy, URLs, and marketing constants
// ============================================================

export const APP_NAME = 'Station Deutsch';

/** Canonical application URL */
export const APP_URL = 'https://stationdeutsch.web.app';

/** One-line benefit displayed prominently on the Welcome screen under the headline */
export const WELCOME_BENEFIT =
  'Build bedside confidence with 5 minutes of focused clinical practice each day.';

/**
 * Optional Skillcase demo booking URL.
 * Empty by default ('').
 * When set, displays a quiet "Practise live with a trainer: free demo" link.
 */
export const SKILLCASE_DEMO_URL = '';

/** Share message used when inviting a study partner */
export const INVITE_PARTNER_MESSAGE =
  `Hey! I'm learning medical German for nurses on Station Deutsch. Practise clinical vocabulary with me: ${APP_URL}`;

/** Builds the WhatsApp share URL for inviting a study partner */
export function getInviteWhatsAppUrl(message: string = INVITE_PARTNER_MESSAGE): string {
  return `https://wa.me/?text=${encodeURIComponent(message)}`;
}

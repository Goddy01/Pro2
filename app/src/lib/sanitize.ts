/**
 * Input sanitization utilities to prevent XSS, injection, and abuse.
 * Use on all user-submitted form data before display or sending to backend.
 */

const MAX_NAME = 200;
const MAX_PHONE = 30;
const MAX_EMAIL = 254;

/** Strict maximum for introduction; enforce everywhere (form + sanitizer). */
export const MAX_INTRO = 2000;

/** Strip HTML/script tags and dangerous characters from a string */
function stripHtmlAndScript(value: string): string {
  return value
    .replace(/<[^>]*>/g, '')
    .replace(/javascript:/gi, '')
    .replace(/data:/gi, '')
    .replace(/vbscript:/gi, '')
    .replace(/on\w+=/gi, '')
    .replace(/&#x?[0-9a-f]+;/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/** Sanitize name: letters, spaces, hyphens, apostrophes only */
export function sanitizeName(raw: string): { value: string; error?: string } {
  const trimmed = raw.trim();
  if (!trimmed) return { value: '', error: 'Name is required' };
  const cleaned = trimmed
    .slice(0, MAX_NAME)
    .replace(/[^\p{L}\p{M}\s\-']/gu, '')
    .replace(/\s+/g, ' ')
    .trim();
  if (cleaned.length < 2) return { value: cleaned, error: 'Name must be at least 2 characters' };
  return { value: cleaned };
}

/** Sanitize phone: digits, spaces, dashes, parentheses, plus only */
export function sanitizePhone(raw: string): { value: string; error?: string } {
  const trimmed = raw.trim();
  if (!trimmed) return { value: '', error: 'Phone number is required' };
  const cleaned = trimmed
    .slice(0, MAX_PHONE)
    .replace(/[^\d\s\-()+]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
  const digitsOnly = cleaned.replace(/\D/g, '');
  if (digitsOnly.length < 10) return { value: cleaned, error: 'Enter a valid phone number (at least 10 digits)' };
  return { value: cleaned };
}

/** Basic email format and sanitization (no HTML/script) */
const EMAIL_REGEX = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;

export function sanitizeEmail(raw: string): { value: string; error?: string } {
  const trimmed = raw.trim().slice(0, MAX_EMAIL);
  const cleaned = stripHtmlAndScript(trimmed).replace(/[<>"']/g, '');
  if (!cleaned) return { value: '', error: 'Email is required' };
  if (!EMAIL_REGEX.test(cleaned)) return { value: cleaned, error: 'Enter a valid email address' };
  return { value: cleaned.toLowerCase() };
}

/** Sanitize free-text introduction: no HTML/script, strict 2000-char limit (reject overflow). */
export function sanitizeIntroduction(raw: string): { value: string; error?: string } {
  // Reject oversized input immediately — never process more than MAX_INTRO (DoS + bypass protection)
  if (raw.length > MAX_INTRO) {
    return { value: '', error: `Introduction must be ${MAX_INTRO} characters or less` };
  }
  const cleaned = stripHtmlAndScript(raw).slice(0, MAX_INTRO).trim();
  if (!cleaned) return { value: '', error: 'Please tell us about yourself and why you\'re interested' };
  if (cleaned.length < 50) return { value: cleaned, error: 'Please provide at least 50 characters' };
  return { value: cleaned };
}

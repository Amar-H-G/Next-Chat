/**
 * Validates a display name.
 */
export function validateName(name: string): string | null {
  const trimmed = name.trim();
  if (!trimmed) return "Name is required.";
  if (trimmed.length < 2) return "Name must be at least 2 characters.";
  if (trimmed.length > 128) return "Name must be under 128 characters.";
  return null;
}

/**
 * Validates an email address.
 */
export function validateEmail(email: string): string | null {
  const trimmed = email.trim();
  if (!trimmed) return "Email is required.";
  // RFC 5322 simplified check
  const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRe.test(trimmed)) return "Enter a valid email address.";
  return null;
}

/**
 * Validates a password.
 */
export function validatePassword(password: string): string | null {
  if (!password) return "Password is required.";
  if (password.length < 8) return "Password must be at least 8 characters.";
  if (password.length > 256) return "Password is too long.";
  return null;
}

/**
 * Validates a chat message body.
 * Returns null if valid, or an error string.
 */
export function validateMessage(content: string): string | null {
  const trimmed = content.trim();
  if (!trimmed) return "Message cannot be empty.";
  if (trimmed.length > 4000) return "Message is too long (max 4000 characters).";
  return null;
}

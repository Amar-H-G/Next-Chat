const AVATAR_GRADIENTS = [
  "avatar-gradient-1",
  "avatar-gradient-2",
  "avatar-gradient-3",
  "avatar-gradient-4",
  "avatar-gradient-5",
  "avatar-gradient-6",
];

/**
 * Returns a deterministic gradient class for a given name string.
 */
export function getAvatarGradient(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return AVATAR_GRADIENTS[Math.abs(hash) % AVATAR_GRADIENTS.length];
}

/**
 * Returns the first letter(s) of a name for use as avatar initials.
 */
export function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }
  return name.slice(0, 2).toUpperCase();
}

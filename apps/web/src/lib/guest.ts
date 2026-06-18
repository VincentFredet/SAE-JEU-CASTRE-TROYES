// Pseudo invité (jeu en invité, sans compte) : lettres/chiffres/espaces/-/_/',
// 2 à 20 caractères. Partagé par l'API token et le formulaire d'entrée.
export const GUEST_NAME_RE = /^[\p{L}\p{N} _'-]{2,20}$/u;

export function isValidGuestName(name: string): boolean {
  return GUEST_NAME_RE.test(name.trim());
}

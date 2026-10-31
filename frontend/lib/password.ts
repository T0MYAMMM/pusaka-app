export interface Strength {
  /** 0–4 */
  score: number
  label: '' | 'Weak' | 'Fair' | 'Good' | 'Strong'
}

/** A quick, local heuristic — not a replacement for a breach check. */
export function passwordStrength(pw: string): Strength {
  if (!pw) return { score: 0, label: '' }
  let points = 0
  if (pw.length >= 8) points++
  if (pw.length >= 12) points++
  if (pw.length >= 16) points++
  if (/[A-Z]/.test(pw) && /[a-z]/.test(pw)) points++
  if (/[0-9]/.test(pw)) points++
  if (/[^A-Za-z0-9]/.test(pw)) points++
  if (points <= 2) return { score: 1, label: 'Weak' }
  if (points <= 3) return { score: 2, label: 'Fair' }
  if (points <= 4) return { score: 3, label: 'Good' }
  return { score: 4, label: 'Strong' }
}

const SETS = {
  lower: 'abcdefghijkmnopqrstuvwxyz',
  upper: 'ABCDEFGHJKLMNPQRSTUVWXYZ',
  digits: '23456789',
  symbols: '!@#$%^&*-_=+?',
}

function randomIndex(max: number): number {
  const buf = new Uint32Array(1)
  // Rejection sampling avoids modulo bias.
  const limit = Math.floor(0xffffffff / max) * max
  do crypto.getRandomValues(buf)
  while (buf[0] >= limit)
  return buf[0] % max
}

/**
 * Generates a password with the browser's CSPRNG. Look-alike characters
 * (l, 1, I, O, 0) are left out so it can be read and retyped.
 */
export function generatePassword(length = 20): string {
  const all = SETS.lower + SETS.upper + SETS.digits + SETS.symbols
  const chars = [
    SETS.lower[randomIndex(SETS.lower.length)],
    SETS.upper[randomIndex(SETS.upper.length)],
    SETS.digits[randomIndex(SETS.digits.length)],
    SETS.symbols[randomIndex(SETS.symbols.length)],
  ]
  while (chars.length < length) chars.push(all[randomIndex(all.length)])
  // Fisher–Yates so the guaranteed characters are not always first.
  for (let i = chars.length - 1; i > 0; i--) {
    const j = randomIndex(i + 1)
    ;[chars[i], chars[j]] = [chars[j], chars[i]]
  }
  return chars.join('')
}

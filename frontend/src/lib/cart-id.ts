const CART_ID_KEY = 'fc_cart_id';

function randomId(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID();
  }
  return `cart_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 10)}`;
}

export function getCartId(): string | null {
  if (typeof window === 'undefined') return null;
  try {
    return window.localStorage.getItem(CART_ID_KEY);
  } catch {
    return null;
  }
}

export function ensureCartId(): string {
  if (typeof window === 'undefined') return '';
  const existing = getCartId();
  if (existing) return existing;
  const id = randomId();
  try {
    window.localStorage.setItem(CART_ID_KEY, id);
  } catch {
    /* ignore storage failures */
  }
  return id;
}

export function clearCartId(): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.removeItem(CART_ID_KEY);
  } catch {
    /* ignore */
  }
}

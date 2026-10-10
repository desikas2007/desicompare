/**
 * Frontend-only presentation helpers.
 *
 * The demo dataset does not ship food photography, so food/restaurant records
 * frequently arrive with `imageUrl: null`. To keep the discovery experience
 * attractive without inventing per-item imagery or changing the backend, we use
 * a small, verified set of stable stock photos as *generic, decorative*
 * fallbacks. When the API does provide an `imageUrl`, that value always wins.
 */

const UNSPLASH = 'https://images.unsplash.com/';

/** Build a sized Unsplash URL for a known photo id. */
export function foodPhoto(id: string, width = 800): string {
  return `${UNSPLASH}${id}?w=${width}&q=80&auto=format&fit=crop`;
}

const CATEGORY_PHOTO_IDS: Record<string, string> = {
  biryani: 'photo-1585937421612-70a008356fbe',
  pizza: 'photo-1513104890138-7c749659a591',
  burgers: 'photo-1568901346375-23c9450c58cd',
  burger: 'photo-1568901346375-23c9450c58cd',
  'south indian': 'photo-1630383249896-424e482df921',
  'south indian meals': 'photo-1546069901-ba9599a7e63c',
  momos: 'photo-1534422298391-e4f8c172dddb',
  noodles: 'photo-1585032226651-759b368d7246',
  'fried rice': 'photo-1567620905732-2d1ec7ab7445',
  beverages: 'photo-1509042239860-f550ce710b93',
  desserts: 'photo-1551024506-0bccd828d307',
  breakfast: 'photo-1533089860892-a7c6f0a88666',
  lunch: 'photo-1512621776951-a57141f2eefd',
  dinner: 'photo-1544025162-d76694265947',
  snacks: 'photo-1551782450-a2132b4ba21d',
  'north indian': 'photo-1601050690597-df0568f70950',
};

const FALLBACK_PHOTO_IDS = [
  'photo-1504674900247-0877df9cc836',
  'photo-1565958011703-44f9829ba187',
  'photo-1540189549336-e6e99c3679fe',
  'photo-1476224203421-9ac39bcb3327',
  'photo-1552332386-f8dd00dc2f85',
  'photo-1606491956689-2ea866880c84',
];

/** Large decorative photos used by the public hero collage. */
export const HERO_PHOTOS: string[] = [
  foodPhoto('photo-1585937421612-70a008356fbe', 720),
  foodPhoto('photo-1568901346375-23c9450c58cd', 720),
  foodPhoto('photo-1513104890138-7c749659a591', 720),
  foodPhoto('photo-1630383249896-424e482df921', 720),
];

function normalized(value: string): string {
  return value.trim().toLowerCase();
}

function hash(value: string): number {
  let total = 0;
  for (let index = 0; index < value.length; index += 1) {
    total = (total * 31 + value.charCodeAt(index)) >>> 0;
  }
  return total;
}

/** Deterministic decorative photo for a category / label. */
export function categoryPhoto(category?: string | null, seed?: string): string {
  const key = normalized(category ?? '');
  const id =
    CATEGORY_PHOTO_IDS[key] ??
    FALLBACK_PHOTO_IDS[hash(seed ?? category ?? 'food') % FALLBACK_PHOTO_IDS.length];
  return foodPhoto(id);
}

/** Prefer the real API image; fall back to a deterministic decorative photo. */
export function resolveFoodImage(
  imageUrl: string | null | undefined,
  category?: string | null,
  seed?: string,
): string {
  if (imageUrl && imageUrl.trim().length > 0) return imageUrl;
  return categoryPhoto(category, seed);
}

const CATEGORY_EMOJI: Record<string, string> = {
  all: '✨',
  biryani: '🍛',
  pizza: '🍕',
  burgers: '🍔',
  burger: '🍔',
  'south indian': '🥘',
  'south indian meals': '🍽️',
  momos: '🥟',
  noodles: '🍜',
  'fried rice': '🍚',
  beverages: '☕',
  desserts: '🍰',
  breakfast: '🥞',
  lunch: '🍱',
  dinner: '🍽️',
  snacks: '🍟',
  'north indian': '🍲',
};

/** Emoji glyph for a category — stable and dependency-free. */
export function categoryEmoji(category?: string | null): string {
  const key = normalized(category ?? '');
  if (CATEGORY_EMOJI[key]) return CATEGORY_EMOJI[key];
  for (const [name, glyph] of Object.entries(CATEGORY_EMOJI)) {
    if (name !== 'all' && key.includes(name)) return glyph;
  }
  return '🍴';
}

const CATEGORY_TAGLINE: Record<string, string> = {
  biryani: 'Fragrant, slow-cooked favourites',
  pizza: 'Cheesy classics and loaded slices',
  burgers: 'Stacked, saucy and satisfying',
  'south indian': 'Crisp dosas and comforting classics',
  'south indian meals': 'Full thalis and hearty plates',
  momos: 'Steamed, fried and dipped',
  noodles: 'Wok-tossed comfort bowls',
  'fried rice': 'Wok-fired and full of flavour',
  beverages: 'Hot brews and chilled sips',
  desserts: 'Sweet finishes worth the order',
  breakfast: 'Start the day right',
  lunch: 'Midday meals worth comparing',
  dinner: 'Evening plates to look forward to',
  snacks: 'Quick bites between meals',
  'north indian': 'Rich gravies and warm breads',
};

export function categoryTagline(category?: string | null): string {
  const key = normalized(category ?? '');
  return CATEGORY_TAGLINE[key] ?? 'Compare prices across providers';
}

/** Friendly greeting label for the current time of day. */
export function timeOfDayGreeting(date = new Date()): string {
  const hour = date.getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
}

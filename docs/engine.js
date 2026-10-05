export const EMPTY_FILTERS = { cuisines: [], tastes: [], meals: [], minReviews: 0, favoritesOnly: false, avoidRecent: true };
export const isDrawEligible = r => r.lunchEligible !== false;
export function reviewVolume(r) {
  if (Number.isInteger(r.reviewCount)) return r.reviewCount;
  const abbreviated = r.reviewCountText?.match(/^([\d.]+)(만|천)$/);
  return abbreviated ? Number(abbreviated[1]) * (abbreviated[2] === '만' ? 10000 : 1000) : null;
}
export function filterRestaurants(restaurants, filters, favorites = []) {
  return restaurants.filter(r =>
    isDrawEligible(r) &&
    (!filters.cuisines.length || filters.cuisines.includes(r.cuisine)) &&
    (!filters.tastes.length || filters.tastes.some(t => r.tastes.includes(t))) &&
    (!filters.meals.length || filters.meals.some(m => r.meals.includes(m))) &&
    (!filters.minReviews || (reviewVolume(r) !== null && reviewVolume(r) >= filters.minReviews)) &&
    (!filters.favoritesOnly || favorites.includes(r.id))
  );
}
export function drawRestaurant(candidates, recentIds = [], avoidRecent = true, random = Math.random) {
  const eligible = candidates.filter(isDrawEligible);
  if (!eligible.length) return null;
  const fresh = avoidRecent ? eligible.filter(r => !recentIds.includes(r.id)) : eligible;
  const pool = fresh.length ? fresh : eligible;
  return { restaurant: pool[Math.min(pool.length - 1, Math.max(0, Math.floor(random() * pool.length)))], recycled: avoidRecent && fresh.length === 0 };
}
export function secureRandom() {
  if (!globalThis.crypto?.getRandomValues) return Math.random();
  return crypto.getRandomValues(new Uint32Array(1))[0] / 4294967296;
}
export function normalizeFilters(value = {}) {
  const pick = (key, allowed) => Array.isArray(value[key]) ? [...new Set(value[key].filter(v => allowed.includes(v)))] : [];
  return {
    cuisines: pick('cuisines', ['한식','양식','중식','일식','아시안','분식']),
    tastes: pick('tastes', ['매콤','달콤','담백','진한']),
    meals: pick('meals', ['밥','면','고기','빵','분식']),
    minReviews: [0,100,500,1000].includes(value.minReviews) ? value.minReviews : 0,
    favoritesOnly: value.favoritesOnly === true,
    avoidRecent: value.avoidRecent !== false,
  };
}

// ─────────────────────────────────────────────────────────────
// CONFIG
// ─────────────────────────────────────────────────────────────
const SHEET_ID = '2PACX-1vSOSC5BGR5CbQ4B9xwfqMAoltIjE1b11akL5WrNeRXOiSzdueUgtvI7xYIQTUJwMMKXSJmpDtBddH5x';
const GID = {
  TRIP_ENGINE:   '2103068682',
  FILTER_ENGINE: '431668285',
  SETTINGS:      '0',
  COUNTRIES:     '2119597216',
  FLIGHTS:       '99695727',
};
const CACHE_KEY = 'travelos_v2_data';
const SYNC_KEY  = 'travelos_v2_synced';

function csvUrl(gid) {
  return `https://docs.google.com/spreadsheets/d/e/${SHEET_ID}/pub?output=csv&gid=${gid}&cb=${Date.now()}`;
}

// ─────────────────────────────────────────────────────────────
// CONSTANTS
// ─────────────────────────────────────────────────────────────

// Fallback multipliers used when country data isn't loaded yet
const STYLE_MULT = { Backpack: 1.0, Standard: 1.35, Comfort: 1.80, Luxury: 2.60 };

// Maps travel style to the column name in the countries sheet
const STYLE_COL = {
  Backpack: 'daily_cost_backpack',
  Standard: 'daily_cost_mid',
  Comfort:  'daily_cost_premium',
  Luxury:   'daily_cost_premium',  // sheet has no luxury column; use premium + multiplier
};
const LUXURY_MULT = 1.45;  // ~same ratio as original Luxury/Comfort (2.60/1.80)

// Month number → 3-letter name (matches season strings in countries sheet)
const MONTH_ABBR = ['', 'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

// Season preference → weight on total_season_score in ranking
const SEASON_WEIGHT = { High: 2.0, Mid: 1.0, Low: 0.3, No: 0.0 };

const MONTH_NAMES = {
  January:1, February:2, March:3, April:4, May:5, June:6,
  July:7, August:8, September:9, October:10, November:11, December:12,
};

const COUNTRY_COORDS = {
  'Japan':       [36.2, 138.3],
  'Taiwan':      [23.7, 121.0],
  'South Korea': [36.5, 127.9],
  'Italy':       [42.5, 12.6],
  'Spain':       [40.4, -3.7],
  'Austria':     [47.5, 14.6],
  'Colombia':    [4.6, -74.1],
  'Brazil':      [-14.2, -51.9],
  'Malaysia':    [4.2, 101.9],
  'Peru':        [-9.2, -75.0],
  'Bolivia':     [-16.5, -68.1],
  'Brunei':      [4.5, 114.7],
  'Vietnam':     [14.1, 108.3],
  'Laos':        [19.9, 102.5],
  'Georgia':     [42.3, 43.4],
  'Armenia':     [40.1, 45.0],
  'China':       [35.9, 104.2],
  'Egypt':       [26.8, 30.8],
  'Iceland':     [64.9, -18.0],
  'Turkey':      [38.9, 35.2],
  'Uzbekistan':  [41.4, 64.6],
  'Kyrgyzstan':  [41.2, 74.8],
  'Azerbaijan':  [40.1, 47.6],
  'Canada':      [56.1, -106.3],
  'Thailand':    [15.9, 100.9],
  'India':       [20.6, 79.1],
  'Morocco':     [31.8, -7.1],
  'France':      [46.2, 2.2],
  'Portugal':    [39.4, -8.2],
  'Greece':      [39.1, 22.5],
  'Croatia':     [45.1, 15.2],
  'Mexico':      [23.6, -102.6],
  'Argentina':   [-38.4, -63.6],
};

// ─────────────────────────────────────────────────────────────
// STYLE & FLAG DEFINITIONS
// ─────────────────────────────────────────────────────────────
const STYLES = [
  { key: 'adventure_score', label: 'Adventure', icon: '🧗', uKey: 'adventure' },
  { key: 'food_score',      label: 'Food',      icon: '🍜', uKey: 'food'      },
  { key: 'nature_score',    label: 'Nature',    icon: '🏔', uKey: 'nature'    },
  { key: 'beach_score',     label: 'Beach',     icon: '🏖', uKey: 'beach'     },
  { key: 'nightlife_score', label: 'Nightlife', icon: '🌃', uKey: 'nightlife' },
  { key: 'culture_score',   label: 'Culture',   icon: '🏛', uKey: 'culture'   },
];

const RANK_WEIGHTS = [
  { uKey: 'prefWeight',    label: 'Travel style',  default: 1.5, min: 0, max: 5, step: 0.5 },
  { uKey: 'budgetWeight',  label: 'Budget fit',    default: 4,   min: 0, max: 8, step: 0.5 },
  { uKey: 'fatigueWeight', label: 'Low fatigue',   default: 2,   min: 0, max: 8, step: 0.5 },
  { uKey: 'wishWeight',    label: 'Wishlist bonus', default: 4,   min: 0, max: 8, step: 0.5 },
];

const FLAGS = {
  'Japan': '🇯🇵',      'Taiwan': '🇹🇼',      'South Korea': '🇰🇷',
  'Italy': '🇮🇹',      'Spain': '🇪🇸',       'Austria': '🇦🇹',
  'Colombia': '🇨🇴',   'Brazil': '🇧🇷',      'Malaysia': '🇲🇾',
  'Peru': '🇵🇪',       'Bolivia': '🇧🇴',     'Brunei': '🇧🇳',
  'Vietnam': '🇻🇳',    'Laos': '🇱🇦',        'Georgia': '🇬🇪',
  'Armenia': '🇦🇲',    'China': '🇨🇳',       'Egypt': '🇪🇬',
  'Iceland': '🇮🇸',    'Turkey': '🇹🇷',      'Uzbekistan': '🇺🇿',
  'Kyrgyzstan': '🇰🇬', 'Azerbaijan': '🇦🇿',  'Canada': '🇨🇦',
  'Thailand': '🇹🇭',   'India': '🇮🇳',       'Morocco': '🇲🇦',
  'France': '🇫🇷',     'Portugal': '🇵🇹',    'Greece': '🇬🇷',
  'Croatia': '🇭🇷',    'Mexico': '🇲🇽',      'Argentina': '🇦🇷',
};

// ─────────────────────────────────────────────────────────────
// STATE
// ─────────────────────────────────────────────────────────────
let rawTrips      = [];
let filterMap     = {};
let countryData   = {};  // { 'Japan': { daily_cost_backpack, daily_cost_mid, daily_cost_premium, low_season, ... } }
let flightData    = {};  // { 'NL-Japan': { low, mid, high }, ... }
let currentFilter = 'bestmatch';
let _lastRanked   = [];
let _leafletMap   = null;
let _markerGroup  = null;
let hasPending    = false;

// Applied settings — used by the calculation engine
let U = {
  budget: 6000,
  days: 14,
  travelStyle: 'Standard',
  startMonth: 5,
  endMonth: 4,
  seasonPref: 'Mid',
  maxCountries: 2,
  avoidLong: false,
  preferCombos: true,
  adventure: 6, food: 9, nature: 7, beach: 6, nightlife: 4, culture: 10,
  prefWeight: 1.5, budgetWeight: 4, fatigueWeight: 2, wishWeight: 4,
};

// Draft settings — updated by all inputs; applied to U on Apply click
let pendingU = { ...U };

// ─────────────────────────────────────────────────────────────
// CSV PARSER
// ─────────────────────────────────────────────────────────────
function parseCSVRow(line) {
  const out = [];
  let cur = '', inQ = false;
  for (let i = 0; i < line.length; i++) {
    const c = line[i];
    if (c === '"') { inQ = !inQ; }
    else if (c === ',' && !inQ) { out.push(cur.trim()); cur = ''; }
    else cur += c;
  }
  out.push(cur.trim());
  return out;
}

function parseCSV(text) {
  const lines = text.trim().split('\n');
  if (lines.length < 2) return [];
  const headers = parseCSVRow(lines[0]);
  return lines.slice(1).map(line => {
    const vals = parseCSVRow(line);
    const obj  = {};
    headers.forEach((h, i) => { obj[h] = vals[i] ?? ''; });
    return obj;
  });
}

// Parse Dutch decimal notation "56,3" → 56.3
function num(v) {
  if (v === null || v === undefined || v === '') return 0;
  return parseFloat(String(v).replace(',', '.')) || 0;
}

// ─────────────────────────────────────────────────────────────
// PENDING / APPLY PATTERN
// ─────────────────────────────────────────────────────────────
function markPending() {
  if (!hasPending) {
    hasPending = true;
    const btn = document.getElementById('apply-btn');
    if (btn) btn.classList.add('has-pending');
  }
}

function applyChanges() {
  U = { ...pendingU };
  hasPending = false;
  const btn = document.getElementById('apply-btn');
  if (btn) btn.classList.remove('has-pending');
  updateStyleHints();
  recalculate();
}

function updateStyleHints() {
  const styleTexts = {
    Backpack: 'Budget accommodation & local transport',
    Standard: 'Mid-range hotels & transport',
    Comfort:  'Premium hotels & better transport',
    Luxury:   'High-end hotels & service (×1.45 on Comfort)',
  };
  const sh = document.getElementById('style-cost-hint');
  if (sh) sh.textContent = styleTexts[pendingU.travelStyle] || '';

  const seasonTexts = {
    High: 'Prioritises destinations in peak season',
    Mid:  'Prioritises destinations in mid season',
    Low:  'Prioritises destinations in low season',
    No:   'Season not considered in ranking',
  };
  const seH = document.getElementById('season-hint');
  if (seH) seH.textContent = seasonTexts[pendingU.seasonPref] || '';

  const monthName = ['', 'January', 'February', 'March', 'April', 'May', 'June',
                         'July', 'August', 'September', 'October', 'November', 'December'];
  const ph = document.getElementById('period-hint');
  if (ph) ph.textContent = `Departure in ${monthName[pendingU.startMonth] || '?'} — flight costs reflect seasonal pricing`;
}

// ─────────────────────────────────────────────────────────────
// MONTH WINDOW → FLIGHT MULTIPLIER
// ─────────────────────────────────────────────────────────────
function monthWindowMult(startM, endM) {
  const months = [];
  let m = startM;
  for (let i = 0; i < 12; i++) {
    months.push(m);
    if (m === endM) break;
    m = (m % 12) + 1;
  }
  const avg = months.reduce((s, mo) => s + MONTH_FLIGHT_MULT[mo], 0) / months.length;
  return 1 + avg;
}

// ─────────────────────────────────────────────────────────────
// DATA SYNC
// ─────────────────────────────────────────────────────────────
async function syncFromSheets() {
  setSyncStatus('syncing');
  const btn = document.getElementById('sync-btn');
  if (btn) btn.disabled = true;

  try {
    const [tripText, filterText, settingsText, countriesText, flightsText] = await Promise.all([
      fetch(csvUrl(GID.TRIP_ENGINE)).then(r => r.text()),
      fetch(csvUrl(GID.FILTER_ENGINE)).then(r => r.text()),
      fetch(csvUrl(GID.SETTINGS)).then(r => r.text()),
      fetch(csvUrl(GID.COUNTRIES)).then(r => r.text()),
      fetch(csvUrl(GID.FLIGHTS)).then(r => r.text()),
    ]);

    const trips = parseCSV(tripText).filter(t => t.trip_key && t.trip_key !== 'trip_key');
    const filterRows = parseCSV(filterText).filter(r => r.trip_id);
    const fMap = {};
    filterRows.forEach(r => { fMap[r.trip_id] = r; });
    const settingsRows = parseCSV(settingsText).filter(r => r.setting_key);
    const settings = {};
    settingsRows.forEach(r => { settings[r.setting_key] = r.setting_value; });

    const cData = {};
    parseCSV(countriesText).filter(r => r.country).forEach(r => { cData[r.country] = r; });

    const fData = {};
    parseCSV(flightsText).filter(r => r.route_key).forEach(r => {
      fData[r.route_key] = { low: num(r.low_season_cost), mid: num(r.mid_season_cost), high: num(r.high_season_cost) };
    });

    const payload = { trips, fMap, settings, cData, fData, synced: new Date().toISOString() };
    localStorage.setItem(CACHE_KEY, JSON.stringify(payload));
    localStorage.setItem(SYNC_KEY, payload.synced);

    applyCache(payload);
    setSyncStatus('ok', payload.synced);
  } catch (err) {
    console.error('Sync failed:', err);
    setSyncStatus('error');
  } finally {
    if (btn) btn.disabled = false;
  }
}

function loadFromCache() {
  const raw = localStorage.getItem(CACHE_KEY);
  if (!raw) return false;
  try {
    const payload = JSON.parse(raw);
    applyCache(payload);
    setSyncStatus('ok', payload.synced);
    return true;
  } catch {
    return false;
  }
}

function applyCache(payload) {
  rawTrips    = payload.trips;
  filterMap   = payload.fMap;
  countryData = payload.cData || {};
  flightData  = payload.fData || {};

  const s = payload.settings || {};
  if (s.Budget)                 U.budget      = parseInt(s.Budget)        || U.budget;
  if (s.Adventure)              U.adventure   = parseInt(s.Adventure)     || U.adventure;
  if (s.Food)                   U.food        = parseInt(s.Food)          || U.food;
  if (s.Nature)                 U.nature      = parseInt(s.Nature)        || U.nature;
  if (s.Beach)                  U.beach       = parseInt(s.Beach)         || U.beach;
  if (s.Nightlife)              U.nightlife   = parseInt(s.Nightlife)     || U.nightlife;
  if (s.Culture)                U.culture     = parseInt(s.Culture)       || U.culture;
  if (s.Preference_Weight)      U.prefWeight  = num(s.Preference_Weight);
  if (s.Budget_Pressure_Weight) U.budgetWeight = num(s.Budget_Pressure_Weight);
  if (s.Fatigue_Weight)         U.fatigueWeight = num(s.Fatigue_Weight);
  if (s.Wishlist_Weight)        U.wishWeight  = num(s.Wishlist_Weight);
  if (s.Priority_Weight)        U.regionWeight = num(s.Priority_Weight);
  if (s.Travel_style)           U.travelStyle = s.Travel_style;
  const seasonVal = s['Season_Preference_(Low/Mid/High/No)'] || s.Season_Preference;
  if (seasonVal)                U.seasonPref  = seasonVal;
  if (s.Start_Month) {
    const n = parseInt(s.Start_Month);
    U.startMonth = isNaN(n) ? (MONTH_NAMES[s.Start_Month] || 5) : n;
  }
  if (s.End_Month) {
    const n = parseInt(s.End_Month);
    U.endMonth = isNaN(n) ? (MONTH_NAMES[s.End_Month] || 4) : n;
  }

  refreshUI();
  recalculate();
}

function setSyncStatus(state, isoDate) {
  const el = document.getElementById('sync-status');
  if (!el) return;
  if (state === 'syncing') {
    el.textContent = '⟳ Syncing...';
    el.style.color = 'rgba(255,255,255,0.6)';
  } else if (state === 'ok') {
    const d = isoDate ? new Date(isoDate) : new Date();
    el.textContent = `Synced ${d.toLocaleDateString('nl-NL')} ${d.toLocaleTimeString('nl-NL', { hour: '2-digit', minute: '2-digit' })}`;
    el.style.color = 'rgba(255,255,255,0.5)';
  } else {
    el.textContent = '⚠ Sync failed';
    el.style.color = '#f87171';
  }
}

// ─────────────────────────────────────────────────────────────
// CALCULATION ENGINE
// ─────────────────────────────────────────────────────────────
function clamp(v, lo, hi) { return Math.max(lo, Math.min(hi, v)); }

// Returns 'low' | 'mid' | 'high' for a country in a given month
function getCountrySeason(countryName, month) {
  const cd = countryData[countryName];
  if (!cd) return 'mid';
  const abbr = MONTH_ABBR[month];
  if (!abbr) return 'mid';
  const inList = s => s && s.split(',').some(m => m.trim() === abbr);
  if (inList(cd.high_season)) return 'high';
  if (inList(cd.low_season))  return 'low';
  return 'mid';
}

// What % of the travel window has good conditions for this country (0–100)
// "Good" depends on seasonPref: High = only peak, Mid = peak+mid, Low = avoid peak
function countrySeasonScore(country, startM, endM, seasonPref) {
  if (seasonPref === 'No') return 50;
  const cd = countryData[country];
  if (!cd) return 50;

  const window = [];
  let m = startM;
  for (let i = 0; i < 12; i++) {
    window.push(m);
    if (m === endM) break;
    m = (m % 12) + 1;
  }

  const inList = (s, mo) => {
    if (!s) return false;
    const abbr = MONTH_ABBR[mo];
    return s.split(',').some(x => x.trim() === abbr);
  };

  const good = window.filter(mo => {
    const isHigh = inList(cd.high_season, mo);
    const isMid  = inList(cd.mid_season, mo);
    if (seasonPref === 'High') return isHigh;
    if (seasonPref === 'Mid')  return isHigh || isMid;
    if (seasonPref === 'Low')  return !isHigh;
    return true;
  });

  return (good.length / window.length) * 100;
}

// Cost of one flight leg based on U.startMonth and destination country's season
function flightLegCost(from, to) {
  const fd = flightData[`${from}-${to}`];
  if (!fd) return 0;
  // For X→NL use origin's season; for NL→X or X→Y use destination's season
  const destForSeason = to === 'NL' ? from : to;
  const season = getCountrySeason(destForSeason, U.startMonth);
  return fd[season] ?? fd.mid ?? 0;
}

function calcTrip(t) {
  const hasB = !!(t.country_b && t.country_b !== '');

  // Daily costs — use real per-country per-style values when available
  const styleCol = STYLE_COL[U.travelStyle] || 'daily_cost_mid';
  const luxMult  = U.travelStyle === 'Luxury' ? LUXURY_MULT : 1;
  const cdA = countryData[t.country_a];
  const cdB = hasB ? countryData[t.country_b] : null;
  const dailyCostA = cdA
    ? num(cdA[styleCol]) * luxMult
    : num(t.daily_cost_a) * (STYLE_MULT[U.travelStyle] || 1.35);
  const dailyCostB = cdB
    ? num(cdB[styleCol]) * luxMult
    : num(t.daily_cost_b) * (STYLE_MULT[U.travelStyle] || 1.35);

  // Flight costs — use per-route per-season values when available, else fall back
  let flight;
  if (Object.keys(flightData).length > 0) {
    const legNLtoA = flightLegCost('NL', t.country_a);
    const legAtoB  = hasB ? flightLegCost(t.country_a, t.country_b) : 0;
    const legBtoNL = flightLegCost(hasB ? t.country_b : t.country_a, 'NL');
    flight = legNLtoA + legAtoB + legBtoNL;
  } else {
    flight = num(t.total_flight_cost) * monthWindowMult(U.startMonth, U.endMonth);
  }

  const minA = num(t.min_days_a), maxA = num(t.max_days_a), idealA = num(t.ideal_days_a);
  let daysA, daysB;

  if (hasB) {
    const minB = num(t.min_days_b), maxB = num(t.max_days_b), idealB = num(t.ideal_days_b);
    const minTotal = minA + minB;
    if (U.days < minTotal) return { _t: t, feasible: false, reason: `Needs ≥${minTotal} days` };

    const totalIdeal = idealA + idealB;
    const ratioA     = totalIdeal > 0 ? idealA / totalIdeal : 0.5;
    daysA = clamp(Math.round(U.days * ratioA), minA, maxA);
    daysB = clamp(U.days - daysA, minB, maxB);
    if (daysA + daysB < U.days) {
      const extra = U.days - daysA - daysB;
      if (daysA < maxA) daysA = clamp(daysA + extra, minA, maxA);
      else              daysB = clamp(daysB + extra, minB, maxB);
    }
  } else {
    if (U.days < minA) return { _t: t, feasible: false, reason: `Needs ≥${minA} days` };
    daysA = clamp(U.days, minA, maxA);
    daysB = 0;
  }

  const cost = flight
    + daysA * dailyCostA
    + (hasB ? daysB * dailyCostB : 0);

  const costFit   = cost <= U.budget ? 'OK' : 'OVER';
  const budgetRaw = (U.budget - cost) / U.budget * 100;

  const prefRaw = (
    U.adventure * num(t.adventure_score) +
    U.food      * num(t.food_score)      +
    U.nature    * num(t.nature_score)    +
    U.beach     * num(t.beach_score)     +
    U.nightlife * num(t.nightlife_score) +
    U.culture   * num(t.culture_score)
  );

  return {
    _t: t,
    feasible: true,
    hasB,
    daysA, daysB,
    cost, costFit,
    rawBudget:  budgetRaw,
    rawPref:    prefRaw,
    rawFatigue: 100 - num(t.fatigue_penalty),
    rawSeason:  Object.keys(countryData).length > 0
      ? (hasB
          ? (countrySeasonScore(t.country_a, U.startMonth, U.endMonth, U.seasonPref) +
             countrySeasonScore(t.country_b, U.startMonth, U.endMonth, U.seasonPref)) / 2
          : countrySeasonScore(t.country_a, U.startMonth, U.endMonth, U.seasonPref))
      : num(t.total_season_score),
    rawWish:    num(t.total_wishlist_bonus),
  };
}

function pctRanks(arr) {
  const n      = arr.length;
  if (n <= 1)  return arr.map(() => 100);
  const sorted = [...arr].sort((a, b) => a - b);
  return arr.map(v => {
    let lo = 0, hi = n - 1;
    while (lo < hi) { const mid = (lo + hi) >> 1; if (sorted[mid] < v) lo = mid + 1; else hi = mid; }
    return (lo / (n - 1)) * 100;
  });
}

function calcAndRank() {
  if (rawTrips.length === 0) return [];

  const allowed = rawTrips.filter(t => {
    const fe  = filterMap[t.trip_key] || {};
    const hasB = !!(t.country_b && t.country_b !== '');
    if (U.avoidLong    && fe.is_intercontinental === 'TRUE') return false;
    if (hasB && U.maxCountries < 2)                          return false;
    if (!U.preferCombos && hasB)                             return false;
    return true;
  });

  const calced   = allowed.map(t => calcTrip(t));
  const feasible = calced.filter(c => c.feasible);
  if (feasible.length === 0) return [];

  const pctPref   = pctRanks(feasible.map(c => c.rawPref));
  const pctBudget = pctRanks(feasible.map(c => c.rawBudget));
  const pctFat    = pctRanks(feasible.map(c => c.rawFatigue));
  const pctSeason = pctRanks(feasible.map(c => c.rawSeason));
  const pctWish   = pctRanks(feasible.map(c => c.rawWish));

  const seasonW = SEASON_WEIGHT[U.seasonPref] ?? 1.0;

  const scored = feasible.map((c, i) => ({
    ...c,
    pctPref:   pctPref[i],
    pctBudget: pctBudget[i],
    finalScore: (
      U.prefWeight    * pctPref[i]   +
      U.budgetWeight  * pctBudget[i] +
      U.fatigueWeight * pctFat[i]    +
      U.wishWeight    * pctWish[i]   +
      seasonW         * pctSeason[i]
    ),
  }));

  scored.sort((a, b) => b.finalScore - a.finalScore);
  const n = scored.length;
  scored.forEach((c, i) => {
    c.rank    = i + 1;
    const pct = (n - i) / n * 100;
    c.tier    = pct >= 70 ? 'TOP TIER' : pct >= 40 ? 'GOOD' : 'MID';
    c.budgetScore = Math.max(0, Math.min(100, c.rawBudget));
  });

  return scored;
}

// ─────────────────────────────────────────────────────────────
// FILTERING
// ─────────────────────────────────────────────────────────────
function applyFilter(ranked) {
  const all = [...ranked];
  switch (currentFilter) {
    case 'bestmatch':
      return all.slice(0, 10);
    case 'bestforbudget':
      return all
        .map(c => ({ ...c, _budgetScore: c.rawPref * (c.cost / U.budget) }))
        .sort((a, b) => b._budgetScore - a._budgetScore)
        .slice(0, 10);
    case 'budget':
      return all.sort((a, b) => a.cost - b.cost);
    case 'adventure':
      return all.sort((a, b) => num(b._t.adventure_score) - num(a._t.adventure_score));
    case 'combo':
      return all.filter(c => c.hasB);
    case 'lowfatigue':
      return all.sort((a, b) => num(a._t.fatigue_penalty) - num(b._t.fatigue_penalty));
    default:
      return all;
  }
}

// ─────────────────────────────────────────────────────────────
// MAP
// ─────────────────────────────────────────────────────────────
const TIER_ORDER = { 'TOP TIER': 0, 'GOOD': 1, 'MID': 2 };

function initMap() {
  if (_leafletMap) return;
  _leafletMap = L.map('world-map', {
    zoomControl: true,
    scrollWheelZoom: false,
    attributionControl: false,
  }).setView([25, 30], 2);
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 10,
  }).addTo(_leafletMap);
  _markerGroup = L.layerGroup().addTo(_leafletMap);
}

function updateMap(ranked) {
  if (!_leafletMap || !_markerGroup) return;
  _markerGroup.clearLayers();

  // Keep best-tier entry per country
  const countryBest = {};
  ranked.forEach(c => {
    [c._t.country_a, c._t.country_b].filter(Boolean).forEach(co => {
      if (!countryBest[co] || TIER_ORDER[c.tier] < TIER_ORDER[countryBest[co].tier]) {
        countryBest[co] = c;
      }
    });
  });

  Object.entries(countryBest).forEach(([country, c]) => {
    const coords = COUNTRY_COORDS[country];
    if (!coords) return;
    const color = c.tier === 'TOP TIER' ? '#f59e0b' : c.tier === 'GOOD' ? '#22c55e' : '#3b82f6';
    L.circleMarker(coords, {
      radius: 9,
      fillColor: color,
      color: '#fff',
      weight: 2,
      opacity: 1,
      fillOpacity: 0.85,
    }).bindTooltip(`${flag(country)} ${country} — #${c.rank}`, { permanent: false }).addTo(_markerGroup);
  });
}

// ─────────────────────────────────────────────────────────────
// RENDERING
// ─────────────────────────────────────────────────────────────
const TIER_CFG = {
  'TOP TIER': { pill: 'pill-top',  card: 'tier-top-card',  label: '🏆 Top Tier' },
  'GOOD':     { pill: 'pill-good', card: 'tier-good-card', label: '⭐ Good'      },
  'MID':      { pill: 'pill-mid',  card: 'tier-mid-card',  label: '👍 Mid'       },
};

function flag(country) { return FLAGS[country] || '🌍'; }

function topStyles(c) {
  return STYLES
    .map(s => ({ ...s, val: num(c._t[s.key]) }))
    .sort((a, b) => b.val - a.val)
    .slice(0, 2);
}

function renderCard(c) {
  const t    = c._t;
  const tier = TIER_CFG[c.tier] || TIER_CFG['MID'];

  const countries = [t.country_a, t.country_b].filter(Boolean);
  const countriesHtml = countries
    .map((co, i) => `${i > 0 ? '<span class="country-sep">+</span>' : ''}<span class="country-name">${flag(co)} ${co}</span>`)
    .join('');

  let daysHtml = '';
  if (c.hasB) {
    daysHtml = `<div class="card-days"><span class="days-highlight">${c.daysA}d</span> ${t.country_a} + <span class="days-highlight">${c.daysB}d</span> ${t.country_b}</div>`;
  } else {
    daysHtml = `<div class="card-days"><span class="days-highlight">${c.daysA} days</span> in ${t.country_a}</div>`;
  }

  const barW     = Math.max(3, c.budgetScore);
  const barClass = c.costFit === 'OVER' ? 'fill-over'
                 : c.budgetScore >= 70   ? 'fill-great'
                 : c.budgetScore >= 40   ? 'fill-good'
                 :                         'fill-ok';
  const roomLeft = U.budget - c.cost;
  const barLabel = c.costFit === 'OK'
    ? `€${Math.round(roomLeft).toLocaleString('nl-NL')} under budget`
    : `€${Math.abs(Math.round(roomLeft)).toLocaleString('nl-NL')} over budget`;

  const stylesHtml = topStyles(c)
    .map(s => `<span class="style-tag">${s.icon} ${s.label} <span class="style-tag-score">${s.val}</span></span>`)
    .join('');

  const seasonVal = c.rawSeason;
  const seasonCls = seasonVal >= 50 ? 'season-peak' : seasonVal >= 20 ? 'season-ok' : 'season-off';
  const seasonLbl = seasonVal >= 50 ? '☀️ Peak season' : seasonVal >= 20 ? '🌤 Good season' : '🌧 Off season';

  const fatVal = num(t.fatigue_penalty);
  const fatCls = fatVal <= 10 ? 'fat-low' : fatVal <= 14 ? 'fat-mid' : 'fat-high';
  const fatLbl = fatVal <= 10 ? '😌 Easy trip' : fatVal <= 14 ? '🎒 Moderate' : '💪 Demanding';

  return `
    <div class="trip-card ${tier.card}">
      <div class="card-header">
        <span class="rank-num">#${c.rank}</span>
        <span class="tier-pill ${tier.pill}">${tier.label}</span>
        ${c.hasB ? '<span class="combo-pill">✈ Combo</span>' : ''}
      </div>
      <div class="card-countries">${countriesHtml}</div>
      <div class="card-cost">
        <span class="cost-amount">€${Math.round(c.cost).toLocaleString('nl-NL')}</span>
        <span class="cost-badge ${c.costFit === 'OK' ? 'cost-ok' : 'cost-over'}">
          ${c.costFit === 'OK' ? '✓ Within budget' : '✗ Over budget'}
        </span>
      </div>
      ${daysHtml}
      <div class="budget-bar-wrap">
        <div class="budget-bar">
          <div class="budget-fill ${barClass}" style="width:${barW}%"></div>
        </div>
        <span class="budget-label">${barLabel}</span>
      </div>
      <div class="card-styles">${stylesHtml}</div>
      <div class="card-indicators">
        <span class="indicator ${seasonCls}">${seasonLbl}</span>
        <span class="indicator ${fatCls}">${fatLbl}</span>
      </div>
    </div>
  `;
}

function recalculate() {
  const grid    = document.getElementById('trip-grid');
  const countEl = document.getElementById('result-count');
  if (!grid) return;
  if (rawTrips.length === 0) return;

  const ranked   = calcAndRank();
  _lastRanked    = ranked;
  const filtered = applyFilter(ranked);

  countEl.textContent = `${filtered.length} trip${filtered.length !== 1 ? 's' : ''}`;

  if (filtered.length === 0) {
    grid.innerHTML = '<div class="empty-msg">No trips match your current settings. Try relaxing some constraints.</div>';
  } else {
    grid.innerHTML = filtered.map(c => renderCard(c)).join('');
  }

  updateMap(ranked);
}

// ─────────────────────────────────────────────────────────────
// UI INIT & HELPERS
// ─────────────────────────────────────────────────────────────
function buildSliders() {
  const styleContainer = document.getElementById('style-sliders');
  styleContainer.innerHTML = STYLES.map(s => `
    <div class="style-row">
      <span class="style-label">${s.icon} ${s.label}</span>
      <input type="range" class="style-slider" id="sl-${s.uKey}" min="0" max="10" step="1" value="${pendingU[s.uKey]}">
      <span class="style-val" id="sv-${s.uKey}">${pendingU[s.uKey]}</span>
    </div>
  `).join('');

  STYLES.forEach(s => {
    const slider = document.getElementById(`sl-${s.uKey}`);
    const valEl  = document.getElementById(`sv-${s.uKey}`);
    slider.addEventListener('input', () => {
      pendingU[s.uKey] = +slider.value;
      valEl.textContent = slider.value;
      markPending();
    });
  });

  const rankContainer = document.getElementById('rank-sliders');
  rankContainer.innerHTML = RANK_WEIGHTS.map(w => `
    <div class="style-row">
      <span class="style-label">${w.label}</span>
      <input type="range" class="style-slider" id="rw-${w.uKey}" min="${w.min}" max="${w.max}" step="${w.step}" value="${pendingU[w.uKey]}">
      <span class="style-val" id="rv-${w.uKey}">${pendingU[w.uKey]}</span>
    </div>
  `).join('');

  RANK_WEIGHTS.forEach(w => {
    const slider = document.getElementById(`rw-${w.uKey}`);
    const valEl  = document.getElementById(`rv-${w.uKey}`);
    slider.addEventListener('input', () => {
      pendingU[w.uKey] = +slider.value;
      valEl.textContent = slider.value;
      markPending();
    });
  });
}

// Push U values back into all UI elements (called after cache load)
function refreshUI() {
  pendingU = { ...U };
  hasPending = false;
  const applyBtn = document.getElementById('apply-btn');
  if (applyBtn) applyBtn.classList.remove('has-pending');

  syncBudget(U.budget);
  syncDays(U.days);

  const tsEl = document.getElementById('travel-style');
  if (tsEl) tsEl.value = U.travelStyle;
  const smEl = document.getElementById('start-month');
  if (smEl) smEl.value = U.startMonth;
  const emEl = document.getElementById('end-month');
  if (emEl) emEl.value = U.endMonth;
  const spEl = document.getElementById('season-pref');
  if (spEl) spEl.value = U.seasonPref;

  document.getElementById('avoid-long').checked    = U.avoidLong;
  document.getElementById('prefer-combos').checked = U.preferCombos;
  document.getElementById('max-1').classList.toggle('active', U.maxCountries === 1);
  document.getElementById('max-2').classList.toggle('active', U.maxCountries === 2);

  STYLES.forEach(s => {
    const slider = document.getElementById(`sl-${s.uKey}`);
    const valEl  = document.getElementById(`sv-${s.uKey}`);
    if (slider) { slider.value = U[s.uKey]; if (valEl) valEl.textContent = U[s.uKey]; }
  });

  RANK_WEIGHTS.forEach(w => {
    const slider = document.getElementById(`rw-${w.uKey}`);
    const valEl  = document.getElementById(`rv-${w.uKey}`);
    if (slider) { slider.value = U[w.uKey]; if (valEl) valEl.textContent = U[w.uKey]; }
  });

  updateStyleHints();
}

function syncBudget(val) {
  const v = Math.max(500, Math.min(15000, +val || 6000));
  pendingU.budget = v;
  document.getElementById('budget-slider').value = v;
  document.getElementById('budget-number').value = v;
  document.getElementById('budget-display').textContent = `€${v.toLocaleString('nl-NL')}`;
}

function syncDays(val) {
  const v = Math.max(5, Math.min(30, +val || 14));
  pendingU.days = v;
  document.getElementById('days-slider').value = v;
  document.getElementById('days-number').value = v;
  document.getElementById('days-display').textContent = `${v} day${v !== 1 ? 's' : ''}`;
}

// ─────────────────────────────────────────────────────────────
// BOOT
// ─────────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  buildSliders();
  initMap();
  updateStyleHints();

  // Budget
  document.getElementById('budget-slider').addEventListener('input', e => { syncBudget(e.target.value); markPending(); });
  document.getElementById('budget-number').addEventListener('input', e => { syncBudget(e.target.value); markPending(); });

  // Days
  document.getElementById('days-slider').addEventListener('input', e => { syncDays(e.target.value); markPending(); });
  document.getElementById('days-number').addEventListener('input', e => { syncDays(e.target.value); markPending(); });

  // Travel style
  document.getElementById('travel-style').addEventListener('change', e => {
    pendingU.travelStyle = e.target.value;
    markPending();
    updateStyleHints();
  });

  // Travel period
  document.getElementById('start-month').addEventListener('change', e => {
    pendingU.startMonth = +e.target.value;
    markPending();
    updateStyleHints();
  });
  document.getElementById('end-month').addEventListener('change', e => {
    pendingU.endMonth = +e.target.value;
    markPending();
    updateStyleHints();
  });

  // Season preference
  document.getElementById('season-pref').addEventListener('change', e => {
    pendingU.seasonPref = e.target.value;
    markPending();
    updateStyleHints();
  });

  // Max countries
  document.getElementById('max-1').addEventListener('click', () => {
    pendingU.maxCountries = 1;
    document.getElementById('max-1').classList.add('active');
    document.getElementById('max-2').classList.remove('active');
    markPending();
  });
  document.getElementById('max-2').addEventListener('click', () => {
    pendingU.maxCountries = 2;
    document.getElementById('max-2').classList.add('active');
    document.getElementById('max-1').classList.remove('active');
    markPending();
  });

  // Toggles
  document.getElementById('avoid-long').addEventListener('change', e => { pendingU.avoidLong    = e.target.checked; markPending(); });
  document.getElementById('prefer-combos').addEventListener('change', e => { pendingU.preferCombos = e.target.checked; markPending(); });

  // Filter tabs
  document.querySelectorAll('.tab').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.tab').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      currentFilter = btn.dataset.filter;
      recalculate();
    });
  });

  // Apply button
  document.getElementById('apply-btn').addEventListener('click', applyChanges);

  // Sync buttons
  const doSync = () => syncFromSheets();
  document.getElementById('sync-btn').addEventListener('click', doSync);
  const btn2 = document.getElementById('sync-btn-2');
  if (btn2) btn2.addEventListener('click', doSync);

  // Map toggle
  document.getElementById('map-toggle').addEventListener('click', () => {
    const wrapper    = document.getElementById('map-wrapper');
    const toggleBtn  = document.getElementById('map-toggle');
    const isHidden   = wrapper.style.display === 'none';
    wrapper.style.display = isHidden ? '' : 'none';
    toggleBtn.textContent = isHidden ? '🗺 Hide map' : '🗺 Show map';
    if (isHidden && _leafletMap) _leafletMap.invalidateSize();
  });

  // Load from cache on start
  const hadCache = loadFromCache();
  if (!hadCache) {
    document.getElementById('sync-status').textContent = 'Click Sync to load data';
  }
});

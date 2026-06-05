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
const CACHE_KEY = 'youridealtravel_v2_data';
const SYNC_KEY  = 'youridealtravel_v1_synced';

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
  { key: 'adventure_score', label: 'Adventure', icon: '🧗', uKey: 'adventure', hint: 'Hiking, climbing & outdoor activities' },
  { key: 'food_score',      label: 'Food',      icon: '🍜', uKey: 'food',      hint: 'Local cuisine, street food & dining'   },
  { key: 'nature_score',    label: 'Nature',    icon: '🏔', uKey: 'nature',    hint: 'Landscapes, wildlife & national parks' },
  { key: 'beach_score',     label: 'Beach',     icon: '🏖', uKey: 'beach',     hint: 'Coastline, swimming & water sports'    },
  { key: 'nightlife_score', label: 'Nightlife', icon: '🌃', uKey: 'nightlife', hint: 'Bars, clubs & evening entertainment'   },
  { key: 'culture_score',   label: 'Culture',   icon: '🏛', uKey: 'culture',   hint: 'History, museums & architecture'       },
];

const RANK_WEIGHTS = [
  { uKey: 'prefWeight',    label: 'Travel style', default: 8,  min: 0, max: 10, step: 1 },
  { uKey: 'budgetWeight',  label: 'Budget fit',   default: 5,  min: 0, max: 10, step: 1 },
  { uKey: 'fatigueWeight', label: 'Low fatigue',  default: 2,  min: 0, max: 10, step: 1 },
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
let countryData   = {};  // { 'Japan': { daily_cost_backpack, daily_cost_mid, daily_cost_premium, low_season, ... } }
let flightData    = {};  // { 'NL-Japan': { low, mid, high, region }, ... }
let currentFilter = 'bestmatch';
let _lastRanked   = [];
let _leafletMap   = null;
let _markerGroup  = null;
let hasPending    = false;
let pinnedKeys    = new Set();

// Applied settings — used by the calculation engine
let U = {
  budget: 3000,
  days: 21,
  travelStyle: 'Backpack',
  startMonth: 10,
  endMonth: 11,
  seasonPref: 'Mid',
  maxCountries: 2,
  comboOnly: false,
  avoidLong: false,
  travelers: 1,
  sharedAccom: true,
  adventure: 7, food: 10, nature: 8, beach: 6, nightlife: 3, culture: 9,
  prefWeight: 8, budgetWeight: 5, fatigueWeight: 2,
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
    Luxury:   'Most comfort-focused — top hotels, no compromises',
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
    const [countriesText, flightsText] = await Promise.all([
      fetch(csvUrl(GID.COUNTRIES)).then(r => r.text()),
      fetch(csvUrl(GID.FLIGHTS)).then(r => r.text()),
    ]);

    const cData = {};
    parseCSV(countriesText).filter(r => r.country).forEach(r => { cData[r.country] = r; });

    const fData = {};
    parseCSV(flightsText).filter(r => r.route_key).forEach(r => {
      fData[r.route_key] = {
        low: num(r.low_season_cost), mid: num(r.mid_season_cost), high: num(r.high_season_cost),
        region: r.region_cluster || '',
      };
    });

    const payload = { cData, fData, synced: new Date().toISOString() };
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
    if (!payload.cData) return false; // oude cache-structuur, opnieuw syncen
    applyCache(payload);
    setSyncStatus('ok', payload.synced);
    return true;
  } catch {
    return false;
  }
}

// Bouwt rawTrips vanuit COUNTRIES + FLIGHTS — geen aparte TRIP_ENGINE nodig.
// Single trips: elk land in COUNTRIES. Combo trips: elk A→B paar waarbij
// NL-A, A-B en B-NL allemaal bestaan in FLIGHTS.
function buildTripsFromData() {
  const countries = Object.keys(countryData);
  const trips = [];

  countries.forEach(a => {
    trips.push({ trip_key: a, country_a: a, country_b: '' });
  });

  countries.forEach(a => {
    countries.forEach(b => {
      if (a === b) return;
      if (flightData[`NL-${a}`] && flightData[`${a}-${b}`] && flightData[`${b}-NL`]) {
        trips.push({ trip_key: `${a}+${b}`, country_a: a, country_b: b });
      }
    });
  });

  return trips;
}

function applyCache(payload) {
  countryData = payload.cData || {};
  flightData  = payload.fData || {};
  rawTrips    = buildTripsFromData();
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
    const daysSince = (Date.now() - d.getTime()) / (1000 * 60 * 60 * 24);
    if (daysSince > 7) {
      el.textContent = `⚠ Data is ${Math.floor(daysSince)} days old — sync recommended`;
      el.style.color = '#fbbf24';
    } else {
      el.textContent = `Synced ${d.toLocaleDateString('nl-NL')} ${d.toLocaleTimeString('nl-NL', { hour: '2-digit', minute: '2-digit' })}`;
      el.style.color = 'rgba(255,255,255,0.5)';
    }
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
  const cdA = countryData[t.country_a];
  const cdB = hasB ? countryData[t.country_b] : null;
  if (!cdA || (hasB && !cdB)) return { _t: t, feasible: false, reason: 'No country data' };

  const styleCol = STYLE_COL[U.travelStyle] || 'daily_cost_mid';
  const luxMult  = U.travelStyle === 'Luxury' ? LUXURY_MULT : 1;
  const dailyCostA = num(cdA[styleCol]) * luxMult;
  const dailyCostB = hasB ? num(cdB[styleCol]) * luxMult : 0;

  const travelersDaily = U.sharedAccom ? 0.55 + 0.45 * U.travelers : U.travelers;

  const legNLtoA = flightLegCost('NL', t.country_a);
  const legAtoB  = hasB ? flightLegCost(t.country_a, t.country_b) : 0;
  const legBtoNL = flightLegCost(hasB ? t.country_b : t.country_a, 'NL');
  const flight   = (legNLtoA + legAtoB + legBtoNL) * U.travelers;

  const minA = num(cdA.min_days), idealA = num(cdA.ideal_days), maxA = num(cdA.max_days);
  let daysA, daysB;

  if (hasB) {
    const minB = num(cdB.min_days), idealB = num(cdB.ideal_days);
    const minTotal = minA + minB;
    if (U.days < minTotal) return { _t: t, feasible: false, reason: `Needs ≥${minTotal} days` };
    const totalIdeal = idealA + idealB;
    const ratioA     = totalIdeal > 0 ? idealA / totalIdeal : 0.5;
    daysA = Math.max(minA, Math.round(U.days * ratioA));
    daysB = U.days - daysA;
    if (daysB < minB) { daysB = minB; daysA = Math.max(minA, U.days - daysB); }
  } else {
    if (U.days < minA) return { _t: t, feasible: false, reason: `Needs ≥${minA} days` };
    daysA = U.days;
    daysB = 0;
  }

  const maxB = hasB ? num(cdB.max_days) : 0;
  const overstayA = maxA > 0 ? Math.max(0, daysA - maxA) / maxA : 0;
  const overstayB = hasB && maxB > 0 ? Math.max(0, daysB - maxB) / maxB : 0;
  const rawOverstay = Math.max(overstayA, overstayB);

  const cost    = flight + daysA * dailyCostA * travelersDaily + (hasB ? daysB * dailyCostB * travelersDaily : 0);
  const costFit = cost <= U.budget ? 'OK' : 'OVER';

  // Day-weighted scores and fatigue from COUNTRIES
  const totalDays = daysA + daysB;
  const wA = totalDays > 0 ? daysA / totalDays : 1;
  const wB = hasB && totalDays > 0 ? daysB / totalDays : 0;

  const catScores = {
    adventure: wA * num(cdA.adventure) + wB * num(cdB?.adventure || 0),
    food:      wA * num(cdA.food)      + wB * num(cdB?.food      || 0),
    nature:    wA * num(cdA.nature)    + wB * num(cdB?.nature    || 0),
    beach:     wA * num(cdA.beach)     + wB * num(cdB?.beach     || 0),
    nightlife: wA * num(cdA.nightlife) + wB * num(cdB?.nightlife || 0),
    culture:   wA * num(cdA.culture)   + wB * num(cdB?.culture   || 0),
  };

  const fatigueRaw = wA * num(cdA.fatigue) + wB * num(cdB?.fatigue || 0);

  const prefRaw = (
    U.adventure * catScores.adventure + U.food      * catScores.food  +
    U.nature    * catScores.nature    + U.beach     * catScores.beach  +
    U.nightlife * catScores.nightlife + U.culture   * catScores.culture
  );

  return {
    _t: t, feasible: true, hasB, daysA, daysB, cost, costFit, catScores, fatigueRaw,
    rawBudget:  (U.budget - cost) / U.budget * 100,
    rawPref:    prefRaw,
    rawFatigue: 100 - fatigueRaw * 10,
    rawSeason:  hasB
      ? (countrySeasonScore(t.country_a, U.startMonth, U.endMonth, U.seasonPref) +
         countrySeasonScore(t.country_b, U.startMonth, U.endMonth, U.seasonPref)) / 2
      : countrySeasonScore(t.country_a, U.startMonth, U.endMonth, U.seasonPref),
    rawOverstay,
  };
}

// Calculates a trip using ideal_days per country instead of U.days
function calcTripIdeal(t) {
  const hasB = !!(t.country_b && t.country_b !== '');
  const cdA = countryData[t.country_a];
  const cdB = hasB ? countryData[t.country_b] : null;
  if (!cdA || (hasB && !cdB)) return { _t: t, feasible: false, reason: 'No country data' };

  const styleCol = STYLE_COL[U.travelStyle] || 'daily_cost_mid';
  const luxMult  = U.travelStyle === 'Luxury' ? LUXURY_MULT : 1;
  const dailyCostA = num(cdA[styleCol]) * luxMult;
  const dailyCostB = hasB ? num(cdB[styleCol]) * luxMult : 0;
  const travelersDaily = U.sharedAccom ? 0.55 + 0.45 * U.travelers : U.travelers;

  const flight = (flightLegCost('NL', t.country_a)
    + (hasB ? flightLegCost(t.country_a, t.country_b) : 0)
    + flightLegCost(hasB ? t.country_b : t.country_a, 'NL')) * U.travelers;

  const daysA = Math.max(num(cdA.min_days), num(cdA.ideal_days));
  const daysB = hasB ? Math.max(num(cdB.min_days), num(cdB.ideal_days)) : 0;

  const cost    = flight + daysA * dailyCostA * travelersDaily + (hasB ? daysB * dailyCostB * travelersDaily : 0);
  const costFit = cost <= U.budget ? 'OK' : 'OVER';

  const totalDays = daysA + daysB;
  const wA = totalDays > 0 ? daysA / totalDays : 1;
  const wB = hasB && totalDays > 0 ? daysB / totalDays : 0;

  const catScores = {
    adventure: wA * num(cdA.adventure) + wB * num(cdB?.adventure || 0),
    food:      wA * num(cdA.food)      + wB * num(cdB?.food      || 0),
    nature:    wA * num(cdA.nature)    + wB * num(cdB?.nature    || 0),
    beach:     wA * num(cdA.beach)     + wB * num(cdB?.beach     || 0),
    nightlife: wA * num(cdA.nightlife) + wB * num(cdB?.nightlife || 0),
    culture:   wA * num(cdA.culture)   + wB * num(cdB?.culture   || 0),
  };

  const fatigueRaw = wA * num(cdA.fatigue) + wB * num(cdB?.fatigue || 0);
  const prefRaw = (
    U.adventure * catScores.adventure + U.food      * catScores.food  +
    U.nature    * catScores.nature    + U.beach     * catScores.beach  +
    U.nightlife * catScores.nightlife + U.culture   * catScores.culture
  );

  return {
    _t: t, feasible: true, hasB, daysA, daysB, cost, costFit, catScores, fatigueRaw,
    rawBudget: (U.budget - cost) / U.budget * 100, rawPref: prefRaw,
    rawFatigue: 100 - fatigueRaw * 10,
    rawSeason: hasB
      ? (countrySeasonScore(t.country_a, U.startMonth, U.endMonth, U.seasonPref) +
         countrySeasonScore(t.country_b, U.startMonth, U.endMonth, U.seasonPref)) / 2
      : countrySeasonScore(t.country_a, U.startMonth, U.endMonth, U.seasonPref),
  };
}

// Vaste 0-100 budgetscore (geen percentiel):
// 50-100 = binnen budget (meer ruimte = hoger)
// 0-50   = boven budget, zachte kwadratische penalty
// Reageert volledig op budgetWeight slider — weight=0 = budget telt niet
function calcBudgetScore(cost, budget) {
  if (cost <= budget) {
    return 50 + (budget - cost) / budget * 50;
  }
  const overshoot = (cost - budget) / budget;
  return Math.max(0, 50 * Math.pow(1 - overshoot, 2));
}

function rankCalced(calced) {
  if (calced.length === 0) return [];

  // Per-category percentile ranks — each style dimension ranked independently
  // so that weight changes have real impact on who rises to the top
  const pctAdventure = pctRanks(calced.map(c => c.catScores.adventure));
  const pctFood      = pctRanks(calced.map(c => c.catScores.food));
  const pctNature    = pctRanks(calced.map(c => c.catScores.nature));
  const pctBeach     = pctRanks(calced.map(c => c.catScores.beach));
  const pctNightlife = pctRanks(calced.map(c => c.catScores.nightlife));
  const pctCulture   = pctRanks(calced.map(c => c.catScores.culture));

  const totalStyleWeight = U.adventure + U.food + U.nature + U.beach + U.nightlife + U.culture;

  const pctFat    = pctRanks(calced.map(c => c.rawFatigue));
  const pctSeason = pctRanks(calced.map(c => c.rawSeason));
  const seasonW   = SEASON_WEIGHT[U.seasonPref] ?? 1.0;
  const scored = calced.map((c, i) => {
    // Weighted average of per-category percentile scores → 0-100
    const prefScore = totalStyleWeight > 0
      ? (U.adventure * pctAdventure[i] +
         U.food      * pctFood[i]      +
         U.nature    * pctNature[i]    +
         U.beach     * pctBeach[i]     +
         U.nightlife * pctNightlife[i] +
         U.culture   * pctCulture[i])  / totalStyleWeight
      : 50;
    const budgetScore = calcBudgetScore(c.cost, U.budget);
    const base = U.prefWeight  * prefScore    +
                 U.budgetWeight * budgetScore  +
                 U.fatigueWeight * pctFat[i]  +
                 seasonW        * pctSeason[i];
    const overstayFactor = 1 / (1 + (c.rawOverstay || 0));
    const comboFactor    = c.hasB ? 1.08 : 1.0;
    const finalScore     = base * overstayFactor * comboFactor;
    return { ...c, pctPref: prefScore, budgetScore, finalScore };
  });
  scored.sort((a, b) => b.finalScore - a.finalScore);
  const n = scored.length;
  scored.forEach((c, i) => {
    c.rank = i + 1;
    const pct = (n - i) / n * 100;
    c.tier = pct >= 75 ? 'TOP TIER' : pct >= 50 ? 'GOOD' : pct >= 25 ? 'MID' : 'LOW';
    c.budgetScore = Math.max(0, Math.min(100, c.rawBudget));
  });
  return scored;
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
    const hasB = !!(t.country_b && t.country_b !== '');
    if (U.avoidLong          && (flightData[`NL-${t.country_a}`]?.region || '') === 'Intercontinental') return false;
    if (U.maxCountries === 1 && hasB)  return false;
    if (U.comboOnly          && !hasB) return false;
    return true;
  });

  const feasible = allowed.map(t => calcTrip(t)).filter(c => c.feasible);
  return rankCalced(feasible);
}

// ─────────────────────────────────────────────────────────────
// FILTERING
// ─────────────────────────────────────────────────────────────
function applyFilter(ranked) {
  // Ideal trip filter has its own pipeline — doesn't use the pre-ranked list
  if (currentFilter === 'idealtrip') {
    if (rawTrips.length === 0) return [];
    const allowed = rawTrips.filter(t => {
      const fe  = filterMap[t.trip_key] || {};
      const hasB = !!(t.country_b && t.country_b !== '');
      if (U.avoidLong          && fe.is_intercontinental === 'TRUE') return false;
      if (U.maxCountries === 1 && hasB)  return false;
      if (U.comboOnly          && !hasB) return false;
      return true;
    });
    return rankCalced(allowed.map(t => calcTripIdeal(t)));
  }

  const all = [...ranked];
  switch (currentFilter) {
    case 'bestmatch':
      return all;
    case 'bestforbudget':
      return all
        .map(c => ({ ...c, _budgetScore: c.rawPref * (c.cost / U.budget) }))
        .sort((a, b) => b._budgetScore - a._budgetScore);
    case 'budget':
      return all.sort((a, b) => a.cost - b.cost);
    case 'adventure':
      return all.sort((a, b) => b.catScores.adventure - a.catScores.adventure);
    case 'lowfatigue':
      return all.sort((a, b) => num(a._t.fatigue_penalty) - num(b._t.fatigue_penalty));
    case 'inseason':
      return all.sort((a, b) => b.rawSeason - a.rawSeason);
    case 'foodculture':
      return all.sort((a, b) =>
        (b.catScores.food + b.catScores.culture) -
        (a.catScores.food + a.catScores.culture)
      );
    default:
      return all;
  }
}

// ─────────────────────────────────────────────────────────────
// MAP
// ─────────────────────────────────────────────────────────────
const TIER_ORDER = { 'TOP TIER': 0, 'GOOD': 1, 'MID': 2, 'LOW': 3 };

function initMap() {
  if (_leafletMap) return;
  _leafletMap = L.map('world-map', {
    zoomControl: true,
    scrollWheelZoom: false,
    attributionControl: false,
  });
  _leafletMap.fitBounds([[-58, -170], [72, 170]]);
  _leafletMap.zoomIn();
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
    const color = c.tier === 'TOP TIER' ? '#22c55e' : c.tier === 'GOOD' ? '#eab308' : c.tier === 'MID' ? '#f97316' : '#ef4444';
    const marker = L.circleMarker(coords, {
      radius: 9,
      fillColor: color,
      color: '#fff',
      weight: 2,
      opacity: 1,
      fillOpacity: 0.85,
    });
    marker.bindTooltip(`${flag(country)} ${country} — #${c.rank}`, { permanent: false });
    marker.on('click', () => scrollToCard(c._t.trip_key));
    marker.addTo(_markerGroup);
  });
}

// ─────────────────────────────────────────────────────────────
// RENDERING
// ─────────────────────────────────────────────────────────────
const TIER_CFG = {
  'TOP TIER': { pill: 'pill-top',  card: 'tier-top-card',  label: '✦ Top Tier' },
  'GOOD':     { pill: 'pill-good', card: 'tier-good-card', label: '● Good'      },
  'MID':      { pill: 'pill-mid',  card: 'tier-mid-card',  label: '● Mid'       },
  'LOW':      { pill: 'pill-low',  card: 'tier-low-card',  label: '● Low'       },
};

function flag(country) { return FLAGS[country] || '🌍'; }

function topStyles(c) {
  return STYLES
    .map(s => ({ ...s, val: c.catScores[s.uKey] }))
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
    .map(s => `<span class="style-tag">${s.icon} ${s.label} <span class="style-tag-score">${Math.round(s.val * 10) / 10}</span></span>`)
    .join('');

  const seasonVal = c.rawSeason;
  const seasonCls = seasonVal >= 50 ? 'season-peak' : seasonVal >= 20 ? 'season-ok' : 'season-off';
  const seasonLbl = seasonVal >= 50 ? '☀️ Peak season' : seasonVal >= 20 ? '🌤 Good season' : '🌧 Off season';

  const fatVal = c.fatigueRaw;
  const fatCls = fatVal <= 4 ? 'fat-low' : fatVal <= 6 ? 'fat-mid' : 'fat-high';
  const fatLbl = fatVal <= 4 ? '😌 Easy trip' : fatVal <= 6 ? '🎒 Moderate' : '💪 Demanding';

  const isPinned = pinnedKeys.has(t.trip_key);

  return `
    <div class="trip-card ${tier.card}" data-trip-key="${t.trip_key}">
      <div class="card-header">
        <span class="rank-num">#${c.rank}</span>
        <span class="tier-pill ${tier.pill}">${tier.label}</span>
        <div class="card-header-right">
          ${c.hasB ? '<span class="combo-pill">✈ Combo</span>' : ''}
          <button class="pin-btn${isPinned ? ' pinned' : ''}" data-key="${t.trip_key}" title="${isPinned ? 'Unpin' : 'Compare'}">${isPinned ? '✓' : '+'}</button>
        </div>
      </div>
      <div class="card-countries">${countriesHtml}</div>
      <div class="card-cost">
        ${U.travelers > 1
          ? `<span class="cost-amount">€${Math.round(c.cost / U.travelers).toLocaleString('nl-NL')}</span>
             <span class="cost-pp-label-inline">p.p.</span>`
          : `<span class="cost-amount">€${Math.round(c.cost).toLocaleString('nl-NL')}</span>`
        }
        <span class="cost-badge ${c.costFit === 'OK' ? 'cost-ok' : 'cost-over'}">
          ${c.costFit === 'OK' ? '✓ Within budget' : '✗ Over budget'}
        </span>
      </div>
      ${U.travelers > 1 ? `<div class="cost-pp">€${Math.round(c.cost).toLocaleString('nl-NL')} <span class="cost-pp-label">total</span></div>` : ''}
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
  renderCompare();
}

// ─────────────────────────────────────────────────────────────
// SCROLL / PIN / COMPARE
// ─────────────────────────────────────────────────────────────
function scrollToCard(tripKey) {
  const card = document.querySelector(`[data-trip-key="${tripKey}"]`);
  if (!card) return;
  card.scrollIntoView({ behavior: 'smooth', block: 'center' });
  card.classList.add('card-highlight');
  setTimeout(() => card.classList.remove('card-highlight'), 1800);
}

function togglePin(tripKey) {
  if (pinnedKeys.has(tripKey)) {
    pinnedKeys.delete(tripKey);
  } else {
    if (pinnedKeys.size >= 3) return;
    pinnedKeys.add(tripKey);
  }
  document.querySelectorAll('.pin-btn').forEach(btn => {
    const pinned = pinnedKeys.has(btn.dataset.key);
    btn.classList.toggle('pinned', pinned);
    btn.textContent = pinned ? '✓' : '+';
    btn.title = pinned ? 'Unpin' : 'Compare';
  });
  renderCompare();
}

function renderCompare() {
  const panel = document.getElementById('compare-panel');
  const cols  = document.getElementById('compare-cols');
  if (!panel || !cols) return;

  if (pinnedKeys.size === 0) {
    panel.classList.add('hidden');
    return;
  }
  panel.classList.remove('hidden');

  const trips = [...pinnedKeys]
    .map(key => _lastRanked.find(c => c._t.trip_key === key))
    .filter(Boolean);

  cols.innerHTML = trips.map(c => {
    const t        = c._t;
    const name     = [t.country_a, t.country_b].filter(Boolean).map(co => `${flag(co)} ${co}`).join(' + ');
    const daysText = c.hasB ? `${c.daysA}d + ${c.daysB}d` : `${c.daysA} days`;
    const seasonVal = c.rawSeason;
    const seasonLbl = seasonVal >= 50 ? '☀️ Peak' : seasonVal >= 20 ? '🌤 Good' : '🌧 Off';
    const fatVal    = c.fatigueRaw;
    const fatLbl    = fatVal <= 4 ? '😌 Easy' : fatVal <= 6 ? '🎒 Moderate' : '💪 Demanding';
    const topS = STYLES.map(s => ({ ...s, val: c.catScores[s.uKey] })).sort((a, b) => b.val - a.val).slice(0, 3);

    return `
      <div class="compare-col">
        <div class="compare-col-head">
          <span class="compare-col-name">${name}</span>
          <button class="unpin-btn" data-key="${t.trip_key}">✕</button>
        </div>
        <div class="compare-stat-row"><span class="csl">Cost</span>     <span class="csv compare-cost">€${Math.round(c.cost).toLocaleString('nl-NL')}</span></div>
        <div class="compare-stat-row"><span class="csl">Duration</span> <span class="csv">${daysText}</span></div>
        <div class="compare-stat-row"><span class="csl">Season</span>   <span class="csv">${seasonLbl}</span></div>
        <div class="compare-stat-row"><span class="csl">Fatigue</span>  <span class="csv">${fatLbl}</span></div>
        <div class="compare-styles">${topS.map(s => `<span>${s.icon} ${s.label} <b>${s.val}</b></span>`).join('')}</div>
      </div>`;
  }).join('');

  cols.querySelectorAll('.unpin-btn').forEach(btn => {
    btn.addEventListener('click', () => togglePin(btn.dataset.key));
  });
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

  document.getElementById('avoid-long').checked = U.avoidLong;
  document.getElementById('accom-shared').classList.toggle('active', U.sharedAccom);
  document.getElementById('accom-separate').classList.toggle('active', !U.sharedAccom);
  document.getElementById('max-1').classList.toggle('active', U.maxCountries === 1);
  document.getElementById('max-2').classList.toggle('active', U.maxCountries === 2 && !U.comboOnly);
  document.getElementById('max-combo').classList.toggle('active', U.comboOnly);

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

  syncTravelers(U.travelers);
  updateStyleHints();
}

function syncTravelers(val) {
  const v = Math.max(1, Math.min(6, +val || 1));
  pendingU.travelers = v;
  const labels = ['', 'Solo trip', '2 travelers', '3 travelers', '4 travelers', '5 travelers', '6 travelers'];
  const el = document.getElementById('travelers-display');
  if (el) el.textContent = labels[v] || `${v} travelers`;
  const inp = document.getElementById('travelers-input');
  if (inp) inp.value = v;
  const accomRow = document.getElementById('accom-row');
  if (accomRow) accomRow.style.display = v > 1 ? '' : 'none';
  updateTravelersHint(v, pendingU.sharedAccom);
  updateBudgetPP(pendingU.budget, v);
}

function updateTravelersHint(v, shared) {
  const hint = document.getElementById('travelers-hint');
  if (!hint) return;
  if (v === 1) {
    hint.textContent = 'Total trip cost for 1 person';
  } else if (shared) {
    hint.textContent = `Total for ${v} people — shared room (accommodation split)`;
  } else {
    hint.textContent = `Total for ${v} people — separate rooms (each pays for separate room)`;
  }
}

function syncBudget(val) {
  const v = Math.max(500, Math.min(15000, +val || 6000));
  pendingU.budget = v;
  document.getElementById('budget-slider').value = v;
  document.getElementById('budget-number').value = v;
  document.getElementById('budget-display').textContent = `€${v.toLocaleString('nl-NL')}`;
  updateBudgetPP(v, pendingU.travelers);
}

function updateBudgetPP(budget, travelers) {
  const ppEl    = document.getElementById('budget-pp-hint');
  const mainEl  = document.getElementById('budget-display');
  if (!ppEl || !mainEl) return;
  if (!travelers || travelers <= 1) {
    ppEl.style.display = 'none';
    mainEl.textContent = `€${Math.round(budget).toLocaleString('nl-NL')}`;
    return;
  }
  const pp    = Math.round(budget / travelers);
  const total = Math.round(budget);
  mainEl.textContent = `€${pp.toLocaleString('nl-NL')} p.p.`;
  ppEl.style.display = '';
  ppEl.textContent   = `€${total.toLocaleString('nl-NL')} total`;
}

function syncDays(val) {
  const v = Math.max(5, Math.min(30, +val || 14));
  pendingU.days = v;
  document.getElementById('days-slider').value = v;
  document.getElementById('days-number').value = v;
  document.getElementById('days-display').textContent = `${v} day${v !== 1 ? 's' : ''}`;
}

// ─────────────────────────────────────────────────────────────
// THEME
// ─────────────────────────────────────────────────────────────
function initTheme() {
  const saved = localStorage.getItem('yit_theme') || 'light';
  applyTheme(saved);
}

function toggleTheme() {
  const isDark = document.documentElement.dataset.theme === 'dark';
  applyTheme(isDark ? 'light' : 'dark');
}

function applyTheme(theme) {
  document.documentElement.dataset.theme = theme === 'dark' ? 'dark' : '';
  localStorage.setItem('yit_theme', theme);
  const btn = document.getElementById('theme-toggle');
  if (btn) btn.textContent = theme === 'dark' ? '☀️' : '🌙';
}

// ─────────────────────────────────────────────────────────────
// BOOT
// ─────────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  buildSliders();
  initMap();
  updateStyleHints();
  syncTravelers(U.travelers);
  initTheme();
  document.getElementById('theme-toggle').addEventListener('click', toggleTheme);

  // Budget
  document.getElementById('budget-slider').addEventListener('input', e => { syncBudget(e.target.value); markPending(); });
  document.getElementById('budget-number').addEventListener('input', e => { syncBudget(e.target.value); markPending(); });

  // Days
  document.getElementById('days-slider').addEventListener('input', e => { syncDays(e.target.value); markPending(); });
  document.getElementById('days-number').addEventListener('input', e => { syncDays(e.target.value); markPending(); });

  // Accommodation type
  const setAccom = shared => {
    pendingU.sharedAccom = shared;
    document.getElementById('accom-shared').classList.toggle('active', shared);
    document.getElementById('accom-separate').classList.toggle('active', !shared);
    updateTravelersHint(pendingU.travelers, shared);
    markPending();
  };
  document.getElementById('accom-shared').addEventListener('click',   () => setAccom(true));
  document.getElementById('accom-separate').addEventListener('click', () => setAccom(false));

  // Travel style
  // Travelers
  document.getElementById('travelers-input').addEventListener('input', e => { syncTravelers(e.target.value); markPending(); });
  document.getElementById('travelers-dec').addEventListener('click', () => { syncTravelers(pendingU.travelers - 1); markPending(); });
  document.getElementById('travelers-inc').addEventListener('click', () => { syncTravelers(pendingU.travelers + 1); markPending(); });

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
  const setMaxBtn = (maxC, combo) => {
    pendingU.maxCountries = maxC;
    pendingU.comboOnly    = combo;
    document.getElementById('max-1').classList.toggle('active', maxC === 1);
    document.getElementById('max-2').classList.toggle('active', maxC === 2 && !combo);
    document.getElementById('max-combo').classList.toggle('active', combo);
    markPending();
  };
  document.getElementById('max-1').addEventListener('click',     () => setMaxBtn(1, false));
  document.getElementById('max-2').addEventListener('click',     () => setMaxBtn(2, false));
  document.getElementById('max-combo').addEventListener('click', () => setMaxBtn(2, true));

  // Toggles
  document.getElementById('avoid-long').addEventListener('change', e => { pendingU.avoidLong = e.target.checked; markPending(); });

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

  // Pin buttons (event delegation)
  document.getElementById('trip-grid').addEventListener('click', e => {
    const btn = e.target.closest('.pin-btn');
    if (btn) { e.stopPropagation(); togglePin(btn.dataset.key); }
  });

  // Compare panel clear
  document.getElementById('compare-clear-btn').addEventListener('click', () => {
    pinnedKeys.clear();
    document.querySelectorAll('.pin-btn').forEach(b => { b.classList.remove('pinned'); b.textContent = '+'; b.title = 'Compare'; });
    renderCompare();
  });

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

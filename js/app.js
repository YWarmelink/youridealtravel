// ─────────────────────────────────────────────────────────────
// CONFIG
// ─────────────────────────────────────────────────────────────
const SHEET_ID = '2PACX-1vSOSC5BGR5CbQ4B9xwfqMAoltIjE1b11akL5WrNeRXOiSzdueUgtvI7xYIQTUJwMMKXSJmpDtBddH5x';
const GID = {
  TRIP_ENGINE:   '2103068682',
  FILTER_ENGINE: '431668285',
  SETTINGS:      '0',
};
const CACHE_KEY = 'travelos_v2_data';
const SYNC_KEY  = 'travelos_v2_synced';

function csvUrl(gid) {
  return `https://docs.google.com/spreadsheets/d/e/${SHEET_ID}/pub?output=csv&gid=${gid}&cb=${Date.now()}`;
}

// ─────────────────────────────────────────────────────────────
// STYLE & FLAG DEFINITIONS
// ─────────────────────────────────────────────────────────────
const STYLES = [
  { key: 'adventure_score', label: 'Adventure', icon: '🧗', uKey: 'adventure', sKey: 'Adventure' },
  { key: 'food_score',      label: 'Food',      icon: '🍜', uKey: 'food',      sKey: 'Food'      },
  { key: 'nature_score',    label: 'Nature',    icon: '🏔', uKey: 'nature',    sKey: 'Nature'    },
  { key: 'beach_score',     label: 'Beach',     icon: '🏖', uKey: 'beach',     sKey: 'Beach'     },
  { key: 'nightlife_score', label: 'Nightlife', icon: '🌃', uKey: 'nightlife', sKey: 'Nightlife' },
  { key: 'culture_score',   label: 'Culture',   icon: '🏛', uKey: 'culture',   sKey: 'Culture'   },
];

const RANK_WEIGHTS = [
  { uKey: 'prefWeight',    label: 'Style preference', default: 1.5, min: 0, max: 5, step: 0.5 },
  { uKey: 'budgetWeight',  label: 'Budget fit',        default: 4,   min: 0, max: 8, step: 0.5 },
  { uKey: 'fatigueWeight', label: 'Low fatigue',       default: 2,   min: 0, max: 8, step: 0.5 },
  { uKey: 'wishWeight',    label: 'Wishlist bonus',    default: 4,   min: 0, max: 8, step: 0.5 },
  { uKey: 'regionWeight',  label: 'Region bonus',      default: 3,   min: 0, max: 8, step: 0.5 },
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
let rawTrips  = [];   // rows from TRIP_ENGINE
let filterMap = {};   // FILTER_ENGINE rows keyed by trip_key
let currentFilter = 'top10';

// Live user settings — updated on every input change
let U = {
  budget: 6000,
  days: 14,
  maxCountries: 2,
  avoidLong: false,
  preferCombos: true,
  // Style weights
  adventure: 6, food: 9, nature: 7, beach: 6, nightlife: 4, culture: 10,
  // Ranking weights
  prefWeight: 1.5, budgetWeight: 4, fatigueWeight: 2, wishWeight: 4, regionWeight: 3,
};

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
// DATA SYNC
// ─────────────────────────────────────────────────────────────
async function syncFromSheets() {
  setSyncStatus('syncing');
  const btn = document.getElementById('sync-btn');
  if (btn) btn.disabled = true;

  try {
    const [tripText, filterText, settingsText] = await Promise.all([
      fetch(csvUrl(GID.TRIP_ENGINE)).then(r => r.text()),
      fetch(csvUrl(GID.FILTER_ENGINE)).then(r => r.text()),
      fetch(csvUrl(GID.SETTINGS)).then(r => r.text()),
    ]);

    // Parse trips — skip empty/header rows
    const trips = parseCSV(tripText).filter(t => t.trip_key && t.trip_key !== 'trip_key');

    // Parse filter data into a map keyed by trip_id
    const filterRows = parseCSV(filterText).filter(r => r.trip_id);
    const fMap = {};
    filterRows.forEach(r => { fMap[r.trip_id] = r; });

    // Parse settings into key→value map
    const settingsRows = parseCSV(settingsText).filter(r => r.setting_key);
    const settings = {};
    settingsRows.forEach(r => { settings[r.setting_key] = r.setting_value; });

    // Store to cache
    const payload = { trips, fMap, settings, synced: new Date().toISOString() };
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
  rawTrips  = payload.trips;
  filterMap = payload.fMap;

  // Pre-fill UI from Sheets settings (only on first load)
  const s = payload.settings || {};
  if (s.Budget)              U.budget         = parseInt(s.Budget) || U.budget;
  if (s.Adventure)           U.adventure      = parseInt(s.Adventure) || U.adventure;
  if (s.Food)                U.food           = parseInt(s.Food) || U.food;
  if (s.Nature)              U.nature         = parseInt(s.Nature) || U.nature;
  if (s.Beach)               U.beach          = parseInt(s.Beach) || U.beach;
  if (s.Nightlife)           U.nightlife      = parseInt(s.Nightlife) || U.nightlife;
  if (s.Culture)             U.culture        = parseInt(s.Culture) || U.culture;
  if (s.Preference_Weight)   U.prefWeight     = num(s.Preference_Weight);
  if (s.Budget_Pressure_Weight) U.budgetWeight = num(s.Budget_Pressure_Weight);
  if (s.Fatigue_Weight)      U.fatigueWeight  = num(s.Fatigue_Weight);
  if (s.Wishlist_Weight)     U.wishWeight     = num(s.Wishlist_Weight);
  if (s.Priority_Weight)     U.regionWeight   = num(s.Priority_Weight);

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

function calcTrip(t) {
  const hasB   = !!(t.country_b && t.country_b !== '');
  const flight = num(t.total_flight_cost);

  // ── Day allocation ────────────────────────────────────────
  let daysA, daysB;
  const minA = num(t.min_days_a), maxA = num(t.max_days_a), idealA = num(t.ideal_days_a);

  if (hasB) {
    const minB = num(t.min_days_b), maxB = num(t.max_days_b), idealB = num(t.ideal_days_b);
    const minTotal = minA + minB;

    if (U.days < minTotal) {
      // Trip requires more days than user has
      return { _t: t, feasible: false, reason: `Needs ≥${minTotal} days` };
    }

    const totalIdeal = idealA + idealB;
    const ratioA     = totalIdeal > 0 ? idealA / totalIdeal : 0.5;
    daysA = clamp(Math.round(U.days * ratioA), minA, maxA);
    daysB = clamp(U.days - daysA, minB, maxB);
    // Re-adjust if both clamps used fewer than available days
    if (daysA + daysB < U.days) {
      const extra = U.days - daysA - daysB;
      // Give extra days to whichever country has more room
      if (daysA < maxA) daysA = clamp(daysA + extra, minA, maxA);
      else              daysB = clamp(daysB + extra, minB, maxB);
    }
  } else {
    if (U.days < minA) {
      return { _t: t, feasible: false, reason: `Needs ≥${minA} days` };
    }
    daysA = clamp(U.days, minA, maxA);
    daysB = 0;
  }

  // ── Cost ──────────────────────────────────────────────────
  const cost = flight
    + daysA * num(t.daily_cost_a)
    + (hasB ? daysB * num(t.daily_cost_b) : 0);

  const costFit   = cost <= U.budget ? 'OK' : 'OVER';
  // budget raw: positive = room left, negative = over budget
  const budgetRaw = (U.budget - cost) / U.budget * 100;

  // ── Preference score ──────────────────────────────────────
  // User weights × objective destination style scores
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
    feasible:    true,
    hasB,
    daysA, daysB,
    cost, costFit,
    rawBudget:   budgetRaw,
    rawPref:     prefRaw,
    rawFatigue:  100 - num(t.fatigue_penalty),
    rawSeason:   num(t.total_season_score),
    rawRegion:   num(t.region_bonus),
    rawWish:     num(t.total_wishlist_bonus),
  };
}

// Compute percentile rank (0–100) for each value in an array
function pctRanks(arr) {
  const n      = arr.length;
  if (n <= 1)  return arr.map(() => 100);
  const sorted = [...arr].sort((a, b) => a - b);
  return arr.map(v => {
    // Use lower_bound index to break ties consistently
    let lo = 0, hi = n - 1;
    while (lo < hi) { const mid = (lo + hi) >> 1; if (sorted[mid] < v) lo = mid + 1; else hi = mid; }
    return (lo / (n - 1)) * 100;
  });
}

function calcAndRank() {
  if (rawTrips.length === 0) return [];

  // ── 1. Hard constraint filter ─────────────────────────────
  const allowed = rawTrips.filter(t => {
    const fe  = filterMap[t.trip_key] || {};
    const hasB = !!(t.country_b && t.country_b !== '');

    if (U.avoidLong    && fe.is_intercontinental === 'TRUE') return false;
    if (hasB && U.maxCountries < 2)                          return false;
    if (!U.preferCombos && hasB)                             return false;
    return true;
  });

  // ── 2. Calculate each trip ────────────────────────────────
  const calced   = allowed.map(t => calcTrip(t));
  const feasible = calced.filter(c => c.feasible);
  if (feasible.length === 0) return [];

  // ── 3. Percentile normalization across all feasible trips ─
  const pctPref   = pctRanks(feasible.map(c => c.rawPref));
  const pctBudget = pctRanks(feasible.map(c => c.rawBudget));
  const pctFat    = pctRanks(feasible.map(c => c.rawFatigue));
  const pctSeason = pctRanks(feasible.map(c => c.rawSeason));
  const pctRegion = pctRanks(feasible.map(c => c.rawRegion));
  const pctWish   = pctRanks(feasible.map(c => c.rawWish));

  // ── 4. Weighted final score ───────────────────────────────
  const scored = feasible.map((c, i) => ({
    ...c,
    pctPref:   pctPref[i],
    pctBudget: pctBudget[i],
    finalScore: (
      U.prefWeight   * pctPref[i]   +
      U.budgetWeight * pctBudget[i] +
      U.fatigueWeight * pctFat[i]   +
      U.wishWeight   * pctWish[i]   +
      U.regionWeight * pctRegion[i] +
      1              * pctSeason[i]   // season always counts
    ),
  }));

  // ── 5. Sort & assign rank + tier ─────────────────────────
  scored.sort((a, b) => b.finalScore - a.finalScore);
  const n = scored.length;
  scored.forEach((c, i) => {
    c.rank    = i + 1;
    const pct = (n - i) / n * 100;
    c.tier    = pct >= 70 ? 'TOP TIER' : pct >= 40 ? 'GOOD' : 'MID';
    // Budget bar score: 0–100, capped
    c.budgetScore = Math.max(0, Math.min(100, c.rawBudget));
  });

  return scored;
}

// ─────────────────────────────────────────────────────────────
// FILTERING (applied after ranking)
// ─────────────────────────────────────────────────────────────
function applyFilter(ranked) {
  const all = [...ranked];
  switch (currentFilter) {
    case 'top10':
      return all.slice(0, 10);
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

  // Countries
  const countries = [t.country_a, t.country_b].filter(Boolean);
  const countriesHtml = countries
    .map((co, i) => `${i > 0 ? '<span class="country-sep">+</span>' : ''}<span class="country-name">${flag(co)} ${co}</span>`)
    .join('');

  // Days line
  let daysHtml = '';
  if (c.hasB) {
    daysHtml = `<div class="card-days"><span class="days-highlight">${c.daysA}d</span> ${t.country_a} + <span class="days-highlight">${c.daysB}d</span> ${t.country_b}</div>`;
  } else {
    daysHtml = `<div class="card-days"><span class="days-highlight">${c.daysA} days</span> in ${t.country_a}</div>`;
  }

  // Budget bar
  const barW     = Math.max(3, c.budgetScore);
  const barClass = c.costFit === 'OVER' ? 'fill-over'
                 : c.budgetScore >= 70   ? 'fill-great'
                 : c.budgetScore >= 40   ? 'fill-good'
                 :                         'fill-ok';
  const roomLeft = U.budget - c.cost;
  const barLabel = c.costFit === 'OK'
    ? `€${Math.round(roomLeft).toLocaleString('nl-NL')} under budget`
    : `€${Math.abs(Math.round(roomLeft)).toLocaleString('nl-NL')} over budget`;

  // Top 2 styles
  const stylesHtml = topStyles(c)
    .map(s => `<span class="style-tag">${s.icon} ${s.label} <span class="style-tag-score">${s.val}</span></span>`)
    .join('');

  // Season & fatigue indicators
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

  if (rawTrips.length === 0) return; // no data yet

  const ranked   = calcAndRank();
  const filtered = applyFilter(ranked);

  countEl.textContent = `${filtered.length} trip${filtered.length !== 1 ? 's' : ''}`;

  if (filtered.length === 0) {
    grid.innerHTML = '<div class="empty-msg">No trips match your current settings. Try relaxing some constraints.</div>';
    return;
  }

  grid.innerHTML = filtered.map(c => renderCard(c)).join('');
}

// ─────────────────────────────────────────────────────────────
// UI INIT & SYNC
// ─────────────────────────────────────────────────────────────

// Build style + ranking weight sliders
function buildSliders() {
  const styleContainer = document.getElementById('style-sliders');
  styleContainer.innerHTML = STYLES.map(s => `
    <div class="style-row">
      <span class="style-label">${s.icon} ${s.label}</span>
      <input type="range" class="style-slider" id="sl-${s.uKey}" min="0" max="10" step="1" value="${U[s.uKey]}">
      <span class="style-val" id="sv-${s.uKey}">${U[s.uKey]}</span>
    </div>
  `).join('');

  STYLES.forEach(s => {
    const slider = document.getElementById(`sl-${s.uKey}`);
    const valEl  = document.getElementById(`sv-${s.uKey}`);
    slider.addEventListener('input', () => {
      U[s.uKey] = +slider.value;
      valEl.textContent = slider.value;
      recalculate();
    });
  });

  const rankContainer = document.getElementById('rank-sliders');
  rankContainer.innerHTML = RANK_WEIGHTS.map(w => `
    <div class="style-row">
      <span class="style-label">${w.label}</span>
      <input type="range" class="style-slider" id="rw-${w.uKey}" min="${w.min}" max="${w.max}" step="${w.step}" value="${U[w.uKey]}">
      <span class="style-val" id="rv-${w.uKey}">${U[w.uKey]}</span>
    </div>
  `).join('');

  RANK_WEIGHTS.forEach(w => {
    const slider = document.getElementById(`rw-${w.uKey}`);
    const valEl  = document.getElementById(`rv-${w.uKey}`);
    slider.addEventListener('input', () => {
      U[w.uKey] = +slider.value;
      valEl.textContent = slider.value;
      recalculate();
    });
  });
}

// Push U values into all UI elements (called after loading from cache)
function refreshUI() {
  syncBudget(U.budget);
  syncDays(U.days);

  document.getElementById('avoid-long').checked   = U.avoidLong;
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
}

function syncBudget(val) {
  const v = Math.max(500, Math.min(15000, +val || 6000));
  U.budget = v;
  document.getElementById('budget-slider').value    = v;
  document.getElementById('budget-number').value    = v;
  document.getElementById('budget-display').textContent = `€${v.toLocaleString('nl-NL')}`;
}

function syncDays(val) {
  const v = Math.max(5, Math.min(30, +val || 14));
  U.days = v;
  document.getElementById('days-slider').value  = v;
  document.getElementById('days-number').value  = v;
  document.getElementById('days-display').textContent = `${v} day${v !== 1 ? 's' : ''}`;
}

// ─────────────────────────────────────────────────────────────
// BOOT
// ─────────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  buildSliders();

  // Budget
  document.getElementById('budget-slider').addEventListener('input', e => { syncBudget(e.target.value); recalculate(); });
  document.getElementById('budget-number').addEventListener('input', e => { syncBudget(e.target.value); recalculate(); });

  // Days
  document.getElementById('days-slider').addEventListener('input', e => { syncDays(e.target.value); recalculate(); });
  document.getElementById('days-number').addEventListener('input', e => { syncDays(e.target.value); recalculate(); });

  // Max countries
  document.getElementById('max-1').addEventListener('click', () => {
    U.maxCountries = 1;
    document.getElementById('max-1').classList.add('active');
    document.getElementById('max-2').classList.remove('active');
    recalculate();
  });
  document.getElementById('max-2').addEventListener('click', () => {
    U.maxCountries = 2;
    document.getElementById('max-2').classList.add('active');
    document.getElementById('max-1').classList.remove('active');
    recalculate();
  });

  // Toggles
  document.getElementById('avoid-long').addEventListener('change', e => { U.avoidLong    = e.target.checked; recalculate(); });
  document.getElementById('prefer-combos').addEventListener('change', e => { U.preferCombos = e.target.checked; recalculate(); });

  // Filter tabs
  document.querySelectorAll('.tab').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.tab').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      currentFilter = btn.dataset.filter;
      recalculate();
    });
  });

  // Sync buttons
  const doSync = () => syncFromSheets();
  document.getElementById('sync-btn').addEventListener('click', doSync);
  const btn2 = document.getElementById('sync-btn-2');
  if (btn2) btn2.addEventListener('click', doSync);

  // Load from cache on start — if none, wait for user to sync
  const hadCache = loadFromCache();
  if (!hadCache) {
    document.getElementById('sync-status').textContent = 'Click Sync to load data';
  }
});

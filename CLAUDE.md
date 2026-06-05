# YourIdealTravel — CLAUDE.md

Persoonlijke reisplanner die trips rankt op basis van budget, reijsstijl en seizoen. Live op GitHub Pages. Geen build tools — vanilla HTML/CSS/JS.

## Bestanden

| Bestand | Rol |
|---------|-----|
| `js/app.js` | Alles: data-sync, berekeningen, ranking, rendering (~1200 regels) |
| `index.html` | Structuur + sidebar met alle instellingen |
| `styles.css` | Alle opmaak, dark mode via `data-theme="dark"` op `<html>` |
| `sw.js` | Service worker — offline caching (PWA) |
| `gas/Code.gs` | Google Apps Script — niet door de web app gebruikt |

## Dataflow

```
Google Sheet (CSV via publish-to-web)
  → syncFromSheets()       [fetch 4 tabs parallel]
  → localStorage (CACHE_KEY)
  → applyCache()           [vult rawTrips, countryData, flightData]
  → recalculate()          [elke keer dat U wijzigt]
```

## Globale state

```js
U          // Applied settings — bron van waarheid voor berekeningen
pendingU   // Draft settings — gevuld door alle inputs, pas actief na Apply-knop
rawTrips   // Array van alle trips uit TRIP_ENGINE tab
countryData // { 'Japan': { daily_cost_*, seasons, ... } }
flightData  // { 'NL-Japan': { low, mid, high }, ... }
```

**Belangrijk:** `U` wordt nooit automatisch geüpdatet door inputs — altijd via `pendingU` → `applyChanges()`.

## Kernfuncties in app.js

| Functie | Regel | Wat |
|---------|-------|-----|
| `calcTrip(t)` | ~394 | Berekent kosten + ruwe scores voor één trip |
| `calcTripIdeal(t)` | ~492 | Zelfde maar gebruikt `ideal_days` i.p.v. `U.days` (voor 🎯 filter) |
| `calcBudgetScore(cost, budget)` | ~543 | Vaste 0–100 schaal: 50–100 binnen budget, 0–50 kwadratisch daarboven |
| `rankCalced(calced)` | ~551 | Percentielranking + finalScore + tiers toewijzen |
| `calcAndRank()` | ~590 | Filtert `rawTrips` → `calcTrip` → `rankCalced` |
| `applyFilter(ranked)` | ~609 | Past het actieve tab-filter toe op de gerankte lijst |
| `recalculate()` | ~799 | Entry point: `calcAndRank` → `applyFilter` → DOM renderen + kaart |
| `flightLegCost(from, to)` | ~385 | Kijkt vliegkosten op per route per seizoen |
| `countrySeasonScore(...)` | ~353 | % van reiswindow in goed seizoen voor een land (0–100) |
| `renderCard(c)` | ~721 | HTML voor één trip-card |
| `refreshUI()` | ~936 | Schrijft `U` terug naar alle UI-elementen (na cache load) |
| `syncFromSheets()` | ~245 | Fetcht alle CSV-tabs, slaat op in localStorage |

## Ranking formule

```
finalScore = (prefWeight  × pctPref
           + budgetWeight × budgetScore     ← vaste 0-100, geen percentiel
           + fatigueWeight × pctFatigue
           + seasonWeight  × pctSeason)
           × 1/(1 + overstay)
           × comboFactor (1.08 als combo)
```

Standaard weights: style=8, budget=5, fatigue=2.  
`seasonWeight` = `SEASON_WEIGHT[U.seasonPref]` (High=2.0, Mid=1.0, Low=0.3, No=0.0).

## Sheet-tabs die de app gebruikt

| Tab | GID | Gebruikt voor |
|-----|-----|---------------|
| TRIP_ENGINE | 2103068682 | Trips, min/ideal/max days, stijlscores, fatigue |
| FILTER_ENGINE | 431668285 | `is_intercontinental` per trip_key |
| COUNTRIES | 2119597216 | Dagkosten per stijl, seizoensmaanden, flight_key |
| FLIGHTS | 99695727 | Vliegkosten per route per seizoen |
| SETTINGS | 0 | **Niet meer ingeladen** — JS-defaults in `U` zijn de bron |

## Bekende ontwerpbeslissingen

- `U.days` is altijd **maximum** verblijfsduur — geen apart cap; `min_days` is de enige harde ondergrens
- `max_days` in de sheet wordt **alleen** gebruikt voor de overstay penalty (score ×1/(1+overstay))
- Luxury heeft geen eigen kolom in COUNTRIES — berekend als `premium × 1.45`
- Bij meerdere reizigers: gedeelde kamer = `dagkosten × (0.55 + 0.45 × N)`, apart = `× N`
- Vliegkosten: seizoen bepaald op basis van het **doel**land (bij X→NL: het vertrekland)
- `budgetWeight=0` schakelt budget volledig uit, inclusief verborgen penalty

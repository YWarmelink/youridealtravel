# Sheet aanpassingen — to-do lijst

Dit is een persoonlijke to-do lijst met wat er nog in de Google Sheet aangepast kan worden zodat die beter aansluit bij de web app. De website werkt al correct — dit is puur voor het opschonen en uitbreiden van de sheet.

---

## SETTINGS tab — kan genegeerd worden

De app laadt de SETTINGS tab **niet meer in**. De JS-defaults in `app.js` zijn altijd het startpunt. De SETTINGS tab heeft geen effect op de website — je hoeft die niet bij te houden.

---

## Kolommen in TRIP_ENGINE die niet meer gebruikt worden

Deze kolommen worden door de app volledig genegeerd. Ze kunnen blijven staan maar je hoeft ze niet meer kloppend te houden.

- `daily_cost_a`, `daily_cost_b` — app pakt dagkosten uit COUNTRIES tab
- `flight_nl_to_a`, `flight_a_to_b`, `flight_b_to_nl`, `total_flight_cost` — app berekent vliegkosten uit FLIGHTS tab
- `cost_min`, `cost_ideal`, `cost_max`, `chosen_scenario`, `chosen_days_a/b`, `chosen_cost` — app herberekent zelf
- `season_score_a/b`, `total_season_score` — app berekent seizoensscore dynamisch
- `wishlist_bonus_a/b`, `total_wishlist_bonus` — wishlist verwijderd uit ranking
- `region_bonus` — region bonus verwijderd uit ranking
- `cost_score`, `cost_penalty`, `budget_pressure_score`, `fatigue_score` — app herberekent
- Alle `percentile_*` kolommen — app berekent eigen percentielranking
- `final_trip_score`, `trip_ranking_score`, `decision_score` — app heeft eigen rankingformule
- `budget_fit`, `cost_fit` — app bepaalt dit zelf

---

## Kolommen die WEL kloppen moeten bij nieuwe landen/combos

### TRIP_ENGINE

| Kolom | Waarom belangrijk |
|-------|-------------------|
| `trip_key` | Unieke ID — wordt gebruikt als referentie overal |
| `country_a`, `country_b` | Exact gelijk aan naam in COUNTRIES tab |
| `min_days_a`, `min_days_b` | Hard filter — trip is niet haalbaar als `U.days < min` |
| `ideal_days_a`, `ideal_days_b` | Dagverdeling bij combos + 🎯 Ideal trip filter |
| `max_days_a`, `max_days_b` | **Overstay penalty** — te lange verblijfsduur verlaagt score |
| `fatigue_penalty` | Vermoeidheidscomponent in ranking |
| `adventure_score`, `food_score`, `nature_score`, `beach_score`, `nightlife_score`, `culture_score` | Stijlscores in ranking en filters |

### COUNTRIES tab (GID 2119597216)

| Kolom | Waarom belangrijk |
|-------|-------------------|
| `country` | Moet exact matchen met `country_a/b` in TRIP_ENGINE |
| `daily_cost_backpack` | Dagkosten voor Backpack stijl |
| `daily_cost_mid` | Dagkosten voor Standard stijl |
| `daily_cost_premium` | Dagkosten voor Comfort stijl (Luxury = premium × 1.45) |
| `low_season`, `mid_season`, `high_season` | Seizoensberekening voor vliegkosten én seizoensscore — gebruik 3-letter afkortingen: `Jan,Feb,Mar` |
| `flight_key` | Routekey vanuit NL (bijv. `NL-Japan`) — moet bestaan in FLIGHTS tab |
| `fatigue` | Vermoeidheid per land |
| Stijlscores | `adventure`, `food`, `nature`, `beach`, `nightlife`, `culture` |

### FLIGHTS tab (GID 99695727)

| Kolom | Waarom belangrijk |
|-------|-------------------|
| `route_key` | Bijv. `NL-Japan`, `Japan-NL`, `Japan-Taiwan` |
| `low_season_cost`, `mid_season_cost`, `high_season_cost` | Vliegkosten per seizoen |

Voor elke nieuwe combo-trip heb je nodig:
- `NL-{land_a}` en `{land_a}-NL`
- `{land_a}-{land_b}` en `{land_b}-{land_a}`
- `{land_b}-NL` en `NL-{land_b}`

### FILTER_ENGINE tab (GID 431668285)

| Kolom | Waarom belangrijk |
|-------|-------------------|
| `trip_id` | Moet matchen met `trip_key` in TRIP_ENGINE |
| `is_intercontinental` | `TRUE`/`FALSE` — gebruikt voor "Avoid long flights" filter |

---

## Checklist bij nieuwe landen toevoegen

1. **COUNTRIES tab** — rij toevoegen met dagkosten, seizoenen, stijlscores, flight_key
2. **FLIGHTS tab** — NL↔land routes met seizoenskosten
3. **TRIP_ENGINE tab** — single-trip rij met min/ideal/max days, scores, fatigue
4. **TRIP_ENGINE tab** *(optioneel)* — combo-rijen met logische combinaties
5. **FLIGHTS tab** *(optioneel)* — inter-land routes voor nieuwe combos
6. **FILTER_ENGINE tab** — rijen voor alle nieuwe trips met `is_intercontinental`
7. **App** — klik Sync, alles wordt automatisch opgepikt

---

## Aandachtspunten voor bestaande data

- **max_days** is nu belangrijk voor de overstay penalty — controleer of de waarden realistisch zijn. Brunei max 6 dagen, Japan max 24 dagen etc. Een te lage max_days geeft een grote scorestraf bij 21-daagse trips.
- **ideal_days** worden gebruikt voor de 🎯 Ideal trip filter — zorg dat deze de echte "beste" tripduur per land weergeven.
- **Seizoensmaanden** in COUNTRIES moeten alle 12 maanden dekken per land (low + mid + high samen = 12). Ontbrekende maanden vallen terug op 'mid'.

# Sheet aanpassingen

Dit document beschrijft wat er in de Google Sheet nog aangepast of opgeschoond kan worden, nu de web app veel dingen anders berekent dan de sheet deed. De website blijft gewoon werken — dit is puur voor overzicht en sheet-onderhoud.

---

## Wat de app NIET meer gebruikt uit de sheet

Deze kolommen worden door de app genegeerd. Ze mogen blijven staan (de sheet herberekent ze gewoon), maar je hoeft ze niet meer kloppend te houden voor de website.

### TRIP_ENGINE tab

| Kolom | Waarom niet meer nodig |
|-------|------------------------|
| `daily_cost_a`, `daily_cost_b` | App pakt dagkosten nu direct uit COUNTRIES tab op basis van travel style |
| `flight_nl_to_a`, `flight_a_to_b`, `flight_b_to_nl`, `total_flight_cost` | App berekent vliegkosten per leg uit FLIGHTS tab op basis van start maand + seizoen |
| `cost_min`, `cost_ideal`, `cost_max` | App herberekent zelf met U.days en reizigers |
| `chosen_scenario`, `chosen_days_a`, `chosen_days_b`, `chosen_cost` | App bepaalt dagverdeling zelf (geen max cap meer) |
| `season_score_a`, `season_score_b`, `total_season_score` | App berekent seizoensscore dynamisch uit COUNTRIES tab |
| `wishlist_bonus_a`, `wishlist_bonus_b`, `total_wishlist_bonus` | Wishlist is verwijderd uit de ranking |
| `region_bonus` | Region bonus is verwijderd uit de ranking |
| `cost_score`, `cost_penalty`, `budget_pressure_score` | App herberekent budgetscore zelf |
| `fatigue_score` | App gebruikt alleen `fatigue_penalty` |
| `percentile_*` kolommen | App berekent percentielranking zelf |
| `final_trip_score`, `trip_ranking_score`, `decision_score` | App heeft eigen rankingformule |
| `budget_fit`, `cost_fit` | App bepaalt dit zelf op basis van U.budget |

---

## Wat de app WEL nog nodig heeft uit TRIP_ENGINE

Deze kolommen moeten kloppen als je een nieuw land of combo toevoegt.

| Kolom | Gebruik |
|-------|---------|
| `trip_key` | Unieke ID per trip |
| `country_a`, `country_b` | Landnamen (moeten exact overeenkomen met COUNTRIES tab) |
| `route_key` | Naam van de route (bijv. Japan-Taiwan) |
| `min_days_a`, `min_days_b` | Minimaal aantal dagen om trip zinvol te maken (hard filter) |
| `ideal_days_a`, `ideal_days_b` | Beste tripduur per land — gebruikt voor dagverdeling in combos en de 🎯 Ideal trip filter |
| `max_days_a`, `max_days_b` | Maximaal zinvolle verblijfsduur — gebruikt voor overstay penalty in ranking |
| `fatigue_penalty` | Vermoeidheidscore (hogere waarde = meer vermoeiend) |
| `adventure_score`, `food_score`, `nature_score`, `beach_score`, `nightlife_score`, `culture_score` | Stijlscores per trip — gebruikt in ranking en filters |
| `trip_type` | Niet actief gebruikt maar handig voor overzicht |

---

## Wat de app nodig heeft uit COUNTRIES tab (GID 2119597216)

Dit is de nieuwe primaire bron voor dagkosten en seizoenen. Elke keer dat je een nieuw land toevoegt, moeten deze kolommen ingevuld zijn.

| Kolom | Gebruik |
|-------|---------|
| `country` | Naam — moet exact overeenkomen met `country_a`/`country_b` in TRIP_ENGINE |
| `daily_cost_backpack` | Dagkosten Backpack stijl |
| `daily_cost_mid` | Dagkosten Standard stijl |
| `daily_cost_premium` | Dagkosten Comfort stijl (Luxury = premium × 1.45) |
| `low_season` | Kommalijst van maanden in laagseizoen (bijv. `Nov,Dec,Jan`) |
| `mid_season` | Kommalijst van maanden in midden seizoen |
| `high_season` | Kommalijst van maanden in hoogseizoen |
| `flight_key` | Routekey vanuit NL (bijv. `NL-Japan`) — moet overeenkomen met FLIGHTS tab |
| `fatigue` | Vermoeidheid per land (wordt gebruikt door TRIP_ENGINE) |
| Stijlscores | `culture`, `nature`, `beach`, `food`, `nightlife`, `adventure` |

**Let op maandnotatie:** gebruik altijd 3-letter afkortingen gescheiden door komma's: `Jan,Feb,Mar` etc. Geen spaties na de komma.

---

## Wat de app nodig heeft uit FLIGHTS tab (GID 99695727)

Elke route die voorkomt in TRIP_ENGINE moet hier staan met seizoenskosten.

| Kolom | Gebruik |
|-------|---------|
| `route_key` | Bijv. `NL-Japan`, `Japan-Taiwan`, `Taiwan-NL` |
| `low_season_cost` | Vliegkosten laagseizoen |
| `mid_season_cost` | Vliegkosten midden seizoen |
| `high_season_cost` | Vliegkosten hoogseizoen |

Voor elke combo-trip (A→B) moet je drie routes hebben:
- `NL-{country_a}` en `{country_a}-NL`
- `{country_a}-{country_b}` en `{country_b}-{country_a}`
- `{country_b}-NL` en `NL-{country_b}`

---

## Nieuwe landen toevoegen — checklist

1. **COUNTRIES tab:** voeg rij toe met alle vereiste kolommen (dagkosten, seizoenen, scores, flight_key)
2. **FLIGHTS tab:** voeg NL↔land routes toe met seizoenskosten
3. **TRIP_ENGINE tab:** voeg single-trip rij toe (met min/ideal/max days, scores, fatigue)
4. **TRIP_ENGINE tab (optioneel):** voeg combo-rijen toe met landen die geografisch combineerbaar zijn
5. **FLIGHTS tab:** voeg inter-land routes toe voor nieuwe combos
6. **FILTER_ENGINE tab:** voeg filterrijen toe voor alle nieuwe trips (is_intercontinental, etc.)
7. **App:** klik Sync — app pikt alles automatisch op

---

## FILTER_ENGINE tab — nog steeds actief gebruikt

| Kolom | Gebruik |
|-------|---------|
| `trip_id` | Moet overeenkomen met `trip_key` in TRIP_ENGINE |
| `is_intercontinental` | `TRUE`/`FALSE` — gebruikt voor "Avoid long flights" filter |
| `country_count` | Niet actief gebruikt (app telt zelf) |

Overige kolommen in FILTER_ENGINE worden door de app niet gebruikt.

---

## SETTINGS tab — gedeeltelijk nog actief

De app laadt SETTINGS bij Sync en vult de startwaarden in. De gebruiker kan dit overschrijven via de UI.

**Nog actief ingeladen:**
- `Budget`, `Travel_style`, `Start_Month`, `End_Month`, `Season_Preference_(Low/Mid/High/No)`
- Alle stijlscores: `Culture`, `Nature`, `Beach`, `Food`, `Nightlife`, `Adventure`
- Rankingweights: `Preference_Weight`, `Budget_Pressure_Weight`, `Fatigue_Weight`

**Niet meer actief:**
- `Priority_Weight` (region bonus verwijderd)
- `Wishlist_Weight` (wishlist verwijderd)
- `Available_PTO_Days`, `Max_Countries_per_Trip`, `Prefer_Combos`, `Avoid_Long_Flights` (worden niet ingeladen)

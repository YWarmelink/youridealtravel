# YourIdealTravel

Een persoonlijke reisplanner web app die real-time berekent wat de beste trip is op basis van jouw budget, reijsstijl en voorkeuren.

**Live app:** https://ywarmelink.github.io/youridealtravel/

---

## Hoe het werkt

De app haalt data op uit een gepubliceerde Google Sheet (CSV via fetch) en slaat die op in `localStorage`. De browser doet alle berekeningen zelf — geen server nodig. Na één Sync werkt alles instant en ook offline (PWA).

---

## Google Sheet structuur

Sheet ID: `2PACX-1vSOSC5BGR5CbQ4B9xwfqMAoltIjE1b11akL5WrNeRXOiSzdueUgtvI7xYIQTUJwMMKXSJmpDtBddH5x`

| Tab | GID | Inhoud |
|-----|-----|--------|
| SETTINGS | 0 | Gebruikersinstellingen (budget, stijl, maanden, etc.) |
| TRIP_ENGINE | 2103068682 | Alle trips met berekende scores, seizoenen, dagkosten |
| FILTER_ENGINE | 431668285 | Filterdata per trip (intercontinentaal, land-count, etc.) |
| COUNTRIES | 2119597216 | Per land: dagkosten per stijl, seizoensdefinities, scores |
| FLIGHTS | 99695727 | Vliegkosten per route per seizoen (low/mid/high) |

De sheet bevat ook een development log (GID 1912455839) en FILTER_RESULTS (GID 28259201) die de app niet gebruikt.

---

## Kostenberekening (`calcTrip` in js/app.js)

### Dagkosten
Pakt de juiste kolom uit `countryData` (uit COUNTRIES tab):
- Backpack → `daily_cost_backpack`
- Standard → `daily_cost_mid`
- Comfort → `daily_cost_premium`
- Luxury → `daily_cost_premium × 1.45`

Bij meerdere reizigers: `dagkosten × (0.55 + 0.45 × N)` voor shared rooms, of `dagkosten × N` voor separate rooms.

### Dagverdeling
`U.days` (trip duration instelling) is altijd het maximum — de `max_days` uit de sheet wordt genegeerd. Alleen `min_days` geldt als harde ondergrens (trip is niet haalbaar als `U.days < min_days`).

- **Single trip:** altijd `daysA = U.days` — de hele vakantie in dat land
- **Combo trip:** verdeling via `idealA / (idealA + idealB)` ratio, alleen `min_days` als ondergrens

Dit zorgt dat alle trips eerlijk vergeleken worden: een Italië-trip bij 21 ingestelde dagen gebruikt ook 21 dagen, net als Japan. Zo wint een goedkoop land niet puur door een korte verblijfsduur.

### Vliegkosten
Per leg opgezocht in `flightData` (uit FLIGHTS tab) via `flightLegCost(from, to)`:
- Bepaalt het seizoen van het doelland op basis van `U.startMonth`
- Kiest `low_season_cost`, `mid_season_cost` of `high_season_cost`
- Voor X→NL wordt het vertrekland gebruikt voor seizoensbepaling

Totaal: `NL→A + A→B (als combo) + B→NL` × aantal reizigers

### Seizoensscore
Dynamisch berekend via `countrySeasonScore()` — geen sync nodig na het wijzigen van de reisperiode:
- High: telt alleen piekseizoen-maanden in jouw reiswindow
- Mid: telt piek + midseizoen-maanden
- Low: telt alles behalve piekseizoen (goedkoop/rustig)

---

## Ranking (`calcAndRank` in js/app.js)

Elke trip krijgt een `finalScore`:
```
finalScore = prefWeight × pctPref
           + budgetWeight × pctBudget
           + fatigueWeight × pctFatigue
           + seasonWeight × pctSeason
```

Alle onderdelen zijn percentielrangschikkingen (0–100) zodat ze vergelijkbaar zijn. `seasonWeight` volgt uit `SEASON_WEIGHT[U.seasonPref]` (High=2.0, Mid=1.0, Low=0.3, No=0.0).

**Tiers** op basis van positie in de ranking:
- TOP TIER (groen): top 25%
- GOOD (geel): 25–50%
- MID (oranje): 50–75%
- LOW (rood): onderste 25%

---

## Filters (bovenaan resultaten)

| Filter | Logica |
|--------|--------|
| ⭐ Best within budget | Finale ranking score, alle factoren |
| 💰 Best for my budget | `prefRaw × (cost / budget)` — beloont trips die budget goed benutten |
| 🏷 Cheapest | Sorteert op totale kosten oplopend |
| 🧗 Adventure | Sorteert op adventure_score |
| ✈ Combos | Alleen trips met 2 landen |
| 😌 Low fatigue | Sorteert op fatigue_penalty oplopend |
| 🌞 In season | Sorteert op seizoensscore |
| 🍜 Food & culture | Sorteert op food_score + culture_score |

---

## Instellingen (sidebar)

| Instelling | Effect |
|-----------|--------|
| Budget | Hard filter + budget fit score in ranking |
| Trip duration | Dagverdeling over landen, bepaalt haalbaarheid |
| Travelers | Vluchten ×N, dagkosten ×(0.55+0.45×N) bij shared, ×N bij separate |
| Travel style | Kiest dagkostenkolom uit COUNTRIES tab |
| Max countries | 1 land / tot 2 landen / alleen combos |
| Avoid long flights | Filtert trips met `is_intercontinental=TRUE` |
| Travel period | Start/eindmaand bepaalt vliegkosten én seizoensscore |
| Season preference | Weging van seizoensscore in ranking (High/Mid/Low/No) |
| Travel style weights | Hoe zwaar elk stijlaspect telt in `prefRaw` |
| Ranking weights | Gewicht van stijl, budget en vermoeidheid in `finalScore` |

---

## Features

- **Wereldkaart** (Leaflet) met gekleurde pins per tier — klik pin → scrollt naar card
- **Vergelijkmodus** — pin tot 3 trips met + knop, vergelijk naast elkaar
- **Dark mode** — 🌙 knop in header, voorkeur opgeslagen in localStorage
- **PWA** — installeerbaar als app, werkt offline na één Sync
- **Stale data warning** — gele waarschuwing als data ouder is dan 7 dagen

---

## Technische stack

- Vanilla HTML/CSS/JS — geen frameworks, geen build tools
- Leaflet.js voor de kaart
- Google Sheets als database (CSV export via publish-to-web)
- GitHub Pages voor hosting
- Service worker (`sw.js`) voor offline caching

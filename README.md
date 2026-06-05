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
| SETTINGS | 0 | Alleen nog aanwezig in sheet — **app laadt dit niet meer in** |
| TRIP_ENGINE | 2103068682 | Trips: min/ideal/max days, fatigue, stijlscores |
| FILTER_ENGINE | 431668285 | Filterdata per trip (intercontinentaal, etc.) |
| COUNTRIES | 2119597216 | Per land: dagkosten per stijl, seizoensdefinities, scores, sub_region |
| FLIGHTS | 99695727 | Vliegkosten per route per seizoen (low/mid/high), region_cluster |

De app bevat momenteel **33 landen**. Nieuwe landen toevoegen: vul een rij in COUNTRIES in + de bijbehorende NL↔land routes in FLIGHTS. Inter-country routes zijn optioneel — die activeren combo-trips met dat land. Kant-en-klare import-CSV's staan in `sheets-import/`.

De sheet bevat ook een development log (GID 1912455839) en FILTER_RESULTS (GID 28259201) die de app niet gebruikt.

**Belangrijk:** de JS-defaults in `U` (js/app.js) zijn altijd het startpunt bij het laden van de app. De SETTINGS-tab van de sheet heeft geen effect op de UI meer — die is alleen nog voor de sheet's eigen berekeningen.

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
`U.days` (trip duration instelling) is altijd het maximum — de app heeft geen apart max cap. Alleen `min_days` geldt als harde ondergrens.

- **Single trip:** altijd `daysA = U.days` — de hele vakantie in dat land
- **Combo trip:** verdeling via `idealA / (idealA + idealB)` ratio, alleen `min_days` als ondergrens

Dit zorgt dat alle trips eerlijk vergeleken worden: Italië bij 21 dagen = 21 × €75, Japan bij 21 dagen = 21 × €130. Goedkope landen winnen niet meer door een korte max-verblijfsduur.

### Overstay penalty
`max_days` uit de sheet wordt nog wel gebruikt voor een score-penalty. Als een land voor langere tijd minder zinvol is (bijv. Brunei max 6 dagen), wordt de finale score verlaagd:

```
finalScore × 1 / (1 + overstay)
```

waarbij `overstay = (daysA - max_days) / max_days`. Brunei 21 dagen (max 6) → overstay=2.5 → score ×0.29. Trip blijft zichtbaar maar staat laag in de ranking.

### Vliegkosten
Per leg opgezocht in `flightData` (uit FLIGHTS tab) via `flightLegCost(from, to)`:
- Bepaalt het seizoen van het doelland op basis van `U.startMonth`
- Kiest `low_season_cost`, `mid_season_cost` of `high_season_cost`
- Voor X→NL wordt het vertrekland gebruikt voor seizoensbepaling

Totaal: `NL→A + A→B (als combo) + B→C (als triple) + laatste→NL` × aantal reizigers

### Combo-logica
Combos worden gegenereerd op basis van beschikbare vliegroutes in FLIGHTS — niet beperkt per regio. Enige constraint voor **3-lands combos**: de route A→B→C moet geografisch aaneengesloten zijn. Dit wordt gecontroleerd via `SUBREGION_ADJACENT` (constante in app.js): sub-regio van A moet grenzen aan sub-regio van B, en B aan C.

- `region_cluster` in FLIGHTS (`Europe` / `Intercontinental`) bepaalt de "Europe only" / "Outside Europe" filterknop — alleen gebaseerd op de eerste bestemming (`NL→A`).
- `sub_region` in COUNTRIES bepaalt de adjacency-check voor 3-country combos. Als een land geen sub_region heeft, wordt de check overgeslagen.

### Seizoensscore
Dynamisch berekend via `countrySeasonScore()` — geen sync nodig na het wijzigen van de reisperiode:
- High: telt alleen piekseizoen-maanden in jouw reiswindow
- Mid: telt piek + midseizoen-maanden
- Low: telt alles behalve piekseizoen (goedkoop/rustig)

---

## Ranking (`calcAndRank` + `rankCalced` in js/app.js)

Elke trip krijgt een `finalScore`:
```
finalScore = (prefWeight  × pctPref
           + budgetWeight × budgetScore
           + fatigueWeight × pctFatigue
           + seasonWeight  × pctSeason)
           × 1/(1 + overstay)
           × comboFactor
```

- `pctPref`, `pctFatigue`, `pctSeason` zijn percentielrangschikkingen (0–100)
- `budgetScore` is een **vaste 0–100 schaal** via `calcBudgetScore()` — geen percentiel:
  - Binnen budget: `50 + (ruimte / budget × 50)` → 50–100
  - Boven budget: `50 × (1 − overshoot)²` → 0–50, zachte kwadratische curve
  - 5% over = 45, 10% over = 40, 33% over = 22, 50% over = 12
- `budgetWeight = 0` → budget telt helemaal niet, ook geen verborgen penalty
- `seasonWeight` = gewicht van seizoensscore, instelbaar via "What matters most" slider
- `overstay` multiplier = straf voor te lang in één land
- `comboFactor` = 1.08 voor combo trips, 1.0 voor single

**Standaard ranking weights:** Travel style=8, Budget fit=5, Low fatigue=2.

`rankCalced()` is een gedeelde helper voor zowel normale ranking als 🎯 Ideal trip filter.

**Tiers** op basis van positie in de ranking:
- TOP TIER (groen): top 25%
- GOOD (geel): 25–50%
- MID (oranje): 50–75%
- LOW (rood): onderste 25%

---

## Filters (bovenaan resultaten)

| Filter | Logica |
|--------|--------|
| ⭐ Best within budget | Finale ranking score, alle factoren, alleen trips binnen budget |
| 💰 Best for my budget | `prefRaw × (cost / budget)` — beloont trips die budget goed benutten |
| 🏷 Cheapest | Sorteert op totale kosten oplopend |
| 🧗 Adventure | Sorteert op adventure_score |
| 😌 Low fatigue | Sorteert op fatigue_penalty oplopend |
| 🌞 In season | Sorteert op seizoensscore |
| 🍜 Food & culture | Sorteert op food_score + culture_score |
| 🎯 Ideal trip | Gebruikt `ideal_days` per land i.p.v. `U.days` — toont ook trips boven budget (scoren lager). Laat zien wat een ideale trip per bestemming kost. |

---

## Instellingen (sidebar)

| Instelling | Effect |
|-----------|--------|
| Budget | Hard filter + budget fit score in ranking |
| Trip duration | Dagverdeling over landen, bepaalt haalbaarheid |
| Travelers | Vluchten ×N, dagkosten ×(0.55+0.45×N) bij shared, ×N bij separate. Bij 2+ toont sidebar budget per persoon en kaarten tonen kosten per persoon |
| Travel style | Kiest dagkostenkolom uit COUNTRIES tab |
| Countries per trip | Slider 1–3 + "Exact count only" toggle |
| Flight range | All destinations / Europe only / Outside Europe — filtert op `region_cluster` van eerste bestemming |
| Travel period | Start/eindmaand bepaalt vliegkosten én seizoensscore |
| Season preference | Type seizoen dat voorkeur heeft (High/Mid/Low/No) |
| Travel style weights | Hoe zwaar elk stijlaspect telt in `prefRaw` |
| What matters most | Gewicht van stijl, budget en seizoen in `finalScore` |

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

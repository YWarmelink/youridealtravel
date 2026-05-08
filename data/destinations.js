// Class 1 = Backpack / High value
// Class 2 = Mid premium
// Class 3 = Premium bucket list
// fatigue: 1=low  2=medium  3=high (backpacking/altitude)
// latlon: [lat, lon] for Leaflet map

export const destinations = [
  // — Class 1 ——————————————————————————————————————
  {
    id: "malaysia",    name: "Malaysia",         class: 1,
    continent: "asia", region: "southeast-asia",
    flight: 700, dailyCost: 60, tripDays: 16, fatigue: 2,
    bestMonths: [11, 12, 1, 2, 3],
    latlon: [3.14, 101.69],
  },
  {
    id: "brunei",      name: "Brunei",            class: 1,
    continent: "asia", region: "southeast-asia",
    flight: 800, dailyCost: 70, tripDays: 6, fatigue: 1,
    bestMonths: [1, 2, 3, 6, 7, 8],
    latlon: [4.94, 114.95],
  },
  {
    id: "uzbekistan",  name: "Uzbekistan",        class: 1,
    continent: "asia", region: "central-asia",
    flight: 500, dailyCost: 50, tripDays: 14, fatigue: 2,
    bestMonths: [4, 5, 9, 10],
    latlon: [41.30, 64.59],
  },
  {
    id: "kyrgyzstan",  name: "Kyrgyzstan",        class: 1,
    continent: "asia", region: "central-asia",
    flight: 600, dailyCost: 45, tripDays: 16, fatigue: 3,
    bestMonths: [6, 7, 8, 9],
    latlon: [42.87, 74.59],
  },
  {
    id: "laos",        name: "Laos",              class: 1,
    continent: "asia", region: "southeast-asia",
    flight: 700, dailyCost: 45, tripDays: 14, fatigue: 2,
    bestMonths: [11, 12, 1, 2, 3],
    latlon: [17.97, 102.63],
  },
  {
    id: "vietnam",     name: "Vietnam",           class: 1,
    continent: "asia", region: "southeast-asia",
    flight: 600, dailyCost: 55, tripDays: 16, fatigue: 2,
    bestMonths: [2, 3, 4, 10, 11],
    latlon: [21.03, 105.83],
  },
  {
    id: "georgia",     name: "Georgia",           class: 1,
    continent: "asia", region: "caucasus",
    flight: 300, dailyCost: 60, tripDays: 14, fatigue: 1,
    bestMonths: [4, 5, 6, 9, 10],
    latlon: [41.69, 44.83],
  },
  {
    id: "armenia",     name: "Armenia",           class: 1,
    continent: "asia", region: "caucasus",
    flight: 350, dailyCost: 55, tripDays: 14, fatigue: 1,
    bestMonths: [4, 5, 6, 9, 10],
    latlon: [40.18, 44.51],
  },
  {
    id: "azerbaijan",  name: "Azerbaijan",        class: 1,
    continent: "asia", region: "caucasus",
    flight: 350, dailyCost: 60, tripDays: 14, fatigue: 1,
    bestMonths: [4, 5, 6, 9, 10],
    latlon: [40.41, 49.87],
  },
  {
    id: "turkey",      name: "Turkey",            class: 1,
    continent: "asia", region: "mediterranean",
    flight: 200, dailyCost: 75, tripDays: 14, fatigue: 1,
    bestMonths: [4, 5, 9, 10],
    latlon: [38.96, 35.24],
  },
  {
    id: "taiwan",      name: "Taiwan",            class: 1,
    continent: "asia", region: "east-asia",
    flight: 800, dailyCost: 80, tripDays: 14, fatigue: 1,
    bestMonths: [3, 4, 5, 9, 10, 11],
    latlon: [25.04, 121.56],
  },
  {
    id: "south-korea", name: "South Korea",       class: 1,
    continent: "asia", region: "east-asia",
    flight: 750, dailyCost: 90, tripDays: 14, fatigue: 1,
    bestMonths: [4, 5, 9, 10],
    latlon: [37.57, 126.98],
  },
  {
    id: "balkans",     name: "Balkans",           class: 1,
    continent: "europe", region: "balkans",
    flight: 180, dailyCost: 65, tripDays: 14, fatigue: 2,
    bestMonths: [5, 6, 7, 8, 9],
    latlon: [44.82, 20.46],
  },
  {
    id: "iceland",     name: "Iceland",           class: 1,
    continent: "europe", region: "north-europe",
    flight: 250, dailyCost: 160, tripDays: 12, fatigue: 2,
    bestMonths: [6, 7, 8, 12, 1, 2],
    latlon: [64.14, -21.89],
  },
  // — Class 2 ——————————————————————————————————————
  {
    id: "colombia",    name: "Colombia",          class: 2,
    continent: "americas", region: "south-america",
    flight: 750, dailyCost: 65, tripDays: 16, fatigue: 2,
    bestMonths: [12, 1, 2, 3, 7, 8],
    latlon: [4.71, -74.07],
  },
  {
    id: "brazil",      name: "Brazil",            class: 2,
    continent: "americas", region: "south-america",
    flight: 850, dailyCost: 80, tripDays: 16, fatigue: 2,
    bestMonths: [6, 7, 8, 9],
    latlon: [-15.78, -47.93],
  },
  {
    id: "china",       name: "China",             class: 2,
    continent: "asia", region: "east-asia",
    flight: 750, dailyCost: 70, tripDays: 16, fatigue: 2,
    bestMonths: [4, 5, 9, 10],
    latlon: [39.91, 116.39],
  },
  {
    id: "egypt",       name: "Egypt",             class: 2,
    continent: "africa", region: "north-africa",
    flight: 400, dailyCost: 55, tripDays: 14, fatigue: 1,
    bestMonths: [10, 11, 12, 1, 2, 3],
    latlon: [30.04, 31.24],
  },
  {
    id: "canada",      name: "Canada West Coast", class: 2,
    continent: "americas", region: "north-america",
    flight: 750, dailyCost: 130, tripDays: 14, fatigue: 1,
    bestMonths: [6, 7, 8, 9],
    latlon: [49.25, -123.12],
  },
  // — Class 3 ——————————————————————————————————————
  {
    id: "japan",       name: "Japan",             class: 3,
    continent: "asia", region: "east-asia",
    flight: 850, dailyCost: 130, tripDays: 19, fatigue: 1,
    bestMonths: [3, 4, 10, 11],
    latlon: [35.68, 139.69],
  },
  {
    id: "peru",        name: "Peru",              class: 3,
    continent: "americas", region: "south-america",
    flight: 1050, dailyCost: 70, tripDays: 19, fatigue: 3,
    bestMonths: [5, 6, 7, 8, 9],
    latlon: [-12.04, -77.03],
  },
  {
    id: "bolivia",     name: "Bolivia",           class: 3,
    continent: "americas", region: "south-america",
    flight: 1150, dailyCost: 55, tripDays: 19, fatigue: 3,
    bestMonths: [5, 6, 7, 8, 9, 10],
    latlon: [-16.50, -68.15],
  },
];

export const YEAR_BUDGETS = {
  2026: { min: 4500, max: 5500 },
  2027: { min: 5500, max: 6500 },
  2028: { min: 8500, max: 9500 },
};

export const EUROPE_TRIP_COST  = 600;
export const EUROPE_TRIP_DAYS  = 5;
export const EUROPE_TRIPS      = 2;

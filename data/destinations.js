// Class 1 = Backpack / High value
// Class 2 = Mid premium
// Class 3 = Premium bucket list
// fatigue: 1=low  2=medium  3=high (backpacking/altitude)
// coords: SVG viewBox 0 0 1000 500, calculated from lat/lon

export const destinations = [
  // — Class 1 ——————————————————————————————————————
  {
    id: "malaysia",    name: "Malaysia",         class: 1,
    continent: "asia", region: "southeast-asia",
    flight: 700, dailyCost: 60, tripDays: 16, fatigue: 2,
    bestMonths: [11, 12, 1, 2, 3],
    coords: [783, 238],
  },
  {
    id: "brunei",      name: "Brunei",            class: 1,
    continent: "asia", region: "southeast-asia",
    flight: 800, dailyCost: 70, tripDays: 6, fatigue: 1,
    bestMonths: [1, 2, 3, 6, 7, 8],
    coords: [819, 236],
  },
  {
    id: "uzbekistan",  name: "Uzbekistan",        class: 1,
    continent: "asia", region: "central-asia",
    flight: 500, dailyCost: 50, tripDays: 14, fatigue: 2,
    bestMonths: [4, 5, 9, 10],
    coords: [679, 135],
  },
  {
    id: "kyrgyzstan",  name: "Kyrgyzstan",        class: 1,
    continent: "asia", region: "central-asia",
    flight: 600, dailyCost: 45, tripDays: 16, fatigue: 3,
    bestMonths: [6, 7, 8, 9],
    coords: [707, 135],
  },
  {
    id: "laos",        name: "Laos",              class: 1,
    continent: "asia", region: "southeast-asia",
    flight: 700, dailyCost: 45, tripDays: 14, fatigue: 2,
    bestMonths: [11, 12, 1, 2, 3],
    coords: [785, 200],
  },
  {
    id: "vietnam",     name: "Vietnam",           class: 1,
    continent: "asia", region: "southeast-asia",
    flight: 600, dailyCost: 55, tripDays: 16, fatigue: 2,
    bestMonths: [2, 3, 4, 10, 11],
    coords: [791, 203],
  },
  {
    id: "georgia",     name: "Georgia",           class: 1,
    continent: "asia", region: "caucasus",
    flight: 300, dailyCost: 60, tripDays: 14, fatigue: 1,
    bestMonths: [4, 5, 6, 9, 10],
    coords: [625, 134],
  },
  {
    id: "armenia",     name: "Armenia",           class: 1,
    continent: "asia", region: "caucasus",
    flight: 350, dailyCost: 55, tripDays: 14, fatigue: 1,
    bestMonths: [4, 5, 6, 9, 10],
    coords: [630, 140],
  },
  {
    id: "azerbaijan",  name: "Azerbaijan",        class: 1,
    continent: "asia", region: "caucasus",
    flight: 350, dailyCost: 60, tripDays: 14, fatigue: 1,
    bestMonths: [4, 5, 6, 9, 10],
    coords: [637, 138],
  },
  {
    id: "turkey",      name: "Turkey",            class: 1,
    continent: "asia", region: "mediterranean",
    flight: 200, dailyCost: 75, tripDays: 14, fatigue: 1,
    bestMonths: [4, 5, 9, 10],
    coords: [591, 139],
  },
  {
    id: "taiwan",      name: "Taiwan",            class: 1,
    continent: "asia", region: "east-asia",
    flight: 800, dailyCost: 80, tripDays: 14, fatigue: 1,
    bestMonths: [3, 4, 5, 9, 10, 11],
    coords: [836, 184],
  },
  {
    id: "south-korea", name: "South Korea",       class: 1,
    continent: "asia", region: "east-asia",
    flight: 750, dailyCost: 90, tripDays: 14, fatigue: 1,
    bestMonths: [4, 5, 9, 10],
    coords: [855, 150],
  },
  {
    id: "balkans",     name: "Balkans",           class: 1,
    continent: "europe", region: "balkans",
    flight: 180, dailyCost: 65, tripDays: 14, fatigue: 2,
    bestMonths: [5, 6, 7, 8, 9],
    coords: [561, 131],
  },
  {
    id: "iceland",     name: "Iceland",           class: 1,
    continent: "europe", region: "north-europe",
    flight: 250, dailyCost: 160, tripDays: 12, fatigue: 2,
    bestMonths: [6, 7, 8, 12, 1, 2],
    coords: [450, 70],
  },
  // — Class 2 ——————————————————————————————————————
  {
    id: "colombia",    name: "Colombia",          class: 2,
    continent: "americas", region: "south-america",
    flight: 750, dailyCost: 65, tripDays: 16, fatigue: 2,
    bestMonths: [12, 1, 2, 3, 7, 8],
    coords: [294, 237],
  },
  {
    id: "brazil",      name: "Brazil",            class: 2,
    continent: "americas", region: "south-america",
    flight: 850, dailyCost: 80, tripDays: 16, fatigue: 2,
    bestMonths: [6, 7, 8, 9],
    coords: [356, 290],
  },
  {
    id: "china",       name: "China",             class: 2,
    continent: "asia", region: "east-asia",
    flight: 750, dailyCost: 70, tripDays: 16, fatigue: 2,
    bestMonths: [4, 5, 9, 10],
    coords: [823, 139],
  },
  {
    id: "egypt",       name: "Egypt",             class: 2,
    continent: "africa", region: "north-africa",
    flight: 400, dailyCost: 55, tripDays: 14, fatigue: 1,
    bestMonths: [10, 11, 12, 1, 2, 3],
    coords: [586, 175],
  },
  {
    id: "canada",      name: "Canada West Coast", class: 2,
    continent: "americas", region: "north-america",
    flight: 750, dailyCost: 130, tripDays: 14, fatigue: 1,
    bestMonths: [6, 7, 8, 9],
    coords: [158, 113],
  },
  // — Class 3 ——————————————————————————————————————
  {
    id: "japan",       name: "Japan",             class: 3,
    continent: "asia", region: "east-asia",
    flight: 850, dailyCost: 130, tripDays: 19, fatigue: 1,
    bestMonths: [3, 4, 10, 11],
    coords: [888, 151],
  },
  {
    id: "peru",        name: "Peru",              class: 3,
    continent: "americas", region: "south-america",
    flight: 1050, dailyCost: 70, tripDays: 19, fatigue: 3,
    bestMonths: [5, 6, 7, 8, 9],
    coords: [291, 275],
  },
  {
    id: "bolivia",     name: "Bolivia",           class: 3,
    continent: "americas", region: "south-america",
    flight: 1150, dailyCost: 55, tripDays: 19, fatigue: 3,
    bestMonths: [5, 6, 7, 8, 9, 10],
    coords: [323, 296],
  },
];

export const YEAR_BUDGETS = {
  2026: { min: 4500, max: 5500 },
  2027: { min: 5500, max: 6500 },
  2028: { min: 8500, max: 9500 },
};

export const EUROPE_TRIP_COST  = 600;  // per trip (vlucht + hotel + activiteiten)
export const EUROPE_TRIP_DAYS  = 5;    // vakantiedagen per stedentrip
export const EUROPE_TRIPS      = 2;

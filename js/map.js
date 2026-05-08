import { destinations } from "../data/destinations.js";
import { tripCost } from "./engine.js";

// Leaflet is loaded via CDN — available as global L
const CLASS_COLORS = { 1: "#6366f1", 2: "#f59e0b", 3: "#ef4444" };
const CLASS_LABELS = { 1: "High Value", 2: "Mid Premium", 3: "Bucket List" };

let leafletMap = null;
const markerRefs = {};

export function initMap() {
  leafletMap = L.map("map", {
    center: [20, 30],
    zoom: 2,
    zoomControl: true,
    scrollWheelZoom: true,
  });

  L.tileLayer("https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png", {
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/">CARTO</a>',
    subdomains: "abcd",
    maxZoom: 19,
  }).addTo(leafletMap);

  for (const dest of destinations) {
    const [lat, lon] = dest.latlon;
    const color = CLASS_COLORS[dest.class];

    const marker = L.circleMarker([lat, lon], {
      radius: 8,
      fillColor: color,
      color: "#fff",
      weight: 2,
      opacity: 1,
      fillOpacity: 0.85,
    }).addTo(leafletMap);

    const total = tripCost(dest);
    marker.bindPopup(`
      <div style="font-family:system-ui;min-width:160px">
        <div style="font-weight:700;font-size:14px;margin-bottom:4px">${dest.name}</div>
        <div style="color:#6366f1;font-size:11px;margin-bottom:6px">${CLASS_LABELS[dest.class]}</div>
        <div style="font-size:12px;color:#374151">
          ✈ €${dest.flight} vlucht<br>
          📅 ${dest.tripDays} dagen · €${dest.dailyCost}/dag<br>
          💰 ~€${total.toLocaleString("nl-NL")} totaal<br>
          🌤 Beste maanden: ${dest.bestMonths.map(m =>
            ["","Jan","Feb","Mrt","Apr","Mei","Jun","Jul","Aug","Sep","Okt","Nov","Dec"][m]
          ).join(", ")}
        </div>
      </div>
    `, { maxWidth: 220 });

    markerRefs[dest.id] = marker;
  }
}

export function updateMapUI(plans) {
  if (!leafletMap || !plans?.length) return;

  const plannedIds = new Set(plans[0].trips.map(t => t.id));
  const altIds     = new Set(plans.slice(1).flatMap(p => p.trips.map(t => t.id)));

  for (const dest of destinations) {
    const marker = markerRefs[dest.id];
    if (!marker) continue;

    if (plannedIds.has(dest.id)) {
      marker.setStyle({ fillColor: "#16a34a", radius: 12, weight: 3, color: "#fff" });
      marker.setZIndexOffset(1000);
    } else if (altIds.has(dest.id)) {
      marker.setStyle({ fillColor: "#f59e0b", radius: 9, weight: 2, color: "#fff" });
      marker.setZIndexOffset(500);
    } else {
      marker.setStyle({ fillColor: CLASS_COLORS[dest.class], radius: 7, weight: 1.5, color: "#fff" });
      marker.setZIndexOffset(0);
    }
  }
}

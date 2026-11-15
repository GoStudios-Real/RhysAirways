/* Rhys Airways — site data (mirrors the in-game Config: shared/Config.luau) */
const ROUTES = [
  { id: "SYD", city: "Sydney", airport: "Kingsford Smith Airport", country: "Australia", fare: 800, reward: 160, flightTime: "5h 05m", tz: "AEST", miles: 2130 },
  { id: "MEL", city: "Melbourne", airport: "Melbourne Airport", country: "Australia", fare: 750, reward: 150, flightTime: "4h 15m", tz: "AEST", miles: 2132 },
  { id: "BNE", city: "Brisbane", airport: "Brisbane Airport", country: "Australia", fare: 850, reward: 170, flightTime: "5h 20m", tz: "AEST", miles: 2838 },
  { id: "ADL", city: "Adelaide", airport: "Adelaide Airport", country: "Australia", fare: 600, reward: 120, flightTime: "3h 30m", tz: "ACST", miles: 1727 },
  { id: "DPS", city: "Bali (Denpasar)", airport: "Ngurah Rai International Airport", country: "Indonesia", fare: 1500, reward: 400, flightTime: "3h 50m", tz: "WITA", miles: 2585 },
  { id: "SIN", city: "Singapore", airport: "Changi Airport", country: "Singapore", fare: 2500, reward: 650, flightTime: "5h 30m", tz: "SGT", miles: 3858 },
  { id: "LHR", city: "London", airport: "Heathrow Airport", country: "United Kingdom", fare: 5000, reward: 1500, flightTime: "17h 40m", tz: "GMT", miles: 14498 },
];

const AIRCRAFT = [
  { id: "A320", name: "Airbus A320neo", seats: 24 },
  { id: "B737", name: "Boeing 737-800", seats: 28 },
  { id: "B787", name: "Boeing 787-9 Dreamliner", seats: 40 },
  { id: "A380", name: "Airbus A380-800", seats: 72 },
];

const CABINS = [
  { id: "economy", name: "Economy", multiplier: 1.0 },
  { id: "premium", name: "Premium Economy", multiplier: 1.5 },
  { id: "business", name: "Business", multiplier: 2.6 },
];

const RANKS = [
  { name: "Passenger", req: "Anyone who books a flight" },
  { name: "Ground Crew", req: "Pass the Ground School quiz in-game" },
  { name: "Check-in Agent", req: "Pass the Check-in quiz + rank up" },
  { name: "Cabin Crew", req: "Pass the Cabin Crew quiz" },
  { name: "Co-Pilot", req: "Senior flight crew track" },
  { name: "Pilot", req: "Senior flight crew track" },
  { name: "Air Traffic Controller", req: "Tower certification" },
  { name: "Supervisor", req: "Team leadership pathway" },
  { name: "Manager", req: "Operations leadership pathway" },
  { name: "Chief Operating Officer", req: "Executive pathway" },
];

/* deterministic pseudo-random from a string seed (stable flight numbers) */
function seedRand(seed) {
  let h = 2166136261 >>> 0;
  for (let i = 0; i < seed.length; i++) { h ^= seed.charCodeAt(i); h = Math.imul(h, 16777619); }
  return function () { h = Math.imul(h ^ (h >>> 13), 1274126177); h ^= h >>> 16; return (h >>> 0) / 4294967295; };
}

/* departures board rows for a date (deterministic per day) */
function dailyBoard(dateISO) {
  const day = dateISO || new Date().toISOString().slice(0, 10);
  const rows = [];
  let seq = 111;
  for (const route of ROUTES) {
    for (let i = 0; i < 2; i++) {
      const r = seedRand(day + route.id + i);
      const hour = Math.floor(4 + r() * 18);
      const minute = Math.floor(r() * 60);
      const ac = AIRCRAFT[Math.floor(r() * AIRCRAFT.length)];
      rows.push({
        flight: "RAX" + (seq + Math.floor(r() * 60)),
        city: route.city,
        code: route.id,
        time: String(hour).padStart(2, "0") + ":" + String(minute).padStart(2, "0"),
        aircraft: ac.id,
        bay: "BAY A" + (1 + Math.floor(r() * 4)),
        boarding: r() > 0.62,
      });
      seq += 7;
    }
  }
  return rows.sort((a, b) => a.time.localeCompare(b.time));
}

function bookingRef(seed) {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  const r = seedRand(seed + Date.now() + Math.random());
  let out = "";
  for (let i = 0; i < 6; i++) out += alphabet[Math.floor(r() * alphabet.length)];
  return out;
}

function currency(n) { return "$" + Number(n).toLocaleString("en-AU", { minimumFractionDigits: 2, maximumFractionDigits: 2 }); }
function taxFare(fare) { return Math.round(fare * 1.1 * 100) / 100; }

if (typeof module !== "undefined") { module.exports = { ROUTES, AIRCRAFT, CABINS, RANKS, dailyBoard, bookingRef, currency, taxFare }; }

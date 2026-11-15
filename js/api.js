/* Rhys Airways — Booking API: docs + live demo console.
   The demo validates an API key client-side (SHA-256) and simulates the
   endpoints in the browser. In production this gate sits behind a real
   backend (see README.md); never ship real secrets in front-end code. */
(function () {
  "use strict";
  const KEY_HASH = "f1c1b0470248cae0df48ab0320ded1f036ca95a3289f773e643a5858a8a53830";

  const $ = (id) => document.getElementById(id);
  const out = $("api-out");
  const unlocked = { value: false };

  async function sha256Hex(text) {
    const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(text));
    return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, "0")).join("");
  }

  function print(obj) { out.textContent = typeof obj === "string" ? obj : JSON.stringify(obj, null, 2); }

  $("api-unlock").addEventListener("click", async () => {
    const key = $("api-key").value.trim();
    if (!key) { print("Enter an API key first."); return; }
    const h = await sha256Hex(key);
    if (h === KEY_HASH) {
      unlocked.value = true;
      $("api-console").style.display = "block";
      $("api-gate").style.display = "none";
      print({ status: "authenticated", message: "Key accepted — demo console unlocked. Key was verified locally with SHA-256; nothing left your browser." });
    } else {
      print({ status: "error", code: "invalid_api_key", message: "That key does not match. Contact your airline IT admin for a valid key." });
    }
  });

  $("api-call").addEventListener("click", () => {
    if (!unlocked.value) { print("Unlock the console first."); return; }
    const endpoint = $("api-endpoint").value;
    if (endpoint === "GET /v1/flights") {
      const route = $("api-arg1").value.trim().toUpperCase() || "SYD";
      const r = ROUTES.find(x => x.id === route);
      print(r ? { endpoint: "GET /v1/flights?route=" + route, status: 200, flights: dailyBoard(new Date().toISOString().slice(0,10)).filter(f => f.code === route).slice(0, 5) } : { status: 404, code: "route_not_found", message: "Unknown route " + route });
      return;
    }
    if (endpoint === "POST /v1/bookings") {
      const routeId = ($("api-arg1").value.trim().toUpperCase() || "SYD");
      const pax = Math.max(1, Math.min(9, parseInt($("api-arg2").value || "1", 10) || 1));
      const r = ROUTES.find(x => x.id === routeId);
      if (!r) { print({ status: 404, code: "route_not_found", message: "Unknown route " + routeId }); return; }
      const pnr = bookingRef(routeId + Date.now());
      const cfg = window.RHYS_DISPATCH || {};
      if (cfg.token) {
        fetch(`https://api.github.com/repos/${cfg.repo}/dispatches`, {
          method: "POST",
          headers: { "Accept": "application/vnd.github+json", "Authorization": "Bearer " + cfg.token },
          body: JSON.stringify({ event_type: "rhys-booking", client_payload: { route: routeId, date: new Date(Date.now() + 86400000).toISOString().slice(0, 10), passengers: pax, cabin: "economy", name: "API Console", email: "api@rhysairways.example.com", flight: "RAX" + (100 + Math.floor(Math.random() * 880)), depart: "06:00", pnr } }),
        }).then(resp => print({ endpoint: "POST /v1/bookings", status: resp.status === 204 ? 202 : resp.status, dispatched: resp.status === 204, pnr, note: "Queued to the Rhys Airways booking backend (GitHub Actions). Record will appear at data/bookings/" + pnr + ".json — fetchable via raw.githubusercontent.com." }))
          .catch(err => print({ endpoint: "POST /v1/bookings", status: 0, code: "network_error", message: String(err) }));
        return;
      }
      print({
        endpoint: "POST /v1/bookings",
        status: 201,
        booking: { pnr, flight: "RAX" + (100 + Math.floor(Math.random() * 880)), route: r.id, to: r.city, passengers: pax, cabin: "economy", total_aud: r.fare * pax, status: "CONFIRMED", note: "Demo booking — set a dispatch token in js/config.js to hit the real backend." },
      });
      return;
    }
    if (endpoint === "GET /v1/airline") {
      print({ endpoint: "GET /v1/airline", status: 200, airline: { name: "Rhys Airways", iata: "RAX", callsign: "RHYS AIR", hub: "PER — Perth International", destinations: ROUTES.length, aircraft: AIRCRAFT.map(a => a.id) } });
    }
  });

  /* wire form defaults */
  $("api-endpoint").addEventListener("change", () => {
    const ep = $("api-endpoint").value;
    $("api-arg1").placeholder = ep === "POST /v1/bookings" ? "Route code e.g. SYD" : ep === "GET /v1/flights" ? "Route code e.g. SYD" : "(no argument)";
    $("api-arg2").style.visibility = ep === "POST /v1/bookings" ? "visible" : "hidden";
  });
  $("api-endpoint").dispatchEvent(new Event("change"));
})();

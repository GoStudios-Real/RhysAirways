/* Rhys Airways — booking engine (front-end demo backed by localStorage) */
(function () {
  "use strict";

  const $ = (id) => document.getElementById(id);
  const destSel = $("f-dest");
  const cabinSel = $("f-cabin");
  const paxSel = $("f-pax");

  destSel.innerHTML = ROUTES.map((r) => `<option value="${r.id}">${r.city} (${r.id}) — ${r.flightTime}</option>`).join("");
  cabinSel.innerHTML = CABINS.map((c) => `<option value="${c.id}">${c.name}${c.multiplier > 1 ? " ×" + c.multiplier : ""}</option>`).join("");
  paxSel.innerHTML = Array.from({ length: 6 }, (_, i) => `<option value="${i + 1}">${i + 1} passenger${i ? "s" : ""}</option>`).join("");
  $("f-date").value = new Date(Date.now() + 86400000).toISOString().slice(0, 10);
  $("f-date").min = new Date().toISOString().slice(0, 10);

  function randFlight(routeId, seedStr) {
    let h = 2166136261 >>> 0;
    for (let i = 0; i < seedStr.length; i++) { h ^= seedStr.charCodeAt(i); h = Math.imul(h, 16777619); }
    h = Math.imul(h ^ (h >>> 13), 1274126177); h ^= h >>> 16;
    const r = (h >>> 0) / 4294967295;
    return { number: "RAX" + (100 + Math.floor(r * 880)), aircraft: AIRCRAFT[Math.floor(r * AIRCRAFT.length)], depart: String(4 + Math.floor(r * 17)).padStart(2, "0") + ":" + String(Math.floor(r * 60)).padStart(2, "0") };
  }

  function renderResults(route, date, pax, cabin, promo) {
    const promoDiscount = /^RHYS10$/i.test(promo || "") ? 0.1 : /^RHYS25$/i.test(promo || "") ? 0.25 : 0;
    const cabinMult = CABINS.find((c) => c.id === cabin).multiplier;
    const fare = Math.round(route.fare * cabinMult * (1 - promoDiscount));
    const out = [];
    for (let i = 0; i < 3; i++) {
      const f = randFlight(route.id, route.id + date + i);
      out.push(`<div class="flight-result">
        <div>
          <div class="flight-times">${f.depart} <span style="color:var(--sky-light)">→</span> ${route.id}</div>
          <div class="flight-route">Perth → ${route.city} · ${route.flightTime} · ${f.number}</div>
          <div class="flight-aircraft">${f.aircraft.name} · seat ${f.aircraft.seats} pax max · ${route.miles} mi</div>
        </div>
        <div class="flight-price">
          <b>${currency(fare)}</b><br><small style="color:var(--grey)">per passenger${promoDiscount ? " · promo applied" : ""}</small><br>
          <button class="btn btn-sky" style="margin-top:8px;" data-pick='${JSON.stringify({ flight: f.number, aircraft: f.aircraft.id, depart: f.depart, fare, pax: Number(pax), cabin })}'>Select</button>
        </div>
      </div>`);
    }
    return out.join("");
  }

  $("search-form").addEventListener("submit", (e) => {
    e.preventDefault();
    const route = ROUTES.find((r) => r.id === destSel.value);
    const html = renderResults(route, $("f-date").value, paxSel.value, cabinSel.value, $("f-promo").value);
    $("results").innerHTML = `<div class="section-head" style="margin-bottom:8px;"><div><h2 style="font-size:20px">Flights to ${route.city}</h2><p class="sub">${$("f-date").value} · ${paxSel.value} passenger(s) · ${CABINS.find(c => c.id === cabinSel.value).name}</p></div></div>` + html;
    $("confirm").innerHTML = "";
    window.showToast("Found " + 3 + " flights to " + route.city);
  });

  $("results").addEventListener("click", (e) => {
    const btn = e.target.closest("[data-pick]");
    if (!btn) return;
    const pick = JSON.parse(btn.getAttribute("data-pick"));
    const route = ROUTES.find((r) => r.id === destSel.value);
    $("confirm").innerHTML = `
      <form id="pax-form" class="booking-panel" style="margin-top:16px;">
        <h2 style="font-size:18px; margin-bottom:10px;">Passenger details</h2>
        <div class="form-grid" style="grid-template-columns: 1fr 1fr 1fr;">
          <label class="field">Full name<input id="p-name" required placeholder="Jordan Smith" maxlength="60"></label>
          <label class="field">Email<input id="p-email" required type="email" placeholder="you@example.com"></label>
          <label class="field">Frequent flyer no.<input id="p-ff" placeholder="RAX-000000 — optional" maxlength="12"></label>
        </div>
        <div class="notice notice-sky" style="margin:12px 0;">${pick.pax} × ${pick.cabin === "economy" ? "Economy" : pick.cabin === "premium" ? "Premium Economy" : "Business"} on <b>${pick.flight}</b> — departs ${pick.depart}. Total: <b>${currency(pick.fare * pick.pax)}</b>. Pay at check-in, or in-game with Rhys Credits.</div>
        <button class="btn btn-red btn-block" type="submit">Confirm Booking — ${pick.flight}</button>
      </form>`;
    $("pax-form").addEventListener("submit", (ev) => {
      ev.preventDefault();
      const pnr = bookingRef(pick.flight + pick.depart);
      const booking = {
        pnr, flight: pick.flight, route: route.id, city: route.city,
        date: $("f-date").value, depart: pick.depart, cabin: pick.cabin,
        pax: pick.pax, fare: pick.fare, total: pick.fare * pick.pax,
        name: $("p-name").value.trim(), email: $("p-email").value.trim(),
        ff: $("p-ff").value.trim(), aircraft: pick.aircraft, created: new Date().toISOString(),
      };
      RhysBookings.add(booking);
      renderTicket(booking);
      window.scrollTo({ top: document.body.scrollHeight, behavior: "smooth" });

      const cfg = window.RHYS_DISPATCH || {};
      if (cfg.token) {
        fetch(`https://api.github.com/repos/${cfg.repo}/dispatches`, {
          method: "POST",
          headers: { "Accept": "application/vnd.github+json", "Authorization": "Bearer " + cfg.token },
          body: JSON.stringify({ event_type: "rhys-booking", client_payload: { route: route.id, date: booking.date, passengers: booking.pax, cabin: booking.cabin, name: booking.name, email: booking.email, flight: booking.flight, depart: booking.depart, pnr: booking.pnr } }),
        }).then((r) => window.showToast(r.status === 204 ? "Booking synced to Rhys Airways servers." : "Saved locally; server sync failed (" + r.status + ")."))
          .catch(() => window.showToast("Saved locally; server unreachable."));
      } else {
        window.showToast("Demo mode — booking stored in your browser. See README for enabling the real backend.");
      }
    });
  });

  function barcode(seed) {
    let h = 2166136261 >>> 0;
    for (let i = 0; i < seed.length; i++) { h ^= seed.charCodeAt(i); h = Math.imul(h, 16777619); }
    let html = "";
    for (let i = 0; i < 34; i++) { h = Math.imul(h ^ (h >>> 13), 1274126177); h ^= h >>> 16; const w = 2 + (h % 5); html += `<span style="width:${w}px"></span>`; }
    return html;
  }

  function renderTicket(b) {
    $("confirm").innerHTML = `
      <div class="ticket" id="eticket">
        <div class="ticket-head">
          <div><div style="font-size:10px; letter-spacing:0.3em; color:#7ec4ff">BOARDING PASS</div>
          <div style="font-weight:900; font-size:18px">RHYS AIRWAYS</div></div>
          <div style="text-align:right"><div style="font-size:10px; color:#7ec4ff">FLIGHT</div><div style="font-weight:900; font-size:18px">${b.flight}</div></div>
        </div>
        <div class="ticket-body">
          <div><div class="ticket-city">From</div><div class="ticket-code">PER</div></div>
          <svg width="70" height="40" viewBox="0 0 70 40" aria-hidden="true"><path d="M2 22 L62 12 L40 34 L30 22 Z" fill="#0b1f3a"/><path d="M2 22 L62 12 L56 24 L30 24 Z" fill="#d63031"/></svg>
          <div><div class="ticket-city">To</div><div class="ticket-code">${b.route}</div></div>
        </div>
        <div class="ticket-meta">
          <div><b>PASSENGER</b><br>${escapeHtml(b.name)}</div>
          <div><b>DATE</b><br>${b.date}</div>
          <div><b>DEPARTS</b><br>${b.depart} · ${b.cabin.toUpperCase()}</div>
          <div><b>SEAT</b><br>${1 + Math.floor(Math.random() * 28)}A${Math.random() > 0.5 ? "F" : "W"}</div>
          <div><b>PNR</b><br><span class="mono" style="padding:2px 6px; font-size:13px;">${b.pnr}</span></div>
          <div><b>GATE</b><br>BAY A${(b.pnr.charCodeAt(0) % 4) + 1}</div>
        </div>
        <div style="padding: 0 18px 16px; display:flex; justify-content:space-between; align-items:center;">
          <div class="barcode">${barcode(b.pnr)}</div>
          <div style="font-size:10px; color:#666; text-align:right">TOTAL PAID<br><b style="color:#0b1f3a; font-size:14px">${currency(b.total)}</b></div>
        </div>
      </div>
      <div style="text-align:center; margin-top:14px;">
        <button class="btn btn-sky" onclick="window.print()">Print / Save e-ticket</button>
        <a class="btn btn-ghost" href="myflights.html" style="margin-left:8px;">My Bookings</a>
      </div>`;
  }

  function escapeHtml(s) { return String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c])); }
})();

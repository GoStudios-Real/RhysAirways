/* Rhys Airways — shared client behaviour */
(function () {
  "use strict";

  /* mobile nav */
  const toggle = document.querySelector(".nav-toggle");
  const links = document.querySelector(".nav-links");
  if (toggle && links) toggle.addEventListener("click", () => links.classList.toggle("open"));

  /* highlight current page */
  const here = (location.pathname.split("/").pop() || "index.html").toLowerCase();
  document.querySelectorAll(".nav-links a").forEach((a) => {
    if ((a.getAttribute("href") || "").toLowerCase() === here) a.classList.add("active");
  });

  /* toast */
  window.showToast = function (msg, ms) {
    let el = document.querySelector(".toast");
    if (!el) { el = document.createElement("div"); el.className = "toast"; document.body.appendChild(el); }
    el.textContent = msg;
    el.style.opacity = "1";
    clearTimeout(el._t);
    el._t = setTimeout(() => { el.style.opacity = "0"; }, ms || 4200);
  };

  /* bookings storage */
  window.RhysBookings = {
    all() { try { return JSON.parse(localStorage.getItem("rhysbookings") || "[]"); } catch { return []; } },
    add(b) { const list = this.all(); list.unshift(b); localStorage.setItem("rhysbookings", JSON.stringify(list)); return b; },
    find(pnr, email) {
      return this.all().find((b) => b.pnr === String(pnr || "").trim().toUpperCase()
        && (!email || b.email.toLowerCase() === String(email).trim().toLowerCase()));
    },
    cancel(pnr) {
      const list = this.all();
      const i = list.findIndex((b) => b.pnr === pnr);
      if (i >= 0) { list.splice(i, 1); localStorage.setItem("rhysbookings", JSON.stringify(list)); return true; }
      return false;
    },
  };

  /* render a live departures board if the placeholder exists */
  const board = document.getElementById("board-body");
  if (board && typeof dailyBoard === "function") {
    const rows = dailyBoard(new Date().toISOString().slice(0, 10)).slice(0, 8);
    board.innerHTML = rows.map((r) => `<div class="board-row">
      <span>${r.flight}</span>
      <span>Perth &rarr; ${r.city}</span>
      <span class="hide-sm">${r.time} · ${r.bay}</span>
      <span class="hide-sm">${r.aircraft}</span>
      <span>${r.boarding ? '<span class="tag tag-boarding">BOARDING</span>' : '<span class="tag tag-depart">SCHED</span>'}</span>
    </div>`).join("");
  }

  /* year in footer */
  document.querySelectorAll("[data-year]").forEach((el) => { el.textContent = new Date().getFullYear(); });
})();

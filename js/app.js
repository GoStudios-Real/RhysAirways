/* Rhys Airways — shared client behaviour (v2) */
(function () {
  "use strict";

  /* ---------- mobile nav ---------- */
  const toggle = document.querySelector(".nav-toggle");
  const links = document.querySelector(".nav-links");
  if (toggle && links) toggle.addEventListener("click", () => links.classList.toggle("open"));

  /* ---------- highlight current page ---------- */
  const here = (location.pathname.split("/").pop() || "index.html").toLowerCase();
  document.querySelectorAll(".nav-links a").forEach((a) => {
    if ((a.getAttribute("href") || "").toLowerCase() === here) a.classList.add("active");
  });

  /* ---------- toast ---------- */
  window.showToast = function (msg, ms) {
    let el = document.querySelector(".toast");
    if (!el) { el = document.createElement("div"); el.className = "toast"; document.body.appendChild(el); }
    el.textContent = msg;
    el.style.opacity = "1";
    clearTimeout(el._t);
    el._t = setTimeout(() => { el.style.opacity = "0"; }, ms || 4200);
  };

  /* ---------- bookings storage ---------- */
  window.RhysBookings = {
    all() { try { return JSON.parse(localStorage.getItem("rhysbookings") || "[]"); } catch { return []; } },
    add(b) { const list = this.all(); list.unshift(b); localStorage.setItem("rhysbookings", JSON.stringify(list)); this.refreshBadge(); return b; },
    find(pnr, email) {
      return this.all().find((b) => b.pnr === String(pnr || "").trim().toUpperCase()
        && (!email || b.email.toLowerCase() === String(email).trim().toLowerCase()));
    },
    cancel(pnr) {
      const list = this.all();
      const i = list.findIndex((b) => b.pnr === pnr);
      if (i >= 0) { list.splice(i, 1); localStorage.setItem("rhysbookings", JSON.stringify(list)); this.refreshBadge(); return true; }
      return false;
    },
    refreshBadge() {
      const el = document.querySelector("[data-booking-count]");
      if (!el) return;
      const n = this.all().length;
      el.textContent = n > 0 ? String(n) : "";
      el.style.display = n > 0 ? "inline-grid" : "none";
    },
  };
  window.RhysBookings.refreshBadge();

  /* ---------- live clock in boards: [data-clock] ---------- */
  const clocks = document.querySelectorAll("[data-clock]");
  if (clocks.length) {
    const tick = () => clocks.forEach((el) => {
      const d = new Date();
      el.textContent = d.toLocaleTimeString("en-AU", { hour: "2-digit", minute: "2-digit", second: "2-digit" });
    });
    tick();
    setInterval(tick, 1000);
  }

  /* ---------- departures marquee (duplicate for seamless loop) ---------- */
  const mq = document.querySelector(".ticker-inner");
  if (mq && typeof dailyBoard === "function") {
    const rows = dailyBoard(new Date().toISOString().slice(0, 10)).slice(0, 10);
    const html = rows.map((r) => `<b>${r.flight}</b> PER→${r.code} ${r.time}${r.boarding ? ' <span class="blink">BOARDING</span>' : ""}`).join("&nbsp;&nbsp;·&nbsp;&nbsp;");
    mq.innerHTML = html + "&nbsp;&nbsp;·&nbsp;&nbsp;" + html + "&nbsp;&nbsp;·&nbsp;&nbsp;";
  }

  /* ---------- full departures board ---------- */
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

  /* ---------- FAQ accordion ---------- */
  document.querySelectorAll(".faq-item").forEach((item) => {
    const btn = item.querySelector(".faq-q");
    if (!btn) return;
    btn.addEventListener("click", () => item.classList.toggle("open"));
    btn.setAttribute("aria-expanded", item.classList.contains("open") ? "true" : "false");
  });

  /* ---------- newsletter signup ---------- */
  const nlForm = document.getElementById("newsletter-form");
  if (nlForm) {
    nlForm.addEventListener("submit", (e) => {
      e.preventDefault();
      const email = document.getElementById("nl-email");
      const v = email.value.trim();
      if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(v)) { window.showToast("That email doesn't look right."); return; }
      try { localStorage.setItem("rhysnewsletter", v); } catch {}
      email.value = "";
      window.showToast("Welcome aboard the Rhys list, " + v.split("@")[0] + "! Deals land in your inbox soon.");
    });
  }

  /* ---------- back to top ---------- */
  const toTop = document.createElement("button");
  toTop.className = "to-top";
  toTop.innerHTML = "↑";
  toTop.setAttribute("aria-label", "Back to top");
  document.body.appendChild(toTop);
  const toggleTop = () => toTop.classList.toggle("show", window.scrollY > 420);
  window.addEventListener("scroll", toggleTop, { passive: true });
  toggleTop();
  toTop.addEventListener("click", () => window.scrollTo({ top: 0, behavior: "smooth" }));

  /* ---------- year in footer ---------- */
  document.querySelectorAll("[data-year]").forEach((el) => { el.textContent = new Date().getFullYear(); });
})();

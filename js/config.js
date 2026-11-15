/* Rhys Airways — public site config.
   Paste a fine-grained Personal Access Token to enable the real booking backend:
   Settings → Developer settings → Fine-grained tokens →
     Repository access: only GoStudios-Real/RhysAirways
     Permissions: Actions (read/write) — that's all it needs for repository_dispatch.
   Leave empty to run in local demo mode (bookings stay in your browser).
   NOTE: anything placed here is public on the internet. Scope the token tightly. */
window.RHYS_DISPATCH = {
  repo: "GoStudios-Real/RhysAirways",
  token: "",
};

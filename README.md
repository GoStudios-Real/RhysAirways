# Rhys Airways — Website & Booking API

The official Rhys Airways web presence: **Your Journey. Our Destination.**
Live site once Pages is enabled: **https://gostudios-real.github.io/RhysAirways/**

This repo hosts the static site (GitHub Pages) plus the Rhys Airways Booking API contract and a browser-based demo console.

## Pages
| Page | Purpose |
| --- | --- |
| `index.html` | Hero, live departures board, routes, stats |
| `book.html` | Full booking flow → e-ticket with PNR + barcode |
| `myflights.html` | PNR/email lookup + manage on-device bookings |
| `destinations.html` | All 7 destinations with fares and flight times |
| `careers.html` | The 10-rank career ladder + expression of interest |
| `api.html` | Booking API docs + live demo console |

## Booking API (v1)

**Auth:** `Authorization: Bearer rhys_live_…` (60 req/min, burst 20)

```
GET  /v1/flights?route=SYD
GET  /v1/airline
POST /v1/bookings     {"route":"SYD","date":"2026-11-20","passengers":2,"cabin":"economy",
                        "passenger":{"name":"Jordan Smith","email":"you@example.com"}}
GET  /v1/bookings/{pnr}
DELETE /v1/bookings/{pnr}
```

Errors: `401 invalid_api_key` · `404 route_not_found` · `422 validation` · `429 rate_limited`

### Demo API key
A demo key for trying the console on `api.html`:

```
rhys_live_4a4b431fe76cb75e6a51365ada7483f277be1a5c464df1e4
```

The website checks keys **client-side** (SHA-256 compare) — fine for a demo, never for real secrets.

### Production blueprint (reference)
1. Put a real API behind Cloudflare Workers / AWS API Gateway.
2. Store bookings in Postgres/D1; issue PNRs server-side.
3. Verify the Bearer key server-side; rate-limit at the edge.
4. Point `api.rhysairways.example.com` at it and swap the demo `fetch` stub in `js/api.js`.
5. Roblox HttpService can then create bookings from in-game kiosks directly (enable `HttpService`, call `/v1/bookings` with a server-side secret stored in `ServerStorage`, never on the client).

## Development
Static site — no build step. Serve locally:
```sh
python -m http.server --directory website 8080
```

## Real backend (GitHub Actions)

Bookings are **really stored** by this repo's `booking-api.yml` workflow:
1. The site fires a `repository_dispatch` (event `rhys-booking`) with the booking payload.
2. The workflow validates the payload (`scripts/record_booking.py`) and commits `data/bookings/<PNR>.json`.
3. Any device can read the booking at `https://raw.githubusercontent.com/GoStudios-Real/RhysAirways/main/data/bookings/<PNR>.json` — `myflights.html` does this automatically.

To enable **server sync from the public site**, create a fine-grained PAT:
- Settings → Developer settings → Fine-grained tokens → `RhysAirways site`
- Repository access: **only** `GoStudios-Real/RhysAirways`
- Permissions: **Actions: Read and write** (nothing else)
- Paste it into `js/config.js` (`token: "..."`) and commit.

Until then the site runs in demo mode (localStorage only). The PNR/barcode/e-ticket work either way.

## Deploy
Push to `main` — `.github/workflows/pages.yml` publishes `website/` to GitHub Pages.
Repo Settings → Pages → Source: **GitHub Actions**.

© Rhys Airways Pty Ltd · IATA RAX · A GoStudios-Real production.

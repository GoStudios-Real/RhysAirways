#!/usr/bin/env python3
"""Rhys Airways booking backend (runs inside GitHub Actions).

Triggered by `repository_dispatch` with event_type `rhys-booking`.
Reads the booking payload from the PAYLOAD environment variable,
validates it, and writes data/bookings/<PNR>.json for the site to read.
"""
import json
import os
import re
import sys

ROUTES = {"SYD", "MEL", "BNE", "ADL", "DPS", "SIN", "LHR"}
CABINS = {"economy", "premium", "business"}
PNR_ALPHABET = re.compile(r"^[A-Z2-9]{6}$")

def main() -> int:
    raw = os.environ.get("PAYLOAD", "")
    try:
        p = json.loads(raw)
    except Exception:
        print("invalid JSON payload")
        return 1

    route = str(p.get("route", "")).upper()
    if route not in ROUTES:
        print("invalid route:", route)
        return 1
    date = str(p.get("date", ""))
    if not re.match(r"^\d{4}-\d{2}-\d{2}$", date):
        print("invalid date:", date)
        return 1
    try:
        pax = int(p.get("passengers", 0))
    except (TypeError, ValueError):
        pax = 0
    if not 1 <= pax <= 9:
        print("invalid passengers:", pax)
        return 1
    cabin = str(p.get("cabin", "economy")).lower()
    if cabin not in CABINS:
        print("invalid cabin:", cabin)
        return 1
    name = str(p.get("name", "")).strip()
    if not (2 <= len(name) <= 60):
        print("invalid name")
        return 1
    email = str(p.get("email", "")).strip()
    if "@" not in email or len(email) > 80:
        print("invalid email")
        return 1
    pnr = str(p.get("pnr", "")).strip().upper()
    if not PNR_ALPHABET.match(pnr):
        print("invalid pnr:", pnr)
        return 1

    out_dir = os.path.join("data", "bookings")
    os.makedirs(out_dir, exist_ok=True)
    out_path = os.path.join(out_dir, pnr + ".json")
    if os.path.exists(out_path):
        print("pnr already exists:", pnr)
        return 1

    record = {
        "pnr": pnr,
        "route": route,
        "date": date,
        "passengers": pax,
        "cabin": cabin,
        "name": name,
        "email": email,
        "flight": str(p.get("flight", ""))[:10],
        "depart": str(p.get("depart", ""))[:5],
        "created_by": "web",
    }
    with open(out_path, "w", encoding="utf-8") as f:
        json.dump(record, f, indent=2)
    print("recorded booking", pnr)
    return 0

if __name__ == "__main__":
    sys.exit(main())

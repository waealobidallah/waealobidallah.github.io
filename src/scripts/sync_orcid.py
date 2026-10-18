#!/usr/bin/env python3
"""Pull works from the ORCID public API and merge NEW items into src/data/publications.json.
Existing items (matched by DOI, case-insensitive) keep their hand-edited fields (tags, selected, blurb, citations).
New items get their author list from the full work record and are flagged "review": true until curated at /admin."""
import json, re, sys, datetime, urllib.request
ORCID = "0000-0002-5086-3950"; PATH = "src/data/publications.json"; BASE = f"https://pub.orcid.org/v3.0/{ORCID}"
def get(url):
    req = urllib.request.Request(url, headers={"Accept": "application/json"})
    return json.load(urllib.request.urlopen(req, timeout=60))
def authors_of(putcode):
    try:
        w = get(f"{BASE}/work/{putcode}")
        names = []
        for c in (w.get("contributors") or {}).get("contributor", []):
            n = ((c.get("credit-name") or {}).get("value") or "").strip()
            if not n: continue
            parts = n.replace(",", " ").split()
            surname = parts[-1] if "," not in n else n.split(",")[0].strip()
            if "obidallah" in surname.lower(): surname = "Obidallah"
            names.append(surname)
        if names and not any("Obidallah" in x for x in names): names.append("Obidallah")
        return ", ".join(names) if names else "Obidallah et al."
    except Exception as e:
        print("contributors failed", putcode, e); return "Obidallah et al."
groups = get(f"{BASE}/works")["group"]
data = json.load(open(PATH, encoding="utf-8"))
have = {i["doi"].lower() for i in data["items"] if i.get("doi")}
added = 0; fixed = 0
for g in groups:
    s = g["work-summary"][0]
    doi = next((x["external-id-value"] for x in g["external-ids"]["external-id"] if x["external-id-type"] == "doi"), "")
    if not doi: continue
    if doi.lower() in have:
        # backfill authors for items previously synced without them
        it = next(i for i in data["items"] if i.get("doi", "").lower() == doi.lower())
        if it.get("authors", "").startswith("…") or it.get("new"):
            it["authors"] = authors_of(s["put-code"]); it.pop("new", None); it["review"] = True; fixed += 1
        continue
    t = (s.get("type") or "").lower()
    year = int((s.get("publication-date") or {}).get("year", {}).get("value") or 0)
    data["items"].append({"year": year, "type": "conference" if "conference" in t else "journal",
        "title": s["title"]["title"]["value"], "authors": authors_of(s["put-code"]),
        "venue": (s.get("journal-title") or {}).get("value", ""), "doi": doi, "tags": [], "role": "co-author", "review": True})
    have.add(doi.lower()); added += 1
if added or fixed:
    data["metrics"]["journal"] = sum(1 for i in data["items"] if i["type"] == "journal")
    data["metrics"]["conference"] = sum(1 for i in data["items"] if i["type"] == "conference")
    data["updated"] = datetime.date.today().isoformat()
    json.dump(data, open(PATH, "w", encoding="utf-8"), ensure_ascii=False, indent=2)
print(f"ORCID sync: {added} new, {fixed} backfilled")

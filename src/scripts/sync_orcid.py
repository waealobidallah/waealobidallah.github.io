#!/usr/bin/env python3
"""Pull works from the ORCID public API and merge NEW items into src/data/publications.json.
Existing items (matched by DOI) keep their hand-edited fields (tags, selected, blurb, citations)."""
import json, re, sys, urllib.request
ORCID = "0000-0002-5086-3950"; PATH = "src/data/publications.json"
req = urllib.request.Request(f"https://pub.orcid.org/v3.0/{ORCID}/works", headers={"Accept": "application/json"})
groups = json.load(urllib.request.urlopen(req, timeout=60))["group"]
data = json.load(open(PATH, encoding="utf-8"))
have = {i["doi"].lower() for i in data["items"] if i.get("doi")}
added = 0
for g in groups:
    s = g["work-summary"][0]
    doi = next((x["external-id-value"] for x in g["external-ids"]["external-id"] if x["external-id-type"] == "doi"), "")
    if not doi or doi.lower() in have: continue
    t = (s.get("type") or "").lower()
    year = int((s.get("publication-date") or {}).get("year", {}).get("value") or 0)
    data["items"].append({"year": year, "type": "conference" if "conference" in t else "journal",
        "title": s["title"]["title"]["value"], "authors": "… Obidallah …", "venue": (s.get("journal-title") or {}).get("value", ""),
        "doi": doi, "tags": [], "role": "co-author", "new": True})
    added += 1
if added:
    data["metrics"]["journal"] = sum(1 for i in data["items"] if i["type"] == "journal")
    data["metrics"]["conference"] = sum(1 for i in data["items"] if i["type"] == "conference")
    import datetime; data["updated"] = datetime.date.today().isoformat()
    json.dump(data, open(PATH, "w", encoding="utf-8"), ensure_ascii=False, indent=2)
print(f"ORCID sync: {added} new item(s)")

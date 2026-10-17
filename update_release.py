"""
Update the website after building a new version of the game.

  1. Copy the new OutOfContext.exe into the download/ folder
  2. Run:  python update_release.py --version 1.1.0
  3. Commit and push. The page, release.json and SHA256SUMS.txt now match the new file.
"""
import argparse, datetime, hashlib, json, os, re

HERE = os.path.dirname(os.path.abspath(__file__))

def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--file", default="download/OutOfContext.exe")
    ap.add_argument("--version", default=None, help="version shown on the site, e.g. 1.1.0")
    a = ap.parse_args()
    path = os.path.join(HERE, a.file)
    h = hashlib.sha256()
    with open(path, "rb") as f:
        for chunk in iter(lambda: f.read(1 << 20), b""):
            h.update(chunk)
    rel_path = os.path.join(HERE, "release.json")
    rel = json.load(open(rel_path, encoding="utf-8")) if os.path.exists(rel_path) else {}
    rel.update({
        "version": a.version or rel.get("version", "1.0.0"),
        "file": a.file.replace("\\", "/"),
        "name": os.path.basename(path),
        "size": os.path.getsize(path),
        "sha256": h.hexdigest().upper(),
        "date": datetime.date.today().isoformat(),
    })
    json.dump(rel, open(rel_path, "w", encoding="utf-8"), indent=2)
    with open(os.path.join(HERE, "SHA256SUMS.txt"), "w", encoding="utf-8", newline="\n") as f:
        f.write(rel["sha256"] + "  " + rel["name"] + "\n")
    # keep the copy baked into the page in sync (works even without JavaScript fetches)
    idx = os.path.join(HERE, "index.html")
    html = open(idx, encoding="utf-8").read()
    block = '<script id="release-data" type="application/json">' + json.dumps(rel) + "</script>"
    html = re.sub(r'<script id="release-data" type="application/json">.*?</script>', lambda m: block, html, flags=re.S)
    open(idx, "w", encoding="utf-8", newline="\n").write(html)
    print("Updated:", rel["name"], rel["version"], rel["size"], "bytes")
    print("SHA-256:", rel["sha256"])

if __name__ == "__main__":
    main()

# Out of Context

A single-player 3D rage platformer dressed up as a game show: twelve troll stages, two bosses, and a host who roasts every fall. Free for Windows 10 and 11.

**Website and download:** https://kebintong.github.io/out-of-context/ (GitHub Pages)

## Download and check the file

Download `OutOfContext.exe` from the website (or from `download/` in this repo), then check its SHA-256 checksum in PowerShell:

```powershell
Get-FileHash "$env:USERPROFILE\Downloads\OutOfContext.exe" -Algorithm SHA256
```

The result must match the checksum on the website and in [`SHA256SUMS.txt`](SHA256SUMS.txt).

## Publishing a new version

1. In Unity: **Out of Context > Build Single EXE** (creates `Builds/OutOfContext.exe`).
2. Copy that file into this repo's `download/` folder, replacing the old one.
3. Run `python update_release.py --version 1.1.0` (updates the page, `release.json` and `SHA256SUMS.txt`).
4. Commit and push. GitHub Pages updates the site within a minute or two.

## Credits

Made by Kevin Jheazer P. Villaro (Project Manager and Programmer), Angelo T. Sumarago (Audio Designer), Clark Kent Gomez (Senior Developer), Kian T. Berong (Model Animator), Samantha Ongue (Documentation Lead) and Josh Patrick Yecyec (QA Tester). A Game Dev 101 

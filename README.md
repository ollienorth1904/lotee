# lotee · Lotería del Horror Moderno 2.0

A browser version of the 54-card *Lotería del Horror Moderno 2.0* deck, a modern-horror remix of the traditional Mexican lotería.
It's a plain static site (HTML, CSS and vanilla JavaScript). It has no build step, no trackers and no external services, and it works offline once loaded.

## Modes
- **Play vs. rivals:** pick one of the 12 printed tablas (or a random one) and play against 1–5 computer rivals.
- **Pass & play:** 2–6 people share one phone or tablet. Each has their own tabla tab, and you can add computer rivals.
- **Caller mode (Modo Cantor):** for game nights with the printed tablas. Show a big card and its grito on a TV or laptop, with next, undo and auto-call controls. "Check a tabla" verifies a printed tabla (1–12) against the called cards.
- **La Baraja:** all 54 cards with their gritos, twists and stories.

## How to play
1. Choose the winning pattern: row, column, diagonal, four corners, center (centro) or full board (llena).
2. El Cantor draws a card, sings its grito and then calls its name. The voice uses your device's built-in speech.
3. If the card is on your tabla, tap it to drop a bean (frijol). Auto-mark is optional in Settings.
4. Complete the pattern and press **¡Lotería!** The claim is checked against the called cards. A false claim gives you a warning, and a second one puts you out for the round.

Keys: Space or → for the next card, ← to undo (caller mode), L to claim.

## Install on your phone
- **iPhone/iPad (Safari):** open the site, tap **Share**, then **Add to Home Screen**. It opens full-screen and works offline.
- **Android (Chrome):** open the site, tap the **⋮** menu, then **Install app** (or **Add to Home screen**).

Installing and offline play need the site to be served over **HTTPS** (GitHub Pages does this), or from `localhost`.

## Run it locally
```
python3 -m http.server 8080
```
Then open http://localhost:8080.

## Rebuilding assets (optional)
`tools/build_assets.py` regenerates the web images, icons, fonts and `data/cards.json` from the deck source. `tools/make_sw.py` regenerates the service worker's precache list. Run it after changing any file.

## Tests (optional)
`tests/test_game.py` (desktop Chromium: every pattern, false claims, AI wins, pass & play, caller mode, offline) and `tests/test_mobile.py` (iPhone 13 on WebKit, Pixel 7 on Chromium) use Python Playwright. Serve the folder, then run `python3 tests/test_game.py http://localhost:8080/`.

## License
The code is MIT (see `LICENSE`). The card art and deck text are not covered by the MIT license. Fonts: Alfa Slab One and Lato (OFL 1.1), Ultra (Apache 2.0). See `licenses/`.

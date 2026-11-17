# Café Fish Tank 🐠

A digital fish tank for an at-home café afternoon. Each guest draws a fish on a
laptop by the door, dresses it up with accessories, adds their name and a short
message, and it joins the tank on the kitchen monitor.

## Run it

You need [Node.js](https://nodejs.org) 18 or newer. No other installs.

```bash
npm start
```

Then open:

- **Drawing page** (laptop at the door): http://localhost:3000/
- **Tank page** (kitchen monitor): http://localhost:3000/tank.html

If the kitchen monitor is plugged into the same laptop, just open the tank page
in a second browser window and drag it onto that screen (press F11 for full
screen). If it's a different device on your Wi-Fi, use the
`http://<your-ip>:3000/tank.html` address printed when the server starts.

## Adding accessory photos

Drop images into `public/stickers/` and refresh the drawing page. That's it.

- **PNGs with the background removed** look best: they get a white die-cut
  edge that follows the shape, like a real sticker. (iPhone: long-press the
  object in a photo → Copy/Share to cut it out.)
- Ordinary photos (JPG) get a white printed-photo border instead.
- The file name becomes the label: `pearl-necklace.png` → "pearl necklace".
  Start names with numbers to set the order: `01-sunglasses.png`, `02-bow.png`.
- Until the folder has at least one image, built-in placeholder stickers are shown.

## Where fish are saved

Every fish is saved to the `data/` folder (`data/fish.json` plus one PNG per
fish), so refreshing a page or restarting the server loses nothing. To start a
fresh tank for a new event, stop the server and delete the `data/` folder.

## Progress

- [x] Drawing page: colour wheel + presets + rainbow, crayon / marker / spray /
      glitter brushes, size slider, eraser, undo, clear
- [x] Stencils to trace (classic, sardine, puffer, angelfish, goldfish, betta,
      shark, chubby) or none
- [x] Accessory stickers from photos (auto die-cut border): drag, resize, rotate, remove
- [x] Look: paper scraps on a dark wood desk with crayon doodles, sunlight through
      blinds, leaf shadow, film grain, bundled fonts
- [x] Realistic planted-tank scene (used in the "your fish is in" polaroid)
- [ ] Add the real accessory photos
- [x] Name + message, send to the tank, "next guest" reset
- [x] Server that saves fish to disk
- [ ] Tank page: animated underwater scene, swimming fish, name labels, speech bubbles
- [ ] Keepsake: snapshot / short recording of the full tank

## Files

- `server.js` — tiny no-dependency server and fish storage
- `public/index.html`, `draw.css`, `draw.js` — the drawing page
- `public/brushes.js` — the brush textures (crayon, marker, spray, glitter)
- `public/tank-scene.js`, `tank-scene.css` — the realistic aquarium (reused by the tank page)
- `public/stencils.js` — the fish outlines guests can trace (add more here)
- `public/stickers/` — accessory photos go here
- `public/stickers.js` — placeholder stickers used until photos are added
- `public/fonts/` — Instrument Serif, Space Grotesk, Space Mono (SIL Open Font License)
- `public/tank.html` — placeholder tank (lists every saved fish for now)

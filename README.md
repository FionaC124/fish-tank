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

## On the day

1. Run `npm start` on the laptop.
2. Laptop at the door: open **http://localhost:3000/**.
3. Kitchen monitor: open **http://localhost:3000/tank.html** (or the
   `http://<your-ip>:3000/tank.html` address the server prints, if the monitor
   is a different device on your Wi-Fi). Move the mouse and use the **⋯**
   button in the bottom-right corner → *full screen*.

New fish drop into the tank within a few seconds of being sent.

### Host menu (⋯, bottom-right of the tank, appears when the mouse moves)

- **full screen**: fills the monitor.
- **remove a fish…**: then click any fish to take it out (asks first).
- **save a snapshot** / **record 15 seconds**: the end-of-party keepsake. The
  browser asks which tab to share: pick the tank tab. Files go to your
  Downloads folder. These only work on the laptop that's running the server
  (i.e. the `localhost` address); browsers block screen capture on plain
  `http://<ip>` addresses.
- **show corner tag**: hides/shows the little "café fish tank" label.

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
- [x] Tank page: realistic scene, fish swim/turn/tilt/wiggle, name tags, speech
      bubbles, new fish drop in with a splash + "just dropped in!" note
- [x] Host menu: full screen, remove a fish, corner tag on/off
- [x] Keepsake: snapshot (PNG) and 15-second recording (MP4/WebM)

## Files

- `server.js` — tiny no-dependency server and fish storage
- `public/index.html`, `draw.css`, `draw.js` — the drawing page
- `public/brushes.js` — the brush textures (crayon, marker, spray, glitter)
- `public/tank-scene.js`, `tank-scene.css` — the realistic aquarium (reused by the tank page)
- `public/stencils.js` — the fish outlines guests can trace (add more here)
- `public/stickers/` — accessory photos go here
- `public/stickers.js` — placeholder stickers used until photos are added
- `public/fonts/` — Instrument Serif, Space Grotesk, Space Mono (SIL Open Font License)
- `public/tank.html`, `tank.css`, `tank.js` — the tank page for the kitchen monitor
- `public/fonts.css` — font setup shared by both pages

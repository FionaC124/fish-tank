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

## Where fish are saved

Every fish is saved to the `data/` folder (`data/fish.json` plus one PNG per
fish), so refreshing a page or restarting the server loses nothing. To start a
fresh tank for a new event, stop the server and delete the `data/` folder.

## Progress

- [x] Drawing page: colours, chunky brushes, eraser, undo, clear
- [x] Accessory stickers: drag, resize, rotate, remove
- [x] Name + message, send to the tank, "next guest" reset
- [x] Server that saves fish to disk
- [ ] Tank page: animated underwater scene, swimming fish, name labels, speech bubbles
- [ ] Keepsake: snapshot / short recording of the full tank

## Files

- `server.js` — tiny no-dependency server and fish storage
- `public/index.html`, `draw.css`, `draw.js` — the drawing page
- `public/stickers.js` — the accessory stickers (add your own here)
- `public/tank.html` — placeholder tank (lists every saved fish for now)

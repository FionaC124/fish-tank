# Café Fish Tank: how to run it

Guests draw a fish on the laptop by the door, and it swims in the tank on the
kitchen monitor a few seconds later. Everything runs on your own laptop: no
internet or accounts needed on the day.

---

## 1. One-time setup

1. **Install Node.js.** Go to **nodejs.org**, download the **LTS** version and
   install it like any other app.
2. **Get the project onto your laptop** (either way works):
   - **ZIP:** on github.com open `FionaC124/fish-tank`, switch the branch
     dropdown to `claude/gracious-albattani-brb4q6`, click **Code → Download
     ZIP**, then unzip it (e.g. into Downloads or Desktop).
   - **GitHub Desktop:** **File → Clone repository** → `fish-tank`, then switch
     to the `claude/gracious-albattani-brb4q6` branch.

---

## 2. Start it

1. Open **Terminal** (Mac) or **Command Prompt** (Windows).
2. Go into the project folder: type `cd ` (with a space), **drag the project
   folder into the window**, and press Enter.
   - Use the unzipped folder, not the `.zip` file.
   - Check you're in the right place: type `ls` (Mac) or `dir` (Windows).
     You should see `package.json`, `server.js` and `public`.
3. Type:

   ```
   npm start
   ```

You'll see:

```
🐠  Café Fish Tank is running!
   Drawing page (this laptop):  http://localhost:3000/
   Tank page (this laptop):     http://localhost:3000/tank.html
   Tank page (other devices):   http://192.168.x.x:3000/tank.html
```

**Leave that Terminal window open** for the whole party. Closing it, or
pressing **Ctrl+C**, stops the fish tank.

---

## 3. Set up the two screens

**At the door (the laptop):** open Chrome and go to **localhost:3000**. That's
the drawing page.

**In the kitchen**, pick one:

- **Monitor plugged into the same laptop** (simplest):
  1. Open a second Chrome window and go to **localhost:3000/tank.html**.
  2. Drag that window onto the monitor.
  3. Move the mouse, click **⋯** (bottom-right), then choose **full screen**.
- **A separate device on the same Wi-Fi** (smart TV, tablet, another laptop):
  open the "other devices" address that Terminal printed,
  e.g. `192.168.1.23:3000/tank.html`.
  If it won't load, allow Node.js through the laptop's firewall when asked, or
  use the plugged-in option instead.

---

## 4. During the party

- A guest draws a fish, picks a stencil and accessories, signs their name, and
  presses **drop it in the tank →**. It drops into the tank within a few seconds.
- Fish are saved in the `data` folder, so refreshing a page or restarting
  `npm start` loses nothing.

**Host menu on the tank:** move the mouse and click **⋯** in the bottom-right.

| Option | What it does |
| --- | --- |
| **full screen** | Fills the monitor |
| **remove a fish…** | Then click any fish to take it out (it asks first) |
| **save a snapshot** | Saves a picture of the tank to Downloads |
| **record 15 seconds** | Saves a short video of the tank to Downloads |

For the snapshot and recording, Chrome asks what to share: pick the **tank
tab**. These only work at the `localhost` address on the laptop itself, not at
the Wi-Fi `192.168…` address.

---

## 5. After the party

- Grab your keepsake (snapshot and/or recording) before you close anything.
- Stop the tank: click the Terminal window and press **Ctrl+C**.
- **Starting fresh for the next event:** delete the `data` folder inside the
  project folder.

---

## 6. Before the day: quick test

1. Run `npm start`, draw a fish or two, and check they show up on the monitor.
2. Try the host menu (full screen, snapshot).
3. Stop it with **Ctrl+C** and delete the `data` folder so the tank starts empty.

---

## Getting updates

1. Stop the running tank (**Ctrl+C** in its Terminal window).
2. Get the new version:
   - **ZIP:** download it again from the same branch and unzip it, then `cd`
     into the new folder.
   - **GitHub Desktop:** **Fetch origin**, then **Pull origin**.
3. Run `npm start` again.

---

## Adding accessory photos

Drop images into `public/stickers/` and refresh the drawing page.

- **PNGs with the background removed** look best: they get a white sticker
  edge that follows the shape. (iPhone: long-press the object in a photo →
  Copy/Share to cut it out.)
- Ordinary photos (JPG) get a white printed-photo border instead.
- The file name becomes the label: `pearl-necklace.png` → "pearl necklace".
  Start names with numbers to set the order: `01-sunglasses.png`.
- Until you add photos, placeholder stickers are shown.

---

## Troubleshooting

**`npm error enoent Could not read package.json`**
You're not inside the project folder. Do step 2 again: `cd `, drag the
project folder into Terminal, press Enter, check with `ls`, then `npm start`.

**`Port 3000 is already in use` (or `EADDRINUSE`)**
An old copy is still running in another Terminal window. Find it and press
**Ctrl+C**, or run this and then `npm start` again:

```
lsof -ti :3000 | xargs kill
```

**The page looks like an old version**
Make sure you started the new folder, then refresh the page (Cmd+R / Ctrl+R).

**The tank on another device won't load**
Both devices must be on the same Wi-Fi. Allow Node.js through the laptop's
firewall, or plug the monitor into the laptop instead.

**Snapshot or recording doesn't work**
Use Chrome at **localhost:3000/tank.html** on the laptop running the server,
and pick the tank tab when Chrome asks what to share.

**`npm: command not found`**
Node.js isn't installed (or Terminal was open before you installed it). Install
it from nodejs.org, then open a new Terminal window.

---

## No-install alternative: GitHub Codespaces

Runs the tank in the cloud instead of on your laptop (needs internet all
afternoon).

1. On github.com open the repo, switch to the `claude/gracious-albattani-brb4q6`
   branch, then **Code → Codespaces → Create codespace**.
2. In the terminal panel at the bottom, run `npm start`, then click **Open in
   Browser**. That's the drawing page.
3. In the **Ports** tab, right-click port 3000 → **Port visibility → Public**.
   Open the same address plus `/tank.html` on the kitchen screen.
4. Before the party, set **GitHub Settings → Codespaces → Default idle
   timeout** to the maximum (4 hours), otherwise it switches off after 30
   minutes without activity in the editor.

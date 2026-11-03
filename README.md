# Team Mixer Bingo

A phone-only icebreaker bingo card. There is no account, no roster, and no server. Each player's name and card stay in the browser on their phone.

**Live site:** https://thecreativezellie.github.io/TeamBingo/

Open that link on a phone, type your name, and you get a 6×6 card. Tap a square and type the name of someone you met who matches the topic. Each person can be used once. You cannot tag yourself. One full row (across) or column (down) is BINGO. Diagonals do not count. The bingo screen lists that line's names and topics so a host can check them.

The menu on the card can reset every tag or change the name saved on this phone.

## Edit the topics

Edit only `config.js`.

- `eventName` — title in the header. Changing it starts a fresh save slot, so phones treat it as a new event.
- `gridSize` — squares across and down. A card needs at least `gridSize × gridSize` topics (36 at the default of 6).
- `topics` — the icebreaker pool, about 60 prompts. Write them so only a few people on a team of about 60 will match (roughly 5–15%). Leave out easy prompts and anything about health, religion, politics, money, or other sensitive personal subjects. Keep each line short enough to fit in a phone square.

Each card is a shuffle of that pool, seeded by the event name and the player's name. The same person sees the same squares if they close the page and open it again. Push to `main` and GitHub Actions republishes the site. Pages has to be set to **GitHub Actions** once, under Settings → Pages → Build and deployment.

## QR code

`qr-code.png` points at the live site and is large enough for a presentation slide. To regenerate it:

```bash
pip install "qrcode[pil]"
python3 make-qr.py https://thecreativezellie.github.io/TeamBingo/
```

## Tests

```bash
npm install
npm test
```

The tests check that a duplicate name is rejected, your own name is rejected, one full row bingos, one full column bingos, and a diagonal does not.

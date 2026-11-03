const { chromium } = require("playwright-core");
const assert = require("assert");
const fs = require("fs");
const path = require("path");

const shotDir = process.env.SCREENSHOT_DIR || "/tmp/team-bingo-screenshots";
fs.mkdirSync(shotDir, { recursive: true });

const chromeCandidates = [
  "/usr/bin/google-chrome",
  "/usr/local/bin/google-chrome",
  "/usr/bin/chromium-browser",
  "/usr/bin/chromium"
];
const executablePath = chromeCandidates.find((p) => fs.existsSync(p));
if (!executablePath) {
  console.error("Chrome not found");
  process.exit(1);
}

const PLAYER = "Sam Rivera";

(async () => {
  const browser = await chromium.launch({
    executablePath,
    headless: true,
    args: ["--no-sandbox", "--disable-dev-shm-usage"]
  });
  const ctx = await browser.newContext({
    viewport: { width: 375, height: 667 },
    deviceScaleFactor: 2,
    isMobile: true,
    hasTouch: true
  });
  const page = await ctx.newPage();
  page.setDefaultTimeout(10000);
  page.on("dialog", (d) => d.accept());
  page.on("pageerror", (e) => {
    console.error("PAGE ERROR", e);
    process.exit(1);
  });

  const url = "file://" + path.join(__dirname, "index.html");
  await page.goto(url);

  const logic = await page.evaluate(() => {
    const L = BingoLogic;
    const C = BINGO_CONFIG;
    const N = C.gridSize;
    const player = "Sam Rivera";
    const out = {};
    out.noRoster = C.subTeams == null;
    out.topicCount = C.topics.length;
    out.uniqueTopics = new Set(C.topics.map((t) => String(t).trim()).filter(Boolean)).size;
    out.hasIkeaExact = C.topics.includes("Owns more than 5 IKEA products")
      && C.topics.includes("Been to 5 different IKEAs");
    out.ikeaCount = C.topics.filter((t) => /ikea|billy|frakta/i.test(t)).length;
    out.grid = N;

    const tags = { 0: "Avery Chen" };
    out.dupExact = L.tagError(player, tags, 1, "Avery Chen");
    out.dupCase = L.tagError(player, tags, 1, "  avery   CHEN ");
    out.selfExact = L.tagError(player, tags, 1, "Sam Rivera");
    out.selfCase = L.tagError(player, tags, 1, "  sam   rivera");
    out.selfOkOther = L.canTag(player, tags, 1, "Sam Lee");
    out.editSame = L.canTag(player, tags, 0, "  AVERY   chen ");
    out.fresh = L.canTag(player, tags, 1, "Blake Ortiz");
    out.empty = L.tagError(player, tags, 1, "   ");
    out.dupMessageUsesLogic = !L.canTag(player, tags, 1, "avery chen");

    const cardA = L.makeCard(C.topics, N, player, C.eventName);
    const cardA2 = L.makeCard(C.topics, N, "  sam   RIVERA ", C.eventName);
    const cardB = L.makeCard(C.topics, N, "Kai Nakamura", C.eventName);
    out.deterministic = JSON.stringify(cardA) === JSON.stringify(cardA2);
    out.differsByPlayer = JSON.stringify(cardA) !== JSON.stringify(cardB);
    out.unique = new Set(cardA).size === N * N;
    out.cardSize = cardA.length;

    const fill = (idxs) => Object.fromEntries(idxs.map((i, k) => [i, "P" + k]));
    out.linesToWin = C.linesToWin;
    out.row = L.lines(fill([12, 13, 14, 15, 16, 17]), N);
    out.col = L.lines(fill([2, 8, 14, 20, 26, 32]), N);
    out.diag = L.lines(fill([0, 7, 14, 21, 28, 35]), N).length;
    out.anti = L.lines(fill([5, 10, 15, 20, 25, 30]), N).length;
    out.bothDiags = L.lines(fill([0, 7, 14, 21, 28, 35, 5, 10, 15, 20, 25, 30]), N).length;
    out.fiveOfRow = L.lines(fill([0, 1, 2, 3, 4]), N).length;
    out.hardKept = [
      "Has been on TV or radio",
      "Has run a marathon",
      "Has met a celebrity",
      "Speaks 4+ languages",
      "Has lived in 3+ countries",
      "Has broken a bone doing a sport",
      "Has been on a plane for 12+ hours in one go",
      "Has eaten a bug",
      "Born in a different country than parents",
      "Has performed on stage",
      "Has assembled an IKEA wardrobe alone",
      "Has been to the IKEA in Älmhult"
    ].every((t) => C.topics.includes(t));
    out.easyGone = !C.topics.some((t) => /pet|coffee|spain|half marathon/i.test(t));
    out.emptyLines = L.lines({}, N).length;
    const all = {};
    for (let i = 0; i < N * N; i++) all[i] = "P" + i;
    const full = L.lines(all, N);
    out.fullCount = full.length;
    out.fullRows = full.filter((l) => l.type === "row").length;
    out.fullCols = full.filter((l) => l.type === "column").length;
    return out;
  });

  assert.equal(logic.noRoster, true);
  assert.equal(logic.grid, 6);
  assert.equal(logic.linesToWin, undefined);
  assert.ok(logic.topicCount >= 55 && logic.topicCount <= 65, "topic pool " + logic.topicCount);
  assert.equal(logic.uniqueTopics, logic.topicCount);
  assert.equal(logic.hardKept, true);
  assert.equal(logic.easyGone, true);
  assert.equal(logic.hasIkeaExact, true);
  assert.ok(logic.ikeaCount >= 10, "ikea topics " + logic.ikeaCount);
  assert.equal(logic.dupExact, "duplicate");
  assert.equal(logic.dupCase, "duplicate");
  assert.equal(logic.selfExact, "self");
  assert.equal(logic.selfCase, "self");
  assert.equal(logic.selfOkOther, true);
  assert.equal(logic.editSame, true);
  assert.equal(logic.fresh, true);
  assert.equal(logic.empty, "empty");
  assert.equal(logic.dupMessageUsesLogic, true);
  assert.equal(logic.deterministic, true);
  assert.equal(logic.differsByPlayer, true);
  assert.equal(logic.unique, true);
  assert.equal(logic.cardSize, 36);
  assert.equal(logic.row.length, 1, "one full row is bingo");
  assert.equal(logic.row[0].type, "row");
  assert.equal(logic.row[0].index, 2);
  assert.deepEqual(logic.row[0].cells, [12, 13, 14, 15, 16, 17]);
  assert.equal(logic.col.length, 1, "one full column is bingo");
  assert.equal(logic.col[0].type, "column");
  assert.equal(logic.col[0].index, 2);
  assert.deepEqual(logic.col[0].cells, [2, 8, 14, 20, 26, 32]);
  assert.equal(logic.diag, 0);
  assert.equal(logic.anti, 0);
  assert.equal(logic.bothDiags, 0);
  assert.equal(logic.fiveOfRow, 0);
  assert.equal(logic.emptyLines, 0);
  assert.equal(logic.fullCount, 12);
  assert.equal(logic.fullRows, 6);
  assert.equal(logic.fullCols, 6);
  console.log("Logic checks passed");

  const bodyText = await page.locator("body").innerText();
  assert.ok(!/sub team/i.test(bodyText), "sub team copy should be gone");
  assert.equal(await page.locator("#selfList").count(), 0);

  await page.screenshot({ path: path.join(shotDir, "screenshot_name_screen.png") });

  await page.click("#nameGo");
  assert.match(await page.textContent("#nameError"), /type your name/i);
  assert.ok(await page.isVisible("#nameScreen"));

  await page.fill("#nameInput", "  Sam   Rivera  ");
  await page.click("#nameGo");
  await page.waitForSelector("#cardView:not(.hidden)");
  assert.equal(await page.locator(".sq").count(), 36);
  assert.equal((await page.textContent("#subtitle")).trim(), "Sam Rivera");

  const layout = await page.evaluate(() => {
    const squares = [...document.querySelectorAll(".sq")];
    const rects = squares.map((sq) => sq.getBoundingClientRect());
    const grid = document.querySelector("#grid").getBoundingClientRect();
    const legend = document.querySelector("#legend").getBoundingClientRect();
    return {
      minSide: Math.min(...rects.map((r) => Math.min(r.width, r.height))),
      fontSize: parseFloat(getComputedStyle(squares[0]).fontSize),
      gridBottom: grid.bottom,
      legendBottom: legend.bottom,
      innerWidth: window.innerWidth,
      innerHeight: window.innerHeight,
      scrollWidth: document.documentElement.scrollWidth
    };
  });
  assert.equal(layout.innerWidth, 375);
  assert.ok(layout.minSide >= 44, "square side " + layout.minSide);
  assert.ok(layout.fontSize > 9, "font " + layout.fontSize);
  assert.ok(layout.gridBottom <= layout.innerHeight, "grid bottom " + layout.gridBottom);
  assert.ok(layout.legendBottom <= layout.innerHeight + 1, "legend bottom " + layout.legendBottom);
  assert.ok(layout.scrollWidth <= layout.innerWidth + 1, "scroll width " + layout.scrollWidth);
  console.log("Phone layout:", JSON.stringify(layout));

  const topicsBefore = await page.$$eval(".sq .t", (els) => els.map((e) => e.textContent));
  assert.equal(new Set(topicsBefore).size, 36);

  const clipped = await page.evaluate(() => {
    return [...document.querySelectorAll(".sq")].map((sq) => {
      const t = sq.querySelector(".t");
      return { topic: t.textContent, gap: t.scrollHeight - t.clientHeight };
    }).filter((x) => x.gap > 4);
  });
  assert.deepEqual(clipped, [], "topics clipped: " + JSON.stringify(clipped));
  await page.screenshot({ path: path.join(shotDir, "screenshot_card.png") });

  async function openSquare(i) {
    await page.click(`.sq[data-i="${i}"]`);
    await page.waitForSelector("#picker:not(.hidden)");
  }
  async function tag(i, name) {
    await openSquare(i);
    await page.fill("#tagInput", name);
    await page.click("#tagSave");
    await page.waitForSelector("#picker", { state: "hidden" });
  }
  async function expectRejected(i, name, pattern) {
    await openSquare(i);
    await page.fill("#tagInput", name);
    await page.click("#tagSave");
    const err = await page.textContent("#tagError");
    assert.match(err, pattern, `expected ${pattern} for "${name}", got "${err}"`);
    assert.ok(await page.isVisible("#picker"));
    await page.click("#pickerClose");
    await page.waitForSelector("#picker", { state: "hidden" });
  }

  await expectRejected(0, "Sam Rivera", /you/i);
  await expectRejected(0, "  SAM   rivera ", /you/i);
  assert.equal(await page.locator(".sq.done").count(), 0);

  await tag(0, "Avery Chen");
  assert.equal(await page.getAttribute('.sq[data-i="0"]', "data-tag"), "Avery Chen");
  await expectRejected(1, "avery chen", /already/i);
  await expectRejected(1, "  AVERY    CHEN ", /already/i);
  assert.equal(await page.locator('.sq[data-i="1"]').getAttribute("data-tag"), null);

  await openSquare(0);
  assert.equal(await page.inputValue("#tagInput"), "Avery Chen");
  await page.fill("#tagInput", "Riley Quinn");
  await page.click("#tagSave");
  await page.waitForSelector("#picker", { state: "hidden" });
  assert.equal(await page.getAttribute('.sq[data-i="0"]', "data-tag"), "Riley Quinn");
  await tag(1, "Avery Chen");
  assert.equal(await page.getAttribute('.sq[data-i="1"]', "data-tag"), "Avery Chen");

  await openSquare(1);
  await page.click("#untagBtn");
  await page.waitForSelector("#picker", { state: "hidden" });
  assert.equal(await page.locator('.sq[data-i="1"]').getAttribute("data-tag"), null);

  const diag = [7, 14, 21, 28, 35];
  let n = 0;
  for (const i of diag) await tag(i, `Guest ${++n} Okonkwo`);
  assert.equal(await page.locator(".sq.done").count(), 6);
  assert.equal(await page.locator(".sq.win").count(), 0);
  assert.ok(await page.isHidden("#win"), "diagonal must not trigger bingo");

  await page.reload();
  await page.waitForSelector("#cardView:not(.hidden)");
  const topicsAfter = await page.$$eval(".sq .t", (els) => els.map((e) => e.textContent));
  assert.deepEqual(topicsAfter, topicsBefore);
  assert.equal(await page.locator(".sq.done").count(), 6);
  assert.equal(await page.getAttribute('.sq[data-i="0"]', "data-tag"), "Riley Quinn");

  await page.screenshot({ path: path.join(shotDir, "screenshot_card_tagged.png") });

  const rowCells = [6, 7, 8, 9, 10, 11];
  const rowToFill = [6, 8, 9, 10, 11];
  for (const i of rowToFill.slice(0, -1)) await tag(i, `Guest ${++n} Okonkwo`);
  assert.ok(await page.isHidden("#win"), "one incomplete row is not bingo");
  const rowNames = {};
  for (const i of rowCells) {
    rowNames[i] = await page.getAttribute(`.sq[data-i="${i}"]`, "data-tag");
  }
  await tag(11, `Guest ${++n} Okonkwo`);
  rowNames[11] = await page.getAttribute('.sq[data-i="11"]', "data-tag");
  await page.waitForSelector("#win:not(.hidden)");
  const rowHeading = await page.textContent("#winLines h3");
  assert.match(rowHeading, /Row \d+ \(across\)/);
  assert.equal((await page.textContent("#winWho")).trim(), "Sam Rivera");
  const rowItems = await page.$$eval("#winLines li", (els) => els.map((e) => e.innerText));
  assert.equal(rowItems.length, 6);
  for (const i of rowCells) {
    assert.ok(rowItems.some((text) => text.includes(rowNames[i])), rowNames[i]);
    assert.ok(rowItems.some((text) => text.includes(topicsAfter[i])), topicsAfter[i]);
  }
  await page.waitForTimeout(700);
  await page.screenshot({ path: path.join(shotDir, "screenshot_bingo.png") });
  await page.click("#winClose");
  await page.evaluate(() => document.querySelectorAll(".confetti").forEach((c) => c.remove()));
  assert.equal(await page.locator(".sq.win").count(), 6);

  const colExtras = [2, 20, 26, 32];
  for (const i of colExtras.slice(0, -1)) await tag(i, `Guest ${++n} Okonkwo`);
  assert.ok(await page.isHidden("#win"));
  await tag(32, `Guest ${++n} Okonkwo`);
  await page.waitForSelector("#win:not(.hidden)");
  const headings = await page.$$eval("#winLines h3", (els) => els.map((e) => e.textContent));
  assert.match(headings[0], /Column \d+ \(down\)/);
  const colItems = await page.$$eval("#winLines .win-card:first-child li", (els) => els.length);
  assert.equal(colItems, 6);
  await page.click("#winClose");

  await page.click("#menuBtn");
  assert.match(await page.textContent("#menuWho"), /Sam Rivera/);
  await page.click("#changeName");
  await page.waitForSelector("#nameScreen:not(.hidden)");
  assert.equal(await page.inputValue("#nameInput"), "Sam Rivera");
  await page.click("#nameBack");
  await page.waitForSelector("#cardView:not(.hidden)");
  assert.ok(await page.locator(".sq.done").count() > 6);

  await page.click("#menuBtn");
  await page.click("#resetCard");
  await page.waitForTimeout(100);
  assert.equal(await page.locator(".sq.done").count(), 0);
  assert.ok(await page.isHidden("#showWin"));
  assert.ok(await page.isHidden("#win"));

  console.log("UI checks passed");
  console.log("Screenshots:", shotDir);
  await browser.close();
})().catch(async (err) => {
  console.error(err);
  process.exit(1);
});

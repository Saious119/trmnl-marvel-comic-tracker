const crypto = require("node:crypto");
const dayjs = require("dayjs");
const LocalizedFormat = require("dayjs/plugin/localizedFormat");
dayjs.extend(LocalizedFormat);
const express = require("express");
const app = express();
const fs = require("fs");
let series = require("./series.json");
const { cp } = require("node:fs");
require("dotenv").config();

const pubKey = process.env.MARVEL_PUB_KEY;
const privKey = process.env.MARVEL_PRIV_KEY;

var comicIdx = 0;

app.get("/data", (req, res) => {
  getSeriesArray().then((comics) => {
    if (comics.length > 0 && comics[comicIdx] != null) {
      var idxToSend = comicIdx;
      comicIdx = (comicIdx + 1) % comics.length;
      res.json(comics[idxToSend]);
    } else {
      res.json({ noComics: true });
    }
  });
});

app.listen(3000, () => {
  console.log("Server is running on http://localhost:3000");
});

/**
 *
 * @param {Number} id - Series ID
 * @param {String} name - Series Name
 * @param {String} dateDescriptor - Time window for comics, can be "lastWeek", "thisWeek", "nextWeek", or "thisMonth""
 * @returns the listing of comics if any, null otherwise
 */
async function getComics(id, name, dateDescriptor) {
  const ts = dayjs().unix().toString();
  const hash = crypto.hash("md5", ts + privKey + pubKey);

  const resp = await fetch(
    `https://gateway.marvel.com/v1/public/series/${id}/comics?ts=${ts}&apikey=${pubKey}&hash=${hash}&dateDescriptor=${dateDescriptor}`
  ).then((resp) => resp.json());
  if (resp.data.count > 0) {
    return resp.data.results[0];
  } else {
    console.error("No results this week for series: " + name);
    return null;
  }
}

async function getSeriesArray() {
  var comics = [];
  for (const s of series) {
    const comic = await getComics(s.id, s.name, "thisWeek");
    if (comic != null) {
      comic.onSaleDate = dayjs(
        comic.dates.find((date) => date.type === "onsaleDate").date
      ).format("LL");
      comics.push(comic);
    }
  }
  return comics;
}

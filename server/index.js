const crypto = require("node:crypto");
const dayjs = require("dayjs");
const LocalizedFormat = require("dayjs/plugin/localizedFormat");
dayjs.extend(LocalizedFormat);
const express = require("express");
const app = express();
const fs = require("fs");
//let series = require("./series.json");
const { cp } = require("node:fs");
const { Console } = require("node:console");
require("dotenv").config();

// const pubKey = process.env.MARVEL_PUB_KEY;
// const privKey = process.env.MARVEL_PRIV_KEY;

var comicIdx = 0;

app.use(express.json()); // Middleware to parse JSON bodies

app.post("/data", (req, res) => {
  const { pubKey, privKey } = req.query; // Extract query parameters
  const series = req.body; // Extract JSON body

  if (!pubKey || !privKey || !series) {
    Console.log("Missing required parameters or body");
    Console.log("pubKey:", pubKey);
    Console.log("privKey:", privKey);
    Console.log("Body:", series);
    console.log(pubKey, privKey, series);
    return res
      .status(400)
      .json({ error: "Missing required parameters or body" });
  }

  console.log("pubKey:", pubKey);
  console.log("privKey:", privKey);
  console.log("Body:", series);
  getSeriesArray(series).then((comics) => {
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
 * @param {String} dateDescriptor - Time window for comics, can be "lastWeek", "thisWeek", "nextWeek", or "thisMonth""
 * @param {String} pubKey - Public key for Marvel API
 * @param {String} privKey - Private key for Marvel API
 * @returns the listing of comics if any, null otherwise
 */
async function getComics(id, dateDescriptor, pubKey, privKey) {
  const ts = dayjs().unix().toString();
  const hash = crypto.hash("md5", ts + privKey + pubKey);

  console.log(pubKey);
  const resp = await fetch(
    `https://gateway.marvel.com/v1/public/series/${id}/comics?ts=${ts}&apikey=${pubKey}&hash=${hash}&dateDescriptor=${dateDescriptor}`
  ).then((resp) => resp.json());
  console.log(resp);
  if (resp.code !== 200) {
    console.error("Error fetching comics for series: " + id);
    return null;
  }
  if (resp.data.count > 0) {
    return resp.data.results[0];
  } else {
    console.error("No results this week for series: " + id);
    return null;
  }
}

async function getSeriesArray(series, pubKey, privKey) {
  var comics = [];
  for (const s of series) {
    const comic = await getComics(s.id, "thisWeek", pubKey, privKey);
    if (comic != null) {
      comic.onSaleDate = dayjs(
        comic.dates.find((date) => date.type === "onsaleDate").date
      ).format("LL");
      comics.push(comic);
    }
  }
  return comics;
}

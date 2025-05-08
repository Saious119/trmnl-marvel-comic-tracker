const crypto = require("node:crypto");
const fs = require("fs");
const dayjs = require("dayjs");
const LocalizedFormat = require("dayjs/plugin/localizedFormat");
dayjs.extend(LocalizedFormat);
const express = require("express");
const app = express();
const { Console } = require("node:console");

var comicIdx = 0;

try {
  const idxData = fs.readFileSync("comicIdx.txt", "utf8");
  comicIdx = parseInt(idxData, 10) || 0;
  console.log("Comic index loaded from file: " + comicIdx);
} catch (err) {
  console.error("Error reading comicIdx file, defaulting to 0:", err.message);
}

app.use(express.json()); // Middleware to parse JSON bodies

app.post("/data", (req, res) => {
  const { pubKey, privKey, seriesString } = req.query; // Extract query parameters
  const series = seriesString.split(","); // Extract into array of series IDs

  if (!pubKey || !privKey || !series) {
    Console.log("Missing required parameters or body");
    return res
      .status(400)
      .json({ error: "Missing required parameters or body" });
  }

  getSeriesArray(series, pubKey, privKey).then((comics) => {
    if (comics.length > 0 && comics[0] != null) {
      var idxToSend = comicIdx;
      console.log("Comic index to send: " + idxToSend);
      idxToSend = idxToSend % comics.length; //make sure the idx is within bounds
      comicIdx++;
      if (comicIdx > 2999) {
        comicIdx = 0; // Reset the index if it exceeds 1000 to prevent overflow
      }
      fs.writeFile("comicIdx.txt", comicIdx.toString(), (err) => {
        if (err) {
          console.error("Error writing comicIdx to file:", err.message);
        }
      }); // Save the updated index to the file for server restarts
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

  const resp = await fetch(
    `https://gateway.marvel.com/v1/public/series/${id}/comics?ts=${ts}&apikey=${pubKey}&hash=${hash}&dateDescriptor=${dateDescriptor}`
  ).then((resp) => resp.json());
  if (resp.code !== 200) {
    console.error("Error fetching comics for series: " + id);
    return null;
  }
  if (resp.data.count > 0) {
    console.log("Comics found for series: " + id);
    return resp.data.results[0];
  } else {
    console.log("No comics found for series: " + id);
    return null;
  }
}

/**
 *
 * @param {Number} series - List of series IDs
 * @param {String} pubKey - Public key for Marvel API
 * @param {String} privKey - Private key for Marvel API
 * @returns the listing of comics if any, null otherwise
 */
async function getSeriesArray(series, pubKey, privKey) {
  console.log("Fetching comics for series: " + series.join(", "));

  // Use Promise.all to process all series in parallel
  const comics = await Promise.all(
    series.map(async (s) => {
      const comic = await getComics(s, "thisWeek", pubKey, privKey);
      if (comic != null) {
        comic.onSaleDate = dayjs(
          comic.dates.find((date) => date.type === "onsaleDate").date
        ).format("LL");
        return comic;
      }
      return null; // Return null if no comic is found
    })
  );
  console.log("Comics fetched: " + comics.length);
  // Filter out any null values
  return comics.filter((comic) => comic !== null);
}

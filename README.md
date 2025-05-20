# trmnl-marvel-comic-tracker

<img src="docs/trmnl-badge-compatible-with-dark.svg" alt="TRMNL" width="200"/>

![Screenshot](docs/fullscreen_preview.png)

A Plugin for the TRMNL device that tracks Marvel Comic series by using the official [Marvel Comic API](https://developer.marvel.com/) (a free developer account is required to use the plugin).

## Setup For Use

### In `server/`

This application has one POST endpoint `/data` that takes 3 inputs

- `pubKey`: Public key from Marvel API dashboard
- `privKey`: Private key from Marvel API dashboard
- `series`: A comma deliminated list of series IDs (ex: 38806,38809,38865)

If you go to a series from this page: https://www.marvel.com/comics/series, the series ID will be in the URL.

Finally run `npm install`, and `node index.js`

## Starting The Preview

- cd into server/ and run `node index.js`
- in another terminal cd into the root folder of the project and run:

```
gem install trmnl_preview
trmnlp serve
```

## What If I Want To Remove A Series?

What if you want to remove a series but dont remember which ID goes to what series?
Well never fear I built a small API [HERE!](https://github.com/Saious119/marvel-series-id-translator)

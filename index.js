/**
 * Reads tickers CSV file and crawls similar tickers from Yahoo Finance
 * 
 * ex: node index.js tickers.csv [offset] [n_tickers]
 * output saved to a file named similar_tickers_[offset]_[n_tickers].csv
 * Each lines has the format: Ticker, SimilarTicker0, SimilarTicker1, SimilarTicker2, SimilarTicker3, SimilarTicker4, SimilarTicker5
 */

const fs = require('fs');
const args = process.argv.slice(2);
const puppeteer = require('puppeteer');

// First Argument: Tickers File
let filename = "";
if (args[0] === undefined) {
    throw new Error("Argument 1 Missing: Tickers filename is missing!");
} else {
    filename = args[0];
}

// Second Argument: Offset
let offset = "";
if (args[1] === undefined) {
    throw new Error("Argument 2 Missing: Offset is missing!");
} else {
    offset = parseInt(args[1], 10);
}

// Third Argument: N Tickers to read
let nTickers = "";
if (args[2] === undefined) {
    throw new Error("Argument 3 Missing: Number of tickers to processis missing!");
} else {
    nTickers = parseInt(args[2], 10);
}

const outputFileName = `similar_${filename.substring(0, filename.lastIndexOf("."))}_${offset}_${nTickers}.csv`;

fs.readFile(filename, {encoding: 'utf-8'}, function(err,data) {
  if (!err) {
      const tickers = data.split('\n')
                        .map(ticker => ticker.trim())
                        .filter((_, i) => i >= offset && i < nTickers + offset);
      (async () => {
        const browser = await puppeteer.launch();

        for (let i = 0; i < tickers.length; i++) {
          let similarTickers = await getSimilarTickers(browser, tickers[i]);
          // console.log(`Similar Tickers to ${tickers[i]} are ${similarTickers.join(', ')}`);
          let similarTickersStr = `${tickers[i]},${similarTickers.join(',')}`;

          // add a line to a lyric file, using appendFile
          fs.appendFile(outputFileName, `${similarTickersStr}\n`, (err) => {
            if (err) throw err;
          });
        }

        await browser.close();
      })();

  } else {
      console.log(err);
  }
});


// Reads similar tickers from App data in global context
async function getSimilarTickers(browser, ticker) {

  const page = await browser.newPage();
  const getTickerUrl = ticker => `https://finance.yahoo.com/quote/${ticker}?p=${ticker}`;

  console.log("here....");

  await page.goto(getTickerUrl(ticker));

  const similarTickers = await page.evaluate((ticker) => {
    const symbols = window.App.main.context.dispatcher.stores.RecommendationStore.recommendedSymbols[ticker]
    return symbols.map(symbols => symbols.symbol);
  }, ticker);

  return similarTickers;
}

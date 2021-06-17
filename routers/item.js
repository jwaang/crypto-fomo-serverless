const express = require("express");
const axios = require("axios");
const Item = require("../models/item");
const Crypto = require("../models/crypto");
const router = new express.Router();

// GET - Retrieves a random item from the database and calculates how much the crypto is worth now
router.get("/item/:ticker", async (req, res) => {
  try {
    // Find coin and their respective launch date
    const crypto = await Crypto.findOne({
      name: req.params.ticker,
    });
    if (!crypto) {
      res.status(400).send({ error: `Unable to find ${req.params.ticker} in our database.` });
    }
    // console.log(crypto);

    // Find items that were released after the coins launch date and get random one
    const randomItem = await Item.find({
      released: {
        $gte: crypto.launch_date,
      },
    })
      .exec()
      .then((arr) => {
        return arr[Math.floor(Math.random() * arr.length)];
      });
    if (!randomItem) {
      res.status(400).send({ error: `Unable to find items in database where the release date was greater than ${req.params.ticker}'s launch date.` });
    }
    // console.log(randomItem);

    // Fetch current crypto price from Nomics
    const currentPrice = await axios
      .get(`https://api.nomics.com/v1/currencies/ticker?key=${process.env.NOMICS_API_KEY}&ids=${req.params.ticker}`)
      .then((res) => {
        if (!res.data || res.data.length === 0) {
          res.status(400).send({ error: `Nomics was unable to retrieve the current price for, ${req.params.ticker}` });
        }
        return parseFloat(res.data[0].price);
      })
      .catch((err) => {
        console.log("Error fetching data from Nomics", err);
      });
    // console.log(currentPrice);

    // // Nomic's free plan allows only for 1 request/second 😔
    await sleep(1000);

    // Get historical price from launch date
    const dateSplit = randomItem.released.toISOString().split("T")[0];
    const timeFiller = "T00%3A00%3A00Z";
    const priceAtDate = await axios
      .get(
        `https://api.nomics.com/v1/currencies/sparkline?key=${process.env.NOMICS_API_KEY}&ids=${req.params.ticker}&start=${dateSplit}${timeFiller}&end=${dateSplit}${timeFiller}`
      )
      .then((res) => {
        if (!res.data || res.data.length === 0) {
          res.status(400).send({ error: `Nomics was unable to retrieve the historical price for, ${req.params.ticker}, on ${randomItem.released}` });
        }
        return res.data[0];
      })
      .catch((err) => {
        console.log("Error fetching data from Nomics", err);
      });
    // console.log(priceAtDate);

    // Calculate values and returned response
    const { prices } = priceAtDate;
    const totalCrypto = randomItem.price / parseFloat(prices[0]);
    const totalUSD = totalCrypto * currentPrice;

    res.send({
      ...randomItem._doc,
      cryptoName: req.params.ticker,
      currentPrice: parseFloat(currentPrice.toFixed(2)),
      totalCrypto: parseFloat(totalCrypto.toFixed(8)),
      totalUSD: parseFloat(totalUSD.toFixed(2)),
    });
  } catch (e) {
    res.status(500).send(e);
  }
});

// POST - Store new item(s) in the database
// Request parameter takes in a list
router.post("/item", async (req, res) => {
  try {
    const item = await Item.insertMany(req.body);
    res.status(201).send(item);
  } catch (e) {
    res.status(500).send(e);
  }
});

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

module.exports = router;

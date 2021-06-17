"use strict";
require("dotenv").config({ path: ".env.development" });
const express = require("express");
require("../db/mongoose");
const serverless = require("serverless-http");
const axios = require("axios");
const Item = require("../models/item");
const Crypto = require("../models/crypto");

const app = express();
const router = express.Router();

app.use(express.json());

app.use(function (req, res, next) {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
  next();
});

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

    res.json({
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

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

router.get("/another", (req, res) => res.json({ route: req.originalUrl }));
app.use("/.netlify/functions/server", router); // path must route to lambda

module.exports = app;
module.exports.handler = serverless(app);

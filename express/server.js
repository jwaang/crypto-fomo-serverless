const express = require("express");
require("../db/mongoose");
const serverless = require("serverless-http");
const cryptoRouter = require("../routers/crypto");
const itemRouter = require("../routers/item");

const app = express();
app.use(express.json());

app.use(function (req, res, next) {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
  next();
});

app.use("/.netlify/functions/server", cryptoRouter);
app.use("/.netlify/functions/server", itemRouter);

module.exports = app;
module.exports.handler = serverless(app);

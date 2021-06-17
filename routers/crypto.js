const express = require("express");
const Crypto = require("../models/crypto");
const router = new express.Router();

// POST - Store crypto name(s) as well as their initial launch date(s)
// Request parameter takes in a list
router.post("/crypto", async (req, res) => {
  try {
    const crypto = await Crypto.insertMany(req.body);
    res.status(201).send(crypto);
  } catch (e) {
    res.status(500).send(e);
  }
});

module.exports = router;

const mongoose = require("mongoose");

const cryptoSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },
    launch_date: {
      type: Date,
      required: true,
    },
  },
  {
    toJSON: {
      versionKey: false,
    },
  }
);

const Crypto = mongoose.model("Crypto", cryptoSchema);

module.exports = Crypto;

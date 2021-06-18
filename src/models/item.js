const mongoose = require("mongoose");

const itemSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },
    img_url: {
      type: String,
      require: true,
    },
    price: {
      type: Number,
      required: true,
    },
    released: {
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

const Item = mongoose.model("Item", itemSchema);

module.exports = Item;

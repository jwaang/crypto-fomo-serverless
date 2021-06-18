require("dotenv").config({
  path: `.env.${process.env.NODE_ENV}`,
});

const app = require("./express/server");

app.listen(`${process.env.PORT}`, () => console.log(`Local app listening on port ${process.env.PORT}!`));

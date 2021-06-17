const { builder } = require("@netlify/functions");

const handler = async (event, context) => {
  return {
    statusCode: 200,
    body: JSON.stringify({ message: "Hello World" }),
  };
};

exports.handler = builder(handler);

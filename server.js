const express = require("express");
require("dotenv").config();
const mongoose = require("mongoose");
const DB = process.env.MONGO_URI;
mongoose
  .connect(DB)
  .then(() => {
    console.log("Database connected successfully");
  })
  .catch((err) => {
    console.log("Error connecting database", err.message);
  });

const app = express();
const port = process.env.PORT;
app.listen(port, () => {
  console.log(`Server is listening on port: ${port}`);
});

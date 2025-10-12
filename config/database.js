const mongoose = require("mongoose")
require("dotenv").config()
const DB = process.env.MONGO_URI

mongoose.connect(DB)
.then(()=>{
  console.log("Database connected successfully")
})
.catch((err)=>{
  console.log("Error connecting database", err.message)
})
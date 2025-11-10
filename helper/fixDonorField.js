// fixDonorField.js
const mongoose = require("mongoose");
const Donation = require("../model/donationModel"); // adjust path as needed
require("dotenv").config();

(async () => {
  try {
    await mongoose.connect("mongodb+srv://channelsokunade_db_user:zN11LMwiITk1uqaY@traceaid.c0msyc1.mongodb.net/traceaid");
    console.log("Connected to MongoDB...");

    const result = await Donation.updateMany(
      { "donor._id": { $exists: true } },
      [{ $set: { donor: "$donor._id" } }]
    );

    console.log("Updated documents:", result.modifiedCount);
    console.log("Fix complete ✅");
    await mongoose.disconnect();
  } catch (error) {
    console.error("Error fixing donor field:", error);
  }
})();
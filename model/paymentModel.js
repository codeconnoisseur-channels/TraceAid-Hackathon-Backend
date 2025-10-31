const mongoose = require("mongoose");

const koraPaymentSchema = new mongoose.Schema(
  {
    donation: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Donation",
      required: true,
    },
    reference: {
      type: String,
      required: true,
    },
    transactionId: {
      type: String,
      required: true,
    },
    status: {
      type: String,
      enum: ["pending", "successful", "failed"],
      default: "pending",
    },
    rawResponse: { type: Object },
  },
  { timestamps: true }
);

module.exports = mongoose.model("KoraPayment", koraPaymentSchema);

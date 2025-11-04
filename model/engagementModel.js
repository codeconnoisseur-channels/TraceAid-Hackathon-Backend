const mongoose = require("mongoose");

const engagementSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
    },
    userType: {
      type: String,
      enum: ["Donor", "Fundraiser"],
      required: true,
    },
    actionType: {
      type: String,
      enum: ["like", "save", "share"],
      required: true,
    },
    campaign: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Campaign",
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

engagementSchema.index({ userId: 1, userType: 1, actionType: 1, campaign: 1 }, { unique: true });

const Engagement = mongoose.model("Engagement", engagementSchema);
module.exports = Engagement;

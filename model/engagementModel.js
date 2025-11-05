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
      // Now includes 'share'
      enum: ["like", "save", "share"],
      required: true,
    },
    campaign: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Campaign",
      required: true,
    },
    channel: {
      type: String,
      enum: ["X", "Facebook", "Instagram", "CopyLink"],
      required: function () {
        return this.actionType === "share";
      },
    },
    userCaption: {
      type: String,
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

engagementSchema.index(
  { userId: 1, actionType: 1, campaign: 1, userType: 1 },
  { unique: true, partialFilterExpression: { actionType: { $in: ["like", "save"] } } }
);

const Engagement = mongoose.model("Engagement", engagementSchema);
module.exports = Engagement;

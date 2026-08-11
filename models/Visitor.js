const mongoose = require("mongoose");

const visitorSchema = new mongoose.Schema(
  {
    ipAddress: String,
    country: String,
    countryCode: String,
    currency: String
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model("Visitor", visitorSchema);
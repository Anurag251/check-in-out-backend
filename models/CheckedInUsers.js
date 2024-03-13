const mongoose = require("mongoose");

const checkedInUserSchema = new mongoose.Schema({
  name: String,
  email: String,
  phoneNumber: String,
  clubName: String,
  qrScan: String,
  spouseQR: String,
  meals: [],
  checkedIn: Boolean,
  checkedInDate: String,
  checkedInTime: String,
  checkedOutTime: {
    type: String,
    default: null,
  },
});

module.exports = mongoose.model("CheckedInUsers", checkedInUserSchema);

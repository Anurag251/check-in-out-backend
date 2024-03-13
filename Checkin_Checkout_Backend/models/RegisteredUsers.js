const mongoose = require("mongoose");

const registeredUsersSchema = new mongoose.Schema({
  Name: String,
  Email: String,
  PhoneNumber: String,
  ClubName: String,
  QRScan: String,
  SpouseQR: String,
  "7March": String,
  "7March_1": String,
  "16March": String,
  "16March_1": String,
  "16March_2": String,
  "16March_3": String,
  "17March": String,
  "17March_1": String,
});

module.exports = mongoose.model("RegisteredUsers", registeredUsersSchema);

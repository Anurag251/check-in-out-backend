const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const checkinSchema = new Schema(
  {
    name: { type: String },
    email: { type: String },
    phone: { type: String },
    clubName: { type: String },
    qrScan: { type: String },
    spouseQr: { type: String },
    checkin: { type: String },
    checkout: { type: String },
    statue: { type: Boolean },
  },
  { timestamps: true }
);

const Checkin = mongoose.model("Checkin", checkinSchema);
module.exports = Checkin;

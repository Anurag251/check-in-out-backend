const mongoose = require("mongoose");

const registeredUsersSchema = new mongoose.Schema(
  {
    Name: String,
    Email: String,
    PhoneNumber: String,
    EventName: String,
    ClubName: String,
    Position: String,
    DistrictRole: String,
    RegistrationFee: String,
    PaymentStatus: String,
    SpouseName: String,
    SpousePhone: String,
    QRScan: String,
    SpouseQR: String,
  },
  { strict: false }
);

module.exports = mongoose.model("RegisteredUsers", registeredUsersSchema);

const mongoose = require("mongoose");
const rolesEnum = ["kitchen", "gatekeeper", "admin"];

const usersSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    email: { type: String },
    phone: { type: String },
    username: { type: String, required: true, index: true },
    password: { type: String, required: true },
    role: { type: String, required: true, enum: rolesEnum },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Users", usersSchema);

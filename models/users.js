const mongoose = require("mongoose");
const Schema = mongoose.Schema;
const rolesEnum = ['kitchen', 'gatekeeper','admin'];

const user = new Schema(
  {
    name: { type: String ,require:true},
    email: { type: String },
    phone: { type: String },
    username: { type: String ,require:true},
    password: { type: String ,require:true},
    role:{type:String,require:true,enum:rolesEnum}
  },
  { timestamps: true }
);

const Users = mongoose.model("users", user);
module.exports = Users;

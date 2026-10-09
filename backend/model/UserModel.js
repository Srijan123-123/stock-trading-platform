const mongoose = require("mongoose");

const UserSchema = new mongoose.Schema(
  {
    username: { type: String, required: true, trim: true, unique: true, lowercase: true },
    email: { type: String, required: true, trim: true, unique: true, lowercase: true },
    password: { type: String, required: true },
  },
  { timestamps: true },
);

const UserModel = mongoose.model("user", UserSchema);
module.exports = { UserModel };

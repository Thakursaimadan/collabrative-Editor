import mongoose from "mongoose";

const UserSchema = new mongoose.Schema({
  _id: String, 
  name: String,
  documents: [{ type: String, ref: "Document" }],
});

const User = mongoose.model("User", UserSchema);

export default User;
